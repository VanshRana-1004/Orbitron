import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { generateTimelineSegments } from './timeline';
import { layoutGeneration } from './layout';
import { concatenateClips } from './concatenate-clips';
import { uploadClips } from './upload-clips';

const execAsync = promisify(exec);

export interface Clip{
    file : string,
    filePath : string,
    startTime : number,
    endTime : number,
    duration : number
}

export interface ConcatenatedClip{
  path : string,
  start : number,
  duration : number,
  type : string
}

const rootDir = path.join(process.cwd());

const clipUsed : Record<string,boolean>={}
const roomId_socketId : Record<string,string[]>={};
const socketId_media_clips : Record<string,Clip[]>={}; 
const socketId_screen_clips : Record<string,Clip[]>={};
const roomId_clips : Record<string,ConcatenatedClip[]>={}
const finalCall : Record<string,boolean>={};
const LAST_CLIP_TIME: Record<string, number> = {};
const POLL_INTERVAL = 45000;
const MAX_IDLE_TIME = 2 * POLL_INTERVAL;


async function ensureUploadsDir() {
  const normalizedDir = path.join(rootDir, 'normalized');
  try {
    await fs.promises.access(normalizedDir);
  } catch {
    await fs.promises.mkdir(normalizedDir);
    console.log('Created "uploads" directory');
  }
}
ensureUploadsDir();

async function deleteHelpingClips(roomId : string){
  console.log(`deleting uploads/${roomId}, normalized/${roomId} && concatenated-clips/${roomId}`);
  const uploadsPath = path.join(rootDir, 'uploads', roomId);
  const normalizedPath = path.join(rootDir, 'normalized', roomId);
  const concatenatedPath = path.join(rootDir, 'concatenated-clips', roomId);
  console.log(`deleting ${uploadsPath}, ${normalizedPath} && ${concatenatedPath}`);
  try{
    await Promise.all([
      fs.promises.rm(uploadsPath, { recursive: true, force: true }),
      fs.promises.rm(normalizedPath, { recursive: true, force: true }),
      fs.promises.rm(concatenatedPath, { recursive: true, force: true }),
    ]);
    console.log("Temporary folders deleted successfully.");
  }catch(e){
    console.log('unable to delete Helping folders.');
  }
}

async function ensureRoomDir(roomId: string): Promise<string> {
  const normalizedDir = path.join(rootDir, 'normalized');
  const roomDir = path.join(normalizedDir, roomId);
  try {
    await fs.promises.access(roomDir);
  } catch {
    await fs.promises.mkdir(roomDir, { recursive: true });
    console.log(`Created normalized folder for room: ${roomId}`);
  }
  return roomDir;
}

async function hasVideo(file: string): Promise<boolean> {
  const { stdout } = await execAsync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=codec_type -of csv=p=0 "${file}"`
  );
  return stdout.trim() === 'video';
}

async function hasAudio(file: string): Promise<boolean> {
  const { stdout } = await execAsync(
    `ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 "${file}"`
  );
  return stdout.trim() === 'audio';
}

async function getDurationFromFile(filePath: string): Promise<number> {
  try {
    const safePath = filePath.replace(/\\/g, '/');
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${safePath}"`
    );
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? NaN : duration;
  } catch {
    return NaN;
  }
}

async function getDuration(filePath : string,roomId : string) {
  const roomDir = await ensureRoomDir(roomId);
  const base = path.basename(filePath, path.extname(filePath));
  const normalizedFile = `${base}_normalized.webm`;
  const normalizedPath = path.join(roomDir, normalizedFile);
  try {
    await fs.promises.access(filePath);
    const inputHasVideo = await hasVideo(filePath);
    const inputHasAudio = await hasAudio(filePath);
    const originalDuration = await getDurationFromFile(filePath);
    const fallbackDuration = isNaN(originalDuration) ? 5 : originalDuration;
    let cmd = '';
    if (inputHasVideo && inputHasAudio) {
      cmd = `ffmpeg -y -i "${filePath}" -c:v libvpx -crf 30 -b:v 1M -pix_fmt yuv420p -c:a libvorbis "${normalizedPath}"`;
    } else if (inputHasVideo && !inputHasAudio) {
      cmd = `ffmpeg -y -i "${filePath}" -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -shortest -c:v libvpx -crf 30 -b:v 1M -pix_fmt yuv420p -c:a libvorbis "${normalizedPath}"`;
    } else if (!inputHasVideo && inputHasAudio) {
      cmd = `ffmpeg -y -f lavfi -i color=black:s=640x480:d=${fallbackDuration} -i "${filePath}" -shortest -c:v libvpx -crf 30 -b:v 1M -pix_fmt yuv420p -c:a libvorbis "${normalizedPath}"`;
    } else {
      cmd = `ffmpeg -y -f lavfi -i color=black:s=640x480:d=${fallbackDuration} -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -shortest -c:v libvpx -crf 30 -b:v 1M -pix_fmt yuv420p -c:a libvorbis "${normalizedPath}"`;
    }
    await execAsync(cmd);
    const finalDuration = await getDurationFromFile(normalizedPath);
    return {
      duration: finalDuration,
      normalizedPath,
    };
  } catch (err) {
    console.error("Error normalizing or getting duration:", filePath, "\n", err);
    try { await fs.promises.unlink(normalizedPath); } catch {}
    return null;
  }
}

