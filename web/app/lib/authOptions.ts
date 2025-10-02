import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prismaClient } from 'database';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
    };
  }
  interface User {
    id: string;
    name: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  }
}

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
    async jwt({ token, user, account, profile } : any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        const dbUser = await prismaClient.user.findUnique({
          where: { email: user.email! },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
        }
      } 
      else if (account?.provider === "google" && token.email && !token.id) {
        const dbUser = await prismaClient.user.findUnique({
          where: { email: token.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
        }
      }
      return token;
    },

    async session({ session, token } : any ) {
      console.log(token);
      if (token && session.user) {
        session.user.id = token.id ? String(token.id) : "";
        session.user.email = token.email || "";
        session.user.name = token.name || "";
        session.user.firstName = typeof token.firstName === "string" ? token.firstName : null;
        session.user.lastName = typeof token.lastName === "string" ? token.lastName : null;
      }
      return session;
    },

    async signIn({ account, profile } : any) {
      const email = profile?.email;

      try {
        if(!email) return false;
        const existingUser = await prismaClient.user.findUnique({
          where: { email },
        });

        if (existingUser && existingUser.oauth===false) {
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

          },
        });

        return true;

      } catch (err) {
        console.error("DB error in signIn callback:", err);
        throw new Error("DatabaseUnavailable");
      }
    }

  },
  pages: {
    error: "/login", 
    signIn: "/login"
  },
  session: {
    strategy: "jwt",
  },
};
