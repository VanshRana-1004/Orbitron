import * as mediasoupClient from 'mediasoup-client';
export async function CreateDevice(rtpCapabilities : any){
    try{
        const device=new mediasoupClient.Device();
        await device.load({
            routerRtpCapabilities : rtpCapabilities
        })
        return device;
    }catch(e){
        console.log('error in creating mediasoup device : ',e)
    }
}