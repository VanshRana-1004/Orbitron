"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaCodecs = void 0;
exports.mediaCodecs = [
    {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
        parameters: {
            useinbandfec: 1,
            stereo: 1,
        }
    },
    {
        kind: "video",
        mimeType: "video/H264",
        clockRate: 90000,
        parameters: {
            "packetization-mode": 1,
            "profile-level-id": "640c28",
        },
    },
    {
        kind: "video",
        mimeType: "video/H264",
        clockRate: 90000,
        parameters: {
            "packetization-mode": 1,
            "profile-level-id": "42e01f",
        },
    },
    {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
    }
];
