import {create} from 'zustand';

interface User{
    firstName : string,
    lastName : string,
    email : string,
    img : string,
    id : string
}

interface UserInfo{
    info : User,
    setInfo : (info : User)=> void
}

export const useUserInfo=create<UserInfo>((set)=>({
    info : {firstName : '', lastName : '', email : '', img : '', id : ''},
    setInfo : (info : User)=>set({info : info})
}))