function isDuplicateClip(existing: Clip[], newClip: Clip): boolean {
  return existing.some(
    (clip) =>
      clip.file === newClip.file &&
      clip.filePath === newClip.filePath &&
      clip.duration === newClip.duration &&
      clip.startTime === newClip.startTime
  );
}

async function collectCLips(RoomID : string){
    const uploadsPath = path.join(process.cwd(), 'uploads');
    const dir = path.join(uploadsPath, RoomID);
    const files = await fs.promises.readdir(dir);
    console.log('ask for clips : ');
    const webmFiles = files
        .filter(f => f.startsWith(RoomID) && f.endsWith('.webm'))
        .filter(f => !clipUsed[f]);
    if(webmFiles.length==0) return false; 
    for (const file of webmFiles) {
        clipUsed[file] = true;
        const filePath = path.join(dir, file);
        const result = await getDuration(filePath,RoomID);
        // console.log(result);
        if(!result) return;
        const [roomId, socketId, type, timestampWithExt] = file.split('@');
        console.log(file);
        const timestamp = timestampWithExt ? timestampWithExt.replace('.webm', '') : '';
        // console.log(timestamp);
        if(roomId && !roomId_socketId[roomId]) roomId_socketId[roomId]=[]
        if(roomId && socketId && !roomId_socketId[roomId]?.includes(socketId)) roomId_socketId[roomId]?.push(socketId);
        const startTime = Number(timestamp) - result.duration * 1000;
        const clip = {
            file : result.normalizedPath,
            filePath,
            startTime,
            endTime: Number(timestamp),
            duration : result.duration
        };
        // console.log(clip);
        if (roomId && socketId) {
            if(type == 'screen'){
              if(!socketId_screen_clips[socketId]) socketId_screen_clips[socketId]=[]
              const alreadyExists = socketId_screen_clips[socketId].some(c => c.file === file);
              if(!alreadyExists && !Number.isNaN(clip.duration)){
                if (!isDuplicateClip(socketId_screen_clips[socketId], clip)) {
                  socketId_screen_clips[socketId].push(clip);
                }
              } 
            }
            if(type == 'media'){
              if(!socketId_media_clips[socketId]) socketId_media_clips[socketId]=[]
              const alreadyExists = socketId_media_clips[socketId].some(c => c.file === file);
              if(!alreadyExists && !Number.isNaN(clip.duration)){
                if (!isDuplicateClip(socketId_media_clips[socketId], clip)) {
                  socketId_media_clips[socketId].push(clip);
                }
              } 
            }
        }
    }
    return true;
}

export async function pollUntilInactive(roomId: string, ask : boolean) {
    if(ask){
      const now = Date.now();
      if (!LAST_CLIP_TIME[roomId]) LAST_CLIP_TIME[roomId] = now;
      const newClipsFound = await collectCLips(roomId);
      if (newClipsFound) LAST_CLIP_TIME[roomId] = now;
      const lastTime = LAST_CLIP_TIME[roomId] ?? now;
      const timeSinceLast = now - lastTime;
      if (timeSinceLast >= MAX_IDLE_TIME) {
          if(finalCall[roomId]==true) return;
          finalCall[roomId]=true;
          console.log(`Room ${roomId} is inactive. Starting final processing...`);
          await generateFinalMergedVideo(roomId);
          return;
      }
      setTimeout(() => pollUntilInactive(roomId,true), POLL_INTERVAL);
    }
    else{
      console.log(`Room ${roomId} is inactive. Starting final processing... explicitly called `);
      await collectCLips(roomId);
      if(finalCall[roomId]==true) return;
      finalCall[roomId]=true;
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
  console.log(scopedMediaClips);
  console.log(scopedScreenClips)

  for (const socketId of socketIds) {
    if (scopedMediaClips[socketId]) {
      const result=await concatenateClips(socketId, scopedMediaClips[socketId], 'media',roomId);
      if(result){
        let startTime=scopedMediaClips[socketId][0]?.startTime;
        if(startTime) startTime=startTime/1000; 
        const clip : ConcatenatedClip={
          path : result.outputFile,
          start : startTime || 0,
          duration : result.duration,
          type : 'media',
        }
        if(!roomId_clips[roomId]) roomId_clips[roomId]=[];
        roomId_clips[roomId].push(clip);
      }
    }
    if (scopedScreenClips[socketId]) {
      const result=await concatenateClips(socketId, scopedScreenClips[socketId], 'screen',roomId);
      if(result){
        let startTime=scopedScreenClips[socketId][0]?.startTime;
        if(startTime) startTime=startTime/1000; 
        const clip : ConcatenatedClip={
          path : result.outputFile,
          start : startTime || 0,
          duration : result.duration,
          type : 'screen'
        }
        if(!roomId_clips[roomId]) roomId_clips[roomId]=[];
        roomId_clips[roomId].push(clip);
      }
    }
  }

  console.log(`concatenated clips for ${roomId} : `,roomId_clips[roomId]);
  if(roomId_clips[roomId]){
    const timeline = generateTimelineSegments(roomId_clips[roomId]);
    console.log(timeline);
    timeline.forEach((group)=>{
      console.log(group);
    })
    for(let i=0;i<timeline.length;i++){
      const segment=timeline[i];
      if(segment){
        console.log('generating layout for segement with index : ',i);
        await layoutGeneration(segment,roomId,i);
      }
    }
  }

  // clips to cloudinary
  await uploadClips(roomId);

  // delte temp files
  await deleteHelpingClips(roomId);

}
