"use client"
import { useState,useRef,useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import axios from 'axios';

interface Clip {
  url: string;
  timestamp: string;
  callName?: string;
  roomId?: string;
  userId?: string;
  createdAt: string;
  public_id: string;
}

export default function Dashboard() {
    const router=useRouter();
    const callNameRef=useRef<HTMLInputElement>(null);
    const callIdRef=useRef<HTMLInputElement>(null);

    async function createNewCall(){
        await axios.post('/api/auth/create-call', {
            callSlug : callNameRef.current?.value,
        }).then((response)=>{
            console.log(response.data);
            const callId : string=response.data.callingId;
            const slug : string=response.data.slug;
            localStorage.setItem('userName',response.data.userName);
            if(callId==undefined) console.log('Error in creating a call');
            else router.push(`/pages/calling/${slug}/${callId}`);
        }).catch((e)=>{
            console.log(e.status + ' ' + e.message);
        }) 
    }   
    
    async function joinCall() {
        await axios.post('/api/auth/join-call', {
            callId : callIdRef.current?.value,
        }).then((response)=>{
            console.log(response.data);
            const callId : string=response.data.callingId;
            const slug : string=response.data.slug; 
            localStorage.setItem('userName',response.data.userName);
            if(callId==undefined) console.log('Error in creating a call');
            else router.push(`/pages/calling/${slug}/${callId}`);
        }).catch((e)=>{
            console.log(e.status + ' ' + e.message);
        }) 
    }

    return <div className="bg-white flex flex-col items-center min-h-screen overflow-hidden overflow-y-scroll">
        <div className="bg-gray-100 w-[75%] h-auto px-16 py-10">
            <div className="border-b-2 border-b-gray-300 py-2 flex justify-between">
                <p className="text-3xl font-semibold text-gray-700 ">Previous Sessions</p>
                <div className='flex gap-10'>
                    <div className="flex gap-2">
                        <input ref={callNameRef} className="bg-white outline-none text-black px-3 placeholder:text-black" type='text' placeholder="Set Call Name"/> 
                        <button onClick={createNewCall} className="flex justify-center items-center px-3 text-sm font-semibold bg-zinc-700 text-white">Create</button> 
                    </div>
                    <div className="flex gap-2"> 
                        <input ref={callIdRef} className="bg-white outline-none text-black px-3 placeholder:text-black" type='text' placeholder="Enter call-Id"/> 
                        <button onClick={joinCall} className="flex justify-center items-center px-3 text-sm font-semibold bg-zinc-700 text-white">Join</button> 
                    </div>
                </div>
            </div>
        </div>
    </div>
}