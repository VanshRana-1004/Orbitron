import dotenv from "dotenv";
dotenv.config();
import { Worker,Queue } from "bullmq";

export const ffmpegQueue = new Queue("ffmpeg-jobs", {
  connection: { host: process.env.REDIS_HOST || "localhost", port: Number(process.env.REDIS_PORT) || 6379 }
});

export async function enqueueRoomJob(roomId : string) {
  await ffmpegQueue.add("final", { roomId });
  console.log('job pushed to queue')
}