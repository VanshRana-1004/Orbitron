import { NextResponse } from 'next/server';
import { prismaClient } from '@repo/database/client';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
    try{
        const body=await req.json();
        console.log(body);    
        const newpassword=await bcrypt.hash(body.password, 10);
        const response=await prismaClient.user.create({
            data:{
                firstName:body.firstName,
                lastName:body.lastName,
                email:body.email,
                password:newpassword
            }
        })
        if(!response){
            console.log("User not created");
            return NextResponse.json({message:"User not created"}, {status:400});
        }
        else{
            console.log("User created successfully");
            return NextResponse.json({message:"User created successfully"}, {status:200}); 
        }
    }catch(e){
        console.log(e);
        return NextResponse.json({error:"Internal Server Error"}, {status:500});
    }
}