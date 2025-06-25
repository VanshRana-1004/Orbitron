import { RecordingEntry } from "..";

export function generateGStreamerCommand(recordings: RecordingEntry[], outputFile: string): string[] {
  const videoSources: string[] = [];
  const audioSources: string[] = [];
  let videoIndex = 0; 
  let audioIndex = 0; 
  
  const videoRecordings = recordings.filter(r => r.kind === 'video');
  const audioRecordings = recordings.filter(r => r.kind === 'audio');
  
  videoRecordings.forEach((r) => {
    const caps = 'application/x-rtp,media=video,encoding-name=VP8,payload=96,clock-rate=90000';
    const depay = 'rtpvp8depay ! vp8dec ! videoscale ! videoconvert';
    videoSources.push(
      `udpsrc port=${r.ports.rtpPort} caps="${caps}" ! ${depay} ! queue ! comp.sink_${videoIndex}`
    );
    videoIndex++;
  });
  
  audioRecordings.forEach((r) => {
    const caps = 'application/x-rtp,media=audio,encoding-name=OPUS,payload=111,clock-rate=48000,channels=2';
    const depay = 'rtpopusdepay ! opusdec ! audioconvert ! audioresample';
    audioSources.push(
      `udpsrc port=${r.ports.rtpPort} caps="${caps}" ! ${depay} ! queue ! mixa.sink_${audioIndex}`
    );
    audioIndex++;
  });

  const pipelineParts: string[] = [];

  if (videoSources.length > 0) {
    const sinkConfigs = videoRecordings.map((_, idx) => {
      const xpos = (idx % 2) * 640;
      const ypos = Math.floor(idx / 2) * 360;
      return `sink_${idx}::xpos=${xpos} sink_${idx}::ypos=${ypos}`;
    }).join(' ');
    pipelineParts.push(`compositor name=comp ${sinkConfigs}`);
    pipelineParts.push(...videoSources);
    pipelineParts.push('comp. ! videoconvert ! vp8enc deadline=1 ! queue ! mux.video_0');
  }

  if (audioSources.length > 0) {
    pipelineParts.push('audiomixer name=mixa');
    pipelineParts.push(...audioSources);
    pipelineParts.push('mixa. ! audioconvert ! opusenc ! queue ! mux.audio_0');
  }

  if (videoSources.length > 0 || audioSources.length > 0) {
    pipelineParts.push(`webmmux name=mux ! filesink location="${outputFile}"`);
  } else {
    console.warn("No video or audio recordings provided. GStreamer command will be empty.");
    return [];
  }

  return [pipelineParts.join(' ')];
}
