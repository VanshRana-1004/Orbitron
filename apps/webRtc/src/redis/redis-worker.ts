import { Worker, Job } from "bullmq";
import { timeline } from "../layout-helpers/timeline"; 
import { finalUploads } from "../helpers/upload";
import { cleanupFiles } from "../helpers/delete-temp";

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
      connection: { host: "localhost", port: 6379 },
      concurrency: 1,
    }
  );

  worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
  worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err));
  worker.on("error", (err) => console.error("Worker error:", err));

  console.log("Worker is running and listening for jobs...");
}