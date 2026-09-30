import * as T from 'three';
import type { AvatarPart } from './avatarModels';

/** Shared face assets work on human, animal and robot heads. */
export function createExpressionParts(): AvatarPart[] {
  const parts: AvatarPart[] = [], ball = new T.SphereGeometry(1, 12, 8);
  const dark = new T.MeshStandardMaterial({ color: '#17243a', roughness: .6 });
  const white = new T.MeshStandardMaterial({ color: '#fff8ef' });
  const pink = new T.MeshStandardMaterial({ color: '#ef7b94' });
  const add = (geometry: T.BufferGeometry, material: T.Material, position: number[], scale: number[], expressions: number[], species?: number[], rotation = [0, 0, 0]) => {
    const robotEyes = material === dark && position[1] >= 1.85;
    parts.push({ geometry, material, position, scale, rotation, visible: a => expressions.includes(a.expression) && (!species || species.includes(a.species)) && (!robotEyes || a.species !== 7) });
    if (robotEyes) parts.push({ geometry, material: white, position, scale, rotation, visible: a => a.species === 7 && expressions.includes(a.expression) });
  };
  const line = (points: number[][], width = .02) => new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p))), 10, width, 5, false);
  const smile = line([[-.14, .045, 0], [0, -.035, 0], [.14, .045, 0]]);
  const closedEye = line([[-.09, 0, 0], [0, .045, 0], [.09, 0, 0]]);
  const flat = line([[-.09, 0, 0], [.09, 0, 0]]);
  for (const side of [-1, 1]) {
    const open = side === 1 ? [0, 1, 3, 4, 5] : [0, 1, 3, 4, 5, 6];
    add(ball, dark, [side * .2, 1.96, .43], [.085, .11, .04], open);
    add(ball, white, [side * .2 - .02, 2, .47], [.025, .03, .015], open);
    add(closedEye, dark, [side * .2, 1.96, .45], [1, 1, 1], side === 1 ? [2, 6] : [2]);
    add(flat, dark, [side * .2, 1.95, .45], [1, 1, 1], [7]);
    add(flat, dark, [side * .2, 2.12, .4], [1, 1, 1], [3], undefined, [0, 0, side * .16]);
    add(flat, dark, [side * .2, 2.1, .42], [1, 1, 1], [4], undefined, [0, 0, side * .42]);
    add(closedEye, dark, [side * .2, 2.17, .39], [1, 1, 1], [5]);
    add(ball, pink, [side * .35, 1.8, .36], [.1, .04, .025], [1, 2, 6]);
  }
  // Place mouths on the muzzle surface so animal expressions remain visible.
  for (const [species, depth, height] of [[[0, 3, 7], .42, 1.69], [[1, 4], .52, 1.67], [[2], .64, 1.68], [[5], .49, 1.64]] as [number[], number, number][]) {
    add(flat, dark, [0, height, depth], [1.3, 1, 1], [0, 3], species);
    add(smile, dark, [0, height, depth], [1, 1, 1], [1, 6], species);
    add(ball, dark, [0, height, depth], [.16, .11, .04], [2], species);
    add(ball, white, [0, height + .055, depth + .035], [.11, .025, .015], [2], species);
    add(smile, dark, [0, height, depth], [1, -1, 1], [4], species);
    add(ball, dark, [0, height, depth], [.075, .1, .035], [5], species);
    add(ball, dark, [0, height, depth], [.06, .055, .03], [7], species);
  }
  return parts;
}
