"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalUploads = finalUploads;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cloudinary_1 = require("cloudinary");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET,
    timeout: 300000
});
async function withRetry(fn, retries = 3, delayMs = 2000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        }
        catch (err) {
            lastError = err;
            console.warn(`Upload attempt ${i + 1} failed. Retrying...`);
            if (i < retries - 1) {
                await new Promise((res) => setTimeout(res, delayMs));
            }
        }
    }
    throw lastError;
}
async function finalUploads(roomId) {
    const finalRecordingDir = path_1.default.join('/webRtc', 'final-recordings');
    const finalRecordingFiles = fs_1.default.readdirSync(finalRecordingDir).filter(f => f.startsWith(roomId));
    for (const file of finalRecordingFiles) {
        try {
            const lastPart = file.split("_").pop();
            const clipNum = lastPart
                ? parseInt(lastPart.replace(".mp4", ""), 10)
                : NaN;
            const fullPath = path_1.default.join(finalRecordingDir, file);
            await withRetry(() => uploadClip(fullPath, roomId, clipNum));
            console.log(`${file} uploaded successfully`);
        }
        catch (e) {
            console.error("Error while uploading", file, e);
        }
    }
}
async function uploadClip(filePath, roomId, clipNum) {
    const fileSize = fs_1.default.statSync(filePath).size;
    if (fileSize < 50 * 1024 * 1024) {
        return cloudinary_1.v2.uploader.upload(filePath, {
            resource_type: "video",
            folder: `recordings/${roomId}`,
            public_id: `clip_${clipNum}`,
            context: { roomId, clipNum: String(clipNum) },
        });
    }
    else {
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.upload_large(filePath, {
                resource_type: "video",
                folder: `recordings/${roomId}`,
                public_id: `clip_${clipNum}`,
                chunk_size: 5000000,
                context: { roomId, clipNum: String(clipNum) },
            }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
        });
    }
}
