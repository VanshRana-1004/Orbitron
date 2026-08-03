# Orbitron

🚀 **Orbitron** is a video calling platform with **in-app centralized session recording**.  
No more local screen recordings or manual uploads — every peer’s stream (video/audio/screen) is recorded **server-side** and automatically processed into a final synced video.

Live : [Orbitron](https://orbitron-three.vercel.app/)

---
## Demo

https://github.com/user-attachments/assets/b2b0260d-af3c-44cb-9419-00c2e63b7998

---

## 🔹 Problem Solved
In normal video calls, if a session is important:  
- Someone has to screen record locally  
- Handle storage  
- Upload manually  

Orbitron automates this process — the server handles recording, post-processing, and uploading so all participants can access the recording easily.

---

## 🔹 Features
- Multi-peer video calling (beta supports up to 5 peers per call)  
- Server-side recording for all streams (video, audio, screen share)  
- Automatic post-processing via **FFmpeg**  
- Dashboard for participants to access recordings  
- Desktop & laptop support (mobile coming soon)  

---

## 🔹 Tech Stack
- **Mediasoup SFU** → WebRTC streaming  
- **FFmpeg** → Recording & post-processing  
- **Next.js + TypeScript** → Frontend  
- **Socket.IO + Express** → Backend & signaling  
- **PostgreSQL + Prisma** → Database  
- **Cloudinary** → Storing recordings  

---

## 🔹 Installation
1. Clone the repo  
```bash
git clone https://github.com/VanshRana-1004/Orbitron.git
```

2. Install Dependencies inside folders 
```bash
npm install
```

3. Build Folders
```bash
npm run build
```

4. Inside WebRtc 
 - start redis on port 6379
 ```bash
     docker run -d -p 6379:6379 redis
 ```
 - start server
 ```bash
     npm run dev
 ```

5. Inside Web
```bash
  npm run dev
```

