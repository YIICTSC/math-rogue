import { useEffect, useRef } from 'react';
import type { World } from './engine';
import { audioService } from '../services/audioService';

export function useMachineNotes(world: World | null | undefined, selfId: string, active: boolean) {
  const heard = useRef(new Map<string, number>());
  const seed = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!world) {
      seed.current = undefined;
      heard.current.clear();
      return;
    }
    const state = world.voxels?.machinery, player = world.players[selfId];
    const newWorld = seed.current !== world.seed;
    if (newWorld) { seed.current = world.seed; heard.current.clear(); }
    if (!state || !player) return;
    const x = player.position3D?.x ?? player.x + .5, z = player.position3D?.z ?? player.y + .5;
    let voices = 0;
    for (const [key, device] of Object.entries(state.devices)) {
      const played = device.played;
      if (played === undefined || heard.current.get(key) === played) continue;
      heard.current.set(key, played);
      if (!active || newWorld || state.tick - played > 2 || voices >= 6) continue;
      const [mx, my, mz] = key.split(',').map(Number);
      const distance = Math.hypot(mx+.5-x, mz+.5-z, player.position3D?.y !== undefined ? my-player.position3D.y : 0);
      if (distance >= 18 || device.noteGain===0) continue;
      audioService.playRpgNote(device.note ?? 12, device.instrument || 'bell', (1 - distance / 18)*(device.noteGain ?? 100)/100);
      voices++;
    }
    for (const key of heard.current.keys()) if (!state.devices[key]) heard.current.delete(key);
  }, [active, selfId, world, world?.revision]);
}
