"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes"; 

export default function XIconWrapper() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme(); 

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; 

  return (
    <a href="https://x.com/Rana2K5">
      {theme === 'light'
        ? <Xicon color={"#DFFFF0"} stroke={"#16422E"} />
        : <Xicon color={"#03070E"} stroke={"#FFFFFF"} />}
    </a>
  );
}


interface props{
    color : string,
    stroke : string
}
function Xicon(props : props){
    return <svg width="24px" height="24px" viewBox="0 0 24 24" strokeWidth="2" fill="none" xmlns="http://www.w3.org/2000/svg" color={props.color}><path d="M16.8198 20.7684L3.75317 3.96836C3.44664 3.57425 3.72749 3 4.22678 3H6.70655C6.8917 3 7.06649 3.08548 7.18016 3.23164L20.2468 20.0316C20.5534 20.4258 20.2725 21 19.7732 21H17.2935C17.1083 21 16.9335 20.9145 16.8198 20.7684Z" stroke={props.stroke} strokeWidth="2"></path><path d="M20 3L4 21" stroke={props.stroke} strokeWidth="2" strokeLinecap="round"></path></svg>
}