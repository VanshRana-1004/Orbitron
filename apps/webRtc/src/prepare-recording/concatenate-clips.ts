import fs from 'fs/promises';
import path from 'path';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';
const exec = promisify(_exec);
import { Clip } from './finalize';

const outputDir = path.join(process.cwd(), 'concatenated-clips');

async function ensureUploadsDir() {
  try {
    await fs.access(outputDir);
  } catch {
    await fs.mkdir(outputDir);
    console.log('Created "uploads" directory');
  }
}
ensureUploadsDir();

async function ensureRoomFolder(roomId: string) {
  const roomPath = path.join(outputDir, roomId);
  try {
    await fs.access(roomPath);
  } catch {
    await fs.mkdir(roomPath);
    console.log(`Created room folder: ${roomId}`);
  }
  return roomPath;
}

export async function concatenateClips(socketId: string, clips: Clip[], type: 'media' | 'screen',roomId : string) {
 
  console.log(`concatenatng clips of type : ${type} for socketId : ${socketId} and roomId : ${roomId}`);  
  const roomPath = await ensureRoomFolder(roomId);
  const concatListPath = path.join(roomPath, `${socketId}_${type}_list.txt`);
  const outputFile = path.join(roomPath, `${socketId}@${clips[0]?.startTime}@merged.webm`);

  const listContent = clips.map(c => `file '${c.file.replace(/\\/g, '/')}'`).join('\n');
  await fs.writeFile(concatListPath, listContent);
  let duration=0;
  clips.forEach((clip)=>duration=duration+clip.duration);
  const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${outputFile}"`;
  try {
    await exec(cmd);
    console.log(`Concatenated ${type} clips for ${socketId} -> ${outputFile}`);
    return {outputFile,duration};
  } catch (err) {
    console.error(`Failed to concatenate clips for ${socketId}:`, err);
    return null;
  }
}
