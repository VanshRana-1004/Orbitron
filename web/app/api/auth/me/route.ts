import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "app/lib/authOptions";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET() {
  const session = await getServerSession(authOptions);
  const cookieStore =await cookies();
  const token = cookieStore.get("token")?.value;
  let user;

  if (!session && !token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  if (session) {
    user = session.user;
    return NextResponse.json({ user },{status: 200});
  }

  if (token) {
    try {
      user = jwt.verify(token, JWT_SECRET);
      return NextResponse.json({ user },{status: 200});
    } catch (e) {
      console.error("Token decode failed:", e);
      return NextResponse.json({ user: null }, { status: 401 });
    }
  }

  return NextResponse.json({ user: null }, { status: 401 });
}
