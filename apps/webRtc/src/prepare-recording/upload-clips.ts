import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

export async function uploadClips(roomId: string) {
  const finalPath = path.join(process.cwd(), 'final_clips');

  try {
    const allFiles = await fs.promises.readdir(finalPath);

    const matchedClips = allFiles
      .filter(file => file.endsWith('.webm'))
      .map(file => {
        const ext = path.extname(file); 
        const base = path.basename(file, ext);
        const lastUnderscoreIndex = base.lastIndexOf('_');

        if (lastUnderscoreIndex === -1) return null;

        const maybeRoomId = base.slice(0, lastUnderscoreIndex);
        const indexStr = base.slice(lastUnderscoreIndex + 1);
        const index = Number(indexStr);

        if (maybeRoomId !== roomId || isNaN(index)) return null;

        return {
          file,
          index,
          fullPath: path.join(finalPath, file),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.index - b!.index) as { file: string; index: number; fullPath: string }[];

    if (matchedClips.length === 0) {
      console.log(`No clips found for roomId: ${roomId}`);
      return;
    }

    for (const { file, index, fullPath } of matchedClips) {
      console.log(`Uploading: ${file} (index: ${index})`);

      const result = await cloudinary.uploader.upload(fullPath, {
        resource_type: "video",
        folder: `orbitron/${roomId}`,
        public_id: `${roomId}_${index}`,
        context: {
          roomId,
          index: index.toString(),
        },
        tags: [roomId, `clip_${index}`],
      });

      console.log(`Uploaded: ${file} → ${result.secure_url}`);
    }

    console.log("All clips uploaded successfully.");
  } catch (err) {
    console.error("Error in uploadClips:", err);
  }
}
