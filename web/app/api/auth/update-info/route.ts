import { encode,getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { prismaClient } from 'database';
import { NextResponse } from "next/server";
import * as jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME!,
  api_key: process.env.NEXT_PUBLIC_CLOUD_API_KEY!,
  api_secret: process.env.NEXT_PUBLIC_CLOUD_SECRET!,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req : Request){
    const formData = await req.formData();
    const fn = formData.get("fn") as string;
    const ln = formData.get("ln") as string;
    const id = formData.get("id") as string;
    const file = formData.get("file") as File | null;
    let imageUrl = null;
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageUrl = await new Promise<string | null>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: "image" },
          (err: any, result: any) => {
            if (err) return reject(err);
            resolve(result?.secure_url ?? null);
          }
        );
        uploadStream.end(buffer);
      });
    }
    try{
        const updatedUser=await prismaClient.user.update({
            where :{
                id : Number(id),
            },
            data :{
                firstName : fn,
                lastName : ln,
                ...(imageUrl ? { profileImage: imageUrl } : {}),
            }
        })

        const cookieStore =await cookies();

        const nextAuthToken = await getToken({
            req: req as any,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (nextAuthToken) {
            nextAuthToken.firstName = fn;
            nextAuthToken.lastName = ln;
            nextAuthToken.picture=imageUrl;

            const newNextAuthToken = await encode({
                token: nextAuthToken,
                secret: process.env.NEXTAUTH_SECRET as string,
            });

            cookieStore.set("next-auth.session-token", newNextAuthToken, {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
            });
        }

        const customToken = cookieStore.get("token")?.value;

        if (customToken) {
            const newCustomToken = jwt.sign(
                {
                    id: updatedUser.id,
                    firstName: fn,
                    lastName: ln,
                    image: updatedUser.profileImage || "",
                    email: updatedUser.email,
                },
                process.env.JWT_SECRET as string,
                { expiresIn: "7d" }
            );

            cookieStore.set("token", newCustomToken, {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
            });
        }

        return NextResponse.json({message: "Profile updated and session(s) refreshed",imageUrl },{status:200});

    }
    catch(e){
        return NextResponse.json({message : `error while updating user's profile info`}, {status:500})
    }
}