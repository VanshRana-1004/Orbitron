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
    async signIn({account,profile}){
        const email=profile?.email;
        const existingUser = await prismaClient.user.findUnique({
            where: { email },
        });
        if (existingUser && !existingUser.oauth) {
            console.warn(`OAuth blocked: ${email} already registered with password.`);
            return false;
        }
        let firstName='';   
        let lastName='';
        if(profile?.name){
            const parts = profile.name.trim().split(/\s+/); 
            firstName = parts[0] ?? '';
            lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
        }
        console.log(profile);
        console.log(firstName)
        console.log(lastName);
        const res=await prismaClient.user.upsert({
            where:{
                email : profile?.email
            },
            create:{
                email:profile?.email || '',
                firstName:firstName,
                lastName:lastName,
                oauth:true,
            },
            update:{
                firstName:firstName,
                lastName:lastName,
            }
        })
        console.log(res);
        return true;
    }
  }
};
