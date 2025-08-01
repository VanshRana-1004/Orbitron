'use client'

import { useEffect, useState } from "react";
import { useTheme } from "next-themes"; 

export default function ComputerIcon(){
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme(); 

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; 

  return (
    <div className="flex">
        {theme === 'light'
        ? <Computer color={"#31C585"} />
        : <Computer color={"#0076FC"} />}
    </div>      
  );
}

interface props {
    color : string
}
function Computer(props : props){
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={props.color} width="160" height="90">
        <path fillRule="evenodd" d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5Z" clipRule="evenodd" />
    </svg>
}