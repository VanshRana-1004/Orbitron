import { NextResponse,NextRequest } from "next/server";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prismaClient } from 'database';
import { getToken } from "next-auth/jwt";

const jwt_secret=process.env.JWT_SECRET; 
const nextauth_secret = process.env.NEXTAUTH_SECRET!;

export async function POST(req: NextRequest) {
    
    try{
        const nextAuthToken = await getToken({ req, secret: nextauth_secret });

        if (!nextAuthToken || !nextAuthToken.sub) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        let userId : number | null=null; 
        let userName : string | null=null;
        if (nextAuthToken) {
            const email = nextAuthToken.email;
            if (typeof email !== "string") {
                return NextResponse.json({ message: 'Invalid email' }, { status: 400 });
            }
            const user = await prismaClient.user.findUnique({ where: { email } });
            if (!user) {
                return NextResponse.json({ message: 'User not found' }, { status: 404 });
            }
            userId = user.id;
            userName = user.firstName+ ' ' + user.lastName; 
        }
        else {
            const token = req.cookies.get("token")?.value;
            if (!token) {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
            }
        
            try {
                if (!jwt_secret) {
                    return NextResponse.json({ message: 'JWT secret not configured' }, { status: 500 });
                }
                const decoded = jwt.verify(token, jwt_secret) as JwtPayload;
                userId = Number(decoded.id);
                userName = `${decoded.firstName} ${decoded.lastName}`;
            } catch (err) {
                console.error("Invalid token:", err);
                return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
            }
        }

        const {callId}=await req.json();
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
                        userName:userName,
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
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({message:'Unhandled case reached.'},{status : 500})
}