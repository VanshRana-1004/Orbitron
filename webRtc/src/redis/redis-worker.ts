import dotenv from 'dotenv';
dotenv.config();
import { Worker, Job } from "bullmq";
import { timeline } from "../layout-helpers/timeline"; 
import { finalUploads } from "../helpers/upload";
import { cleanupFiles } from "../helpers/delete-temp";

const CLIENT_URL=process.env.CLIENT_URL || 'http://localhost:3000/api/auth';

export function createRedisWorker(){
  const worker = new Worker(
    "ffmpeg-jobs",
    async (job: Job) => {
      console.log(job.id)
      const roomId = job.data.roomId;
      console.log(`Starting FFmpeg process for room ${roomId}`);
      try {
        await timeline(roomId); 
        console.log(`Finished final clips processing for room ${roomId}`);
        await finalUploads(roomId);
        console.log(`file uploaded to cloudinary for ${roomId} successfully.`);
        await cleanupFiles(roomId);
        console.log('temporary files deleted successfully for roomId : ',roomId);
      } catch (err) {
        console.error(`Error processing room ${roomId}:`, err);
        throw err; 
      }
    },
    {
      connection: { host: process.env.REDIS_HOST || "localhost", port: Number(process.env.REDIS_PORT) || 6379 },
      concurrency: 1,
    }
  );

  worker.on("completed", async (job) => {
    console.log(`Job ${job.id} completed`);
    try{
      console.log('[redis worker completed] sending recording post process done acknowledgement to next.js api for roomId : ',job.data.roomId);
      const response = await fetch(`${CLIENT_URL}/mark-recorded?roomId=${job.data.roomId}`, {
        method: "GET",
      });
      console.log(response);
      console.log("Acknowledgement from Next.js");
    }catch(e){
      console.log(e);
    }
  });
  worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err));
  worker.on("error", (err) => console.error("Worker error:", err));

  console.log("Worker is running and listening for jobs...");
} 