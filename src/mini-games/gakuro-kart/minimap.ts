import { getTrack, ROAD_WIDTH, type Point } from './track';

export function minimapGeometry(course: number) {
  const points = getTrack(course).points;
  const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
  const minZ = Math.min(...points.map(p => p.z)), maxZ = Math.max(...points.map(p => p.z));
  const scale = Math.min(106 / (maxX - minX + ROAD_WIDTH + 4), 124 / (maxZ - minZ + ROAD_WIDTH + 4));
  const project = (p: Point) => ({ x: 61 + (p.x - (minX + maxX) / 2) * scale, y: 70 + (p.z - (minZ + maxZ) / 2) * scale });
  const path = points.filter((_, i) => i % 4 === 0).map((p, i) => { const v = project(p); return `${i ? 'L' : 'M'}${v.x},${v.y}`; }).join(' ') + 'Z';
  return { project, path };
}
