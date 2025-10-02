import Peer from "./peer";
import { AppData, Consumer, PlainTransport,Router } from "mediasoup/types";
import path from "path";
import { createSdpFile } from "../helpers/create-sdp";
import { startFfmpeg } from "../helpers/ffmpeg";
import { rtpPool } from "..";
import { ChildProcessWithoutNullStreams } from "child_process";

const sdpDir=path.join('/webRtc','sdp');
const recordingDir=path.join('/webRtc','recordings');

class Room{
    public ended : boolean;
    public roomId : string;
    public router : Router | null;
    public peers : Peer[];
    public screen : string;
    public host : string;
    public orgHost : string; 
    public recording : number;
    public ffmpegProcesses: Map<string, ChildProcessWithoutNullStreams>;
    
    public screenFFmpegProcess : ChildProcessWithoutNullStreams | null;
    public screenTransport : PlainTransport | null;
    public saudioTransport : PlainTransport | null;
    public screenConsumer : Consumer | null;
    public saudioConsumer : Consumer | null;
    public screenPort : number | null;
    public saudioPort : number | null;

    constructor(roomId : string, router : Router, userId : string){
        this.ended=false;
        this.orgHost=userId; 
        this.host=userId;
        this.roomId=roomId;
        this.router=router;
        this.peers=[];
        this.screen='';
        this.recording=0;
        this.ffmpegProcesses=new Map();

        this.screenFFmpegProcess=null;
        this.screenTransport=null;
        this.saudioTransport=null;
        this.screenConsumer=null;
        this.saudioConsumer=null;
        this.screenPort=null;
        this.saudioPort=null;
    }

    getProducers() {
        const producersInfo : {id : string, kind : 'video' | 'audio', appData : AppData }[]= [];
        this.peers.forEach(peer => {
            let producer = peer.producers.cam;
            if (producer) {
                producersInfo.push({
                    id: producer.id,
                    kind: producer.kind,
                    appData: producer.appData
                });
            }
            producer=peer.producers.mic;
            if (producer) {
                producersInfo.push({
                    id: producer.id,
                    kind: producer.kind,
                    appData: producer.appData
                });
            }
            producer = peer.producers.screen;
            if (producer) {
                producersInfo.push({
                    id: producer.id,
                    kind: producer.kind,
                    appData: producer.appData
                });
            }
            producer=peer.producers.saudio;
            if (producer) {
                producersInfo.push({
                    id: producer.id,
                    kind: producer.kind,
                    appData: producer.appData
                });
            }
        });
        console.log('-----Producers Info-----', producersInfo);
        return producersInfo;
    }   

    getTransportById(transportId : string){
        const peer=this.peers.find(p=>p.downTransport?.id==transportId || p.upTransport?.id==transportId);
        if(peer){
            return (peer.downTransport?.id==transportId)?peer.downTransport:peer.upTransport;
        }
        return null
    }

    getConsumerById(consumerId : string){
        const peer=this.peers.find(p=>p.consumers.find(c=>c.id===consumerId));
        if(peer){
            return peer.consumers.find(c=>c.id===consumerId);
        }
        return null
    }

    // if for any reason ffmpeg process didn't started retry 
    private async handleRecordingFailure(peer: Peer) {
        console.log(`Cleaning up failed recording for peer ${peer.socketId}`);
        await this.stopRecording(peer);
    }

    private async tryStartRecording(
        peer: Peer,
        retries = 3,
        delay = 1000 
    ): Promise<void> {
        try {
            await this.startRecording(peer);
        } catch (err) {
            console.error(`startRecording failed for ${peer.socketId}:`, err);

            if (retries > 0) {
                console.log(`Retrying recording for ${peer.socketId} in ${delay}ms... (${retries} retries left)`);
                setTimeout(() => {
                    this.tryStartRecording(peer, retries - 1, delay);
                }, delay);
            } else {
                console.error(`Recording permanently failed for ${peer.socketId} after retries.`);
                await this.handleRecordingFailure(peer);
            }
        }
    }

