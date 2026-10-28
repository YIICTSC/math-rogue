import * as THREE from 'three';

export type CompanionId = 'mugi' | 'momo' | 'sora' | 'kohaku' | 'pico';
export const COMPANION_PALETTES: Record<CompanionId, { fur: string; cream: string; accent: string; ear: string }> = {
  mugi: { fur: '#c99969', cream: '#f0d2a0', accent: '#709f83', ear: '#ad785e' },
  momo: { fur: '#cbbce1', cream: '#fff1df', accent: '#eab3a0', ear: '#edc1d4' },
  sora: { fur: '#aa8269', cream: '#f3dbb9', accent: '#74b9b7', ear: '#c89d85' },
  kohaku: { fur: '#e7a484', cream: '#fff2db', accent: '#7cacc3', ear: '#c97e78' },
  pico: { fur: '#829baa', cream: '#fff4d9', accent: '#efd28a', ear: '#dfaa7b' },
};

export interface CompanionModel {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  arms: [THREE.Group, THREE.Group];
  legs: [THREE.Group, THREE.Group];
  eyes: THREE.Mesh[];
  ears: THREE.Group[];
  mouth: THREE.Mesh;
  tail: THREE.Group;
  food: THREE.Group;
  sparkles: THREE.Group;
  dispose: () => void;
}

