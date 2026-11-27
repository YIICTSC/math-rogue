import { assetUrl } from '../../utils/assetPaths';
import type { Direction } from './world';

const guests = new Set(['aster', 'lyra', 'nagi', 'mio', 'sena', 'end-vesper', 'end-sable', 'end-hikari', 'end-ren']);
const atlases = new Map<string, HTMLImageElement>();
const facingRow: Record<Direction, number> = { down: 0, up: 1, right: 2, left: 3 };

export function guestSpriteUrl(id: string) {
  if (guests.has(id)) return assetUrl(`sprites/pixel-rpg/guests/${id}.webp`);
}

export function drawGuestSprite(ctx: CanvasRenderingContext2D, id: string, direction: Direction, x: number, y: number, size: number, step?: number) {
  let atlas = atlases.get(id);
  if (!atlas) {
    const url = guestSpriteUrl(id);
    if (!url) return false;
    atlas = new Image();
    atlas.src = url;
    atlases.set(id, atlas);
  }
  if (!atlas.complete || !atlas.naturalWidth) return false;

  const width = atlas.naturalWidth / 4;
  const height = atlas.naturalHeight / 4;
  const frame = step === undefined ? 0 : 1 + Math.min(2, Math.floor(Math.max(0, step) * 3));
  ctx.drawImage(atlas, frame * width, facingRow[direction] * height, width, height, x, y, size, size);
  return true;
}
