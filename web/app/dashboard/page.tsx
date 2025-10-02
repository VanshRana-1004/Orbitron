"use client"
import { useState,useRef,useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import axios from 'axios';
import FeedbackIcon from 'app/components/icons/feedback';
import LogoutIcon from 'app/components/icons/logout';
import { signOut } from 'next-auth/react';
import 'react-day-picker/dist/style.css';
import CrossIcon from 'app/components/icons/cross';
import EditIcon from 'app/components/icons/edit';
import { useRecordingStore } from 'app/store/recorded-calls';
import { useCurrentVideoStore } from 'app/store/current-video';
import ScrollTop from 'app/components/icons/scrollTop';
import SearchIcon from 'app/components/icons/search';
import SettingIcon from 'app/components/icons/setting';
import DotsIcon from 'app/components/icons/dots';
import { HashLoader } from 'react-spinners';
import { ToastContainer, toast } from 'react-toastify';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080'; 

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
  peers : {img : string, name : string, email : string}[];
  clips: {
    url: string;
    roomId: string;
    clipNum: string;
    public_id: string;
  }[];
};

export default  function Dashboard() {
    const router=useRouter();
    const {video,setVideo}=useCurrentVideoStore();
    const {recordings,setRecordings}=useRecordingStore();
    const callNameRef=useRef<HTMLInputElement>(null);
    const callIdRef=useRef<HTMLInputElement>(null);
    const [showCreate,setShowCreate]=useState(false);
    const [showJoin,setShowJoin]=useState(false);
    const [name,setName]=useState<string>('');
    const [email,setEmail]=useState<string>('');
    const [firstName,setFirstName]=useState<string>('');
    const [lastName,setLastName]=useState<string>(''); 
    const [img,setImg]=useState<string>('/defaultpc.png');
    const [id,setId]=useState<string>('');
    const idRef=useRef<string>('');
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
    const [showDetail,setShowDetail]=useState(false);
    const [searchText,setSearchText]=useState<string>('');
    const [search,setSearch]=useState<boolean>(false);

    const [createLoader,setCreateLoader]=useState<boolean>(false);
    const [joinLoader,setJoinLoader]=useState<boolean>(false);
    const [profileLoader,setProfileLoader]=useState<boolean>(false);
    const [feedbackLoader,setFeedbackLoader]=useState<boolean>(false);
    const [recordedCalls,setRecordedCalls]=useState<number>(0);

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

    useEffect(()=>{
        async function getInfo(){
            try{
                const res1=await axios.get('/api/auth/me');
                console.log(res1.data);
                setName(res1.data.user.name);
                setEmail(res1.data.user.email);
                setId(res1.data.user.id)
                setLastName(res1.data.user.lastName);
                setFirstName(res1.data.user.firstName);
                if(name=='') setName(`${res1.data.user.firstName} ${res1.data.user.lastName}`)
                idRef.current=res1.data.user.id;
                console.log(res1.data.user.id);
                setAuth(true);
                const info=await axios.get('/api/auth/user-info',{
                    params: {
                        id: res1.data.user.id
                    }
                });
                console.log(info.data);
                setImg(info.data.user.profileImage || '/defaultpc.png');
            }catch(e){
                console.error("Error fetching user info:", e);
                redirect('/login');
            }
        } 
        getInfo();
    },[])

    useEffect(()=>{
        if(!auth) return;
        async function getNumberOfRecordedCalls(){
            try{
                const res=await axios.get('/api/auth/number-of-calls',{
                    params : {userId : Number(idRef.current)}
                })
                console.log('[server]:[number of recorded calls]:')
                console.log(res.data.count);
                setRecordedCalls(res.data.count);
            }catch(e){
                console.log(e);
            }
        }
        const interval = setInterval(getNumberOfRecordedCalls, 10000);
        return () => clearInterval(interval);
    },[auth])

    useEffect(()=>{
        if(!auth) return;
        console.log('fetching clips for userId : ',idRef.current);
        async function getInfo(){
            const res =await axios.get('/api/auth/get-clips',{
                params : {userId : Number(idRef.current)}
            })
            console.log(res.data);
            if(res.data.length!=0) setRecordings(res.data);
        }
        getInfo();
    },[auth,recordedCalls])

    async function createNewCall(){ 
        if(callNameRef.current?.value==''){
            toast.error('Call name cannot be empty');
            return;
        }
        setCreateLoader(true);
        await axios.post('/api/auth/create-call', {
            callSlug : callNameRef.current?.value,
        }).then(async (response)=>{
            console.log(response.data);
            const callId : string=response.data.callingId;
            const slug : string=response.data.slug;
            if(callId==undefined){
                setCreateLoader(false);
                toast.error('Something went wrong, Please try again later.')
                console.log('Error in creating a call');
            } 
            else{
                const res = await axios.post(`${SERVER_URL}/create-call`, {
                    roomId: callId,
                    userId: response.data.userId,
                });
                const data = await res.data;
                console.log(data);
                router.push(`/call/${slug}/${callId}`);
            } 
        }).catch((e)=>{
            setCreateLoader(false);
            toast.error('unknown server error, Please try again later.');
            console.log(e.status + ' ' + e.message);
        }) 
    }   
    
    async function joinCall() {
        if(callNameRef.current?.value==''){
            toast.error('Call ID cannot be empty');
            return;
        }
        setJoinLoader(true);
        await axios.post('/api/auth/join-call', {
            callId : callIdRef.current?.value,
            userId : idRef.current,
        }).then(async (response)=>{
            console.log(response.data);
            const callId : string=response.data.callingId;
            const slug : string=response.data.slug; 
            if(callId==undefined){
                toast.error('Something went wrong, Please try again later.')
                console.log('Error in joining a call');
                setJoinLoader(false);
            } 
            else{
                await fetch(`${SERVER_URL}/join-call`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ roomId : callId}),
                }).then(async (res)=>{
                    if (res.status === 200) {
                        console.log(res);
                        router.push(`/call/${slug}/${callId}`);
                    }
                    else{
                        setJoinLoader(false);
                        if (res.status === 403) {
                            toast.info('The call already ended.')
                        } else if (res.status === 404) {
                            toast.warning(`This call doesn't exists.`)
                        } else if (res.status === 400) {
                            toast.error(`Max user limit for this call already reached.`)
                        } else {
                            toast.error('Something went wrong, Please try again later.')
                        }
                    } 
                }).catch((err)=>{
                    setJoinLoader(false);
                    console.error("Network or server error:", err);
                    toast.error('Something went wrong, Please try again later.')
                })
            } 
        }).catch((e)=>{
            setJoinLoader(false);
            toast.error('Call not found.');
            console.log(e.status + ' ' + e.message);
        }) 
    }

    async function logout(){
        try {
            toast.loading('Logging out...');
            await axios.post('/api/auth/logout');
            await signOut({ redirect: false });
            window.location.href = '/';
        } catch (e) {
            toast.error('Error while logging out');
            console.error('Error while logging out:', e);
        }
    }

    async function sendFeedback(){
        try{
            setFeedbackLoader(true);
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
            if(feedbackRef.current) feedbackRef.current.value='';
            setFeedbackLoader(false);
            toast.success('Feedback sent successfully. Thank you!');
        }catch(e){
            setFeedbackLoader(false);
            console.log('error while sending feedback')
            toast.error('Error while sending feedback. Please try again.');
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
            setProfileLoader(true);
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
            if(res.data.imageUrl) setImg(res.data.imageUrl);
            else setImg('/defaultpc.png');
            console.log(res)
            if(fnRef.current) fnRef.current.value='';
            if(lnRef.current) lnRef.current.value='';
            console.log(`successfully updated user's profile info`);
            setProfileLoader(false);
            toast.success('Profile updated successfully');
        }
        catch(e){
            setProfileLoader(false);
            console.log(`error while updating user's profile info`);
            toast.error('Error while updating profile. Please try again.');
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

    const filteredRecordings = recordings.filter((session) =>
        session.slug.toLowerCase().includes(searchText.toLowerCase())
    );

    return <div id={'main'} onClick={()=>{
            if(showDetail){
                setShowDetail(false);
            }
        }} className={`min-h-screen w-screen bg-black overflow-hidden flex flex-col ${width>768 ? 'px-24 pt-1.5 gap-1.5' : width>450 ? 'px-12 gap-1.5 pt-1.5' : 'px-1 gap-1 pt-1'} `}
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

        <ToastContainer position="top-center" autoClose={3000} theme='dark'/>

        <div className={`relative z-10  w-full  ${width>768 ? 'px-6 py-2' : 'px-3 py-3'} flex justify-between items-center 
            ${(showProfile || feedBack || showCreate || showJoin || callDetail!==-1) && 'pointer-events-none'}`}>
            <div  className="flex items-center gap-2 cursor-pointer" onClick={()=>router.push('/')}>
                <img src="carbon_shape-exclude.svg" alt="" className={`${width>768 ? '' : 'size-8'}`} />
                <div className={`poppins-medium ${width>768 ? 'text-[25px]' : 'text-[20px]'} tracking-[-4%]`}>Orbitron</div> 
            </div>
            <div className='flex flex-col gap-0 justify-end'>
                <div className='flex gap-0 items-center justify-end'>
                    {width>600 && <div onClick={()=>setShowDetail(showDetail=>!showDetail)} className='cursor-pointer border px-4 pl-5 py-1.5 translate-x-2.5 border-zinc-800/90 bg-violet-500/80 hover:bg-violet-500 text-white text-[14px] poppins-medium rounded-l-full z-0 transition-transform duration-150 active:scale-95'>{firstName + ' ' + lastName}</div>}
                    <img  onClick={()=>setShowDetail(showDetail=>!showDetail)} src={img} alt=""  className={`cursor-pointer rounded-full z-10 ${width>768 ? 'size-11' : 'size-9'} border border-violet-500`}/>
                </div>
                {showDetail && <div className={`flex flex-col rounded-sm absolute top-full z-10 bg-black border border-zinc-800/90 ${width>768 ? '-translate-y-1 -translate-x-8' : ' -translate-x-4 -translate-y-2'} h-auto w-40 right-0 `}>
                    <div onClick={()=>{
                            setShowCreate(false);
                            setShowJoin(false);
                            setFeedback(false);
                            setShowProfile(true);
                        }}
                        className='items-center px-3 py-1.5 hover:bg-zinc-800 cursor-pointer poppins-regular text-[14px] text-zinc-300/70 border-zinc-800/90 flex gap-3'>
                        <SettingIcon/>
                        <p>Settings</p>
                    </div>
                    <div onClick={()=>{
                            setShowCreate(false);
                            setShowJoin(false);
                            setShowProfile(false);
                            setFeedback(true);
                        }} className='items-center px-3 py-1.5 hover:bg-zinc-800 cursor-pointer poppins-regular text-[14px] text-zinc-300/70 border-t border-zinc-800/90 flex gap-3'>
                        <FeedbackIcon/>
                        <p>Feedback</p>
                    </div>
                    <div onClick={logout} className='items-center px-3 py-1.5 hover:bg-zinc-800 cursor-pointer poppins-regular text-[14px] text-zinc-300/70 border-t border-zinc-800 flex gap-3'>
                        <LogoutIcon/>
                        <p>Log Out</p>
                    </div>
                </div> }
            </div>
                 
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
        
        {showButton && <a href={'#main'} className='fixed z-20 bottom-12 right-5 bg-black/20 border-white/40 p-1 rounded-full cursor-pointer hover:bg-black/60 transition-transform duration-150 active:scale-95'>
            <ScrollTop/>
        </a>}

        {showProfile 
            && 
            <div className={` ${width>768 ? 'w-96 h-fit'  : width>600 ? 'w-[60%] h-fit' : 'w-[80%] h-fit'} gap-1 flex flex-col p-2 py-1 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border border-zinc-800 rounded-md z-50`}>
                <div className={`flex justify-between items-center`}>
                    <p className={` ${width>=900 ? 'text-[18px]' : width>790 ? 'text-[16px]' : 'text-[14px]'} poppins-medium tracking-[-5%] items-center justify-center bg-[linear-gradient(92.22deg,rgba(255,255,255,0.4)_-6.68%,#FAF9F9_31.88%,#D1D1D1_61.39%,rgba(181,181,181,0.4)_89.88%)] bg-clip-text text-transparent poppins-medium `}>Profile Settings :</p>
                    <div className="top-3 right-3 rounded-full p-1 hover:bg-zinc-800 cursor-pointer" onClick={()=>{
                        setLnChange(false);
                        setFnChange(false);
                        setImageChange(false);
                        setShowProfile(false)
                        if(fnRef.current) fnRef.current.value='';
                        if(lnRef.current) lnRef.current.value='';
                    }}><CrossIcon/></div>
                </div>
                <div className='border-b border-b-zinc-800'></div>
                <div className='flex flex-col gap-1 p-1 w-full h-full'>
                    <div className='flex gap-1 items-center justify-start'>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*"
                        />
                        <div onClick={()=>fileInputRef.current?.click()} className='p-1 rounded-full bg-black hover:bg-zinc-900 cursor-pointer size-fit'><EditIcon/></div>
                        <p className={`poppins-regular ${width<768 ? 'text-[13px]' : 'text-[15px]'} tracking-[-5%] text-zinc-300/70`}>change profile image</p>    
                    </div>
                    <img src={img} alt="" className={`rounded-md object-cover max-h-[350px] border border-zinc-900`}/>
                    <div className={`flex items-start ${width<500 ? 'flex-col' : 'gap-3'}`}>
                        <p className={`poppins-regular ${width<768 ? 'text-[13px]' : 'text-[14px]'} tracking-[-5%] text-zinc-300/70`}>{`Registered Email : `}</p>
                        <p className={`poppins-medium ${width<768 ? 'text-[14px]' : 'text-[15px]'} tracking-[-5%] text-zinc-300/70`}>{email}</p>
                    </div>
                    <div className='flex flex-col gap-1'>
                        <div className={`flex flex-col items-start gap-0.5`}>
                            <div className='flex items-center gap-2'>
                                <div onClick={()=>setFnChange(true)} className='p-1 rounded-full bg-black hover:bg-zinc-900 cursor-pointer size-fit'><EditIcon/></div>
                                <p className={`poppins-regular ${width<768 ? 'text-[13px]' : 'text-[14px]'} tracking-[-5%] text-zinc-300/70`}>First Name : </p>
                                <p className={`poppins-medium ${width<768 ? 'text-[14px]' : 'text-[15px]'} tracking-[-5%] text-zinc-300/70`}>{firstName}</p>
                            </div>
                            {fnChange && <input ref={fnRef} type="text" placeholder='min 3 char' className='poppins-thin text-[15px] w-56 text-zinc-400 placeholder:text-zinc-500 px-2 py-1 rounded-md outline-none bg-black border border-zinc-800 flex-1'/> }
                        </div>
                        <div className={`flex flex-col items-start gap-0.5`}>
                            <div className='flex items-center gap-2'>
                                <div onClick={()=>setLnChange(true)} className='p-1 rounded-full bg-black hover:bg-zinc-900 cursor-pointer size-fit'><EditIcon/></div>
                                <p className={`poppins-regular ${width<768 ? 'text-[13px]' : 'text-[14px]'} tracking-[-5%] text-zinc-300/70`}>Last Name : </p>
                                <p className={`poppins-medium ${width<768 ? 'text-[14px]' : 'text-[15px]'} tracking-[-5%] text-zinc-300/70`}>{lastName}</p>
                            </div>
                            {lnChange && <input ref={lnRef} type="text" placeholder='min 3 char' className='poppins-thin text-[15px] w-56 text-zinc-400 placeholder:text-zinc-500 px-2 py-1 rounded-md outline-none bg-black border border-zinc-800 flex-1'/> }
                        </div>
                    </div>
                    
                    {
                        profileLoader
                        ?
                        <HashLoader color={'#A1A1AA'} size={33} className='mx-auto'/>
                        :
                        <div className='flex items-center justify-end gap-3'>
                            <div onClick={()=>{
                                setLnChange(false);
                                setFnChange(false);
                                setImageChange(false);
                                setShowProfile(false)
                            }} className='bg-zinc-800 cursor-pointer hover:bg-zinc-700 poppins-regular text-[14px] text-white rounded-md px-5 py-1.5 transition-transform duration-150 active:scale-95'>Cancel</div>
                            <div onClick={doneChanges} className='bg-violet-500/80 cursor-pointer hover:bg-violet-500 poppins-regular text-[14px] text-white rounded-md px-5 py-1.5 transition-transform duration-150 active:scale-95'>Done</div>
                        </div>
                    }
                </div>
                
            </div>
        } 
        
        {feedBack 
            && 
            <div className={`${width>768 ? 'w-[500px]' : width>600 ? 'w-[75%]' : 'w-[87%]'} gap-2 flex flex-col p-3 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border border-zinc-800 rounded-md z-50`}>
                <div className={`flex justify-between items-center`}>
                    <p className={` ${width>=900 ? 'text-[18px]' : width>790 ? 'text-[16px]' : 'text-[14px]'} poppins-medium tracking-[-5%] items-center justify-center bg-[linear-gradient(92.22deg,rgba(255,255,255,0.4)_-6.68%,#FAF9F9_31.88%,#D1D1D1_61.39%,rgba(181,181,181,0.4)_89.88%)] bg-clip-text text-transparent poppins-medium `}>Share your Experience</p>
                    <div className="top-3 right-3 rounded-full p-1 hover:bg-zinc-800 cursor-pointer" onClick={()=>{
                        setFeedback(false)
                        if(feedbackRef.current) feedbackRef.current.value='';
                    }}><CrossIcon/></div>
                </div>
                <div className='border-b border-b-zinc-800'></div>
                <textarea ref={feedbackRef} className="outline-none bg-black border border-zinc-800 scroll-m-0 w-full h-24 p-2  rounded-sm no-scrollbar"/>
                {feedbackLoader 
                    ? 
                    <HashLoader className='mx-auto' size={33} color={'#A1A1AA'}/> 
                    : 
                    <div className='flex items-center justify-end gap-3'>
                        <div onClick={()=>{
                            setFeedback(false)
                            if(feedbackRef.current) feedbackRef.current.value='';
                        }} className='bg-zinc-800 cursor-pointer hover:bg-zinc-700 poppins-regular text-[14px] text-white rounded-md px-5 py-1.5 transition-transform duration-150 active:scale-95'>Cancel</div>
                        <div onClick={sendFeedback} className='bg-violet-500/80 cursor-pointer hover:bg-violet-500 poppins-regular text-[14px] text-white rounded-md px-5 py-1.5 transition-transform duration-150 active:scale-95'>Send</div>
                    </div>
                }

            </div>
        }
        
        {showCreate 
            && 
            <div className={`${width>768 ? 'w-96' : 'w-[70%]'} gap-2 flex flex-col p-3 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border border-zinc-800 rounded-md z-50`}>
                <div className={`flex justify-between items-center`}>
                    <p className={` ${width>=900 ? 'text-[18px]' : width>790 ? 'text-[16px]' : 'text-[14px]'} poppins-medium tracking-[-5%] items-center justify-center bg-[linear-gradient(92.22deg,rgba(255,255,255,0.4)_-6.68%,#FAF9F9_31.88%,#D1D1D1_61.39%,rgba(181,181,181,0.4)_89.88%)] bg-clip-text text-transparent poppins-medium `}>Create a new Call</p>
                    <div className="top-3 right-3 rounded-full p-1 hover:bg-zinc-800 cursor-pointer" onClick={()=>{
                        setShowCreate(false)
                        if(callNameRef.current) callNameRef.current.value='';
                    }}><CrossIcon/></div>
                </div>
                <div className='w-full border-b border-b-zinc-700'></div>
                <div className='flex items-center gap-3'>
                    <p className='poppins-thin text-[16px] tracking-[-5%] text-zinc-300/70'>Call Name : </p>
                    <input ref={callNameRef} type="text" className='poppins-thin text-[15px] w-56 text-zinc-400 placeholder:text-zinc-500 px-2 py-1 rounded-md outline-none bg-black border border-zinc-800 flex-1'/>
                </div>
                {
                    createLoader 
                    ?
                    <HashLoader color={'#A1A1AA'} size={33} className='mx-auto'/>
                    :
                    <div className='flex items-center justify-end gap-3'>
                        <div onClick={()=>{
                            setShowCreate(false)
                            if(callNameRef.current) callNameRef.current.value='';
                        }} className='bg-zinc-800 cursor-pointer hover:bg-zinc-700 poppins-regular text-[14px] text-white rounded-md px-5 py-1.5 transition-transform duration-150 active:scale-95'>Cancel</div>
                        <div onClick={createNewCall} className='bg-violet-500/80 cursor-pointer hover:bg-violet-500 poppins-regular text-[14px] text-white rounded-md px-5 py-1.5 transition-transform duration-150 active:scale-95'>Create</div>
                    </div>
                }
            </div>
        }
        
        {showJoin 
            && 
            <div className={`${width>768 ? 'w-96' : 'w-[70%]'} gap-2 flex flex-col p-3 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border border-zinc-800 rounded-md z-50`}>
                <div className={`flex justify-between items-center`}>
                    <p className={` ${width>=900 ? 'text-[18px]' : width>790 ? 'text-[16px]' : 'text-[14px]'} poppins-medium tracking-[-5%] items-center justify-center bg-[linear-gradient(92.22deg,rgba(255,255,255,0.4)_-6.68%,#FAF9F9_31.88%,#D1D1D1_61.39%,rgba(181,181,181,0.4)_89.88%)] bg-clip-text text-transparent poppins-medium `}>Join ongoing Call</p>
                    <div className="top-3 right-3 rounded-full p-1 hover:bg-zinc-800 cursor-pointer" onClick={()=>{
                        setShowJoin(false)
                        if(callIdRef.current) callIdRef.current.value='';
                    }}><CrossIcon/></div>
                </div>
                <div className='border-b border-b-zinc-800'></div>
                <div className='flex items-center gap-3'>
                    <p className='poppins-thin text-[16px] tracking-[-5%] text-zinc-300/70'>Call Id : </p>
                    <input ref={callIdRef} type="text" className='poppins-thin text-[15px] w-56 text-zinc-400 placeholder:text-zinc-500 px-2 py-1 rounded-md outline-none bg-black border border-zinc-800 flex-1'/>
                </div>
                {
                    joinLoader
                    ?
                    <HashLoader color={'#A1A1AA'} size={33} className='mx-auto'/>
                    :
                    <div className='flex items-center justify-end gap-3'>
                        <div onClick={()=>{
                            setShowJoin(false)
                            if(callIdRef.current) callIdRef.current.value='';
                        }} className='bg-zinc-800 cursor-pointer hover:bg-zinc-700 poppins-regular text-[14px] text-white rounded-md px-5 py-1.5 transition-transform duration-150 active:scale-95'>Cancel</div>
                        <div onClick={joinCall} className='bg-violet-500/80 cursor-pointer hover:bg-violet-500 poppins-regular text-[14px] text-white rounded-md px-5 py-1.5 transition-transform duration-150 active:scale-95'>Join</div>
                    </div>
                }
            </div>
        }

        {callDetail!==-1 
            &&
            <div className={`${width>768 ? 'min-w-80' : width>600 ? 'min-w-[60%]' : 'min-w-[85%]'} px-5 gap-1 flex flex-col p-2 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border border-zinc-800 rounded-md z-50`}>
                <div className='flex justify-between items-center border-b border-b-zinc-800 py-1'>
                    <p  className={` ${width>=900 ? 'text-[18px]' : width>790 ? 'text-[16px]' : 'text-[14px]'} poppins-medium tracking-[-5%] items-center justify-center bg-[linear-gradient(92.22deg,rgba(255,255,255,0.4)_-6.68%,#FAF9F9_31.88%,#D1D1D1_61.39%,rgba(181,181,181,0.4)_89.88%)] bg-clip-text text-transparent poppins-medium `}>Session Detail </p>
                    <div onClick={()=>setCallDetail(-1)} className='rounded-full p-0.5 cursor-pointer self-end hover:bg-zinc-800'><CrossIcon/></div>
                </div>
                <p className='line-clamp-2 poppins-regular text-[13px] text-zinc-300'>{'Session Name : ' + recordings[callDetail]?.slug}</p>
                <p className='line-clamp-2 poppins-regular text-[13px] text-zinc-300'>{'Date : '+recordings[callDetail]?.date}</p>
                <div className='flex flex-col py-1 gap-1 w-full'>
                    {recordings[callDetail]?.peers.map((peer,ind)=>(
                        <div key={ind} className='flex w-full gap-2 items-center py-1'>
                            <img src={peer.img} alt="" className='rounded-full size-10'/>
                            <div className='flex flex-col items-start '>
                                <p className='line-clamp-2 poppins-regular text-[13px] text-zinc-300'>{peer.name}</p>
                                <p className='line-clamp-2 poppins-regular text-[13px] text-zinc-300'>{peer.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        }

        <div className={`flex flex-col z-0 flex-1 rounded-sm border-zinc-800 bg-black border border-b-0 w-full  pb-0 ${width>768 ? 'px-16 py-4' : 'py-0 px-4'}`}>
            <div className={`flex w-full justify-between ${width>=1024 ? 'px-2 ' : 'px-4'} items-center `}>
                <p className={` ${width>=900 ? 'text-[28px]' : width>790 ? 'text-[20px]' : 'text-[18px]'} leading-[60px] poppins-medium tracking-[-5%] items-center justify-center bg-[linear-gradient(92.22deg,rgba(255,255,255,0.4)_-6.68%,#FAF9F9_31.88%,#D1D1D1_61.39%,rgba(181,181,181,0.4)_89.88%)] bg-clip-text text-transparent poppins-medium `}>Recorded Sessions</p>
                {width>600 
                ? 
                    <div className={`flex items-center gap-5 ${(showProfile || feedBack || showCreate || showJoin || callDetail!==-1) && 'pointer-events-none'}`}>
                        <div className='flex gap-2 items-center'>
                            <SearchIcon/>
                            <input onChange={(e)=>setSearchText(e.target.value)} value={searchText} type="text" placeholder='search recorded sessions...' className='poppins-thin text-[15px] w-56 text-zinc-400 placeholder:text-zinc-500 px-2 py-1 rounded-md outline-none bg-black border border-zinc-800'/>
                        </div>
                        {width>1024 && <div className='flex gap-3'>
                            <div onClick={()=>{
                                    setFeedback(false);
                                    setShowProfile(false);
                                    setShowJoin(false);
                                    setShowCreate(true);
                                }}  
                            className='bg-zinc-200 cursor-pointer hover:bg-zinc-50 poppins-regular text-[14px] text-black rounded-md px-5 py-1.5 transition-transform duration-150 active:scale-95'>Create Call</div>
                            <div onClick={()=>{
                                    setShowCreate(false);
                                    setFeedback(false);
                                    setShowProfile(false);
                                    setShowJoin(true);
                                }}
                            className='bg-zinc-200 cursor-pointer hover:bg-zinc-50 translate-x-1.5 poppins-regular text-[14px] text-black rounded-md px-5 py-1.5 transition-transform duration-150 active:scale-95'>Join Call</div>
                        </div>}
                    </div>
                    
                :
                    <div onClick={()=>setSearch(true)} className={`hover:bg-zinc-800 hover:border hover:border-zinc-800 p-1 rounded-full cursor-pointer transition-transform duration-150 active:scale-90 ${(showProfile || feedBack || showCreate || showJoin || callDetail!==-1) && 'pointer-events-none'}`}><SearchIcon/></div>
                }
            </div>
            
            {search && 
                <div className='flex w-full justify-between pb-2 px-3'>
                    <input onChange={(e)=>setSearchText(e.target.value)} value={searchText} type="text" placeholder='search recorded sessions...' className='poppins-regular text-[15px] w-60 text-zinc-400 placeholder:text-zinc-500 px-2 py-1 rounded-md outline-none bg-black border border-zinc-800'/>
                    <div className="top-3 right-3 rounded-full p-1.5 border hover:bg-zinc-800 cursor-pointer" 
                        onClick={()=>{
                            setSearch(false)
                            setSearchText('');
                        }}><CrossIcon/></div>
                </div>
            }
            
            <div className='border-b w-full border-b-zinc-800'></div>
            
            {recordings.length===0
             ?
                <p className={` ${width>=900 ? 'text-[24px]' : width>790 ? 'text-[18px]' : 'text-[16px]'} leading-[60px] poppins-regular tracking-[-5%] items-center justify-center bg-zinc-400/30 bg-clip-text text-transparent poppins-medium w-fit absolute self-center top-1/2`}>No Recorded Sessions</p>
             :
                <div className={`w-full grid ${width>1280 ? 'grid-cols-4' : width>1024 ? 'grid-cols-3' : width>800 ? 'grid-cols-2' : 'grid-cols-1'} gap-10 min-h-full mt-5 ${(showProfile || feedBack || showCreate || showJoin || callDetail!==-1) && 'pointer-events-none'}`}>
                    {filteredRecordings.map((session,ind)=>(
                        <div  key={ind} className=' h-auto rounded-md  flex flex-col bg-black border border-zinc-800 p-1.5 gap-1.5'>
                            <div onClick={()=>showClips(session.clips,session.slug)} className=' transform transition-transform duration-300 hover:scale-95 hover:z-20 cursor-pointer z-10 w-full border border-zinc-800/90 h-[90%] rounded-md'>
                                {session.clips[0] && (
                                    <video
                                        src={session.clips[1]?.url || session.clips[0].url}
                                        muted
                                        playsInline
                                        controls={false}
                                        style={{aspectRatio:'16/10'}}
                                        className="w-full rounded-md h-full object-cover pointer-events-none"
                                    />
                                )}
                            </div>
                            <div className='flex-1 flex justify-between px-2'>
                                <p className="poppins-regular tracking-[-5%] text-zinc-300/80 text-[16px] line-clamp-2">
                                    {session.slug}
                                </p>
                                <div onClick={()=>setCallDetail(ind)} className='p-0.5 object-center rounded-full hover:bg-zinc-900 cursor-pointer '><DotsIcon/></div>
                            </div>
                        </div>
                    ))}
                </div>
            }

        </div>
               
    </div>
}