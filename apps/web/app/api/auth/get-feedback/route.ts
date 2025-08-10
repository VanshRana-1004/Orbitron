import { prismaClient } from "@repo/database/client" 
import { NextResponse } from "next/server";

interface FB{
    img : string,
    comment : string,
    name : string
}

export async function GET(req : Request){
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page"));
    const take = 20;
    const skip = page * 5
    try{    
        const reviews = await prismaClient.feedback.findMany({
            skip,
            take,
            orderBy: {
                id: 'desc'
            }
        });
        const response : FB[]=[];
        reviews.map((x,ind)=>{
            response.push({name : x.name, img : x.img, comment : x.comment})
        })
        return NextResponse.json({message : 'successfully fetched feedbacks', res : response},{'status' : 200})
    }catch(e){
        console.log(e);
        return NextResponse.json({message : 'error in fetching feedbacks'},{'status' : 500})
    }
}