/** Original, articulated clay characters. Shared geometry keeps the small mobile scene inexpensive. */
export function createCompanion(id: CompanionId): CompanionModel {
  const palette = COMPANION_PALETTES[id];
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const sphere = new THREE.SphereGeometry(1, 28, 20); geometries.add(sphere);
  const material = (color: string, roughness = .82) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }); materials.add(m); return m;
  };
  const fur = material(palette.fur), cream = material(palette.cream), accent = material(palette.accent);
  const inner = material(palette.ear), eyeMat = material('#3e3433', .4), white = material('#fffaf0', .5);
  const blush = material('#eeb6ac'), noseMat = material(id === 'pico' ? '#dca06b' : '#796051');
  const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group(), tail = new THREE.Group();
  root.add(body); body.add(head, tail); head.position.y = 1.61;
  const ellipsoid = (parent: THREE.Object3D, mat: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const mesh = new THREE.Mesh(sphere, mat); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); parent.add(mesh); return mesh;
  };
  const geometryMesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    geometries.add(geometry); const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  };
  const penguin = id === 'pico', rabbit = id === 'momo', fox = id === 'kohaku', capy = id === 'mugi';
  ellipsoid(body, fur, 0, .81, 0, penguin ? .53 : .45, .64, .36);
  ellipsoid(body, cream, 0, .82, .255, penguin ? .40 : .32, .48, .14);
  ellipsoid(head, fur, 0, 0, 0, capy ? .59 : .55, capy ? .49 : .53, .45);
  if (penguin) {
    ellipsoid(head, cream, -.18, -.02, .30, .30, .38, .18);
    ellipsoid(head, cream, .18, -.02, .30, .30, .38, .18);
  }
  if (fox) {
    for (const side of [-1, 1]) {
      ellipsoid(head, cream, side * .30, -.20, .33, .29, .19, .19).rotation.z = side * .30;
      ellipsoid(head, fur, side * .48, -.09, 0, .16, .17, .21).rotation.z = -side * .45;
    }
  } else if (!penguin) ellipsoid(head, cream, 0, -.17, .35, capy ? .46 : .34, capy ? .24 : .22, capy ? .22 : .17);
  const ears: THREE.Group[] = [];
  if (!penguin) for (const side of [-1, 1]) {
    const ear = new THREE.Group(); ear.position.set(side * (rabbit ? .28 : .40), rabbit ? .36 : .35, -.015); head.add(ear); ears.push(ear);
    if (rabbit) {
      ellipsoid(ear, fur, 0, .34, 0, .16, .50, .12);
      ellipsoid(ear, inner, 0, .35, .098, .087, .35, .035);
      ear.rotation.z = -side * .15;
    } else if (fox) {
      const tip = geometryMesh(ear, new THREE.ConeGeometry(.22, .48, 3, 1), fur, 0, .13, 0); tip.rotation.y = Math.PI;
      const patch = geometryMesh(ear, new THREE.ConeGeometry(.12, .31, 3, 1), inner, 0, .14, .09); patch.rotation.y = Math.PI;
      ear.rotation.z = -side * .14;
    } else {
      ellipsoid(ear, fur, 0, 0, 0, capy ? .15 : .16, capy ? .17 : .15, .12);
      ellipsoid(ear, inner, 0, 0, .095, .09, .10, .035);
    }
  }
  // Pico has raised cream face patches; its eyes and blush must sit in front of them.
  const eyes: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const eye = ellipsoid(head, eyeMat, side * (capy ? .26 : .205), .045, penguin ? .49 : .416, .058, capy ? .068 : .081, .034);
    eyes.push(eye);
    ellipsoid(eye, white, -.22, .32, .80, .25, .22, .18);
    ellipsoid(head, blush, side * .33, -.12, penguin ? .48 : .398, .085, .035, .025);
    if (id === 'sora') for (let i = 0; i < 2; i++) {
      const whisker = geometryMesh(head, new THREE.CapsuleGeometry(.008, .16, 3, 5), noseMat, side * .37, -.19 - i * .05, .47);
      whisker.rotation.z = side * (1.45 + i * .18);
    }
  }
  ellipsoid(head, noseMat, 0, -.105, capy ? .574 : .513, penguin ? .115 : .065, penguin ? .061 : .043, penguin ? .11 : .044);
  const mouth = geometryMesh(head, new THREE.TorusGeometry(.080, .014, 8, 20, Math.PI), eyeMat, 0, -.205, capy ? .572 : .507);
  mouth.rotation.z = Math.PI;
  if (capy) ellipsoid(head, white, 0, -.26, .57, .04, .026, .018);
  const arms = [new THREE.Group(), new THREE.Group()] as [THREE.Group, THREE.Group];
  const legs = [new THREE.Group(), new THREE.Group()] as [THREE.Group, THREE.Group];
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1;
    arms[i].position.set(side * .42, 1.12, 0); body.add(arms[i]);
    const arm = ellipsoid(arms[i], fur, side * .035, -.23, 0, penguin ? .12 : .14, penguin ? .36 : .29, penguin ? .085 : .15);
    arm.rotation.z = side * -.12;
    if (!penguin) ellipsoid(arms[i], cream, side * .04, -.43, .035, .12, .105, .12);
    legs[i].position.set(side * .22, .34, 0); body.add(legs[i]);
    ellipsoid(legs[i], penguin ? noseMat : fur, 0, -.14, .08, .19, penguin ? .12 : .21, .27);
    if (!penguin) ellipsoid(legs[i], cream, 0, -.17, .25, .14, .095, .075);
  }
  tail.position.set(fox ? .29 : .15, .5, -.26);
  if (fox) {
    ellipsoid(tail, fur, .28, .08, -.12, .28, .40, .24).rotation.z = -.8;
    ellipsoid(tail, cream, .49, .31, -.15, .23, .22, .20).rotation.z = -.8;
  } else if (id === 'sora') ellipsoid(tail, fur, .18, -.15, -.20, .15, .37, .17).rotation.x = .55;
  else if (rabbit) ellipsoid(tail, cream, .22, 0, 0, .19, .18, .19);
  else if (penguin) ellipsoid(tail, fur, 0, -.10, -.08, .18, .12, .23);
  // Each friend has a small recognisable accessory, independent of body animation.
  if (id === 'sora') {
    const strap = geometryMesh(body, new THREE.TorusGeometry(.43, .043, 8, 32), accent, 0, 1.03, 0);
    strap.scale.set(1, 1.1, .86); strap.rotation.z = -.48; strap.rotation.y = .25;
    ellipsoid(body, accent, .39, .64, .22, .19, .23, .095);
    ellipsoid(body, cream, .39, .71, .307, .14, .08, .025);
    ellipsoid(body, noseMat, .39, .64, .321, .025, .025, .02);
  } else {
    const scarf = geometryMesh(body, new THREE.TorusGeometry(.32, .065, 10, 32), accent, 0, 1.24, .035);
    scarf.rotation.x = Math.PI / 2; scarf.scale.z = .75;
    if (penguin) {
      for (const side of [-1, 1]) ellipsoid(body, accent, side * .10, 1.22, .36, .11, .065, .045).rotation.z = side * .35;
      ellipsoid(body, accent, 0, 1.22, .40, .045, .045, .025);
    } else {
      const knot = ellipsoid(body, accent, .21, 1.23, .31, .10, .075, .065);
      knot.rotation.z = -.3;
      ellipsoid(body, accent, .22, 1.08, .32, .09, .16, .035).rotation.z = -.22;
    }
  }
  const food = new THREE.Group(); arms[1].add(food); food.position.set(.06, -.41, .16); food.visible = false;
  ellipsoid(food, material('#d6ad73'), 0, 0, 0, .15, .15, .06);
  for (const p of [[-.04, .06], [.07, .02], [-.03, -.07]]) ellipsoid(food, noseMat, p[0], p[1], .056, .018, .018, .012);
  const sparkles = new THREE.Group(); root.add(sparkles); sparkles.visible = false;
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -.1); heartShape.bezierCurveTo(-.25, .03, -.21, .22, -.08, .20);
  heartShape.quadraticCurveTo(0, .19, 0, .12); heartShape.quadraticCurveTo(0, .19, .08, .20);
  heartShape.bezierCurveTo(.21, .22, .25, .03, 0, -.1);
  const heartGeo = new THREE.ShapeGeometry(heartShape); geometries.add(heartGeo);
  const heartMat = new THREE.MeshBasicMaterial({ color: '#ed9b9a', transparent: true, opacity: .90, side: THREE.DoubleSide }); materials.add(heartMat);
  for (let i = 0; i < 3; i++) {
    const heart = new THREE.Mesh(heartGeo, heartMat); heart.position.set(i === 1 ? .66 : -.68, 1.55 + i * .26, .1); heart.scale.setScalar(.7 + i * .12); sparkles.add(heart);
  }
  return { root, body, head, arms, legs, eyes, ears, mouth, tail, food, sparkles,
    dispose: () => { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); },
  };
}

