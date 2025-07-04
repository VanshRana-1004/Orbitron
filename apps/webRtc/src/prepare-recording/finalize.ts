import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import {v2 as  cloudinary } from 'cloudinary';
import { getMediaStreamInfo } from './util';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET,
})

async function downloadClip(url: string, filename: string): Promise<string> {
  const folder = path.join(process.cwd(), 'clips');
  try {
    await fs.access(folder);
  } catch {
    await fs.mkdir(folder, { recursive: true });
  }

  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const outputPath = path.join(folder, filename);
  await fs.writeFile(outputPath, response.data);
  return outputPath;
}

async function getClips(roomId: string) {
    console.log("Fetching clips for roomId:", roomId);
    const result = await cloudinary.search
        .expression(`folder:recordings AND context.roomId=${roomId}`)
        .sort_by('created_at', 'desc')
        .with_field("context")
        .max_results(500)
        .execute();
    const parsedResults=result.resources.map((clip : any)=>{
        const context=clip.context || {};
        return {
            url: clip.secure_url,
            timeStamp: context.timeStamp || '',
            callName: context.callName || '',
            roomId: context.roomId || '',
            userId: context.userId || '',
            type: context.type || '',
            mediaType: context.mediaType || '',
            createdAt: clip.created_at,
            public_id: clip.public_id,
            duration: clip.duration
        }
    })
    console.log("Parsed Results:", parsedResults);
    const userStreams: Record<string, { type: string; clips: any[] }[]> = {};

    for (const clip of parsedResults) {
        const key = `${clip.userId}-${clip.type}`;
        if (!userStreams[key]) {
            userStreams[key] = [];
        }

        const start = Date.parse(clip.timeStamp);
        const end = start + clip.duration * 1000;

        const streams = userStreams[key];
        const last = streams[streams.length - 1];

        if (last && Date.parse(last.clips[last.clips.length - 1].timeStamp) + last.clips[last.clips.length - 1].duration * 1000 >= start) {
            last.clips.push(clip);
        } else {
            streams.push({ type: clip.type, clips: [clip] });
        }
    }

    for (const key in userStreams) {
        if(!userStreams[key] || userStreams[key].length === 0) continue;
        for (const stream of userStreams[key]) {
            for (const clip of stream.clips) {
                const safeFilename = `${clip.userId}-${Date.parse(clip.timeStamp)}.webm`;
                clip.localPath = await downloadClip(clip.url, safeFilename);
                const { hasAudio, hasVideo } = getMediaStreamInfo(clip.localPath);
                clip.hasAudio = hasAudio;
                clip.hasVideo = hasVideo;
            }
        }
    }
    console.log("User Streams:", userStreams);

}

export async function finalize(roomId : string){
    setTimeout(()=>{getClips(roomId)},10000);   
}