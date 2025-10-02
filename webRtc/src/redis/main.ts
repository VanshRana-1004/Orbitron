import { createClient } from "redis";

export async function initRedis(){
  const client = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:6379`,
  });

  client.on("error", (err: Error) => console.error("Redis Client Error", err));

  await client.connect();
  console.log("Connected to Redis");

}