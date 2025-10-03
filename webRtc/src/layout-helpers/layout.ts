import { TimelineSegment,Clip } from "./timeline";
import { exec } from "child_process";

export async function createLayout(segment : TimelineSegment, outputPath : string){
    const start=segment.start;
    const end=segment.end;
    const duration=(end-start)/1000;
    const screen : Clip[]=segment.active.filter((clip : Clip)=>clip.type==='screen');
    const peers : Clip[]=segment.active.filter((clip : Clip)=>clip.type!=='screen');
    const peerAudio : boolean[]=[];
    const peerTrim : number[]=[];
    peers.forEach((p : Clip)=>{
        peerTrim.push((Math.abs(start-p.start))/1000)
        peerAudio.push(p.audio);
    })
    console.log('[layout] : duration for this segment : ', duration);
    console.log('[layout] peers along with their duration & trims : ');
    peers.forEach((clip,ind)=>{
        console.log('duration : ',clip.duration);
        console.log('trim part : ',peerTrim[ind]);
    })
    let command='';

    let audioCmd = '';
    let audioMap = '';
    let inputs: string[] = [];
    if (screen.length > 0) {
        if (screen[0]?.audio) inputs.push(`[1:a]`);
        peerAudio.forEach((hasAudio, ind) => {
            if (hasAudio) inputs.push(`[${ind + 2}:a]`);
        });
    } 
    else{
        peerAudio.forEach((hasAudio, ind) => {
            if (hasAudio) inputs.push(`[${ind + 1}:a]`);
        });
    }

    if (inputs.length === 0) {
        audioCmd = '';
        audioMap = '';
    } 
    else if (inputs.length === 1) {
        audioCmd = '';
        audioMap = `-map "${inputs[0]?.replace(/\[|\]/g, '')}"`; 
    } 
    else {
        audioCmd = `;${inputs.join('')}amix=inputs=${inputs.length}:normalize=1[aout]`;
        audioMap = `-map "[aout]"`;
    }


    if(screen.length>0){
        const screenTrim = screen[0] ? (Math.abs(screen[0].start - start)) / 1000 : 0;
        switch (peers.length){
            case 1 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${screenTrim} -i "${screen[0]?.file}" -ss ${peerTrim[0]} -i "${peers[0]?.file}" -fflags +genpts -filter_complex "[1:v]scale=1024:650:force_original_aspect_ratio=decrease,pad=1024:650:(ow-iw)/2:(oh-ih)/2:black,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc1];[2:v]scale=-1:164,crop=236:164:(in_w-236)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc2];[0:v][sc1]overlay=13:15[tmp1];[tmp1][sc2]overlay=1088:574[vout]${audioCmd}" -map "[vout]" ${audioMap} -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -async 1 "${outputPath}"`;
                break;    
            case 2 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${screenTrim} -i "${screen[0]?.file}" -ss ${peerTrim[0]} -i "${peers[0]?.file}" -ss ${peerTrim[1]} -i "${peers[1]?.file}" -fflags +genpts -filter_complex "[1:v]scale=944:570:force_original_aspect_ratio=decrease,pad=944:570:(ow-iw)/2:(oh-ih)/2:black,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc1];[2:v]scale=-1:350,crop=364:350:(in_w-364)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc2];[3:v]scale=-1:350,crop=364:350:(in_w-364)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc3];[0:v][sc1]overlay=3:86[tmp1];[tmp1][sc2]overlay=960:10[tmp2];[tmp2][sc3]overlay=960:378[vout]${audioCmd}" -map "[vout]" ${audioMap} -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -async 1 "${outputPath}"`;
                break;    
            case 3 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${screenTrim} -i "${screen[0]?.file}" -ss ${peerTrim[0]} -i "${peers[0]?.file}" -ss ${peerTrim[1]} -i "${peers[1]?.file}" -ss ${peerTrim[2]} -i "${peers[2]?.file}" -fflags +genpts -filter_complex "[1:v]scale=1034:554:force_original_aspect_ratio=decrease,pad=1034:554:(ow-iw)/2:(oh-ih)/2:black,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc1];[2:v]scale=-1:234,crop=256:234:(in_w-256)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc2];[3:v]scale=-1:234,crop=256:234:(in_w-256)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc3];[4:v]scale=-1:234,crop=256:234:(in_w-256)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc4];[0:v][sc1]overlay=18:108[tmp1];[tmp1][sc2]overlay=1066:10[tmp2];[tmp2][sc3]overlay=1066:258[tmp3];[tmp3][sc4]overlay=1066:506[vout]${audioCmd}" -map "[vout]" ${audioMap} -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -async 1 "${outputPath}"`;
                break;    
            case 4 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${screenTrim} -i "${screen[0]?.file}" -ss ${peerTrim[0]} -i "${peers[0]?.file}" -ss ${peerTrim[1]} -i "${peers[1]?.file}" -ss ${peerTrim[2]} -i "${peers[2]?.file}" -ss ${peerTrim[3]} -i "${peers[3]?.file}" -fflags +genpts -filter_complex "[1:v]scale=1040:546:force_original_aspect_ratio=decrease,pad=1040:546:(ow-iw)/2:(oh-ih)/2:black,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc1];[2:v]scale=-1:166,crop=238:166:(in_w-238)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc2];[3:v]scale=-1:166,crop=238:166:(in_w-238)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc3];[4:v]scale=-1:166,crop=238:166:(in_w-238)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc4];[5:v]scale=-1:166,crop=238:166:(in_w-238)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc5];[0:v][sc1]overlay=148:14[tmp1];[tmp1][sc2]overlay=75:574[tmp2];[tmp2][sc3]overlay=388:574[tmp3];[tmp3][sc4]overlay=702:574[tmp4];[tmp4][sc5]overlay=1016:574[vout]${audioCmd}" -map "[vout]" ${audioMap} -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -async 1 "${outputPath}"`;
                break;    
            case 5 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${screenTrim} -i "${screen[0]?.file}" -ss ${peerTrim[0]} -i "${peers[0]?.file}" -ss ${peerTrim[1]} -i "${peers[1]?.file}" -ss ${peerTrim[2]} -i "${peers[2]?.file}" -ss ${peerTrim[3]} -i "${peers[3]?.file}" -ss ${peerTrim[4]} -i "${peers[4]?.file}" -fflags +genpts -filter_complex "[1:v]scale=936:512:force_original_aspect_ratio=decrease,pad=936:512:(ow-iw)/2:(oh-ih)/2:black,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc1];[2:v]scale=-1:356,crop=364:356:(in_w-364)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc2];[3:v]scale=-1:356,crop=364:356:(in_w-364)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc3];[4:v]scale=-1:204,crop=304:204:(in_w-304)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc4];[5:v]scale=-1:204,crop=304:204:(in_w-304)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc5];[6:v]scale=-1:204,crop=304:204:(in_w-304)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc6];[0:v][sc1]overlay=8:10[tmp1];[tmp1][sc2]overlay=960:10[tmp2];[tmp2][sc3]overlay=960:382[tmp3];[tmp3][sc4]overlay=8:536[tmp4];[tmp4][sc5]overlay=326:536[tmp5];[tmp5][sc6]overlay=642:536[vout]${audioCmd}" -map "[vout]" ${audioMap} -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -async 1 "${outputPath}"`;
                break;    
            default :
                command = ''
        }
    }   
    else{
        switch (peers.length){
            case 1 :
                command = `ffmpeg -y -ss ${peerTrim[0]} -i "${peers[0]?.file}" -filter_complex "[0:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,crop=1280:720,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[vout]" -map "[vout]" -map "0:a?" -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -async 1 "${outputPath}"`;
                break;    
            case 2 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${peerTrim[0]} -i "${peers[0]?.file}" -ss ${peerTrim[1]} -i "${peers[1]?.file}" -fflags +genpts -filter_complex "[1:v]scale=-1:726,crop=650:726:(in_w-650)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc1];[2:v]scale=-1:726,crop=650:726:(in_w-650)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc2];[0:v][sc1]overlay=12:10[tmp1];[tmp1][sc2]overlay=674:10[vout]${audioCmd}" -map "[vout]" ${audioMap} -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -async 1 "${outputPath}"`;
                break;    
            case 3 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${peerTrim[0]} -i "${peers[0]?.file}" -ss ${peerTrim[1]} -i "${peers[1]?.file}" -ss ${peerTrim[2]} -i "${peers[2]?.file}" -fflags +genpts -filter_complex "[1:v]scale=-1:360,crop=564:360:(in_w-564)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc1];[2:v]scale=-1:360,crop=564:360:(in_w-564)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc2];[3:v]scale=-1:360,crop=564:360:(in_w-564)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc3];[0:v][sc1]overlay=100:12[tmp1];[tmp1][sc2]overlay=704:12[tmp2];[tmp2][sc3]overlay=404:380[vout]${audioCmd}" -map "[vout]" ${audioMap} -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -async 1 "${outputPath}"`;
                break;    
            case 4 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${peerTrim[0]} -i "${peers[0]?.file}" -ss ${peerTrim[1]} -i "${peers[1]?.file}" -ss ${peerTrim[2]} -i "${peers[2]?.file}" -ss ${peerTrim[3]} -i "${peers[3]?.file}" -fflags +genpts -filter_complex "[1:v]scale=-1:360,crop=564:360:(in_w-564)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc1];[2:v]scale=-1:360,crop=564:360:(in_w-564)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc2];[3:v]scale=-1:360,crop=564:360:(in_w-564)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc3];[4:v]scale=-1:360,crop=564:360:(in_w-564)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc4];[0:v][sc1]overlay=100:12[tmp1];[tmp1][sc2]overlay=694:12[tmp2];[tmp2][sc3]overlay=100:380[tmp3];[tmp3][sc4]overlay=694:380[vout]${audioCmd}" -map "[vout]" ${audioMap} -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -async 1 "${outputPath}"`;
                break;    
            case 5 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${peerTrim[0]} -i "${peers[0]?.file}" -ss ${peerTrim[1]} -i "${peers[1]?.file}" -ss ${peerTrim[2]} -i "${peers[2]?.file}" -ss ${peerTrim[3]} -i "${peers[3]?.file}" -ss ${peerTrim[4]} -i "${peers[4]?.file}" -fflags +genpts -filter_complex "[1:v]scale=-1:398,crop=506:398:(in_w-506)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc1];[2:v]scale=-1:398,crop=506:398:(in_w-506)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc2];[3:v]scale=-1:312,crop=428:312:(in_w-428)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc3];[4:v]scale=-1:312,crop=428:312:(in_w-428)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc4];[5:v]scale=-1:312,crop=428:312:(in_w-428)/2:0,drawbox=x=0:y=0:w=iw:h=ih:color=#A1A1AA:t=1[sc5];[0:v][sc1]overlay=152:12[tmp1];[tmp1][sc2]overlay=672:12[tmp2];[tmp2][sc3]overlay=10:424[tmp3];[tmp3][sc4]overlay=452:424[tmp4];[tmp4][sc5]overlay=894:424[vout]${audioCmd}" -map "[vout]" ${audioMap} -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -async 1 "${outputPath}"`;
                break;  
            default :
                command = ''
        }
    }   
    if(command==='') return;
    await new Promise<void>((resolve, reject) => {
        const ff = exec(command, (err, stdout, stderr) => {
        if (err) return reject(err);
            resolve();
        });

        ff.stdout?.on("data", data => console.log(data.toString()));
        ff.stderr?.on("data", data => console.log(data.toString()));
    });
    console.log("FFmpeg layout finished:", outputPath);
}