    async startRecording(peer : Peer) {

        const sdpFileName=`${this.roomId}_${Date.now()}_${peer.socketId}.sdp`;
        const sdpPath=path.join(sdpDir,sdpFileName);
        if(!peer.audioConsumer || !peer.videoConsumer || !peer.audioPort || !peer.videoPort) return;

        
        createSdpFile(peer.audioConsumer,peer.videoConsumer,peer.audioPort,peer.videoPort,sdpPath);
        
        const outputFileName=`${this.roomId}_${Date.now()}_${peer.socketId}.mp4`;
        const outputPath=path.join(recordingDir,outputFileName);

        const ffmpegProc=startFfmpeg(sdpPath,outputPath); 

        ffmpegProc.on("error", (err) => {
            // console.error(`FFmpeg process error for peer ${peer.socketId}:`, err);
            this.tryStartRecording(peer);
        });

        ffmpegProc.on("exit", (code, signal) => {
            // console.warn(`FFmpeg exited for peer ${peer.socketId} with code=${code}, signal=${signal}`);
            if (code !== 0) {
                this.tryStartRecording(peer);
            }
        });

        ffmpegProc.stderr.on("data", (data) => {
            const msg = data.toString();
            if (msg.toLowerCase().includes("error")) {
                // console.error(`FFmpeg stderr [${peer.socketId}]:`, msg);
            }
        });

        this.ffmpegProcesses.set(peer.socketId, ffmpegProc);
        console.log("Recording started for peer:", peer.socketId);
        
        this.ffmpegProcesses.set(peer.socketId, ffmpegProc);
        console.log('Recording started for peer : ',peer.socketId);
    }

    async stopRecording(peer: Peer) {
        const proc = this.ffmpegProcesses.get(peer.socketId);
        if (proc) {
            proc.stdin.write("q\n"); 
            proc.stdin.end();
            peer.videoPlainTransport?.close();
            peer.audioPlainTransport?.close();
            peer.videoConsumer?.close();
            peer.audioConsumer?.close();
            if(peer.videoPort) rtpPool.releasePort(peer.videoPort);
            if(peer.audioPort) rtpPool.releasePort(peer.audioPort);
            peer.videoPort=null;
            peer.audioPort=null;    
            peer.videoConsumer=null;
            peer.audioConsumer=null;
            peer.videoPlainTransport=null;
            peer.audioPlainTransport=null;
            console.log(`FFmpeg stopped for peer ${peer.socketId}`);
        }
    }

    async getPlainTransport(){
        if(!this.router) return null;
        const transport=await this.router.createPlainTransport({
            listenIp:{ip:'0.0.0.0',announcedIp:process.env.ANNOUNCED_IP},
            rtcpMux:true,
            comedia:false,
        })
        return transport;
    }

    async getPeerReadyForRecording(peer : Peer){
        if(!this.router) return;
        if(!peer.audioPlainTransport){
            peer.audioPlainTransport=await this.getPlainTransport();
            if(peer.audioPlainTransport && peer.producers.mic){
                const audioConsumer=await peer.audioPlainTransport.consume({
                    producerId: peer.producers.mic.id,
                    rtpCapabilities: this.router.rtpCapabilities,
                    paused: false
                });
                peer.audioConsumer=audioConsumer;
                const audioPort=rtpPool.acquirePort();
                await peer.audioPlainTransport.connect({ip:'127.0.0.1',port:audioPort})
                peer.audioPort=audioPort;
                console.log('audio consumer codecs info : ',audioConsumer.rtpParameters.codecs);
            }
            console.log('audio port : ',peer.audioPlainTransport?.tuple.localPort);
        }
        if(!peer.videoPlainTransport){
            peer.videoPlainTransport=await this.getPlainTransport();
            if(peer.videoPlainTransport && peer.producers.cam){
                const videoConsumer=await peer.videoPlainTransport.consume({
                    producerId: peer.producers.cam.id,
                    rtpCapabilities: this.router.rtpCapabilities,
                    paused: false
                });
                peer.videoConsumer=videoConsumer;
                const videoPort=rtpPool.acquirePort();
                await peer.videoPlainTransport.connect({ip:'127.0.0.1',port:videoPort})
                peer.videoPort=videoPort;
                await peer.videoConsumer.requestKeyFrame();
                setInterval(async () => {
                    if (peer.videoConsumer && peer.videoConsumer.paused) return;
                    if (peer.videoConsumer && !peer.videoConsumer.closed) {
                        await peer.videoConsumer.requestKeyFrame();
                    }
                }, 500);
                console.log('video consumer codecs info : ',videoConsumer.rtpParameters.codecs);
            }
            console.log('video port : ',peer.videoPlainTransport?.tuple.localPort);
        }
    }

    // when newly joined peer is getting prepared for recording
    async createPlainTransportsForPeer(peer : Peer){
        await this.getPeerReadyForRecording(peer);
        await this.startRecording(peer);
    }

    // when already present peers are getting prepared for recording  
    async createPlainTransports(){
        for (const peer of this.peers) {
            console.log('Preparing peer:', peer.socketId);
            await this.getPeerReadyForRecording(peer);
        }

        const startRecordingPromises = this.peers.map(peer => {
            return this.startRecording(peer);
        });

        await Promise.all(startRecordingPromises); 
        console.log('All recordings started concurrently');
        this.recording=1;
    }

