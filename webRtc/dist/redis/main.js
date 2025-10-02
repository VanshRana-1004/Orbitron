"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRedis = initRedis;
const redis_1 = require("redis");
async function initRedis() {
    const client = (0, redis_1.createClient)({
        url: `redis://${process.env.REDIS_HOST || 'localhost'}:6379`,
    });
    client.on("error", (err) => console.error("Redis Client Error", err));
    await client.connect();
    console.log("Connected to Redis");
}
