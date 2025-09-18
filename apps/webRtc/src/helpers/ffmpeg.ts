import { spawn } from "child_process";

export function startFfmpeg(sdpPath: string, outputPath: string) {
  console.log('ffmpef for ',outputPath);
  const ffmpegArgs = [
    "-protocol_whitelist", "file,udp,rtp",
    "-i", sdpPath,
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-crf", "18",
    "-g", "60",
    "-c:a", "aac",
    "-b:a", "160k",
    "-async", "1",
    "-movflags", "+faststart",
    "-fflags", "+genpts",
    "-use_wallclock_as_timestamps", "1",
    outputPath
  ];

  const ffmpeg = spawn("ffmpeg", ffmpegArgs);

  ffmpeg.stdout.on("data", (data) => {
    // console.log(`FFmpeg stdout: ${data}`);
  });

  ffmpeg.stderr.on("data", (data) => {
    // console.error(`FFmpeg stderr: ${data}`);
  });

  ffmpeg.on("close", (code) => {
    // console.log(`FFmpeg exited with code ${code}`);
  });

  return ffmpeg;
}