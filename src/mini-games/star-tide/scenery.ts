import { biomeFor, visualHash } from './visuals';
import type { World } from './engine';

export type Scenery = { x: number; y: number; cell: number; size: number; row: number };
/** Large props only occupy blocked tiles; walking paths and mechanisms remain readable. */
export function sceneryFor(w: World): Scenery[] {
  const biome = biomeFor(w.s.chapter, w.s.room), indoor = w.s.room >= 8;
  const props: Scenery[] = [];
  for (let y = 1; y < 13; y++) for (let x = 1; x < 19; x++) {
    if (w.map[y][x] !== 3) continue;
    const n = visualHash(w.s.chapter, w.s.room, x, y);
    const tree = !indoor && n % ([1,3,4,9].includes(biome.row) ? 3 : 5) < 2;
    props.push({ x: x + .5, y: y + .9, row: biome.row,
      cell: indoor ? n % 2 ? 4 : 7 : tree ? 0 : n % 2 ? 2 : 1,
      size: tree ? 38 : indoor ? 26 : 24 });
  }
  // Frame the island with foliage on the outside of the walkable border.
  if (!indoor) for (let x = 1; x < 19; x += 3) {
    if (w.map[0][x] === 3) props.push({ x: x + .5, y: .85, cell: 0, size: 34, row: biome.row });
    if (w.map[13][x] === 3) props.push({ x: x + .5, y: 14.1, cell: 1, size: 25, row: biome.row });
  }
  return props;
}

/** Logical terrain code -> a readable material in the region's 8-tile row. */
export function terrainCell(chapter: number, room: number, code: number, x: number, y: number) {
  const biome = biomeFor(chapter, room), n = visualHash(chapter, room, x, y);
  if (code === 2) return 4; // water / lava / cloud drop
  if (code === 3) return 5; // blocked cliff or wall
  if (code === 7) return -1; // a real pit, never a walkable-looking stone
  if (room >= 8) return 6;
  if (code === 5 || code === 1) return 3;
  if (code === 6) return 7;
  return (n % 9 < 2 ? 2 : biome.variant ? 1 : 0);
}
