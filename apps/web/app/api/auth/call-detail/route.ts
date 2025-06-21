import { prismaClient } from "@repo/database/client" 
import { NextResponse } from "next/server";

export async function POST(req : Request){
    const {callingId}=await req.json();
    console.log(callingId);
    try{
        const response=await prismaClient.call.findFirst({
            where : {
                callingId : callingId
            }
        })
        if(response){
            console.log('Details of call from the database fetched successfully');
            console.log(response);
            return NextResponse.json({message:'Details of call from the database fetched successfully',callSlug:response.slug},{status:200})
        }
        else{
            console.log('No Call details found');
            return NextResponse.json({message : 'No Call details found'},{status:404})
        }
    }catch(e){
        console.log('Error in fetching details from database')
        return NextResponse.json({message : 'Error in fetching details from database'},{status:403})
    }
} 