import { NextResponse,NextRequest } from "next/server";
import { prismaClient } from 'database';

export async function POST(req: NextRequest) {
    
    try{

        const {callId, userId}=await req.json();
        console.log('joining room with callId : ',callId);
        
        const response1=await prismaClient.call.findFirst({
            where :{
                callingId : callId
            }
        })
        if(response1){
            console.log('joining a room');
            const callSlug=response1.slug;
            const response2=await prismaClient.callUserTime.findFirst({
                where:{
                    userId : Number(userId) ,
                    callId : response1.id  
                }
            })
            if(!response2){
                const response3=await prismaClient.callUserTime.create({
                data: {
                        user: { connect: { id: Number(userId) } },
                        call: { connect: { id: response1.id } },
                        joinedAt: new Date(),
                    },
                });
                if(response3){
                    console.log('time when user joined the call created');
                    return NextResponse.json({
                        message: 'call joined',
                        slug: callSlug,
                        callingId:callId,
                        userId 
                    },{status : 200});
                }
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
        else{
            console.log('user failed to join a call room');
            return NextResponse.json({message : 'error in joining a call room'},{status:401})
        }
        
    }catch(e){
        console.log(e);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({message:'Unhandled case reached.'},{status : 500})
}