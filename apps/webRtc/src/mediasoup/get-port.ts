import dgram from 'dgram';

const MIN_PORT = 20000;
const MAX_PORT = 30000;

const takenPortSet = new Set<number>();

export async function getFreePortPair(): Promise<{ rtpPort: number; rtcpPort: number }> {
  for (let port = MIN_PORT; port <= MAX_PORT; port += 2) {
    if (takenPortSet.has(port) || takenPortSet.has(port + 1)) continue;

    const rtpSocket = dgram.createSocket('udp4');
    const rtcpSocket = dgram.createSocket('udp4');

    try {
      await bindUdpPort(rtpSocket, port);
      await bindUdpPort(rtcpSocket, port + 1);

      rtpSocket.close();
      rtcpSocket.close();

      takenPortSet.add(port);
      takenPortSet.add(port + 1);

      return { rtpPort: port, rtcpPort: port + 1 };
    } catch {
      rtpSocket.close();
      rtcpSocket.close();
      continue;
    }
  }

  throw new Error('No available UDP port pairs found in the range');
}


function bindUdpPort(socket: dgram.Socket, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.once('listening', () => resolve());
    socket.bind(port, '127.0.0.1');
  });
}

export function releasePortPair(rtpPort: number, rtcpPort: number) {
  takenPortSet.delete(rtpPort);
  takenPortSet.delete(rtcpPort);
  console.log(`Released ports: RTP ${rtpPort}, RTCP ${rtcpPort}`);
}
