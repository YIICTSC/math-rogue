import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RUNWAY, type Airport } from './courses';
import { BUILDINGS, GRID, groundHeight, SEA_LEVEL, TILE } from './terrain';
import { Workshop } from './aircraftModels';

function randomSequence(seed: number) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function makeTerrain(airport: Airport) {
  const positions: number[] = [],
    colors: number[] = [];
  const grass = new THREE.Color(airport.grass),
    tint = new THREE.Color(),
    sand = new THREE.Color(0xeed6a0);
  const snowy = airport.region === 'snow' || airport.region === 'alps';
  const triangle = (a: number[], b: number[], c: number[], color: THREE.Color) => {
    positions.push(...a, ...b, ...c);
    for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b);
  };
  for (let iz = -GRID; iz < GRID; iz++)
    for (let ix = -GRID; ix < GRID; ix++) {
      const x = ix * TILE,
        z = iz * TILE,
        h = (x: number, z: number) => groundHeight(airport, x, z);
      const a = [x, h(x, z), z],
        b = [x + TILE, h(x + TILE, z), z],
        c = [x, h(x, z + TILE), z + TILE],
        d = [x + TILE, h(x + TILE, z + TILE), z + TILE];
      const average = (a[1] + b[1] + c[1] + d[1]) / 4;
      const patch = Math.sin(Math.floor(ix / 2) * 31 + Math.floor(iz / 3) * 15.1) * 0.055;
      tint.copy(grass).multiplyScalar(0.94 + patch + 0.027 * Math.sin(ix * 5.23 + iz * 2));
      if (average < -0.6) tint.lerp(sand, airport.region === 'reef' ? 0.87 : 0.55);
      if (average > 98)
        tint.lerp(
          new THREE.Color(snowy ? 0xf8f4df : 0x69846e),
          Math.min(0.9, (average - 98) / 185),
        );
      triangle(a, c, b, tint);
      triangle(b, c, d, tint);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
  );
}

// Static scenery shares one draw call per paint, even for hundreds of trees and lamps.
function batch(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const paints = new Map<THREE.Material, THREE.BufferGeometry[]>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
    const geom = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geom.applyMatrix4(object.matrixWorld);
    const list = paints.get(object.material) ?? [];
    list.push(geom);
    paints.set(object.material, list);
  });
  group.clear();
  for (const [material, pieces] of paints) {
    const merged = mergeGeometries(pieces);
    for (const piece of pieces) piece.dispose();
    if (merged) group.add(new THREE.Mesh(merged, material));
  }
}

