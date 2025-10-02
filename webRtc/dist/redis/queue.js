"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ffmpegQueue = void 0;
exports.enqueueRoomJob = enqueueRoomJob;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bullmq_1 = require("bullmq");
exports.ffmpegQueue = new bullmq_1.Queue("ffmpeg-jobs", {
    connection: { host: process.env.REDIS_HOST || "localhost", port: Number(process.env.REDIS_PORT) || 6379 }
});
async function enqueueRoomJob(roomId) {
    await exports.ffmpegQueue.add("final", { roomId });
    console.log('job pushed to queue');
}
