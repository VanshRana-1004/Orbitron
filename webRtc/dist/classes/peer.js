"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Peer {
    constructor(name, socketId, userId) {
        this.userId = userId;
        this.name = name;
        this.socketId = socketId,
            this.producers = {
                cam: null,
                mic: null,
                screen: null,
                saudio: null
            },
            this.upTransport = null,
            this.downTransport = null,
            this.consumers = [],
            this.screen = false,
            this.videoConsumer = null;
        this.audioConsumer = null;
        this.videoPlainTransport = null;
        this.audioPlainTransport = null;
        this.audioPort = null;
        this.videoPort = null;
    }
}
exports.default = Peer;
