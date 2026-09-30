import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { AvatarPart } from './avatarModels';

/** Eight cosmetic chassis share handling and collision dimensions. */
export function createKartParts(): AvatarPart[] {
  const parts: AvatarPart[] = [], shell = new RoundedBoxGeometry(1, 1, 1, 2, .12), ball = new T.SphereGeometry(1, 12, 8);
  const paint = new T.MeshStandardMaterial({ color: '#ffffff', roughness: .45, metalness: .35 });
  const dark = new T.MeshStandardMaterial({ color: '#101d30', roughness: .65 }), white = new T.MeshStandardMaterial({ color: '#eff6ff', metalness: .4, roughness: .4 });
  const glow = new T.MeshBasicMaterial({ color: '#65eaff' }), yellow = new T.MeshBasicMaterial({ color: '#ffd261' });
  const add = (geometry: T.BufferGeometry, material: T.Material, position: number[], scale: number[], shapes: number[], rotation = [0, 0, 0]) => parts.push({ geometry, material, position, scale, rotation, color: material === paint ? 'outfit' : undefined, visible: a => shapes.includes(a.kart) });
  const all = [0, 1, 2, 3, 4, 5, 6, 7];
  add(shell, dark, [0, .95, -.32], [1, .45, 1.25], all);
  // Standard, open-wheel formula, tubular buggy, rounded sports coupe.
  add(shell, paint, [0, .65, 0], [1.65, .6, 3.2], [0]);
  add(shell, white, [0, .99, .82], [.24, .06, 1.45], [0]);
  add(shell, paint, [0, 1.2, -1.35], [2.25, .16, .48], [0, 1]);
  add(shell, paint, [0, .6, .2], [.9, .5, 3.5], [1]);
  add(shell, paint, [0, .55, 1.53], [2.18, .15, .38], [1]);
  add(shell, paint, [0, .68, 0], [1.45, .32, 2.7], [2]);
  for (const side of [-1, 1]) {
    add(shell, white, [side * .67, 1.2, -.85], [.09, 1.07, .09], [2], [0, 0, side * .15]);
    add(shell, paint, [side * .88, .89, .95], [.35, .15, .8], [2, 7]);
  }
  add(shell, white, [0, 1.75, -.85], [1.45, .09, .09], [2]);
  add(ball, paint, [0, .66, .14], [1.05, .45, 1.75], [3]);
  add(shell, paint, [0, .65, 1.14], [1.67, .45, .65], [3]);
  add(shell, dark, [0, .77, 1.5], [.95, .15, .08], [3, 7]);
  // Rocket body with paired engine pods, fins, and a pointed nose.
  add(ball, paint, [0, .65, .1], [.72, .44, 1.75], [4]);
  add(new T.ConeGeometry(.65, 1.1, 12), paint, [0, .65, 1.62], [1, 1, .7], [4], [Math.PI / 2, 0, 0]);
  for (const side of [-1, 1]) {
    add(new T.CylinderGeometry(.29, .38, 1.7, 12), white, [side * .9, .62, -.65], [1, 1, 1], [4], [Math.PI / 2, 0, 0]);
    add(shell, paint, [side * .8, 1.03, -1.4], [.16, .7, .66], [4], [0, 0, side * .25]);
    add(new T.TorusGeometry(.44, .11, 6, 16), glow, [side * .97, .4, .3], [1, 1.4, 1], [5], [Math.PI / 2, 0, 0]);
  }
  add(ball, paint, [0, .69, 0], [1.17, .31, 1.69], [5]);
  add(shell, glow, [0, .46, 0], [1.4, .08, 2.45], [5]);
  // School bus: open driver cab, tall rear passenger cabin and school stripes.
  add(shell, paint, [0, .69, .03], [1.8, .58, 3.2], [6]);
  add(shell, paint, [0, 1.35, -1.04], [1.78, 1.33, .9], [6]);
  add(shell, dark, [0, 1.59, -.56], [1.35, .5, .035], [6]);
  for (const side of [-1, 1]) {
    add(shell, dark, [side * .91, 1.58, -1.04], [.03, .47, .55], [6]);
    add(shell, yellow, [side * .91, .86, .08], [.03, .1, 2.7], [6]);
  }
  // Pickup: raised hood, bumper, open rear cargo bed and side rails.
  add(shell, paint, [0, .65, 0], [1.75, .48, 3.15], [7]);
  add(shell, paint, [0, .96, 1.04], [1.65, .45, 1.01], [7]);
  add(shell, white, [0, .49, 1.62], [1.92, .24, .13], [7]);
  add(shell, dark, [0, .92, -1.07], [1.4, .07, .76], [7]);
  for (const side of [-1, 1]) add(shell, paint, [side * .79, 1.09, -1.07], [.13, .33, .96], [7]);
  // All wheeled chassis use shared tyres; the buggy has larger tyres.
  for (const side of [-1, 1]) for (const z of [-.97, 1.05]) {
    add(new T.CylinderGeometry(.46, .46, .43, 12), dark, [side, .43, z], [1, 1, 1], [0, 1, 3, 4, 6, 7], [0, 0, Math.PI / 2]);
    add(new T.CylinderGeometry(.57, .57, .5, 12), dark, [side, .48, z], [1, 1, 1], [2], [0, 0, Math.PI / 2]);
    add(new T.CylinderGeometry(.25, .25, .53, 10), white, [side, .43, z], [1, 1, 1], [0, 1, 2, 3, 4, 6, 7], [0, 0, Math.PI / 2]);
  }
  return parts;
}
