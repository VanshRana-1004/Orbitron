import { NextResponse,NextRequest } from "next/server";
import { prismaClient } from 'database';

export async function POST(req: NextRequest) {
    
    try{

        const {callId, userId}=await req.json();
        console.log('joining room with callId : ',callId);
        
        const call=await prismaClient.call.findFirst({
            where :{
                callingId : callId
            }
        })
        if(call){
            const callSlug=call.slug;
            console.log('time when user joined the call created');
                return NextResponse.json({
                    message: 'call joined again',
                    slug: callSlug,
                    callingId:callId,
                },{status : 200});
        }
        else{
            console.log('user failed to join a call room');
            return NextResponse.json({message : 'error in joining a call room'},{status:401})
        }
        
    }catch(e){
        console.log(e);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }

}