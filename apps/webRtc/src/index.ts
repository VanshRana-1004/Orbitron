import * as fs from 'fs';
import * as path from 'path';
const tmpDir = path.join(__dirname, 'tmp');
const recordingsDir = path.join(__dirname, 'recordings');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log('Created tmp folder.');
}
if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
    console.log('Created recordings folder.');
}

import { spawn,ChildProcess  } from 'child_process';
import * as http from 'http';
import * as mediasoup from 'mediasoup';
import {Server as SocketIOServer,Socket} from 'socket.io'; 
import { CreateWorker } from './mediasoup/worker';
import { createWebRtcTransport } from './mediasoup/transport';
import { RtpParameters } from 'mediasoup/node/lib/rtpParametersTypes';
import dgram from 'dgram';

const PORT=8080;
const server=http.createServer();

const io=new SocketIOServer(server,{
    cors:{
        origin:"*",
    }
})

const mediaCodecs: mediasoup.types.RtpCodecCapability[] = [
    {
        kind: 'audio',
        mimeType: 'audio/opus', 
        clockRate: 48000,
        channels: 2
    },
    {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
            'x-google-start-bitrate': 1000,
        }
    }
];

let workerPromise=CreateWorker();

const MIN_PORT = 10000;
const MAX_PORT = 20000;
let usedPorts = new Set<number>();

interface ffmpegConsumersArr{
  kind: 'audio' | 'video',                
  rtpParameters: RtpParameters,  
  remoteRtpPort: number,
  remoteRtcpPort : number,
  producerId : string       
}

type Room = {
    router: mediasoup.types.Router;
    peers: string[];
    ffmpegTransport: mediasoup.types.PlainTransport;
    ffmpegConsumers : ffmpegConsumersArr[],
    ffmpegTransportConnected: boolean,
    screenShared : string,
    ffmpegProcess?: ChildProcess,
    ports:number[]
};

type Peer = {
    socket: Socket;
    roomId: string;
    transports: string[];
    producers: mediasoup.types.Producer[];
    consumers: string[];
    peerDetails: {
        name: string;
    };
};

type TransportData = {
    socketId: string;
    transport: mediasoup.types.WebRtcTransport;
    roomId: string;
    consumer: boolean;
    isConnected?: boolean;
};

type ProducerData = {
    socketId: string;
    producer: mediasoup.types.Producer;
    roomId: string;
    appData:{kind : string}
};

type ConsumerData = {
    socketId: string;
    consumer: mediasoup.types.Consumer;
    roomId: string;
};

let rooms: Record<string, Room> = {};
let peers: Record<string, Peer> = {};
let transports: TransportData[] = [];
let producers: ProducerData[] = [];
let consumers: ConsumerData[] = [];
const freePorts = new Set<number>();

