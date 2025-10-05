import * as http from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { CreateWorker } from './helpers/worker';
import { mediaCodecs } from './helpers/config';
import Room from './classes/room';
import Peer from './classes/peer';
import { createWebRtcTransport } from './helpers/transport';
import PortPool from './helpers/portpool';
import fs from 'fs';
import path from 'path';
import { initRedis } from './redis/main';
import { enqueueRoomJob } from './redis/queue';
import { createRedisWorker } from './redis/redis-worker';
import dotenv from "dotenv";
dotenv.config();

const CLIENT_URL=process.env.CLIENT_URL || 'http://localhost:3000/api/auth';
const app=express();
app.use(express.json());

const allowedOrigins = ['https://orbitron-three.vercel.app','https://orbitron.live', 'https://www.orbitron.live'];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); 
    if(allowedOrigins.includes(origin)){
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.options('*', cors());

const PORT = 8080;
const server: http.Server = http.createServer(app);
const workerPromise=CreateWorker();
export const roomMap : Record<string,Room>={}
const peerMap : Record<string,Peer>={}
const recordingMap : Record<string,boolean>={}
export const rtpPool=new PortPool();
export const roomIdUserIdMap : Record<string,Set<Socket>>={} 
initRedis();
createRedisWorker();

export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  }
}); 

const sdpDir=path.join('/webRtc','sdp');
if (!fs.existsSync(sdpDir)) {
    fs.mkdirSync(sdpDir, { recursive: true });
    console.log("Created recordings directory:", sdpDir);
}
const recordingDir=path.join('/webRtc','recordings');
if(!fs.existsSync(recordingDir)){
    fs.mkdirSync(recordingDir, { recursive: true });
    console.log("Created recordings directory:", recordingDir);
}
const finalClipsDir=path.join('/webRtc','final-recordings');
if(!fs.existsSync(finalClipsDir)){
    fs.mkdirSync(finalClipsDir, { recursive: true });
    console.log("Created recordings directory:", finalClipsDir);
}

async function cleanupPeer(socketId: string, roomId: string) {
  const room = roomMap[roomId];
  const peer = peerMap[socketId];
  if (!room || !peer) return;

  if(room.recording==1){
    await room.stopRecording(peer);
    if(peer.screen==true) await room.stopSharedScreenRecording();
  }

  if(peer.userId===room.host){
    const otherPeer=room.peers.filter((p : Peer)=>p.userId!==peer.userId);
    console.log('host is leaving room',roomId);
    if(otherPeer.length > 0 && otherPeer[0]) {
      console.log('another temp host found');
      room.host = otherPeer[0].userId;
      callNamespace.to(otherPeer[0].socketId).emit('host');
    }
  }

  console.log(`[server] cleaning up peer ${socketId} from room ${roomId}`);

  const name : string=peer.name;
  Object.values(peer.producers).forEach((producer) => {
    console.log('[producer] close producer with id ',producer?.id);
    if (producer) {
      try {
        producer.removeAllListeners();
        producer.close();
        callNamespace.to(roomId).emit('producer-closed', { producerId: producer.id });
      } catch {}
    }
  });

  peer.consumers.forEach((consumer) => {
    try {
      consumer.removeAllListeners();
      consumer.close();
    } catch {}
  });

  if (peer.upTransport) {
    try {
      peer.upTransport.removeAllListeners();
      peer.upTransport.close();
    } catch {}
  }
  if (peer.downTransport) {
    try {
      peer.downTransport.removeAllListeners();
      peer.downTransport.close();
    } catch {}
  }
 
  if (peer.screen) {
    peer.screen=false
    room.screen = '';
    callNamespace.to(roomId).emit("screen-share", { toggle: false });
  }
  room.peers=room.peers.filter(p=>peer.socketId!==p.socketId);
  callNamespace.to(roomId).emit("peer-left",{name});

  console.log(`[server] peer ${socketId} removed from room ${roomId}`);
  if (room.peers.length === 0) {
    if(room.recording==1) room.closePlainTransports();
    room.ended=true;
    const response = await fetch(`${CLIENT_URL}/mark-ended?roomId=${roomId}`, {
      method: "GET",
    });
    console.log(response);
    console.log("Acknowledgement from Next.js that call ended.");
    console.log(`[server] room ${roomId} is now empty, cleaning up`);
  }
}

