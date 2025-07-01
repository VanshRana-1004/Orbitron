"use client"
import { useState,useRef,useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    const [token, setToken] = useState<string | null>(null);
    const userNameRef=useRef<string>(null);
    const userIdRef=useRef<string>(null);
    const [authorized, setAuthorized] = useState<boolean>(false);
    const [again,setAgain]=useState<boolean>(false);
    const [clips, setClips] = useState<Clip[]>([]);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        setToken(storedToken);
        console.log('token in useEffect : ', storedToken);
    }, []);

    useEffect(()=>{
        if(!authorized) return;
        async function getClips(){
            try{
                console.log(userIdRef.current);
                const response=await axios.get('/api/auth/get-clips',{
                    params:{userId:userIdRef.current}
                }) 
                console.log(response);
                setClips(response.data);
            }
            catch(e){
                console.log('error in fetching all the previous clips',e);
                setAgain(again=>!again);
            }
        }
        setTimeout(getClips,2000);
    },[authorized,again]);

    useEffect(() => {
        if (!token) return;
        async function verifyToken() {
            try{
                const response = await axios.post('/api/auth/verify-token',{},{
                    headers: { Authorization: `Bearer ${token}`}
                })
                console.log('Token verified successfully:', response.data);
                const name=response.data.firstName + ' ' + response.data.lastName;
                userNameRef.current=name;
                userIdRef.current=response.data.id;
                setAuthorized(true);
            }catch(e){
                console.log('No token found, redirecting to login');
                router.push('/pages/login');
                return;
            }
        }
        verifyToken();
        console.log('token in dashboard : ', token);
    }, [token]);

    async function createNewCall(){
        if(!token){
            console.log('no token found, please login again');
            return;
        }
        await axios.post('/api/auth/create-call', {
            callSlug : callNameRef.current?.value,
        },{
            headers:{
                Authorization: `Bearer ${token}`
            }
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
        if(!token){
            console.log('no token found, please login again');
            return;
        }
        await axios.post('/api/auth/join-call', {
            callId : callIdRef.current?.value,
        },{
            headers:{
                Authorization: `Bearer ${token}`
            }
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
            <div className='w-full border min-h-full h-auto grid grid-cols-2 justify-items-center gap-x-5 gap-y-6 px-10 py-6'>
                {clips.map((clip) => (
                    <div key={clip.public_id} className="flex flex-col h-auto items-center border p-3 rounded-xl shadow-md">
                        <video src={clip.url} controls className="w-full rounded-md" />
                        <div className="mt-2 text-sm text-gray-700 text-center">
                            <p><strong>Time:</strong> {new Date(clip.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
}