import {create} from 'zustand';

interface User{
    firstName : string,
    lastName : string,
    email : string,
    img : string
}

interface Call{
    slug: string; 
    callingId: string; 
    peers: string,
    date : string,
    time : string,
    recorded : boolean,
    users : User[]   
}

interface StoredCall{
    previousCalls : Call[],
    setPreviousCalls : (call : Call[])=>void,
}

export const useCallStore = create<StoredCall>((set)=>({
    previousCalls : [],
    setPreviousCalls: (calls : Call[])=>set({previousCalls:calls})
}))