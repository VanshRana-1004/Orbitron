import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUD_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUD_SECRET,
});
export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const timeStamp = formData.get("timeStamp") as string | null;
    const roomId = formData.get("roomId") as string | null;
    const userId = formData.get("id") as string | null;
    const callName = formData.get("callName") as string | null;
    const count=formData.get("mediaCount") as string | null;
    const type = formData.get("type") as string | null;
    if (!file || !timeStamp) return new Response("Missing file or timeStamp", { status: 400 });
    console.log("Upload request received, Blob size:", file.size,"; TimeStamp:", timeStamp);
    if(file.size<0) return new Response("File size is zero", { status: 200 });
    const buffer = Buffer.from(await file.arrayBuffer());
    try{
        const uploadResult=await new Promise((resolve,reject)=>{
            const uploadStream=cloudinary.uploader.upload_stream({
                resource_type:"auto",
                folder:"recordings",
                public_id:`clip-${timeStamp}-${Date.now()}`,
                context: `userId=${userId}|roomId=${roomId}|callName=${callName}|type=${type}|timeStamp=${timeStamp}`,
            },(error,result)=>{
                if(error) return reject(error)
                resolve(result);
            })
            const stream=require("stream");
            const readable=new stream.PassThrough();
            readable.end(buffer);
            readable.pipe(uploadStream);
        })
        return new Response(JSON.stringify({ message: "Uploaded", data: uploadResult }), {
            status: 200,
        });
    }catch(e){
        console.error("Cloudinary upload error:", e);
        return new Response("Upload failed", { status: 500 });
    }
}