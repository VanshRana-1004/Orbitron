import {create} from 'zustand';

interface Video{
    slug : string,
    clips : {url: string,roomId: string,clipNum: string,public_id: string}[]
}

interface CurrentVideoState{
    video : Video | null,
    setVideo : (video : Video)=>void
}

export const useCurrentVideoStore=create<CurrentVideoState>((set)=>({
    video:null,
    setVideo : (video)=>set({video}),
}))