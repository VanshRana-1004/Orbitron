import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from 'fs';

 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY!,
  api_secret: process.env.CLOUDINARY_CLOUD_SECRET!,
  timeout: 300000
});

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`Upload attempt ${i + 1} failed. Retrying...`);
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }
  throw lastError;
}

export async function finalUploads(roomId : string){
  const finalRecordingDir=path.join('/webRtc','final-recordings');
  const finalRecordingFiles=fs.readdirSync(finalRecordingDir).filter(f=>f.startsWith(roomId));    
  for (const file of finalRecordingFiles) {
    try {
      const lastPart = file.split("_").pop();
      const clipNum = lastPart
        ? parseInt(lastPart.replace(".mp4", ""), 10)
        : NaN;

      const fullPath = path.join(finalRecordingDir, file);
      await withRetry(() => uploadClip(fullPath, roomId, clipNum));

      console.log(`${file} uploaded successfully`);
    } catch (e) {
      console.error("Error while uploading", file, e);
    }
  }
}

async function uploadClip(filePath: string, roomId: string, clipNum: number) {
  const fileSize = fs.statSync(filePath).size;

  if (fileSize < 50 * 1024 * 1024) {
    return cloudinary.uploader.upload(filePath, {
      resource_type: "video",
      folder: `recordings/${roomId}`,
      public_id: `clip_${clipNum}`,
      context: { roomId, clipNum: String(clipNum) },
    });
  } else {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(
        filePath,
        {
          resource_type: "video",
          folder: `recordings/${roomId}`,
          public_id: `clip_${clipNum}`,
          chunk_size: 5_000_000, 
          context: { roomId, clipNum: String(clipNum) },
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });
  }
}