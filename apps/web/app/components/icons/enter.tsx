'use client';

import { useEffect, useState } from "react";
import { useTheme } from "next-themes"; 

export default function EnterIcon(){
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme(); 

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; 

  return (
    <div className="flex">
        {theme === 'light'
        ? <Enter stroke={"#16422E"} />
        : <Enter stroke={"#FFFFFF"} />}
    </div>      
  );
}

interface props{
    stroke:string
}

function Enter(props : props){
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" height="20px" width="20px" fill={props.stroke}>
        <path fillRule="evenodd" d="M2 10a.75.75 0 0 1 .75-.75h12.59l-2.1-1.95a.75.75 0 1 1 1.02-1.1l3.5 3.25a.75.75 0 0 1 0 1.1l-3.5 3.25a.75.75 0 1 1-1.02-1.1l2.1-1.95H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
    </svg>
}