import { v2 as cloudinary } from 'cloudinary';
import { prismaClient } from 'database';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME!,
  api_key: process.env.NEXT_PUBLIC_CLOUD_API_KEY!,
  api_secret: process.env.NEXT_PUBLIC_CLOUD_SECRET!,
});

interface RequestBody {
  userId: number;
  callIds: string[];
}

async function getClipsByUserId(userId: string, existingCallIds: string[]) {
  const attendedCalls = await prismaClient.user.findUnique({
    where: { id: Number(userId) },
    include: {
      callUserTimes : true 
    },
  });
  console.log(attendedCalls)

  if (!attendedCalls) return [];

  const finalResult: {
    callId: string;
    slug: string;
    recorded: boolean;
    date: string;
    time: string;
    peers: {
      img: string;
      name: string;
      email: string
    }[];
    clips: {
      url: string;
      roomId: string;
      clipNum: string;
      public_id: string;
    }[];
  }[] = [];

  const callIds = attendedCalls.callUserTimes.map((c) => c.callId);
  
  const calls = await prismaClient.call.findMany({
    where: {
      id: {
        in: callIds,
      },
    },
  });

  console.log(calls);

  const newCalls = calls.filter(
    call => !existingCallIds.includes(call.callingId)
  );

  console.log(`Found ${newCalls.length} new calls to process.`);


  for (const call of newCalls) {
    console.log(call.slug)
    
    let clips: {
      url: string;
      roomId: string;
      clipNum: string;
      public_id: string;
    }[] = [];

    if (call.recorded === true) {
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

      const res = await prismaClient.call.findFirst({
        where: {
          id: Number(call.id)
        },
        include: {
          callUserTimes: {
            include: {
              user: true
            }
          }
        }
      })

      const peers: { img: string, name: string, email: string }[] = [];
      if (res?.callUserTimes) {
        for (const cut of res.callUserTimes) {
          if (cut.user) {
            peers.push({
              img: cut.user.profileImage ?? '',
              name: cut.user.firstName + ' ' + cut.user.lastName,
              email: cut.user.email,
            });
          }
        }
      }

      console.log('[peers data] : ', peers);

      finalResult.push({
        callId: call.callingId,
        date: call.date,
        time: call.startTime,
        slug: call.slug,
        recorded: call.recorded,
        peers,
        clips,
      });
    }
  }

  return finalResult;
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch (error) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { userId, callIds } = body;

  if (userId === undefined || !callIds) {
    return Response.json({ error: 'Missing userId or callIds array in body' }, { status: 400 });
  }
  
  const userIdString = String(userId);

  console.log('POST: Fetching NEW clips for userId:', userIdString);
  console.log('POST: Client already has callIds:', callIds);

  try {
    const newClips = await getClipsByUserId(userIdString, callIds);
    return Response.json(newClips);
  } catch (error) {
     console.error("Error processing clips:", error);
     return Response.json({ error: 'Server error processing request' }, { status: 500 });
  }
}