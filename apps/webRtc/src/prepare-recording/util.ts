import { spawnSync } from 'child_process';

export function getMediaStreamInfo(filePath: string): { hasAudio: boolean, hasVideo: boolean } {
    const result = spawnSync('ffprobe', [
        '-v', 'error',
        '-show_entries', 'stream=codec_type',
        '-of', 'json',
        filePath
    ]);

    if (result.error) {
        console.error(`ffprobe failed for ${filePath}:`, result.error);
        return { hasAudio: false, hasVideo: false };
    }

    try {
        const output = JSON.parse(result.stdout.toString());
        const streams = output.streams || [];
        const hasVideo = streams.some((s: any) => s.codec_type === 'video');
        const hasAudio = streams.some((s: any) => s.codec_type === 'audio');
        return { hasAudio, hasVideo };
    } catch (e) {
        console.error(`Failed to parse ffprobe output for ${filePath}:`, e);
        return { hasAudio: false, hasVideo: false };
    }
}
