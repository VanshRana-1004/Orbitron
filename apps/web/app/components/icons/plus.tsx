'use client';

import { useEffect, useState } from "react";
import { useTheme } from "next-themes"; 

export default function PlusIcon(){
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme(); 

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; 

  return (
    <div className="flex">
        {theme === 'light'
        ? <Plus stroke={"#16422E"} />
        : <Plus stroke={"#FFFFFF"} />}
    </div>      
  );
}

interface props{
    stroke:string
}

function Plus(props : props){
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" height="20px" width="20px" fill={props.stroke}>
        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
}