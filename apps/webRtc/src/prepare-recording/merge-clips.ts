// step 1 : get all the files in input along with roomId and userId   
// step 2 : normalizing them to same codecs  
// step 3 : used the normalized clips to create a single video with the same codec and resolution
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function getDuration(file: string): Promise<number> {
  const { stdout } = await execPromise(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`);
  return parseFloat(stdout.trim());
}

async function normalizeClip(inputPath: string, outputPath: string): Promise<void> {
  const cmd = `ffmpeg -y -i "${inputPath}" -c:v libvpx -b:v 1M -c:a libvorbis "${outputPath}"`;
  await execPromise(cmd);
}

export async function mergeClips(clips: any[], type: string, roomId: string,userId : string,timeStamp : string) {
  const folder = path.join(process.cwd(), 'updated-clips',roomId);
  try {
    await fs.access(folder);
  } catch {
    await fs.mkdir(folder, { recursive: true });
  }

  // Normalize clips
  await Promise.all(clips.map(async (f) => {
    const filename = path.basename(f.localPath); 
    const outputPath = path.join(folder, `${type}-${filename}_norm.webm`);
    await normalizeClip(f.localPath, outputPath);
  }));

  // Read normalized clips
  const normFiles = await fs.readdir(folder);
  const normWebmFiles = normFiles
    .filter(f => f.startsWith(type) && f.includes(userId) && f.endsWith('.webm'))
    .map(f => path.join(folder, f));

  const inputsArray: string[] = [];
  const filterParts: string[] = [];
  let inputIndex = 0;

  for (const file of normWebmFiles) {
    const { stdout } = await execPromise(`ffprobe -v error -show_entries stream=codec_type -of csv=p=0 "${file}"`);
    const hasVideo = stdout.includes("video");
    const hasAudio = stdout.includes("audio");

    inputsArray.push(`-i "${file}"`);
    const baseIndex = inputIndex;
    inputIndex++;

    let videoLabel = '';
    let audioLabel = '';

    if (hasVideo) {
      videoLabel = `[${baseIndex}:v:0]`;
    } else {
      const duration = await getDuration(file);
      inputsArray.push(`-f lavfi -t ${duration} -i color=size=640x480:rate=30:color=black`);
      videoLabel = `[${inputIndex}:v:0]`;
      inputIndex++;
    }

    if (hasAudio) {
      audioLabel = `[${baseIndex}:a:0]`;
    } else {
      const duration = await getDuration(file);
      inputsArray.push(`-f lavfi -t ${duration} -i anullsrc=channel_layout=mono:sample_rate=48000`);
      audioLabel = `[${inputIndex}:a:0]`;
      inputIndex++;
    }

    filterParts.push(`${videoLabel}${audioLabel}`);
  }

  const inputs = inputsArray.join(' ');
  const filter = `${filterParts.join('')}concat=n=${normWebmFiles.length}:v=1:a=1[outv][outa]`;
  const outputFilePath = path.join(folder, `${type}-${Date.parse(timeStamp)}-${userId}-final_output.webm`);

  const cmd = `ffmpeg ${inputs} -filter_complex "${filter}" -map "[outv]" -map "[outa]" -c:v libvpx -b:v 1M -c:a libvorbis "${outputFilePath}"`;

  console.log("Running:", cmd);
  await execPromise(cmd);
  console.log("Merged video saved to", outputFilePath);
}