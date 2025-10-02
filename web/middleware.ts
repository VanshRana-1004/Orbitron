import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function middleware(req: NextRequest) {
  console.log("Middleware triggered on:", req.nextUrl.pathname);
  const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const cookieToken = req.cookies.get('token')?.value;
  console.log("next-auth token:", nextAuthToken ? 'Present' : 'Missing');
  console.log("custom cookie token:", cookieToken ? 'Present' : 'Missing');
  if (nextAuthToken) {
    return NextResponse.next();
  }

  if (cookieToken) {
    try {
      return NextResponse.next();
    } catch (e) {
      console.error("Invalid custom JWT:", e);
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/pages/calling/:path*'], 
};
