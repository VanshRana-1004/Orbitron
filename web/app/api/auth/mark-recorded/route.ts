import { prismaClient } from 'database';

export async function GET(req : Request){
    const { searchParams }=new URL(req.url);
    const roomId = searchParams.get('roomId');
    console.log('fetching clips for roomId ',roomId);
    if(!roomId){
        return Response.json({ error: 'Missing roomId' }, { status: 400 });
    }
    
    const res = await prismaClient.call.findFirst({
      where: {
        callingId: String(roomId)
      }
    });

    if (res) {
      await prismaClient.call.update({
        where: {
          id: res.id
        },
        data: {
          recorded: true
        }
      });
      console.log('processing done for room ', roomId);
      return Response.json({ message : 'recorded true done'});
    }
    return Response.json({ message : 'no call found'}, { status: 404 });
}