    // stop recording for all the peers
    async closePlainTransports(){
        for(const peer of this.peers){
            await this.stopRecording(peer);
        }
        this.recording=-1;
        console.log('closing recording');
    }

    // to prepare transport and consumer for shared screen for recording 
    async startSharedScreenRecording(peer : Peer){
        if(!this.router) return;
        
        function waitForScreenProducers(peer: Peer, timeout = 5000): Promise<void> {
            return new Promise((resolve, reject) => {
                const start = Date.now();

                const check = () => {
                if (peer.producers.screen && peer.producers.saudio) {
                    resolve();
                } else if (Date.now() - start >= timeout) {
                    reject(new Error("Timeout waiting for screen producers"));
                } else {
                    setTimeout(check, 200);
                }
                };

                check();
            });
        }

        await waitForScreenProducers(peer)
        .then(async () => {
            console.log("Both screen & audio producers ready");
            if(!this.router) return;

            if(peer.producers.screen){
                const screenTransport=await this.getPlainTransport();
                if(!screenTransport) return;
                this.screenTransport=screenTransport;
                const screenConsumer=await screenTransport.consume({
                    producerId:peer.producers.screen.id,
                    rtpCapabilities:this.router.rtpCapabilities, 
                    paused:false
                })
                this.screenConsumer=screenConsumer;
                const screenPort=rtpPool.acquirePort();
                this.screenPort=screenPort;
                await this.screenTransport.connect({ip:'127.0.0.1',port:screenPort})
                await this.screenConsumer.requestKeyFrame();
                setInterval(async () => {
                    if (this.screenConsumer && this.screenConsumer.paused) return;
                    if (this.screenConsumer && !this.screenConsumer.closed) {
                        await this.screenConsumer.requestKeyFrame();
                    }
                }, 500);
                console.log('screen consumer codecs info : ',screenConsumer.rtpParameters.codecs);
            }

            if(peer.producers.saudio){
                const saudioTransport=await this.getPlainTransport();
                if(!saudioTransport) return;
                this.saudioTransport=saudioTransport;
                const saudioConsumer=await saudioTransport.consume({
                    producerId:peer.producers.saudio.id,
                    rtpCapabilities:this.router.rtpCapabilities, 
                    paused:false
                })
                this.saudioConsumer=saudioConsumer;
                const saudioPort=rtpPool.acquirePort();
                this.saudioPort=saudioPort;
                await this.saudioTransport.connect({ip:'127.0.0.1',port:saudioPort})
                console.log('screen audio consumer codecs info : ',saudioConsumer.rtpParameters.codecs);
            }

            this.startScreenFFmpegProcess();
        })
        .catch(err => {
            console.error("Failed to get both producers:", err);
        });

    }

    // to actually start the FFmpeg process for recording screen
    async startScreenFFmpegProcess(){
        const sdpFileName=`${this.roomId}_${Date.now()}_screen.sdp`;
        const sdpPath=path.join(sdpDir,sdpFileName);
        const outputFileName=`${this.roomId}_${Date.now()}_screen.mp4`;
        const outputPath=path.join(recordingDir,outputFileName);
        if(!this.saudioConsumer || !this.screenConsumer || !this.saudioPort || !this.screenPort) return;
        console.log('Starting screen recording with params : ',{sdpPath,outputPath});
        createSdpFile(this.saudioConsumer,this.screenConsumer,this.saudioPort,this.screenPort,sdpPath);
        const ffmpegProc=startFfmpeg(sdpPath,outputPath); 
        this.screenFFmpegProcess=ffmpegProc;
        this.screenFFmpegProcess.on("exit", (code) => {
            if (code !== 0) {
                console.log("Retrying screen recording in 1s...");
                setTimeout(() => this.startScreenFFmpegProcess(), 1000);
            }
        });
        console.log('Screen Recording started');
    }

    // to stop the shared screen recording
    async stopSharedScreenRecording(){
        if(this.screenFFmpegProcess){
            this.screenFFmpegProcess.stdin.write("q\n"); 
            this.screenFFmpegProcess.stdin.end();
            this.screenTransport?.close();
            this.saudioTransport?.close();
            this.screenConsumer?.close();
            this.saudioConsumer?.close();
            if(this.screenPort) rtpPool.releasePort(this.screenPort);
            if(this.saudioPort) rtpPool.releasePort(this.saudioPort);
            this.screenPort=null;
            this.saudioPort=null;    
            this.screenConsumer=null;
            this.saudioConsumer=null;
            this.screenTransport=null;
            this.saudioTransport=null;
            this.screen='';
            console.log(`FFmpeg stopped for screen recording`);
        }
        console.log('Stopped shared screen recording');
    }
}

export default Room;