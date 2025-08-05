'use client';

import { useEffect, useState } from "react";
import { useTheme } from "next-themes"; 

export default function CrossIcon(){
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme(); 

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; 

  return (
    <div className="flex">
        {theme === 'light'
        ? <Cross stroke={"#16422E"} />
        : <Cross stroke={"#FFFFFF"} />}
    </div>      
  );
}

interface props {
    stroke : string
}
function Cross(props : props){
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={props.stroke} height="20px" width="20px">
        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
}