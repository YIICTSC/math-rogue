export interface SolidRect { left: number; top: number; width: number; height: number }
export interface StairShape { type: string; x: number; width: number; height: number }
export const isStair = (type: string) => ['STEPS', 'HIGH_STEPS', 'MOUNTAIN_STEPS'].includes(type);
// One geometry source for visible steps, landing surfaces and solid side walls.
export function stairRects(obstacle: StairShape, floor: number): SolidRect[] {
  const count = obstacle.type === 'STEPS' ? 2 : obstacle.type === 'HIGH_STEPS' ? 3 : 4;
  return Array.from({length: count}, (_, i) => ({
    left: obstacle.x - obstacle.width / 2 + i * obstacle.width / count,
    top: floor - obstacle.height * (i + 1) / count,
    width: obstacle.width / count,
    height: obstacle.height * (i + 1) / count,
  }));
}
export const FLIGHT_GAP = 182;
export function flightGateRects(x: number, width: number, center: number): SolidRect[] {
  const top = center - FLIGHT_GAP / 2, bottom = center + FLIGHT_GAP / 2;
  return [{left:x-width/2,top:0,width,height:top}, {left:x-width/2,top:bottom,width,height:340-bottom}];
}
export const overlapsSolid = (x: number, y: number, rect: SolidRect) =>
  x + 15 > rect.left && x - 15 < rect.left + rect.width && y - 8 > rect.top && y - 64 < rect.top + rect.height;
