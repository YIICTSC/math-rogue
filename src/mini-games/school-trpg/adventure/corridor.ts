import { neighbor, type Floor } from './world';

export type Surface = 'floor' | 'ceiling' | 'wall';
export type Plane = { key: string; surface: Surface; x: number; y: number; z: number; rotation: string; shade: number };

const DEPTH = 4;
const SPAN = 2;
const EYE_LEVEL = 0.32;

export function corridorPlanes(floor: Floor, start: number, direction: number): Plane[] {
  if (!floor.open.has(start)) return [];
  const queue = [{ cell: start, x: 0, depth: 0 }];
  const visited = new Set([start]);
  const planes: Plane[] = [];
  for (const { cell, x, depth } of queue) {
    const front = 0.28 - depth - 1;
    const middle = front + 0.5;
    const illumination = Math.pow(0.64, depth);
    planes.push(
      { key: cell + '/floor', surface: 'floor', x, y: EYE_LEVEL, z: middle, rotation: 'rotateX(90deg)', shade: illumination * 0.85 },
      { key: cell + '/ceiling', surface: 'ceiling', x, y: -EYE_LEVEL, z: middle, rotation: 'rotateX(-90deg)', shade: illumination * 0.69 },
    );
    const walls = [
      { dx: 0, dz: 1, x, z: front, angle: 0, shade: 0.98 },
      { dx: 1, dz: 0, x: x + 0.5, z: middle, angle: -90, shade: 0.84 },
      { dx: 0, dz: -1, x, z: front + 1, angle: 180, shade: 0.82 },
      { dx: -1, dz: 0, x: x - 0.5, z: middle, angle: 90, shade: 0.75 },
    ];
    for (const [side, wall] of walls.entries()) {
      const target = neighbor(cell, (direction + side) % 4);
      const lateral = x + wall.dx;
      const further = depth + wall.dz;
      const open = floor.open.has(target);
      const visible = further >= 0 && further <= DEPTH && Math.abs(lateral) <= SPAN;
      if (open && visible) {
        if (!visited.has(target)) {
          visited.add(target);
          queue.push({ cell: target, x: lateral, depth: further });
        }
      } else if (!open || visible || (side !== 2 && further >= 0)) {
        planes.push({ key: cell + '/wall/' + side, surface: 'wall', x: wall.x, y: 0, z: wall.z,
          rotation: 'rotateY(' + wall.angle + 'deg)', shade: illumination * (open ? 0.32 : wall.shade) });
      }
    }
  }
  return planes;
}
