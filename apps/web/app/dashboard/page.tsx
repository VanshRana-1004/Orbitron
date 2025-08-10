"use client"
import { useState,useRef,useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import axios from 'axios';
import { ThemeToggle } from 'app/components/theme-toggle/theme';
import PlusIcon from 'app/components/icons/plus';
import FeedbackIcon from 'app/components/icons/feedback';
import EnterIcon from 'app/components/icons/enter';
import CalenderIcon from 'app/components/icons/calender';
import SettingIcon from 'app/components/icons/setting';
import LogoutIcon from 'app/components/icons/logout';
import { signOut } from 'next-auth/react';
import 'react-day-picker/dist/style.css';
import CrossIcon from 'app/components/icons/cross';
import TimeSelector from 'app/components/time-selector/time';
import DatePicker from 'app/components/date-selector/date';
import HeartIcon from 'app/components/icons/heart';

interface User{
    firstName : string,
    lastName : string,
    email : string,
    img : string
}

function getCurrentTime(): { hours: number; minutes: number; ampm: 'AM' | 'PM' } {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;

  return { hours, minutes, ampm };
}

function isFutureDateTime(date?: Date, time?: { hours: number; minutes: number; ampm: 'AM' | 'PM' }) {
  if (!date || !time) return false;

  let hours = time.hours;
  if (time.ampm === 'PM' && hours < 12) hours += 12;
  if (time.ampm === 'AM' && hours === 12) hours = 0;

  const fullDateTime = new Date(date);
  fullDateTime.setHours(hours, time.minutes, 0, 0); 

  return fullDateTime > new Date();
}

export default  function Dashboard() {
    const router=useRouter();
    const callNameRef=useRef<HTMLInputElement>(null);
    const callIdRef=useRef<HTMLInputElement>(null);
    const [showCreate,setShowCreate]=useState(false);
    const [showJoin,setShowJoin]=useState(false);
    const [showCalendar,setShowCalendar]=useState(false);
    const [name,setName]=useState<string>('');
    const [email,setEmail]=useState<string>('');
    const [img,setImg]=useState<string>('/defaultpc.png');
    const [id,setId]=useState<string>('');
    const scheduledCallNameRef=useRef<HTMLInputElement>(null);
    const idRef=useRef<string>('');
    const [scheduledCalls, setScheduledCalls] = useState<{slug: string; date: string; time: string }[]>([]);
    const [previousCalls, setPreviousCalls] = useState<{slug: string, callingId: string, peers: string,date : string,time : string,recorded : boolean,users : User[]}[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<{ hours: number; minutes: number; ampm: 'AM' | 'PM' }>(getCurrentTime());
    const [show,setShow]=useState<boolean>(false); 
    const [auth,setAuth]=useState<boolean>(false);
    const [callDetail,setCallDetail]=useState<number>(-1);
    const [feedBack,setFeedback]=useState<boolean>(false);
    const feedbackRef=useRef<HTMLTextAreaElement>(null);

    const handleTimeChange = (time: { hours: number; minutes: number; ampm: 'AM' | 'PM' }) => {
        setSelectedTime(time);
    };
    
    const formatDate = (date?: Date) => {
        return date ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'none';
    };

    const formatTime = (time: typeof selectedTime) => {
        const paddedHours = time.hours.toString().padStart(2, '0');
        const paddedMinutes = time.minutes.toString().padStart(2, '0');
        return `${paddedHours}:${paddedMinutes} ${time.ampm}`;
    };

    useEffect(()=>{
        async function getInfo(){
            try{
                const res1=await axios.get('/api/auth/me');
                console.log(res1.data);
                setName(res1.data.user.name);
                setImg(res1.data.user.image);
                setEmail(res1.data.user.email);
                setId(res1.data.user.id)
                if(name=='') setName(`${res1.data.user.firstName} ${res1.data.user.lastName}`)
                idRef.current=res1.data.user.id;
                console.log(res1.data.user.id);
                setAuth(true);
            }catch(e){
                console.error("Error fetching user info:", e);
                redirect('/login');
            }
        } 
        getInfo();
    },[])

    useEffect(()=>{
            async function getInfo(){
                const res1 = await axios.get('/api/auth/get-scheduled-calls',{
                    params : {userId : Number(idRef.current)} 
                });
                console.log(res1);
                const sorted1 = res1.data.res
                    .sort((a : {slug: string; date: string; time: string }, b : {slug: string; date: string; time: string }) => {
                        const dateA = new Date(`${a.date} ${a.time}`);
                        const dateB = new Date(`${b.date} ${b.time}`);
                        return dateB.getTime() - dateA.getTime();
                    })
                    .map(({ slug, date, time } : {slug: string; date: string; time: string }) => ({ slug, date, time })); 

                setScheduledCalls(sorted1);

                const res2=await axios.get('/api/auth/get-calls',{
                    params : {userId : Number(idRef.current)} 
                });
                console.log(res2);
                const callData : {slug: string; callingId: string; peers: string,date : string,time : string,recorded : boolean,users : User[]}[]=[];
                for(let i=0;i<res2.data.res.length;i++){
                    const slug=res2.data.res[i].call.slug;
                    const callingId=res2.data.res[i].call.callingId;
                    const peers=res2.data.res[i].call.callUserTimes.length;
                    const users : User[]=[];
                    const temp=res2.data.res[i].call.callUserTimes;
                    const date=res2.data.res[i].call.date;
                    const time=res2.data.res[i].call.startTime;
                    const recorded=res2.data.res[i].call.recorded
                    temp.map((x : any)=>(
                        users.push({firstName : x.user.firstName,lastName : x.user.lastName,email : x.user.email,img : x.user.profileImage})
                    ))
                    callData.push({slug,callingId,peers,date,time,recorded,users})
                }
                setPreviousCalls(callData);
            }

            // const res3 = await axios.get('/api/auth/get-recorded-calls');
            getInfo();
    },[auth])

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

    async function logout(){
        try {
            await axios.post('/api/auth/logout');
            await signOut({ redirect: false });
            window.location.href = '/';
        } catch (e) {
            console.error('Error while logging out:', e);
        }
    }

    async function scheduleCall(){
        const check=isFutureDateTime(selectedDate,selectedTime); 
        if(check && (formatDate(selectedDate)).toString()!=='none' && scheduledCallNameRef.current?.value!==''){
            try{   
                console.log(idRef.current);
                const slug=String(scheduledCallNameRef.current?.value);
                const date=String(formatDate(selectedDate));
                const time=String(formatTime(selectedTime));
                await axios.post('/api/auth/schedule-call',{
                    userId : Number(idRef.current), 
                    slug, 
                    date,
                    time 
                })
                console.log('Call successfully scheduled');
                setShowCalendar(false);
                setScheduledCalls(prev=>[{slug, date, time},...prev])
            }catch(e){
                alert('error in scheduling call.')
            }
        }
        else{
            if(!check) alert('please select future date and time')
            else if((formatDate(selectedDate)).toString()==='none') alert('please select some date')
            else if((formatTime(selectedTime)).toString()==='none') alert('please select time')
            else alert('Enter Call name')
        }
    }

    async function sendFeedback(){
        try{
            const fb=feedbackRef.current?.value;
            const res=await axios.post('/api/auth/feedback',{
                id,
                fb,
                name,
                img,
                email 
            })
            console.log(res);
            setFeedback(false);
        }catch(e){
            console.log('error while sending feedback')
        }
    }

    return <div className="bg-white dark:bg-zinc-950 flex flex-col items-center min-h-screen bg-[url('/light-bg.png')] dark:bg-[url('/dark-landing-bg-1.png')] bg-cover bg-center">
        
        {(showCreate || showJoin) && <div className='flex flex-col p-3 gap-3 fixed top-1/2 -translate-x-1/2 left-1/2 -translate-y-1/2 w-1/3 h-auto z-30 bg-white dark:bg-[#02060D] rounded border border-[#7AF8C1] dark:border-[#1E2C40]'>
            <div className='flex justify-between items-center w-full'>
                <div className='geist-font text-[20px] font-semibold text-[#16422E] dark:text-[#0076FC]'>
                    {showCreate?'Creating a call':'Joining a call'}
                </div>
                <div onClick={()=>{setShowCreate(false), setShowJoin(false)}} className='cursor-pointer'><CrossIcon/></div>
            </div>
            <div className={`w-full border border-[#16422E] dark:border-[#FFFFFF] `}></div>
            <div className='flex w-full gap-2 items-center justify-start'>
                <p className='text-[#16422E] dark:text-white geist-font tracking-tight text-[16px]'>{showCreate?'Enter the name of the call : ':'Enter the call id : '}</p>
                <input type="text" className="text-[#16422E] dark:text-[#FFFFFF]  px-1 w-[40%] border-0 border-b border-[#16422E] dark:border-white focus:outline-none focus:ring-0 focus:border-[#16422E] focus:dark:border-white bg-transparent"/>
            </div>
            <div className='flex w-full justify-end gap-3 items-center'>
                <div onClick={()=>{setShowCreate(false), setShowJoin(false)}} className='cursor-pointer px-3 py-0.5 border rounded border-[#d1ffeb] dark:border-[#1E2C40] bg-[#d1ffeb] dark:bg-[#0c1423] flex justify-center items-center geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>cancel</div>
                {showCreate && <div onClick={createNewCall} className='cursor-pointer px-3 py-0.5 border rounded border-[#16422E] dark:border-[#1E2C40] bg-[#16422E] dark:bg-[#0076FC] flex justify-center items-center geist-font text-[14px] tracking-tight text-white font-medium'>create</div>}
                {showJoin && <div onClick={joinCall} className='cursor-pointer px-3 py-0.5 border rounded border-[#16422E] dark:border-[#1E2C40] bg-[#16422E] dark:bg-[#0076FC] flex justify-center items-center geist-font text-[14px] tracking-tight text-white font-medium'>join</div>}
            </div>

        </div>}

        {showCalendar && 
            <div className='flex flex-col p-3 gap-3 fixed top-1/2 -translate-x-1/2 left-1/2 -translate-y-1/2 w-1/2 h-auto z-30 bg-white dark:shadow-none dark:bg-[#02060D] rounded border border-[#7AF8C1] dark:border-[#1E2C40]'>
                <div className='flex justify-between items-center w-full'>
                    <div className='geist-font text-[20px] font-semibold text-[#16422E] dark:text-[#0076FC]'>
                        Schedule a call
                    </div>
                    <div onClick={()=>{setShowCalendar(false)}} className='cursor-pointer'><CrossIcon/></div>
                </div>

                <div className={`w-full border border-[#16422E] dark:border-[#FFFFFF] `}></div>
                
                <div className='flex w-full h-auto gap-3'>
                    <div className='flex flex-col w-auto h-auto gap-1'>
                        <DatePicker
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="my-custom-class"
                        />
                    </div>
                    
                    <div className='relative flex-1 flex flex-col gap-1'>
                        <div className="w-auto h-auto">
                            <TimeSelector
                                initialTime={selectedTime}
                                onChange={handleTimeChange}
                                className="mx-auto"
                            />                            
                        </div>

                        <div className='flex flex-col gap-2 py-3'>
                            <div className={`flex gap-2`}>
                                <p className='geist-font text-[14px] font-medium text-green-700 dark:text-white'>Selected Date  : </p>
                                <p className='geist-font text-[14px] font-medium text-[#16422E] dark:text-[#0076FC]'>{formatDate(selectedDate)}</p>
                            </div>
                            <div className={`flex gap-2`}>
                                <p className='geist-font text-[14px] font-medium text-green-700 dark:text-white'>Selected Time  : </p>
                                <p className='geist-font text-[14px] font-medium text-[#16422E] dark:text-[#0076FC]'>{formatTime(selectedTime)}</p>
                            </div>
                            <div className={`flex gap-2`}>
                                <p className='geist-font text-[14px] font-medium text-green-700 dark:text-white'>Enter Call Name  : </p>
                                <input ref={scheduledCallNameRef} className='px-2 border-b border-[#16422E] dark:border-[#0076FC] focus:outline-none focus:ring-0 focus:border-[#16422E] focus:dark:border-[#0076FC] bg-transparent  geist-font text-[14px] font-medium text-[#16422E] dark:text-[#0076FC]' type="text" />
                            </div>
                        </div>

                        <div className='absolute flex w-auto gap-2 items-center bottom-0 right-0'>
                            <div onClick={()=>{setShowCalendar(false)}} className='cursor-pointer px-3 py-0.5 border rounded border-[#d1ffeb] dark:border-[#1E2C40] bg-[#d1ffeb] dark:bg-[#0c1423] flex justify-center items-center geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>Cancel</div>
                            <div className='cursor-pointer px-3 py-0.5 border rounded border-[#16422E] dark:border-[#1E2C40] bg-[#16422E] dark:bg-[#0076FC] flex justify-center items-center geist-font text-[14px] tracking-tight text-white font-medium' onClick={scheduleCall}>Done</div>
                        </div>
                    </div>
                    
                </div>

            </div>
        }

        {!showCreate && !showJoin && !showCalendar && callDetail===-1 && <div className={`absolute inset-0 w-full h-full z-10 
            bg-transparent 
            [background-image:linear-gradient(to_right,#CDFCE7_1px,transparent_1px),linear-gradient(to_bottom,#CDFCE7_1px,transparent_1px)]
            [background-size:60px_60px]
            dark:[background-image:linear-gradient(to_right,#0B0F17_1px,transparent_1px),linear-gradient(to_bottom,#0B0F17_1px,transparent_1px)]`
        }/>}

        {callDetail!=-1 && 
            <div className='flex flex-col p-3 gap-3 fixed top-1/2 -translate-x-1/2 left-1/2 -translate-y-1/2 w-1/3 h-auto z-30 bg-white dark:shadow-none dark:bg-[#02060D] rounded border border-[#7AF8C1] dark:border-[#1E2C40]'>
                
                <div className='flex justify-between items-center w-full'>
                    <div className='geist-font text-[20px] font-semibold text-[#16422E] dark:text-[#0076FC]'>
                        Call Detail
                    </div>
                    <div onClick={()=>{setCallDetail(-1)}} className='cursor-pointer'><CrossIcon/></div>
                </div>
                
                <div className={`w-full border border-[#16422E] dark:border-[#FFFFFF] `}></div>

                <div className="w-full h-auto flex flex-col gap-4 p-4 rounded-xl bg-green-50 dark:bg-[#02060D] text-[#16422E] dark:text-white border border-[#7AF8C1] dark:border-[#1E2C40]">
                    <div className="flex gap-1 items-center ">
                        <p className="geist-font text-[16px] font-normal">Call Name :</p>
                        <p className="geist-font text-[16px] font-medium">{previousCalls[callDetail]?.slug}</p>
                    </div>

                    <div className="flex gap-1 items-center ">
                        <p className="geist-font text-[16px] font-normal">Call ID :</p>
                        <p className="geist-font text-[16px] font-medium">{previousCalls[callDetail]?.callingId}</p>
                    </div>

                    <div className="flex gap-1 items-center ">
                        <p className="geist-font text-[16px] font-normal">Date :</p>
                        <p className="geist-font text-[16px] font-medium">{previousCalls[callDetail]?.date}</p>
                    </div>

                    <div className="flex gap-1 items-center ">
                        <p className="geist-font text-[16px] font-normal">Time :</p>
                        <p className="geist-font text-[16px] font-medium">{previousCalls[callDetail]?.time}</p>
                    </div>
                    
                    <div className="flex gap-1 items-center ">
                        <p className="geist-font text-[16px] font-normal">Recorded :</p>
                        <p className="geist-font text-[16px] font-medium">{previousCalls[callDetail]?.recorded ? 'yes' : 'no'}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="geist-font text-[16px] font-normal">Peers who joined the call:</p>
                        <div className="flex flex-col gap-3 pl-2">
                            {previousCalls[callDetail]?.users?.map((user, ind) => (
                                <div key={ind} className="bg-white dark:bg-[#0B121C] p-3 rounded-md shadow-sm border border-[#CDFCE7] dark:border-[#1E2C40]">
                                    <p className="geist-font text-[14px] font-medium"><span className="geist-font text-[14px] font-normal">Name:</span> {user.firstName} {user.lastName}</p>
                                    <p className="geist-font text-[14px] font-medium"><span className="geist-font text-[14px] font-normal">Email:</span> {user.email}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        }

        {feedBack && 
            <div className='flex flex-col p-3 gap-3 fixed top-1/2 -translate-x-1/2 left-1/2 -translate-y-1/2 w-1/3 h-auto z-30 bg-white dark:shadow-none dark:bg-[#02060D] rounded border border-[#7AF8C1] dark:border-[#1E2C40]'>

                <div className='flex justify-between items-center w-full'>
                    <div className='flex gap-1 items-center geist-font text-[20px] font-semibold text-[#16422E] dark:text-[#0076FC]'>
                        Enter your feedback <HeartIcon/>
                    </div>
                    <div onClick={()=>{setFeedback(false)}} className='cursor-pointer'><CrossIcon/></div>
                </div> 

                <textarea ref={feedbackRef} rows={4} className="w-full p-2 text-[#16422E] dark:text-gray-300 border border-[#7AF8C1] dark:border-[#1E2C40] geist-font text-[16px] font-light resize-none rounded-md focus:ring-0 outline-none bg-transparent"/>

                <div className='w-full flex gap-2 items-center justify-end'>
                    <div onClick={()=>{setFeedback(false)}} className='cursor-pointer px-3 py-0.5 border rounded border-[#d1ffeb] dark:border-[#1E2C40] bg-[#d1ffeb] dark:bg-[#0c1423] flex justify-center items-center geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium '>Cancel</div>
                    <div className='cursor-pointer px-3 py-0.5 border rounded border-[#16422E] dark:border-[#1E2C40] bg-[#16422E] dark:bg-[#0076FC] flex justify-center items-center geist-font text-[14px] tracking-tight text-white font-medium' onClick={sendFeedback}>send</div>
                </div>

            </div>
        }

        <div className={`flex px-2 py-2 h-screen w-screen gap-2`}>

            <div className={`flex flex-col w-[13%] h-full z-20 gap-2 ${(showCreate || showJoin || showCalendar || callDetail!==-1 || feedBack) ? 'pointer-events-none' : ''} `}>
                
                {(showCreate || showJoin || showCalendar || callDetail!==-1 || feedBack) && (<div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/20 dark:bg-black/20 rounded-xl shadow-md pointer-events-none" />)}

                <div className='flex flex-col px-3 py-2 pb-5 items-center w-full h-2/3 bg-white border border-[#7AF8C1] dark:border-[#1E2C40] rounded  dark:bg-[#000000] dark:bg-[linear-gradient(307.82deg,_rgba(14,22,36,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)] dark:shadow-[inset_0_0_2px_#23344C]'>
                    <div className={`w-full flex justify-start p-3 z-20 `}>
                        <a href="/" className=" w-[80px] sm:w-[101px] h-[40px] sm:h-[54px]">
                            <img
                                src="/logo.png"
                                alt="My Logo"
                                className="w-full h-full object-contain dark:hidden"
                            />

                            <img
                                src="/logo-dark.png"
                                alt="My Dark Logo"
                                className="w-full h-full object-contain hidden dark:block"
                            />
                        </a>
                    </div>
                    
                    <div className={`flex flex-col py-3 gap-2 w-full`}>
                        <div onClick={()=>{setShowCreate(true)}} className='items-center cursor-pointer border rounded px-6 py-1 gap-5 border-[#7AF8C1] dark:border-[#1E2C40] bg-green-100 dark:bg-[#02060D] flex justify-start geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>
                            <PlusIcon/>
                            Create Call
                        </div>
                        <div onClick={()=>{setShowJoin(true)}} className='items-center cursor-pointer border rounded px-6 py-1 gap-5 border-[#7AF8C1] dark:border-[#1E2C40] bg-green-100 dark:bg-[#02060D] text-[#16422E] dark:text-white flex justify-start geist-font text-[14px] tracking-tight  font-medium'>
                            <EnterIcon/>
                            Join Call
                        </div>
                        <div onClick={()=>{setShowCalendar(true)}} className='items-center cursor-pointer border rounded px-6 py-1 gap-5 border-[#7AF8C1] dark:border-[#1E2C40] bg-green-100 dark:bg-[#02060D] flex justify-start geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>
                            <CalenderIcon/>
                            Schedule 
                        </div>
                    </div>

                    <div onClick={()=>setFeedback(true)} className='mt-auto items-center cursor-pointer border rounded w-full px-6 py-1 gap-5 border-[#7AF8C1] dark:border-[#1E2C40] bg-green-100 dark:bg-[#02060D] flex justify-start geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>
                        <FeedbackIcon/>
                        Feedback
                    </div>
                </div>

                <div className='my-auto cursor-pointer hover:shadow-none hover:border-[#16422E] hover:dark:border-white w-full flex justify-evenly px-5 py-2 items-center border-2 rounded-[200px] bg-white border-[#7AF8C1] dark:border-[#1E2C40]  dark:bg-[#000000] dark:bg-[linear-gradient(307.82deg,_rgba(14,22,36,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)] dark:shadow-[inset_0_0_2px_#23344C]'>
                    <p className='geist-font text-[16px] font-medium text-[#16422E] dark:text-white'>{name}</p>
                    <div className='w-9 h-9 bg-black rounded-full object-cover content-center border border-[#7AF8C1] dark:border-[#1E2C40]'>
                        <img src={img} alt="" className='w-full h-full rounded-full'/>
                    </div>
                </div>

            </div>

            <div className={`flex-1 h-full z-20 flex flex-col gap-2 ${(showCreate || showJoin || showCalendar || callDetail!==-1 || feedBack) ? 'pointer-events-none' : ''}`}>

                {(showCreate || showJoin || showCalendar || callDetail!==-1 || feedBack) && (<div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/20 dark:bg-black/20 rounded-xl shadow-md pointer-events-none" />)}

                <div className='flex w-full px-3 py-2  border border-[#7AF8C1] dark:border-[#1E2C40] bg-white dark:bg-[#000000] rounded dark:bg-[linear-gradient(307.82deg,_rgba(14,22,36,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)] dark:shadow-[inset_0_0_2px_#23344C]'>
                    <div className=" w-1/2 flex justify-start z-20 geist-font text-[20px]  text-[#16422E] dark:text-[#FFFFFF]">
                        Welcome {name} !
                    </div>
                    <div className="w-1/2 justify-end z-20 self-center items-center flex text-[#16422E] dark:text-white dark:font-normal gap-5">
                        
                        <ThemeToggle text={true} bg={true}/>
                        <div onClick={logout} className='items-center cursor-pointer border border-red-500 rounded px-3 py-1 gap-2  flex justify-start geist-font text-[14px] tracking-tight text-white bg-red-500 font-medium'>
                            <LogoutIcon/>
                            Log out
                        </div>
                    </div>
                </div>

                <div className='w-full h-full z-20 flex bg-white border border-[#7AF8C1] dark:border-[#1E2C40] dark:bg-[#000000] rounded dark:bg-[linear-gradient(307.82deg,_rgba(14,22,36,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)] dark:shadow-[inset_0_0_2px_#23344C]'>
                    <div className='w-[60%] h-full flex flex-col '>
                        <div className='flex items-center justify-between w-full px-3 py-1.5'>
                            <div className='geist-font text-[16px]  text-[#16422E] dark:text-[#FFFFFF]'>
                                Previous Recorded Calls
                            </div>
                        </div>
                        <div className='w-full border-t border-t-[#7AF8C1] dark:border-t-[#1E2C40]'/>
                        <div className='flex w-full h-auto'>
                            <div className='w-[8%] py-1 text-sm pl-2 geist-font text-green-900 dark:text-gray-300'>Sr no.</div>
                            <div className='w-[30%] py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300'>Call Name</div>
                            <div className='w-[30%] py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300'>Call Id</div>
                            <div className='w-[16%] py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300'>Date</div>
                            <div className='w-[16%] py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300'>Time</div>
                        </div>
                        <div className='w-full border-t border-t-[#7AF8C1] dark:border-t-[#1E2C40]'/>
                        <p className='flex items-center justify-center w-full h-full  z-20 geist-font text-3xl font-light text-[#16422E] dark:text-white'>
                            No calls yet.
                        </p>
                    </div> 
                    <div className='h-full border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40]'></div>
                    <div className='flex flex-col flex-1'>
                        <div className='flex items-center justify-between w-full px-3 py-1.5'>
                            <div className='geist-font text-[16px]  text-[#16422E] dark:text-[#FFFFFF]'>
                                {show ? 'Scheduled Calls' : 'Call History'}
                            </div>
                            <div onClick={()=>{setShow(x=>!x)}} className='items-center cursor-pointer hover:underline hover:text-[#31C585] hover:dark:text-[#0076FC] px-3 gap-2 flex justify-end geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>
                                {!show ? 'Scheduled Calls?' : 'Call History?'}    
                            </div>
                        </div>
                        <div className='w-full border-t border-t-[#7AF8C1] dark:border-t-[#1E2C40]'/>
                        <div className='flex w-full h-auto'>
                            <div className='w-[12%] py-1 text-sm px-2 geist-font text-green-900 dark:text-gray-300'>Sr no.</div>
                            <div className={`${show ? 'w-[38%]' : 'w-[30%]'} py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300`}>Call Name</div>
                            <div className={`${show ? 'w-[25%]' : 'w-[40%]'} py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300`}>{show ? 'Date' : 'Call Id'}</div>
                            <div className={`${show ? 'w-[25%]' : 'w-[18%]'} py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300`}>{show ? 'Time' : 'Peers'}</div>
                        </div>
                        <div className='w-full border-t border-t-[#7AF8C1] dark:border-t-[#1E2C40]'/>

                        {show && scheduledCalls.length==0 && 
                            <p className='flex items-center justify-center w-full h-full  z-20 geist-font text-3xl font-light text-[#16422E] dark:text-white'>
                                No scheduled calls yet.
                            </p>
                        }
                        {show && scheduledCalls.length>0 &&
                            <div className='flex flex-col w-full h-full overflow-y-scroll scrollbar-none scroll-smooth no-scrollbar'>
                                {scheduledCalls.map((call,index)=>{
                                    const isPast = new Date(`${call.date} ${call.time}`) < new Date();
                                    return (<div key={index+1} className='flex flex-col w-full h-auto'>
                                        <div className={`flex w-full h-auto ${isPast && 'opacity-50'}`}>
                                            <div className='w-[12%] py-1 text-[13px] px-2 geist-font text-center text-green-900 dark:text-gray-300 overflow-hidden'>{index+1}. </div>
                                            <div className='w-[38%] py-1 text-[13px] border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300 overflow-hidden'>{call.slug}</div>
                                            <div className='w-[25%] py-1 text-[13px] border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300 overflow-hidden'>{call.date}</div>
                                            <div className='w-[25%] py-1 text-[13px] border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300 overflow-hidden'>{call.time}</div>
                                        </div>
                                        <div className='w-full border-t border-t-[#7AF8C1] dark:border-t-[#1E2C40]'/>
                                    </div>)
                                })}
                            </div>
                        }

                        {!show && previousCalls.length==0 &&
                            <p className='flex items-center justify-center w-full h-full  z-20 geist-font text-3xl font-light text-[#16422E] dark:text-white'>
                                No previous calls yet.
                            </p>
                        }   
                        {!show && previousCalls.length>0 &&
                            <div className='flex flex-col w-full h-full overflow-y-scroll scrollbar-none scroll-smooth no-scrollbar'>
                                {previousCalls.map((call,index)=>(
                                    <div key={index+1} className='flex flex-col w-full h-auto hover:dark:bg-gray-700 hover:bg-green-100 cursor-pointer' onClick={()=>setCallDetail(index)}>
                                        <div className='flex w-full h-auto'>
                                            <div className='w-[12%] py-1 text-[13px] px-2 geist-font dark:text-gray-300 text-green-900  text-center overflow-hidden'>{index+1}.</div>
                                            <div className='w-[30%] py-1 text-[13px] border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300 overflow-hidden'>{call.slug}</div>
                                            <div className='w-[40%] py-1 text-[13px] border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis'>{call.callingId}</div>
                                            <div className='w-[18%] py-1 text-[13px] border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300 overflow-hidden'>{call.peers}</div>
                                        </div>
                                        <div className='w-full border-t border-t-[#7AF8C1] dark:border-t-[#1E2C40]'/>
                                    </div>
                                ))}
                            </div>
                        }

                    </div>
                </div>
            
            </div>
        </div>
       
    </div>
} 


// add a timer which will show the closest approaching scheduled call
// add feedback support
// render feedbacks on landing page
// add image for profiles and where previous calls details are rendered
// instead of setting, render image and name of the user
// add change password and forgot password for users who logged in using email and password through   
// add change profile image and change firstName and lastName
// add other profiles options

//---------------------------------------

// then the work for main functionality will begin OH GOD BLESS ME