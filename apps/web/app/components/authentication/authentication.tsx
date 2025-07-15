"use client";
import axios from "axios";
import {  useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {signIn} from 'next-auth/react';

interface params{
    sign : boolean
}

export function Authentication(props : params) {    
    const [sign,setSign]=useState(props.sign);

    const emailRef=useRef<HTMLInputElement>(null);
    const passwordRef=useRef<HTMLInputElement>(null);
    const firstNameRef=useRef<HTMLInputElement>(null);
    const lastNameRef=useRef<HTMLInputElement>(null);
    const router=useRouter();

    const [emailError,setEmailError]=useState<string | null>(null);
    const [passwordError,setPasswordError]=useState<string | null>(null);
    const [firstNameError,setFirstNameError]=useState<string | null>(null);
    const [lastNameError,setLastNameError]=useState<string | null>(null);
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
            })
            .then((response) => {
                console.log(response.data);
                localStorage.setItem('token',response.data.token);
                router.push('/pages/dashboard');
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
                    console.log(error);
                }
            })
        }
        else {
            axios.post('/api/auth/signup',{
                firstName: firstName,
                lastName: lastName,
                email: email,
                password : password
            }).then((response)=>{
                console.log(response.data);
                localStorage.setItem('token',response.data.token);
                router.push('/pages/dashboard');
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
                    console.log(error);
                }
            })
        }
    }
    function change() {
        if(sign){
            setSign(false);
            router.push('/pages/signup');
        } 
        else{
            setSign(true);
            router.push('/pages/login');
        } 
    }

    async function handleGoogleLogin(){
        try {
            setIsRedirecting(true);
            const res = await signIn('google', {
                callbackUrl: '/pages/dashboard',
                redirect: false,
            });
            if (res?.ok && res.url) {
                window.location.href = res.url;
            } else {
                console.error('Google SignIn failed:', res?.error);
            }
        } catch (err) {
            console.error('SignIn Exception:', err);
        } finally {
            setIsRedirecting(false);
        }  
    }

    return <div className="bg-white h-screen flex flex-col justify-center items-center ">
        <div className={`flex flex-col items-center justify-center gap-2 px-10 py-5 bg-gray-100 rounded-lg shadow-lg`}> 
            <div className="flex justify-between w-full mb-2">
                <h1 className="text-black text-xl font-semibold">Authentication</h1>
                <button className="text-red-500 text-sm font-semibold" onClick={()=>{router.push('/')}}>close</button>
            </div>
            <div className="text-gray-800 font-semibold text-center text-sm cursor-pointer hover:text-blue-600" onClick={handleGoogleLogin}>{isRedirecting ? "Redirecting..." : "Continue with Google"}</div>
            <div className="gap-1 text-black font-semibold text-center text-xs flex justify-center items-center">
                <div className="border w-24 border-black"></div>
                OR
                <div className="border w-24 border-black"></div>
            </div>

            {sign ? 
            <form className="flex flex-col gap-2" id="login-form" method="POST" action="/api/auth/login">
                <input ref={emailRef} className="px-2 p-1" type="email" name="email" placeholder="Email" required />
                {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
                <input ref={passwordRef} className="px-2 p-1" type="password" name="password" placeholder="Password" required />
                {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
                <button onClick={handle} className="bg-gray-700 rounded px-3 py-1" type="submit">Login</button>
            </form>
            :
            <form className="flex flex-col gap-3" id="signup-form" method="POST" action="/api/auth/signup">
                <input ref={firstNameRef} className="px-2 p-1" type="text" name="First Name" placeholder="First Name" required />
                {firstNameError && <p className="text-red-500 text-xs">{firstNameError}</p>}
                <input ref={lastNameRef} className="px-2 p-1" type="text" name="Last Name" placeholder="Last Name" required/>
                {lastNameError && <p className="text-red-500 text-xs">{lastNameError}</p>}    
                <input ref={emailRef} className="px-2 p-1" type="email" name="email" placeholder="Email" required />
                {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
                <input ref={passwordRef} className="px-2 p-1" type="password" name="password" placeholder="Password" required />
                {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
                <button onClick={handle} className="bg-gray-700 rounded px-3 py-1" type="submit">SignUp</button>
            </form>
            }
            <button className="text-blue-500" onClick={change}>{sign ? "Switch to Signup" : "Switch to Login"}</button>
        </div>
    </div>
}
