import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME!,
  api_key: process.env.NEXT_PUBLIC_CLOUD_API_KEY!,
  api_secret: process.env.NEXT_PUBLIC_CLOUD_SECRET!,
});

async function getClipsByUserId(userId: string) {
  const result = await cloudinary.search
    .expression(`folder:recordings AND context.userId=${userId}`)
    .sort_by('created_at', 'desc')
    .max_results(100)
    .execute();

  const parsedResults = result.resources.map((clip: any) => {
    const context = clip.context?.custom || {};

    return {
      url: clip.secure_url,
      timestamp: context.timestamp || '',
      callName: context.callName || '',
      roomId: context.roomId || '',
      userId: context.userId || '',
      createdAt: clip.created_at,
      public_id: clip.public_id,
    };
  });

  return parsedResults;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  console.log("Fetching clips for userId:", userId);

  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 400 });
  }

  const clips = await getClipsByUserId(userId); 
  return Response.json(clips);
}