const callNamespace = io.of('/call');

callNamespace.on('connect', async (socket: Socket) => {

    socket.on('join-room',async ({roomId,name,userId},callback)=>{
      const room=roomMap[roomId];
      socket.join(roomId);
      if(!room) return callback({error : 'room not found'})
      const peer : Peer=new Peer(name,socket.id,userId);
      room.peers.push(peer);
      if (room.orgHost === userId && room.host !== userId) {
        room.host = userId;
        socket.emit('host');
        socket.to(roomId).emit('not-host');
      } else if (room.peers.length === 1) {
        room.host = userId;
        socket.emit('host');
        socket.to(roomId).emit('not-host');
      } else if (room.host === userId) {
        socket.emit('host');
        socket.to(roomId).emit('not-host');
      }
      peerMap[socket.id]=peer;
      if(!room.router) return callback({error : 'router not exists for this room'})
      const producers=room.getProducers();
      console.log('*****Producers*****',producers);
      const peerCount=room.peers.length;
      console.log(peerCount);
      socket.to(roomId).emit('new-peer', { peers: peerCount-1});
      socket.to(roomId).emit('joined',{name : name});
      socket.emit('new-peer', { peers: peerCount-1 });
      if(room.recording==1){
        socket.emit('recording',{record : 1});
      } 
      if(room.screen!=''){
        console.log(room.screen)
        socket.emit('screen-noti',{name : room.screen});
      } 
      callback({routerRtpCapabilities : room.router.rtpCapabilities, producers : producers, shared : room.screen})
    })

    socket.on('create-transport',async ({roomId,direction},callback)=>{
        const room=roomMap[roomId];
        if(!room) return callback({error : 'room not found'})
        const peer=room.peers.find((peer : Peer)=>peer.socketId==socket.id);
        if(!peer) return callback({error : 'peer not found'})
        if(!room.router) return callback({error : 'room router not found'})
        const transport = await createWebRtcTransport(room.router);
        if(!transport){
            console.log('transport not received')
            return callback({error : 'error while creating transport'})
        } 
        console.log('transport received successfully')
        if (direction === 'send') {
            peer.upTransport = transport;
            console.log('up transport set successfully')
        } else if (direction === 'recv') {
            peer.downTransport = transport;
            console.log('down transport set successfully')
        }
        
        callback({
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
        });  
    })

    socket.on('connect-transport',async ({roomId,transportId,dtlsParameters},callback)=>{
      console.log('request on server to connect-transport');
        
      try{
            const room=roomMap[roomId];
            if(!room) return callback({error : 'room not found'})
            const transport=room.getTransportById(transportId);
            if(!transport) return callback({error : 'transport not found'})
            await transport.connect({ dtlsParameters });
            console.log(`transport connected successfully`)
            callback({ connected: true });
        }catch (err) {
            console.error('connect-transport error:', err);
            const errorMessage =
              typeof err === 'object' && err !== null && 'message' in err
                ? (err as { message: string }).message
                : String(err);
            callback({ error: errorMessage });
        }
    })

    socket.on('produce', async ({ roomId,transportId, kind, rtpParameters, appData }, callback) => {
      console.log('request to create producer');  
      const room=roomMap[roomId];
      if(!room) return callback({error : 'room not found'})
      const transport=room.getTransportById(transportId);
      if(!transport) return callback({error : 'transport not found'})
      const producer = await transport.produce({ kind, rtpParameters, appData });
      const peer=peerMap[socket.id];
      if(!peer){
        console.log('peer not found')
        return callback({error : 'peer not found'})
      }      
      if (appData.mediaTag === 'cam-video') {
        peer.producers.cam = producer;
        console.log('[producer] cam producer set : ', producer.id)
      }
      else if (appData.mediaTag === 'mic-audio') {
        peer.producers.mic = producer;
        console.log('[producer] mic producer set : ',producer.id)
      }
      else if (appData.mediaTag === 'screen-video') {
        peer.producers.screen = producer;
        console.log('[producer] shared screen producer set : ', producer.id)
      }
      else if (appData.mediaTag === 'screen-audio') {
        peer.producers.saudio = producer;
        console.log('[producer] shared screen audio producer set : ',producer.id)
      }

      if(room.recording==1 && peer.producers.mic && peer.producers.cam && !peer.videoPlainTransport && !peer.audioPlainTransport){
        console.log(`[----------start new peer stream recording-----------] Both mic and cam producers found`);
        await room.createPlainTransportsForPeer(peer);
      }
      
      console.log('producer created successfully');
      callback({ id: producer.id });
      
      socket.to(roomId).emit('new-producer', {
        producerId : producer.id,
        peerId: socket.id,
        kind,
        appData
      });
    });
    
    socket.on('consume', async ({ roomId, producerId, rtpCapabilities }, callback) => {
      console.log('[server] consume request', { roomId, producerId, socketId: socket.id });
      
      try {
        const room = roomMap[roomId];
        if (!room) {
          console.log('[server] consume failed: room not found', roomId);
          return callback({ error: 'room not found' });
        }
      
        const peer=room.peers.find(peer=>peer.socketId==socket.id);
        if (!peer) {
          console.log('[server] consume failed: peer not found', socket.id);
          return callback({ error: 'peer not found' });
        }
      
        const transport = peer.downTransport;
        if (!transport) {
          console.log('[server] consume failed: no recv transport for peer', socket.id);
          return callback({ error: 'no recv transport' });
        }
      
        const producerExists = room.getProducers().some(p => p?.id === producerId);
        if (!producerExists) {
          console.log('[server] consume failed: producer not found in room', producerId);
          return callback({ error: 'producer not found' });
        }
      
        if (!room.router?.canConsume({ producerId, rtpCapabilities })) {
          console.log('[server] consume failed: router cannot consume (rtpCapabilities mismatch)');
          return callback({ error: 'router cannot consume with given rtpCapabilities' });
        }
      
        const consumer = await transport.consume({
          producerId,
          rtpCapabilities,
          paused: true
        });
      
        peer.consumers.push(consumer);
      
        console.log('[server] consume success, returning consumer params', { consumerId: consumer.id });
        callback({
          id: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters
        });
      } catch (err) {
        console.error('[server] consume exception', err);
        callback({ error: err && (err as any).message ? (err as any).message : String(err) });
      }
    });

    socket.on('screen-share',async({roomId,toggle,name},callback)=>{
      const room=roomMap[roomId];
      if(room){
        const peer=peerMap[socket.id];
        if(toggle && peer){
          if(room.screen!=='') return callback({error : 'screen already shared by other peer'})
          room.screen=name;
          console.log('screen shared by ',name);
          peer.screen=toggle;
          if(room.recording==1){
            await room.startSharedScreenRecording(peer);
          }
        }
        else{
          room.screen='';
          if(room.recording==1 && peer){
            await room.stopSharedScreenRecording();
            peer.screen=toggle;
            peer.producers.screen?.close();
            peer.producers.saudio?.close();
            peer.producers.screen=null;
            peer.producers.saudio=null;
          } 
        }
        socket.emit('self-screen-ack',{status : toggle});
        socket.to(roomId).emit('screen-share',{toggle,name});
        if (callback) callback({ toggle });
      }
    })
      
    socket.on("resume-consumer", async ({ roomId, consumerId }) => {
      const room=roomMap[roomId];
      if(!room) return;
      const consumer = room.getConsumerById(consumerId);
      if (consumer) {
        await consumer.resume();  
      }
    });

    socket.on("disconnect",async () => {
      console.log('request to leave the room');
      const peer = peerMap[socket.id];
      if (!peer) return;
      const roomId = Object.keys(roomMap).find((rid) =>
        roomMap[rid]?.peers.includes(peer)
      );
      if (roomId) {
        await cleanupPeer(socket.id, roomId);
        if(roomMap[roomId]?.peers.length===0 && roomMap[roomId].recording!==0 && recordingMap[roomId]===false){
          recordingMap[roomId]=true;
          await enqueueRoomJob(roomId);
        }
      }
    });
    
    socket.on('chat',({roomId,name,time,msg,img} : {roomId : string,name : string,time : string,msg : string, img : string})=>{
      console.log('[server chat] : ',img);
      socket.to(roomId).emit('chat', { name, time, msg, img });
    })

    socket.on('recording',async ({roomId,record})=>{
      const room=roomMap[roomId];
      if(record && room){
        if(room.recording===0){
          await room.createPlainTransports();
          if(room.screen!==''){
            console.log('recording started and screen share by ',room.screen);
            const peer=room.peers.find((p : Peer)=>p.screen==true);
            if(peer) await room.startSharedScreenRecording(peer);
          }
          let recordingInterval: NodeJS.Timeout | null = null;
          recordingInterval=setInterval(async()=>{
            if(room.recording==1){
              socket.emit('recording',{record: 1});
              socket.to(roomId).emit('recording',{record: 1});
              clearInterval(recordingInterval!);
              recordingInterval = null; 
            }
          },1000);
        } 
        else if(room.recording===-1){
          socket.emit('recording',{error : 'not allowed to do multiple recording for same call'});
        }
      } 
      else{
        if(!room) return;
        await room.closePlainTransports();
        if(room.screen!=='') await room.stopSharedScreenRecording();
        let stopRecordingInterval: NodeJS.Timeout | null = null;
        stopRecordingInterval=setInterval(async()=>{
          if(room.recording==-1){
            socket.emit('recording',{record : 0});
            socket.to(roomId).emit('recording',{record : 0})
            clearInterval(stopRecordingInterval!);
            stopRecordingInterval = null;
          }
        },1000);
        if(room.recording!==0 && recordingMap[roomId]===false){
          recordingMap[roomId]=true;
          await enqueueRoomJob(roomId);
        }
      }
    })
})

