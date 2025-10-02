import { NextResponse } from 'next/server';
import { signupType } from '../../../utils/zodtypes';
import { prismaClient } from 'database';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
const jwt_secret=process.env.JWT_SECRET as string;
import { getAuthCookie } from '../../../lib/set-auth-cookie';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('signup');
    console.log(body);
    const parsedBody = signupType.safeParse(body);
    if (!parsedBody.success) { 
      const errors: { path: string | number; message: string }[] = [];
      for (const error of parsedBody.error.errors) {
        errors.push({ path: error.path[0] ?? 'unknown', message: error.message });
      }
      return NextResponse.json({ errors }, { status: 400 });
    }

    try{
      const existingUser = await prismaClient.user.findFirst({
        where: {
          email: body.email,
        },
      });
      if (existingUser) {
        return NextResponse.json({ message: 'User already exists' }, { status: 403 });
      }
    }catch(e){
      console.log(e);
      return NextResponse.json({ message: 'Error checking user existence' }, { status: 500 });
    } 

    try {
      const newPassword=await bcrypt.hash(body.password,10);
      const response=await prismaClient.user.create({
        data:{
          firstName:body.firstName,
          lastName:body.lastName,
          email:body.email,
          password:newPassword,
          oauth:false,
        }
      })
      if(!response){
          console.log("User not created");
          return NextResponse.json({message:"User not created"}, {status:401});
      }
      else{
          console.log("User created successfully");
          const token = jwt.sign({ id: response.id, firstName: response.firstName, lastName:response.lastName, image:'', email:response.email }, jwt_secret, {expiresIn: '7d'});
          const res = NextResponse.json({ message: 'Login successful' });
          res.headers.set('Set-Cookie', getAuthCookie(token));
          return res;
      }
    } catch (error) {
      console.error(error);
      return NextResponse.json({error:"Internal Server Error"}, {status:500});
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}