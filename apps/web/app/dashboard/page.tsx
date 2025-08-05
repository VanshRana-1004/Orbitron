"use client"
import { useState,useRef,useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import axios from 'axios';
import { ThemeToggle } from 'app/components/theme-toggle/theme';
import SearchIcon from 'app/components/icons/search';
import PlusIcon from 'app/components/icons/plus';
import FeedbackIcon from 'app/components/icons/feedback';
import EnterIcon from 'app/components/icons/enter';
import CalenderIcon from 'app/components/icons/calender';
import SettingIcon from 'app/components/icons/setting';
import LogoutIcon from 'app/components/icons/logout';
import { signOut } from 'next-auth/react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import CrossIcon from 'app/components/icons/cross';
import TimeSelector from 'app/components/time-selector/time';
import DatePicker from 'app/components/date-selector/date';

interface Clip {
  url: string;
  timestamp: string;
  callName?: string;
  roomId?: string;
  userId?: string;
  createdAt: string;
  public_id: string;
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
    const scheduledCallNameRef=useRef<HTMLInputElement>(null);
    const idRef=useRef<string>('');
    const [scheduledCalls, setScheduledCalls] = useState<{slug: string; date: string; time: string }[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<{ hours: number; minutes: number; ampm: 'AM' | 'PM' }>(getCurrentTime());

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
                idRef.current=res1.data.user.id;
                console.log(res1.data.user.id);
                if(res1.status==200){
                    const res2 = await axios.get('/api/auth/get-scheduled-calls',{
                        params : {userId : Number(res1.data.user.id)} 
                    });
                    console.log(res2);
                }
                
                // const res3 = await axios.get('/api/auth/get-calls');
                // const res4 = await axios.get('/api/auth/get-recorded-calls');
            }catch(e){
                console.error("Error fetching user info:", e);
                redirect('/login');
            }
        } 
        getInfo();
    },[])

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
                setScheduledCalls(prev => [...prev, { slug, date, time }]);
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

        {!showCreate && !showJoin && !showCalendar && <div className={`absolute inset-0 w-full h-full z-10 
            bg-transparent 
            [background-image:linear-gradient(to_right,#CDFCE7_1px,transparent_1px),linear-gradient(to_bottom,#CDFCE7_1px,transparent_1px)]
            [background-size:60px_60px]
            dark:[background-image:linear-gradient(to_right,#0B0F17_1px,transparent_1px),linear-gradient(to_bottom,#0B0F17_1px,transparent_1px)]`
        }/>}

        <div className={`flex px-24 py-4 h-screen w-screen gap-2`}>

            <div className={`flex flex-col w-[15%] px-3 py-1 h-2/3 z-20 bg-white border border-[#7AF8C1] dark:border-[#1E2C40] rounded  dark:bg-[#000000] dark:bg-[linear-gradient(307.82deg,_rgba(14,22,36,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)] dark:shadow-[inset_0_0_2px_#23344C] ${(showCreate || showJoin || showCalendar) ? 'pointer-events-none' : ''} `}>
                
                {(showCreate || showJoin || showCalendar) && (<div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/20 dark:bg-black/20 rounded-xl shadow-md pointer-events-none" />)}

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
                
                <div className={`flex flex-col p-3 gap-3 `}>
                    <div onClick={()=>{setShowCreate(true)}} className='items-center cursor-pointer border rounded px-4 py-1 gap-5 border-[#7AF8C1] dark:border-[#1E2C40] bg-white dark:bg-[#02060D] flex justify-start geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>
                        <PlusIcon/>
                        Create Call
                    </div>
                    <div onClick={()=>{setShowJoin(true)}} className='items-center cursor-pointer border rounded px-4 py-1 gap-5 border-[#7AF8C1] dark:border-[#1E2C40] bg-white dark:bg-[#02060D] flex justify-start geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>
                        <EnterIcon/>
                        Join Call
                    </div>
                    <div onClick={()=>{setShowCalendar(true)}} className='items-center cursor-pointer border rounded px-4 py-1 gap-5 border-[#7AF8C1] dark:border-[#1E2C40] bg-white dark:bg-[#02060D] flex justify-start geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>
                        <CalenderIcon/>
                        Schedule 
                    </div>
                </div>

                <div className={`flex flex-col p-3 gap-3 h-full justify-end `}>
                    <div className='items-center cursor-pointer border rounded px-4 py-1 gap-5 border-[#7AF8C1] dark:border-[#1E2C40] bg-white dark:bg-[#02060D] flex justify-start geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>
                        <FeedbackIcon/>
                        Feedback
                    </div>
                    <div className='items-center cursor-pointer border rounded px-4 py-1 gap-5 border-[#7AF8C1] dark:border-[#1E2C40] bg-white dark:bg-[#02060D] flex justify-start geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>
                        <SettingIcon/>
                        Settings
                    </div>
                </div>

            </div>

            <div className={`flex-1 h-full z-20 flex flex-col gap-2 ${(showCreate || showJoin || showCalendar) ? 'pointer-events-none' : ''}`}>

                {(showCreate || showJoin || showCalendar) && (<div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/20 dark:bg-black/20 rounded-xl shadow-md pointer-events-none" />)}

                <div className='flex w-full px-3 py-2  border border-[#7AF8C1] dark:border-[#1E2C40] bg-white dark:bg-[#000000] rounded dark:bg-[linear-gradient(307.82deg,_rgba(14,22,36,0.6)_45.74%,_rgba(30,44,64,0.6)_107.26%)] dark:shadow-[inset_0_0_2px_#23344C]'>
                    <div className=" w-1/2 flex justify-start z-20 geist-font text-[20px]  text-[#16422E] dark:text-[#FFFFFF]">
                        Welcome {name} !
                    </div>
                    <div className="w-1/2 justify-end z-20 self-center items-center flex text-[#16422E] dark:text-white dark:font-normal gap-5">
                        <ThemeToggle text={true} bg={true}/>
                        <div onClick={logout} className='items-center cursor-pointer border rounded px-3 py-1 gap-2 border-[#7AF8C1] dark:border-[#1E2C40] bg-white dark:bg-[#02060D] flex justify-start geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>
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
                            <div className='flex gap-2 items-center '>
                                <SearchIcon />
                                <input type="text" placeholder={`Search Previous Calls...`} className='rounded font-regular geist-font px-3 py-1 text-[14px] placeholder:text-[#16422E] placeholder:dark:text-[#0c1521] text-[#16422E] dark:text-[#0c1521] border border-[#7AF8C1] dark:border-[#1E2C40] bg-[#d1ffeb] dark:bg-gray-300 outline-none'/>
                            </div>
                        </div>
                        <div className='w-full border-t border-t-[#7AF8C1] dark:border-t-[#1E2C40]'/>
                        <div className='flex w-full h-auto'>
                            <div className='w-[9%] py-1 text-sm px-2 geist-font text-green-900 dark:text-gray-300'>Sr no.</div>
                            <div className='w-[29%] py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300'>Call Name</div>
                            <div className='w-[19%] py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300'>Date</div>
                            <div className='w-[19%] py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300'>Time</div>
                            <div className='w-[20%] py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300'>Duration</div>
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
                                Scheduled Calls
                            </div>
                            <div onClick={()=>{setShowCalendar(true)}} className='items-center cursor-pointer border rounded px-3 py-1 gap-2 border-[#7AF8C1] dark:border-[#1E2C40] bg-[#d1ffeb] dark:bg-[#02060D] flex justify-start geist-font text-[14px] tracking-tight text-[#16422E] dark:text-white font-medium'>
                                <PlusIcon/>
                                add
                            </div>
                        </div>
                        <div className='w-full border-t border-t-[#7AF8C1] dark:border-t-[#1E2C40]'/>
                        <div className='flex w-full h-auto'>
                            <div className='w-[12%] py-1 text-sm px-2 geist-font text-green-900 dark:text-gray-300'>Sr no.</div>
                            <div className='w-[38%] py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300'>Call Name</div>
                            <div className='w-[25%] py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300'>Date</div>
                            <div className='w-[25%] py-1 text-sm border-l border-l-[#7AF8C1] dark:border-l-[#1E2C40] px-2 geist-font text-green-900 dark:text-gray-300'>Time</div>
                        </div>
                        <div className='w-full border-t border-t-[#7AF8C1] dark:border-t-[#1E2C40]'/>
                        
                        {scheduledCalls.length==0 
                        ? 
                            <p className='flex items-center justify-center w-full h-full  z-20 geist-font text-3xl font-light text-[#16422E] dark:text-white'>
                                No scheduled calls yet.
                            </p>
                        :
                            <div className='flex flex-col'>

                            </div>
                        }
                    
                    </div>
                </div>
            
            </div>
        </div>
       
    </div>
} 