import type { TableMaterial } from '../../services/traditionalTableSound';
import type { TableView } from './engine';
export type TableSoundCue = { material: TableMaterial; at: number; strength: number };
/** Only accepted tile placements make a physical impact. Passes/bids stay quiet. */
export function placementSounds(view: TableView): TableSoundCue[] {
  const key = view.event?.key;
  if (!key || view.revision === 0 || view.kind === 'crokinole') return [];
  if (view.kind === 'goita')
    return ['attack', 'goita-out'].includes(key)
      ? [
          { material: 'bamboo', at: 0, strength: 0.6 },
          { material: 'bamboo', at: 75, strength: 1 },
        ]
      : [];
  if (view.kind === 'peeper') {
    if (!['place', 'bomb', 'mine', 'return', 'peeper-out'].includes(key)) return [];
    const count = Math.min(3, view.pile?.tiles.length ?? 1);
    return Array.from({ length: count }, (_, i) => ({
      material: 'resin',
      at: i * 26,
      strength: i === 0 ? 1 : 0.55,
    }));
  }
  if (view.kind === 'forty-two')
    return ['place', 'trick', 'contract'].includes(key)
      ? [{ material: 'ivory', at: 0, strength: 1 }]
      : [];
  return ['place', 'score', 'domino', 'draw'].includes(key)
    ? [{ material: 'ivory', at: 0, strength: key === 'draw' ? 0.45 : 1 }]
    : [];
}
