import * as THREE from 'three';
import type { Aircraft } from './courses';
import type { Flight, FlightInput } from './simulation';

const cream = 0xffedcb,
  orange = 0xef5437,
  navy = 0x203d50,
  glass = 0x68b9ce;
type Triple = [number, number, number];

/** Share geometry and paint within one flight, including the airfield and moving parts. */
export class Workshop {
  box = new THREE.BoxGeometry();
  ball = new THREE.SphereGeometry(1, 10, 7);
  pebble = new THREE.IcosahedronGeometry(1, 0);
  tube = new THREE.CylinderGeometry(1, 1, 1, 10);
  cone = new THREE.ConeGeometry(1, 1, 8);
  private paints = new Map<number, THREE.MeshLambertMaterial>();
  paint(color: number) {
    let paint = this.paints.get(color);
    if (!paint) {
      paint = new THREE.MeshLambertMaterial({ color, flatShading: true, side: THREE.DoubleSide });
      this.paints.set(color, paint);
    }
    return paint;
  }
  part(
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    color: number,
    at: Triple,
    scale: Triple,
  ) {
    const mesh = new THREE.Mesh(geo, this.paint(color));
    mesh.position.set(...at);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }
  rod(parent: THREE.Object3D, color: number, a: Triple, b: Triple, radius: number) {
    const from = new THREE.Vector3(...a),
      to = new THREE.Vector3(...b);
    const delta = to.sub(from);
    const middle = from.addScaledVector(delta, 0.5);
    const mesh = this.part(
      parent,
      this.tube,
      color,
      [middle.x, middle.y, middle.z],
      [radius, delta.length(), radius],
    );
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return mesh;
  }
}

function pilot(group: THREE.Group, w: Workshop) {
  w.part(group, w.ball, navy, [0, 1, 0], [0.64, 0.9, 0.44]);
  w.part(group, w.box, orange, [0, 1.1, -0.33], [0.88, 1.04, 0.27]);
  w.part(group, w.ball, cream, [0, 2.24, -0.04], [0.54, 0.58, 0.52]);
  w.part(group, w.ball, 0x274457, [0, 2.23, -0.38], [0.48, 0.25, 0.26]);
  w.part(group, w.box, orange, [0, 2.72, -0.06], [0.13, 0.09, 0.42]);
  for (const side of [-1, 1]) {
    w.rod(group, 0xe2ad6e, [side * 0.5, 1.55, 0], [side * 0.83, 1.15, -0.35], 0.19);
    w.rod(group, navy, [side * 0.28, 0.5, 0], [side * 0.36, -0.35, 0.13], 0.23);
    w.part(group, w.ball, 0x5e453d, [side * 0.36, -0.38, 0.03], [0.24, 0.22, 0.39]);
  }
}

function wingCloth(w: Workshop, group: THREE.Group, points: Triple[], color: number) {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  geom.computeVertexNormals();
  group.add(new THREE.Mesh(geom, w.paint(color)));
}

export function makeTrainingJet(w: Workshop, color: number) {
  const g = new THREE.Group();
  w.part(g, w.ball, color, [0, 0, 0], [0.43, 0.36, 2]);
  w.part(g, w.ball, 0x235b77, [0, 0.3, -0.52], [0.33, 0.28, 0.72]);
  for (const side of [-1, 1]) {
    const wing = w.part(g, w.pebble, color, [side * 0.88, 0, 0.15], [1.42, 0.12, 0.74]);
    wing.rotation.y = side * 0.39;
    const tail = w.part(g, w.box, color, [side * 0.28, 0.42, 1.35], [0.1, 0.88, 0.65]);
    tail.rotation.z = -side * 0.28;
    w.part(g, w.ball, 0x294966, [side * 1.55, 0.035, 0.39], [0.43, 0.085, 0.35]);
    w.part(g, w.box, 0xf35a35, [side * 0.28, 0.72, 1.36], [0.13, 0.22, 0.66]);
    w.part(g, w.ball, 0xffbd56, [side * 0.2, -0.03, 1.77], [0.17, 0.18, 0.4]);
  }
  return g;
}

