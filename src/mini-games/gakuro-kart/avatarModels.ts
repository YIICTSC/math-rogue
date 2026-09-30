import { createExpressionParts } from './expressionModels';
import { createHairParts } from './hairModels';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { KartAvatar } from './avatar';
export type AvatarColor = 'body' | 'outfit' | 'hair';
export interface AvatarPart { geometry: T.BufferGeometry; material: T.Material; position: number[]; scale: number[]; rotation: number[]; color?: AvatarColor; visible?: (a: KartAvatar) => boolean }
/** Original reusable 3D driver assets. Geometry is shared by all 40 racers. */
export function createAvatarParts(): AvatarPart[] {
  const parts: AvatarPart[] = [];
  const ball = new T.SphereGeometry(1, 16, 12), box = new RoundedBoxGeometry(1, 1, 1, 2, .14), cone = new T.ConeGeometry(1, 1, 4);
  const material = (color: string, metalness = 0) => new T.MeshStandardMaterial({ color, metalness, roughness: .5 });
  const paint = material('#ffffff'), white = material('#faf4e8'), dark = material('#17243a'), pink = material('#ffadbe'), gold = material('#ffc94b', .65);
  const add = (geometry: T.BufferGeometry, mat: T.Material, position: number[], scale: number[], color?: AvatarColor, visible?: AvatarPart['visible'], rotation = [0, 0, 0]) => parts.push({ geometry, material: mat, position, scale, rotation, color, visible });
  const species = (n: number) => (a: KartAvatar) => a.species === n;
  // Seated torso, arms and hands, face and expressive eyes are shared assets.
  add(box, paint, [0, 1.23, -.3], [.88, .72, .65], 'outfit');
  for (const side of [-1, 1]) {
    add(ball, paint, [side * .46, 1.16, .18], [.19, .24, .38], 'outfit');
    add(ball, paint, [side * .42, 1.13, .48], [.15, .13, .16], 'body');
  }
  add(ball, paint, [0, 1.87, -.13], [.54, .57, .49], 'body');
  parts.push(...createHairParts(), ...createExpressionParts());
  for (const side of [-1, 1]) add(ball, paint, [side * .52, 1.86, -.1], [.13, .19, .1], 'body', species(0));
  // Cats and foxes: upright triangular ears, contrasting muzzle and tail.
  for (const n of [1, 4]) {
    for (const side of [-1, 1]) {
      add(cone, paint, [side * .38, 2.39, -.15], [.38, .5, .28], 'body', species(n), [0, 0, -side * .18]);
      add(cone, pink, [side * .38, 2.39, .005], [.21, .3, .03], undefined, species(n), [0, 0, -side * .18]);
      add(ball, white, [side * .14, 1.76, .32], [.2, .15, .15], undefined, species(n));
    }
    add(ball, dark, [0, 1.83, .48], [.085, .06, .055], undefined, species(n));
    add(ball, paint, [.63, 1.07, -.92], [.19, n === 4 ? .46 : .3, .22], 'body', species(n), [0, 0, -.65]);
  }
  // Dog: floppy ears and a projecting muzzle.
  for (const side of [-1, 1]) add(ball, paint, [side * .55, 1.92, -.15], [.21, .48, .21], 'hair', species(2), [0, 0, side * .25]);
  add(ball, white, [0, 1.75, .34], [.32, .2, .27], undefined, species(2));
  add(ball, dark, [0, 1.85, .58], [.12, .08, .07], undefined, species(2));
  // Rabbit: tall ears, pink inner ears and cotton tail.
  for (const side of [-1, 1]) {
    add(ball, paint, [side * .25, 2.61, -.16], [.17, .65, .16], 'body', species(3), [0, 0, -side * .16]);
    add(ball, pink, [side * .25, 2.61, -.015], [.08, .47, .03], undefined, species(3), [0, 0, -side * .16]);
  }
  add(ball, pink, [0, 1.81, .36], [.07, .06, .04], undefined, species(3));
  add(ball, white, [0, 1.04, -.94], [.24, .24, .24], undefined, species(3));
  // Panda: round ears, eye patches, white snout.
  for (const side of [-1, 1]) {
    add(ball, dark, [side * .42, 2.27, -.17], [.23, .24, .18], undefined, species(5));
    add(ball, dark, [side * .2, 1.95, .31], [.15, .18, .075], undefined, species(5), [0, 0, side * .25]);
  }
  add(ball, white, [0, 1.73, .3], [.27, .18, .15], undefined, species(5));
  add(ball, dark, [0, 1.8, .44], [.09, .06, .04], undefined, species(5));
  // Penguin: belly bib, beak, side flippers and orange feet.
  add(ball, white, [0, 1.36, .02], [.37, .44, .17], undefined, species(6));
  add(cone, gold, [0, 1.8, .49], [.25, .35, .18], undefined, species(6), [Math.PI / 2, 0, 0]);
  for (const side of [-1, 1]) {
    add(ball, paint, [side * .57, 1.3, -.18], [.15, .39, .29], 'body', species(6), [0, 0, side * .4]);
    add(ball, gold, [side * .26, .96, .36], [.2, .09, .27], undefined, species(6));
  }
  // Robot: squared faceplate, antenna, luminous ear pods.
  add(box, paint, [0, 1.89, -.1], [1.12, 1.06, .86], 'body', species(7));
  add(box, dark, [0, 1.94, .35], [.87, .36, .08], undefined, species(7));
  for (const side of [-1, 1]) {
    add(ball, gold, [side * .6, 1.92, -.1], [.13, .23, .19], undefined, species(7));
  }
  add(box, dark, [0, 2.49, -.1], [.07, .26, .07], undefined, species(7));
  add(ball, gold, [0, 2.64, -.1], [.11, .11, .11], undefined, species(7));
  // Accessories retain species silhouettes; ears remain visible above headwear.
  const accessory = (n: number) => (a: KartAvatar) => a.accessory === n;
  for (const side of [-1, 1]) add(new T.TorusGeometry(.16, .035, 6, 12), gold, [side * .21, 1.96, .42], [1, 1, 1], undefined, accessory(1));
  add(box, gold, [0, 1.96, .43], [.15, .035, .035], undefined, accessory(1));
  add(ball, paint, [0, 2.17, -.2], [.61, .39, .52], 'outfit', accessory(2));
  add(box, dark, [0, 2.1, .35], [.86, .2, .1], undefined, accessory(2));
  add(new T.CylinderGeometry(.43, .43, .17, 12), gold, [0, 2.48, -.14], [1, 1, 1], undefined, accessory(3));
  for (const side of [-1, 0, 1]) add(cone, gold, [side * .28, 2.65, -.04], [.2, .3, .2], undefined, accessory(3));
  return parts;
}
