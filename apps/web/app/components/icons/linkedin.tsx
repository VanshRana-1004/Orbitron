"use client";


import { useEffect, useState } from "react";
import { useTheme } from "next-themes"; 

export default function LinkedIconWrapper() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme(); 

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; 

  return (
    <a href="https://www.linkedin.com/in/vansh-rana-a8b528261/">
      {theme === 'light'
        ? <LinkedinIcon color={"#DFFFF0"} stroke={"#16422E"} />
        : <LinkedinIcon color={"#03070E"} stroke={"#FFFFFF"} />}
    </a>
  );
}

interface props{
    color : string,
    stroke : string
}
function LinkedinIcon(props : props){
    return <svg width="24px" height="24px" strokeWidth="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color={props.color}><path d="M21 8V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16V8C3 5.23858 5.23858 3 8 3H16C18.7614 3 21 5.23858 21 8Z" stroke={props.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7 17V13.5V10" stroke={props.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M11 17V13.75M11 10V13.75M11 13.75C11 10 17 10 17 13.75V17" stroke={props.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7 7.01L7.01 6.99889" stroke={props.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
}