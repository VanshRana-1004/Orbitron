import { Producer, Transport, Consumer, PlainTransport } from "mediasoup/types";

class Peer{
    public userId : string; 
    public name : string;
    public socketId : string;
    public producers : {
        cam : Producer | null,
        mic : Producer | null,
        screen : Producer | null,
        saudio : Producer | null
    }
    public upTransport : Transport | null;
    public downTransport : Transport | null;
    public consumers : Consumer[];
    public screen : boolean;
    public videoConsumer : Consumer | null;
    public audioConsumer : Consumer | null;
    public videoPlainTransport : PlainTransport | null;
    public audioPlainTransport : PlainTransport | null;
    public audioPort:number | null;
    public videoPort:number | null;

    constructor(name : string,socketId : string,userId : string){
        this.userId=userId;
        this.name=name;
        this.socketId=socketId,
        this.producers={
            cam : null,
            mic : null,
            screen : null,
            saudio : null 
        },
        this.upTransport=null,
        this.downTransport=null,
        this.consumers=[],
        this.screen=false,
        this.videoConsumer=null;
        this.audioConsumer=null;
        this.videoPlainTransport=null;
        this.audioPlainTransport=null;
        this.audioPort=null;
        this.videoPort=null;
    }
}

export default Peer;