import { Clip } from "./finalize";

export interface TrimmedClip {
  socketId: string;
  type: 'media' | 'screen';
  file: string;
  filePath: string;
  offset: number;           
  duration: number;         
  originalStart: number;
  originalEnd: number;
}

export interface TimelineSegment {
  startTime: number;
  endTime: number;
  duration: number;
  activeCount: number;
  clips: TrimmedClip[];
}

export function generateTimelineSegments(mediaClips: Record<string, Clip[]>,screenClips: Record<string, Clip[]>): TimelineSegment[] {
  const allClips: { clip: Clip; socketId: string; type: 'media' | 'screen' }[] = [];

  for (const socketId in mediaClips) {
    const clips = mediaClips[socketId];
    if (clips) {
      for (const clip of clips) {
        allClips.push({ clip, socketId, type: 'media' });
      }
    }
  }
  for (const socketId in screenClips) {
    const clips = screenClips[socketId];
    if (clips) {
      for (const clip of clips) {
        allClips.push({ clip, socketId, type: 'screen' });
      }
    }
  }

  const timePoints = new Set<number>();
  allClips.forEach(({ clip }) => {
    timePoints.add(clip.startTime);
    timePoints.add(clip.endTime);
  });

  const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);
  const timeline: TimelineSegment[] = [];

  for (let i = 0; i < sortedTimePoints.length - 1; i++) {
    const startTime = sortedTimePoints[i];
    const endTime = sortedTimePoints[i + 1];
    if(endTime && startTime){
        const segmentDuration = endTime - startTime;
        const activeClips: TrimmedClip[] = [];

        for (const { clip, socketId, type } of allClips) {
            const overlaps = clip.startTime < endTime && clip.endTime > startTime;
            if (overlaps) {
                const offset = Math.max(startTime - clip.startTime, 0);
                const duration = Math.min(clip.endTime, endTime) - Math.max(clip.startTime, startTime);
                activeClips.push({
                    socketId,
                    type,
                    file: clip.file,
                    filePath: clip.filePath,
                    offset,
                    duration,
                    originalStart: clip.startTime,
                    originalEnd: clip.endTime
                });
            }
        }

        if (activeClips.length > 0) {
            timeline.push({
                startTime,
                endTime,
                duration: segmentDuration,
                activeCount: activeClips.length,
                clips: activeClips
            });
        }
    }    
  }
  return timeline;
}
