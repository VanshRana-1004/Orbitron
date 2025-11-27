import { NextResponse,NextRequest } from "next/server";
import { prismaClient } from "database";

export async function POST(req : NextRequest){
    try{
        const {callId,userId}=await req.json();
        console.log('making user entry in (callID) : ',callId );
        const call=await prismaClient.call.findFirst({
            where : {
                callingId : callId
            }
        })
        if(call){
            const callSlug=call.slug;
            console.log('making user entry in (callSlug) : ',callSlug );
            console.log('userId : ',userId);
            const findUser=await prismaClient.callUserTime.findFirst({
                where : {
                    userId : Number(userId),
                    callId : Number(callId)
                }
            })
            if(!findUser){
                const user=await prismaClient.callUserTime.create({
                    data : {
                        user : { connect : {id : Number(userId)}},
                        call : { connect : {id : Number(call.id)}},
                        joinedAt : new Date()
                    }
                })
                if(user){
                    console.log('time when user joined the call created');
                    return NextResponse.json({
                        message: 'call joined',
                        slug: callSlug,
                        callingId:callId,
                        userId 
                    },{status : 200});
                }
                else{
                    console.log('time when user joined the call created');
                    return NextResponse.json({
                        message: 'call joined again',
                        slug: callSlug,
                        callingId:callId,
                    },{status : 200});   
                }
            }
        }
        else{
            console.log('failed to make user entry in db');
            return NextResponse.json({message : 'failed to make user entry in db'},{status:401})
        }
    }catch(e){
        console.log('failed to make user entry in db');
        return NextResponse.json({message : 'failed to make user entry in db'},{status:401})
    }
    return NextResponse.json({message:'Unhandled case reached.'},{status : 500})
}