io.on('connect', async (socket : Socket) => {
    console.log('a new peer connected with socketId : ', socket.id);

    socket.emit('connection-success',{socketId : socket.id})

    const worker = await workerPromise;

    function releaseProducerPorts(roomId: string, producerId: string) {
        const room = rooms[roomId];
        if (!room) return;

        const idx = room.ffmpegConsumers.findIndex(c => c.producerId === producerId);
        if (idx !== -1) {
            const consumer = room.ffmpegConsumers[idx];
            if(consumer){
                usedPorts.delete(consumer.remoteRtpPort);
                usedPorts.delete(consumer.remoteRtcpPort);
                freePorts.add(consumer.remoteRtpPort);
                freePorts.add(consumer.remoteRtcpPort);
                console.log(`Released ports ${consumer.remoteRtpPort}/${consumer.remoteRtcpPort} for producer ${producerId}`);
                room.ffmpegConsumers.splice(idx, 1);
            }
        }
    }   

    function checkAvailablePorts(roomId: string, numPorts: number): boolean {
        const requiredPorts = numPorts;
        const ports: number[] = [];

        for (let port = MIN_PORT; port <= MAX_PORT && ports.length < requiredPorts; port += 2) {
            if (!usedPorts.has(port) && !usedPorts.has(port + 1)) {
                usedPorts.add(port);
                usedPorts.add(port + 1);
                ports.push(port);
                ports.push(port + 1);
            }
        }

        if (ports.length !== requiredPorts) return false;
        
        if (rooms[roomId]){
            rooms[roomId].ports = ports;
            // generateSdpAndRecord(roomId);
        } 
        
        return true;
    }

    function releaseRoomPorts(roomId: string) {
        if(!rooms[roomId]){
            console.log(`room doesn't exists`);
            return;
        } 
        const consumers = rooms[roomId].ffmpegConsumers;
        for (const consumer of consumers) {
            usedPorts.delete(consumer.remoteRtpPort);
            usedPorts.delete(consumer.remoteRtcpPort);
        }
    }

    async function createRoom(roomId : string,socketId : string){
        let room = rooms[roomId];

        if (room) {
            if (!room.peers.includes(socketId)) {
                room.peers.push(socketId);
            }
            console.log(`Room ${roomId} already exists. Added peer ${socketId}. Using existing router and ffmpegTransport.`);
            return room.router; 
        }
        else{
            socket.emit('admin');
        }
        let router;
        let ffmpegTransport;
        let shared:string='';
        try{
            router = await worker.createRouter({mediaCodecs});
        }catch(e){
            console.log('router not initialize for a room');
            return;    
        }
        try{
            ffmpegTransport=await router.createPlainTransport({
            listenIp: {ip:'0.0.0.0',announcedIp:'127.0.0.1'},
                rtcpMux: false,
                comedia: true,
            });
        }catch(e){
            console.log('ffmpeg or plain tranport not initialize for a room');
            return;
        }            
        console.log('Router Id : ',router?.id);
        rooms[roomId] = { 
            router: router!, 
            peers: [socketId],
            ffmpegTransport: ffmpegTransport,
            ffmpegConsumers:[],
            ffmpegTransportConnected: false,
            screenShared:shared,
            ports:[]
        };
        const response=checkAvailablePorts(roomId,40);
        socket.to(roomId).emit('recording-ack',response);
        return router;
    }

    function addTransport(transport : any,roomId : string,consumer : boolean){
        transports=[
            ...transports,
            {socketId : socket.id,transport,roomId,consumer,isConnected:false}
        ]
        peers[socket.id]={
            ...peers[socket.id],
            socket: peers[socket.id]?.socket ?? socket,
            roomId: peers[socket.id]?.roomId ?? '',
            transports :[
                ...(peers[socket.id]?.transports ?? []),
                transport.id
            ],
            producers: peers[socket.id]?.producers ?? [],
            consumers: peers[socket.id]?.consumers ?? [],
            peerDetails: peers[socket.id]?.peerDetails ?? { name: '' }
        }
    }

    function addProducer(producer : mediasoup.types.Producer,roomId : string,appData : {kind : string}){
        producers=[
            ...producers,
            {socketId : socket.id,producer,roomId,appData},
        ]
        peers[socket.id]={
            socket: peers[socket.id]?.socket ?? socket,
            roomId: peers[socket.id]?.roomId ?? '',
            transports: peers[socket.id]?.transports ?? [],
            producers: [
                ...(peers[socket.id]?.producers ?? []),
                producer
            ],
            consumers: peers[socket.id]?.consumers ?? [],
            peerDetails: peers[socket.id]?.peerDetails ?? { name: '' }
        }
    }

    function addConsumer(consumer : mediasoup.types.Consumer,roomId : string){
        consumers=[
            ...consumers,
            {socketId: socket.id, consumer, roomId}
        ]
        peers[socket.id]={
            socket: peers[socket.id]?.socket ?? socket,
            roomId: peers[socket.id]?.roomId ?? '',
            transports: peers[socket.id]?.transports ?? [],
            producers: peers[socket.id]?.producers ?? [],
            consumers: [
                ...(peers[socket.id]?.consumers ?? []),
                consumer.id
            ],
            peerDetails: peers[socket.id]?.peerDetails ?? { name: '' }
        }
    }

    function getTransport(socketId : string){
        const [producerTransport]=transports.filter(transport=>transport.socketId===socketId && !transport.consumer);
        return producerTransport;
    }

    function informConsumers(roomId : string,socketId : string,id : string){
        console.log(`just joined producerId : ${id} in room ${roomId} with socketId ${socketId}`);
        producers.forEach(producerData=>{
            if(producerData.socketId!==socketId && producerData.roomId===roomId){
                const producerPeer = peers[producerData.socketId];
                if (producerPeer && producerPeer.socket) {
                    producerPeer.socket.emit('new-producer', { producerId: id });
                }
            }
        })
    }

    function removeItems(items : any,socketId : string,type : string){
        interface ClosableItem {
            socketId: string;
            [key: string]: any;
        }
        (items as ClosableItem[]).forEach((item: ClosableItem) => {
            if(item.socketId===socketId){
            (item[type] as { close: () => void }).close();
            }
        })
        items=items.filter((item: { socketId: string }) => item.socketId!==socket.id);
        return items;
    }

    socket.on('disconnect',async ()=>{
        console.log(`socket with id : ${socket.id} disconnected`)
        consumers=removeItems(consumers,socket.id,'consumer');
        producers=removeItems(producers,socket.id,'producer');
        transports=removeItems(transports,socket.id,'transport');
        const peer = peers[socket.id];
        const roomId = peer ? peer.roomId : undefined;
        delete peers[socket.id];
        
        if(roomId && rooms[roomId]){
            rooms[roomId]={
                router:rooms[roomId]?.router!,
                peers:rooms[roomId]?.peers.filter(socketId=>socketId!==socket.id)!,
                ffmpegTransport:rooms[roomId]?.ffmpegTransport,
                ffmpegConsumers:rooms[roomId]?.ffmpegConsumers,
                ffmpegTransportConnected : rooms[roomId]?.ffmpegTransportConnected,
                screenShared:rooms[roomId]?.screenShared,
                ports:rooms[roomId]?.ports
            }   
            const room=rooms[roomId];
            if(room){
                if(room.screenShared===socket.id){
                    socket.to(roomId).emit('stop-sharing');
                    console.log('screen shared by peer who way sharing screen before was stopped')
                }
            }  
            if(rooms[roomId].peers.length===0){
                console.log('room is now empty you can now generate sdp file');
                const room = rooms[roomId];

                if (room.ffmpegProcess) {
                    console.log(`Stopping FFmpeg recording for room ${roomId}`);
                    room.ffmpegProcess.kill('SIGINT'); // or 'SIGKILL' if FFmpeg doesn't stop
                }

                releaseRoomPorts(roomId);
                delete rooms[roomId];
            }
        }
    })

    socket.on('joinRoom',async ({roomId},callback)=>{
        console.log(`socket with id : ${socket.id} joined room ${roomId}`)
        const router=await createRoom(roomId,socket.id);
        socket.join(roomId);
        peers[socket.id]={
            socket,
            roomId,
            transports:[],
            producers:[],
            consumers:[],
            peerDetails:{
                name : ''
            }
        }
        const rtpCapabilities=router?.rtpCapabilities
        callback(rtpCapabilities);
        const room=rooms[roomId];
        if(room){
            console.log('joining room : ',room.screenShared);
            socket.emit('self-screen-ack',{shared : room.screenShared}) 
        } 
    })

    socket.on('createWebRtcTransport',async ({consumer},callback)=>{
        const roomId=peers[socket.id]?.roomId;
        if(!roomId || !rooms[roomId]) return;
        const router=rooms[roomId]?.router;
        createWebRtcTransport(router!).then(
            (transport : any)=>{
                callback({
                    params:{
                        id:transport.id,
                        iceParameters:transport.iceParameters,
                        iceCandidates:transport.iceCandidates,
                        dtlsParameters:transport.dtlsParameters
                    }
                })
                addTransport(transport,roomId,consumer)
            },
            error=>{
                console.error('Error creating transport:',error);
            }
        );
    })

    socket.on('transport-connect',({dtlsParameters})=>{
        console.log('request for connecting transport ');
        console.log('dtls parameters : ',dtlsParameters);
        const transportData = getTransport(socket.id);
        if (transportData && transportData.transport) {
            if (transportData.isConnected) {
                console.log('Transport already connected for socket:', socket.id);
                return;
            }

            transportData.transport.connect({dtlsParameters}).then(() => {
                transportData.isConnected = true;
                console.log('Transport connected successfully for socket:', socket.id);
            })
            .catch(error => {
                console.error('Transport connect error:', error);
            });
        } else {
            console.error('Transport not found for socket:', socket.id);
        }
    })

    socket.on('transport-produce', async ({ kind, rtpParameters, appData }, callback) => {
        console.log('request for producing');

        const transport = getTransport(socket.id);
        if (!transport || !transport.transport) {
            console.error('Producer transport not found for socket:', socket.id);
            return callback({ error: 'Producer transport not found' });
        }

        const peer = peers[socket.id];
        if (!peer) {
            console.error('Peer not found for socket:', socket.id);
            return callback({ error: 'Peer not found' });
        }

        const existingProducerIndex = peer.producers.findIndex(
            p => p === kind && p.appData?.mediaTag === appData?.mediaTag
        );
        if (existingProducerIndex !== -1 && peer.producers[existingProducerIndex]) {
            await peer.producers[existingProducerIndex].close();
            peer.producers.splice(existingProducerIndex, 1);
        }

        const producer = await transport.transport.produce({ kind, rtpParameters, appData });
        console.log('producer Id : ', producer.id);

        const { roomId } = peer;
        const room = rooms[roomId];
        if (!room) {
            console.error('Room not found:', roomId);
            return callback({ error: 'Room not found' });
        }

        let rtpPort: number | undefined, rtcpPort: number | undefined;
        const sortedFree = Array.from(freePorts).sort((a, b) => a - b);
        for (let i = 0; i < sortedFree.length - 1; i++) {
            const current = sortedFree[i];
            const next = sortedFree[i + 1];
            if (
                typeof current !== 'undefined' &&
                typeof next !== 'undefined' &&
                next === current + 1
            ) {
                rtpPort = current;
                rtcpPort = next;
                freePorts.delete(rtpPort);
                freePorts.delete(rtcpPort);
                break;
            }
        }

        if (rtpPort === undefined || rtcpPort === undefined) {
            const nextIndex = room.ffmpegConsumers.length * 2;
            if (nextIndex + 1 >= room.ports.length) {
                console.error('Port allocation limit reached');
                return callback({ error: 'Port allocation limit reached' });
            }
            rtpPort = room.ports[nextIndex];
            rtcpPort = room.ports[nextIndex + 1];
            if (typeof rtpPort === 'number') usedPorts.add(rtpPort);
            if (typeof rtcpPort === 'number') usedPorts.add(rtcpPort);
        }

        addProducer(producer, roomId, appData);
        informConsumers(roomId, socket.id, producer.id);

        if (typeof rtpPort !== 'number' || typeof rtcpPort !== 'number') {
            console.error('RTP/RTCP port is undefined');
            return callback({ error: 'RTP/RTCP port is undefined' });
        }
        room.ffmpegConsumers.push({
            kind,
            rtpParameters: producer.rtpParameters,
            remoteRtpPort: rtpPort,
            remoteRtcpPort: rtcpPort,
            producerId: producer.id
        });

        producer.on('@close', () => {
            releaseProducerPorts(roomId, producer.id);
        });

        console.log(`Assigned ports ${rtpPort}/${rtcpPort} for producer ${producer.id}`);
        callback({ id: producer.id, producerExist: producers.length > 1 });
    });

    socket.on('getProducers',callback=>{
        const peer = peers[socket.id];
        let producerList : string[] = [];
        if (peer) {
            const { roomId } = peer;
            producers.forEach(producerData => {
                if (producerData.socketId !== socket.id && producerData.roomId === roomId) {
                    producerList = [...producerList, producerData.producer.id];
                }
            });
        }
        callback(producerList);
    })

    socket.on('transport-recv-connect',async ({dtlsParameters,serverConsumerTransportId})=>{
        console.log('request for connecting consumer transport & dtlsParameters');
        const consumerTransportData = transports.find(
            transportData => transportData.consumer && transportData.transport.id == serverConsumerTransportId
        );
        if (!consumerTransportData) {
            console.error('Consumer transport not found for id:', serverConsumerTransportId);
            return;
        }
        const consumertransport = consumerTransportData.transport;
        await consumertransport.connect({ dtlsParameters }); 
    })

    socket.on('consume',async({rtpCapabilities,remoteProducerId,serverConsumeTransportId},callback)=>{
        try{    
            const peer = peers[socket.id];
            if (!peer) {
                callback({ params: { error: 'Peer not found' } });
                return;
            }
            const { roomId } = peer;
            const room = rooms[roomId];
            if (!room) {
                callback({ params: { error: 'Room not found' } });
                return;
            }
            const router = room.router;
            let consumerTransport = transports.find(transportData => (
                transportData.consumer && transportData.transport.id === serverConsumeTransportId
            ))?.transport;
            console.log('request to consume');
            console.log(`producer Id : ${remoteProducerId}`);
            if (!consumerTransport) {
                callback({ params: { error: 'Consumer transport not found' } });
                return;
            }
            if(router.canConsume({producerId:remoteProducerId,rtpCapabilities})){
                console.log('can consume');
                const producerToConsume = producers.find(p => p.producer.id === remoteProducerId);
                
                const consumer=await consumerTransport.consume({
                    producerId:remoteProducerId,
                    rtpCapabilities,
                    paused:true,
                    appData:producerToConsume?.appData
                })
                consumer.on('transportclose',()=>{
                    console.log('transport for this consumer closed');
                })
                consumer.on('producerclose',()=>{
                    console.log('producer for this consumer closed');
                    socket.emit('producer-closed',{remoteProducerId})
                    consumerTransport?.close()
                    transports=transports.filter(transportData=>transportData.transport.id!==consumerTransport?.id)
                    consumer.close();
                    consumers=consumers.filter(consumerData=>consumerData.consumer.id!==consumer.id)
                })

                addConsumer(consumer,roomId);
                const params={
                    id:consumer.id,
                    producerId:remoteProducerId,
                    kind:consumer.kind,
                    rtpParameters:consumer.rtpParameters,
                    serverConsumerId:consumer.id,
                    appData:consumer.appData,
                }
                callback({params});
            }
            else console.log(`can't consume`)
        }catch(e){
            console.log('error in consuming',e);
            callback({
                params:{
                    error : e
                }
            })
        }

    })

    socket.on('consumer-resume',async({serverConsumerId})=>{
        console.log('resume consumer');
        const consumerData = consumers.find(consumerData => consumerData.consumer.id === serverConsumerId);
        if (consumerData && consumerData.consumer) {
            await consumerData.consumer.resume();
        } else {
            console.error('Consumer not found for id:', serverConsumerId);
        }
    })

    socket.on('stop-sharing',()=>{
        console.log('server reached for stop sharing');
        const producer=producers.find(producer=>producer.socketId===socket.id);
        if(producer){
            const room=rooms[producer.roomId];
            if(room){
                room.screenShared='';
                console.log('screen sharing false : ',false);
            } 
            socket.to(producer.roomId).emit('stop-sharing');
        }     
    })

    socket.on('resume-screen-share', ({roomId,producerId}) => {
        const room=rooms[roomId];
        if(room){
            room.screenShared=producerId;
            console.log('screen sharing true : ',true);
        } 
        socket.to(roomId).emit('screen-shared',{producerId});
    });

    socket.on('limit-check',({roomId})=>{
        console.log(roomId);
        if(rooms[roomId]){
            console.log('room exists : ',rooms[roomId].peers.length);
            if(rooms[roomId].peers.length>=5){
                socket.emit('limit-ack',false);
            }else{
                socket.emit('limit-ack',true);
            }
        }
        else socket.emit('limit-ack',true);
    })

})

server.listen(PORT,()=>{
    console.log('server is listening on the PORT : 8080');
}) 