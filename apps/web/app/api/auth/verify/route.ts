import { NextResponse } from 'next/server';
import { prismaClient } from '@repo/database/client';

export async function POST(req: Request) {
    try{
        const body=await req.json();
        console.log(body);    
        const response=await prismaClient.otps.findFirst({
            where:{
                email:body.email,
            }
        })
        if(!response){
            console.log("OTP not found");
            return NextResponse.json({message:"OTP not found"}, {status:400});
        }
        else{
            if(response.otp!=body.otp){
                console.log("Invalid OTP");
                return NextResponse.json({message:"Invalid OTP"}, {status:400});
            }
            else if(response.otp==body.otp){
                console.log("OTP Verified");
                return NextResponse.json({message:"OTP Verified"}, {status:200}); 
            }
        }
    }catch(e){
        console.log(e);
        return NextResponse.json({error:"Internal Server Error"}, {status:500});
    }   
    return NextResponse.json({message:"OTP Verified"}, {status:200}); 
}