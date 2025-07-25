import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prismaClient } from '@repo/database/client';

const GOOGLE_CLIENT_SECRET = process.env.NEXT_GOOGLE_CLIENT_SECRET!;
const GOOGLE_CLIENT_ID = process.env.NEXT_GOOGLE_CLIENT_ID!;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks:{
    
    async signIn({ account, profile }) {
      const email = profile?.email;

      try {
        if(!email) return false;
        const existingUser = await prismaClient.user.findUnique({
          where: { email },
        });

        if (existingUser && !existingUser.oauth) {
          console.warn(`OAuth blocked: ${email} already registered with password.`);
          return false; 
        }

        const [firstName = '', ...rest] = (profile?.name ?? '').split(/\s+/);
        const lastName = rest.join(' ');

        await prismaClient.user.upsert({
          where: { email },
          create: {
            email,
            firstName,
            lastName,
            oauth: true,
          },
          update: {
            firstName,
            lastName,
          },
        });

        return true;

      } catch (err) {
        console.error("DB error in signIn callback:", err);
        return false;
      }
    }

  },
  pages: {
    error: "/pages/login", 
  },
  session: {
    strategy: "jwt",
  },
};
