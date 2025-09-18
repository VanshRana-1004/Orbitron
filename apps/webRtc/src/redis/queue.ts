import { Worker,Queue } from "bullmq";

export const ffmpegQueue = new Queue("ffmpeg-jobs", {
  connection: { host: "localhost", port: 6379 }
});

export async function enqueueRoomJob(roomId : string) {
  await ffmpegQueue.add("final", { roomId });
  console.log('job pushed to queue')
}
