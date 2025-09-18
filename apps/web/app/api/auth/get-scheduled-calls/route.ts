import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@repo/database/client";

export async function GET(req : NextRequest){
    
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get("userId"));
  console.log('userId : ',userId);
  try{
    const res=await prismaClient.scheduledCalls.findMany({
      where :{
        userId 
      }
    }) 
    console.log(res);
    return NextResponse.json({message : 'scheduled calls retrieved successfully',res : res}, {status : 200});
  }
  catch(e){
    console.log(e);
    return NextResponse.json({message : 'error while retrieving scheduled calls'}, {status : 500});
  }
}