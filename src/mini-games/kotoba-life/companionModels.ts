import * as THREE from 'three';
import { createPlushWorkshop } from './companionSurface';

export type CompanionId = 'mugi' | 'momo' | 'sora' | 'kohaku' | 'pico';
export const COMPANION_PALETTES: Record<CompanionId, { fur: string; cream: string; accent: string; ear: string }> = {
  mugi: { fur: '#c58d52', cream: '#e8c18c', accent: '#8e9c6a', ear: '#906448' },
  momo: { fur: '#b9a4c5', cream: '#f6e4d3', accent: '#de9e80', ear: '#edc2ba' },
  sora: { fur: '#916c55', cream: '#f2d9b6', accent: '#75a6a0', ear: '#76523e' },
  kohaku: { fur: '#dd946b', cream: '#fff0d6', accent: '#82a9b1', ear: '#ba7961' },
  pico: { fur: '#717f98', cream: '#fff0d5', accent: '#e1b855', ear: '#dfa744' },
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

/** Five articulated plush sculptures, shaped and coloured against the title illustration. */
export function createCompanion(id: CompanionId): CompanionModel {
  const p = COMPANION_PALETTES[id], w = createPlushWorkshop();
  const { plush, ball, mesh, thread } = w;
  const capy = id === 'mugi', rabbit = id === 'momo', otter = id === 'sora', fox = id === 'kohaku', penguin = id === 'pico';
  const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group(), tail = new THREE.Group();
  root.name = `plush-${id}`; root.add(body); body.add(head, tail);
  head.position.y = capy ? 1.61 : fox ? 1.64 : penguin ? 1.45 : 1.53;
  const furColor = new THREE.Color(p.fur), creamColor = new THREE.Color(p.cream), pink = new THREE.Color('#e6a496');
  const dark = w.smooth('#291d19', .19), nose = w.smooth(capy ? '#6f4430' : '#694a40', .4);
  const gold = w.smooth('#e4ad43', .6), lip = w.smooth('#724036', .9), tongue = w.smooth('#d58279', .85);
  const cloth = w.cloth(p.accent), seams = w.cloth(penguin ? '#cba955' : '#c9c9a8');
  const facePigment = (u: THREE.Vector3) => {
    const front = THREE.MathUtils.smoothstep(u.z, .30, .65);
    let mask = 0;
    if (penguin) {
      // A heart-shaped white mask, integral to the rounded head surface.
      const oval = Math.pow((Math.abs(u.x) - .37) / .48, 2) + Math.pow((u.y + .25) / .87, 2);
      mask = (1 - THREE.MathUtils.smoothstep(oval, .85, 1.07)) * front;
    } else if (!capy) {
      const border = fox ? -.30 + Math.abs(u.x) * .49 : otter ? -.14 - Math.abs(u.x) * .07 : -.32 + Math.abs(u.x) * .08;
      mask = (1 - THREE.MathUtils.smoothstep(u.y, border - .035, border + .035)) * front;
    }
    const c = furColor.clone().lerp(creamColor, mask);
    const cheek = Math.exp(-Math.pow((Math.abs(u.x) - .64) / .17, 2) - Math.pow((u.y + .24) / .14, 2));
    return c.lerp(pink, cheek * front * (otter ? .55 : .7));
  };
  const belly = (u: THREE.Vector3) => {
    const patch = Math.pow(u.x / .75, 2) + Math.pow((u.y + .12) / .88, 2);
    return furColor.clone().lerp(creamColor, (1 - THREE.MathUtils.smoothstep(patch, .82, 1.02)) * THREE.MathUtils.smoothstep(u.z, .2, .7));
  };
  const pear = (u: THREE.Vector3) => u.set(u.x * (1 - .13 * u.y), u.y, u.z * (1 - .06 * u.y));
  plush(body, [0, .76, 0], [penguin ? .52 : capy ? .47 : .43, .60, .36], belly, { count: 5000, detail: true, shape: pear });
  const headSize = [capy ? .64 : fox ? .61 : .57, capy ? .52 : penguin ? .52 : .49, capy ? .47 : .43];
  plush(head, [0, 0, 0], headSize, facePigment, { count: 9000, detail: true, shape: u => {
    if (capy) { u.x = Math.sign(u.x) * Math.pow(Math.abs(u.x), .87); u.y = Math.sign(u.y) * Math.pow(Math.abs(u.y), .88); }
    if (rabbit) u.x *= 1 - .09 * u.y;
    if (fox) u.x *= 1 - .09 * u.y + .15 * Math.exp(-Math.pow((u.y + .23) / .30, 2));
    return u;
  } });
  const ears: THREE.Group[] = [];
  if (!penguin) for (const side of [-1, 1]) {
    const ear = new THREE.Group(); head.add(ear); ears.push(ear);
    ear.position.set(side * (rabbit ? .25 : fox ? .40 : .44), rabbit ? .37 : fox ? .38 : .34, -.015);
    ear.rotation.z = -side * (rabbit ? .13 : fox ? .3 : .16); ear.userData.restTilt = ear.rotation.z;
    if (rabbit) {
      plush(ear, [0, .33, 0], [.155, .53, .12], p.fur, { count: 1800, length: .014 });
      plush(ear, [0, .35, .097], [.082, .38, .032], p.ear, { count: 750, length: .006 });
    } else if (fox) {
      const taper = (u: THREE.Vector3) => u.set(u.x * (1 - .48 * u.y), u.y, u.z);
      plush(ear, [0, .18, 0], [.215, .36, .13], '#995e46', { count: 1300, shape: taper });
      plush(ear, [0, .17, .047], [.182, .30, .11], p.fur, { count: 950, shape: taper });
      plush(ear, [0, .17, .133], [.113, .225, .034], p.cream, { count: 650, shape: taper });
    } else {
      plush(ear, [0, 0, 0], [capy ? .145 : .13, .155, .11], p.fur, { count: 750 });
      plush(ear, [0, .004, .085], [.087, .10, .035], p.ear, { count: 300, length: .006 });
    }
  }
  if (capy) {
    // Broad brown split muzzle, rather than the former teddy-bear cream oval.
    for (const side of [-1, 1]) {
      plush(head, [side * .105, -.065, .423], [.18, .265, .135], '#9b694a', { count: 1600, length: .007 });
      const nostril = ball(head, nose, [side * .066, .074, .557], [.016, .025, .010]); nostril.rotation.z = side * -.35;
    }
  } else if (!penguin) {
    for (const side of [-1, 1]) plush(head, [side * .077, -.145, .394], [.13, .095, .074], p.cream, { count: 450, length: .006 });
    const n = ball(head, nose, [0, -.084, .479], [rabbit ? .035 : .052, .031, .029]); n.rotation.z = Math.PI;
  }
  const eyes: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const x = side * (capy ? .33 : .235), y = capy ? .005 : penguin ? -.023 : .015;
    // Small glass eyes protrude beyond the head and pile; highlights follow the blink.
    const eye = ball(head, dark, [x, y, capy ? .426 : .403], [.052, .065, .041]);
    eyes.push(eye);
    const glint = w.ownMaterial(new THREE.MeshBasicMaterial({ color: '#fff7e7' }));
    ball(eye, glint, [-.27, .34, .86], [.23, .19, .09]);
    ball(eye, glint, [.26, -.29, .89], [.09, .075, .05]);
    if (otter) for (let i = 0; i < 3; i++) {
      thread(head, [[side * .30, -.16 - i * .04, .355], [side * .43, -.15 - i * .05, .38], [side * .58, -.12 - i * .065, .38]], seams, .003);
    }
  }
  // Actual inset mouth with tongue; a unit transform leaves speaking animation well-defined.
  const mouthShape = new THREE.Shape();
  mouthShape.moveTo(-.066, .022); mouthShape.quadraticCurveTo(0, -.012, .066, .022);
  mouthShape.bezierCurveTo(.060, -.075, -.053, -.085, -.066, .022);
  const mouth = mesh(head, new THREE.ShapeGeometry(mouthShape, 20), lip);
  mouth.position.set(0, capy ? -.29 : penguin ? -.19 : -.205, capy ? .465 : .427);
  ball(mouth, tongue, [0, -.044, .003], [.034, .021, .007]);
  if (penguin) {
    ball(head, gold, [0, -.126, .434], [.104, .052, .09]);
    ball(mouth, gold, [0, .019, .035], [.09, .029, .067]);
    thread(head, [[-.085, -.161, .483], [0, -.174, .521], [.085, -.161, .483]], nose, .003);
  } else if (!capy) {
    thread(head, [[0, -.107, .477], [0, -.16, .472], [-.035, -.184, .462], [-.070, -.17, .446]], lip, .004);
    thread(head, [[0, -.16, .472], [.035, -.184, .462], [.070, -.17, .446]], lip, .004);
  }
  const arms: [THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group()];
  const legs: [THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group()];
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1;
    arms[i].position.set(side * (penguin ? .43 : .38), 1.08, .015); body.add(arms[i]);
    plush(arms[i], [side * .045, -.22, .025], [penguin ? .13 : .155, penguin ? .33 : .275, penguin ? .09 : .16], p.fur, { count: 1400 });
    if (!penguin) {
      plush(arms[i], [side * .045, -.41, .055], [.139, .132, .145], p.fur, { count: 600 });
      // Tiny stitched toes, visible when waving, avoid mitten-like white end caps.
      for (const dx of [-.045, .015]) thread(arms[i], [[side * .045 + dx, -.41, .194], [side * .045 + dx, -.447, .191]], nose, .003);
    }
    legs[i].position.set(side * .21, .28, .035); body.add(legs[i]);
    if (penguin) ball(legs[i], gold, [0, -.15, .10], [.18, .10, .25]);
    else {
      plush(legs[i], [0, -.105, .09], [.19, .18, .235], p.fur, { count: 1000 });
      if (rabbit) plush(legs[i], [0, -.11, .307], [.115, .105, .045], p.cream, { count: 300, length: .006 });
    }
    for (const dx of [-.045, .045]) thread(legs[i], [[dx, -.10, .297], [dx, -.15, .304]], penguin ? gold : nose, .003);
  }
  tail.position.set(fox ? .29 : .14, .50, -.25);
  if (fox) {
    // A single curved, tapered brush with a cream tip (no stacked tail blobs).
    const curve = (u: THREE.Vector3) => { const v = (u.y + 1) / 2; return u.set(u.x * (1 - .28 * u.y) + v * 1.35, u.y, u.z); };
    plush(tail, [.10, .17, -.03], [.29, .58, .25], u => furColor.clone().lerp(creamColor, THREE.MathUtils.smoothstep(u.y, .18, .27)), { count: 4200, length: .024, detail: true, shape: curve });
    tail.rotation.z = -.25;
  } else if (otter) plush(tail, [.13, -.12, -.12], [.13, .32, .17], p.fur, { count: 900 }).rotation.x = .60;
  else if (rabbit) plush(tail, [.21, 0, 0], [.18, .17, .18], p.cream, { count: 1000, length: .024 });
  else if (penguin) plush(tail, [0, -.10, -.08], [.17, .11, .23], p.fur, { count: 400 });

  const collarY = penguin ? 1.08 : capy ? 1.19 : 1.14;
  if (otter) {
    // Flat fabric shoulder strap across the chest; a rounded, stitched pouch at the hip.
    const strapGeo = new THREE.PlaneGeometry(.085, .82, 3, 16);
    const strap = mesh(body, strapGeo, cloth); strap.position.set(.03, .96, .35); strap.rotation.z = .80;
    const bag = new THREE.Group(); body.add(bag); bag.position.set(.42, .59, .25); bag.rotation.z = .12;
    const rounded = (u: THREE.Vector3) => u.set(Math.sign(u.x) * Math.pow(Math.abs(u.x), .55), Math.sign(u.y) * Math.pow(Math.abs(u.y), .6), u.z);
    plush(bag, [0, 0, 0], [.18, .20, .085], p.accent, { count: 0, shape: rounded });
    ball(bag, cloth, [0, .096, .064], [.182, .106, .04]);
    thread(bag, [[-.145, .04, .075], [-.145, -.145, .065], [0, -.17, .075], [.145, -.145, .065], [.145, .04, .075]], seams, .003);
    ball(bag, gold, [0, .058, .102], [.023, .023, .009]);
  } else {
    const collar = mesh(body, new THREE.TorusGeometry(.305, penguin ? .031 : .057, 12, 64), cloth);
    collar.rotation.x = Math.PI / 2; collar.position.set(0, collarY, .025); collar.scale.set(1, 1, .80);
    if (penguin) {
      for (const side of [-1, 1]) {
        const wing = ball(body, cloth, [side * .10, collarY, .347], [.115, .077, .047]); wing.rotation.z = side * -.3;
        thread(body, [[side * .055, collarY, .387], [side * .115, collarY + .022, .39]], seams, .003);
      }
      ball(body, cloth, [0, collarY, .397], [.045, .055, .031]);
    } else if (capy) {
      const bandana = new THREE.BufferGeometry();
      const pts: number[] = [], uv: number[] = [], indices: number[] = [];
      const rows = 18;
      for (let row = 0; row <= rows; row++) for (let col = 0; col <= rows; col++) {
        const v = row / rows, u = col / rows, x = (u - .5) * .64 * (1 - .93 * v);
        pts.push(x, collarY - v * .34, .325 + .10 * Math.sin(v * Math.PI * .7) + .012 * Math.cos(u * Math.PI * 5) * Math.sin(v * Math.PI)); uv.push(u, v);
        if (row < rows && col < rows) { const a = row * (rows + 1) + col, b = a + rows + 1; indices.push(a, b, a + 1, a + 1, b, b + 1); }
      }
      bandana.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); bandana.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); bandana.setIndex(indices); bandana.computeVertexNormals(); mesh(body, bandana, cloth);
      thread(body, [[-.29, collarY - .025, .338], [-.17, collarY - .17, .398], [0, collarY - .32, .416], [.17, collarY - .17, .398], [.29, collarY - .025, .338]], seams, .0025);
    } else {
      ball(body, cloth, [.22, collarY, .25], [.095, .073, .065]);
      const end = ball(body, cloth, [.25, collarY - .14, .30], [.084, .18, .028]); end.rotation.z = -.25;
      if (rabbit) {
        const backEnd = ball(body, cloth, [.31, collarY - .11, .26], [.08, .17, .025]); backEnd.rotation.z = -.6;
        for (let i = 0; i < 6; i++) thread(body, [[.225 + i * .022, collarY - .283, .323], [.22 + i * .023, collarY - .32, .323]], cloth, .005);
      }
      thread(body, [[.20, collarY - .06, .33], [.22, collarY - .20, .33], [.25, collarY - .27, .33]], seams, .0025);
    }
  }
  const food = new THREE.Group(); arms[1].add(food); food.position.set(.06, -.41, .16); food.visible = false;
  ball(food, w.cloth('#d6ad73'), [0, 0, 0], [.15, .15, .06]);
  for (const [x, y] of [[-.04, .06], [.07, .02], [-.03, -.07]]) ball(food, nose, [x, y, .056], [.018, .018, .012]);
  const sparkles = new THREE.Group(); root.add(sparkles); sparkles.visible = false;
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -.1); heartShape.bezierCurveTo(-.25, .03, -.21, .22, -.08, .20);
  heartShape.quadraticCurveTo(0, .19, 0, .12); heartShape.quadraticCurveTo(0, .19, .08, .20);
  heartShape.bezierCurveTo(.21, .22, .25, .03, 0, -.1);
  const heartGeo = new THREE.ShapeGeometry(heartShape);
  const heartMat = w.ownMaterial(new THREE.MeshBasicMaterial({ color: '#ed9b9a', transparent: true, opacity: .9, side: THREE.DoubleSide }));
  for (let i = 0; i < 3; i++) { const heart = mesh(sparkles, heartGeo, heartMat); heart.position.set(i === 1 ? .66 : -.68, 1.55 + i * .26, .1); heart.scale.setScalar(.7 + i * .12); heart.castShadow = false; }
  return { root, body, head, arms, legs, eyes, ears, mouth, tail, food, sparkles, dispose: w.dispose };
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
  model.ears.forEach((ear, i) => { const base = ear.userData.restTilt ?? (i === 0 ? .15 : -.15); ear.rotation.z = base + (reduced ? 0 : Math.sin(t * 1.5 + i) * .035); });
  sparkles.children.forEach((heart, i) => { heart.position.y = 1.6 + i * .24 + (reduced ? 0 : (t * .38 + i * .20) % .7); heart.rotation.z = Math.sin(t + i) * .16; });
}
