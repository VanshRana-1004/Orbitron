import { exec } from 'child_process';
import path, { dirname } from 'path';
import { promisify } from 'util';
import fs from 'fs/promises';
import { TimelineSegment } from "./timeline"; 

const execPromise = promisify(exec);

const inputDir=path.join(__dirname,'../../uploads');
const outputDir = path.join(__dirname, '../../final_clips');
async function ensureOutputFolder() {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`Output folder created at: ${outputDir}`);
  } catch (err) {
    console.error('Failed to create output folder:', err);
  }
}
ensureOutputFolder();

export async function layoutGeneration(segment : TimelineSegment,roomId : string,index : number){
    const inputPath=path.join(inputDir,roomId);
    const outputPath=path.join(outputDir, `${roomId}_${index}.webm`);
    const clips=segment.clips;
    const screenClips=clips.filter((clip)=>clip.type==='screen');
    const mediaClips=clips.filter((clip)=>clip.type!=='screen');
    const duration=segment.duration/1000;
    const mediaOffsets : number[]=[];
    mediaClips.forEach((clip)=>mediaOffsets.push(clip.offset/1000));
    let screenOffset : number | undefined=screenClips[0]?.offset;
    if(screenOffset) screenOffset=screenOffset/1000;
    const count=segment.activeCount;
    console.log(duration);

    screenClips.forEach(clip => {
        if (!path.isAbsolute(clip.file)) {
            clip.file = path.join(inputPath, clip.file);
        }
    });

    mediaClips.forEach(clip => {
        if (!path.isAbsolute(clip.file)) {
            clip.file = path.join(inputPath, clip.file);
        }
    });

    const screenCmd0 = `ffmpeg -y -f lavfi -i color=c=white:s=1333x749:d=${duration} -ss ${screenOffset} -i "${screenClips[0]?.file}" \ -filter_complex "[1:v]scale=w=1333:h=749:force_original_aspect_ratio=decrease[overlayed];[0:v][overlayed]overlay=2:2" -t ${duration} -c:v libvpx -b:v 5M -crf 10 -quality good -cpu-used 0 -pix_fmt yuv420p "${outputPath}"`;
    const screenCmd1 = `ffmpeg -y -f lavfi -i color=c=white:s=1333x749:d=${duration} -ss ${screenOffset} -i "${screenClips[0]?.file}" -ss ${mediaOffsets[0]} -i "${mediaClips[0]?.file}" -filter_complex "[1:v]scale=950:534:force_original_aspect_ratio=decrease[sc1];[2:v]scale=377:270:force_original_aspect_ratio=decrease[sc2];[0:v][sc1]overlay=2:2[tmp1];[tmp1][sc2]overlay=954:477" -t ${duration} -c:v libvpx -b:v 5M -crf 10 -quality good -cpu-used 0 -pix_fmt yuv420p "${outputPath}"`;
    const screenCmd2 = `ffmpeg -y -f lavfi -i color=c=white:s=1333x749:d=${duration} -ss ${screenOffset} -i "${screenClips[0]?.file}" -ss ${mediaOffsets[0]} -i "${mediaClips[0]?.file}" -ss ${mediaOffsets[1]} -i "${mediaClips[1]?.file}" -filter_complex "[1:v]scale=904:507:force_original_aspect_ratio=decrease[sc1];[2:v]scale=377:270:force_original_aspect_ratio=decrease[sc2];[3:v]scale=377:270:force_original_aspect_ratio=decrease[sc3];[0:v][sc1]overlay=2:121[tmp1];[tmp1][sc2]overlay=908:375[tmp2];[tmp2][sc3]overlay=908:2" -t ${duration} -c:v libvpx -b:v 5M -crf 10 -quality good -cpu-used 0 -pix_fmt yuv420p "${outputPath}"`;
    const screenCmd3 = `ffmpeg -y -f lavfi -i color=c=white:s=1333x749:d=${duration} -ss ${screenOffset} -i "${screenClips[0]?.file}" -ss ${mediaOffsets[0]} -i "${mediaClips[0]?.file}" -ss ${mediaOffsets[1]} -i "${mediaClips[1]?.file}" -ss ${mediaOffsets[2]} -i "${mediaClips[2]?.file}" -filter_complex "[1:v]scale=904:507:force_original_aspect_ratio=decrease[sc1];[2:v]scale=380:247:force_original_aspect_ratio=decrease[sc2];[3:v]scale=380:247:force_original_aspect_ratio=decrease[sc3];[4:v]scale=380:247:force_original_aspect_ratio=decrease[sc4];[0:v][sc1]overlay=16:121[tmp1];[tmp1][sc2]overlay=936:2[tmp2];[tmp2][sc3]overlay=936:251[tmp3];[tmp3][sc4]overlay=936:500" -t ${duration} -c:v libvpx -b:v 5M -crf 10 -quality good -cpu-used 0 -pix_fmt yuv420p "${outputPath}"`;
    const screenCmd4 = `ffmpeg -y -f lavfi -i color=c=white:s=1333x749:d=${duration} -ss ${screenOffset} -i "${screenClips[0]?.file}" -ss ${mediaOffsets[0]} -i "${mediaClips[0]?.file}" -ss ${mediaOffsets[1]} -i "${mediaClips[1]?.file}" -ss ${mediaOffsets[2]} -i "${mediaClips[2]?.file}" -ss ${mediaOffsets[3]} -i "${mediaClips[3]?.file}" -filter_complex "[1:v]scale=904:507:force_original_aspect_ratio=decrease[sc1];[2:v]scale=300:236:force_original_aspect_ratio=decrease[sc2];[3:v]scale=300:236:force_original_aspect_ratio=decrease[sc3];[4:v]scale=423:371:force_original_aspect_ratio=decrease[sc4];[5:v]scale=423:371:force_original_aspect_ratio=decrease[sc5];[0:v][sc1]overlay=2:2[tmp1];[tmp1][sc2]overlay=103:511[tmp2];[tmp2][sc3]overlay=506:511[tmp3];[tmp3][sc4]overlay=908:375[tmp4];[tmp4][sc5]overlay=908:2" -t ${duration} -c:v libvpx -b:v 5M -crf 10 -quality good -cpu-used 0 -pix_fmt yuv420p "${outputPath}"`;
    const screenCmd5 = `ffmpeg -y -f lavfi -i color=c=white:s=1333x749:d=${duration} -ss ${screenOffset} -i "${screenClips[0]?.file}" -ss ${mediaOffsets[0]} -i "${mediaClips[0]?.file}" -ss ${mediaOffsets[1]} -i "${mediaClips[1]?.file}" -ss ${mediaOffsets[2]} -i "${mediaClips[2]?.file}" -ss ${mediaOffsets[3]} -i "${mediaClips[3]?.file}" -ss ${mediaOffsets[4]} -i "${mediaClips[4]?.file}" -filter_complex "[1:v]scale=904:507:force_original_aspect_ratio=decrease[sc1];[2:v]scale=300:236:force_original_aspect_ratio=decrease[sc2];[3:v]scale=300:236:force_original_aspect_ratio=decrease[sc3];[4:v]scale=300:236:force_original_aspect_ratio=decrease[sc4];[5:v]scale=423:371:force_original_aspect_ratio=decrease[sc5];[6:v]scale=423:371:force_original_aspect_ratio=decrease[sc6];[0:v][sc1]overlay=2:2[tmp1];[tmp1][sc2]overlay=2:511[tmp2];[tmp2][sc3]overlay=304:511[tmp3];[tmp3][sc4]overlay=606:511[tmp4];[tmp4][sc5]overlay=908:375[tmp5];[tmp5][sc6]overlay=908:2" -t ${duration} -c:v libvpx -b:v 5M -crf 10 -quality good -cpu-used 0 -pix_fmt yuv420p "${outputPath}"`;

    const mediaCmd1 = `ffmpeg -y -f lavfi -i color=c=white:s=1333x749:d=${duration} -ss ${mediaOffsets[0]} -i "${mediaClips[0]?.file}" \ -filter_complex "[1:v]scale=w=1333:h=749:force_original_aspect_ratio=decrease[overlayed];[0:v][overlayed]overlay=2:2" -t ${duration} -c:v libvpx -b:v 5M -crf 10 -quality good -cpu-used 0 -pix_fmt yuv420p "${outputPath}"`;
    const mediaCmd2=`ffmpeg -y -f lavfi -i color=c=white:s=1333x749:d=${duration} -ss ${mediaOffsets[0]} -i "${mediaClips[0]?.file}" -ss ${mediaOffsets[1]} -i "${mediaClips[1]?.file}" -filter_complex "[1:v]scale=620:480:force_original_aspect_ratio=decrease[sc1];[2:v]scale=620:480:force_original_aspect_ratio=decrease[sc2];[0:v][sc1]overlay=31:134[tmp1];[tmp1][sc2]overlay=682:134" -t ${duration} -c:v libvpx -b:v 5M -crf 10 -quality good -cpu-used 0 -pix_fmt yuv420p "${outputPath}"`;
    const mediaCmd3=`ffmpeg -y -f lavfi -i color=c=white:s=1333x749:d=${duration} -ss ${mediaOffsets[0]} -i "${mediaClips[0]?.file}" -ss ${mediaOffsets[1]} -i "${mediaClips[1]?.file}" -ss ${mediaOffsets[2]} -i "${mediaClips[2]?.file}" -filter_complex "[1:v]scale=500:350:force_original_aspect_ratio=decrease[sc1];[2:v]scale=500:350:force_original_aspect_ratio=decrease[sc2];[3:v]scale=500:350:force_original_aspect_ratio=decrease[sc3];[0:v][sc1]overlay=158:16[tmp1];[tmp1][sc2]overlay=674:16[tmp2];[tmp2][sc3]overlay=416:382" -t ${duration} -c:v libvpx -b:v 5M -crf 10 -quality good -cpu-used 0 -pix_fmt yuv420p "${outputPath}"`;
    const mediaCmd4=`ffmpeg -y -f lavfi -i color=c=white:s=1333x749:d=${duration} -ss ${mediaOffsets[0]} -i "${mediaClips[0]?.file}" -ss ${mediaOffsets[1]} -i "${mediaClips[1]?.file}" -ss ${mediaOffsets[2]} -i "${mediaClips[2]?.file}" -ss ${mediaOffsets[3]} -i "${mediaClips[3]?.file}" -filter_complex "[1:v]scale=500:350:force_original_aspect_ratio=decrease[sc1];[2:v]scale=500:350:force_original_aspect_ratio=decrease[sc2];[3:v]scale=500:350:force_original_aspect_ratio=decrease[sc3];[4:v]scale=500:350:force_original_aspect_ratio=decrease[sc4];[0:v][sc1]overlay=158:16[tmp1];[tmp1][sc2]overlay=674:16[tmp2];[tmp2][sc3]overlay=158:382[tmp3];[tmp3][sc4]overlay=674:382" -t ${duration} -c:v libvpx -b:v 5M -crf 10 -quality good -cpu-used 0 -pix_fmt yuv420p "${outputPath}"`;
    const mediaCmd5=`ffmpeg -y -f lavfi -i color=c=white:s=1333x749:d=${duration} -ss ${mediaOffsets[0]} -i "${mediaClips[0]?.file}" -ss ${mediaOffsets[1]} -i "${mediaClips[1]?.file}" -ss ${mediaOffsets[2]} -i "${mediaClips[2]?.file}" -ss ${mediaOffsets[3]} -i "${mediaClips[3]?.file}" -ss ${mediaOffsets[4]} -i "${mediaClips[4]?.file}" -filter_complex "[1:v]scale=441:371:force_original_aspect_ratio=decrease[sc1];[2:v]scale=441:371:force_original_aspect_ratio=decrease[sc2];[3:v]scale=441:371:force_original_aspect_ratio=decrease[sc3];[4:v]scale=441:371:force_original_aspect_ratio=decrease[sc4];[5:v]scale=441:371:force_original_aspect_ratio=decrease[sc5];[0:v][sc1]overlay=3:2[tmp1];[tmp1][sc2]overlay=446:2[tmp2];[tmp2][sc3]overlay=890:2[tmp3];[tmp3][sc4]overlay=223:375[tmp4];[tmp4][sc5]overlay=667:375" -t ${duration} -c:v libvpx -b:v 5M -crf 10 -quality good -cpu-used 0 -pix_fmt yuv420p "${outputPath}"`;

    let cmd='';
    if(screenClips.length>0){
        if(count==1) cmd=screenCmd0;
        else if(count==2) cmd=screenCmd1;
        else if(count==3) cmd=screenCmd2;
        else if(count==4) cmd=screenCmd3;
        else if(count==5) cmd=screenCmd4;
        else if(count==6) cmd=screenCmd5;
    }
    else{
        if(count==1) cmd=mediaCmd1;
        else if(count==2) cmd=mediaCmd2;
        else if(count==3) cmd=mediaCmd3;
        else if(count==4) cmd=mediaCmd4;
        else if(count==5) cmd=mediaCmd5;
    }

    if (!cmd) {
        console.warn(`No command generated for segment ${index}, skipping.`);
        return;
    }

    console.log(`Generating layout for segment ${index} with ${count} clips → ${outputPath}`);
    try {
        const { stdout, stderr } = await execPromise(cmd);
        console.log(`Segment ${index} generated.`);
        if (stderr) console.error(`FFmpeg stderr:`, stderr);
    } catch (err) {
        console.error(`Error generating segment ${index}:`, err);
    }
}