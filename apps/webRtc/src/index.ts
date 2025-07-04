import * as http from 'http';
import * as mediasoup from 'mediasoup';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { CreateWorker } from './mediasoup/worker';
import { finalize } from './prepare-recording/finalize';
import { createWebRtcTransport} from './mediasoup/transport';

const PORT = 8080;
const server = http.createServer();

let workerPromise = CreateWorker();
let rooms: Record<string, Room> = {};
let peers: Record<string, Peer> = {};
let transports: TransportData[] = [];
let producers: ProducerData[] = [];
let consumers: ConsumerData[] = [];

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  }
});

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

type Room = {
  router: mediasoup.types.Router;
  peers: string[];
  screenShared: string;
  isRecording : boolean;
};

type Peer = {
  socket: Socket;
  roomId: string;
  transports: string[];
  producers: mediasoup.types.Producer[];
  consumers: string[];
  peerDetails: { name: string };
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
  appData: { kind: string };
};

type ConsumerData = {
  socketId: string;
  consumer: mediasoup.types.Consumer;
  roomId: string;
};

io.on('connect', async (socket: Socket) => {
  console.log('a new peer connected with socketId : ', socket.id);

  socket.emit('connection-success', { socketId: socket.id });

  const worker = await workerPromise;

  async function createRoom(roomId: string, socketId: string) {
    let room = rooms[roomId];
    if (room) {
      if (!room.peers.includes(socketId)) {
        room.peers.push(socketId);
      }
      console.log(`Room ${roomId} already exists. Added peer ${socketId}.`);
      return room.router;
    } else {
      socket.emit('admin');
      let router;
      try {
        router = await worker.createRouter({ mediaCodecs });
      } catch (e) {
        console.log('router not initialized for a room');
        return;
      }
      console.log('Router Id : ', router.id);
      rooms[roomId] = {
        router: router!,
        peers: [socketId],
        screenShared: '',
        isRecording: false,
      };
      return router;
    }
  }

  function addTransport(transport: any, roomId: string, consumer: boolean) {
    transports = [
      ...transports,
      { socketId: socket.id, transport, roomId, consumer, isConnected: false }
    ];
    peers[socket.id] = {
      socket,
      roomId,
      transports: [...(peers[socket.id]?.transports ?? []), transport.id],
      producers: peers[socket.id]?.producers ?? [],
      consumers: peers[socket.id]?.consumers ?? [],
      peerDetails: peers[socket.id]?.peerDetails ?? { name: '' },
    };
  }

  function addProducer(producer: mediasoup.types.Producer, roomId: string, appData: { kind: string }) {
    producers = [
      ...producers,
      { socketId: socket.id, producer, roomId, appData }
    ];
    peers[socket.id] = {
      socket,
      roomId,
      transports: peers[socket.id]?.transports ?? [],
      producers: [...(peers[socket.id]?.producers ?? []), producer],
      consumers: peers[socket.id]?.consumers ?? [],
      peerDetails: peers[socket.id]?.peerDetails ?? { name: '' },
    };
  }

  function addConsumer(consumer: mediasoup.types.Consumer, roomId: string) {
    consumers = [
      ...consumers,
      { socketId: socket.id, consumer, roomId }
    ];
    peers[socket.id] = {
      socket,
      roomId,
      transports: peers[socket.id]?.transports ?? [],
      producers: peers[socket.id]?.producers ?? [],
      consumers: [...(peers[socket.id]?.consumers ?? []), consumer.id],
      peerDetails: peers[socket.id]?.peerDetails ?? { name: '' },
    };
  }

  function getTransport(socketId: string) {
    const [producerTransport] = transports.filter(t => t.socketId === socketId && !t.consumer);
    return producerTransport;
  }

  function informConsumers(roomId: string, socketId: string, id: string) {
    console.log(`Just joined producerId: ${id} in room ${roomId} with socketId ${socketId}`);
    producers.forEach(producerData => {
      if (producerData.socketId !== socketId && producerData.roomId === roomId) {
        const producerPeer = peers[producerData.socketId];
        if (producerPeer && producerPeer.socket) {
          producerPeer.socket.emit('new-producer', { producerId: id });
        }
      }
    });
  }

  function removeItems(items: any, socketId: string, type: string) {
    interface ClosableItem { socketId: string; [key: string]: any; }
    (items as ClosableItem[]).forEach(item => {
      if (item.socketId === socketId) {
        (item[type] as { close: () => void }).close();
      }
    });
    return (items as any[]).filter(item => item.socketId !== socket.id);
  }

  socket.on('disconnect', async () => {
    console.log(`socket with id: ${socket.id} disconnected`);
    consumers = removeItems(consumers, socket.id, 'consumer');
    producers = removeItems(producers, socket.id, 'producer');
    transports = removeItems(transports, socket.id, 'transport');
    const peer = peers[socket.id];
    const roomId = peer ? peer.roomId : undefined;
    delete peers[socket.id];
    if (roomId && rooms[roomId]) {
      rooms[roomId] = {
        router: rooms[roomId].router,
        peers: rooms[roomId].peers.filter(id => id !== socket.id),
        screenShared: rooms[roomId].screenShared,
        isRecording:rooms[roomId].isRecording
      };
      const room = rooms[roomId];
      if (room && room.screenShared === socket.id) {
        socket.to(roomId).emit('stop-sharing');
        console.log('Stopped screen sharing for disconnected peer');
      }
      if (rooms[roomId].peers.length === 0) {
        await finalize(roomId);
        delete rooms[roomId];
      }
    }
  });

  socket.on('joinRoom', async ({ roomId }, callback) => {
    console.log(`socket with id: ${socket.id} joined room ${roomId}`);
    const router = await createRoom(roomId, socket.id);
    socket.join(roomId);
    peers[socket.id] = {
      socket,
      roomId,
      transports: [],
      producers: [],
      consumers: [],
      peerDetails: { name: '' },
    };
    const rtpCapabilities = router?.rtpCapabilities;
    callback(rtpCapabilities);
    const room = rooms[roomId];
    if (room) {
      socket.emit('self-screen-ack', { shared: room.screenShared });
      socket.emit('recording-ack', { isRecording: room.isRecording });
    }
  });

  socket.on('createWebRtcTransport', async ({ consumer }, callback) => {
    const roomId = peers[socket.id]?.roomId;
    if (!roomId || !rooms[roomId]) return;
    const router = rooms[roomId].router;
    createWebRtcTransport(router!).then(
      (transport: any) => {
        callback({
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
          }
        });
        addTransport(transport, roomId, consumer);
      },
      error => {
        console.error('Error creating transport:', error);
      }
    );
  });

  socket.on('transport-connect', ({ dtlsParameters }) => {
    console.log('request for connecting transport');
    const transportData = getTransport(socket.id);
    if (transportData && transportData.transport) {
      if (transportData.isConnected) {
        console.log('Transport already connected for socket:', socket.id);
        return;
      }
      transportData.transport.connect({ dtlsParameters }).then(() => {
        transportData.isConnected = true;
        console.log('Transport connected successfully for socket:', socket.id);
      }).catch(error => {
        console.error('Transport connect error:', error);
      });
    } else {
      console.error('Transport not found for socket:', socket.id);
    }
  });

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
    const existingIndex = peer.producers.findIndex(p => p === kind && p.appData?.kind === appData?.kind);
    if (existingIndex !== -1 && peer.producers[existingIndex]) {
      await peer.producers[existingIndex].close();
      peer.producers.splice(existingIndex, 1);
    }
    const producer = await transport.transport.produce({ kind, rtpParameters, appData });
    console.log('Producer ID:', producer.id);
    const { roomId } = peer;
    const room = rooms[roomId];
    if (!room) {
      console.error('Room not found:', roomId);
      return callback({ error: 'Room not found' });
    }
    addProducer(producer, roomId, appData);
    informConsumers(roomId, socket.id, producer.id);
    callback({ id: producer.id, producerExist: peer.producers.length > 1 });
  });

  socket.on('getProducers', callback => {
    const peer = peers[socket.id];
    let producerList: string[] = [];
    if (peer) {
      const { roomId } = peer;
      producers.forEach(producerData => {
        if (producerData.socketId !== socket.id && producerData.roomId === roomId) {
          producerList.push(producerData.producer.id);
        }
      });
    }
    callback(producerList);
  });

  socket.on('transport-recv-connect', async ({ dtlsParameters, serverConsumerTransportId }) => {
    console.log('request for connecting consumer transport & dtlsParameters');
    const consumerTransportData = transports.find(
      t => t.consumer && t.transport.id === serverConsumerTransportId
    );
    if (!consumerTransportData) {
      console.error('Consumer transport not found for id:', serverConsumerTransportId);
      return;
    }
    const consumertransport = consumerTransportData.transport;
    await consumertransport.connect({ dtlsParameters });
  });

  socket.on('consume', async ({ rtpCapabilities, remoteProducerId, serverConsumeTransportId }, callback) => {
    try {
      const peer = peers[socket.id];
      if (!peer) {
        return callback({ params: { error: 'Peer not found' } });
      }
      const { roomId } = peer;
      const room = rooms[roomId];
      if (!room) {
        return callback({ params: { error: 'Room not found' } });
      }
      const router = room.router;
      let consumerTransport = transports.find(
        t => t.consumer && t.transport.id === serverConsumeTransportId
      )?.transport;
      if (!consumerTransport) {
        return callback({ params: { error: 'Consumer transport not found' } });
      }
      if (router.canConsume({ producerId: remoteProducerId, rtpCapabilities })) {
        console.log('can consume');
        const producerToConsume = producers.find(p => p.producer.id === remoteProducerId);
        const consumer = await consumerTransport.consume({
          producerId: remoteProducerId,
          rtpCapabilities,
          paused: true,
          appData: producerToConsume?.appData
        });
        consumer.on('transportclose', () => {
          console.log('transport for this consumer closed');
        });
        consumer.on('producerclose', () => {
          console.log('producer for this consumer closed');
          socket.emit('producer-closed', { remoteProducerId });
          consumerTransport.close();
          transports = transports.filter(t => t.transport.id !== consumerTransport?.id);
          consumer.close();
          consumers = consumers.filter(c => c.consumer.id !== consumer.id);
        });
        addConsumer(consumer, roomId);
        const params = {
          id: consumer.id,
          producerId: remoteProducerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          serverConsumerId: consumer.id,
          appData: consumer.appData
        };
        callback({ params });
      } else console.log(`can't consume`);
    } catch (e) {
      console.log('error in consuming', e);
      callback({ params: { error: e } });
    }
  });

  socket.on('consumer-resume', async ({ serverConsumerId }) => {
    console.log('resume consumer');
    const consumerData = consumers.find(c => c.consumer.id === serverConsumerId);
    if (consumerData && consumerData.consumer) {
      await consumerData.consumer.resume();
    } else {
      console.error('Consumer not found for id:', serverConsumerId);
    }
  });

  socket.on('stop-sharing', () => {
    console.log('server reached for stop sharing');
    const producer = producers.find(p => p.socketId === socket.id);
    if (producer) {
      const room = rooms[producer.roomId];
      if (room) {
        room.screenShared = '';
        console.log('screen sharing false');
      }
      socket.to(producer.roomId).emit('stop-sharing');
    }
  });

  socket.on('resume-screen-share', ({ roomId, producerId }) => {
    const room = rooms[roomId];
    if (room) {
      room.screenShared = producerId;
      console.log('screen sharing true');
    }
    socket.to(roomId).emit('screen-shared', { producerId });
  });

  socket.on('limit-check', ({ roomId }) => {
    console.log(roomId);
    if (rooms[roomId]) {
      console.log('room exists:', rooms[roomId].peers.length);
      socket.emit('limit-ack', rooms[roomId].peers.length < 5);
    } else socket.emit('limit-ack', true);
  });

  socket.on('start-recording',(roomId,callback)=>{
    console.log('start recording request for roomId : ',roomId);
    socket.to(roomId).emit('start-recording');
    if (rooms[roomId]) rooms[roomId].isRecording = true;
    callback(true);    
  })

  socket.on('stop-recording',(roomId,callback)=>{
    console.log('stop recording request for roomId : ',roomId);
    socket.to(roomId).emit('stop-recording');
    if (rooms[roomId]) rooms[roomId].isRecording = false;
    callback(true);    
  })

});

server.listen(PORT, () => {
  console.log('server is listening on the PORT : 8080');
});