"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes"; 

export default function CloudIcon() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme(); 

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; 

  return (
    <div className="flex">
      {theme === 'light'
        ? <Cloud color={"#31C585"} />
        : <Cloud color={"#0076FC"}/>}
    </div>
  );
}

interface props{
    color: string;
}
function Cloud(props : props){
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={props.color} width="160" height="90">
        <path fillRule="evenodd" d="M10.5 3.75a6 6 0 0 0-5.98 6.496A5.25 5.25 0 0 0 6.75 20.25H18a4.5 4.5 0 0 0 2.206-8.423 3.75 3.75 0 0 0-4.133-4.303A6.001 6.001 0 0 0 10.5 3.75Zm2.03 5.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72v4.94a.75.75 0 0 0 1.5 0v-4.94l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z" clipRule="evenodd" />
    </svg>
}