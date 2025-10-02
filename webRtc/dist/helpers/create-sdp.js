"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSdpFile = createSdpFile;
const fs_1 = __importDefault(require("fs"));
function createSdpFile(audioConsumer, videoConsumer, audioPort, videoPort, filePath) {
    const ip = process.env.ANNOUNCED_IP || '127.0.0.1';
    const audioCodec = audioConsumer?.rtpParameters.codecs[0];
    const videoCodec = videoConsumer?.rtpParameters.codecs[0];
    if (!audioCodec || !videoCodec)
        return;
    const audioPayload = audioCodec.payloadType;
    const videoPayload = videoCodec.payloadType;
    const audioType = audioCodec.mimeType.split('/')[1];
    const videoType = videoCodec.mimeType.split('/')[1];
    const audioClockrate = audioCodec.clockRate;
    const videoClockrate = videoCodec.clockRate;
    const audioChannels = audioCodec.channels || 2;
    const audioMinptime = audioCodec.parameters?.minptime || 10;
    const audioUseinbandfec = audioCodec.parameters?.useinbandfec || 1;
    const videoProfileLevelId = videoCodec.parameters?.profileLevelId || '42e01f';
    const videoLevelAsymmetryAllowed = videoCodec.parameters?.levelAsymmetryAllowed || 1;
    const videoPacketizationMode = videoCodec.parameters?.packetizationMode || 1;
    const videoSprop = videoCodec.parameters?.['sprop-parameter-sets'];
    let sdp = `v=0
o=- 0 0 IN IP4 ${ip}
s=-
c=IN IP4 ${ip}
t=0 0
m=audio ${audioPort} RTP/AVP ${audioPayload}
a=rtpmap:${audioPayload} ${audioType}/${audioClockrate}/${audioChannels}
a=fmtp:${audioPayload} minptime=${audioMinptime};useinbandfec=${audioUseinbandfec}
a=rtcp-mux
a=recvonly
m=video ${videoPort} RTP/AVP ${videoPayload}
a=rtpmap:${videoPayload} ${videoType}/${videoClockrate}
a=fmtp:${videoPayload} profile-level-id=${videoProfileLevelId};level-asymmetry-allowed=${videoLevelAsymmetryAllowed};packetization-mode=${videoPacketizationMode}${videoSprop ? `;sprop-parameter-sets=${videoSprop}` : ''}
a=rtcp-mux
a=recvonly`;
    fs_1.default.writeFileSync(filePath, sdp, 'utf-8');
    console.log('SDP file created at:', filePath);
}
