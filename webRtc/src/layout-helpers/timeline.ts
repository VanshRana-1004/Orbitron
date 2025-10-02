import { execSync } from "child_process";
import Room from "../classes/room";
import path from "path";
import fs from "fs";
import { createLayout } from "./layout";
import { roomMap } from "..";

export type Clip = {
  file: string;
  start: number;
  end: number;
  type: string;
  audio: boolean;
  duration: number;
};

export type TimelineSegment = {
  start: number;
  end: number;
  active: Clip[];
};

function hasAudioStream(file: string): boolean {
  try {
    const out = execSync(
      `ffprobe -v error -select_streams a:0 -count_frames ` +
      `-show_entries stream=nb_read_frames ` +
      `-of default=nokey=1:noprint_wrappers=1 "${file}"`
    ).toString().trim();

    const frames = parseInt(out, 10);
    return !isNaN(frames) && frames > 0;  
  } catch {
    return false;
  }
}

function waitUntilRecordingStopped(room: Room): Promise<void> {
  return new Promise(resolve => {
    const interval=setInterval(()=>{
        let peers=true;
        let screen=true;
        for(const proc of room.ffmpegProcesses.values()){
            if(proc.exitCode===null){
                peers=false;
                break;
            }
        }
        if(room.screenFFmpegProcess && room.screenFFmpegProcess.exitCode===null){
            screen=false;
        }
        if(peers && screen){
            clearInterval(interval);
            resolve();
        }
    },1000)
  });
}

function getDuration(filePath: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
  ).toString();
  return parseFloat(out);
}

function buildTimeline(clips: Clip[]): TimelineSegment[] {
  const events: number[] = [];
  clips.forEach(c => {
    events.push(c.start, c.end);
  });

  const boundaries = Array.from(new Set(events)).sort((a, b) => a - b);

  const segments: TimelineSegment[] = [];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const segStart = boundaries[i];
    const segEnd = boundaries[i + 1];
    if(!segStart || !segEnd) continue;
    const active = clips.filter(c => c.start <= segStart && c.end >= segEnd);
    if (active.length > 0) {
      segments.push({
        start: segStart,
        end: segEnd,
        active
      });
    }
  }

  return segments;
}

const finalClipsDir=path.join('/webRtc','final-recordings');

export async function timeline(roomId : string){
    const room=roomMap[roomId];
    if(!room){
      console.log('No room find no finalize recordings')
      return;
    }
    const sdpDir=path.join('/webRtc','sdp');
    const sdpFiles = fs.readdirSync(sdpDir).filter(f => f.startsWith(room.roomId));
    if (sdpFiles.length === 0) {
        console.log(`[timeline] no recordings for room ${room.roomId}`);
        return;
    }

    await waitUntilRecordingStopped(room);
    
    console.log(`[timeline] all recordings for room ${room.roomId} have stopped and all ffmpeg processes have finished`);

    const recordingDir=path.join('/webRtc','recordings');
    const recordingFiles=fs.readdirSync(recordingDir).filter(f=>f.startsWith(room.roomId));

    console.log(recordingFiles);

    const clips  : Clip[]= recordingFiles.map(file => {
        const fullPath = path.join(recordingDir, file);
        const duration = getDuration(fullPath);

        const [roomId, ts, lastPart] = file.split("_");
        const timestamp = Number(ts);
        const base = lastPart?.replace(/\..+$/, ""); 
        const audio=hasAudioStream(fullPath);

        const  type: "screen" | "peer"=(base==='screen')?base:'peer';

        const start = parseInt(ts!, 10);
        const end = start + duration * 1000;

        return { file: fullPath, start, end, type, audio, duration };
    });
    console.log(clips);

    const finalTimeLine : TimelineSegment[]=buildTimeline(clips);
    console.log('Final Time line : ');
    finalTimeLine.forEach((segment : TimelineSegment)=>{
      console.log('segment start : ',segment.start)
      console.log('segment end : ',segment.end);
      console.log('Clips : ')
      segment.active.forEach((clip : Clip)=>{
        console.log(clip);
      })
    })
    
    let clipNum=0;
    let ind=0;
    for (const segment of finalTimeLine) {
      const duration=Math.max(0,(segment.end-segment.start))/1000;
      if(duration<2){
        console.log(`duration is very small can't record this segment ${ind}`);
      } 
      else{
        console.log(`recording for segement ${ind}`)
        clipNum++;
        const outputFile = `${room.roomId}_${clipNum}.mp4`;
        const outputPath=path.join(finalClipsDir,outputFile);
        await createLayout(segment, outputPath); 
      }
      ind++;
    }
}