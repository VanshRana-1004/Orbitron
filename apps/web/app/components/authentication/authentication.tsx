"use client";
import axios from "axios";
import {  useRef, useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from 'next-auth/react';
import OpenEye  from "../icons/eye";
import  CloseEye from "../icons/closeeye";
import CrossIcon from "../icons/cross"; 
import { useSocketStore } from 'app/store/socket-connection';


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
    const {socket,initSocket}=useSocketStore();

    useEffect(() => {
        initSocket();
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
        
        const email=emailRef.current?.value;
        const firstName=firstNameRef.current?.value;
        console.log('firstName : ',firstName);
        const lastName=lastNameRef.current?.value;
        const password=passwordRef.current?.value;
        
        if(sign){
            await axios.post('/api/auth/login', {
                email: email,
                password: password
            }, { withCredentials: true })
            .then(async (response) => {
                console.log(response.data);
                console.log('persistent socket connection after login')
                router.push('/dashboard');
            })
            .catch((error) => {
                if(error.status==400){
                    const errors=error.response.data.errors;
                    for(const error of errors){
                        if(error.path=="email"){
                            setEmailError(error.message);
                        }
                        else if(error.path=="password"){
                            setPasswordError(error.message);
                        }
                    }    
                }
                else{
                    if(error.status==403) setError('*User already logged in with google*')
                    if(error.status==404) setError('*User not found*')
                    if(error.status==401) setError('*Please enter correct password*')
                    if(error.status==500) setError('*Internal server error, please try again*')
                    console.log(error.message);
                }
            })
        }
        else {
            console.log(firstName, ' ', lastName, ' ', email, ' ', password);
            await axios.post('/api/auth/signup',{
                firstName: firstName,
                lastName: lastName,
                email: email,
                password : password
            }, { withCredentials: true }).then(async (response)=>{
                console.log(response.data);
                console.log('persistent socket connection after signup')
                router.push('/dashboard');
            }).catch((error)=>{
                if(error.status==400){
                    const errors=error.response.data.errors;
                    for(const error of errors){
                        if(error.path=="email"){
                            setEmailError(error.message);
                        }
                        else if(error.path=="firstName"){
                            setFirstNameError(error.message);
                        }
                        else if(error.path=="lastName"){
                            setLastNameError(error.message);
                        }
                        else if(error.path=="password"){
                            setPasswordError(error.message);
                        }
                    }    
                }    
                else{
                    if(error.status==401) setError('*Error while signing up, please try again*')
                    if(error.status==403) setError('*User already logged in with google*')
                    if(error.status==500) setError('*Internal server error, please try again*')
                }
            })
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
                {/* <input type="text" /> */}
                <div className="group flex items-center w-full px-3 py-2 border border-zinc-500 rounded-[5px] text-[14px] bg-transparent focus-within:ring-1 focus-within:ring-white">
                    <input
                        ref={passwordRef}
                        type={type}
                        placeholder="Enter your password"
                        className=" w-full rounded-[5px] text-[14px] bg-transparent font-inter focus:outline-none"
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
                    
            <button className={`bg-[#7E5BEF] text-white rounded-[10px] w-[80%] px-5 py-1.5 self-center text-[16px] mt-2 poppins-regular transition-transform duration-150 active:scale-95`} onClick={handle}>{sign ? 'Log In' : 'Sign Up'}</button>        

            <div className="flex items-center gap-2 justify-center">
                <div className={`border-b ${ width>768 ? 'border-b-zinc-400' : 'border-b-zinc-600'} w-1/2`}></div>
                <p className="poppins-regular text-[18px]">or</p>
                <div className={`border-b ${ width>768 ? 'border-b-zinc-400' : 'border-b-zinc-600'} w-1/2`}></div>
            </div>

            <div onClick={handleGoogleLogin} className={`cursor-pointer transition-transform duration-150 active:scale-95 self-center w-[80%] px-3 py-1.5 rounded-[10px] gap-2 border border-zinc-800 bg-white text-black flex items-center justify-center`}>
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

{/* <div className="relative border z-20 h-fit  bg-black  rounded-lg px-5 sm:px-[43px] py-10 w-full max-w-sm flex flex-col items-center
         overflow-hidden dark:before:pointer-events-none">
        
            <div className="absolute top-2 right-2">
                <a className="text-[#2dbc7b] hover:text-[#16422E] dark:text-gray-300 dark:hover:text-white" href="/">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                </a>
            </div>

            <div className="text-center">
                <p className="font-inter font-semibold text-[24px] sm:text-[28px] tracking-[-0.02em] text-[#16422E] mb-0 dark:text-white">
                    Welcome!
                </p>
                <p className="font-inter text-[14px] sm:text-[16px] text-[#16422E] tracking-[-0.02em] dark:text-white">
                    {sign ? 'Please enter your details to login.' : 'Create your account by filling in the details'}
                </p>
            </div>

            <div className="w-full flex flex-col items-center mt-3 gap-1">
                {!sign && (
                <div className="w-full">
                    <label className="block text-[15px] font-inter text-[#16422E] mb-0 dark:text-white">
                        First name (min 3 characters)
                    </label>
                    <input
                    ref={firstNameRef}
                    type="text"
                    placeholder="Enter first name"
                    className="w-full px-3 py-2 border border-[#7AF8C1] bg-[#CFFEE8] rounded-[5px] text-[14px] text-[#16422E] font-inter placeholder-[#16422E] focus:outline-none focus:ring-2 focus:ring-[#7AF8C1]
                                dark:bg-[#00040B]/25
                                dark:text-white
                                dark:border-[#1E2C40]
                                dark:placeholder-white
                                dark:focus:ring-[#2d415e]"
                    />
                </div>
                )}

                {!sign && (
                <div className="w-full">
                    <label className="block text-[15px] font-inter text-[#16422E] mb-0 dark:text-white">
                        Last name (min 3 characters)
                    </label>
                    <input
                    ref={lastNameRef}
                    type="text"
                    placeholder="Enter last name"
                    className="w-full px-3 py-2 border border-[#7AF8C1] bg-[#CFFEE8] rounded-[5px] text-[14px] text-[#16422E] font-inter placeholder-[#16422E] focus:outline-none focus:ring-2 focus:ring-[#7AF8C1]
                                dark:bg-[#00040B]/25
                                dark:text-white
                                dark:border-[#1E2C40]
                                dark:placeholder-white
                                dark:focus:ring-[#2d415e]"
                    />
                </div>
                )}

                <div className="w-full">
                    <label className="block text-[15px] font-inter text-[#16422E] mb-0 dark:text-white">
                        Email address
                    </label>
                    <input
                        ref={emailRef}
                        type="email"
                        placeholder="Enter your email address"
                        className="w-full px-3 py-2 border border-[#7AF8C1] bg-[#CFFEE8] rounded-[5px] text-[14px] text-[#16422E] font-inter placeholder-[#16422E] focus:outline-none focus:ring-2 focus:ring-[#7AF8C1]
                                dark:bg-[#00040B]/25
                                dark:text-white
                                dark:border-[#1E2C40]
                                dark:placeholder-white
                                dark:focus:ring-[#2d415e]"
                    />
                </div>

                <div className="w-full">
                    <label className="block text-[15px] font-inter text-[#16422E] mb-0 dark:text-white">
                        Password (min 6 chars, a-z, 0-9, special)
                    </label>
                    <div className="group flex items-center px-3 border border-[#7AF8C1] bg-[#CFFEE8] rounded-[5px] focus-within:ring-2 focus-within:ring-[#7AF8C1]
                                dark:bg-[#00040B]/25
                                dark:text-white
                                dark:border-[#1E2C40]
                                dark:placeholder-white
                                dark:focus-within:ring-[#2d415e]">
                        <input
                            ref={passwordRef}
                            type={type}
                            placeholder="Enter your password"
                            className="w-full py-2 text-[14px] text-[#16422E] bg-[#CFFEE8] placeholder-[#16422E] font-inter focus:outline-none
                                dark:bg-transparent
                                dark:text-white
                                dark:border-[#1E2C40]
                                dark:placeholder-white"
                        />
                        {type === 'password' ? (
                        <CloseEye onClick={() => setType("text")} className="stroke-[#16422E] dark:stroke-white cursor-pointer" color="#FFFFFF" width="24px" height="24px" />
                        ) : (
                        <OpenEye onClick={() => setType("password")} className="stroke-[#16422E] dark:stroke-white cursor-pointer" color="#FFFFFF" width="24px" height="24px" />
                        )}
                    </div>
                    
                </div>
            </div>

            {[error, emailError, passwordError, firstNameError, lastNameError].filter(Boolean).map((msg, i) => (
                <p key={i} className="text-red-600 text-[12px] mt-1 font-inter text-center">{msg}</p>
            ))}

            <button
                className="w-full max-w-[316px] mt-6 py-2 bg-[#31C585] dark:bg-[#ffffff] text-white dark:text-[#080f1c] rounded-[5px] font-inter font-semibold text-[15px] tracking-[-0.03em]"
                onClick={handle}
            >
                {sign ? "Log In" : "Sign Up"}
            </button>

            <div className="flex items-center gap-2 w-full my-2">
                <div className="flex-grow border border-[#16422E] dark:border-white" />
                <span className="text-[15px] tracking-[-0.03em] text-[#16422E] dark:text-white font-inter font-medium">or</span>
                <div className="flex-grow border border-[#16422E] dark:border-white" />
            </div>

            <button
                className="w-full max-w-[316px] py-2 bg-[#16422E] dark:bg-[#0076FC] text-white rounded-[5px] font-inter font-semibold text-[15px] tracking-[-0.03em]"
                onClick={handleGoogleLogin}
            >
                Continue with Google
            </button>

            <p className="text-[14px] sm:text-[16px] text-[#16422E] dark:text-white font-inter mt-6 text-center">
                {sign ? (
                <>
                    Don’t have an account?{" "}
                    <a href="/signup" className="font-semibold hover:underline dark:text-[#0076FC]">Sign Up</a>
                </>
                ) : (
                <>
                    Already have an account?{" "}
                    <a href="/login" className="font-semibold hover:underline dark:text-[#0076FC]">Sign In</a>
                </>
                )}
            </p>
        </div> */}