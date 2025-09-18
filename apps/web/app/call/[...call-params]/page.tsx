'use client';
import { useState, useRef, useEffect } from "react";
import { useRouter,redirect } from "next/navigation";
import { io } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import axios from "axios";
import { AppData, Producer, RtpCapabilities, RtpParameters, Transport } from 'mediasoup-client/types';
import { useUserInfo } from "app/store/user-info";
const SERVER_URL = 'http://localhost:8080';

export default function Call() {  const localStreamRef=useRef<MediaStream>(null);
  const {info,setInfo}=useUserInfo();
  const sharedScreenRef=useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = [
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null)
  ]; 
  const remoteStreams = useRef<Map<string, MediaStream>>(new Map());  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);  
  const router=useRouter();
  const sendTransportRef=useRef<Transport>(null);
  const recvTransportRef=useRef<Transport>(null);
  const deviceRef=useRef<Device>(null);
  const camProducerRef=useRef<Producer>(null);
  const micProducerRef=useRef<Producer>(null);
  const screenProducerRef=useRef<Producer>(null);
  const saudioProducerRef=useRef<Producer>(null);
  const consumedProducerIdsRef = useRef<Set<string>>(new Set());
  const [peers,setPeers]=useState<number>(0);
  const [cam,setCam]=useState<boolean>(true);
  const [mic,setMic]=useState<boolean>(true);
  const [screen,setScreen]=useState<boolean>(false);
  const [sharedScreen,setSharedScreen]=useState<boolean>(false);
  const [hideClips,setHideClips]=useState<boolean>(false);
  const [chat,setChat]=useState<boolean>(false);
  const msgRef=useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef(io(SERVER_URL, { autoConnect: false }));
  interface chat{
    name : string,
    time : string,
    msg : string,
    me : boolean
  }
  const [newPeer,setNewPeer]=useState<string>(''); 
  const [chatArr, setChatArr] = useState<chat[]>([]);
  const [peerNoti,setPeerNoti]=useState<boolean>(false);
  const [screenPeer,setScreenPeer]=useState<string>('')
  const [leftNoti,setLeftNoti]=useState<boolean>(false);
  const [leftPeer,setLeftPeer]=useState<string>('');
  const [host,setHost]=useState<boolean>(false);
  const [isRecording,setIsRecording]=useState<boolean>(false);

  const nameRef=useRef<string>("");
  const userIdRef=useRef<string>("");
  const callNameRef=useRef<string>("");
  const callIdRef=useRef<string>("");
  
  useEffect(()=>{
    async function getInfo(){
      await axios.get('/api/auth/me').then((response)=>{
        console.log(response.data);
      }).catch((e)=>{
        console.error("Error fetching user info:", e);
        redirect('/login');
      })
    } 
    getInfo();        
  },[])

  useEffect(() => {
    socketRef.current.connect();
    return () => {socketRef.current.disconnect()};
  }, []);  
  
  useEffect(()=>{
    const url=window.location.pathname;
    const segments=url.split('/');
    const callName=segments[2];
    const callId=segments[3];
    if(callName) callNameRef.current=callName;
    if(callId) callIdRef.current=callId;
    const userName=info.firstName+' '+info.lastName;
    const userId=info.id;
    if(userName) nameRef.current=userName;
    if(userId) userIdRef.current=userId;
    
    const socket=socketRef.current;
    
    joinRoom();let timeout: ReturnType<typeof setTimeout> | undefined;
    let timeout1:  ReturnType<typeof setTimeout> | undefined;
    const newPeerHandler = ({ peers } : { peers: number}) => setPeers(peers);
    const peerLeaveHandler = ({name} : {name : string}) => {
      setPeers(p => p - 1);
      setLeftPeer(name);
      setLeftNoti(true);
      timeout1=setTimeout(()=>{setLeftNoti(false)},2000);
    }
    const newProducerHandler = async ({ producerId, peerId, kind, appData } : {producerId : string, peerId : string, kind : 'video' | 'audio', appData : AppData}) => {
      if (peerId === socket.id) return;
      await createConsumer(producerId, deviceRef.current,appData);
    };
    const sharedScreenHandler=({toggle,name}:{toggle : boolean, name : string})=>{
      setSharedScreen(toggle)
      setScreenPeer(name)
    } 
    const chatHandler=({name,time,msg} : {name : string, time : string, msg : string})=>setChatArr(prev=>[...prev,{name,time,msg,me:false}]);
    const handleJoin=({name} : {name : string})=>{
      setNewPeer(name);
      setPeerNoti(true);
      timeout=setTimeout(()=>{setPeerNoti(false)},2000);
    }
    const handleScreenNoti=({name} : {name : string})=>setScreenPeer(name);
    const producerClosedHandler = ({ producerId }: { producerId: string }) => {
      if (consumedProducerIdsRef.current.has(producerId)) {
          consumedProducerIdsRef.current.delete(producerId);
          remoteStreams.current.delete(producerId);
          assignRemoteStreams(); 
          console.log(`Consumer for producerId ${producerId} closed.`);
      }
    };
    const handlehost=()=>setHost(true);
    const handleNotHost=()=>setHost(false);
    const recordingHandler=( res : {error? : string,record? : number})=>{
      if(res.error) alert(res.error);
      else if(res.record===0){
        setIsRecording(false);
      }
      else if(res.record===1){
        setIsRecording(true);
      } 
    }

    socket.on('new-peer', newPeerHandler);
    socket.on('peer-left', peerLeaveHandler);
    socket.on('new-producer', newProducerHandler);
    socket.on('screen-share',sharedScreenHandler);
    socket.on('chat',chatHandler);
    socket.on('joined',handleJoin);
    socket.on('screen-noti',handleScreenNoti);
    socket.on('producer-closed', producerClosedHandler);
    socket.on('host',handlehost);
    socket.on('not-host',handleNotHost);
    socket.on('recording',recordingHandler);

    return () => {
      socket.off('new-peer', newPeerHandler);
      socket.off('peer-left', peerLeaveHandler);
      socket.off('new-producer', newProducerHandler);
      socket.off('screen-share',sharedScreenHandler);
      socket.off('chat',chatHandler);
      socket.off('screen-noti',handleScreenNoti);
      socket.off('producer-closed', producerClosedHandler);
      socket.off('host',handlehost);
      socket.off('not-host',handleNotHost);
      socket.off('recording',recordingHandler);
      clearTimeout(timeout);
      clearTimeout(timeout1);
      socket.disconnect();
    };  
  },[]);    
  
  function createSilentAudioTrack() {
    const ctx = new AudioContext();
    const dst = ctx.createMediaStreamDestination();
    const oscillator = ctx.createOscillator();
    oscillator.connect(dst);
    oscillator.frequency.value = 0.0001;
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.05);
    return dst.stream.getAudioTracks()[0];
  } 

  function createBlankVideoTrack(width = 1280, height = 720, fps = 30) {
    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    function draw() {
      if(ctx){
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        requestAnimationFrame(draw);
      }
    }
    draw();

    const stream = canvas.captureStream(fps);
    return stream.getVideoTracks()[0];
  }

  async function createTransports(device : Device){
    const socket=socketRef.current;
    const roomId=callIdRef.current;
    const upTransport = await socket.emitWithAck('create-transport', {
      roomId,
      direction: 'send'
    });
    console.log('uptransport created successfully');

    const sendTransport=device.createSendTransport({
      id: upTransport.id,
      iceParameters: upTransport.iceParameters,
      iceCandidates: upTransport.iceCandidates,
      dtlsParameters: upTransport.dtlsParameters,
    });
    console.log('sendtransport created successfully');

    const downTransport = await socket.emitWithAck('create-transport', {
      roomId,
      direction: 'recv'
    });
    console.log('uptransport created successfully');

    const recvTransport=device.createRecvTransport({
      id: downTransport.id,
      iceParameters: downTransport.iceParameters,
      iceCandidates: downTransport.iceCandidates,
      dtlsParameters: downTransport.dtlsParameters,
    });
    console.log('recvtransport created successfully');

    sendTransport.on('connect', async ({ dtlsParameters }, callback) => {
      try {
        await socket.emitWithAck('connect-transport', {
          roomId,
          transportId: sendTransport.id,
          dtlsParameters
        });
        console.log('transport connected successfully');
        callback();
      } catch (err) {
        console.log(err);
      }
    });

    sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback) => {
      try {
        console.log('sending request to create producer')
        const { id: producerId } = await socket.emitWithAck('produce', {
          roomId,
          transportId: sendTransport.id,
          kind,
          rtpParameters,
          appData
        });
        callback({ id: producerId });
        console.log('producer created successfully')
      } catch (error) {
        console.error(error);
      }
    });

    recvTransport.on('connect', async ({ dtlsParameters }, callback) => {
      try {
        await socket.emitWithAck('connect-transport', {
          roomId,
          transportId: recvTransport.id,
          dtlsParameters
        });
        callback();
      } catch (err) {
        console.log(err);
      }
    });

    sendTransportRef.current=sendTransport;
    recvTransportRef.current=recvTransport;  
  }   
    
  function assignRemoteStreams() {
      const streams = Array.from(remoteStreams.current.values());
      remoteVideoRefs.forEach((ref, index) => {
        if (ref.current) {
          ref.current.srcObject = streams[index] || null;
          if (streams[index]) ref.current.play().catch(() => console.debug('play blocked'));
        }
      });
  }  

  async function createConsumer(producerId: string, device: Device | null, appData : AppData) {
    if (!device) return;if (consumedProducerIdsRef.current.has(producerId)) return;
    consumedProducerIdsRef.current.add(producerId);

    const socket = socketRef.current;
    await socket.emit('consume', {
      roomId: callIdRef.current,
      producerId,
      rtpCapabilities: device.rtpCapabilities
    }, async (res: { error?: string, id: string, producerId: string, kind: 'video' | 'audio', rtpParameters: RtpParameters }) => {
      if (res.error) return;

      const recvTransport = recvTransportRef.current;
      if (!recvTransport) return;

      const consumer = await recvTransport.consume({
        id: res.id,
        producerId: res.producerId,
        kind: res.kind,
        rtpParameters: res.rtpParameters
      });

      if (res.kind === 'video') {
        const stream = new MediaStream();
        stream.addTrack(consumer.track);
        if(appData.mediaTag=='screen-video'){
          if (sharedScreenRef.current) {
            sharedScreenRef.current.srcObject = stream;
          }
        }
        else{
          remoteStreams.current.set(producerId, stream);
          assignRemoteStreams();
        }
        socket.emit('resume-consumer', { roomId : callIdRef.current, consumerId: consumer.id });
      } else if (res.kind === 'audio') {
        const audioEl = document.createElement('audio');
        audioEl.autoplay = true;
        audioEl.srcObject = new MediaStream([consumer.track]);
        audioEl.play().catch(() => console.debug('audio play blocked'));
        document.body.appendChild(audioEl); 
        socket.emit('resume-consumer', { roomId : callIdRef.current, consumerId: consumer.id }); 
      }

      consumer.on('transportclose', () => {
        consumedProducerIdsRef.current.delete(producerId);
        remoteStreams.current.delete(producerId);
        assignRemoteStreams();
      });
    });  
  }  
  
  async function joinRoom(){
        const socket=socketRef.current;
        socket.emit('join-room',{roomId : callIdRef.current, name : nameRef.current, userId : userIdRef.current},async (res : {error? : string,routerRtpCapabilities : RtpCapabilities, producers : Producer[], shared : boolean})=>{
          if(res.error){
            alert('error while joining room');
            router.push('/');
          }
          const { routerRtpCapabilities, producers, shared}=res;
          setSharedScreen(shared);
          console.log('------producers------',producers);
          const device=new Device();
          console.log('device created successfully');
          console.log(routerRtpCapabilities);
          await device.load({ routerRtpCapabilities });
          console.log('device loaded successfully');      
          deviceRef.current=device;
          console.log('request to create transport');
          await createTransports(device);  for (const producerInfo of producers) {
        const producerId=producerInfo.id;
        const appData : AppData=producerInfo.appData;
        await createConsumer(producerId, device, appData);
      }

      const localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: {ideal : 1920}, height: {ideal : 1080}, frameRate: {ideal: 60}, facingMode: "user"},
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true}
      });
      const localVideoTrack = localStream.getVideoTracks()[0];
      if (localVideoTrack) {
        await localVideoTrack.applyConstraints({
          width: 1920,
          height: 1080,
          frameRate: {ideal: 60}
        }).catch(err => console.warn("applyConstraints failed:", err));
      }
      console.log("Local video settings:", localVideoTrack?.getSettings());
      if (localStream && localVideoRef.current && sendTransportRef.current) {
        localStreamRef.current = localStream;
        localVideoRef.current.srcObject = localStream;
        setStreaming(true);

        micProducerRef.current=await sendTransportRef.current.produce({
          track: localStream.getAudioTracks()[0],
          appData: { mediaTag: 'mic-audio' },
          codecOptions: {
            opusMaxPlaybackRate: 48000, 
          },
          encodings: [
            {
              maxBitrate: 128000        
            }
          ]
        });

        camProducerRef.current=await sendTransportRef.current.produce({
          track: localStream.getVideoTracks()[0],
           encodings: [
            {
              maxBitrate: 1500_000, 
              maxFramerate: 60
            }
          ],
          codecOptions: { videoGoogleStartBitrate: 1200 },
          appData: { mediaTag: 'cam-video' },
        });
      
      }
    })  
  }  
    
  async function handleStream() {
    if (streaming) {
      setStreaming(false);
      const camTrack = createBlankVideoTrack();
      const micTrack = createSilentAudioTrack();
      if (camProducerRef.current && camTrack) {
        await camProducerRef.current.replaceTrack({ track: camTrack });
      }
      if (micProducerRef.current && micTrack) {
        await micProducerRef.current.replaceTrack({ track: micTrack });
      }
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      return;
    }
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: {ideal : 1920}, height: {ideal : 1080}, frameRate: {ideal: 60} },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true}
    });
    const localVideoTrack = localStream.getVideoTracks()[0];
    if (localVideoTrack) {
      await localVideoTrack.applyConstraints({
        width: 1920,
        height: 1080,
        frameRate: {ideal : 60}
      }).catch(err => console.warn("applyConstraints failed:", err));
    }
    console.log("Local video settings:", localVideoTrack?.getSettings());
    if (localStream && localVideoRef.current) {
      localStreamRef.current=localStream;
      localVideoRef.current.srcObject = localStream;
      setStreaming(true);

        const camTrack = localStream.getVideoTracks()[0];
        const micTrack = localStream.getAudioTracks()[0];

        if (camProducerRef.current && camTrack) {
          await camProducerRef.current.replaceTrack({ track: camTrack, });
        }
        if (micProducerRef.current && micTrack) {
          await micProducerRef.current.replaceTrack({ track: micTrack });
        }
    } 
  }  
      
  async function toggleCam() {
      const camProducer = camProducerRef.current;
      if (!camProducer) return;
      if (cam) { 
        localStreamRef.current?.getVideoTracks().forEach(track => track.stop());
        const blankTrack = createBlankVideoTrack();
        if(blankTrack) await camProducer.replaceTrack({ track: blankTrack });
        if (blankTrack && localVideoRef.current) {
          localVideoRef.current.srcObject = new MediaStream([blankTrack]);
        }
        localStreamRef.current = null;
      } 
      else { 
        const newCamStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1920, height: 1080, frameRate: { min: 30, ideal: 60 }, facingMode: "user"}
        });
        const localVideoTrack = newCamStream.getVideoTracks()[0];
        if (localVideoTrack) {
          await localVideoTrack.applyConstraints({
            width: 1920,
            height: 1080,
            frameRate: 60
          }).catch(err => console.warn("applyConstraints failed:", err));
        }
        console.log("Local video settings:", localVideoTrack?.getSettings());
        const newCamTrack = newCamStream.getVideoTracks()[0];
        if(newCamTrack) await camProducer.replaceTrack({ track: newCamTrack });
        if (localVideoRef.current && newCamTrack) {
          localVideoRef.current.srcObject = new MediaStream([newCamTrack]);
        }
        localStreamRef.current = newCamStream;
    }

    setCam(!cam);  
  }  

  async function toggleMic() {
      const micProducer = micProducerRef.current;
      if (!micProducer) return;if (mic) { 
        localStreamRef.current?.getAudioTracks().forEach(track => track.stop());
        const silentTrack = createSilentAudioTrack();
        if(silentTrack) await micProducer.replaceTrack({ track: silentTrack });
      } else {
        const newMicTrack = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true}
        })
          .then(s => s.getAudioTracks()[0]);
        if(newMicTrack) await micProducer.replaceTrack({ track: newMicTrack });
      }

      setMic(!mic); 
  } 

  async function handleShareScreen() {
    const sendTransport = sendTransportRef.current;
    if (screen) {
      if (screenProducerRef.current) {
        screenProducerRef.current.close();
        screenProducerRef.current = null;
      }
      if (saudioProducerRef.current) {
        saudioProducerRef.current.close();
        saudioProducerRef.current = null;
      }
      
      socketRef.current.emit('screen-share', { roomId: callIdRef.current, toggle: false, name : nameRef.current },(res : {error? : string,toggle : boolean})=>{});
      setScreen(false);
      return;
    }

    try {
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: {ideal : 1920}, height: {ideal : 1080}, frameRate: {ideal: 60,max :60} },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      if (screenVideoTrack) {
        await screenVideoTrack.applyConstraints({
          width: 1920,
          height: 1080,
          frameRate: {ideal: 60,max : 60 },
        }).catch(err => console.warn("applyConstraints failed:", err));
      }  
      if (!sendTransport) {
        console.warn('Send transport not available.');
        screenStream.getTracks().forEach(track => track.stop());
        return;
      }
      // to handle run time error when peer just cancel or deny from sharing screen
      const camTrack = screenStream.getVideoTracks()[0];
      let micTrack = screenStream.getAudioTracks()[0];
      if (!micTrack) {
        micTrack = createSilentAudioTrack();
        console.log("No screen audio found, using dummy silent track");
      }

      if (micTrack) {
        const screenAudioProducer = await sendTransport.produce({
          track: micTrack,
          appData: { mediaTag: 'screen-audio' },
          codecOptions: {
            opusMaxPlaybackRate: 48000, 
          },
          encodings: [
            {
              maxBitrate: 128000        
            }
          ]
        });
        saudioProducerRef.current = screenAudioProducer;
        screenAudioProducer.on('trackended', () => handleShareScreen());
      }

      if (camTrack) {
        const screenVideoProducer = await sendTransport.produce({
          track: camTrack,
          encodings: [
            {
              maxBitrate: 1500_000, 
              maxFramerate: 60
            }
          ],
          codecOptions: { videoGoogleStartBitrate: 1200 },
          appData: { mediaTag: 'screen-video' },
        });
        screenProducerRef.current = screenVideoProducer;
        screenVideoProducer.on('trackended', () => handleShareScreen());
      }

      socketRef.current.emit('screen-share', { roomId: callIdRef.current, toggle: true, name : nameRef.current },(res : {error? : string,toggle : boolean})=>{
        if(res.error) alert(res.error);
        else setScreen(true);
      });
      
    } catch (err) {
      if (err instanceof Error) {
        console.warn('Screen sharing not started:', err.message);
      } else {
        console.warn('Screen sharing not started:', err);
      }
      alert('Screen sharing canceled or failed.');
    }

  }  

  function leaveRoom() {
      if(streaming) handleStream();
      if(screen) handleShareScreen();
      const socket = socketRef.current;
      socket.disconnect();  
      router.push('/dashboard');
  }  
  
  function formatTime(timestamp: number | string) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
  }  
  
  async function sendChat(){
    const socket=socketRef.current;
    if(socket && msgRef.current){
        const msg : string=msgRef.current.value;
        const time=formatTime(Date.now());
        msgRef.current.value='';
        if(msg.length>0){
          setChatArr(prev=>[...prev,{name : nameRef.current,time,msg,me:true}]);
          await socket.emit('chat', {roomId : callIdRef.current,name : nameRef.current,time,msg});
        }
    }
  }  
  
  async function handleRecording(){
    if(isRecording) socketRef.current.emit('recording',{roomId : callIdRef.current, record : false});
    else{
      socketRef.current.emit('recording',{roomId : callIdRef.current, record : true});
      await axios.post('/api/auth/recording', {
        callId : callIdRef.current
      }).then((res)=>{
        console.log('set to db as well');
      })
    } 
  }  
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatArr]);  
  
  return (
    <div className="h-screen w-screen relative">   
    
      {peerNoti && <div className="z-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-solid border-white/[.145] rounded-xl text-center px-3 py-1 text-sm text-regular text-white bg-black">{`${newPeer} joined`}</div>}
    
      {leftNoti && <div className="z-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[30px] border border-solid border-white/[.145] rounded-xl text-center px-3 py-1 text-sm text-regular text-white bg-black">{`${leftPeer} leaved`}</div>}

      {sharedScreen && <div className="z-50 absolute top-5 left-5 border border-solid border-white/[.145] rounded-xl text-center px-3 py-1 text-sm text-regular text-white bg-black">{`${screenPeer} representing`}</div>}
      
      <video autoPlay playsInline muted ref={localVideoRef} className={` ${peers>0 ? 'z-20 w-64 h-36 absolute top-5 right-5' : 'w-full h-full'} border border-solid border-white/[.145] rounded object-center ${sharedScreen && hideClips && 'h-0 w-0 hidden'}`}/>  

      <video autoPlay playsInline muted ref={sharedScreenRef} className={` w-full h-full border border-solid border-white/[.145] rounded object-center ${!sharedScreen && 'h-0 w-0 hidden'}` }/>  

      <div className={`flex ${sharedScreen && hideClips && "h-0 hidden"} ${sharedScreen && !hideClips && "fixed bottom-5 left-5 flex gap-5 items-center h-36"} ${!sharedScreen && peers > 0 && "w-full h-full relative"} ${peers === 0 && "h-0 w-0 hidden"}`}>
        <video ref={remoteVideoRefs[0]} autoPlay playsInline muted={false}
          className={`border border-white/[.145] object-contain rounded-lg 
            ${sharedScreen && !hideClips && "h-36 w-64"}
            ${!sharedScreen && peers==1 && 'h-full w-full absolute top-0 left-0'}
            ${!sharedScreen && peers==2 && 'h-full w-1/2 absolute top-0 left-0'}
            ${!sharedScreen && peers>=3 && 'h-1/2 w-1/2 absolute top-0 left-0'}
          `}/>
        <video ref={remoteVideoRefs[1]} autoPlay playsInline muted={false}
          className={`border border-white/[.145] object-contain rounded-lg
            ${peers <= 1 ? "hidden" : ""}
            ${sharedScreen && !hideClips && "h-36 w-64" }
            ${!sharedScreen && peers==2 && 'h-full w-1/2 absolute top-0 right-0'}
            ${!sharedScreen && peers>=3 && 'h-1/2 w-1/2 absolute top-0 right-0'}
          `}/>
        <video ref={remoteVideoRefs[2]} autoPlay playsInline muted={false}
          className={`border border-white/[.145] object-contain rounded-lg
            ${peers < 3 ? "hidden" : ""}
            ${sharedScreen && !hideClips && "h-36 w-64"}
            ${!sharedScreen && peers==3 && 'h-1/2 w-1/2 absolute bottom-0 left-1/2 -translate-x-1/2'}
            ${!sharedScreen && peers==4 && 'h-1/2 w-1/2 absolute bottom-0 left-0'}
          `}/>
        <video ref={remoteVideoRefs[3]} autoPlay playsInline muted={false}
          className={`border border-white/[.145] object-contain rounded-lg
            ${peers < 4 ? "hidden" : ""}
            ${sharedScreen && !hideClips && "h-36 w-64"}
            ${!sharedScreen && peers==4 && 'h-1/2 w-1/2 absolute bottom-0 right-0'}
          `}/>
      </div>
      
      <div className={`absolute flex flex-col h-auto w-auto right-5 bottom-5 gap-2 border border-solid border-white/[.145] rounded-xl bg-black`}>
        <div onClick={()=>{setChat(!chat)}} className="self-end px-3 py-2 rounded-xl bg-zinc-900 hover:bg-black text-sm text-white cursor-pointer">{chat ? 'hide chat' : 'show chat'}</div>
        {chat &&  
          <div className=' w-[350px] p-2  h-[400px] flex flex-col '>
            <div className='w-full h-[92%] overflow-y-scroll flex flex-col gap-2 scrollbar-hide no-scrollbar'>
                {chatArr.map((chat, index) => (
                    <div key={index} className={`flex ${chat.me ? 'justify-end' : 'justify-start'} `}>
                        <div className={`max-w-[70%] px-4 py-2 rounded-xl shadow-md text-sm
                            ${chat.me ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-black rounded-bl-none'}`}>
                            <div className="font-semibold">{chat.name}</div>
                            <div className="whitespace-pre-wrap break-words">{chat.msg}</div>
                            <div className="text-xs text-right opacity-70 mt-1">{chat.time}</div>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className='w-full rounded h-[8%] flex justify-between'>
                <input onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                        e.preventDefault();
                            sendChat();
                        }
                    }}
                    type="text" ref={msgRef} className='rounded w-[86%] px-2 py-1 text-sm bg-zinc-800 text-white placeholder:text-white' placeholder='type...'/>
                <div className='bg-white w-[12%] text-zinc-800 text-sm font-semibold flex justify-center items-center rounded cursor-pointer' onClick={sendChat}>send</div>
            </div>     
        </div>
        }
      </div>

      <div className={`flex gap-4 justify-center items-center py-2 absolute top-0 left-0 w-full h-auto`}>
        {host && <div className="border border-solid border-white/[.145] rounded-xl text-center px-3 py-1 text-sm text-regular text-black bg-white">{`you are host`}</div>}
        {sharedScreen && <div onClick={()=>{setHideClips(!hideClips)}} className="absoulte bottom-5 right-5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-black text-sm text-white cursor-pointer">{hideClips?'show-clips':'hide-clips'}</div>}  
        {isRecording && <div className="border border-solid border-white/[.145] rounded-xl text-center px-3 py-1 text-sm text-medium text-red-600 bg-white">- Recording</div>}        
        {host && <div onClick={handleRecording} className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-black text-sm text-white cursor-pointer">{isRecording ? 'stop recording' : 'start recording'}</div>}
        <div onClick={toggleCam} className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-black text-sm text-white cursor-pointer">{cam ? 'off cam' : 'on cam'}</div>
        <div onClick={toggleMic} className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-black text-sm text-white cursor-pointer">{mic ? 'off mic' : 'on mic'}</div>
        <div onClick={handleShareScreen} className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-black text-sm text-white cursor-pointer">{screen ? 'stop sharing' : 'share screen'}</div>
        <div onClick={leaveRoom} className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-sm text-white cursor-pointer">end</div>
      </div>

    </div> 
  );
}