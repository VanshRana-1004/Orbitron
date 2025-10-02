"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupFiles = cleanupFiles;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function cleanupFiles(roomId) {
    const dirs = [
        { dir: path_1.default.join('/webRtc', "final-recordings"), label: "final recordings" },
        { dir: path_1.default.join('/webRtc', "recordings"), label: "recordings" },
        { dir: path_1.default.join('/webRtc', "sdp"), label: "sdp" },
    ];
    for (const { dir, label } of dirs) {
        try {
            const files = fs_1.default.readdirSync(dir).filter(f => f.startsWith(roomId));
            for (const file of files) {
                const fullPath = path_1.default.join(dir, file);
                await fs_1.default.promises.unlink(fullPath);
                console.log(`Deleted ${file} from ${label}`);
            }
        }
        catch (err) {
            console.error(`Error cleaning up ${label}:`, err);
        }
    }
}
