import { NextResponse,NextRequest } from "next/server";
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { randomUUID } from "crypto";
import { getToken } from "next-auth/jwt";
import { prismaClient } from 'database';

const jwt_secret=process.env.JWT_SECRET; 
const nextauth_secret = process.env.NEXTAUTH_SECRET!;


export async function POST(req: NextRequest) {
    const now = new Date();

    const formattedDate = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    try{
        const {callSlug}=await req.json();
        console.log('creating room with callSlug : ',callSlug);

        const nextAuthToken = await getToken({ req, secret: nextauth_secret });

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

        if (!userId) {
            return NextResponse.json({ message: 'Invalid user' }, { status: 401 });
        }
        
        const callingId = randomUUID();

        const response1=await prismaClient.call.create({
            data:{
                slug : callSlug,
                callingId : callingId as string,
                users : {
                    connect :{
                        id : Number(userId)
                    }
                },
                date : formattedDate,
                startTime : formattedTime,
                recorded : false,
                ended : false,
            }
        })
        if(response1){
            return NextResponse.json({
                message: 'call created',
                slug: callSlug,
                callingId:callingId,
                userName: userName,
                userId
            },{status : 200});
        }
        else{
            console.log('user failed to create a call room');
            return NextResponse.json({message : 'error in creating a call room'},{status:401})
        }
        
    }catch(e){
        console.log(e);
    }

    return NextResponse.json({message:'reached create-call route'},{status : 200})
}
