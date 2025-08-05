import { NextRequest,NextResponse } from "next/server";
import { prismaClient } from "@repo/database/client";

export async function POST(req : NextRequest) {
    const {userId,slug,date,time}=await req.json();
    console.log(userId);
    console.log(slug);
    console.log(date);
    console.log(time);
    try{
        const res=await prismaClient.scheduledCalls.create({
            data:{
                userId,
                slug,
                date,
                time
            }
        }) 
        console.log(res);
        return NextResponse.json({message:'Call Scheduled Successfully'},{status : 200})
    }catch(e){
        return NextResponse.json({message:'unknown error while scheduling call'},{status : 500})
    }
}