server.listen(PORT, () => {
  console.log('server is listening on the PORT : 8080');
});

app.post('/create-call',async (req,res)=>{
    const {roomId , userId} : {roomId : string, userId : string }=req.body;
    const worker=await workerPromise;
    const router = await worker.createRouter({ mediaCodecs });
    if(router) console.log('router created successfully.')
    try{
        const room : Room= new Room(roomId,router, userId);
        roomMap[roomId]=room;
        recordingMap[roomId]=false;
        roomIdUserIdMap[roomId]=new Set();
        room.router=router;
        console.log('router set successfully')
        res.status(200).json({ message : 'room created successfully' });
    }
    catch(e){
        res.status(500).json({ message : 'error while creating room' });
    }
})

app.post('/join-call',async (req,res)=>{
    const {roomId} : {roomId : string}=req.body;
    try{
        const room=roomMap[roomId];
        if(room){
          if(room.ended){
            res.status(403).json({message : 'This call already ended.'})
          }
          else if(room.peers.length<5){
            res.status(200).json({ message : 'room joined successfully' });
          }
          else{
            res.status(400).json({ message : "peer limit in room already reached, you can't join"});
          }
        }
        else{
            res.status(404).json({ message : 'room not found' });
        } 
    }
    catch(e){
        res.status(500).json({ message : 'error while joining room' });
    }
})