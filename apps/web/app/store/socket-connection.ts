import { create } from 'zustand';
import { io, Socket } from "socket.io-client";

const SERVER_URL = 'http://localhost:8080/dashboard'; 

interface SocketState {
  socket: Socket | null;
  initSocket: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  initSocket: () => {
    const state = get(); 
    if (!state.socket) { 
      const socket = io(SERVER_URL);
      set({ socket });
      console.log('persistent socket connection successful');
    } else {
      console.log('socket already initialized, using existing one');
    }
  },
}));
