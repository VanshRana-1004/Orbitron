import { prismaClient } from 'database';
import { NextResponse } from 'next/server';
export async function GET(req : Request){
    const { searchParams } = new URL(req.url);
    try{
        const id = searchParams.get("id")
        if(!id) return NextResponse.json({message: 'No user id provided'}, {status: 400});
        const user=await prismaClient.user.findUnique({
            where: { id : Number(id) },
        })
        console.log(user);
        return NextResponse.json({user}, {status: 200});
    }
    catch(e){
        return NextResponse.json({message: 'Error fetching user info'}, {status: 500});
    }
}