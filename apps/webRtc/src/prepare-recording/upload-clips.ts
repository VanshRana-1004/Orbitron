import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env._CLOUD_NAME,
  api_key: process.env._CLOUD_API_KEY,
  api_secret: process.env._CLOUD_SECRET,
});


export async function uploadClips(roomId : string){
  const finalPath = path.join(process.cwd(), 'final_clips');
  
  try {
    console.log(`upload to cloudinary${roomId} `,finalPath);
    const allFiles = await fs.promises.readdir(finalPath);
    const matchedClips = allFiles
      .filter(file => file.startsWith(roomId) && file.endsWith('.webm')) 
      .map(file => path.join(finalPath, file)); 

    if (matchedClips.length === 0) {
      console.log(`No clips found for roomId: ${roomId}`);
      return;
    }

    for (const clipPath of matchedClips) {
      console.log(`Uploading: ${clipPath}`);
        
    }

  } catch (err) {
    console.error("Error in uploadClips:", err);
  }
}