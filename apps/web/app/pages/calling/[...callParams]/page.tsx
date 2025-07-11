"use client";
import {useEffect,useRef,useState,useCallback} from 'react';
import { io,Socket } from 'socket.io-client'; 
import * as mediasoupClient from 'mediasoup-client';
import { CreateDevice } from 'app/mediasoup-client/device';
import { RtpCapabilities } from 'mediasoup-client/types';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const SERVER_URL='http://localhost:8080';
 
export default function Calling(){
    const router=useRouter();
    const [admin,setAdmin]=useState<boolean>(false);
    const [isRecording,setIsRecording]=useState<boolean>(false);
    const [camera,setCamera]=useState<boolean>(true);
    const [mic,setMic]=useState<boolean>(true);
    const [shareScreen,setShareScreen]=useState<boolean>(false);
    const [alreadyShared,setAlreadyShared]=useState<boolean>(false);
    const [peers,setPeers]=useState<number>(0);
    const [callName,setCallName]=useState<string>("");
    const [roomId,setRoomId]=useState<string>(""); 
    const [userName,setUserName]=useState<string>("");
    const [userId,setUserId]=useState<string>("");
    const roomIdRef=useRef<string>("");
    const userNameRef=useRef<string>("");
    const userIdRef=useRef<string>("");
    const callNameRef=useRef<string>("");
    let device : mediasoupClient.Device | null = null;

    const [width,setWidth]=useState<number>(0);
    const localVideo=useRef<HTMLVideoElement>(null);
    const localScreenVideo=useRef<HTMLVideoElement>(null);
    const localStreamRef=useRef<MediaStream | null>(null);

    const sckt=useRef<Socket>(null);
    const rtpCap=useRef<RtpCapabilities>(null);
    let producerTransport : any=null;
    let consumerTransport : mediasoupClient.types.Transport | null=null;
    let consumerTransports : {
        consumerTransport: mediasoupClient.types.Transport;
        serverConsumeTransportId: string;
        producerId: string;
        consumer: mediasoupClient.types.Consumer;
    }[]=[];

    let producerVideo: mediasoupClient.types.Producer | undefined; 
    let producerAudio: mediasoupClient.types.Producer | undefined; 
    
    const screenStreamRef = useRef<MediaStream | null>(null);
    const shareScreenRef = useRef(false); 

    const localVideoProducerId = useRef<string | null>(null);
    const localAudioProducerId = useRef<string | null>(null);

    const producerTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
    const producerVideoRef = useRef<mediasoupClient.types.Producer | null>(null);
    const producerAudioRef = useRef<mediasoupClient.types.Producer | null>(null);
    const producerScreenRef= useRef<mediasoupClient.types.Producer | null>(null);
    const videoTrackRef=useRef<MediaStreamTrack>(null);
    const audioTrackRef=useRef<MediaStreamTrack>(null);
    const screenTrackRef=useRef<MediaStreamTrack>(null);
    const [remoteStreams, setRemoteStreams]=useState<{id:string;stream:MediaStream;kind:'video'|'audio'}[]>([]);
    const screenVideoElements = useRef<Map<string, HTMLVideoElement>>(new Map());

    const consumedProducerIds = useRef<Set<string>>(new Set());
    const chunks = useRef<Blob[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timeOutRef=useRef<NodeJS.Timeout | null>(null);

    const screenRecorderRef = useRef<MediaRecorder | null>(null);
    const screenChunks = useRef<Blob[]>([]);
    const screenTimeOutRef = useRef<NodeJS.Timeout | null>(null);
    const uploadQueue = useRef<{blob : Blob,type : string,timeStamp: string}[]>([]);
    const isUploading = useRef(false);

    const [token,setToken]=useState<string | null>(null);
    const [authorized,setAuthorized]=useState<boolean>(false);

    useEffect(()=>{
        const storedToken = localStorage.getItem('token');
        setToken(storedToken);
    },[]);

    useEffect(() => {
        if (!token) return;
        async function verifyToken() {
            try{
                const response = await axios.post('/api/auth/verify-token',{},{
                    headers: { Authorization: `Bearer ${token}`}
                })
                console.log('Token verified successfully:', response.data);
                const name=response.data.firstName+' '+response.data.lastName;
                setUserName(name);
                userNameRef.current=name;
                setUserId(response.data.id);
                userIdRef.current=response.data.id;
                setAuthorized(true);
            }catch(e){
                console.log('No token found, redirecting to login');
                router.push('/pages/login');
                return;
            }
        }
        verifyToken();
        console.log('token in dashboard : ', token);
    }, [token]);

    useEffect(()=>{
        window.addEventListener("resize",()=>{setWidth(window.innerWidth);})
        return ()=>{
            window.removeEventListener("resize",()=>{setWidth(window.innerWidth);})
        }
    },[])

    useEffect(()=>{
        if(!authorized) return;
        
        const url=window.location.pathname;
        const segments = url.split('/'); 
        const callName=segments[3];
        const id=segments[4];
        if(callName) callNameRef.current=callName,setCallName(callName);
        if(id) roomIdRef.current=id,setRoomId(id);

        const newSocket=io(SERVER_URL);
        sckt.current=newSocket;   

        newSocket.on('connect',()=>{
            console.log('connected to the server');
        })

        newSocket.on('connection-success',({socketId})=>{
            console.log('connection-success :',socketId);
            newSocket.emit('limit-check',{roomId : id});
        })

        newSocket.on('limit-ack',(ack : boolean)=>{
            if(!ack){
                alert(`peers limit hit,you can't join the room`);
                router.push('/pages/dashboard');
            }
            else {
                getLocalStream();
            }
        })

        newSocket.on('new-producer',({producerId})=>{
            signalNewConsumeTransport(producerId)
        });

        newSocket.on('screen-shared', ({producerId}) => {
            setAlreadyShared(true);
            console.log('screen resumed');
            const parent=document.getElementById('screenShared');
            if(parent){
                while (parent.firstChild) {
                    parent.removeChild(parent.firstChild);
                }
            }
            const child=screenVideoElements.current.get(producerId);
            console.log(screenVideoElements.current);
            console.log(producerId);
            if(child) console.log('child found');
            if(parent) console.log('parent found');
            if(parent && child){
                console.log('append child siccessfully');
                parent.appendChild(child);
            } 
        });

        newSocket.on('producer-closed',({remoteProducerId})=>{
            console.log('producer closed with id : ',remoteProducerId);
            setPeers(peers=>peers-1);            
            setRemoteStreams(prev =>
                prev.filter(stream => stream.id !== remoteProducerId)
            );
            const producerToClose=consumerTransports.find(transportData=>transportData.producerId===remoteProducerId);
            if (producerToClose) {
                producerToClose.consumerTransport.close();
                consumerTransports = consumerTransports.filter(
                    transportData => transportData.producerId !== remoteProducerId
                );
            }
        })

        newSocket.on('stop-sharing',()=>{
            console.log('screen sharing stopped');
            setAlreadyShared(false);
            // remove all the elements from screenSharing and save them 
            const parent=document.getElementById('screenShared');
            if(parent){
                while (parent.firstChild) {
                    parent.removeChild(parent.firstChild);
                }
            }
        })

        newSocket.on('self-screen-ack',({shared})=>{
            console.log('self screen ack :',shared);
            let share=false;
            if(shared!=='') share=true
            setAlreadyShared(share);
            const parent=document.getElementById('screenShared');
            if(parent){
                while (parent.firstChild) {
                    parent.removeChild(parent.firstChild);
                }
            }
            const child=screenVideoElements.current.get(shared);
            if(parent && child) parent.appendChild(child);
        })

        newSocket.on('admin',()=>{
            setAdmin(true);
        })

        newSocket.on('start-recording',()=>{
            alert('Recording started successfully');
            setTimeout(()=>{
                setIsRecording(true);
                startRecording();
            },5000);
            if(shareScreenRef.current) startSharedScreenRecording();
        })

        newSocket.on('stop-recording',()=>{
            alert('Recording stopped successfully');
            setIsRecording(false);
            stopRecording(false);
            if(shareScreenRef.current) stopSharedScreenRecording(false);
        })
        
        newSocket.on('recording-ack',({isRecording})=>{
            if(isRecording){
                setIsRecording(true);
                startRecording();
                if(shareScreenRef.current) startSharedScreenRecording();
                alert('recording started successfully');
            }
        })

        newSocket.on('chunk_ack',({status})=>{
            if(status) alert('chunk saved successfully')
            else alert('error in saving chunk')    
        })

    },[authorized])

    async function getLocalStream(){
        
        const localStream = await navigator.mediaDevices.getUserMedia({
            video:{
                width:{
                    min:480,
                    max:1300
                },
                height:{
                    min:282,
                    max:700
                }
            },
            audio:true
        });
        if(localStream && localVideo.current){
            localStreamRef.current = localStream;
            localVideo.current.srcObject = localStream;
            localVideo.current.muted=true;
            const videoTrack=localStream.getVideoTracks()[0];
            const audioTrack=localStream.getAudioTracks()[0];

            if (videoTrack && audioTrack) {
                videoTrackRef.current=videoTrack;
                audioTrackRef.current=audioTrack;
                joinRoom(videoTrack, audioTrack);
            } else {
                console.error('Missing video or audio track');
            }
        }
    }
    
    async function joinRoom(videoTrack : MediaStreamTrack,audioTrack : MediaStreamTrack){
        const socket=sckt.current;
        console.log('join Room called from client side with roomId : ',roomIdRef.current);
        socket?.emit('joinRoom',{roomId : roomIdRef.current},async (rtpCapabilities : any)=>{
            console.log('rtp Capabilities : ',rtpCapabilities);
            rtpCap.current=rtpCapabilities;
            device = (await CreateDevice(rtpCapabilities)) ?? null;
            await createSendTransport(videoTrack,audioTrack);
        })
    }

    async function getProducers(){
        const socket=sckt.current;
        if(!socket) return;
        socket.emit('getProducers',(producerIds : any)=>{
            producerIds.forEach(signalNewConsumeTransport)
        })
    }

    async function createSendTransport(videoTrack : MediaStreamTrack,audioTrack : MediaStreamTrack){
        const socket=sckt.current;
        if(!socket) return;
        socket.emit('createWebRtcTransport',{consumer : false},({params} : {params : any})=>{
            if(params.error) {
                console.log('Something fisshy happended')
                console.log(params.error);
                return
            }
            console.log(params);
            if(device){
                console.log('creating send transport');
                producerTransport=device.createSendTransport(params);
                if(producerTransport){
                    producerTransportRef.current=producerTransport
                    console.log('sending connect request');            
                    
                    producerTransport.on('connect',async ({dtlsParameters} : {dtlsParameters : any},callback : any,errback : any)=>{
                        try{
                            await socket.emit('transport-connect',{
                                dtlsParameters : dtlsParameters
                            })
                            console.log('transport connected successfully');
                            callback();
                        }catch(e){
                            console.log('transport not connected');
                            errback(e);
                        }
                    })
                    
                    producerTransport.on('produce',async (parameters : any,callback : any,errback : any)=>{
                        console.log(parameters);
                        try{
                            await socket.emit('transport-produce',{
                                kind:parameters.kind,
                                rtpParameters:parameters.rtpParameters,
                                appData:parameters.appData
                            },({id,producerExist} : {id : string,producerExist : boolean})=>{
                                console.log('transport produce success')
                                callback({id});
                            })
                        }catch(e){
                            console.log('transport produce failed');
                            errback(e);
                        }
                    })

                    connectSendTransportProduce(videoTrack,'video');
                    connectSendTransportProduce(audioTrack,'audio');
                    const checkProducersAndGetOthers = () => {
                        if (localVideoProducerId.current && localAudioProducerId.current) {
                            getProducers(); 
                        } else {
                            setTimeout(checkProducersAndGetOthers, 100); 
                        }
                    };
                    setTimeout(checkProducersAndGetOthers, 500);
                }
            }
        })
    }

    async function connectSendTransportProduce(track : MediaStreamTrack,kind : 'audio' | 'video'){
        if (!producerTransportRef.current) {
            console.error('Producer transport not initialized.');
            return;
        }
        producerTransport=producerTransportRef.current;
        console.log(`request to produce ${kind} tracks`);
        const producerParams: mediasoupClient.types.ProducerOptions = {
            track: track,
            encodings: kind === 'video' ? [
                { rid: 'r0', maxBitrate: 300000, scalabilityMode: 'S1T3' },
                { rid: 'r1', maxBitrate: 900000, scalabilityMode: 'S1T3' },
                { rid: 'r2', maxBitrate: 2500000, scalabilityMode: 'S1T3' },
            ] : undefined,
            codecOptions: kind === 'video'
                ? { videoGoogleStartBitrate: 1500 }
                : {
                    opusStereo: true,
                    opusDtx: true,
                    opusFec: true
                },
            appData: { kind }
        };
        if (kind === 'video') {
            producerVideo = await producerTransport.produce(producerParams);
            if(!producerVideo){
                console.log('unable to produce for video')
                return;
            } 
            producerVideoRef.current=producerVideo
            localVideoProducerId.current = producerVideo.id;
            producerVideo.on('trackended', () => {
                console.log('Video track ended');
            });
        } else if (kind === 'audio') {
            producerAudio = await producerTransport.produce(producerParams);
            if(!producerAudio){
                console.log('unable to produce for audio')
                return 
            } 
            producerAudioRef.current=producerAudio;
            localAudioProducerId.current = producerAudio.id;
            producerAudio.on('trackended', () => {
                console.log('Audio track ended');
            });
        }
    }

    async function signalNewConsumeTransport(remoteProducerId : string){
        const socket=sckt.current;
        if (consumedProducerIds.current.has(remoteProducerId)) {
            console.log(`Already consuming producer: ${remoteProducerId}`);
            return;
        }
        consumedProducerIds.current.add(remoteProducerId);
        if(!socket) return;
        if (remoteProducerId === localVideoProducerId.current || remoteProducerId === localAudioProducerId.current) {
            console.log(`Skipping consumption of own producer: ${remoteProducerId}`);
            return;
        }
        await socket.emit('createWebRtcTransport',{consumer : true},({params} : {params : any})=>{
            if(params.error) {
                console.log('Something fisshy happended')
                console.log(params.error);
                return
            }
            console.log(params);
            if(device){
                consumerTransport=device.createRecvTransport(params);
                if(producerTransport){
                    consumerTransport.on('connect',async ({dtlsParameters} : {dtlsParameters : any},callback : any,errback : any)=>{
                        try{
                            await socket.emit('transport-recv-connect',{dtlsParameters,serverConsumerTransportId : params.id})
                            console.log('consumer connection done')
                            callback();
                        }catch(e){
                            console.log('error in connecting consumer transport');
                            errback(e);
                        }
                    })
                }
            }
            connectRecvTransportConsume(consumerTransport,remoteProducerId,params.id);
        })
    }

    async function connectRecvTransportConsume(consumerTransport : mediasoupClient.types.Transport | null,remoteProducerId : string,serverConsumeTransportId : string){
        const socket=sckt.current;
        if(!socket || !device || !rtpCap.current || !consumerTransport) return;
        console.log('sending socket request to consume');
        const rtpCapabilities : RtpCapabilities=rtpCap.current;
        await socket.emit('consume',{
                rtpCapabilities : rtpCapabilities, 
                remoteProducerId : remoteProducerId,
                serverConsumeTransportId : serverConsumeTransportId
            },async({ params }: { params: any })=>{
            if(params.error){
                console.log('Cannot consume')
                return;
            }
            console.log(params);
            if(params.id) console.log(params.id);
            if(params.producerId) console.log(params.producerId);
            if(params.kind) console.log(params.kind);
            if(params.appData) console.log(params.appData);
            if(params.rtpParameters) console.log(params.rtpParameters);
            const consumer=await consumerTransport.consume({
                id : params.id,
                producerId : params.producerId,
                kind : params.kind,
                rtpParameters:params.rtpParameters,
            })
            consumerTransports=[
                ...consumerTransports,
                {
                    consumerTransport,
                    serverConsumeTransportId : params.id,
                    producerId : remoteProducerId,
                    consumer
                }
            ]
            const {track}=consumer;
            const remoteStream = new MediaStream([track]);
            if(params.appData.kind==='screen'){
                let mediaElement : HTMLVideoElement=document.createElement('video');
                if (mediaElement) {
                    mediaElement.srcObject = remoteStream;
                    mediaElement.playsInline=true;
                    mediaElement.autoplay=true;
                    mediaElement.id = params.producerId;
                    mediaElement.style.width = '100%';
                    mediaElement.style.height = '100%';   
                    mediaElement.style.objectFit = 'contain';
                    mediaElement.style.display = 'block'; 
                    mediaElement.style.alignSelf = 'center';
                    mediaElement.onloadedmetadata = () => {
                        mediaElement.play().catch(err => {
                            console.warn('Video play failed:', err);
                        });
                    };
                }
                if(params.producerId){
                    console.log('set correctly : ',params.producerId);
                    screenVideoElements.current.set(params.producerId, mediaElement);    
                } 
                const parent=document.getElementById('screenShared');
                if(parent){
                    while (parent.firstChild) {
                        parent.removeChild(parent.firstChild);
                    }
                }    
                parent?.appendChild(mediaElement);
                setPeers(peers=>peers+1);
            } 
            else{
                setRemoteStreams(prev => [...prev,{ id: remoteProducerId, stream: remoteStream, kind: params.appData.kind}]);
                setPeers(peers=>peers+1);
            }
            socket.emit('consumer-resume',{serverConsumerId : params.serverConsumerId});
            
            track.onunmute=()=>{
                console.log('Track unmuted:', remoteProducerId);
            }
            track.onended=()=>{
                console.log('track ended from : ',remoteProducerId);
            }
            track.onmute=()=>{
                console.log('Track muted:', remoteProducerId);
            }
        })
    }

    async function handleMic(){
        if(mic){
            if(isRecording) stopRecording(false);
            if(audioTrackRef.current) audioTrackRef.current.stop();
            setMic(false);
            if(isRecording){
                if(!camera) localStreamRef.current = createBlackMutedStream();
                startRecording();
            }  
        } 
        else if(!mic){
            if(isRecording) stopRecording(false);
            let stream : MediaStream | null = null;
            if(camera){
                stream=await navigator.mediaDevices.getUserMedia({
                    video:{
                        width:{
                            min:480,
                            max:1300
                        },
                        height:{
                            min:282,
                            max:700
                        }
                    },
                    audio: true
                })
            }
            else{
                stream=await navigator.mediaDevices.getUserMedia({
                    audio: true
                })
            }
            const videoTrack=stream.getVideoTracks()[0];
            const audioTrack=stream.getAudioTracks()[0];
            if(videoTrackRef.current && videoTrack) videoTrackRef.current=videoTrack;
            if(audioTrackRef.current && audioTrack) audioTrackRef.current=audioTrack;
            localStreamRef.current = stream;
            if(isRecording) startRecording();            
            if (!producerTransportRef.current) {
                console.error('Producer transport not initialized.');
                return;
            }
            if(!producerAudioRef.current){
                console.log('producer not found');
                return; 
            }
            producerAudio=producerAudioRef.current;
            if (producerAudio && audioTrack) {
                await producerAudio.replaceTrack({ track: audioTrack });
                audioTrackRef.current = audioTrack;
                console.log('Replaced track in existing producer');
            }
            setMic(true);
        }
    }

    async function handleCamera(){
        if(camera){
            if(isRecording) stopRecording(false);
            if(videoTrackRef.current) videoTrackRef.current.stop();
            setCamera(false);
            if(isRecording){
                if(!mic) localStreamRef.current = createBlackMutedStream();
                startRecording();
            } 
        } 
        else if(!camera){
            if(isRecording) stopRecording(false);
            let stream : MediaStream | null = null;
            if(mic){
                stream=await navigator.mediaDevices.getUserMedia({
                    video:{
                        width:{
                            min:480,
                            max:1300
                        },
                        height:{
                            min:282,
                            max:700
                        }
                    },
                    audio: true
                })
            }
            else{
                stream=await navigator.mediaDevices.getUserMedia({
                    video:{
                        width:{
                            min:480,
                            max:1300
                        },
                        height:{
                            min:282,
                            max:700
                        }
                    }
                })
            }
            const videoTrack=stream.getVideoTracks()[0];
            const audioTrack=stream.getAudioTracks()[0];
            if(videoTrackRef.current && videoTrack) videoTrackRef.current=videoTrack;
            if(audioTrackRef.current && audioTrack) audioTrackRef.current=audioTrack;
            localStreamRef.current = stream;
            if(isRecording) startRecording();
            if(localVideo.current){
                localVideo.current.srcObject = stream;
                localVideo.current.muted=true;
            }    
            if (!producerTransportRef.current) {
                console.error('Producer transport not initialized.');
                return;
            }
            if(!producerVideoRef.current){
                console.log('producer not found');
                return; 
            }
            producerVideo=producerVideoRef.current;
            if (producerVideo && videoTrack) {
                await producerVideo.replaceTrack({ track: videoTrack });
                videoTrackRef.current = videoTrack;
                console.log('Replaced track in existing producer');
            }
            setCamera(true);
        } 
    }

    function updateShareScreen(val: boolean) {
        shareScreenRef.current = val;
        setShareScreen(val);
    }

    async function handleScreenShare() {
            const socket = sckt.current;

            if (shareScreenRef.current && screenTrackRef.current) {
                console.log('Stopping screen share');

                if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach(track => track.stop());
                    screenStreamRef.current = null;
                }

                if (localScreenVideo.current?.srcObject) {
                    const stream = localScreenVideo.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                    localScreenVideo.current.srcObject = null;
                }

                if (producerScreenRef.current) {
                    await producerScreenRef.current.close();
                    producerScreenRef.current = null;
                }

                screenTrackRef.current = null;
                updateShareScreen(false);
                if (socket) socket.emit('stop-sharing');
                stopSharedScreenRecording(false);
                return;
            }

            if (alreadyShared) {
                alert('Another peer is already sharing the screen.');
                return;
            }

            try {
                console.log('Starting screen share...');
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { displaySurface: 'monitor' },
                    audio: true,
                });

                const screenVideoTrack = screenStream.getVideoTracks()[0];
                if (!screenVideoTrack) throw new Error('No video track found in screen stream');

                if (screenVideoTrack.readyState === 'ended') {
                    console.warn('Screen track already ended after capture.');
                    screenStream.getTracks().forEach(track => track.stop());
                    return;
                }

                screenStreamRef.current = screenStream;
                screenTrackRef.current = screenVideoTrack;
                if (localScreenVideo.current) {
                    localScreenVideo.current.srcObject = screenStream;
                    localScreenVideo.current.muted = true;
                }

                screenVideoTrack.onended = () => {
                    console.log('Screen track ended by user/system.');
                    if (sckt.current) sckt.current.emit('stop-sharing');
                    updateShareScreen(false);
                };

                screenStream.addEventListener('inactive', () => {
                    console.log('Screen stream inactive (entire stream ended).');
                    if (sckt.current) sckt.current.emit('stop-sharing');
                    updateShareScreen(false);
                });

                if (!producerTransportRef.current) {
                    console.error('Producer transport not initialized.');
                    return;
                }

                let producerScreen: mediasoupClient.types.Producer;

                if (!producerScreenRef.current) {
                    producerScreen = await producerTransportRef.current.produce({
                        track: screenVideoTrack,
                        encodings: [{ maxBitrate: 2500000 }],
                        codecOptions: { videoGoogleStartBitrate: 2000 },
                        appData: { kind: 'screen' },
                    });
                    producerScreenRef.current = producerScreen;
                } else {
                    producerScreen = producerScreenRef.current;
                    await producerScreen.replaceTrack({ track: screenVideoTrack });
                }

                if (socket) {
                    socket.emit('resume-screen-share', {
                        roomId,
                        producerId: producerScreenRef.current.id,
                    });
                }

                updateShareScreen(true);
                console.log('Screen sharing active');
                if(shareScreenRef.current) startSharedScreenRecording();
            } catch (err) {
                if (
                    typeof err === 'object' &&
                    err !== null &&
                    'name' in err
                ) {
                    const error = err as { name: string };
                    if (error.name === 'NotAllowedError') {
                        console.warn('User denied screen sharing permission.');
                    } else if (error.name === 'NotFoundError') {
                        console.warn('No screen found to share.');
                    } else {
                        console.error('Error while trying to get display media:', err);
                    }
                } else {
                    console.error('Unknown error during screen sharing:', err);
                }
                updateShareScreen(false);
            }
    }

    async function requestStartRecording(){
        const socket=sckt.current;
        try{
            await socket?.emit('start-recording',roomId,(response : string)=>{
                console.log(response);
                if(response){
                    alert('resources are ready recording will start in few seconds.')
                    setIsRecording(true);
                    startRecording();
                    if(shareScreenRef.current) startSharedScreenRecording();
                }
                else{
                    alert('resources are not ready, please try again!');
                    return
                }
            });
        }catch(e){
            console.log('unknown error while starting recording.')
        }
    }

    async function requestStopRecording(){
        const socket=sckt.current;
        try{
            await socket?.emit('stop-recording',roomId,(response : string)=>{
                console.log(response);
                if(response){
                    alert('recording stopped successfully.')
                    setIsRecording(false);
                    stopRecording(false);
                    if(shareScreenRef.current) stopSharedScreenRecording(false);
                }
                else{
                    alert('error in stop recording, either leave the call or try again later!');
                    return
                }
            });
        }catch(e){
            console.log('unknown error while stopping recording.')
        }
    } 
    
    function startRecording(){
        if(localStreamRef.current){            
            mediaRecorderRef.current = new MediaRecorder(localStreamRef.current, {
                mimeType: "video/webm; codecs=vp8,opus"
            })
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.current.push(event.data);
                }
            }
            mediaRecorderRef.current.start(1000); 
            timeOutRef.current = setTimeout(() => {
                stopRecording(true);
            },30000);
        }
    }

    function stopRecording(flag : boolean){
        if(timeOutRef.current) {
            clearTimeout(timeOutRef.current);
            timeOutRef.current = null;
        }
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks.current, { type: "video/webm" });
                chunks.current = [];
                const timeStamp = String(Date.now());
                uploadQueue.current.push({blob : blob,type :'media',timeStamp : timeStamp});
                processUploadQueue();
            }
            mediaRecorderRef.current.stop();
        }
        if(flag) startRecording();
    }

    function createBlackMutedStream(): MediaStream {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return new MediaStream();
        let animationFrameId: number;
        function drawBlackFrame() {
            if(ctx) ctx.fillStyle = "black";
            if(ctx) ctx.fillRect(0, 0, canvas.width, canvas.height);
            animationFrameId = requestAnimationFrame(drawBlackFrame);
        }
        drawBlackFrame(); 

        const blackVideoTrack = canvas.captureStream(10).getVideoTracks()[0];

        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        oscillator.frequency.value = 0;
        const gain = audioCtx.createGain();
        gain.gain.value = 0; 
        oscillator.connect(gain).connect(audioCtx.destination);

        const dst = audioCtx.createMediaStreamDestination();
        gain.connect(dst);
        oscillator.start();

        const silentAudioTrack = dst.stream.getAudioTracks()[0];

        const fallbackStream = new MediaStream();
        if (blackVideoTrack) fallbackStream.addTrack(blackVideoTrack);
        if (silentAudioTrack) fallbackStream.addTrack(silentAudioTrack);

        return fallbackStream;
    }

    function startSharedScreenRecording(){
        if(screenStreamRef.current){
            screenRecorderRef.current = new MediaRecorder(screenStreamRef.current, {
                mimeType: "video/webm; codecs=vp8,opus"
            })
            screenRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    screenChunks.current.push(event.data);
                }
            }
            screenRecorderRef.current.start(1000);
            screenTimeOutRef.current = setTimeout(() => {
                stopSharedScreenRecording(true);
            },30000);
        }
    }

    function stopSharedScreenRecording(flag : boolean){
        if(screenTimeOutRef.current) {
            clearTimeout(screenTimeOutRef.current);
            screenTimeOutRef.current = null;
        }
        if(screenRecorderRef.current) {
            screenRecorderRef.current.onstop = () => {
                const blob = new Blob(screenChunks.current, { type: "video/webm" });
                screenChunks.current = [];
                const timeStamp = String(Date.now());
                uploadQueue.current.push({blob : blob,type : 'screen',timeStamp : timeStamp});
                processUploadQueue();
            }
            screenRecorderRef.current.stop();
        }
        if(flag) startSharedScreenRecording();
    }

    async function sendChunkToServer(blob: Blob,type : string, timeStamp: string) {
        const socket=sckt.current;
        if(!socket || !socket.id) return;
        const formData = new FormData();
        console.log(blob);
        formData.append('file', blob, `${roomId}_${socket.id}_${type}_${timeStamp}.webm`);
        try{
            console.log('sending clip to server')
            const res = await fetch(`${SERVER_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            const result = await res.json();
            console.log('Uploaded via HTTP:', result);
        }catch(e){
            console.error("Error sending chunk :", e);
            throw e;
        }
    }

    async function processUploadQueue() {
        if (isUploading.current || uploadQueue.current.length === 0) return;
        isUploading.current = true;
        const data = uploadQueue.current.shift();
        
        if (data) {
            try {
                console.log(data.type+' '+data.blob);
                await sendChunkToServer(data.blob,data.type,data.timeStamp);
            } catch (err) {
                console.error("Upload failed, re-adding to queue...");
                uploadQueue.current.unshift(data); 
            }
        }
        isUploading.current = false;
        if (uploadQueue.current.length > 0) {
            setTimeout(processUploadQueue, 100); 
        }
    }

    function leaveRoom(){
        if(isRecording){
            stopRecording(false);
            if(shareScreenRef.current) stopSharedScreenRecording(false);
        }
        if(localStreamRef.current){
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if(screenStreamRef.current){
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        if (audioTrackRef.current) {
            audioTrackRef.current.stop();
            audioTrackRef.current = null;
        }
        if (videoTrackRef.current) {
            videoTrackRef.current.stop();
            videoTrackRef.current = null;
        }
        const socket=sckt.current;
        if (socket && socket.connected) {
            socket.disconnect(); 
        }
        router.push('/pages/dashboard')
    }

    return <div className="flex h-screen w-screen bg-zinc-900">
        <div className='flex w-full backdrop-blur-xs bg-white/10 fixed top-0 px-20 py-2 gap-5 z-50'>
            <div className='px-2 py-1'>{`call : ${callName}`}</div>
            <div className='px-2 py-1'>{`roomId : ${roomId}`}</div>
            <div className='bg-white/10 px-2 py-1 border cursor-pointer rounded' onClick={handleCamera}>{!camera ? 'on camera' : 'off camera'}</div>
            <div className='bg-white/10 px-2 py-1 border cursor-pointer rounded' onClick={handleMic}>{!mic ? 'on mic' : 'off mic'}</div>
            <div className='bg-white/10 px-2 py-1 border cursor-pointer rounded' onClick={handleScreenShare}>{!shareScreen ? 'share screen' : 'stop screen sharing'}</div>
            {admin && !isRecording && <div className='bg-white/10 px-2 py-1 border cursor-pointer rounded' onClick={requestStartRecording}>record</div>}
            {admin && isRecording && <div className='bg-white/10 px-2 py-1 border cursor-pointer rounded' onClick={requestStopRecording}>stop recording</div>}
            {isRecording && <div className='px-2 py-1'>Recording</div>}
            <div className='bg-red-500 px-2 py-1 border cursor-pointer rounded' onClick={leaveRoom}>Leave</div>
        </div>
        <video ref={localVideo} playsInline autoPlay className={`fixed ${peers>0 ? 'top-16 right-5 w-56 h-30 rounded border border-gray-300' : 'top-0 left-1/2 -translate-x-1/2 w-screen h-screen rounded'} `}></video>
        <div style={{display:peers>0?'block':'none'}} className='w-[80%] overflow-y-scroll py-12'>
            <div className="flex flex-col gap-10 p-4 items-center">
                <div id="screenShared" className='border border-zinc-700 rounded w-[100%] h-[100%] flex justify-center items-center' style={{display:alreadyShared?'block':'none'}}/>
                <div className={`w-full h-auto grid grid-cols-2 gap-x-5 gap-y-6 justify-items-center px-10 py-6`}>
                    {remoteStreams.map(({ id, stream, kind }) => (
                            kind === 'video' ? (
                                <video key={id}
                                    id={id}
                                    ref={(ref) => {
                                        if (ref && stream) ref.srcObject = stream;
                                    }}
                                    autoPlay
                                    playsInline
                                    muted={false}
                                    className="bg-black rounded mb-5 w-[450px] h-[300px]"
                                />
                                ) : (
                                <audio
                                    key={id}
                                    id={id}
                                    ref={(ref) => {
                                        if (ref && stream) {
                                            ref.srcObject = stream;
                                        }
                                    }}
                                    autoPlay
                                    hidden
                                />
                            )
                    ))}
                </div >
            </div>
        </div>
    </div>
}