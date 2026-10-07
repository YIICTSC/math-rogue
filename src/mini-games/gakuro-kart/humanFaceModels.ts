import * as T from 'three';
import type { AvatarPart } from './avatarModels';

/** Layered eyes and curved brows keep all eight expressions legible at race scale. */
export function createHumanFaceParts(): AvatarPart[] {
  const parts: AvatarPart[] = [];
  const sphere = new T.SphereGeometry(1, 16, 12);
  const paint = (color: string) => new T.MeshStandardMaterial({ color, roughness: .72 });
  const ink = paint('#302939'), sclera = paint('#fff8ef'), iris = paint('#ffffff'), freckle=paint('#a07457');
  const sparkle = new T.MeshBasicMaterial({ color: '#ffffff' }), blush = paint('#eaa38f');
  const stroke = (points: number[][], radius = .012) => new T.TubeGeometry(
    new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p))), 12, radius, 5, false);
  const add = (geometry: T.BufferGeometry, material: T.Material, position: number[], scale: number[], expressions: number[], rotation = [0, 0, 0]) => {
    parts.push({ geometry, material, position, scale, rotation, motion: 'head',
      visible: a => a.species === 0 && expressions.includes(a.expression) });
  };
  const all = [0, 1, 2, 3, 4, 5, 6, 7];
  const arch = stroke([[-.085, -.01, 0], [0, .034, .006], [.085, -.01, 0]]);
  for(let style=0;style<6;style++) for (const side of [-1, 1]) {
    const start=parts.length;
    const open = side === 1 ? [0, 1, 3, 4, 5, 7] : [0, 1, 3, 4, 5, 6, 7];
    const x = side * .19;
    add(sphere, sclera, [x, 1.965, .335], [.111, .095, .035], open);
    add(sphere, iris, [x, 1.966, .368], [.067, .084, .022], open);parts.at(-1)!.color='eyeColor';
    add(sphere, ink, [x, 1.969, .389], [.034, .063, .013], open);
    add(sphere, sparkle, [x - .023, 2.005, .402], [.022, .025, .008], open);
    add(sphere, sparkle, [x + .022, 1.944, .395], [.01, .012, .006], open);
    add(arch, ink, [x, 2.036, .37], [1.18, .8, 1], open);
    add(arch, ink, [x, 1.964, .367], [1.06, 1, 1], side === 1 ? [2, 6] : [2]);
    add(arch, ink, [x, 2.108, .30], [.9, .5, 1], [0, 1, 2, 6]);
    add(arch, ink, [x, 2.103, .30], [.9, .4, 1], [3, 4], [0, 0, side * .22]);
    add(arch, ink, [x, 2.115, .30], [.85, .8, 1], [5, 7], [0, 0, -side * .18]);
    const width=[1,1.12,1.18,1.08,1.08,.93][style],height=[1,.78,.58,.82,.82,1.14][style];
    const tilt=style===3?side*.19:style===4?-side*.22:0;
    for(const part of parts.slice(start)){
      const visible=part.visible!;part.visible=a=>visible(a)&&(a.eyeStyle??0)===style;
      if(part.position[1]<2.08){
        const dx=part.position[0]-x,dy=part.position[1]-1.965;
        part.position[0]=x+dx*width*Math.cos(tilt)-dy*height*Math.sin(tilt);
        part.position[1]=1.965+dx*width*Math.sin(tilt)+dy*height*Math.cos(tilt);
        part.scale[0]*=width;part.scale[1]*=height;part.rotation[2]+=tilt;
      }
    }
  }
  for(const side of [-1,1]){
    add(sphere,blush,[side*.30,1.825,.325],[.068,.028,.011],all);
    parts.at(-1)!.visible=a=>a.species===0&&(a.faceStyle??0)===1;
    for(const [dx,dy] of [[-.035,0],[.012,.015],[.05,-.005]]){
      add(sphere,freckle,[side*(.28+dx),1.835+dy,.35],[.011,.01,.007],all);
      parts.at(-1)!.visible=a=>a.species===0&&(a.faceStyle??0)===2;
    }
  }
  add(sphere,ink,[.255,1.865,.36],[.016,.016,.008],all);parts.at(-1)!.visible=a=>a.species===0&&(a.faceStyle??0)===3;
  const smile = stroke([[-.075, .015, 0], [0, -.018, .003], [.075, .015, 0]], .011);
  add(smile, ink, [0, 1.725, .405], [.9, .7, 1], [0, 1, 6]);
  add(stroke([[-.056, 0, 0], [.056, 0, 0]], .01), ink, [0, 1.729, .405], [1, 1, 1], [3]);
  add(smile, ink, [0, 1.725, .405], [.85, -.8, 1], [4, 7]);
  add(sphere, ink, [0, 1.737, .405], [.048, .061, .019], [5]);
  add(sphere, ink, [0, 1.721, .405], [.095, .068, .023], [2]);
  add(sphere, sclera, [0, 1.751, .429], [.065, .016, .008], [2]);
  return parts;
}
