import {characterGeometry} from '../../three/storybookCharacters';
import * as T from 'three';
import type { AvatarPart } from './avatarModels';

/** Sculpted silhouettes, shared between instances; helmets hide hair. */
export function createHairParts(): AvatarPart[] {
  const parts: AvatarPart[] = [], ball = characterGeometry('haircap',new T.SphereGeometry(1, 12, 8)), cone = new T.ConeGeometry(1, 1, 6), box = characterGeometry('hairlock',new T.BoxGeometry(1, 1, 1));
  const paint = new T.MeshStandardMaterial({ color: '#ffffff', roughness: .8 });
  const add = (geometry: T.BufferGeometry, position: number[], scale: number[], styles: number[], rotation = [0, 0, 0]) => parts.push({ geometry, material: paint, position, scale, rotation, color: 'hair', visible: a => a.species === 0 && a.accessory !== 2 && styles.includes(a.hairStyle) });
  add(ball, [0, 2.14, -.22], [.55, .34, .47], [0, 1, 2, 3, 4, 5, 9, 10]);
  add(box, [-.22, 2.12, .26], [.36, .25, .12], [0, 3, 4, 5, 10], [0, 0, -.22]);
  add(box, [0, 2.15, .29], [.92, .16, .1], [1, 2]);
  for (const side of [-1, 1]) {
    add(ball, [side * .44, 1.96, -.17], [.16, .43, .36], [1]);
    add(ball, [side * .46, 1.66, -.35], [.16, .67, .32], [2]);
    add(ball, [side * .64, 1.85, -.32], [.21, .6, .24], [4], [0, 0, side * .25]);
  }
  add(ball, [0, 1.77, -.63], [.47, .62, .15], [2]);
  add(ball, [0, 1.88, -.79], [.22, .57, .22], [3], [-.3, 0, 0]);
  add(ball, [0, 2.56, -.25], [.33, .32, .33], [5]);
  add(ball, [0, 2.23, -.2], [.72, .67, .62], [6]);
  // Separate curls and spikes prevent the styles from looking like scaled caps.
  for (let i = 0; i < 7; i++) {
    const angle = i / 7 * Math.PI * 2;
    add(ball, [Math.sin(angle) * .48, 2.48, -.2 + Math.cos(angle) * .39], [.24, .24, .24], [6]);
    add(cone, [Math.sin(angle) * .35, 2.48, -.2 + Math.cos(angle) * .3], [.27, .52, .27], [8], [Math.cos(angle) * .25, 0, -Math.sin(angle) * .25]);
  }
  for (let i = 0; i < 4; i++) add(cone, [0, 2.47, .17 - i * .23], [.16, .6, .23], [7]);
  add(ball, [-.23, 2.21, -.01], [.38, .3, .43], [9], [0, 0, -.25]);
  add(box, [.17, 2.12, .28], [.45, .18, .12], [9], [0, 0, .32]);
  for (let i = 0; i < 5; i++) add(ball, [Math.sin(i * Math.PI) * .07, 2.02 - i * .17, -.66], [.15, .17, .15], [10]);
  return parts;
}
