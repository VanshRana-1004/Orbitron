import { NextResponse } from "next/server";
import { prismaClient } from "@repo/database/client";

export async function POST(req : Request){
    const {roomId}=await req.json();
    try{
        const res=await prismaClient.call.findFirst({
            where : {
                callingId : roomId 
            }
        })
        if(res){
            await prismaClient.call.update({
                where : {
                    id : res.id
                },
                data : {
                    ended : true
                }
            })
            return NextResponse.json({message : 'marked call ended successfully.'},{status : 200})
        }
        else{
            return NextResponse.json({message : 'error while marking call ended.'},{status : 500})
        }
    }
    catch{
        return NextResponse.json({message : 'error while marking call ended.'},{status : 500})
    }
}