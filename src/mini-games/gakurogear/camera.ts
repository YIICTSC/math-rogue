import * as T from 'three';

/** Fit the complete arena, including raised walls, rather than just its floor. */
export function frameArena(camera: T.OrthographicCamera, halfSize: number, aspect: number, height = 3, tilt = .625) {
  const distance = Math.max(32, halfSize * 2.4 + height);
  camera.position.set(0, distance, distance * tilt);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const bounds = new T.Box3();
  for (const x of [-halfSize, halfSize]) for (const y of [0, height]) for (const z of [-halfSize, halfSize]) {
    bounds.expandByPoint(new T.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
  }
  const center = bounds.getCenter(new T.Vector3());
  const half = Math.max((bounds.max.y - bounds.min.y) / 2, (bounds.max.x - bounds.min.x) / (2 * aspect)) * 1.08;
  camera.left = center.x - half * aspect; camera.right = center.x + half * aspect;
  camera.top = center.y + half; camera.bottom = center.y - half;
  camera.near = .1; camera.far = distance * 4 + halfSize * 4 + height;
  camera.updateProjectionMatrix();
}

export function followArena(camera: T.OrthographicCamera, focus: T.Vector3, aspect: number, range = 10, tilt = .625, halfSize?:number) {
  const half = Math.max(range, 7 / aspect);
  camera.left = -half * aspect; camera.right = half * aspect;
  camera.top = half; camera.bottom = -half;
  camera.near = .1; camera.far = 160;
  const center=focus.clone();
  if(halfSize!==undefined){
    const mx=Math.max(0,halfSize-half*aspect*.8),mz=Math.max(0,halfSize-half*Math.sqrt(1+tilt*tilt)*.8);
    center.x=T.MathUtils.clamp(center.x,-mx,mx);center.z=T.MathUtils.clamp(center.z,-mz,mz);
  }
  camera.position.copy(center).add(new T.Vector3(0, 32, 32 * tilt));
  camera.lookAt(center); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
}

export function collisionSafeCamera(focus: T.Vector3, desired: T.Vector3, blocked: (point: T.Vector3) => boolean) {
  const safe = focus.clone();
  const steps = Math.max(40, Math.ceil(focus.distanceTo(desired) / .08));
  for (let i = 1; i <= steps; i++) {
    const point = focus.clone().lerp(desired, i / steps);
    if (blocked(point)) break;
    safe.copy(point);
  }
  return safe;
}

export const cameraBlend = (dt: number, reducedMotion: boolean) => reducedMotion ? 1 : 1 - Math.exp(-Math.max(0, dt) * 12);
