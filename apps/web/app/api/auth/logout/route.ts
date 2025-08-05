import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

export async function POST(req : Request) {
    const response = NextResponse.json({ success: true }, { status: 200 });

    response.headers.set(
        'Set-Cookie',
            serialize('token', '', {
            path: '/',
            expires: new Date(0),
            httpOnly: true,
            sameSite: 'lax',
        })
    );

    return response;
}