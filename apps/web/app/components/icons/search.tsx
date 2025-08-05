'use client';

import { useEffect, useState } from "react";
import { useTheme } from "next-themes"; 

export default function SearchIcon(){
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme(); 

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; 

  return (
    <div className="flex">
        {theme === 'light'
        ? <Search stroke={"#16422E"} />
        : <Search stroke={"#FFFFFF"} />}
    </div>      
  );
}

interface props{
    stroke:string
}

function Search(props : props){
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" height="20px" width="20px" fill={props.stroke}>
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
    </svg>
}