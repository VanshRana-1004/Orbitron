"use client";
import axios from "axios";
import {  useRef, useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from 'next-auth/react';
import OpenEye  from "../icons/eye";
import  CloseEye from "../icons/closeeye";
import { ThemeToggle } from "../theme-toggle/theme";

export function Authentication() {    
    
    const [sign, setSign] = useState<boolean>(false);
    const emailRef=useRef<HTMLInputElement>(null);
    const passwordRef=useRef<HTMLInputElement>(null);
    const firstNameRef=useRef<HTMLInputElement>(null);
    const lastNameRef=useRef<HTMLInputElement>(null);
    const router=useRouter();

    const [emailError,setEmailError]=useState<string | null>(null);
    const [passwordError,setPasswordError]=useState<string | null>(null);
    const [firstNameError,setFirstNameError]=useState<string | null>(null);
    const [lastNameError,setLastNameError]=useState<string | null>(null);
    const [error,setError]=useState<string|null>(null);
    const [type,setType]=useState<string>("password");

    useEffect(() => {
        const { pathname, search } = window.location;
        const segments = pathname.split('/');
        if(segments.includes('login')) setSign(true);
        else setSign(false);

        const searchParams = new URLSearchParams(search);
        const errorParam = searchParams.get('error');

        if (errorParam === 'AccessDenied' || errorParam === 'OAuthAccountNotLinked') {
            setError('User ID already logged in with password.');
        } else if (errorParam) {
            setError(decodeURIComponent(errorParam));
        }
    }, []);

    const [isRedirecting, setIsRedirecting] = useState(false);

    function handle(e: React.FormEvent<HTMLButtonElement>) {
        setEmailError(null);
        setPasswordError(null);
        setFirstNameError(null);
        setLastNameError(null);
        
        e.preventDefault();
        
        const email=emailRef.current?.value;
        const firstName=firstNameRef.current?.value;
        const lastName=lastNameRef.current?.value;
        const password=passwordRef.current?.value;
        
        if(sign){
            axios.post('/api/auth/login', {
                email: email,
                password: password
            }, { withCredentials: true })
            .then((response) => {
                console.log(response.data);
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
            axios.post('/api/auth/signup',{
                firstName: firstName,
                lastName: lastName,
                email: email,
                password : password
            }, { withCredentials: true }).then((response)=>{
                console.log(response.data);
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

    return (
    <div className="min-h-screen flex items-center justify-center bg-white bg-[radial-gradient(circle_at_center,_#A0FFD6_0%,_#F6FFFB_65%)] px-4 sm:px-6 dark:bg-[#00040B] dark:bg-[url('/dark-bg.png')] dark:bg-cover dark:bg-center dark:bg-no-repeat relative">
        
        <div className="top-0 left-0 absolute w-full h-full z-10 pointer-events-none
            [background-image:linear-gradient(to_right,#CDFCE7_1px,transparent_1px),linear-gradient(to_bottom,#CDFCE7_1px,transparent_1px)]
            [background-size:60px_60px] dark:hidden"/>

        <div className="fixed w-full top-5 left-0 flex justify-between px-52 z-20 items-center">
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

            <ThemeToggle text={true} bg={false}/>

        </div>

        <div className="relative border z-20 h-fit border-[hsl(154,90%,73%)] bg-white backdrop-blur-[53.2px] shadow-[inset_0_0_10px_rgba(122,248,193,0.2)] rounded-lg px-5 sm:px-[43px] py-10 w-full max-w-sm flex flex-col items-center
        dark:border-white/5 dark:bg-white/5 dark:backdrop-blur-[50px] dark:before:content-[''] dark:before:absolute dark:before:inset-0 dark:before:rounded-xl dark:before:shadow-[inset_0_0_50px_rgba(10,20,36,0.25)] overflow-hidden dark:before:pointer-events-none">
        
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
                    {sign && (
                        <a className="block text-end text-[12px] text-[#16422E] dark:text-white mt-2 hover:underline cursor-pointer font-inter">
                            Forgot password?
                        </a>
                    )}
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
        </div>
    </div>
    );
}  