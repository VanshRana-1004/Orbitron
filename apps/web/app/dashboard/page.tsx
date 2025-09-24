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
import LogoutIcon from 'app/components/icons/logout';
import { signOut } from 'next-auth/react';
import 'react-day-picker/dist/style.css';
import CrossIcon from 'app/components/icons/cross';
import TimeSelector from 'app/components/time-selector/time';
import DatePicker from 'app/components/date-selector/date';
import HeartIcon from 'app/components/icons/heart';
import EditIcon from 'app/components/icons/edit';
import { io } from 'socket.io-client';
import { useSchedulesCallStore } from 'app/store/scheduled-calls';
import { useCallStore } from 'app/store/call-history';
import { useUserInfo } from 'app/store/user-info';
import { useRecordingStore } from 'app/store/recorded-calls';
import { useSocketStore } from 'app/store/socket-connection';
import { useCurrentVideoStore } from 'app/store/current-video';
import ScrollTop from 'app/components/icons/scrollTop';
import BarIcon from 'app/components/icons/bar';
import CreateCallIcon from 'app/components/icons/createCall';
import JinCallIcon from 'app/components/icons/joinCall';
const SERVER_URL = 'http://localhost:8080'; 

interface User{
    firstName : string,
    lastName : string,
    email : string,
    img : string
}

