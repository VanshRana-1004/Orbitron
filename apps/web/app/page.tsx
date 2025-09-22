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
import { useEffect } from "react";

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
          <div>About</div>
          <div>Contact</div>
        </div>

        <div className="bg-white text-black poppins-medium font-medium text-[16px] rounded-[65px] tracking-[2%] px-[18px] py-[6px]">Log In</div>

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
            background: 'linear-gradient(180deg, #7E5BEF 0%, #A66DF6 100%)',
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
              className="absolute w-[500px] h-[500px] rounded-full z-0 right-16 bottom-28 "
              style={{
                background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
                filter: 'blur(100px)',
              }}
            ></div>
                

            <div className="z-10 flex flex-col items-center justify-center gap-7">
              <p className="poppins-medium tracking-[-5%] text-[40px] text-[#B3ABAB]">Demo Video</p>
              <div className="w-[70%] h-[600px] rounded-[10px] border bg-purple-800 p-[10px]">
                <div  className="bg-black rounded-[10px] w-full h-full"></div>
              </div>
            </div>

            <div className="z-10 flex flex-col items-center justify-center gap-7">
              <p className="poppins-medium tracking-[-5%] text-[40px] text-[#B3ABAB]">Features</p>
              <div className="flex flex-col w-[1050px] h-[570px] p-[10px] rounded-[10px] gap-[10px] bg-purple-800 100%)">
                <div className="flex gap-[10px]">
                  <div className="bg-black rounded-[10px] w-[280px] h-[300px]"></div>
                  <div className="bg-black rounded-[10px] w-[450px] h-[300px]"></div>
                  <div className="bg-black rounded-[10px] w-[280px] h-[300px]"></div>
                </div>
                <div className="flex gap-[10px]">
                  <div className="bg-black rounded-[10px] w-[680px] h-[240px]"></div>
                  <div className="bg-black rounded-[10px] w-[340px] h-[240px]"></div>
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
          <div className="text-[16px] poppins-medium font-medium bg-white text-black px-[24px] py-[16px] rounded-[100px]">Get Started</div>
        </div>

        <div className=" bottom-0 h-80 border-y border-r border-l rounded-t-xl w-full bg-black ">

        </div>

      </div>
   

    </div>
  );
}