export function makeAirfield(airport: Airport, w: Workshop) {
  const field = new THREE.Group(),
    scenery = new THREE.Group();
  const random = randomSequence(airport.code.charCodeAt(0) * 31 + airport.code.charCodeAt(2));
  const box = (
    color: number,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
  ) => w.part(scenery, w.box, color, [x, y, z], [width, height, depth]);
  const white = 0xffefd1,
    asphalt = 0x405161,
    steel = 0x3c6472,
    red = 0xd35338;
  field.add(makeTerrain(airport));
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(8700, 8700),
    new THREE.MeshLambertMaterial({ color: airport.sea }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = SEA_LEVEL + 0.03;
  field.add(sea);
  for (let i = 0; i < 250; i++) {
    const x = (random() - 0.5) * 3000,
      z = (random() - 0.5) * 3000;
    if (groundHeight(airport, x, z) < SEA_LEVEL - 1)
      box(0x94d1d1, x, SEA_LEVEL + 0.12, z, 8 + random() * 24, 0.05, 1.2);
  }
  box(asphalt, 0, 0.07, 0, RUNWAY.halfWidth * 2, 0.14, RUNWAY.halfLength * 2);
  box(0x718387, 94, 0.08, 30, 117, 0.16, 352);
  for (const side of [-1, 1]) {
    box(white, side * 30, 0.18, 0, 0.84, 0.08, 612);
    for (let i = 0; i < 7; i++) box(white, side * (4 + i * 3.55), 0.2, -291, 1.8, 0.1, 17);
    for (let i = 0; i < 7; i++) box(white, side * (4 + i * 3.55), 0.2, 291, 1.8, 0.1, 17);
    for (let z = -300; z <= 300; z += 25) box(0xffd36f, side * 33, 0.54, z, 1.4, 0.85, 1.4);
  }
  for (let z = -230; z <= 230; z += 32) box(white, 0, 0.2, z, 1.8, 0.1, 15);
  for (const z of [-114, 120]) box(0xecc86d, 64, 0.22, z, 62, 0.1, 0.72);
  for (const b of BUILDINGS) {
    box(b.kind === 'tower' ? white : 0xd7cabc, b.x, b.h * 0.5, b.z, b.w, b.h, b.d);
    if (b.kind === 'tower') {
      box(steel, b.x, b.h - 4, b.z, 15, 6, 16);
      box(red, b.x, b.h, b.z, 17, 2, 19);
      box(white, b.x, b.h + 3, b.z, 0.6, 5, 0.6);
    } else {
      box(b.kind === 'terminal' ? steel : 0x6599a2, b.x, b.h - 0.5, b.z, b.w + 2, 2, b.d + 2);
      box(
        b.kind === 'terminal' ? 0x4a8ba1 : asphalt,
        b.x - b.w / 2 - 0.15,
        b.h * 0.51,
        b.z,
        0.45,
        b.h * 0.59,
        b.d * 0.85,
      );
      if (b.kind === 'terminal')
        for (let z = b.z - b.d / 2 + 9; z < b.z + b.d / 2; z += 17)
          box(white, b.x - b.w / 2 - 0.7, 6, z, 1.3, 8, 1);
    }
  }
  function tree(x: number, z: number) {
    const y = groundHeight(airport, x, z),
      s = 4 + random() * 5;
    if (y < -0.35) return;
    box(0x846e4e, x, y + s * 0.6, z, s * 0.26, s * 1.25, s * 0.26);
    if (airport.region === 'reef') {
      for (let j = 0; j < 4; j++) {
        const angle = (j * Math.PI) / 2 + 0.3;
        const leaf = w.part(
          scenery,
          w.pebble,
          0x4a996a,
          [x + Math.cos(angle) * s * 0.6, y + s * 1.3, z + Math.sin(angle) * s * 0.6],
          [s, 1.2, s * 0.33],
        );
        leaf.rotation.y = -angle;
      }
    } else {
      w.part(
        scenery,
        w.cone,
        airport.region === 'snow' ? 0x548581 : 0x467e68,
        [x, y + s * 1.15, z],
        [s * 0.69, s * 1.8, s * 0.69],
      );
      if (airport.region === 'snow')
        w.part(scenery, w.cone, 0xeaf0dd, [x, y + s * 1.62, z], [s * 0.48, s * 1.11, s * 0.48]);
    }
  }
  for (let i = 0; i < 285; i++) {
    const x = (random() - 0.5) * 1850,
      z = (random() - 0.5) * 1770;
    if (Math.abs(x) > 195 || Math.abs(z) > 550) tree(x, z);
  }
  if (['bay', 'port', 'island'].includes(airport.region)) {
    // The causeway reaches the mainland to the east.
    box(steel, 790, 9, -440, 950, 3.8, 14);
    for (let x = 342; x < 1270; x += 65) box(white, x, 1, -440, 4, 16, 11);
    const bridgeColor = airport.region === 'bay' ? red : 0xe8ddc1;
    for (const x of [550, 720]) {
      for (const z of [-449, -431]) {
        box(bridgeColor, x, 27, z, 4, 48, 4);
        for (const offset of [-55, -28, 28, 55])
          w.rod(scenery, bridgeColor, [x, 47, z], [x + offset, 11, z], 0.7);
      }
    }
    if (airport.region === 'bay')
      for (let i = 0; i < 54; i++) {
        const x = 870 + random() * 480,
          z = -890 + random() * 900,
          h = 23 + random() * 102;
        box(
          i % 3 ? 0x829aa4 : 0xb7bab5,
          x,
          groundHeight(airport, x, z) + h / 2,
          z,
          18 + random() * 20,
          h,
          24,
        );
      }
    if (airport.region === 'port')
      for (let i = 0; i < 6; i++) {
        const z = -180 + i * 60;
        box(red, 244, 18, z, 3, 37, 3);
        box(red, 253, 36, z, 34, 3.5, 3);
        box(steel, 269, 29, z, 1, 13, 1);
      }
  }
  if (airport.region === 'alps' || airport.region === 'volcano' || airport.region === 'snow') {
    const volcano = airport.region === 'volcano';
    const count = volcano ? 1 : 11;
    for (let i = 0; i < count; i++) {
      const x = volcano ? -490 : (i - 5) * 304,
        z = -1260 - random() * 330,
        h = volcano ? 465 : 185 + random() * 248;
      w.part(
        scenery,
        w.cone,
        volcano ? 0x657978 : 0x829895,
        [x, h * 0.43, z],
        [volcano ? 520 : 330, h, volcano ? 500 : 295],
      );
      w.part(
        scenery,
        w.cone,
        volcano ? 0x947d70 : 0xf0e8d7,
        [x, h * 0.79, z],
        [volcano ? 126 : 96, h * 0.29, volcano ? 115 : 85],
      );
    }
    if (volcano)
      for (let i = 0; i < 25; i++)
        box(0x557e54, -245 - (i % 5) * 13, 0.4, Math.floor(i / 5) * 58, 6, 0.8, 48);
  }
  for (let i = 0; i < 23; i++) {
    const a = i * 0.73,
      r = 1050 + random() * 500,
      y = 245 + random() * 160;
    for (let k = 0; k < 3; k++)
      w.part(
        scenery,
        w.pebble,
        0xfff5e5,
        [Math.cos(a) * r + k * 37, y + (k === 1 ? 9 : 0), Math.sin(a) * r],
        [38 + random() * 25, 13 + random() * 12, 29],
      );
  }
  batch(scenery);
  field.add(scenery);
  // Large ground numerals stay crisp when seen from above.
  for (const side of [-1, 1]) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.fillStyle = '#fff2d4';
    ctx.font = 'bold 87px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      String(side > 0 ? airport.runway : ((airport.runway + 17) % 36) + 1).padStart(2, '0'),
      64,
      53,
    );
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mark = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 16),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
    mark.rotation.order = 'YXZ';
    mark.rotation.set(-Math.PI / 2, side > 0 ? 0 : Math.PI, 0);
    mark.position.set(0, 0.35, side * 262);
    field.add(mark);
  }
  const mast = new THREE.Group();
  mast.position.set(-45, 0, 73);
  field.add(mast);
  w.part(mast, w.tube, white, [0, 4.4, 0], [0.27, 8.8, 0.27]);
  const sock = new THREE.Group();
  sock.position.y = 8.8;
  mast.add(sock);
  for (let k = 0; k < 5; k++) {
    const band = w.part(
      sock,
      w.tube,
      k % 2 ? white : red,
      [0, -k * 0.18, k * 1.05],
      [0.84 - k * 0.105, 1.15, 0.84 - k * 0.105],
    );
    band.rotation.x = Math.PI / 2 + 0.11;
  }
  return { field, sock };
}
