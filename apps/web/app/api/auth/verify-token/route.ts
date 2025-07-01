import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const jwt_secret = process.env.JWT_SECRET as string;

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized: Missing token' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1] as string;
  try {
    const decoded = jwt.verify(token, jwt_secret) as { id: string, firstName?: string, lastName?: string };

    return NextResponse.json({
      valid: true,
      id: decoded.id,
      firstName: decoded.firstName,
      lastName: decoded.lastName
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 });
  }
}
