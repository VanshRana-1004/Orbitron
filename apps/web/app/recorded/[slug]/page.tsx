'use client'
import CrossIcon from "app/components/icons/cross";
import PauseIcon from "app/components/icons/pause";
import PlayIcon from "app/components/icons/play";
import { useCurrentVideoStore } from "app/store/current-video"
import { useRouter } from "next/navigation";
import { useEffect,useState,useRef } from "react";
import { number } from "zod";

export default function Recorded(){
    const router=useRouter();
    const { video } = useCurrentVideoStore();
    console.log(video);
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
    
    const [width,setWidth]=useState<number>(1536);
    useEffect(()=>{
        const handleScreenResize=()=>{
        const wdth=window.innerWidth;
            setWidth(wdth);
        }
        handleScreenResize();
        window.addEventListener('resize',handleScreenResize);
        return ()=>{window.removeEventListener('resize',handleScreenResize)}
    },[])

    useEffect(()=>{
        if(showControls) setTimeout(()=>setShowControls(false),2000)
    },[])

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
    let clipStartTime = 0;

    for (let i = 0; i < durations.length; i++) {
        if (newGlobalTime < acc + Number(durations[i])) {
            clipIndex = i;
            clipStartTime = acc;
            break;
        }
        acc += Number(durations[i]);
    }

    const newTime = newGlobalTime - clipStartTime;

    setCurrentIndex(clipIndex);

    // defer setting currentTime until the new video has loaded
    const handleSeekedVideo = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(newTime, 0);
            if (isPlaying) videoRef.current.play().catch(() => {});
        }
    };

    // attach temporary listener
    if (videoRef.current) {
        videoRef.current.onloadedmetadata = handleSeekedVideo;
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


    return (<div id={'main'}  className={`w-full bg-black overflow-hidden flex flex-col items-center h-screen bg-cover bg-center`}
        style={{
        scrollBehavior: "smooth",
        backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
            radial-gradient(circle at 20px 20px, rgba(55, 65, 81, 0.12) 2px, transparent 2px),
            radial-gradient(circle at 40px 40px, rgba(55, 65, 81, 0.12) 2px, transparent 2px)
        `,
        backgroundSize: '40px 40px, 40px 40px, 40px 40px, 40px 40px',
    }}>

        <div
          className={`fixed w-[500px] h-[500px] rounded-full z-0 ${width<768 ? 'top-0 left-0 -translate-y-40 -translate-x-40' : 'top-0 -translate-y-36 -translate-x-36'}`}
          style={{
            background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
            filter: 'blur(100px)',
          }}
        ></div>

        <div
          className={`fixed w-[500px] h-[500px] rounded-full z-0 ${width<768 ? 'bottom-0 right-0 translate-y-5 translate-x-16' : 'bottom-0 translate-y-36 right-0 translate-x-24'}`}
          style={{
            background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
            filter: 'blur(100px)',
          }}
        ></div>

        <p className={`fixed top-5 left-5 ${showControls ? 'opacity-100' : 'opacity-0'} poppins-regular tracking-[-5%] text-zinc-500 text-[16px] line-clamp-2 z-50`}>Please don't refresh this page</p>            

        <div onMouseMove={handleMouseMove} className="relative backdrop-blur-sm bg-black h-full w-full z-20 rounded  flex flex-col items-center justify-center">
            <div onClick={handleLeave} className='z-30 cursor-pointer absolute top-2 right-2 p-1 text-sm rounded-full text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 '><CrossIcon/></div>
            {video && showVideo && video.clips.length > 0 && (
                <>
                    <video
                        ref={videoRef}
                        src={sequencedClips[currentIndex]?.url}
                        autoPlay={isPlaying}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleEnded}
                        className="h-full w-full rounded "
                        controls={false} 
                    />

                    <div className={`absolute bottom-4 left-0 w-full flex items-center gap-2 px-4 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <button
                            onClick={togglePlay}
                            className="p-2 rounded-full bg-black hover:bg-zinc-900 "
                        >
                            {isPlaying ? <PauseIcon/> : <PlayIcon/>}
                        </button>

                        <input
                            type="range"
                            min={0}
                            max={totalDuration}
                            value={globalTime}
                            onChange={handleSeek}
                            className={`flex-1 h-1 accent-white  `} 
                        />

                        <span className="text-sm text-zinc-300 drop-shadow">
                            {Math.floor(globalTime)}/{Math.floor(totalDuration)}s
                        </span>
                    </div>
                </>
            )}
        </div>


    </div>)
}