import {WebSocket} from 'ws';
import type {SessionResult} from '../src/services/sessionResults';

/** send callbacks close only after the final reliable WebSocket packet is queued. */
export function endSession(result: SessionResult | null, members: Iterable<{socket: WebSocket}>) {
  if (!result) return false;
  const packet = JSON.stringify({type:'session-result', result});
  for (const {socket} of members) if (socket.readyState === WebSocket.OPEN) socket.send(packet, () => socket.close(1000, 'Session ended by host'));
  return true;
}
