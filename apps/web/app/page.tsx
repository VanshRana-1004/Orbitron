"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return <div className='h-screen flex items-center justify-center bg-white'>
    <div className="flex flex-col items-center justify-center gap-5 p-5 bg-gray-100 rounded-lg shadow-lg">
      <h1 className="text-black text-xl font-semibold">Landing Page</h1>
      <button className="bg-gray-700 rounded px-3 py-1" onClick={()=>{router.push('/pages/signup')}}>Get Start</button>
      <button className="bg-gray-700 rounded px-3 py-1" onClick={()=>{router.push('/pages/login')}}>Sign In</button>
    </div>
  </div>
}