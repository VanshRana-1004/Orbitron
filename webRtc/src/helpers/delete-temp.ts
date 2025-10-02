import fs from "fs";
import path from "path";

export async function cleanupFiles(roomId: string) {
  const dirs = [
    { dir: path.join('/webRtc', "final-recordings"), label: "final recordings" },
    { dir: path.join('/webRtc', "recordings"), label: "recordings" },
    { dir: path.join('/webRtc', "sdp"), label: "sdp" },
  ];

  for (const { dir, label } of dirs) {
    try {
      const files = fs.readdirSync(dir).filter(f => f.startsWith(roomId));
      for (const file of files) {
        const fullPath = path.join(dir, file);
        await fs.promises.unlink(fullPath);
        console.log(`Deleted ${file} from ${label}`);
      }
    } catch (err) {
      console.error(`Error cleaning up ${label}:`, err);
    }
  }
}
