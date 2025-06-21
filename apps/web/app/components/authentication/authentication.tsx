"use client";
import axios from "axios";
import {  useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface params{
    signIn : boolean
}

export function Authentication(props : params) {    
    const [signIn,setSignIn]=useState(props.signIn);

    const emailRef=useRef<HTMLInputElement>(null);
    const passwordRef=useRef<HTMLInputElement>(null);
    const firstNameRef=useRef<HTMLInputElement>(null);
    const lastNameRef=useRef<HTMLInputElement>(null);
    const router=useRouter();

    const [otp,setOtp]=useState(false);
    const [emailError,setEmailError]=useState<string | null>(null);
    const [passwordError,setPasswordError]=useState<string | null>(null);
    const [firstNameError,setFirstNameError]=useState<string | null>(null);
    const [lastNameError,setLastNameError]=useState<string | null>(null);

    function handle(e: React.FormEvent<HTMLButtonElement>) {
        setEmailError(null);
        setPasswordError(null);
        setFirstNameError(null);
        setLastNameError(null);
        
        e.preventDefault();
        
        const email=emailRef.current?.value;
        const firstName=firstNameRef.current?.value;
        const lastName=lastNameRef.current?.value;
        
        if(signIn){
            const password=passwordRef.current?.value;
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
                email: email
            }).then((response)=>{
                console.log(response.data);
                setOtp(true);
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
                    }    
                }    
                else{
                    console.log(error);
                }
            })
        }
    }
    function change() {
        if(signIn){
            setSignIn(false);
            router.push('/pages/signup');
        } 
        else{
            setSignIn(true);
            router.push('/pages/login');
        } 
    }

    return <div className="bg-white h-screen flex flex-col justify-center items-center ">
        {otp && <OTP otp={otp} setOtp={setOtp} email={emailRef.current?.value || ""} password={passwordRef.current?.value} firstName={firstNameRef.current?.value} lastName={lastNameRef.current?.value}/>}
        <div className={`flex flex-col items-center justify-center gap-5 px-10 py-5 bg-gray-100 rounded-lg shadow-lg ${otp ? "pointer-events-none backdrop-blur-sm opacity-40" : ""}`}> 
            <div className="flex justify-between w-full">
                <h1 className="text-black text-xl font-semibold">Authentication</h1>
                <button className="text-red-500 text-sm font-semibold" onClick={()=>{router.push('/')}}>close</button>
            </div>
            {signIn ? 
            <form className="flex flex-col gap-3" id="login-form" method="POST" action="/api/auth/login">
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
                <button onClick={handle} className="bg-gray-700 rounded px-3 py-1" type="submit">Send OTP</button>
            </form>
            }
            <button className="text-blue-500" onClick={change}>{signIn ? "Switch to Signup" : "Switch to Login"}</button>
        </div>
    </div>
}

