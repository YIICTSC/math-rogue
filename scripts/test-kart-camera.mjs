import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
try {
  const { COURSES, getTrack, sampleTrack } = await server.ssrLoadModule('/src/mini-games/gakuro-kart/track.ts');
  const { chaseCameraPose, cameraRoadFloor } = await server.ssrLoadModule('/src/mini-games/gakuro-kart/camera.ts');
  let oldMinimum = Infinity;
  for (let course = 0; course < COURSES.length; course++) {
    for (const lane of [-10, 0, 10]) {
      let camera = chaseCameraPose(0, course, lane).position;
      for (let distance = 0; distance < getTrack(course).length; distance += 1.5) {
        const pose = chaseCameraPose(distance, course, lane), rear = sampleTrack(distance - 10, course, lane);
        assert.equal(pose.position.x, rear.x); assert.equal(pose.position.z, rear.z);
        assert(pose.position.y >= rear.y + 4.8 - 1e-9);
        const ahead = sampleTrack(distance + 6, course, lane);
        assert(Math.abs(pose.look.y - ahead.y - 1.3) < 1e-9);
        for (const key of ['x', 'y', 'z']) camera[key] += (pose.position[key] - camera[key]) * (1 - Math.exp(-18 / 60));
        camera.y = Math.max(camera.y, cameraRoadFloor(camera, distance, course));
        assert(Object.values(camera).every(Number.isFinite));
        assert(camera.y >= cameraRoadFloor(camera, distance, course) - 1e-9);
        const p = sampleTrack(distance, course, lane);
        oldMinimum = Math.min(oldMinimum, p.y + 4.8 - rear.y);
      }
    }
  }
  assert(oldMinimum < 2.8, 'The regression must exercise a slope that violated road clearance with the old camera.');
  console.log(`All eight courses, uphill/downhill crests, lane edges and smoothed 90m/s camera clearance passed; previous minimum clearance ${oldMinimum.toFixed(2)}m.`);
} finally { await server.close(); }
