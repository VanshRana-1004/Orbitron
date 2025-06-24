import * as mediasoup from 'mediasoup';

export function createWebRtcTransport(router: mediasoup.types.Router){
    return new Promise(async (resolve,reject)=>{
        try{
            const webRtcTransport_Options={
                listenIps:[
                    {
                        ip:'0.0.0.0',
                        announcedIp:'127.0.0.1'
                    }
                ],
                enableUdp:true,
                enableTcp:true,
                preferUdp:true
            }
            const transport=await router.createWebRtcTransport(webRtcTransport_Options);
            console.log('Transport created successfully with id : ',transport.id);
            transport.on('dtlsstatechange',dtlsState=>{
                if(dtlsState==='closed') transport.close();
            })
            transport.on('@close',()=>{
                console.log('transport closed');
            }) 
            resolve(transport);
        }
        catch(e){
            reject(e);
        }
    })
}

export async function createPlainTransport(router : mediasoup.types.Router,rtpPort : number,rtcpPort : number){
    const plainTransport=await router.createPlainTransport({
        listenIp: { ip: '127.0.0.1' }, 
        rtcpMux: false,
        comedia: false,
    });
    await plainTransport.connect({
        ip: '127.0.0.1',
        port: rtpPort,
        rtcpPort: rtcpPort
    })
    plainTransport.on('tuple', (tuple) => {
        console.log('RTP source detected:', tuple);
    });

    console.log('plainTransport created : ',plainTransport.tuple,plainTransport.rtcpTuple);
    return plainTransport;
}
