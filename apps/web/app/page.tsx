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
import { useEffect, useState } from "react";
import axios from "axios";

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
  const [fb,setFb]=useState<number>(1);

  useEffect(()=>{
    async function getFeedbacks(){
      const res=await axios.get('/api/auth/get-feedback',{
        params : {
          page : fb-1 
        }
      });
      console.log(res.data);
    }
    if(fb%4===1) getFeedbacks();
  },[fb]);
  
  return <div className="relative min-h-screen w-full overflow-hidden">
  
    <div className="top-0 left-0 absolute w-full h-full z-10 pointer-events-none
      [background-image:linear-gradient(to_right,#CDFCE7_1px,transparent_1px),linear-gradient(to_bottom,#CDFCE7_1px,transparent_1px)]
      [background-size:60px_60px]
      dark:[background-image:linear-gradient(to_right,#0B0F17_1px,transparent_1px),linear-gradient(to_bottom,#0B0F17_1px,transparent_1px)]">
    </div>

    <div className="relative flex flex-col items-center justify-center bg-white dark:bg-black ">

      <div className="absolute w-full top-5 left-0 flex justify-around px-52 items-center ">
        
        <div className="w-1/3 flex justify-start z-20">
          <a href="/" className=" w-[80px] sm:w-[101px] h-[40px] sm:h-[54px]">
              <img
                  src="/logo.png"
                  alt="My Logo"
                  className="w-full h-full object-contain dark:hidden"
              />
        
              <img
                  src="/logo-dark.png"
                  alt="My Dark Logo"
                  className="w-full h-full object-contain hidden dark:block"
              />
          </a>
        </div>
      
        <div className="w-1/3 justify-center z-20 self-center items-center flex text-[#16422E] dark:text-white dark:font-normal gap-12 font-inter font-semibold text-[16px] tracking-tight">
          <p className="cursor-pointer">Features</p>
          <p className="cursor-pointer">Feedback</p>
          <p className="cursor-pointer">Contact</p>
        </div>

        <div className="w-1/3 justify-end z-20 self-center items-center flex text-[#16422E] dark:text-white dark:font-normal gap-3 font-inter font-semibold text-[16px] tracking-tight">
          <ThemeToggle text={false} bg={false}/>
          <div onClick={()=>router.push('/login')} className="cursor-pointer">Log In</div>
          <div className="h-full py-3 border border-[#16422E] dark:border-[#FFFFFF]"></div>
          <div onClick={()=>router.push('/signup')} className="cursor-pointer">Get Started</div>
        </div>
      
      </div>

      <div className="relative h-screen w-full flex flex-col bg-[radial-gradient(ellipse_at_center,_#FFFEFE_0%,_#f4fffa_38%,_#FFFFFF_100%)] dark:min-h-screen dark:bg-[url('/dark-landing-bg-1.png')] bg-[#03070E] dark:bg-right bg-no-repeat bg-contain dark:bg-[length:92%_100%]">

        <div className="absolute top-1/2 -translate-y-1/2 w-full px-52 justify-self-start flex flex-col z-20">
          <h1 className="text-7xl m-[-2px] tracking-tight leading-none urbanist-font text-[#16422E] dark:text-[#0076FC] ">Talk Freely.</h1>
          <h1 className="text-7xl m-[-2px] tracking-tight leading-none urbanist-font text-[#31C585] dark:text-[#FFFFFF] ">Record Easily.</h1>
          <h1 className="text-7xl m-[-2px] tracking-tight leading-none urbanist-font text-[#31C585] dark:text-[#FFFFFF] ">Revisit Anytime.</h1>
          <p className="geist-font tracking-tight mt-[22px] text-[18px] w-1/2 text-[#16422E] dark:text-[#FFFFFF] text-wrap ">Orbitron combines real-time video calls with instant session recording — no extra setup, no hassle.</p>
          <div className="z-20 -translate-x-16 mt-[22px] w-3/5 h-[33px] rounded-full bg-[radial-gradient(ellipse_at_center,_#86888F_0%,_#45F1A6_22%,_transparent_100%)] dark:bg-[radial-gradient(ellipse_at_center,_#86888F_0%,_#1E252F_40%,_transparent_100%)] blur-[28px] opacity-60 "></div>
          <div onClick={()=>{router.push('/signup')}} className="cursor-pointer mt-[28px] rounded-md bg-[#16422E] w-fit py-2 px-10 font-semibold dark:bg-[#0076FC] text-white ">Explore now</div>
        </div>

          <div className="flex flex-col overflow-visible self-end right-0 w-1/2 h-screen rounded-bl-full bg-[radial-gradient(at_bottom_left,_#e0feef_100%,_#FFFFFF_0%)] dark:hidden">
            <div className="flex overflow-visible self-end h-full w-1/2 bg-white">
              <div className="absolute top-1/2 -translate-y-1/2 right-52  w-[410px] h-[410px] z-20 object-cover rounded-[95px] bg-no-repeat bg-contain bg-[url('/hero.png')]"></div>
              <div className="absolute top-1/2 -translate-y-1/3  right-40  w-[500px] h-[500px] z-20 bg-no-repeat bg-contain bg-[url('/ring.png')]"></div>
            </div>
          </div>
          <div className="overflow-visible self-end h-full w-1/4 bg-[#03070E] hidden dark:flex">
            <div className="absolute top-1/2 -translate-y-1/2 right-52 z-20 w-[410px] h-[410px] object-cover rounded-[95px] bg-no-repeat bg-contain bg-[url('/hero.png')]"></div>
            <div className="absolute top-1/2 -translate-y-1/3  right-40 z-20 w-[500px] h-[500px] bg-no-repeat bg-contain bg-[url('/ring-dark.png')] dark:block"></div>
          </div>
      </div>

      <div className="relative h-[900px] overflow-visible w-full flex flex-col justify-center bg-[#f7fffb] dark:bg-[#03070E]">
        <div className="absolute flex flex-col overflow-visible top-0 left-0 w-1/2 h-screen rounded-br-full bg-[radial-gradient(at_bottom_left,_#e0feef_100%,_#FFFFFF_0%)] dark:bg-[radial-gradient(circle_at_top_left,_#02060D_5%,_#0B0F17_95%)]"></div>
        <div className="z-20 flex gap-2 px-2 py-2 absolute my-auto self-center w-[70%] h-[60%]  left-1/2 -translate-x-1/2 rounded-[20px] bg-gradient-to-rb from-[#84ffc8] via-[#74e9b4] to-[#19a868] backdrop-blur-[70.9px] border-[#7AF8C1] dark:from-[#00040B] dark:via-[#00040B] dark:to-[#172332] dark:border-[#1d2d42] border-[1.42px] shadow-[inset_0_0_70.9px_#EDFBF5] dark:shadow-[inset_0_0_20px_#182537]">
          <div className="flex flex-col gap-2 w-[70%] h-full z-20">
            <div className="flex w-full gap-2 h-1/2 z-20">
              <div className="flex w-[45%] z-20 h-full bg-gradient-to-rb flex-col from-[#CDFCE7] via-[#A5EFCE] to-[#A5EFCE] backdrop-blur-[70.9px] border-[#7AF8C1] dark:from-[#00040B] dark:via-[#00040B] dark:to-[#172332] dark:border-[#1d2d42] border-[1.42px] shadow-[inset_0_0_70.9px_#EDFBF5] dark:shadow-[inset_0_0_5px_#182537] rounded-[20px]">
                <div className="flex py-3 h-fit justify-start items-center w-full">
                  <CameraIcon/>
                  <p className="text-wrap geist-font font-medium text-xl -translate-x-3 text-[#16422E] dark:text-[#FFFFFF] tracking-tight">Real-Time Video Calling</p>
                </div>
                <div className="w-full h-full px-2 pb-2 ">
                  <div className="flex px-8 tracking-tight font-regular py-8 geist-font text-[#16422E] dark:text-gray-300 text-wrap w-full h-full border border-[#7AF8C1] dark:border-[#1d2d42] rounded-[14.1808px] shadow-[inset_21.2712px_21.2712px_151.948px_#F9F9F9] backdrop-blur-[15.8116px] bg-[linear-gradient(115.77deg,_rgba(109,215,169,0.6)_2.34%,_rgba(178,255,222,0.6)_47.28%)] dark:shadow-[inset_0px_0px_10px_#23344C] dark:backdrop-blur-[42.25px] dark:bg-[linear-gradient(307.82deg,_rgba(0,4,11,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)]">
                    Connect with up to 5 participants — smooth visuals and clear audio for real conversations.
                  </div>
                </div>
              </div>
              <div className="flex w-[55%] z-20 h-full bg-gradient-to-rb flex-col from-[#CDFCE7] via-[#A5EFCE] to-[#A5EFCE] backdrop-blur-[70.9px] border-[#7AF8C1] dark:from-[#00040B] dark:via-[#00040B] dark:to-[#172332] dark:border-[#1d2d42] border-[1.42px] shadow-[inset_0_0_70.9px_#EDFBF5] dark:shadow-[inset_0_0_5px_#182537] rounded-[20px]">
                <div className="flex py-3 h-fit justify-start items-center w-full">
                  <RecordIcon/>
                  <p className="text-wrap geist-font font-medium text-xl -translate-x-3 text-[#16422E] dark:text-[#FFFFFF] tracking-tight">In-App Recording</p>
                </div>
                <div className="w-full h-full px-2 pb-2 ">
                  <div className="flex px-8 tracking-tight font-regular py-8 geist-font text-[#16422E] dark:text-gray-300 text-wrap w-full h-full border border-[#7AF8C1] dark:border-[#1d2d42] rounded-[14.1808px] shadow-[inset_21.2712px_21.2712px_151.948px_#F9F9F9] backdrop-blur-[15.8116px] bg-[linear-gradient(115.77deg,_rgba(109,215,169,0.6)_2.34%,_rgba(178,255,222,0.6)_47.28%)] dark:shadow-[inset_0px_0px_10px_#23344C] dark:backdrop-blur-[42.25px] dark:bg-[linear-gradient(307.82deg,_rgba(0,4,11,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)]">
                    Start recording with one click — the app captures the entire session for you.
                  </div>
                </div>
              </div>
            </div>
            <div className="flex z-20 w-full gap-2 h-1/2">
              <div className="flex w-[60%] z-20 h-full bg-gradient-to-rb flex-col from-[#CDFCE7] via-[#A5EFCE] to-[#A5EFCE] backdrop-blur-[70.9px] border-[#7AF8C1] dark:from-[#00040B] dark:via-[#00040B] dark:to-[#172332] dark:border-[#1d2d42] border-[1.42px] shadow-[inset_0_0_70.9px_#EDFBF5] dark:shadow-[inset_0_0_5px_#182537] rounded-[20px]">
                <div className="flex py-3 h-fit justify-start items-center w-full">
                  <LockIcon/>
                  <p className="text-wrap geist-font font-medium text-xl text-[#16422E] dark:text-[#FFFFFF] tracking-tight">Secure and Private Rooms</p>
                </div>
                <div className="w-full h-full px-2 pb-2 ">
                  <div className="flex px-8 tracking-tight font-regular py-8 geist-font text-[#16422E] dark:text-gray-300 text-wrap w-full h-full border border-[#7AF8C1] dark:border-[#1d2d42] rounded-[14.1808px] shadow-[inset_21.2712px_21.2712px_151.948px_#F9F9F9] backdrop-blur-[15.8116px] bg-[linear-gradient(115.77deg,_rgba(109,215,169,0.6)_2.34%,_rgba(178,255,222,0.6)_47.28%)] dark:shadow-[inset_0px_0px_10px_#23344C] dark:backdrop-blur-[42.25px] dark:bg-[linear-gradient(307.82deg,_rgba(0,4,11,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)]">
                    Secure, private rooms designed to protect every call and recording.
                  </div>
                </div>
              </div>
              <div className="flex w-[40%] z-20 h-full bg-gradient-to-rb flex-col from-[#CDFCE7] via-[#A5EFCE] to-[#A5EFCE] backdrop-blur-[70.9px] border-[#7AF8C1] dark:from-[#00040B] dark:via-[#00040B] dark:to-[#172332] dark:border-[#1d2d42] border-[1.42px] shadow-[inset_0_0_70.9px_#EDFBF5] dark:shadow-[inset_0_0_5px_#182537] rounded-[20px]">
                <div className="flex py-3 h-fit justify-start items-center w-full">
                  <LayoutIcon/>
                  <p className="text-wrap geist-font font-medium text-xl -translate-x-3 text-[#16422E] dark:text-[#FFFFFF] tracking-tight">Dynamics Layouts</p>
                </div>
                <div className="w-full h-full px-2 pb-2 ">
                  <div className="flex px-8 tracking-tight font-regular py-8 geist-font text-[#16422E] dark:text-gray-300 text-wrap w-full h-full border border-[#7AF8C1] dark:border-[#1d2d42] rounded-[14.1808px] shadow-[inset_21.2712px_21.2712px_151.948px_#F9F9F9] backdrop-blur-[15.8116px] bg-[linear-gradient(115.77deg,_rgba(109,215,169,0.6)_2.34%,_rgba(178,255,222,0.6)_47.28%)] dark:shadow-[inset_0px_0px_10px_#23344C] dark:backdrop-blur-[42.25px] dark:bg-[linear-gradient(307.82deg,_rgba(0,4,11,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)]">
                    Layouts adapt to your call — no need to edit recordings.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex z-20 flex-col gap-2 w-[30%] h-full ">
            <div className="flex justify-start  items-center h-[25%] w-full z-20 bg-gradient-to-rb from-[#CDFCE7] via-[#A5EFCE] to-[#A5EFCE] backdrop-blur-[70.9px] border-[#7AF8C1] dark:from-[#00040B] dark:via-[#00040B] dark:to-[#172332] dark:border-[#1d2d42] border-[1.42px] shadow-[inset_0_0_70.9px_#EDFBF5] dark:shadow-[inset_0_0_5px_#182537] rounded-[20px]">
              <MsgIcon/>
              <p className="text-wrap geist-font font-medium text-xl -translate-x-3 text-[#16422E] dark:text-[#FFFFFF] tracking-tight">Integrated Chat System</p>
            </div>
            <div className="flex h-[50%] w-full z-20 bg-gradient-to-rb flex-col from-[#CDFCE7] via-[#A5EFCE] to-[#A5EFCE] backdrop-blur-[70.9px] border-[#7AF8C1] dark:from-[#00040B] dark:via-[#00040B] dark:to-[#172332] dark:border-[#1d2d42] border-[1.42px] shadow-[inset_0_0_70.9px_#EDFBF5] dark:shadow-[inset_0_0_5px_#182537] rounded-[20px]">
              <div className="flex py-3 h-fit justify-start items-center w-full">
                <CloudIcon/>
                <p className="text-wrap geist-font font-medium text-xl -translate-x-3 text-[#16422E] dark:text-[#FFFFFF] tracking-tight">Cloud Storage</p>
              </div>
              <div className="w-full h-full px-2 pb-2 ">
                  <div className="flex px-8 tracking-tight font-regular py-8 geist-font text-[#16422E] dark:text-gray-300 text-wrap w-full h-full border border-[#7AF8C1] dark:border-[#1d2d42] rounded-[14.1808px] shadow-[inset_21.2712px_21.2712px_151.948px_#F9F9F9] backdrop-blur-[15.8116px] bg-[linear-gradient(115.77deg,_rgba(109,215,169,0.6)_2.34%,_rgba(178,255,222,0.6)_47.28%)] dark:shadow-[inset_0px_0px_10px_#23344C] dark:backdrop-blur-[42.25px] dark:bg-[linear-gradient(307.82deg,_rgba(0,4,11,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)]">
                    Clips are securely stored in the cloud — no backups or local space needed.
                  </div>
              </div>
            </div>
            <div className="flex justify-start  items-center h-[25%] w-full z-20 bg-gradient-to-rb from-[#CDFCE7] via-[#A5EFCE] to-[#A5EFCE] backdrop-blur-[70.9px] border-[#7AF8C1] dark:from-[#00040B] dark:via-[#00040B] dark:to-[#172332] dark:border-[#1d2d42] border-[1.42px] shadow-[inset_0_0_70.9px_#EDFBF5] dark:shadow-[inset_0_0_5px_#182537] rounded-[20px]">
              <ComputerIcon/>
              <p className="text-wrap geist-font font-medium text-xl -translate-x-3 text-[#16422E] dark:text-[#FFFFFF] tracking-tight">Screen Sharing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-[1000px] overflow-visible w-full flex flex-col justify-evenly bg-[#f7fffb] dark:bg-[#03070E]">
        <div className="absolute flex flex-col overflow-visible self-end right-0 top-0 w-1/2 h-screen rounded-bl-full bg-[radial-gradient(at_bottom_right,_#e0feef_100%,_#FFFFFF_0%)] dark:bg-[radial-gradient(circle_at_top_right,_#02060D_5%,_#0B0F17_95%)]"></div>
        <div className="flex z-20 flex-col justify-evenly items-center gap-2 w-[60%] h-[25%] self-center rounded-[20px] bg-gradient-to-rb from-[#CDFCE7] via-[#A5EFCE] to-[#A5EFCE] backdrop-blur-[70.9px] border-[#7AF8C1] dark:from-[#00040B] dark:via-[#00040B] dark:to-[#172332] dark:border-[#1d2d42] border-[1.42px] shadow-[inset_0_0_70.9px_#EDFBF5] dark:shadow-[inset_0_0_20px_#182537]">
          <div className="geist-font z-20 font-semibold text-3xl text-[#16422E] dark:text-white">Try it out — experience the call flow!</div>
          <div className="w-full z-20 flex justify-evenly">
            <div onClick={handleGoogleLogin} className="py-2 z-20 px-20 font-inter cursor-pointer font-semibold rounded-lg text-white bg-[#16422E] dark:bg-[#0076FC]">Continue with Google</div>
            <div onClick={()=>{router.push('/login')}} className="py-2 z-20 px-20 font-inter cursor-pointer font-semibold rounded-lg text-white bg-[#31C585] dark:bg-white dark:text-[#03070E]">Continue with Email</div>
          </div>
        </div>
        <div className="w-[80%] flex flex-col z-20 self-center items-center">
          <p className="geist-font z-20 font-semibold text-3xl text-[#16422E] dark:text-white">User's Reviews</p>
        </div>

      </div>

      <div className="flex z-20 px-36 py-10 gap-6 flex-col justify-start h-[300px] w-full bg-[#DFFFF0] dark:bg-[#03070E] border-t-2 border-t-[#c0ffe1] dark:border-t-[#0D1523] shadow-[inset_0_6px_6px_-4px_#FFFFFF] dark:shadow-[inset_0_6px_6px_-4px_#0D1523]">
        <a href="/" className="h-[54px] z-20 w-[100px]">
            <img
                src="/logo.png"
                alt="My Logo"
                className="w-full h-full object-contain dark:hidden"
            />
        
            <img
                src="/logo-dark.png"
                alt="My Dark Logo"
                className="w-full h-full object-contain hidden dark:block"
            />
        </a>
        <p className="geist-font z-20 font-normal text-[16px] text-[#16422E] dark:text-white">Collaborate, record, and share your coding journey with ease.<br/> We’re just getting started! Join us on our journey to build the most seamless and powerful in-call recording platform.</p>
        <p className="geist-font z-20 font-normal text-[16px] text-[#16422E] dark:text-white">Having an issue? Write us at :
          <a className="geist-font z-20 font-semibold"> teamorbitrofficial01@gmail.com</a>
        </p>
        <p className="geist-font z-20 font-normal flex gap-5 text-[#16422E] dark:text-[#FFFFFF]">Contact Developer : 
          <XIconWrapper/>
          <LinkedIconWrapper/>
          <GithubIconWrapper/>
        </p>
      </div>
    </div>
  </div>
}