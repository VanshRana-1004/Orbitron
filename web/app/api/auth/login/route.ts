import { NextResponse } from 'next/server';
import { signinType } from '../../../utils/zodtypes';
import { prismaClient } from 'database';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { getAuthCookie } from '../../../lib/set-auth-cookie';

const jwt_secret=process.env.JWT_SECRET as string;
export async function POST(req: Request) {
    const body = await req.json();
    const parsedBody = signinType.safeParse(body);
    if(!parsedBody.success) {
        console.log(parsedBody);
        const errors: { path: string | number, message: string }[] = [];
        for(const error of parsedBody.error.errors) {
            errors.push({ path: error.path[0] ?? 'unknown', message: error.message });
        }
        console.log(errors);
        return NextResponse.json({ errors: errors }, { status: 400 });
    }
    const response=await prismaClient.user.findFirst({
        where:{
            email: parsedBody.data.email
        }
    })
    if(!response) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    if(response.oauth){
        return NextResponse.json({ message: 'User logged with google credentials' }, { status: 403 });
    }
    if(response.password){
        const isPasswordValid = await bcrypt.compare(parsedBody.data.password, response.password);
        if (!isPasswordValid) {
            return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
        }
    }
    
    const token = jwt.sign({ id: response.id, firstName: response.firstName, lastName:response.lastName, email:response.email}, jwt_secret, {expiresIn: '7d'});
    const res = NextResponse.json({ message: 'Login successful' });
    res.headers.set('Set-Cookie', getAuthCookie(token));
    return res;
}