import { v2 as cloudinary } from 'cloudinary';
import { prismaClient } from '@repo/database/client';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME!,
  api_key: process.env.NEXT_PUBLIC_CLOUD_API_KEY!,
  api_secret: process.env.NEXT_PUBLIC_CLOUD_SECRET!,
});
 
export async function GET(req : Request){
    const { searchParams }=new URL(req.url);
    const roomId = searchParams.get('roomId');
    console.log('fetching clips for roomId ',roomId);
    if(!roomId){
        return Response.json({ error: 'Missing roomId' }, { status: 400 });
    }
    
    const result=await cloudinary.search
    .expression(`folder:recordings AND context.roomId=${roomId}`)
    .sort_by('created_at','asc')
    .max_results(100)
    .execute();

    interface ClipResource {
        secure_url: string;
        public_id: string;
        context?: {
          custom?: {
            roomId?: string | number;
            clipNum?: string | number;
            [key: string]: unknown;
          };
          [key: string]: unknown;
        };
        [key: string]: unknown;
    }

    interface Clip {
        url: string;
        roomId: string;
        clipNum: string;
        public_id: string;
    }

    let clips : {
        url: string;
        roomId: string;
        clipNum: string;
        public_id: string;
    }[] = (result.resources as ClipResource[]).map((clip : ClipResource) => {
        const context = clip.context?.custom || {};
        return {
          url: clip.secure_url,
          roomId: String(context.roomId),
          clipNum: String(context.clipNum),
          public_id: String(clip.public_id),
        };
    });

    await prismaClient.call.update({
      where :{
        id : Number(roomId)
      },
      data : {
        recorded : true
      }
    }).then((res)=>{
      console.log('processing done for room ',roomId);
    })

    return Response.json({roomId,recorded:true,clips});
}