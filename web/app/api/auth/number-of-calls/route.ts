import { prismaClient } from "database";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  console.log('Fetching clips for userId:', userId);

  if (!userId) {
    return Response.json({ error: 'Missing userId' }, { status: 400 });
  }

  try{
    const count=await prismaClient.call.count({
        where:{
            recorded:true,
            callUserTimes: {
                some: {
                    userId: Number(userId),
                },
            },
        }
    })
    console.log('Number of recorded calls for userId', userId, ':', count);
    return Response.json({ count });
  }catch(e){
    console.log(e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}