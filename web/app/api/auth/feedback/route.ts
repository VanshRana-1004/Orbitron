import { prismaClient } from 'database';
import { NextResponse } from "next/server";

export async function POST(req : Request){
    const {id,fb,name,img,email}=await req.json();
    console.log(id);
    console.log(fb);
    console.log(name);
    console.log(img);
    console.log(email);
    try{
        await prismaClient.feedback.create({
            data:{
                userId : Number(id),
                email : email,
                img : img,
                comment : fb,
                name : name
            }
        })
        return NextResponse.json({message : 'feedback submitted successfully.'},{status : 200});
    }catch(e){
        console.log(e);
        return NextResponse.json({message : 'error in submitting feedback.'},{status : 500});
    }
} 