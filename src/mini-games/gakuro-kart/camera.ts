import { ROAD_WIDTH, sampleTrack, type CustomCourse, type Point } from './track';

/** Follow the actual road behind/ahead rather than a flat tangent plane. */
export function chaseCameraPose(distance: number, course: number, lane: number, airborne = false,custom?:CustomCourse) {
  const rear = sampleTrack(distance - 10, course, lane,custom), ahead = sampleTrack(distance + 6, course, lane,custom);
  const position: Point = { x: rear.x, y: rear.y + 4.8 + (airborne ? 1.8 : 0), z: rear.z };
  const look: Point = { x: ahead.x, y: ahead.y + 1.3, z: ahead.z };
  // Keep the view above crests between the camera and the driver.
  for (let offset = -10; offset <= 0; offset += 2) position.y = Math.max(position.y, sampleTrack(distance + offset, course, lane,custom).y + 3);
  return { position, look };
}

/** Reapply clearance after smoothing, which can otherwise lag underneath an uphill. */
export function cameraRoadFloor(position: Point, distance: number, course: number,custom?:CustomCourse) {
  let floor = -Infinity, closest = Infinity;
  let a = sampleTrack(distance - 40, course,0,custom);
  for (let offset = -38; offset <= 40; offset += 2) {
    const b = sampleTrack(distance + offset, course,0,custom), dx = b.x - a.x, dz = b.z - a.z;
    const lengthSquared = dx * dx + dz * dz;
    const t = lengthSquared ? Math.max(0, Math.min(1, ((position.x - a.x) * dx + (position.z - a.z) * dz) / lengthSquared)) : 0;
    const separation = Math.hypot(position.x - (a.x + dx * t), position.z - (a.z + dz * t));
    if (separation < closest) { closest = separation; floor = a.y + (b.y - a.y) * t + 2.8; }
    a = b;
  }
  return closest <= ROAD_WIDTH / 2 + 1 ? floor : -Infinity;
}