interface Clips {
  slug : string;
  callId: number;
  recorded: boolean;
  date : string;
  time : string;
  clips: {
    url: string;
    roomId: string;
    clipNum: string;
    public_id: string;
  }[];
};

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
    const {video,setVideo}=useCurrentVideoStore();
    const {info,setInfo}=useUserInfo();
    const {socket,initSocket}=useSocketStore();
    const {recordings,setRecordings}=useRecordingStore();
    const {previousCalls,setPreviousCalls}=useCallStore();
    const { scheduledCalls, setScheduledCallLogs, addScheduledCall }=useSchedulesCallStore();
    const callNameRef=useRef<HTMLInputElement>(null);
    const callIdRef=useRef<HTMLInputElement>(null);
    const [showCreate,setShowCreate]=useState(false);
    const [showJoin,setShowJoin]=useState(false);
    const [showCalendar,setShowCalendar]=useState(false);
    const [name,setName]=useState<string>('');
    const [email,setEmail]=useState<string>('');
    const [firstName,setFirstName]=useState<string>('');
    const [lastName,setLastName]=useState<string>(''); 
    const [img,setImg]=useState<string>('/defaultpc.png');
    const [id,setId]=useState<string>('');
    const scheduledCallNameRef=useRef<HTMLInputElement>(null);
    const idRef=useRef<string>('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<{ hours: number; minutes: number; ampm: 'AM' | 'PM' }>(getCurrentTime());
    const [show,setShow]=useState<boolean>(false); 
    const [auth,setAuth]=useState<boolean>(false);
    const [callDetail,setCallDetail]=useState<number>(-1);
    const [showProfile,setShowProfile]=useState<boolean>(false);
    const [feedBack,setFeedback]=useState<boolean>(false);
    const feedbackRef=useRef<HTMLTextAreaElement>(null);
    const [fnChange,setFnChange]=useState<boolean>(false);
    const [lnChange,setLnChange]=useState<boolean>(false);
    const [imgChange,setImageChange]=useState<boolean>(false);
    const fnRef=useRef<HTMLInputElement>(null);
    const lnRef=useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile,setSelectedFile]=useState<File | null>(null);

    const [width,setWidth]=useState<number>(1536);
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > window.innerHeight/2) {
                setShowButton(true);
            } else {
                setShowButton(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(()=>{
        const handleScreenResize=()=>{
        const wdth=window.innerWidth;
        setWidth(wdth);
        }
        handleScreenResize();
        window.addEventListener('resize',handleScreenResize);
        return ()=>{window.removeEventListener('resize',handleScreenResize)}
    },[])

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
        initSocket();
        async function getInfo(){
            try{
                const res1=await axios.get('/api/auth/me');
                console.log(res1.data);
                setName(res1.data.user.name);
                if(res1.data.user.image!=='') setImg(res1.data.user.image);
                setEmail(res1.data.user.email);
                setId(res1.data.user.id)
                setLastName(res1.data.user.lastName);
                setFirstName(res1.data.user.firstName);
                if(name=='') setName(`${res1.data.user.firstName} ${res1.data.user.lastName}`)
                idRef.current=res1.data.user.id;
                console.log(res1.data.user.id);
                setAuth(true);
                setInfo({firstName,lastName,email,img,id});
            }catch(e){
                console.error("Error fetching user info:", e);
                redirect('/login');
            }
        } 
        getInfo();
    },[])

    useEffect(()=>{
        if(!auth) return;
        async function getInfo(){
            const res =await axios.get('/api/auth/get-clips',{
                params : {userId : Number(idRef.current)}
            })
            console.log(res.data);
            setRecordings(res.data);
        }

        getInfo();
    },[auth])

    useEffect(()=>{
        if(!socket) return;
        const handler = async ({ roomId }: { roomId: string }) => {
            console.log('now you can request to fetch clips for ', roomId);

            const res1: Clips = await axios.get('/api/auth/mark-recorded',{
                params : {roomId}
            });
            console.log(res1);
            
            const res2 =await axios.get('/api/auth/get-clips',{
                params : {userId : Number(idRef.current)}
            })
            console.log(res2.data);
            setRecordings(res2.data);
            
        }
        socket.on('post-process-done', handler);
        return () => {
            socket.off('post-process-done', handler);
        } 
    },[socket])

    async function createNewCall(){ 
        if(callNameRef.current?.value==''){
            alert('enter some value');
            return;
        }
        await axios.post('/api/auth/create-call', {
            callSlug : callNameRef.current?.value,
        }).then(async (response)=>{
            console.log(response.data);
            const callId : string=response.data.callingId;
            const slug : string=response.data.slug;
            if(callId==undefined) console.log('Error in creating a call');
            else{
                const res = await axios.post(`${SERVER_URL}/create-call`, {
                    roomId: callId,
                    userId: response.data.userId,
                });
                const data = await res.data;
                if(socket){
                    console.log('socket present')
                    socket?.emit('joined',{roomId : callId})
                } 
                else console.log('not present');
                console.log(data);
                setShowCreate(false);
                alert('call created successfully')
                router.push(`/call/${slug}/${callId}`);
            } 
        }).catch((e)=>{
            console.log(e.status + ' ' + e.message);
        }) 
    }   
    
    async function joinCall() {
        if(callNameRef.current?.value==''){
            alert('enter some value');
            return;
        }
        await axios.post('/api/auth/join-call', {
            callId : callIdRef.current?.value,
        }).then(async (response)=>{
            console.log(response.data);
            const callId : string=response.data.callingId;
            const slug : string=response.data.slug; 
            if(callId==undefined) console.log('Error in creating a call');
            else{
                await fetch("http://localhost:8080/join-call", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ roomId : callId}),
                }).then(async (res)=>{
                    if (res.status === 200) {
                        console.log(res);
                        if(socket){
                            console.log('socket present')
                            socket?.emit('joined',{roomId : callId})
                        } 
                        setShowJoin(false);
                        alert("Call joined successfully");
                        router.push(`/call/${slug}/${callId}`);
                    } else if (res.status === 403) {
                        alert("Call already ended");
                    } else if (res.status === 404) {
                        alert("Call not found");
                    } else if (res.status === 400) {
                        alert("Peer limit in room already reached, you can't join");
                    } else {
                        alert("Something went wrong");
                    }
                }).catch((err)=>{
                    console.error("Network or server error:", err);
                    alert("Unable to connect to server");
                })
            } 
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
                addScheduledCall({slug,date,time});
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

    async function doneChanges(){
        let fn=firstName;
        let ln=lastName;
        if(fnRef.current?.value && fnRef.current.value.length>=3){
            fn=fnRef.current.value;
        }
        if(lnRef.current?.value && lnRef.current.value.length>=3){
            ln=lnRef.current.value;
        }
        console.log(fn," ",ln);
        const formData = new FormData();
        formData.append("fn", fn);
        formData.append("ln", ln);
        formData.append("id", String(id));
        if (selectedFile) {
            formData.append("file", selectedFile);
        }
        try{
            const res=await axios.post("/api/auth/update-info", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log(res);
            setFirstName(fn);
            setLastName(ln);
            setName(fn + " " + ln);
            setShowProfile(false);
            setImg(res.data.imageUrl);
            console.log(`successfully updated user's profile info`);
        }
        catch(e){
            console.log(`error while updating user's profile info`);
        }
        setLnChange(false);
        setFnChange(false);
        setImageChange(false);
    }

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>){
        setImageChange(true);
        const file = e.target.files?.[0];
        if (file) {
            setImageChange(true);
            setSelectedFile(file); 
            setPreview(URL.createObjectURL(file));
        }
    }

    async function showClips(clips : {url: string,roomId: string,clipNum: string,public_id: string}[],slug : string){
        setVideo({slug,clips});
        console.log('recorded clips data set successfully')
        console.log(video);
        setTimeout(()=>{
            router.push(`/recorded/${slug}`);
        },500);
    }

    return <div id={'main'} className={`min-h-screen w-screen bg-black overflow-hidden flex flex-col ${width>768 ? 'px-24 pt-1.5 gap-1.5' : width>450 ? 'px-12 gap-1.5 pt-1.5' : 'px-1 gap-1 pt-1'} `}
    style={{
      scrollBehavior: "smooth",
      backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
        repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(75, 85, 99, 0.08) 19px, rgba(75, 85, 99, 0.08) 20px, transparent 20px, transparent 39px, rgba(75, 85, 99, 0.08) 39px, rgba(75, 85, 99, 0.08) 40px),
        radial-gradient(circle at 20px 20px, rgba(55, 65, 81, 0.12) 2px, transparent 2px),
        radial-gradient(circle at 40px 40px, rgba(55, 65, 81, 0.12) 2px, transparent 2px)
      `,
      backgroundSize: '40px 40px, 40px 40px, 40px 40px, 40px 40px',
    }}>
        <div className={`relative z-10  w-full  ${width>768 ? 'px-6 py-2' : 'px-3 py-3'} flex justify-between items-center`}>
            <div  className="flex items-center gap-2 cursor-pointer" onClick={()=>router.push('/')}>
                <img src="carbon_shape-exclude.svg" alt="" className={`${width>768 ? '' : 'size-8'}`} />
                <div className={`poppins-medium ${width>768 ? 'text-[25px]' : 'text-[20px]'} tracking-[-4%]`}>Orbitron</div> 
            </div>
            {width>=1024
              ?
                <div className='flex items-center justify-center gap-7'>
                    <div className='poppins-medium px-4 tracking-[-5%] text-[15px] py-1.5 rounded-full bg-[#9d34ff] text-white cursor-pointer hover:bg-[#8b10ff] transition-transform duration-150 active:scale-95'>Create Call</div>
                    <div className='poppins-medium px-4 tracking-[-5%] text-[15px] py-1.5 rounded-full bg-[#9d34ff] text-white cursor-pointer hover:bg-[#8b10ff] transition-transform duration-150 active:scale-95'>Join Call</div>
                    <div className='poppins-medium px-4 tracking-[-5%] text-[15px] py-1.5 rounded-full bg-white text-black cursor-pointer hover:bg-gray-200 transition-transform duration-150 active:scale-95'>Log Out</div>
                </div>
              : 
            <div className='poppins-medium px-4 tracking-[-5%] text-[15px] py-1.5 rounded-full bg-white text-black cursor-pointer hover:bg-gray-200 transition-transform duration-150 active:scale-95'>Log Out</div>
            }
        </div>

        <div
          className={`fixed w-[500px] h-[500px] rounded-full z-0 ${width<768 ? 'top-0 left-0 -translate-y-40 -translate-x-40' : 'top-0 -translate-y-36 -translate-x-36'}`}
          style={{
            background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
            filter: 'blur(100px)',
          }}
        ></div>

        <div
          className={`fixed w-[500px] h-[500px] rounded-full z-0 ${width<768 ? 'bottom-0 right-0 translate-y-5 translate-x-16' : 'bottom-0 translate-y-36 right-0 translate-x-24'}`}
          style={{
            background: `radial-gradient(circle, rgba(126, 91, 239, 0.4) 0%, rgba(166, 109, 246, 0.2) 60%, transparent 100%)`,
            filter: 'blur(100px)',
          }}
        ></div>
        
        {showButton && <a href={'#main'} className='fixed z-20 bottom-5 right-5 bg-white/20 border-white/40 p-1 rounded-full'>
            <ScrollTop/>
        </a>}

        <div className={`flex flex-col flex-1 rounded-md border-zinc-800 bg-black border border-b-0 z-10 pb-0 ${width>768 ? 'px-16 py-4' : 'py-4 px-10'}`}>
            <p className={` ${width<768 ? 'text-[18px]' : 'text-[30px]'} leading-[60px] poppins-medium tracking-[-5%] items-center justify-center bg-[linear-gradient(92.22deg,rgba(255,255,255,0.4)_-6.68%,#FAF9F9_31.88%,#D1D1D1_61.39%,rgba(181,181,181,0.4)_89.88%)] bg-clip-text text-transparent poppins-medium pb-0 border-b `}>Recorded Sessions</p>
            <div className={`w-full flex flex-col gap-10 min-h-full mt-5`}>
                
            </div>
        </div>


               
    </div>
} 