interface otpProps{
    otp: boolean,
    setOtp: (otp : boolean)=>void,
    email : string,
    password : string | undefined,
    firstName : string | undefined,
    lastName : string | undefined   
}
function OTP(props : otpProps) {
    const router=useRouter();
    const [updateTime,setUpdateTime]=useState(false);
    const [leftTime,setLeftTime]=useState(30);
    const [otpVerified,setOtpVerified]=useState(false);
    const otpRef : React.RefObject<HTMLInputElement | null>[]=Array.from({length: 6}, () => useRef<HTMLInputElement>(null));
    const password1=useRef<HTMLInputElement>(null);
    const password2=useRef<HTMLInputElement>(null);
    const [error1,setError1]=useState(false);
    const [error2,setError2]=useState(false);
    const [error3,setError3]=useState(false);
    const [error4,setError4]=useState(false);
    const [error5,setError5]=useState(false);
    const [error6,setError6]=useState(false);
    

    useEffect(()=>{
        if(otpRef[0]?.current){
            otpRef[0].current?.focus();
            console.log(focus);
        }
    },[])
    function shiftRef(e: React.FormEvent<HTMLInputElement>) {
        e.preventDefault();
        const index=otpRef.findIndex((ref)=>ref.current==e.currentTarget);
        if(e.currentTarget.value>='0' && e.currentTarget.value<='9'){
            if(otpRef[index]?.current && otpRef[index]?.current?.value.length>1){
                const cursorPos=otpRef[index].current.selectionStart ?? 1;
                if(cursorPos==1) otpRef[index].current.value=otpRef[index].current.value.slice(0,1); 
                else otpRef[index].current.value=otpRef[index].current.value.slice(-1);
                if(index+1<5 && otpRef[index].current.value.length==0) otpRef[index+1]?.current?.focus();
                else otpRef[index]?.current?.blur();
            } 
            else if(index>=0 && index<5) otpRef[index+1]?.current?.focus();
            else if(index==5) otpRef[index]?.current?.blur();
        }
        else{
            if(otpRef[index]?.current && otpRef[index]?.current?.value!="") otpRef[index].current.value = "";
            otpRef[index]?.current?.focus();
        }
    }
    function handle(e: React.KeyboardEvent<HTMLInputElement>) {
        const index=otpRef.findIndex((ref)=>ref.current==e.currentTarget);
        if(e.key=="Backspace"){
            if(otpRef[index]?.current && otpRef[index]?.current?.value!=""){
                otpRef[index].current.value = "";
                otpRef[index]?.current?.focus();
            } 
            else{
                if(index==0) otpRef[index]?.current?.focus();
                else if(index<6) otpRef[index-1]?.current?.focus();
            }
        }
    }
    function verify(){
        const otpValue=otpRef.map((ref)=>ref.current?.value).join("");
        console.log(otpValue);
        try{
            if(props.email != ""){
                axios.post('/api/auth/verify',{
                    email: props.email,
                    otp: otpValue
                }).then((response)=>{
                    console.log(response.data);
                    setOtpVerified(true);    
                }).catch((error)=>{
                    console.log(error.message);
                })
            }
            else{
                console.log("Email not found");
            }
        }
        catch(e){
            console.log(e);            
        }
        // next stepis to verify the OTP and to set up a strong password
    }
    function resend(){
        if(props.email!=""  && props.firstName!="" && props.lastName!=""){
            props.setOtp(true);
            setLeftTime(30);
            setUpdateTime((prev)=>!prev);
            axios.post('/api/auth/signup',{
                firstName: props.firstName,
                lastName: props.lastName,
                email: props.email
            }).then((response)=>{
                console.log(response.data);
                
            }).catch((error)=>{
                console.log(error.message);
            })
        }
        else{
            console.log("Incorrent credentials format");
        }
    }
    function create(){
        if(password1.current && password2.current && password1.current?.value!=password2.current?.value){
            setError1(true);
            setError2(false);
            setError3(false);
            setError4(false);
            setError5(false);
            setError6(false);
        }
        else if(password1.current && password2.current && password1.current?.value==password2.current?.value){
            setError1(false);
            if(password1.current?.value.length<6){
                setError2(true);
            }
            else{
                setError2(false);
                if(password1.current?.value.match(/[a-z]/)) setError3(false);
                else setError3(true);
                if(password1.current?.value.match(/[A-Z]/)) setError4(false);
                else setError4(true);
                if(password1.current?.value.match(/[0-9]/)) setError5(false);
                else setError5(true);
                if(password1.current?.value.match(/[^a-zA-Z0-9]/)) setError6(false);
                else setError6(true);
            }
            if(!error1 && !error2 && !error3 && !error4 && !error5 && !error6){
                axios.post('/api/auth/create-user',{
                    firstName: props.firstName,
                    lastName: props.lastName,
                    email: props.email,
                    password: password1.current?.value
                }).then((response)=>{
                    console.log(response.data);
                    router.push('/pages/login');
                }).catch((error)=>{
                    console.log(error.message);
                })
            }
        }
    }

    useEffect(()=>{
        const interval=setInterval(()=>{
            setLeftTime((prev)=>prev-1);
        },1000);
        return ()=>clearInterval(interval);
    },[updateTime]);

    return <div className="fixed flex flex-col items-center justify-center z-50 p-8 bg-gray-100 shadow-lg rounded-lg border border-gray-300">
    {otpVerified ?
        <div className="fixed flex flex-col items-center justify-center z-50 gap-2 bg-gray-100 p-5 shadow-lg rounded-lg border border-gray-300 w-80">
            <p className="text-lg font-semibold text-black">OTP Verified, Set Password </p>
            <p className="text-xs text-red-500 font-semibold text-wrap">Password should be atleast 6-character long and combination of a-z,A-Z,0-9 and special characters</p>
            <div className="flex flex-col gap-3 p-2 px-5 justify-center items-center">
                <Input ref={password1} type="password" placeholder="Enter Password" />
                <Input ref={password2} type="password" placeholder="Confirm Password" />
            </div>
            {error1 && <p className="text-red-500 text-xs">both password doesn't match, please check again</p>}
            {error2 && <p className="text-red-500 text-xs">password length should be atleast 6</p>}
            {(error3 || error4 || error5 || error6) && (
                <p className="text-red-500 text-xs">
                    Password should contain at least one character from 
                    {error3 && ', a-z'}
                    {error4 && ', A-Z'}
                    {error5 && ', 0-9'}
                    {error6 && ', special character'}
                </p>
            )}
            <button onClick={create} className="bg-gray-700 rounded px-3 py-1" type="submit">Sign Up</button>
        </div>
            :
        <div className="fixed flex flex-col items-center justify-center z-50 bg-white p-8 shadow-lg rounded-lg border border-gray-300">
                <p className="text-lg font-semibold text-black">Please enter the OTP that has send to your email</p>
                <div className="flex gap-2 p-2 px-5">
                    {otpRef.map((ref, index) => <Box key={index} ref={ref} onChange={shiftRef} onKeyDown={handle}/>)}
                </div>
                <div className="flex w-full justify-around items-center ">
                    {leftTime>=0 ? 
                        <div className="flex text-sm text-gray-700 gap-2 font-semibold ">
                            <p>Resend OTP in</p>
                            <p className="text-red-400">{leftTime}</p> 
                            <p>seconds.</p>       
                        </div>:
                        <p onClick={resend} className="text-blue-500 text-sm hover:cursor-pointer">Resend OTP</p>
                    }
                    <p onClick={verify} className="text-blue-500 text-sm hover:cursor-pointer">Verify</p>    
                </div>
        </div>
    }
    </div>
}

interface boxProps{
    ref: React.RefObject<HTMLInputElement | null>
    onChange : (e: React.FormEvent<HTMLInputElement>)=>void
    onKeyDown : (e : React.KeyboardEvent<HTMLInputElement>)=>void
}
function Box(props : boxProps) {
    return <input ref={props.ref} onChange={props.onChange} onKeyDown={props.onKeyDown} className="text-center bg-gray-500 h-8 w-8 border rounded-lg shadow-sm"></input>
}

interface inputProps{
    type : string,
    placeholder : string,
    ref : React.RefObject<HTMLInputElement | null>
}
function Input(props : inputProps) {
    return <div className="flex gap-1">
        <input ref={props.ref} type={props.type} placeholder={props.placeholder} className="border-b-2 border-b-gray-600 outline-none bg-gray-100 text-center text-black "/>
    </div>
}