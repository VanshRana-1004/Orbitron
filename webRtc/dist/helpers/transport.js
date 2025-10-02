"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebRtcTransport = createWebRtcTransport;
async function createWebRtcTransport(router) {
    console.log(process.env.ANNOUNCED_IP);
    const webRtcTransport_Options = {
        listenIps: [
            {
                ip: '0.0.0.0',
                announcedIp: process.env.ANNOUNCED_IP || '127.0.0.1'
            }
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        rtcpFeedback: {
            nack: true,
            pli: true,
            remb: true,
            transportCc: true,
        },
        initialAvailableOutgoingBitrate: 1000000,
        maxIncomingBitrate: 1500000,
        minPort: 40000,
        maxPort: 40999
    };
    const transport = await router.createWebRtcTransport(webRtcTransport_Options);
    console.log('Transport created successfully with id : ', transport.id);
    transport.on('dtlsstatechange', dtlsState => {
        if (dtlsState === 'closed')
            transport.close();
    });
    transport.on('@close', () => {
        console.log('transport closed');
    });
    return transport;
}
