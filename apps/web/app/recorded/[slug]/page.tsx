'use client'
import { useCurrentVideoStore } from "app/store/current-video"
import { useRouter } from "next/navigation";
import { useEffect,useState,useRef } from "react";

export default function Recorded(){
    const router=useRouter();
    const { video } = useCurrentVideoStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [durations, setDurations] = useState<number[]>([]);
    const [globalTime, setGlobalTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    const [showControls, setShowControls] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showVideo, setShowVideo] = useState(true);

    const [sequencedClips,setSequencedClips]=useState<{url: string;roomId: string;clipNum: string;public_id: string}[]>([])

    const handleMouseMove = () => {
        setShowControls(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 2000);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);
    
    useEffect(() => {
        if (!video) return;
        console.log(video.clips);
        const sortedClips = [...video.clips].sort((a, b) => {
            const getClipNumber = (url: string) => {
                const match = url.match(/clip_(\d+)\.mp4$/);
                return match && match[1] !== undefined ? parseInt(match[1], 10) : 0;
            };
            return getClipNumber(a.url) - getClipNumber(b.url);
        });
        console.log(sortedClips);
        setSequencedClips(sortedClips);
        const promises = sortedClips.map(
            (clip) =>new Promise<number>((resolve) => {
                const vid = document.createElement("video");
                vid.src = clip.url;
                vid.onloadedmetadata = () => resolve(vid.duration);
            })
        );
        Promise.all(promises).then(setDurations);
    }, [video]);
    
    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const localTime = videoRef.current.currentTime;
        const elapsedBefore = durations.slice(0, currentIndex).reduce((a, b) => a + b, 0);
        setGlobalTime(elapsedBefore + localTime);
    };

    const handleEnded = () => {
        if (video && currentIndex < video.clips.length - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            setIsPlaying(false);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newGlobalTime = parseFloat(e.target.value);
        setGlobalTime(newGlobalTime);

        let acc = 0;
        let clipIndex = 0;
        for (let i = 0; i < durations.length; i++) {
            if (newGlobalTime < acc + Number(durations[i])) {
                clipIndex = i;
                break;
            }
            acc += Number(durations[i]);
        }

        setCurrentIndex(clipIndex);
        if (videoRef.current && video) {
            videoRef.current.src = video.clips[clipIndex]?.url || '';
            videoRef.current.currentTime = newGlobalTime - acc;
            if (isPlaying) videoRef.current.play();
        }
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    function handleLeave(){
        if (videoRef.current) {
            const stream = videoRef.current.srcObject as MediaStream | null;
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
                videoRef.current.srcObject = null;
            }
            videoRef.current.pause();
            videoRef.current.src = "";
            videoRef.current.load(); 
            videoRef.current=null
        }
        setShowVideo(false);
        setTimeout(()=>{router.push('/dashboard')},500);
    }
    useEffect(() => {
        return () => {
            if (videoRef.current) {
                const stream = videoRef.current.srcObject as MediaStream | null;
                if (stream) {
                    stream.getTracks().forEach((track) => track.stop());
                    videoRef.current.srcObject = null;
                }
                videoRef.current.pause();
                videoRef.current.src = "";
                videoRef.current.load(); 
                videoRef.current=null
            }
            setShowVideo(false);
        };
    }, []);


    return (<div className="bg-white p-2 dark:bg-zinc-950 flex flex-col items-center h-screen bg-[url('/dark-landing-bg-1.png')] bg-cover bg-center">
        <div className={`absolute inset-0 w-full h-full z-10
            bg-transparent [background-size:60px_60px] [background-image:linear-gradient(to_right,#0B0F17_1px,transparent_1px),linear-gradient(to_bottom,#0B0F17_1px,transparent_1px)]`
        }/>

        <div onMouseMove={handleMouseMove} className="relative backdrop-blur-sm bg-black/20 h-full w-full z-20 rounded border border-[#1E2C40] flex flex-col items-center justify-center">
            <div onClick={handleLeave} className='z-30 cursor-pointer absolute top-2 right-2 px-5 py-2 text-sm bg-black rounded text-white hover:bg-zinc-900 border border-zinc-700 '>back</div>
            {video && showVideo && video.clips.length > 0 && (
                <>
                    <video
                        key={currentIndex}
                        ref={videoRef}
                        src={sequencedClips[currentIndex]?.url}
                        autoPlay={isPlaying}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleEnded}
                        className="h-full w-full rounded "
                        controls={false} 
                    />

                    <div className={`absolute bottom-4 left-0 w-full flex items-center gap-2 px-4 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                        <button
                            onClick={togglePlay}
                            className="px-3 py-1 bg-black/70 text-white rounded border border-white"
                        >
                            {isPlaying ? "Pause" : "Play"}
                        </button>

                        <input
                            type="range"
                            min={0}
                            max={totalDuration}
                            value={globalTime}
                            onChange={handleSeek}
                            className={`flex-1 h-1 accent-white  `} 
                        />

                        <span className="text-sm text-white drop-shadow">
                            {Math.floor(globalTime)}/{Math.floor(totalDuration)}s
                        </span>
                    </div>
                </>
            )}
        </div>


    </div>)
}