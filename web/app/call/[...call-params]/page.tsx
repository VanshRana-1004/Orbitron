'use client';
import { useState, useRef, useEffect } from "react";
import { useRouter,redirect } from "next/navigation";
import { io } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import axios from "axios";
import { AppData, Producer, RtpCapabilities, RtpParameters, Transport } from 'mediasoup-client/lib/types';
import RecordingIcon from "app/components/icons/recording";
import CamOffIcon from "app/components/icons/camoff";
import CamOnIcon from "app/components/icons/camon";
import MicOffIcon from "app/components/icons/minoff";
import MicOnIcon from "app/components/icons/micon";
import StopShareScreenIcon from "app/components/icons/stopsharescreen";
import ShareScreenIcon from "app/components/icons/sharescreen";
import EndCallIcon from "app/components/icons/endcall";
import ChatIcon from "app/components/icons/chat";
import CrossIcon from "app/components/icons/cross";
import CopyIcon from "app/components/icons/copy";
import CheckIcon from "app/components/icons/check";
import HostIcon from "app/components/icons/host";
import PeerIcon from "app/components/icons/peer";
import SendIcon from "app/components/icons/send";
import EmojiIcon from "app/components/icons/emoji";
import { ToastContainer, toast } from "react-toastify";
import Picker from '@emoji-mart/react';
import * as data from "@emoji-mart/data";
const SERVER_URL = `${process.env.NEXT_PUBLIC_SERVER_URL}/call` || 'http://localhost:8080/call';
console.log(SERVER_URL);
export default function Call() {  
  const localStreamRef=useRef<MediaStream>(null);
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
  const [selfSharedScreen,setSelfSharedScreen]=useState<boolean>(false);
  const [hideClips,setHideClips]=useState<boolean>(false);
  const [chat,setChat]=useState<boolean>(false);
  const msgRef=useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef(io(SERVER_URL, { autoConnect: false }));
  interface chat{
    name : string,
    time : string,
    msg : string,
    me : boolean,
    img : string
  }
  const [chatArr, setChatArr] = useState<chat[]>([]);
  const [screenPeer,setScreenPeer]=useState<string>('')
  const [host,setHost]=useState<boolean>(false);
  const [isRecording,setIsRecording]=useState<boolean>(false);
  const [copied,setCopied]=useState<boolean>(false);
  const [img,setImg]=useState<string>('');
  const [showEmoji,setShowEmoji]=useState<boolean>(false);

  const nameRef=useRef<string>("");
  const userIdRef=useRef<string>("");
  const callNameRef=useRef<string>("");
  const callIdRef=useRef<string>("");
  const imgRef=useRef<string>("");
  const chatRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x:0,y:0 }); 
  const offset = useRef({ x: 0, y: 0 });


  const onMouseDown = (e: React.MouseEvent) => {
    if (!chatRef.current) return;
    setIsDragging(true);
    document.body.style.cursor = 'grab';
    offset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    document.body.style.cursor = 'grabbing';
    setPos({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y
    });
  };

  const onMouseUp = () => {
    document.body.style.cursor = 'default';
    setIsDragging(false);
  };

  useEffect(() => {
    setPos({ x: window.innerWidth/2 - 250, y: window.innerHeight/2 - 180 });
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  useEffect(()=>{
    async function getInfo(){
      await axios.get('/api/auth/me').then(async (response)=>{
        const info=await axios.get('/api/auth/user-info',{
          params: {
            id: response.data.user.id
          }
        });
        console.log(info.data);
        setImg(info.data.user.profileImage || '/defaultpc.png');
        nameRef.current=info.data.user.firstName+' '+info.data.user.lastName;
        userIdRef.current=info.data.user.id;
        imgRef.current=info.data.user.profileImage || '/defaultpc.png';
        
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
    if(callId){
      callIdRef.current=callId;
    } 

    const socket=socketRef.current;
    
    joinRoom();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let timeout1:  ReturnType<typeof setTimeout> | undefined;
    const newPeerHandler = ({ peers } : { peers: number}) => setPeers(peers);
    const peerLeaveHandler = ({name} : {name : string}) => {
      setPeers(p => p - 1);
      toast.info(`${name} left the call.`);
    }
    const newProducerHandler = async ({ producerId, peerId, kind, appData } : {producerId : string, peerId : string, kind : 'video' | 'audio', appData : AppData}) => {
      if (peerId === socket.id) return;
      console.log('new producer from peerId', peerId, 'kind', kind, 'producerId', producerId);
      await createConsumer(producerId, deviceRef.current,appData);
    };
    const sharedScreenHandler=({toggle,name}:{toggle : boolean, name : string})=>{
      setSharedScreen(toggle)
      setScreenPeer(name)
      console.log(name);
    } 
    const chatHandler=({name,time,msg, img} : {name : string, time : string, msg : string, img : string})=>setChatArr(prev=>[...prev,{name,time,msg,me:false,img}]);
    const handleJoin=({name} : {name : string})=>{
      toast.info(`${name} joined the call.`);
    }
    const handleScreenNoti=({name} : {name : string})=>setScreenPeer(name);
    const producerClosedHandler = ({ producerId }: { producerId: string }) => {
      console.log(`request to close producerId ${producerId}.`);
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
      if(res.error) toast.error(res.error);
      else if(res.record===0){
        setIsRecording(false);
      }
      else if(res.record===1){
        setIsRecording(true);
      } 
    }
    const handleSelfScreenAck=({status}:{status:boolean})=>{
      setSelfSharedScreen(status);
      setSharedScreen(status);
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
    socket.on('self-screen-ack',handleSelfScreenAck);

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
      socket.off('self-screen-ack',handleSelfScreenAck);
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
          console.log('remote stream assigned');
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
          console.log('adding video stream for producerId', producerId);
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
            toast.info('error while joining room');
            router.push('/dashboard');
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
            opusStereo: true,
          },
          encodings: [{ maxBitrate: 128000 }]
        });

        camProducerRef.current=await sendTransportRef.current.produce({
          track: localStream.getVideoTracks()[0],
          encodings: [
            { 
              rid: 'low',
              maxBitrate: 200000,      
              scaleResolutionDownBy: 4,
              maxFramerate: 15
            },
            { 
              rid: 'medium',
              maxBitrate: 800000,      
              scaleResolutionDownBy: 2,
              maxFramerate: 30
            },
            { 
              rid: 'high',
              maxBitrate: 3500000,     
              maxFramerate: 60
            }
          ],
          codecOptions: { videoGoogleStartBitrate: 2000 },
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
      if(sharedScreen && !selfSharedScreen){
        toast.info('Another participant is already sharing their screen');
        return;
      }
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width:1920, height:1080 ,frameRate: { ideal: 60, max: 60 }, displaySurface: 'monitor' },
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, sampleRate: 48000  }
      });
      if(sharedScreenRef.current) sharedScreenRef.current.srcObject = screenStream;
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      console.log("Screen video settings:", screenVideoTrack?.getSettings());
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
            opusStereo: true,
          },
          encodings: [{ maxBitrate: 128000 }]
        });
        saudioProducerRef.current = screenAudioProducer;
        screenAudioProducer.on('trackended', () => handleShareScreen());
      }

      if (camTrack) {
        const screenVideoProducer = await sendTransport.produce({
          track: camTrack,
          encodings: [
            {
              maxBitrate: 4_000_000,    
              maxFramerate: 30,          
              priority: 'high',
              networkPriority: 'high',
              scaleResolutionDownBy: 1,
            }
          ],
          codecOptions: { 
            videoGoogleStartBitrate: 2000,
            videoGoogleMaxBitrate: 4000,
            videoGoogleMinBitrate: 1000,
          },
          appData: { mediaTag: 'screen-video' },
        });
        screenProducerRef.current = screenVideoProducer;
        screenVideoProducer.on('trackended', () => handleShareScreen());
      }

      socketRef.current.emit('screen-share', { roomId: callIdRef.current, toggle: true, name : nameRef.current },(res : {error? : string,toggle : boolean})=>{
        if(res.error) toast.error(res.error);
        else setScreen(true);
      });
      
    } catch (err) {
      if (err instanceof Error) {
        console.warn('Screen sharing not started:', err.message);
      } else {
        console.warn('Screen sharing not started:', err);
      }
      toast.error('Screen sharing canceled or failed.');
    }

  }  

  function leaveRoom() {
    toast.info('leaving room...');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if(streaming) handleStream();

    if (screenProducerRef.current) {
      screenProducerRef.current.track?.stop();
      screenProducerRef.current.close();
      screenProducerRef.current = null;
    }
    if (saudioProducerRef.current) {
      saudioProducerRef.current.track?.stop();
      saudioProducerRef.current.close();
      saudioProducerRef.current = null;
    }

    if (camProducerRef.current) {
      camProducerRef.current.track?.stop();
      camProducerRef.current.close();
      camProducerRef.current = null;
    }
    if (micProducerRef.current) {
      micProducerRef.current.track?.stop();
      micProducerRef.current.close();
      micProducerRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

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
          setChatArr(prev=>[...prev,{name : nameRef.current,time,msg,me:true,img}]);
          console.log(imgRef.current);
          await socket.emit('chat', {roomId : callIdRef.current,name : nameRef.current,time,msg,img : imgRef.current!='' ? imgRef.current! : '/defaultpc.png'  },(res : {error? : string})=>{});
        }
    }
  }  
  
  async function handleRecording(){
    if(isRecording) socketRef.current.emit('recording',{roomId : callIdRef.current, record : false});
    else socketRef.current.emit('recording',{roomId : callIdRef.current, record : true});
  }  

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatArr]);  

  function copyToClipboard(){
    if (callIdRef.current) {
    navigator.clipboard.writeText(callIdRef.current).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  }
  
  const handleEmojiSelect = (emoji: any) => {
    if(msgRef.current) msgRef.current.value+=emoji.native;
  };

  return (
    <div className="h-screen w-screen relative p-2 overflow-y-hidden"
    style={{
        scrollBehavior: "smooth",
        backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
            radial-gradient(circle at 20px 20px, rgba(55, 65, 81, 0.12) 2px, transparent 2px),
            radial-gradient(circle at 40px 40px, rgba(55, 65, 81, 0.12) 2px, transparent 2px)
        `,
        backgroundSize: '40px 40px, 40px 40px, 40px 40px, 40px 40px',
    }}>   
    
      <ToastContainer theme={'dark'} position="top-center" autoClose={3000}/>
      <video autoPlay playsInline muted={screen} ref={sharedScreenRef} className={` z-50
        ${!sharedScreen && 'w-0 h-0 hidden'} 
        ${(!hideClips && sharedScreen && peers<=1) ? 'w-[calc(70%-15px)] top-1/2 -translate-y-1/2 left-[10px] absolute rounded-xl bg-black border border-zinc-700'
          : (!hideClips && sharedScreen && peers>1 && peers<4) ? 'h-[calc(70%-15px)] top-[10px] left-1/2 -translate-x-1/2 absolute rounded-xl bg-black border border-zinc-700'
          : (!hideClips && sharedScreen && peers==4) ? 'h-[calc(70%-15px)] max-w-[calc(70%-15px)] top-[10px] right-[calc(30%+5px)] absolute rounded-xl bg-black border border-zinc-700' 
          : ''
        }
        ${hideClips && sharedScreen && 'absolute w-[calc(100%-20px)] h-[calc(100%-20px)] bg-black border border-zinc-700 object-center rounded-xl top-[10px] left-[10px]'}
      `} style={{aspectRatio:'16/9'}}></video>
      
      <video autoPlay playsInline muted ref={localVideoRef} className={` z-50
        ${!sharedScreen && peers==0 && 'absolute w-[calc(100%-20px)] h-[calc(100%-20px)] bg-black border border-zinc-700 object-center rounded-xl top-[10px] left-[10px] '}
        ${!sharedScreen && peers==1 && 'absolute w-[calc(50%-15px)] h-[calc(100%-20px)] bg-black border border-zinc-700 object-center rounded-xl top-[10px] left-[calc(50%+10px)]'}
        ${!sharedScreen && peers==2 && 'absolute w-[calc(50%-20px)] h-[calc(50%-15px)] bg-black border border-zinc-700 object-center rounded-xl bottom-[10px] left-1/2 -translate-x-1/2'}
        ${!sharedScreen && peers==3 && 'absolute w-[calc(50%-15px)] h-[calc(50%-15px)] bg-black border border-zinc-700 object-center rounded-xl bottom-[10px] right-[10px]'}
        ${!sharedScreen && peers==4 && 'absolute w-[calc(34%-10px)] h-[calc(50%-15px)] bg-black border border-zinc-700 object-center rounded-xl bottom-[10px] right-[calc(50%+5px)]'}
        
        ${hideClips && sharedScreen && 'w-0 h-0 hidden'}
        ${!hideClips && sharedScreen && peers==0 && 'w-[calc(30%-15px)] right-[10px] bottom-[40px] absolute rounded-xl bg-black border border-zinc-700'}
        ${!hideClips && sharedScreen && peers==1 && 'w-[calc(30%-15px)] right-[10px] top-[calc(50%+5px)] absolute rounded-xl bg-black border border-zinc-700'}
        ${!hideClips && sharedScreen && peers==2 && 'h-[calc(30%-15px)] max-w-[33%] left-2/3 bottom-[10px] absolute rounded-xl bg-black border border-zinc-700'}
        ${!hideClips && sharedScreen && peers==3 && 'h-[calc(30%-15px)] max-w-[25%] left-[88%] -translate-x-1/2 bottom-[10px] absolute rounded-xl bg-black border border-zinc-700'}
        ${!hideClips && sharedScreen && peers==4 && 'w-[calc(30%-15px)] max-w-[calc(30%-15px)] left-[calc(70%+5px)] top-1/3 -translate-y-1/2 absolute rounded-xl bg-black border border-zinc-700'}
      `} style={{aspectRatio:'16/9'}}></video>
      
      <video autoPlay playsInline muted={false} ref={remoteVideoRefs[0]} className={` z-50
        ${!sharedScreen && peers==0 && 'w-0 h-0 hidden'}
        ${!sharedScreen && peers==1 && 'absolute w-[calc(50%-15px)] h-[calc(100%-20px)] bg-black border border-zinc-700 object-center rounded-xl left-[10px] top-[10px] '}
        ${!sharedScreen && peers==2 && 'absolute w-[calc(50%-15px)] h-[calc(50%-15px)] bg-black border border-zinc-700 object-center rounded-xl top-[10px] left-[10px]'}
        ${!sharedScreen && peers==3 && 'absolute w-[calc(50%-15px)] h-[calc(50%-15px)] bg-black border border-zinc-700 object-center rounded-xl top-[10px] left-[10px]'}
        ${!sharedScreen && peers==4 && 'absolute w-[calc(34%-20px)] h-[calc(50%-15px)] bg-black border border-zinc-700 object-center rounded-xl top-[10px] left-[10px]'}        
      
        ${hideClips && sharedScreen && 'w-0 h-0 hidden'}

        ${!hideClips && sharedScreen && peers==1 && 'w-[calc(30%-15px)] right-[10px] bottom-[calc(50%+5px)] absolute rounded-xl bg-black border border-zinc-700'}
        ${!hideClips && sharedScreen && peers==2 && 'max-w-[33%] h-[calc(30%-15px)] right-2/3 bottom-[10px] absolute rounded-xl bg-black border border-zinc-700'}
        ${!hideClips && sharedScreen && (peers==3 || peers==4) && 'max-w-[25%] h-[calc(30%-15px)] left-[13%] -translate-x-1/2 bottom-[10px] absolute rounded-xl bg-black border border-zinc-700'}
      `} style={{aspectRatio:'16/9'}}></video>
      
      <video autoPlay playsInline muted={false} ref={remoteVideoRefs[1]} className={` z-50
        ${!sharedScreen && peers<=1 && 'w-0 h-0 hidden'}
        ${!sharedScreen && peers>1 && peers<=3 && 'absolute w-[calc(50%-15px)] h-[calc(50%-15px)] bg-black border border-zinc-700 object-center rounded-xl top-[10px] right-[10px]'}
        ${!sharedScreen && peers===4 && 'absolute w-[calc(34%-20px)] h-[calc(50%-15px)] bg-black border border-zinc-700 object-center rounded-xl top-[10px] left-[calc(50%)] -translate-x-1/2'}
      
        ${hideClips && sharedScreen && 'w-0 h-0 hidden'}

        ${!hideClips && sharedScreen && peers==2 && 'max-w-[33%] h-[calc(30%-15px)] left-1/2 -translate-x-1/2 bottom-[10px] absolute rounded-xl bg-black border border-zinc-700'}
        ${!hideClips && sharedScreen && peers>=3 && 'h-[calc(30%-15px)] max-w-[25%] left-[38%] -translate-x-1/2 bottom-[10px] absolute rounded-xl bg-black border border-zinc-700'}
      `} style={{aspectRatio:'16/9'}}></video>
      
      <video autoPlay playsInline muted={false} ref={remoteVideoRefs[2]} className={` z-50
        ${!sharedScreen && peers<=2 && 'w-0 h-0 hidden'}
        ${!sharedScreen && peers===3 && 'absolute h-[calc(50%-15px)] w-[calc(50%-15px)] bg-black border border-zinc-700 object-center rounded-xl bottom-[10px] left-[10px]'}
        ${!sharedScreen && peers===4 && 'absolute h-[calc(50%-15px)] w-[calc(34%-20px)] bg-black border border-zinc-700 object-center rounded-xl top-[10px] right-[10px]'}
      
        ${hideClips && sharedScreen && 'w-0 h-0 hidden'}

        ${!hideClips && sharedScreen && peers>=3 && 'h-[calc(30%-15px)] max-w-[25%] left-[63%] -translate-x-1/2 bottom-[10px] absolute rounded-xl bg-black border border-zinc-700'}
      `} style={{aspectRatio:'16/9'}}></video>
      
      <video autoPlay playsInline muted={false} ref={remoteVideoRefs[3]} className={`z-50
        ${!sharedScreen && peers<=3 && 'w-0 h-0 hidden'}
        ${!sharedScreen && peers===4 && 'absolute h-[calc(50%-15px)] w-[calc(34%-20px)] bg-black border border-zinc-700 object-center rounded-xl bottom-[10px] left-[calc(50%+5px)]'}
        
        ${hideClips && sharedScreen && 'w-0 h-0 hidden'}

        ${!hideClips && sharedScreen && peers==4 && 'h-[calc(30%-15px)] max-w-[25%] left-[88%] -translate-x-1/2 bottom-[10px] absolute rounded-xl bg-black border border-zinc-700'}
      `} style={{aspectRatio:'16/9'}}></video>
      
      {isRecording && 
        <div className="fixed z-50 top-5 right-10 flex items-center justify-center gap-3 bg-black/30 hover:bg-white/10 px-3 py-1.5 rounded-full">
          <div className="rotate-[45deg]"><RecordingIcon/></div> 
          <p className="justify-self-center poppins-regular text-[14px] text-white">Recording</p>
        </div>
      }        

      <div className="flex fixed top-5 z-50 left-16 gap-2 items-center">
        
        <div className="flex items-center self-center  gap-2 w-auto rounded-full bg-black/30 px-3 p3-2 py-1.5 ">
          {host ? <HostIcon/> : <PeerIcon/>}
          <p className="poppins-regular text-[14px] tracking-[-5%] text-white">{host? 'Host' : 'Participant'}</p>
        </div>

        <div className="flex items-center self-center  gap-2 w-auto rounded-full bg-black/30 px-3 pr-2 py-1.5 ">
          <p className="poppins-regular text-[14px] tracking-[-5%] text-white">Call-Id</p>
          <div onClick={copyToClipboard} className={` cursor-pointer ${copied && 'pointer-events-none'}`}>{!copied ? <CopyIcon/> : <CheckIcon/>}</div>
        </div> 

        {sharedScreen &&  <div className="poppins-regular text-[14px] tracking-[-5%] text-white flex items-center self-center bg-black/30 py-1.5 rounded-full  px-3">{`${screenPeer} representing`}</div>}
        {screen && <div className="poppins-regular text-[14px] tracking-[-5%] text-white flex items-center self-center bg-black/30 py-1.5 rounded-full  px-3">{`you representing`}</div>}
        {sharedScreen && <div onClick={()=>setHideClips(!hideClips)} className="cursor-pointer bg-white/80 py-1.5 px-4 rounded-full text-black hover:bg-white poppins-regular text-[14px] tracking-[-5%]">{hideClips ? `Show clips` : 'Hide clips'}</div>}

        {host && <div onClick={handleRecording} className={`cursor-pointer  ${isRecording ? 'bg-[#F8000F] text-white hover:bg-[#ff0f1f]' : 'bg-white text-black hover:bg-white/70'} py-1.5 px-4 rounded-full  poppins-regular text-[14px] tracking-[-5%]`}>{isRecording ? 'Stop Recording' : 'Start Recording'}</div>}

      </div>      

      <div className="flex w-full bottom-10 left-1/2  -translate-x-1/2 fixed z-50 bg-black ">

        <div className="flex gap-7 absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 items-center">
            <div onClick={toggleCam} className="flex self-center items-center justify-center p-2 rounded-full bg-black/30 hover:bg-white/10 text-sm text-white cursor-pointer">{cam ? <CamOnIcon/> : <CamOffIcon/>}</div>
            <div onClick={toggleMic} className="flex self-center items-center justify-center p-2 rounded-full bg-black/30 hover:bg-white/10 text-sm text-white cursor-pointer">{mic ? <MicOnIcon/> : <MicOffIcon/>}</div>
            <div onClick={leaveRoom} className="flex self-center items-center justify-center p-3 rounded-full bg-[#F8000F] hover:bg-[#ff0f1f] text-sm text-white cursor-pointer rotate-[135deg]"><EndCallIcon /></div> 
            <div onClick={handleShareScreen} className="flex self-center items-center justify-center p-2 rounded-full bg-black/30 hover:bg-white/10 text-sm text-white cursor-pointer">{screen ? <StopShareScreenIcon/> : <ShareScreenIcon/>}</div>
            <div onClick={()=>{setChat(!chat)}} className="flex self-center items-center justify-center p-2 rounded-full bg-black/30 hover:bg-white/10 text-sm text-white cursor-pointer"><ChatIcon/></div>
        </div>
        
      </div>  
          
        {chat &&  
          <div ref={chatRef}
            onMouseDown={onMouseDown}
            className={`w-[385px] border border-zinc-700 h-[500px] p-2 fixed z-50 flex flex-col gap-2  rounded-xl bg-black`}
            style={{ top: pos.y, left: pos.x, transform: 'none' }}>
              
              <div className="flex items-center justify-between pb-1 px-1 border-b border-b-zinc-700">
                <p className="poppins-regular text-[15px] text-zinc-400">Messages (Drag me!)</p>
                <div onClick={()=>{setChat(false)}} className="self-end p-1 rounded-full hover:bg-zinc-900  text-sm text-white cursor-pointer"><CrossIcon/></div>
              </div>
              
              <div className='w-full h-[92%] overflow-y-scroll flex flex-col gap-2 scrollbar-hide no-scrollbar'>
                  {chatArr.map((chat, index) => (
                      <div key={index} className={`flex gap-1 ${chat.me ? 'place-self-end' : 'place-self-start'} `}>
                          {!chat.me && <img src={chat.img} alt="" className="size-7  rounded-full object-cover overflow-hidden"/>}
                          <div className={`flex w-auto flex-col gap-0.5 ${chat.me ? 'items-end' : 'items-start' }`}>
                            <div className="poppins-regular tracking-tight text-[12px] text-zinc-400">{chat.name}</div>
                            <div className={`text-wrap max-w-56 poppins-regular text-[14px] text-white rounded-3xl h-auto py-1 px-3 ${chat.me ? 'rounded-br-none bg-violet-500' : 'rounded-bl-none bg-zinc-700' }`}>{chat.msg}</div>
                            <div className="poppins-regular tracking-tight text-[9px] text-zinc-400">{chat.time}</div>
                          </div>
                          {chat.me && <img src={chat.img} alt="" className="size-7 rounded-full object-cover overflow-hidden"/>}
                      </div>
                  ))}
                  <div ref={bottomRef} />
              </div>

              <div className='w-full rounded flex-1 flex justify-between gap-1'>

                  <div className="flex items-center w-full gap-1 bg-zinc-900 border rounded-md px-2 pr-0">
                    <div onClick={()=>setShowEmoji(!showEmoji)} className="hover:bg-black rounded-full p-0.5 cursor-pointer"><EmojiIcon/></div>
                    {showEmoji && (
                      <div className="absolute flex flex-col left-1.5 bottom-10 mb-1 z-50 bg-zinc-900 rounded-xl">
                        <div className="flex justify-between w-full p-3 py-2">
                          <p className="poppins-regular text-zinc-200 text-[15px] ">Select Emojis</p>
                          <div onClick={()=>setShowEmoji(false)} className="p-0.5 rounded-full hover:bg-black cursor-pointer"><CrossIcon/></div>
                        </div>
                        <div className="bg-zinc-800 p-2 rounded-xl shadow-lg " >
                          <Picker
                            data={data}
                            onEmojiSelect={handleEmojiSelect}
                            theme="dark"
                          />
                        </div>
                      </div>
                    )}
                    <input onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            sendChat();
                          }
                      }}
                      type="text" ref={msgRef} className='bg-zinc-900 outline-none w-[86%] py-1 text-sm  placeholder:text-zinc-300 poppins-regular text-[14px] text-zinc-200' placeholder='type...'/>
                  </div>
                  
                  <div className='bg-violet-500 p-1.5 rounded-full text-sm font-semibold flex justify-center items-center cursor-pointer' onClick={sendChat}><SendIcon/></div>
              </div>  

          </div>
        }

    </div> 
  );
}