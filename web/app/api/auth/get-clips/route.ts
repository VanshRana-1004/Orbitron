import { v2 as cloudinary } from 'cloudinary';
import { prismaClient } from 'database';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME!,
  api_key: process.env.NEXT_PUBLIC_CLOUD_API_KEY!,
  api_secret: process.env.NEXT_PUBLIC_CLOUD_SECRET!,
});

async function getClipsByUserId(userId: string) {
  const userWithCalls = await prismaClient.user.findUnique({
    where: { id: Number(userId) },
    include: {
      calls: true
    },
  });
  console.log(userWithCalls) 

  if (!userWithCalls) return [];

  const finalResult: {
    callId: string;
    slug : string; 
    recorded: boolean;
    date : string;
    time : string;
    peers : {
      img : string;
      name : string;
      email : string
    }[]; 
    clips: {
      url: string;
      roomId: string;
      clipNum: string;
      public_id: string;
    }[];
  }[] = [];

  for (const call of userWithCalls.calls) {
    console.log(call.slug)
    let clips: {
      url: string;
      roomId: string;
      clipNum: string;
      public_id: string;
    }[] = [];

    if (call.recorded===true) {
      console.log('callingId of recorded call', call.callingId);
      const result = await cloudinary.search
        .expression(`folder:"recordings/${call.callingId}"`)
        .sort_by('created_at', 'asc')
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

      clips = (result.resources as ClipResource[]).map((clip: ClipResource): Clip => {
        const context = clip.context?.custom || {};
        return {
          url: clip.secure_url,
          roomId: String(context.roomId),
          clipNum: String(context.clipNum),
          public_id: String(clip.public_id),
        };
      });
      
      const res=await prismaClient.call.findFirst({
        where : {
          id : Number(call.id)
        },
        include :{
          callUserTimes : {
            include : {
              user : true
            }
          }
        }
      })
      
      const peers : {img : string, name : string, email : string}[]=[];
      if (res?.callUserTimes) {
        for (const cut of res.callUserTimes) {
          if (cut.user) {
            peers.push({
              img: cut.user.profileImage ?? '',
              name: cut.user.firstName+' '+cut.user.lastName,
              email: cut.user.email,
            });
          }
        }
      }
      
      console.log('[peers data] : ',peers);

      finalResult.push({
        callId: call.callingId,
        date : call.date,
        time : call.startTime,
        slug : call.slug,
        recorded: call.recorded,
        peers,  
        clips,
      });
    }
  }

  return finalResult;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  console.log('Fetching clips for userId:', userId);

  if (!userId) {
    return Response.json({ error: 'Missing userId' }, { status: 400 });
  }

  const clips = await getClipsByUserId(userId);
  return Response.json(clips);
}
