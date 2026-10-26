import { visualHash } from './visuals';

/** Clustered groves, pools and outcrops replace isolated random single-cell obstacles.
 * Main lanes and interaction approaches are reserved before shaping the land.
 * This only decorates field rooms; authored dungeon mechanisms are untouched.
 */
export function shapeField(chapter: number, room: number, map: number[][]) {
  if (room >= 8) return;
  const protectedCell = (x: number, y: number) =>
    [5, 7, 9].includes(y) || [5, 10, 15].includes(x)
    || y === 4 && x >= 7 && x <= 10
    || y === 6 && [8, 12].includes(x)
    || y === 10 && x >= 5 && x <= 8;
  for (let y = 2; y <= 11; y++) for (let x = 3; x <= 16; x++) {
    map[y][x] = 0;
    if (protectedCell(x, y)) continue;
    const n = visualHash(chapter, room, Math.floor(x / 4), Math.floor(y / 3));
    const grove = ((x - (6 + (room % 3))) / 2.5) ** 2 + ((y - 3) / 1.8) ** 2 < 1;
    const pool = ((x - (12 + (room % 2))) / 2.6) ** 2 + ((y - 10) / 1.7) ** 2 < 1;
    if (room === 0) {
      if ((x === 6 || x === 13) && y === 3) map[y][x] = 3;
    } else if (pool && room % 3 !== 1) {
      map[y][x] = 2;
    } else if (grove || n % 5 === 0) {
      map[y][x] = 3;
    } else if (n % 3 === 0) map[y][x] = 6;
  }
}
