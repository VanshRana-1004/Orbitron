"use client";
import axios from "axios";
import {  useRef, useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from 'next-auth/react';
import OpenEye  from "../icons/eye";
import  CloseEye from "../icons/closeeye";
import CrossIcon from "../icons/cross"; 
import { HashLoader } from 'react-spinners';

export function Authentication() {    
    const [sign, setSign] = useState<boolean>(false);
    const emailRef=useRef<HTMLInputElement>(null);
    const passwordRef=useRef<HTMLInputElement>(null);
    const firstNameRef=useRef<HTMLInputElement>(null);
    const lastNameRef=useRef<HTMLInputElement>(null);
    const router=useRouter();
    const [width,setWidth]=useState<number>(1500);


    const [emailError,setEmailError]=useState<string | null>(null);
    const [passwordError,setPasswordError]=useState<string | null>(null);
    const [firstNameError,setFirstNameError]=useState<string | null>(null);
    const [lastNameError,setLastNameError]=useState<string | null>(null);
    const [error,setError]=useState<string|null>(null);
    const [type,setType]=useState<string>("password");
    const [loading,setLoading]=useState<boolean>(false);

    useEffect(() => {
        const { pathname, search } = window.location;
        const segments = pathname.split('/');
        if(segments.includes('login')) setSign(true);
        else setSign(false);

        const searchParams = new URLSearchParams(search);
        const errorParam = searchParams.get('error');

        if (errorParam === 'AccessDenied') {
            setError('Sign-in blocked: account conflict (already registered with password).');
        } else if (errorParam === 'OAuthAccountNotLinked') {
            setError('This Google account is not linked to your password account.');
        } else if (errorParam === 'DatabaseUnavailable') {
            setError('Service unavailable: please try again later.');
        } else if (errorParam) {
            setError(decodeURIComponent(errorParam));
        }

    }, []);

    const [isRedirecting, setIsRedirecting] = useState(false);

    async function handle(e: React.FormEvent<HTMLButtonElement>) {
        setEmailError(null);
        setPasswordError(null);
        setFirstNameError(null);
        setLastNameError(null);
        
        e.preventDefault();
        
        const email=emailRef.current?.value.trim();
        const firstName=firstNameRef.current?.value.trim();
        console.log('firstName : ',firstName);
        const lastName=lastNameRef.current?.value.trim();
        const password=passwordRef.current?.value.trim();
        if(email=='' || password=='') return;
       

        if(sign){
            setLoading(true);
                try {
                const response = await axios.post('/api/auth/login', {
                    email,
                    password
                }, { withCredentials: true });


                router.push('/dashboard'); 
            } catch (error: any) {
                setLoading(false);

                if(error.response?.status === 400){
                    const errors = error.response.data.errors;
                    for(const err of errors){
                    if(err.path === "email") setEmailError(err.message);
                        else if(err.path === "password") setPasswordError(err.message);
                    }    
                }
                else{
                    if(error.response?.status === 403) setError('*User already logged in with google*');
                    if(error.response?.status === 404) setError('*User not found*');
                    if(error.response?.status === 401) setError('*Please enter correct password*');
                    if(error.response?.status === 500) setError('*Internal server error, please try again*');
                    console.log(error.message);
                }
            }
        }
        else {
            setLoading(true);
            console.log(firstName, lastName, email, password);

            try {
                const response = await axios.post('/api/auth/signup',{
                    firstName,
                    lastName,
                    email,
                    password
                }, { withCredentials: true });

                console.log(response.data);
                console.log('persistent socket connection after signup');

                router.push('/dashboard');
            } catch (error: any) {
                setLoading(false);

                if(error.response?.status === 400){
                    const errors = error.response.data.errors;
                    for(const err of errors){
                    if(err.path === "email") setEmailError(err.message);
                    else if(err.path === "firstName") setFirstNameError(err.message);
                    else if(err.path === "lastName") setLastNameError(err.message);
                    else if(err.path === "password") setPasswordError(err.message);
                    }    
                }    
                else{
                    if(error.response?.status === 401) setError('*Error while signing up, please try again*');
                    if(error.response?.status === 403) setError('*User already logged in with google*');
                    if(error.response?.status === 500) setError('*Internal server error, please try again*');
                }
            }
        }        
    }

    const handleGoogleLogin = async () => {
        setError(null);
        try {
            setIsRedirecting(true);
            await signIn('google', {
                callbackUrl: '/dashboard', 
            });

        } catch (err) {
            console.error("Unexpected error during sign-in:", err);
            alert("Something went wrong.");
            setIsRedirecting(false);
        }
    };

    useEffect(()=>{
        const handleScreenResize=()=>{
        const wdth=window.innerWidth;
        setWidth(wdth);
        }
        handleScreenResize();
        window.addEventListener('resize',handleScreenResize);
        return ()=>{window.removeEventListener('resize',handleScreenResize)}
    },[])

    return (
    <div className="min-h-screen w-screen overflow-hidden relative flex items-center justify-center"
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
        
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-[250px] w-full z-0"
          style={{
            height: '500px',
            background: 'linear-gradient(180deg, #7E5BEF 0%, #7E5BEF 100%)',
            filter: 'blur(125px)',
            borderRadius: '100%',
          }}
        ></div>

        <div className={`${width>768 ? 'w-[400px] py-8 px-8' : 'w-[95%] px-5 py-8'} h-auto  rounded-[10px] bg-black/40
            backdrop-blur-lg 
            border border-zinc-600
            shadow-[0_8px_32px_rgba(31,38,135,0.1)]
            flex flex-col  gap-4`}>
            
            <div className="absolute top-3 right-3 rounded-full p-1 hover:bg-zinc-800 cursor-pointer" onClick={()=>router.push('/')}><CrossIcon/></div>

            <p className="self-center poppins-regular text-[25px] tracking-[-5%]">Welcome to Orbitron</p>
            {!sign && 
                <div>
                    <p className={`${ width>768 ? 'poppins-thin tracking-none' : 'poppins-light tracking-[-5%]'} text-[15px] `}>First name (min 3 characters)</p>
                    <input
                        ref={firstNameRef}
                        type="text"
                        placeholder="Enter first name"
                        className="w-full px-3 py-2 rounded-[5px] text-[14px] bg-transparent border border-zinc-500 focus-within:ring-1 focus-within:ring-white"
                    />
                </div>}
            {!sign && 
                <div>
                    <p className={`${ width>768 ? 'poppins-thin tracking-none' : 'poppins-light tracking-[-5%]'} text-[15px] `}>Last name (min 3 characters)</p>
                    <input
                        ref={lastNameRef}
                        type="text"
                        placeholder="Enter last name"
                        className="w-full px-3 py-2 border border-zinc-500 rounded-[5px] text-[14px] bg-transparent focus-within:ring-1 focus-within:ring-white"
                    />
                </div>
            }
            <div>
                <p className={`${ width>768 ? 'poppins-thin tracking-none' : 'poppins-light tracking-[-5%]'} text-[15px] `}>Email</p>
                <input ref={emailRef} type="email" placeholder="Enter your email address"
                    className="w-full px-3 py-2 border border-zinc-500 rounded-[5px] text-[14px] bg-transparent focus-within:ring-1 focus-within:ring-white"
                />
            </div>
            <div>
                <p className={`${ width>768 ? 'poppins-thin tracking-none' : 'poppins-light tracking-[-5%]'} text-[15px] `}>Password (min 6 chars a-z & 0-9 & special)</p>
                <div className="group flex items-center w-full px-3 py-2 border border-zinc-500 rounded-[5px] text-[14px] bg-transparent focus-within:ring-1 focus-within:ring-white">
                    <input
                        ref={passwordRef}
                        type={type}
                        placeholder="Enter your password"
                        className=" w-full rounded-[5px] text-[14px] bg-transparent font-inter focus:outline-none border-none"
                    />
                    {type === 'password' ? (
                        <CloseEye onClick={() => setType("text")} className="stroke-zinc-400  cursor-pointer" color="#FFFFFF" width="24px" height="24px" />
                        ) : (
                        <OpenEye onClick={() => setType("password")} className="stroke-zinc-400  cursor-pointer" color="#FFFFFF" width="24px" height="24px" />
                    )}
                </div>
            </div>

            {(error || emailError || passwordError || firstNameError || lastNameError)  && <div className="h-auto flex flex-col gap-0">
                {[error, emailError, passwordError, firstNameError, lastNameError].filter(Boolean).map((msg, i) => (
                    <p key={i} className="text-red-600 text-[12px] mt-1 font-inter text-center">{msg}</p>
                ))}   
            </div>  }   
                    
            {sign 
                ?
                <button onClick={handle} className={`cursor-pointer flex items-center justify-center bg-[#7E5BEF] text-white rounded-[10px] w-[80%] px-5 py-1.5 self-center text-[16px] mt-2 poppins-regular ${loading && 'pointer-events-none'}`}>
                    {loading ? <HashLoader color={'white'} size={'24'}/> :'Log In'}
                </button>   
                :
                <button onClick={handle} className={`cursor-pointer flex items-center justify-center bg-[#7E5BEF] text-white rounded-[10px] w-[80%] px-5 py-1.5 self-center text-[16px] mt-2 poppins-regular ${loading && 'pointer-events-none'}`}>
                    {loading ? <HashLoader color={'white'} size={'24'}/> : 'Sign Up'}
                </button>
            }        

            <div className="flex items-center gap-2 justify-center">
                <div className={`border-b ${ width>768 ? 'border-b-zinc-400' : 'border-b-zinc-600'} w-1/2`}></div>
                <p className="poppins-regular text-[18px]">or</p>
                <div className={`border-b ${ width>768 ? 'border-b-zinc-400' : 'border-b-zinc-600'} w-1/2`}></div>
            </div>

            <div onClick={handleGoogleLogin} className={`${loading && 'pointer-events-none'} cursor-pointer transition-transform duration-150 active:scale-95 self-center w-[80%] px-3 py-1.5 rounded-[10px] gap-2 border border-zinc-800 bg-white text-black flex items-center justify-center`}>
                <img src="google.png" alt="" className="size-5"/>
                <p className="poppins-medium text-[15px] tracking-[-5%]">Continue with Google</p>
            </div>
            
            {sign 
                ? 
              <p className="self-center poppins-medium text-[15px] tracking-[-5%]">
                Don’t have an account?{' '}
                <a href="/signup" className="poppins-medium text-[15px] tracking-[-5%] hover:underline hover:text-blue-400 cursor-pointer">Sign Up</a>
              </p> 
                : 
              <p className="self-center poppins-medium text-[15px] tracking-[-5%]">
                Already have an account?{' '}
                <a href="/login" className="poppins-medium text-[15px] tracking-[-5%] hover:underline hover:text-blue-400 cursor-pointer">Login</a>
              </p>
            }

        </div>

        
    </div>
    );
}  