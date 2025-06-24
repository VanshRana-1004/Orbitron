import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { generateSdp } from "./sdp";

export function startFfmpegRecording(ports: {
  audio?: { rtpPort: number; rtcpPort: number };
  video?: { rtpPort: number; rtcpPort: number };
  outputFile: string;
}): ChildProcess {
  console.log('Starting recording with SDP');

  const sdpText = generateSdp({
    audio: ports.audio ? { rtpPort: ports.audio.rtpPort } : undefined,
    video: ports.video ? { rtpPort: ports.video.rtpPort } : undefined
  });

  const sdpFilePath = path.join(__dirname, `../../recordings/input-${Date.now()}.sdp`);
  fs.writeFileSync(sdpFilePath, sdpText);

  const args = [
    '-protocol_whitelist', 'file,udp,rtp',
    '-i', sdpFilePath,
    '-c:a', 'copy',
    '-c:v', 'copy',
    '-f', 'webm',
    '-flags', '+global_header',
    ports.outputFile
  ];

  const ffmpeg = spawn('ffmpeg', args);

  ffmpeg.stderr.on('data', (data) =>
    console.error('[FFmpeg]', data.toString())
  );

  ffmpeg.on('exit', (code) =>
    console.log(`FFmpeg exited with code ${code}`)
  );

  return ffmpeg;
}
