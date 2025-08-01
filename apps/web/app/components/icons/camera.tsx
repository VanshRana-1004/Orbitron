'use client';

import { useEffect, useState } from "react";
import { useTheme } from "next-themes"; 

export default function CameraIcon(){
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme(); 

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; 

  return (
    <div className="flex">
        {theme === 'light'
        ? <Camera stroke={"#31C585"} />
        : <Camera stroke={"#0076FC"} />}
    </div>      
  );
}

interface props{
    stroke:string
}
function Camera(props : props){
    return <svg xmlns="http://www.w3.org/2000/svg" fill={props.stroke} width="160"  viewBox="0 0 24 24" height="90" strokeWidth="0.5" stroke={props.stroke} >
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
</svg>

}