export function makeAircraft(id: Aircraft, w: Workshop, patrol = false) {
  const body = new THREE.Group(),
    pilotBody = new THREE.Group(),
    moving = new THREE.Group();
  let opening = 0;
  const wingmate = patrol ? makeTrainingJet(w, 0x479ccc) : null;
  if (wingmate) {
    const jet = makeTrainingJet(w, 0xfff1bd);
    jet.scale.setScalar(2.5);
    wingmate.scale.setScalar(2.5);
    body.add(jet, wingmate);
  } else if (id === 'plane') {
    w.part(body, w.ball, cream, [0, 0.12, 0.5], [1.18, 1.07, 4.2]);
    w.part(body, w.ball, orange, [0, -0.11, -1.1], [1.23, 0.92, 2.63]);
    w.part(body, w.ball, glass, [0, 0.88, -0.67], [0.96, 0.89, 1.56]);
    w.part(body, w.box, cream, [0, 1.79, -0.57], [12.6, 0.23, 2.07]);
    w.part(body, w.box, cream, [0, 0.45, 3.72], [4.56, 0.17, 1.13]);
    const fin = w.part(body, w.ball, orange, [0, 1.03, 3.68], [0.16, 1.43, 0.76]);
    fin.rotation.x = 0.31;
    for (const side of [-1, 1]) {
      w.part(body, w.box, orange, [side * 5.54, 1.82, -0.57], [1.46, 0.25, 2.08]);
      w.part(body, w.box, orange, [side * 3.95, 1.91, -0.58], [0.15, 0.04, 2.06]);
      w.part(body, w.box, navy, [side * 1.07, 0.18, -0.1], [0.11, 0.19, 2.06]);
      w.rod(body, cream, [side * 0.89, -0.28, -0.38], [side * 4.3, 1.67, -0.85], 0.07);
      w.rod(body, navy, [side * 0.62, -0.43, -0.64], [side * 1.13, -1.24, -0.67], 0.085);
      const wheel = w.part(body, w.tube, navy, [side * 1.15, -1.25, -0.66], [0.37, 0.27, 0.37]);
      wheel.rotation.z = Math.PI / 2;
    }
    w.part(body, w.ball, navy, [0, -0.45, 3.12], [0.18, 0.23, 0.23]);
    moving.position.set(0, 0.05, -3.69);
    w.part(moving, w.ball, navy, [0, 0, 0], [0.17, 1.43, 0.09]);
    w.part(moving, w.ball, cream, [0, 0, -0.13], [0.25, 0.25, 0.33]);
    body.add(moving);
  } else {
    pilot(pilotBody, w);
    w.part(pilotBody, w.box, orange, [0, 1.25, 0.42], [0.94, 1.24, 0.49]);
    body.add(pilotBody);
    if (id === 'parachute') {
      const strips = 12;
      const edge = (i: number, back: boolean): Triple => {
        const u = (i / strips) * 2 - 1;
        return [u * 5.5, 6.3 + 1.65 * (1 - u * u) - (back ? 0.1 : 0), back ? 2 : -1.42];
      };
      for (let i = 0; i < strips; i++) {
        const l = edge(i, false),
          r = edge(i + 1, false),
          lb = edge(i, true),
          rb = edge(i + 1, true);
        const mid: Triple = [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2 + 0.23, 0.19];
        const col = i < 2 || i > 9 ? 0x167c89 : i === 3 || i === 8 ? cream : orange;
        wingCloth(w, moving, [l, lb, mid, lb, rb, mid, rb, r, mid, r, l, mid], col);
        if (i % 3 === 0 || i === strips - 1) {
          for (const p of [l, lb])
            w.rod(moving, 0xede9cf, [Math.sign(p[0]) * 0.63, 1.63, 0.12], p, 0.025);
        }
      }
      body.add(moving);
    } else if (id === 'glider') {
      pilotBody.rotation.x = -0.94;
      for (const side of [-1, 1]) {
        const tip: Triple = [side * 6.8, 2.68, 2.35],
          nose: Triple = [0, 2.96, -3.8],
          keel: Triple = [0, 2.44, 1.22],
          mid: Triple = [side * 3.95, 2.9, -0.07];
        wingCloth(
          w,
          body,
          [nose, tip, mid, mid, tip, keel, nose, mid, keel],
          side > 0 ? 0xf69b41 : orange,
        );
        wingCloth(w, body, [nose, mid, [side * 4.48, 2.73, 0.41]], cream);
        w.rod(body, cream, nose, tip, 0.08);
        w.rod(body, navy, [0, 2.62, -0.7], [side * 1.07, 0.43, -1.02], 0.052);
      }
      w.rod(body, cream, [-1.07, 0.43, -1.02], [1.07, 0.43, -1.02], 0.065);
    } else {
      for (const side of [-1, 1]) {
        w.part(body, w.tube, cream, [side * 0.77, 1, 0.46], [0.36, 1.77, 0.36]);
        w.part(body, w.ball, orange, [side * 0.77, 1.87, 0.46], [0.36, 0.33, 0.36]);
        w.part(body, w.cone, navy, [side * 0.77, 0.1, 0.46], [0.43, 0.55, 0.43]);
        const flame = w.part(
          moving,
          w.cone,
          0xffbf52,
          [side * 0.77, -0.88, 0.46],
          [0.28, 1.88, 0.28],
        );
        flame.rotation.z = Math.PI;
      }
      body.add(moving);
    }
  }
  return {
    body,
    update(s: Flight, i: FlightInput, dt: number) {
      body.position.set(s.x, s.y + (id === 'plane' ? 1.63 : 0.65), s.z);
      body.rotation.order = 'YXZ';
      body.rotation.set(s.pitch, -s.heading, s.bank);
      if (wingmate) {
        wingmate.visible = s.airborne;
        wingmate.position.set(-12 + Math.sin(s.elapsed * 0.65), 2 + Math.cos(s.elapsed * 0.7), -15);
      } else if (id === 'plane') moving.rotation.z += dt * (9 + s.speed * 3);
      if (id === 'parachute') {
        opening = THREE.MathUtils.damp(opening, s.canopy ? 1 : 0, 9, dt);
        moving.visible = opening > 0.01;
        moving.scale.set(0.25 + 0.75 * opening, opening, opening);
        pilotBody.rotation.x = s.canopy ? 0 : 1.15;
      }
      if (id === 'jetpack') {
        moving.visible = s.fuel > 0 && (i.primary || i.brake);
        moving.scale.y = (i.brake ? 0.4 : 1) * (0.9 + 0.11 * Math.sin(s.elapsed * 44));
      }
    },
  };
}
