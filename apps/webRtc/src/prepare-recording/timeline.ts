import { ConcatenatedClip} from "./finalize";

export interface TrimmedClip {
  type : string;
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

export function generateTimelineSegments(clips: ConcatenatedClip[]): TimelineSegment[] {

  const timePoints = new Set<number>();
  for (const clip of clips) {
    timePoints.add(clip.start);
    timePoints.add(clip.start + clip.duration);
  }

  const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);
  const timeline: TimelineSegment[] = [];

  for (let i = 0; i < sortedTimePoints.length - 1; i++) {
    const startTime = sortedTimePoints[i];
    const endTime = sortedTimePoints[i + 1];
    if(!startTime || !endTime) continue;
    const segmentDuration = endTime - startTime;

    const activeClips: TrimmedClip[] = [];

    for (const clip of clips) {
      const clipStart = clip.start;
      const clipEnd = clip.start + clip.duration;

      const overlaps = clipStart < endTime && clipEnd > startTime;
      if (overlaps) {
        const offset = Math.max(startTime - clipStart, 0);
        const duration = Math.min(clipEnd, endTime) - Math.max(clipStart, startTime);
        activeClips.push({
          type : clip.type, 
          file: clip.path,
          filePath: clip.path,
          offset,
          duration,
          originalStart: clipStart,
          originalEnd: clipEnd,
        });
      }
    }

    if (activeClips.length > 0) {
      timeline.push({
        startTime,
        endTime,
        duration: segmentDuration,
        activeCount: activeClips.length,
        clips: activeClips,
      });
    }
  }

  return timeline;
}
