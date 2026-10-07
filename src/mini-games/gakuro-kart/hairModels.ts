import { characterGeometry } from '../../three/storybookCharacters';
import * as T from 'three';
import type { AvatarPart } from './avatarModels';

/** Curved Blender locks replace box fringes; all twelve saved style IDs remain stable. */
export function createHairParts(): AvatarPart[] {
  const parts: AvatarPart[] = [];
  const cap = characterGeometry('haircap', new T.SphereGeometry(1, 20, 12));
  const fallback = new T.SphereGeometry(.5, 16, 12);
  const lock = characterGeometry('hairstrand', fallback);
  fallback.dispose();
  const paint = new T.MeshStandardMaterial({ color: '#ffffff', roughness: .52 });
  const add = (geometry: T.BufferGeometry, position: number[], scale: number[], styles: number[], rotation = [0, 0, 0]) => parts.push({
    geometry, material: paint, position, scale, rotation, color: 'hair', motion: 'head',
    visible: a => a.species === 0 && a.accessory !== 2 && styles.includes(a.hairStyle),
  });
  const natural = [0, 1, 2, 3, 4, 5, 9, 10];
  add(cap, [0, 2.19, -.24], [.515, .285, .47], natural);
  add(cap, [0, 2.28, .025], [.46, .185, .30], natural);
  for (let i = 0; i < 5; i++) {
    const x = -.34 + i * .16;
    add(lock, [x, 2.205 + Math.abs(x) * .06, .235], [.20, .39 - i * .018, .14], [0, 3, 4, 5, 10], [0, 0, -.35 + i * .07]);
    add(lock, [x, 2.205, .24], [.19, .32 + (i % 2) * .035, .13], [1, 2], [0, 0, x * .12]);
    add(lock, [x, 2.22 + x * .12, .23], [.24, .34, .14], [9], [0, 0, -.55]);
  }
  for (const side of [-1, 1]) {
    add(lock, [side * .44, 2.045, -.035], [.15, .40, .22], natural, [0, 0, side * -.12]);
    for (let i = 0; i < 3; i++) {
      add(lock, [side * (.43 - i * .035), 1.93, -.18 - i * .15], [.20, .63, .29], [1], [.1, 0, side * .09]);
      add(lock, [side * (.44 - i * .035), 1.69, -.22 - i * .12], [.20, 1.09, .24], [2], [.1, 0, side * -.07]);
    }
    for (let i = 0; i < 3; i++) add(lock, [side * (.59 + i * .05), 1.88 - i * .055, -.28 - i * .09], [.22, .90, .25], [4], [.1, 0, side * .22]);
    add(cap, [side * .55, 2.23, -.31], [.12, .12, .12], [4]);
  }
  add(cap, [0, 1.86, -.54], [.44, .47, .17], [1]);
  add(cap, [0, 1.65, -.57], [.43, .69, .17], [2]);
  for (let i = 0; i < 3; i++) add(lock, [(i - 1) * .14, 1.89, -.72], [.25, 1.08, .26], [3], [-.3, 0, (i - 1) * .12]);
  add(cap, [0, 2.49, -.33], [.26, .24, .26], [5]);
  add(cap, [0, 2.2, -.23], [.56, .44, .49], [6]);
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2;
    add(cap, [Math.sin(a) * .45, 2.31 + (i % 2) * .08, -.24 + Math.cos(a) * .38], [.19, .20, .18], [6]);
  }
  add(cap, [0, 2.13, -.24], [.48, .27, .43], [8]);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    add(lock, [Math.sin(a) * .32, 2.43, -.24 + Math.cos(a) * .28], [.25, .54, .24], [8], [Math.cos(a) * .40, a, -Math.sin(a) * .40]);
  }
  for (let i = 0; i < 4; i++) add(lock, [0, 2.42, .12 - i * .20], [.17, .60, .28], [7], [-.15, 0, 0]);
  for (let i = 0; i < 6; i++) add(cap, [Math.sin(i * Math.PI / 2) * .065, 2.02 - i * .14, -.68], [.12, .14, .12], [10]);
  return parts;
}
