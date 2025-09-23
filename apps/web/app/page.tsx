"use client";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./components/theme-toggle/theme";
import { signIn } from "next-auth/react";
import XIconWrapper from "./components/icons/x";
import LinkedIconWrapper from "./components/icons/linkedin";
import GithubIconWrapper from "./components/icons/github";
import CameraIcon from "./components/icons/camera";
import RecordIcon from "./components/icons/record";
import MsgIcon from "./components/icons/msg";
import CloudIcon from "./components/icons/cloud";
import LockIcon from "./components/icons/lock";
import LayoutIcon from "./components/icons/layout";
import ComputerIcon from "./components/icons/computer";
import { useEffect,useState,useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const points = [
  { heading: "Start Recording", description:'With a single click, begin recording your live call. No extra setup or tools required - just hit record and focus on the conversation. Everything starts capturing from the moment you begin.',  img: "start-recording.png" },
  { heading: "Stream Captured", description:'As the call goes on, our server automatically receives your video, audio, and screen share streams. Each participant’s feed is captured in real-time, ensuring nothing is missed during the session.',  img: "recording.png" },
  { heading: "Session Ready", description:'Once you end the call or stop recording, your complete session is processed and saved. You can revisit, replay, or share the recorded session anytime, directly from your dashboard.', img: "final-clip.png" },
];

export default function Home() {
  const router = useRouter();
  const handleGoogleLogin = async () => {
    try {
        await signIn('google', {
            callbackUrl: '/dashboard', 
        });
  
    } catch (err) {
        console.error("Unexpected error during sign-in:", err);
        alert("Something went wrong.");
    }
  };
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(()=>{
    const interval=setInterval(()=>{
      setActiveIndex(activeIndex=>(activeIndex+1)%3)
    },5000)
    return (()=>{
      clearInterval(interval);
    })
  },[activeIndex])

  return (
    <div className="w-full min-h-screen bg-black absolute flex flex-col"
      style={{
      backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
        repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
        radial-gradient(circle at 20px 20px, rgba(55, 65, 81, 0.12) 2px, transparent 2px),
        radial-gradient(circle at 40px 40px, rgba(55, 65, 81, 0.12) 2px, transparent 2px)
      `,
      backgroundSize: '40px 40px, 40px 40px, 40px 40px, 40px 40px',
    }}>


      <div className="flex justify-between items-center relative top-5 mx-32 h-10 ">

        <div className="flex items-center gap-2">
          <img src="carbon_shape-exclude.svg" alt="" />
          <div className="poppins-medium text-[25px] tracking-[-4%]">Orbitron</div> 
        </div>

        <div className="flex items-center gap-10 poppins-medium text-[#B6B8C3]  tracking-[-2%] text-[16px]">
          <div>Features</div>
          <div>How it works</div>
          <div>Contact</div>
        </div>

        <div className="bg-white text-black poppins-medium font-medium text-[16px] rounded-[65px] tracking-[2%] px-[18px] py-[6px]">Get Started</div>

      </div>

      <div className={`z-10 px-auto w-auto h-[414px] relative top-44 flex flex-col items-center gap-[35px]`}>

        <div className="flex flex-col text-[70px] leading-[80px] poppins-medium tracking-[-5%] items-center justify-center bg-[linear-gradient(92.22deg,rgba(255,255,255,0.4)_-6.68%,#FAF9F9_31.88%,#D1D1D1_61.39%,rgba(181,181,181,0.4)_89.88%)] bg-clip-text text-transparent">
          <p>Talk Freely. Record Easily.</p>
          <p> Revisit AnyTime</p>
        </div>

        <div className="flex flex-col text-wrap items-center justify-center poppins-medium font-normal text-gray-200 text-[18px] tracking-[-2%]">
          <p>Orbitron combines real-time video calls with instant session recording - no extra</p>
          <p>setup, no hassle.</p>
        </div>
        
        <div className="flex gap-[20px]">
          <div className="text-[16px] poppins-medium font-medium bg-white text-black px-[24px] py-[16px] rounded-[100px]">Explore Now</div>
          <div className="text-[16px] poppins-medium font-medium bg-black text-white px-[24px] py-[16px] rounded-[100px]">Demo Video</div>
        </div>

      </div>

      <div className="relative mt-80 w-full h-auto bg-black overflow-visible flex flex-col ">
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-[250px] w-[70%] z-0"
          style={{
            height: '500px',
            background: 'linear-gradient(180deg, #7E5BEF 0%, #7E5BEF 100%)',
            filter: 'blur(125px)',
            borderRadius: '100%',
          }}
        ></div>

        <div className=" z-10 bg-black w-full h-auto flex flex-col gap-60 py-72"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
              repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
              radial-gradient(circle at 20px 20px, rgba(55, 65, 81, 0.12) 2px, transparent 2px),
              radial-gradient(circle at 40px 40px, rgba(55, 65, 81, 0.12) 2px, transparent 2px)
            `,
            backgroundSize: '40px 40px, 40px 40px, 40px 40px, 40px 40px',
          }}>

            <div
              className="absolute w-[500px] h-[500px] rounded-full z-0 left-16 top-48 "
              style={{
                background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
                filter: 'blur(100px)',
              }}
            ></div>

            <div
              className="absolute w-[500px] h-[500px] rounded-full z-0 right-16 bottom-48 "
              style={{
                background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
                filter: 'blur(100px)',
              }}
            ></div>

            <div className="z-10 flex flex-col items-center justify-center gap-7">
                <p className="poppins-medium tracking-[-5%] text-[40px] text-[#B3ABAB]">Demo Video</p>
                <div className="w-[70%] h-[600px] rounded-[10px] border border-zinc-900 bg-black p-[10px]"
                style={{background: "radial-gradient(125% 125% at 50% 100%, #18181B 40%, #7E5BEF 100%)",}}>
                <div  className="bg-black rounded-[10px] w-full h-full"></div>
              </div>
            </div>

            <div className="z-10 flex flex-col items-center justify-center gap-7">
              <p className="poppins-medium tracking-[-5%] text-[40px] text-[#B3ABAB]">How Orbitron Works</p>
              <div className="relative w-[70%] h-[600px] rounded-[10px] border border-zinc-900 p-[10px]" 
              style={{
                background: 
                  activeIndex === 0
                  ? 'radial-gradient(125% 125% at 50% 100%, #7E5BEF 40%, #EC4899 100%)'
                  : activeIndex === 1
                  ? 'radial-gradient(125% 125% at 50% 100%, #7E5BEF 40%, #EAB308 100%)'
                  : 'radial-gradient(125% 125% at 50% 100%, #7E5BEF 40%, #EF4444 100%)',}}>
                
                <div  className="flex bg-black rounded-[10px] w-full h-full px-10 ">
                  <div className="flex flex-col space-y-16 rounded-l-[10px] w-1/2 h-full bg-black px-16 py-24 pr-5">

                    <div className="flex flex-col w-full h-full gap-12 ">
                      <div className="flex gap-2 items-end">
                        <p className={`text-7xl poppins-semibold font-semibold ${activeIndex==0 ? 'text-[#EC4899]' : activeIndex==1 ? 'text-[#EAB308]' : 'text-[#EF4444]'}`}>0{activeIndex+1}</p>
                        <p className="poppins-medium tracking-[-5%] text-[40px] text-[#d5cfcf] text-wrap w-full">{points[activeIndex]?.heading}</p>
                      </div>
                      <p className="poppins-medium tracking-[-5%] text-[18px] text-gray-400 text-wrap w-[80%] leading-[-5%]">{points[activeIndex]?.description}</p>
                    </div>
            
                  </div>
                  
                  <div className="flex flex-col rounded-r-[10px] flex-1 h-full bg-black p-8 justify-center">
                    <img key={activeIndex} src={points[activeIndex]?.img} style={{ opacity: 1 }} alt="corresponding" className={`border ${activeIndex==0 ? 'border-[#EC4899]' : activeIndex==1 ? 'border-[#EAB308]' : 'border-[#bc1f1f]'}  object-cover h-[60%] transition-opacity duration-1000 w-[100%] rounded-[10px] bg-zinc-900`}></img>
                  </div>
                </div>

                <div
                  onClick={() =>
                    setActiveIndex((activeIndex) => (3 + activeIndex - 1) % 3)
                  }
                  className="absolute top-1/2 -translate-y-1/2 left-6 
                            rounded-full p-3 bg-white/20 backdrop-blur-md 
                            border border-white/30 shadow-lg 
                            hover:bg-white/30 transition cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </div>

                <div
                  onClick={() =>
                    setActiveIndex((activeIndex) => (activeIndex + 1) % 3)
                  }
                  className="absolute top-1/2 -translate-y-1/2 right-6 
                            rounded-full p-3 bg-white/20 backdrop-blur-md 
                            border border-white/30 shadow-lg 
                            hover:bg-white/30 transition cursor-pointer"
                >
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex absolute gap-2 bottom-5 left-1/2 -translate-x-1/2">
                  <div className={`p-1.5 rounded-full ${activeIndex==0 ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                  <div className={`p-1.5 rounded-full ${activeIndex==1 ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                  <div className={`p-1.5 rounded-full ${activeIndex==2 ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                </div>

              </div>
            </div>

            <div className="z-10 flex flex-col items-center justify-center gap-7">
              <p className="poppins-medium tracking-[-5%] text-[40px] text-[#B3ABAB]">Features</p>
              <div className="flex flex-col w-[1050px] h-[570px] p-[10px] rounded-[10px] gap-[10px] border border-zinc-900 bg-zinc-950 ">
                
                <div className="flex gap-[10px]">

                  <div className=" bg-black rounded-[10px] w-[280px] h-[300px] relative border border-zinc-900 overflow-hidden p-8 gap-3 flex flex-col transform transition-transform duration-300 hover:scale-105 hover:z-20 z-10"
                    style={{
                        backgroundColor: '#000000',
                        backgroundImage: `
                          radial-gradient(circle at 25% 25%, #222222 0.5px, transparent 1px),
                          radial-gradient(circle at 75% 75%, #111111 0.5px, transparent 1px)
                        `,
                        backgroundSize: '10px 10px',
                        imageRendering: 'pixelated',
                      }}>
                      
                      <div className="absolute w-[500px] h-[500px] rounded-full z-0 left-0 -translate-x-48 top-0 -translate-y-96 "
                        style={{
                          background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
                          filter: 'blur(100px)',
                        }}
                      ></div>

                      <div className="flex flex-col gap-2 items-start">
                        <ComputerIcon/>
                        <div className="poppins-medium tracking-[-5%] text-[28px] text-[#B3ABAB] leading-none">Seamless Screen Sharing</div>
                      </div>
                      <div className="poppins-medium tracking-[-5%] text-[16px] text-gray-500 text-wrap">Share your screen in real time with crystal clarity, perfect for demos and collaborations.</div>
    
                  
                  </div>

                  <div className=" bg-black rounded-[10px] w-[450px] h-[300px] relative border border-zinc-900 overflow-hidden p-8 gap-3 flex flex-col transform transition-transform duration-300 hover:scale-105 hover:z-20 z-10"
                    style={{
                        backgroundColor: '#000000',
                        backgroundImage: `
                          radial-gradient(circle at 25% 25%, #222222 0.5px, transparent 1px),
                          radial-gradient(circle at 75% 75%, #111111 0.5px, transparent 1px)
                        `,
                        backgroundSize: '10px 10px',
                        imageRendering: 'pixelated',
                      }}>
                      
                      <div className="absolute w-[500px] h-[500px] rounded-full z-0 left-0 -translate-x-48 top-48 "
                        style={{
                          background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
                          filter: 'blur(100px)',
                        }}
                      ></div>

                      <div className="flex flex-col gap-2 items-start">
                        <div className="flex items-center justify-center gap-2">
                          <div className="p-2.5 h-5 w-5 rounded-full bg-[#7E5BEF]"></div>
                          <div className="poppins-semibold text-[30px] text-[#B3ABAB]">REC</div>
                        </div>
                        <div className="poppins-medium tracking-[-5%] text-[28px] text-[#B3ABAB] leading-none">Automatic Session Recording</div>
                      </div>
                      <div className="poppins-medium tracking-[-5%] text-[16px] text-gray-500 text-wrap">Forget messy screen recorders - your calls are captured directly on our servers from the start.</div>
    
                  
                  </div>

                  <div className=" bg-black rounded-[10px] w-[280px] h-[300px] relative border border-zinc-900 overflow-hidden p-8 gap-3 flex flex-col transform transition-transform duration-300 hover:scale-105 hover:z-20 z-10"
                    style={{
                        backgroundColor: '#000000',
                        backgroundImage: `
                          radial-gradient(circle at 25% 25%, #222222 0.5px, transparent 1px),
                          radial-gradient(circle at 75% 75%, #111111 0.5px, transparent 1px)
                        `,
                        backgroundSize: '10px 10px',
                        imageRendering: 'pixelated',
                      }}>
                      
                      <div className="absolute w-[500px] h-[500px] rounded-full z-0 right-0 translate-x-48 top-0 -translate-y-96"
                        style={{
                          background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
                          filter: 'blur(100px)',
                        }}
                      ></div>

                      <div className="flex flex-col gap-2 items-start">
                        <CloudIcon/>
                        <div className="poppins-medium tracking-[-5%] text-[28px] text-[#B3ABAB] leading-none">Cloud-Stored Final Clips</div>
                      </div>
                      <div className="poppins-medium tracking-[-5%] text-[16px] text-gray-500 text-wrap">Every session is securely stored in the cloud, ready to revisit anytime.</div>
                  </div>

                </div>

                <div className="flex gap-[10px]">
                  
                  <div className=" overflow-hidden relative flex flex-col rounded-[10px] w-[650px] h-[240px] p-8 gap-3 border border-zinc-900 bg-black transform transition-transform duration-300 hover:scale-105 hover:z-20 z-10" 
                    style={{
                      backgroundColor: '#000000',
                      backgroundImage: `
                        radial-gradient(circle at 25% 25%, #222222 0.5px, transparent 1px),
                        radial-gradient(circle at 75% 75%, #111111 0.5px, transparent 1px)
                      `,
                      backgroundSize: '10px 10px',
                      imageRendering: 'pixelated',
                    }}>

                      <div className="absolute w-[500px] h-[500px] rounded-full z-0 right-0 translate-x-16 top-40 "
                        style={{
                          background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
                          filter: 'blur(100px)',
                        }}
                      ></div>
                    
                    <div className="flex flex-col gap-0 items-start">
                      <LayoutIcon/>
                      <div className="poppins-medium tracking-[-5%] text-[28px] text-[#B3ABAB]">Dynamic Peer Management</div>
                    </div>
                    <div className="poppins-medium tracking-[-5%] text-[16px] text-gray-500 text-wrap">Peers can join or leave anytime — we handle it smoothly. Currently supports up to 5 peers (scalability in progress).</div>
   
                  </div>

                  <div className=" bg-black rounded-[10px] w-[370px] h-[240px] border border-zinc-900 relative overflow-hidden flex flex-col p-8 gap-3 transform transition-transform duration-300 hover:scale-105 hover:z-20 z-10"
                    style={{
                      backgroundColor: '#000000',
                      backgroundImage: `
                        radial-gradient(circle at 25% 25%, #222222 0.5px, transparent 1px),
                        radial-gradient(circle at 75% 75%, #111111 0.5px, transparent 1px)
                      `,
                      backgroundSize: '10px 10px',
                      imageRendering: 'pixelated',
                    }}>
                      <div className="absolute w-[500px] h-[500px] rounded-full z-0 right-0 translate-x-48 top-0 -translate-y-96 "
                        style={{
                          background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
                          filter: 'blur(100px)',
                        }}
                      ></div>

                      <div className="flex flex-col gap-2 items-start ">
                        <div className=""><MsgIcon/></div>
                        <div className="poppins-medium tracking-[-5%] text-[28px] text-[#B3ABAB]">Built-in Chat Messaging</div>
                      </div>
                      <div className="poppins-medium tracking-[-5%] text-[16px] text-gray-500 text-wrap">Stay connected with integrated messaging alongside your video calls.</div>

                  </div>
  
                </div>

              </div>
            </div>
        </div>
      </div>
  
      <div
        className="w-full h-auto pt-28 gap-28 flex flex-col items-center bg-black px-16"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(126, 91, 239, 0.25), transparent 70%),
            repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
            radial-gradient(circle at 20px 20px, rgba(55, 65, 81, 0.12) 2px, transparent 2px),
            radial-gradient(circle at 40px 40px, rgba(55, 65, 81, 0.12) 2px, transparent 2px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px, 40px 40px, 40px 40px',
          backgroundRepeat: 'no-repeat, repeat, repeat, repeat, repeat',
        }}
      >
        <div className="flex flex-col items-center justify-center gap-5 h-48">
          <div className="flex flex-col leading-0 items-center justify-center">
            <p className="poppins-medium font-regular text-[45px] tracking-[-4%] text-gray-300">Conversations That Last Forever</p>
            <p className="poppins-medium font-regular text-[25px] tracking-[-4%] text-gray-300">Connect. Capture. Replay.</p>
          </div>
          <div className="text-[16px] poppins-medium font-medium bg-white text-black px-[24px] py-[16px] rounded-[100px]">Try Now</div>
        </div>

        <div className="flex flex-col p-16 bottom-0 h-80 border-y border-r border-l border-zinc-900 rounded-t-xl w-full bg-black gap-10 ">
          <div className="flex justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-start gap-2">
                <img src="carbon_shape-exclude.svg" alt="" className="size-10"/>
                <div className="poppins-medium text-[25px] tracking-[-4%]">Orbitron</div> 
              </div>
              <div className="flex flex-col leading-1 ">
                <p className="poppins-medium font-normal text-gray-200 text-[19px] ">Get rid of screen recording!</p>
                <p className="poppins-regular font-normal text-[15px] text-gray-500  ">v0 supports up to 5 peers per room. More coming soon.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="poppins-medium font-medium text-gray-200 text-[19px]">Product</div>
              <div className="flex gap-10">
                <div className="poppins-regular font-normal text-gray-500 text-[15px] ">Features</div>
                <div className="poppins-regular font-normal text-gray-500 text-[15px] ">How it Works</div>
                <div className="poppins-regular font-normal text-gray-500 text-[15px] ">Demo Video</div>
              </div>
            </div>
          </div>
          <div className="border-b w-[70%] self-center border-zinc-900"></div>
          <p className="poppins-medium font-normal text-gray-500 text-[15px] self-center">© 2025 Orbitron. Made with ❤️ for everyone, everywhere.</p>
        </div>

      </div>
   

    </div>
  );
}