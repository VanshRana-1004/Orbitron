import { prismaClient } from "@repo/database/client" 
import { NextResponse } from "next/server";

export async function POST(req : Request){
    const {callid}=await req.json();
    console.log(callid);
    try{
        const response=await prismaClient.call.findFirst({
            where : {
                callingId : callid
            }
        })
        if(response){
            try{
                const response2=await prismaClient.call.update({
                    where : {
                        id : response.id
                    },
                    data :{
                        recorded : true
                    }
                })
                return NextResponse.json({message : 'recording set successfully'},{status:200})
            }catch(e){
                return NextResponse.json({message : 'error in setting up recording'},{status:403})
            }
        }
    }catch(e){
        return NextResponse.json({message : 'error in setting up recording'},{status:403})
    } 
}