import * as mediasoup from 'mediasoup';
export async function CreateWorker(){
    const worker=await mediasoup.createWorker({
        rtcMinPort:40000,
        rtcMaxPort:40999
    }) 
    console.log(`Worker pid : ${worker.pid}`);
    worker.on('died',error=>{
        console.error('medisoup worker has died')
        setTimeout(()=>process.exit(1),2000);
    })   
    return worker;
}