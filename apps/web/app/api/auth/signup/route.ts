import { NextResponse } from 'next/server';
import { signupType } from '../../../zodtypes';
import nodemailer from 'nodemailer';
import { prismaClient } from '@repo/database/client';

function generateOTP() {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) otp += digits[Math.floor(Math.random() * 10)];
  return otp;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_HOST,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
        return NextResponse.json({ message: 'User already exists' }, { status: 400 });
      }
    }catch(e){
      console.log(e);
      return NextResponse.json({ message: 'Error checking user existence' }, { status: 500 });
    } 

    try {
      const otpCode: string = generateOTP();
      const existingOtp = await prismaClient.otps.findFirst({
        where: {
          email: body.email,
        },
      });

      if (existingOtp) {
        await prismaClient.otps.update({
          where: {
            email: body.email,
          },
          data: {
            otp: otpCode,
          },
        });
      } else {
        await prismaClient.otps.create({
          data: {
            email: body.email,
            otp: otpCode,
          },
        });
      }

      const response = await transporter.sendMail({
        from: process.env.EMAIL_HOST,
        to: body.email,
        subject: `OTP for signing up - ${new Date().toLocaleTimeString()}`,
        text: `Your OTP for signup is ${otpCode}.`,
      });

      return NextResponse.json({ message: 'OTP sent' });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ message: 'Error sending OTP email' }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}