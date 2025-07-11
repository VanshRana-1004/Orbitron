import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { generateTimelineSegments } from './timeline';
import { layoutGeneration } from './layout';

const execAsync = promisify(exec);

export interface Clip{
    file : string,
    filePath : string,
    startTime : number,
    endTime : number,
    duration : number
}

async function getDuration(filePath : string) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, path.extname(filePath));
  const normalizedPath = path.join(dir, `${base}_normalized.webm`);
  try {
    await fs.access(filePath);
    const normalizeCmd = `ffmpeg -y -i "${filePath}" -c copy "${normalizedPath}"`;
    await execAsync(normalizeCmd);
    const safePath = normalizedPath.replace(/\\/g, '/');
    const probeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${safePath}"`;
    const { stdout } = await execAsync(probeCmd);
    const duration = parseFloat(stdout.trim());
    await fs.unlink(normalizedPath);
    return isNaN(duration) ? NaN : duration;
  } catch (err) {
    console.error("Error getting duration for", filePath, "\n", err);
    try { await fs.unlink(normalizedPath); } catch {}
    return NaN;
  }
}

const clipUsed : Record<string,boolean>={}
const roomId_socketId : Record<string,string[]>={};
const socketId_media_clips : Record<string,Clip[]>={}; 
const socketId_screen_clips : Record<string,Clip[]>={};

async function collectCLips(roomId : string){
    const uploadsPath = path.join(process.cwd(), 'uploads');
    const dir = path.join(uploadsPath, roomId);
    const files = await fs.readdir(dir);
    console.log('ask for clips : ');
    const webmFiles = files
        .filter(f => f.startsWith(roomId) && f.endsWith('.webm'))
        .filter(f => !clipUsed[f]);
    if(webmFiles.length==0) return false; 
    for (const file of webmFiles) {
        clipUsed[file] = true;
        const filePath = path.join(dir, file);
        const duration = await getDuration(filePath);
        console.log(duration);
        const [roomId, socketId, type, timestampWithExt] = file.split('_');
        const timestamp = timestampWithExt ? timestampWithExt.replace('.webm', '') : '';
        console.log(timestamp);
        if(roomId && !roomId_socketId[roomId]) roomId_socketId[roomId]=[]
        if(roomId && socketId && !roomId_socketId[roomId]?.includes(socketId)) roomId_socketId[roomId]?.push(socketId);
        const startTime = Number(timestamp) - duration * 1000;
        const clip = {
            file,
            filePath,
            startTime,
            endTime: Number(timestamp),
            duration
        };
        if (roomId && socketId) {
            if(type == 'screen'){
              if(!socketId_screen_clips[socketId]) socketId_screen_clips[socketId]=[]
              const alreadyExists = socketId_screen_clips[socketId].some(c => c.file === file);
              if(!alreadyExists && !Number.isNaN(clip.duration)) socketId_screen_clips[socketId].push(clip);
            }
            if(type == 'media'){
              if(!socketId_media_clips[socketId]) socketId_media_clips[socketId]=[]
              const alreadyExists = socketId_media_clips[socketId].some(c => c.file === file);
              if(!alreadyExists && !Number.isNaN(clip.duration)) socketId_media_clips[socketId].push(clip);
            }
        }
    }
    return true;
}

const LAST_CLIP_TIME: Record<string, number> = {};
const POLL_INTERVAL = 45000;
const MAX_IDLE_TIME = 2 * POLL_INTERVAL;
const IS_POLLING: Record<string, boolean> = {};

export async function pollUntilInactive(roomId: string, ask : boolean) {
    if(ask){
      const now = Date.now();
      if (!LAST_CLIP_TIME[roomId]) LAST_CLIP_TIME[roomId] = now;
      const newClipsFound = await collectCLips(roomId);
      if (newClipsFound) LAST_CLIP_TIME[roomId] = now;
      const lastTime = LAST_CLIP_TIME[roomId] ?? now;
      const timeSinceLast = now - lastTime;
      if (timeSinceLast >= MAX_IDLE_TIME) {
          console.log(`Room ${roomId} is inactive. Starting final processing...`);
          await generateFinalMergedVideo(roomId); // Replace with your final layout logic
          return;
      }
      setTimeout(() => pollUntilInactive(roomId,true), POLL_INTERVAL);
    }
    else{
      console.log(`Room ${roomId} is inactive. Starting final processing... explicitly called `);
      await collectCLips(roomId);
      await generateFinalMergedVideo(roomId); 
    }
}

async function generateFinalMergedVideo(roomId : string){
  console.log('request to generate timeline : ');
  const socketIds = roomId_socketId[roomId] ?? [];

  const scopedMediaClips: Record<string, Clip[]> = {};
  const scopedScreenClips: Record<string, Clip[]> = {};

  for (const socketId of socketIds) {
    if (socketId_media_clips[socketId]) {
      scopedMediaClips[socketId] = [...socketId_media_clips[socketId]].sort(
        (a, b) => a.startTime - b.startTime
      );
    }
    if (socketId_screen_clips[socketId]) {
      scopedScreenClips[socketId] = [...socketId_screen_clips[socketId]].sort(
        (a, b) => a.startTime - b.startTime
      );
    }
  }
  const timeline = generateTimelineSegments(scopedMediaClips, scopedScreenClips);
  console.log(timeline);
  for(let i=0;i<timeline.length;i++){
    const segment=timeline[i];
    if(segment){
      console.log('generating layout for segement with index : ',i);
      await layoutGeneration(segment,roomId,i);
    }
  }
}

// now i have clips with their startTime,endTime and duration 
// next step is to sort them based on their timestamp