export function animateCompanion(model: CompanionModel, time: number, reaction: string, elapsed: number, reduced: boolean) {
  const { body, head, arms, legs, eyes, tail, food, sparkles } = model;
  const t = reduced ? 0 : time;
  const active = elapsed < 4.8;
  const normalized = reaction === 'happy' ? 'joy' : reaction;
  const action = active ? normalized : 'idle';
  const breathe = Math.sin(t * 1.9);
  body.position.y = reduced ? 0 : .012 * breathe;
  body.rotation.set(0, .10 + Math.sin(t * .45) * .035, 0);
  body.scale.set(1, 1 + .006 * breathe, 1);
  head.rotation.set(0, Math.sin(t * .5) * .05, Math.sin(t * .75) * .025);
  arms[0].rotation.set(0, 0, -.10); arms[1].rotation.set(0, 0, .10);
  legs[0].rotation.set(0, 0, 0); legs[1].rotation.set(0, 0, 0);
  tail.rotation.y = Math.sin(t * 1.5) * .1;
  const blink = !reduced && (t % 5.4 < .14 || (t + 2.8) % 8.6 < .10);
  eyes.forEach(eye => { eye.scale.y = eye.userData.openHeight ?? (eye.userData.openHeight = eye.scale.y); if (blink || action === 'sleep') eye.scale.y *= .08; });
  food.visible = action === 'eat'; sparkles.visible = action === 'joy' || action === 'dance';
  if (action === 'wave') {
    arms[1].rotation.z = 2.3 + Math.sin(t * 8) * .22; arms[1].rotation.x = -.20;
    head.rotation.z = -.07;
  } else if (action === 'joy' || action === 'dance') {
    const bob = reduced ? 0 : Math.abs(Math.sin(t * 5));
    body.position.y += bob * .13;
    body.rotation.z = Math.sin(t * 5) * (action === 'dance' ? .14 : .05);
    arms[0].rotation.z = -1.15 - bob * .4; arms[1].rotation.z = 1.15 + bob * .4;
    if (action === 'dance') { legs[0].rotation.x = Math.sin(t * 5) * .3; legs[1].rotation.x = -legs[0].rotation.x; }
  } else if (action === 'surprise') {
    head.rotation.x = -.10; body.position.y += reduced ? 0 : Math.max(0, Math.sin(Math.min(elapsed, .8) * Math.PI / .8)) * .12;
    arms[0].rotation.z = -.6; arms[1].rotation.z = .6;
  } else if (action === 'shy') {
    head.rotation.z = .13; head.rotation.y = -.16;
    arms[0].rotation.x = -.6; arms[1].rotation.x = -.6;
    arms[0].rotation.z = -.42; arms[1].rotation.z = .42;
  } else if (action === 'think') {
    head.rotation.z = -.14; arms[0].rotation.z = -1.05; arms[0].rotation.x = -1.1;
    head.rotation.y = -.14;
  } else if (action === 'eat') {
    arms[1].rotation.x = -1.2; arms[1].rotation.z = .9;
    head.rotation.x = .07 + Math.sin(t * 7) * .045;
  } else if (action === 'sleep') {
    head.rotation.z = .16; head.rotation.x = .11; body.scale.y = .96;
    arms[0].rotation.x = -.25; arms[1].rotation.x = -.25;
  } else if (action === 'walk') {
    legs[0].rotation.x = Math.sin(t * 6) * .43; legs[1].rotation.x = -legs[0].rotation.x;
    arms[0].rotation.x = -legs[0].rotation.x * .7; arms[1].rotation.x = legs[0].rotation.x * .7;
    body.position.y += Math.abs(Math.sin(t * 6)) * .035;
  }
  model.ears.forEach((ear, i) => { const base = i === 0 ? .15 : -.15; ear.rotation.z = base + (reduced ? 0 : Math.sin(t * 1.5 + i) * .035); });
  sparkles.children.forEach((heart, i) => { heart.position.y = 1.6 + i * .24 + (reduced ? 0 : (t * .38 + i * .20) % .7); heart.rotation.z = Math.sin(t + i) * .16; });
}
