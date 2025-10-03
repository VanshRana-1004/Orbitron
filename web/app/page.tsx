"use client";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import XIcon from "./components/icons/x";
import LinkedinIcon from "./components/icons/linkedin";
import GithubIcon from "./components/icons/github";
import MsgIcon from "./components/icons/msg";
import CloudIcon from "./components/icons/cloud";
import LayoutIcon from "./components/icons/layout";
import ComputerIcon from "./components/icons/computer";
import { useEffect,useState,useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import BarIcon from "./components/icons/bar";

const points = [
  { heading: "Start Recording", description:'With a single click, begin recording your live call. No extra setup or tools required - just hit record and focus on the conversation. Everything starts capturing from the moment you begin.',  img: "start-recording.png" },
  { heading: "Stream Captured", description:'As the call goes on, our server automatically receives your video, audio, and screen share streams. Each participant’s feed is captured in real-time, ensuring nothing is missed during the session.',  img: "recording.png" },
  { heading: "Session Ready", description:'Once you end the call or stop recording, the entire session is carefully processed and securely saved. From your dashboard, you’ll always have the option to revisit the session, and review every detail.', img: "final-clip.png" },
];

export default function Home() {
  const router = useRouter();
  const [width,setWidth]=useState<number>(1536);
  const [showOptions,setShowOptions]=useState<boolean>(false);

  useEffect(()=>{
    const handleScreenResize=()=>{
      const wdth=window.innerWidth;
      setWidth(wdth);
    }
    handleScreenResize();
    window.addEventListener('resize',handleScreenResize);
    return ()=>{window.removeEventListener('resize',handleScreenResize)}
  },[])

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
    <div id='main' className="w-full min-h-screen flex flex-col"
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

      <div className="h-screen overflow-hidden">

        <div className={`flex justify-between items-center relative top-5 h-10 w-full ${width<800 ? 'px-3' : 'px-32'}`}>

          <div  className="flex items-center gap-2 cursor-default">
            <img src="carbon_shape-exclude.svg" alt="" className={`${width>768 ? '' : 'size-8'}`} />
            <div className={`poppins-medium ${width>768 ? 'text-[25px]' : 'text-[20px]'} tracking-[-4%]`}>Orbitron</div> 
          </div>

          {width>1024 && <div className="flex items-center gap-10 poppins-medium text-[#B6B8C3]  tracking-[-2%] text-[16px]">
            <a href={'#features'} className="hover:text-[#e8e8e8] cursor-pointer ">Features</a>
            <a href={'#works'} className="hover:text-[#e8e8e8] cursor-pointer">How it works</a>
            <a href={'#contact'} className="hover:text-[#e8e8e8] cursor-pointer">Contact</a>
          </div>}

          {width>768 
            ? 
              <button onClick={()=>router.push('/dashboard')} className={`bg-white text-black poppins-medium font-medium ${width>768 ? 'text-[16px]' : 'text-[13px]'} rounded-[65px] tracking-[2%] px-[18px] py-[6px] cursor-pointer hover:bg-gray-200 transition-transform duration-150 active:scale-95`}  >Get Started</button>
            :
              <div className="flex flex-col">
                <div onClick={()=>setShowOptions(showOptions=>!showOptions)} className="cursor-pointer"><BarIcon/></div>
                {showOptions && 
                  <div className={`flex flex-col rounded-sm absolute top-full z-10 bg-black border border-zinc-800/90 -translate-x-4 h-auto w-40 right-0 `}>
                    <a href={'#works'} onClick={()=>setShowOptions(false)} className='items-center px-3 py-1.5 hover:bg-zinc-800 cursor-pointer poppins-regular text-[14px] text-zinc-300/70  flex gap-3'>
                      How it works
                    </a>
                    <a href={'#features'} onClick={()=>setShowOptions(false)} className='items-center px-3 py-1.5 hover:bg-zinc-800 cursor-pointer poppins-regular text-[14px] text-zinc-300/70 border-t border-zinc-800/90 flex gap-3'>
                      Features
                    </a>
                    <a href={'#contact'} onClick={()=>setShowOptions(false)} className='items-center px-3 py-1.5 hover:bg-zinc-800 cursor-pointer poppins-regular text-[14px] text-zinc-300/70 border-t border-zinc-800/90 flex gap-3'>
                      Contact
                    </a>
                    <div onClick={()=>router.push('/dashboard')} className='items-center px-3 py-1.5 hover:bg-zinc-800 cursor-pointer poppins-regular text-[14px] text-zinc-300/70 border-t border-zinc-800/90 flex gap-3'>
                      Get Started
                    </div>
                  </div>
                }
              </div>
          }

        </div>

        <div className={`z-10 px-auto w-auto h-[414px] relative ${width>640 ? 'top-48' : 'top-40'} flex flex-col items-center gap-[25px]`}>

          <div className={`flex flex-col poppins-medium tracking-[-5%] items-center justify-center bg-[linear-gradient(92.22deg,rgba(255,255,255,0.4)_-6.68%,#FAF9F9_31.88%,#D1D1D1_61.39%,rgba(181,181,181,0.4)_89.88%)] bg-clip-text text-transparent`}>
              
            {width>840 && 
              <div className="flex flex-col items-center justify-center">
                <p className="text-wrap text-center text-[77px] tracking-tight leading-[80px]">Talk Freely. Record Easily.</p>
                <p className="text-wrap text-center text-[77px] tracking-tight leading-[80px]">Revisit AnyTime.</p>  
              </div>
            }

            {width>768 && width<=840 && 
              <div className="flex flex-col items-center justify-center">
                <p className="text-wrap text-center text-[60px] leading-[60px]">Talk Freely. Record Easily.</p>
                <p className="text-wrap text-center text-[60px] leading-[60px]">Revisit AnyTime.</p>  
              </div>
            }

            {width<=768 && width>600 &&
              <div className="flex flex-col items-center justify-center gap-0">
                <p className="text-wrap text-center text-[55px] leading-[50px]">Talk Freely.</p>
                <p className="text-wrap text-center text-[55px] leading-[50px]">Record Easily.</p>
                <p className="text-wrap text-center text-[55px] leading-[50px]">Revisit AnyTime.</p>  
              </div>
            }

            {width<=600 &&
              <div className="flex flex-col items-center justify-center gap-0">
                <p className="text-wrap text-center text-[45px] leading-[50px]">Talk Freely.</p>
                <p className="text-wrap text-center text-[45px] leading-[50px]">Record Easily.</p>
                <p className="text-wrap text-center text-[45px] leading-[50px]">Revisit AnyTime.</p>  
              </div>
            }

          </div>

          <div className={`flex flex-col text-wrap items-center justify-center poppins-medium font-normal `}>
            <p className={`text-wrap w-[80%] text-center ${width>768 ? 'text-[18px] text-gray-300' : 'text-[15px] text-gray-400'} tracking-[-2%]`}>Orbitron combines real-time video calls with instant session recording - no extra setup, no hassle.</p>
          </div>
          
          <div className="flex gap-[20px]">
            <button onClick={()=>router.push('/dashboard')} className={`${width>768 ? 'text-[16px]' : 'text-[14px]'} poppins-medium font-medium bg-white text-black px-[24px] py-[14px] rounded-[100px] cursor-pointer hover:bg-gray-200 transition-transform duration-150 active:scale-95`}>Explore Now</button>
            <a href={'#demo'} className={`${width>768 ? 'text-[16px]' : 'text-[14px]'} poppins-medium font-medium bg-black text-white px-[24px] py-[14px] rounded-[100px] cursor-pointer hover:bg-zinc-900 transition-transform duration-150 active:scale-95`}>Demo Video</a>
          </div>

        </div>   

        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-[250px] w-full z-0"
          style={{
            height: '500px',
            background: 'linear-gradient(180deg, #7E5BEF 0%, #7E5BEF 100%)',
            filter: 'blur(125px)',
            borderRadius: '100%',
          }}
        ></div>

      </div>

      <div className="relative min-h-screen z-10 bg-black flex flex-col gap-40 py-40 overflow-hidden"
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
          className={`absolute w-[500px] h-[500px] rounded-full z-0 left-16 ${width<768 ? 'top-0 -translate-y-20 translate-x-10' : 'top-28'}`}
          style={{
            background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
            filter: 'blur(100px)',
          }}
        ></div>
        
        <div
          className={`absolute w-[500px] h-[500px] rounded-full z-0 top-1/2 ${width<768 ? '-translate-y-80 -translate-x-80' : 'right-0 translate-x-48'}`}
          style={{
            background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
            filter: 'blur(100px)',
          }}
        ></div>

        <div id='demo' className="z-10 flex flex-col items-center justify-center gap-7">
          <p className={` ${width<768 ? 'text-[35px]' : 'text-[60px]'} leading-[60px] poppins-medium tracking-[-5%] items-center justify-center bg-[linear-gradient(92.22deg,rgba(255,255,255,0.4)_-6.68%,#FAF9F9_31.88%,#D1D1D1_61.39%,rgba(181,181,181,0.4)_89.88%)] bg-clip-text text-transparent poppins-medium `}>Demo Video</p>
          <div className={`${width<768 ? 'w-[90%]  p-[2px]' : 'w-[70%]  p-[5px]'} rounded-[10px] border border-zinc-900 bg-black `}
            style={{background: "radial-gradient(125% 125% at 50% 100%, #18181B 40%, #7E5BEF 100%)",aspectRatio: width>768 ? 16/9 : 13/9}}>
            <div  className="bg-black rounded-[10px] w-full h-full"></div>
          </div>
        </div>

        <div id='works' className="z-10 flex flex-col items-center justify-center gap-7">
          <p className={`${width<768 ? 'text-[35px]' : 'text-[60px]'} leading-[60px] poppins-medium tracking-[-5%] items-center justify-center bg-[linear-gradient(92.22deg,rgba(255,255,255,0.4)_-6.68%,#FAF9F9_31.88%,#D1D1D1_61.39%,rgba(181,181,181,0.4)_89.88%)] bg-clip-text text-transparent poppins-medium `}>How Orbitron Works</p>
          <div className={`relative ${width<1100 ? 'w-[90%] p-[2px] overflow-hidden' : 'w-[70%]  p-[5px]'} rounded-[10px] border border-zinc-900 `} 
          style={{
            background: 
              activeIndex === 0
              ? 'radial-gradient(125% 125% at 50% 100%, #7E5BEF 40%, #EC4899 100%)'
              : activeIndex === 1
              ? 'radial-gradient(125% 125% at 50% 100%, #7E5BEF 40%, #EAB308 100%)'
              : 'radial-gradient(125% 125% at 50% 100%, #7E5BEF 40%, #EF4444 100%)',
          }}>
              
            <div  className={`flex ${width<1000 && 'flex-col'} bg-black rounded-[10px] w-full h-full px-10 ${width<768 ? 'py-5' : 'py-10'}`}
            style={{
                backgroundColor: '#000000',
                backgroundImage: `
                  radial-gradient(circle at 25% 25%, #222222 0.5px, transparent 1px),
                  radial-gradient(circle at 75% 75%, #111111 0.5px, transparent 1px)
                `,
                backgroundSize: '10px 10px',
                imageRendering: 'pixelated',
              }}>
              
              <div className={`flex  gap-16  rounded-l-[10px] ${width<768 ? 'w-full py-8 h-1/2' : width<1000 ? 'w-full h-1/2 pt-16 py-8' : 'w-1/2 h-full px-16 pr-5 py-24'}`}>

                <div className={`flex flex-col w-full h-full gap-5 `}>
                  <div className={`flex flex-col justify-end gap-2   items-start`}>
                    <p className={`${width<600 ? 'text-5xl' : 'text-7xl'} poppins-semibold font-semibold ${activeIndex==0 ? 'text-[#EC4899]' : activeIndex==1 ? 'text-[#EAB308]' : 'text-[#EF4444]'}`}>0{activeIndex+1}</p>
                    <p className={`poppins-medium tracking-[-5%]  text-[#d5cfcf] text-wrap w-full ${width<768 ? 'text-[30px]' : 'text-[40px]' }`}>{points[activeIndex]?.heading}</p>
                  </div>
                  <p className={`poppins-medium tracking-[-2%] ${width>768 ? 'text-[20px]' : 'text-[15px]' } text-gray-400 text-wrap ${width<1000?'w-full':'w-[80%]'} leading-[-5%] `}>{points[activeIndex]?.description}</p>
                </div>
            
              </div>
                
              <div className={`flex flex-col rounded-r-[10px] flex-1 h-full p-6 justify-center`}>
                <img key={activeIndex} src={points[activeIndex]?.img} style={{ opacity: 1 }} alt="corresponding" className={`border ${activeIndex==0 ? 'border-[#EC4899]' : activeIndex==1 ? 'border-[#EAB308]' : 'border-[#bc1f1f]'}  object-cover ${width<1100 ? 'h-[80%]' : 'h-[50%]'} transition-opacity duration-1000 w-[100%] rounded-[10px] bg-zinc-900`}></img>
              </div>

            </div>

            <div
              onClick={() =>
                setActiveIndex((activeIndex) => (3 + activeIndex - 1) % 3)
              }
              className={`absolute top-1/2 -translate-y-1/2 p-3 ${width<768 && 'p-2 translate-y-8'} left-3 
                rounded-full bg-white/20 backdrop-blur-md 
                border border-white/30 shadow-lg 
                hover:bg-white/30 transition cursor-pointer`}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>

            <div
              onClick={() =>
                setActiveIndex((activeIndex) => (activeIndex + 1) % 3)
              }
              className={`absolute top-1/2 -translate-y-1/2 p-3 ${width<768 && 'p-2 translate-y-8'} right-3 
                rounded-full  bg-white/20 backdrop-blur-md 
                border border-white/30 shadow-lg 
                hover:bg-white/30 transition cursor-pointer`}
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
              
            <div className={`flex absolute gap-2 bottom-5 left-1/2 -translate-x-1/2 `}>
              <div className={`p-1.5 rounded-full ${activeIndex==0 ? 'bg-gray-300' : 'bg-white/20'}`}></div>
              <div className={`p-1.5 rounded-full ${activeIndex==1 ? 'bg-gray-300' : 'bg-white/20'}`}></div>
              <div className={`p-1.5 rounded-full ${activeIndex==2 ? 'bg-gray-300' : 'bg-white/20'}`}></div>
            </div>

          </div>
        </div>

        <div id='features' className="z-10 flex flex-col items-center justify-center gap-7">
          <p className={`${width<768 ? 'text-[35px]' : 'text-[60px]'} leading-[60px] poppins-medium tracking-[-5%] items-center justify-center bg-[linear-gradient(92.22deg,rgba(255,255,255,0.4)_-6.68%,#FAF9F9_31.88%,#D1D1D1_61.39%,rgba(181,181,181,0.4)_89.88%)] bg-clip-text text-transparent poppins-medium`}>Features</p>
          <div className={`flex flex-col ${width>1200 ? 'w-[75%]' : 'w-[90%] h-auto'} p-[10px] rounded-[10px] gap-[10px] border border-zinc-800 bg-[#7E5BEF]/20 backdrop-blur-5xl shadow-xl overflow-hidden`}
            style={{aspectRatio:width>1200 ? 16/9 : 0}}
          >
            
            <div className={`flex w-full gap-[10px] h-[50%] ${width<1200 && 'flex-col'}`}>
             
              <div className={`bg-black rounded-[10px] ${width<1200 ? 'w-full h-auto' : 'w-[30%] h-full'}  relative border border-zinc-800 overflow-hidden p-8 gap-3 flex flex-col transform transition-transform duration-300 ${width>768 && 'hover:scale-105 hover:z-20'} z-10`}
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
                  style={{background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
                  filter: 'blur(100px)',}}>
                </div>

                <div className={`flex flex-col gap-2 items-start`}>
                  <div className={`${width<768 && '-translate-x-10'}`}><ComputerIcon/></div>
                  <div className={`poppins-medium tracking-[-5%] text-[#B3ABAB] leading-none ${width<768 ? 'text-[18px]' : 'text-[28px]'}`}>Seamless Screen Sharing</div>
                </div>
                <div className={`poppins-medium tracking-[-5%] ${width>768 ? 'text-[16px]' : 'text-[14px]'} text-gray-500 text-wrap`}>Share your screen in real time with crystal clarity, perfect for demos and collaborations.</div>
              
              </div>

              <div className={`bg-black rounded-[10px] ${width<1200 ? 'w-full h-auto' : 'w-[40%] h-full'}  relative border border-zinc-800 overflow-hidden p-8 gap-3 flex flex-col transform transition-transform duration-300 ${width>768 && 'hover:scale-105 hover:z-20'} z-10`}
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
                      <div className="poppins-semibold text-[30px] text-[#7E5BEF]">REC</div>
                    </div>
                    <div className={`poppins-medium tracking-[-5%] text-[#B3ABAB] leading-none ${width<768 ? 'text-[18px]' : 'text-[28px]'}`}>Automatic Session Recording</div>
                  </div>
                  <div className={`poppins-medium tracking-[-5%] ${width>768 ? 'text-[16px]' : 'text-[14px]'} text-gray-500 text-wrap`}>Forget messy screen recorders - your calls are captured directly on our servers from the start.</div>
    
              
              </div>

              <div className={`bg-black rounded-[10px] ${width<1200 ? 'w-full h-auto' : 'w-[30%] h-full'}  relative border border-zinc-800 overflow-hidden p-8 gap-3 flex flex-col transform transition-transform duration-300 ${width>768 && 'hover:scale-105 hover:z-20'} z-10`}
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
                    <div className={`${width<768 && '-translate-x-5'}`}><CloudIcon/></div>
                    <div className={`poppins-medium tracking-[-5%] text-[#B3ABAB] leading-none ${width<768 ? 'text-[18px]' : 'text-[28px]'}`}>Cloud-Stored Final Clips</div>
                  </div>
                  <div className={`poppins-medium tracking-[-5%] ${width>768 ? 'text-[16px]' : 'text-[14px]'} text-gray-500 text-wrap`}>Every session is securely stored in the cloud, ready to revisit anytime.</div>
              </div>

            </div>

            <div className={`flex w-full gap-[10px] h-[50%] ${width<1200 && 'flex-col'}`}>
              
              <div className= {`overflow-hidden relative flex flex-col rounded-[10px] ${width<1200 ? 'w-full h-auto' : 'w-[60%] h-full'}  p-8 gap-3 border border-zinc-800 bg-black transform transition-transform duration-300 ${width>768 && 'hover:scale-105 hover:z-20'} z-10`} 
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
                  <div className={`${width<768 && '-translate-x-5'}`}><LayoutIcon/></div>
                  <div className={`poppins-medium tracking-[-5%] text-[#B3ABAB] leading-[1.1] ${width<768 ? 'text-[18px]' : 'text-[28px]'}`}>Dynamic Peer Management</div>
                </div>
                <div className={`poppins-medium tracking-[-5%] ${width>768 ? 'text-[16px]' : 'text-[14px]'} text-gray-500 text-wrap`}>Peers can join or leave anytime — we handle it smoothly. Currently supports up to 5 peers (scalability in progress).</div>
   
              </div>

              <div className={` bg-black rounded-[10px] ${width<1200 ? 'w-full h-auto' : 'w-[40%] h-full'}  border border-zinc-800 relative overflow-hidden flex flex-col p-8 gap-3 transform transition-transform duration-300 ${width>768 && 'hover:scale-105 hover:z-20'} z-10`}
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
                    <div className={`${width<768 && '-translate-x-5'}`}><MsgIcon/></div>
                    <div className={`poppins-medium tracking-[-5%] text-[#B3ABAB] leading-none ${width<768 ? 'text-[18px]' : 'text-[28px]'}`}>Built-in Chat Messaging</div>
                  </div>
                  <div className={`poppins-medium tracking-[-5%] ${width>768 ? 'text-[16px]' : 'text-[14px]'} text-gray-500 text-wrap`}>Stay connected with integrated messaging alongside your video calls.</div>

              </div>
  
            </div>
              
          </div>          
        </div>                

      </div>
      
      <div
        className={`w-full h-auto pt-28 gap-24 flex flex-col items-center bg-black ${width<768 ? 'px-2' : 'px-16' }`}
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
          <div className="flex flex-col leading-0 items-center justify-center gap-0">
            <p className={`font-regular poppins-medium ${width>768 ? 'text-[45px] text-gray-300' : 'text-[20px] text-gray-400'} tracking-[-4%]`}>Conversations That Last Forever</p>
            <p className={`font-regular poppins-medium ${width>768 ? 'text-[25px] text-gray-400' : 'text-[16px] text-gray-500'} tracking-[-4%]`}>Connect. Capture. Replay.</p>
          </div>
          <button onClick={()=>router.push('/dashboard')} className={`${width>768 ? 'text-[16px]' : 'text-[14px]'} poppins-medium font-medium bg-white hover:bg-gray-200 cursor-pointer text-black px-[24px] py-[14px] rounded-[100px] transition-transform duration-150 active:scale-95`}>Try Now</button>
        </div>

        <div className={`flex flex-col ${width<768 ? 'p-8 px-5' : 'p-12'} flex-1 border-y border-r border-l border-b-0 border-zinc-800 rounded-t-xl w-full bg-black gap-8 `}>
          <div className={`flex justify-between ${width<768 && 'flex-col gap-10'}`}>
            <div className={`flex flex-col gap-2 ${width<768 && 'items-center gap-6'}`}>
              <a href={'#main'} className="flex items-center justify-start gap-2 cursor-pointer">
                <img src="carbon_shape-exclude.svg" alt="" className={`${width>768 ? '' : 'size-8'}`} />
                <div className={`poppins-medium ${width>768 ? 'text-[25px]' : 'text-[20px]'} tracking-[-4%] `}>Orbitron</div> 
              </a>
              <div className={`flex flex-col leading-1 ${width<768 && 'items-center'}`}>
                <p className={`poppins-medium font-normal text-gray-200 ${width>768 ? 'text-[19px]' : 'text-[16px]'}`}>Get rid of screen recording!</p>
                <p className={`poppins-regular font-normal ${width>768 ? 'text-[15px]' : 'text-[14px]'} text-gray-500 text-wrap text-center`}>v0 supports up to 5 peers per room. More coming soon.</p>
              </div>
              
            </div>
            <div className={`flex flex-col gap-2 ${width<768 && 'items-center'}`}>
              <div className={`poppins-medium font-medium text-gray-200 ${width>768 ? 'text-[19px]' : 'text-[16px]'}`}>Product</div>
              <div className={`flex ${width<768 ? 'gap-5  -translate-y-2' : 'gap-10'}`}>
                <a href={'#works'} className={`poppins-regular font-normal text-gray-500 ${width>768 ? 'text-[15px]' : 'text-[14px]'} hover:text-[#e8e8e8] cursor-pointer`}>How it Works</a>
                <a href={'#features'} className={`poppins-regular font-normal text-gray-500 ${width>768 ? 'text-[15px]' : 'text-[14px]'} hover:text-[#e8e8e8] cursor-pointer`}>Features</a>
                <a href={'#demo'} className={`poppins-regular font-normal text-gray-500 ${width>768 ? 'text-[15px]' : 'text-[14px]'} hover:text-[#e8e8e8] cursor-pointer`}>Demo Video</a>
              </div>
            </div> 

          </div>
          <div id={'contact'} className="flex gap-8 self-center items-center">
              <a href="https://x.com/Rana2K5" target="_blank" rel="noopener noreferrer" className="cursor-pointer border border-transparent p-1 hover:bg-zinc-950 hover:border-zinc-800 rounded"><XIcon/></a>
              <a href="https://www.linkedin.com/in/vansh-rana-a8b528261/" target="_blank" rel="noopener noreferrer" className="cursor-pointer border border-transparent p-1 hover:bg-zinc-950 hover:border-zinc-800 rounded"><LinkedinIcon/></a>
              <a href="https://github.com/VanshRana-1004" target="_blank" rel="noopener noreferrer" className="cursor-pointer border border-transparent p-1 hover:bg-zinc-950 hover:border-zinc-800 rounded"><GithubIcon/></a>
          </div>
          <div className="border-b w-[70%] self-center border-zinc-800"></div>
          <p className={`poppins-medium font-normal text-gray-500 ${width>768 ? 'text-[15px]' : 'text-[14px]'} self-center text-wrap text-center`}>© 2025 Orbitron. Made with ❤️ for everyone, everywhere.</p>
        </div>

      </div>
                                
    </div>
  );
}