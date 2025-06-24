export function generateSdp({ audio, video }: { audio?: { rtpPort: number }, video?: { rtpPort: number } }) {
  let sdp = `v=0
o=- 0 0 IN IP4 127.0.0.1
s=FFmpeg RTP recording
c=IN IP4 127.0.0.1
t=0 0
`;

  if (audio) {
    sdp += `m=audio ${audio.rtpPort} RTP/AVP 100
a=rtpmap:100 opus/48000/2
a=recvonly
`;
  }

  if (video) {
    sdp += `m=video ${video.rtpPort} RTP/AVP 101
a=rtpmap:101 VP8/90000
a=recvonly
`;
  }

  return sdp;
}
