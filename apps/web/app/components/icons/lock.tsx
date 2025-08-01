'use client'

import { useEffect, useState } from "react";
import { useTheme } from "next-themes"; 

export default function LockIcon(){
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme(); 

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; 

  return (
    <div className="flex">
        {theme === 'light'
        ? <Lock color={"#31C585"} />
        : <Lock color={"#0076FC"} />}
    </div>      
  );
}


interface props{
    color : string
}
function Lock(props : props){
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={props.color} width="160" height="90">
        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
    </svg>
}