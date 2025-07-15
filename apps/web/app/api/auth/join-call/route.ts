import { NextResponse } from "next/server";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prismaClient } from "@repo/database/client";

const jwt_secret=process.env.JWT_SECRET; 

declare global {
    interface Request {
        userId?: string;
    }
}

export async function POST(req:Request){
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1] as string;
    let userName="";
    console.log('token from middleware:', token);
    console.log('jwt_secret : ',jwt_secret);
    
    try{
        const decoded = jwt.verify(token,jwt_secret as string) as JwtPayload;
        console.log('decoded : ',decoded);
        req.userId=decoded?.id;
        userName=decoded?.firstName+' '+decoded?.lastName;
    }
    catch(e){
        console.log(e);
        return NextResponse.json({message : 'token is invalid'}, {status : 401});
    }
    
    try{
        const {callId}=await req.json();
        console.log('joining room with callId : ',callId);
        const userId=Number(req.userId); 
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
                    userId : userId ,
                    callId : response1.id  
                }
            })
            if(!response2){
                const response3=await prismaClient.callUserTime.create({
                data: {
                        user: { connect: { id: userId } },
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
                        userName:userName 
                    },{status : 200});
                }
            }
            else{
                console.log('time when user joined the call created');
                    return NextResponse.json({
                        message: 'call joined again',
                        slug: callSlug,
                        callingId:callId,
                        userName:userName 
                    },{status : 200});
            }
            
        }
        else{
            console.log('user failed to join a call room');
            return NextResponse.json({message : 'error in joining a call room'},{status:401})
        }
        
    }catch(e){
        console.log(e);
    }

    return NextResponse.json({message:'reached join-call route'},{status : 200})
}
