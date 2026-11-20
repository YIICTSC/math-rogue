import * as THREE from 'three';
import { Workshop, makeTrainingJet, makeTomcat } from './aircraftModels';
import { aircraftScreen, shielded, type CombatTarget, type Sortie } from './combat';

// The formation is drawn in the flight camera's local frame; both landscapes use the same sights.
export function makeFormation(
  world: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  w: Workshop,
  tomcat = false,
) {
  const scene = new THREE.Group();
  scene.visible = false;
  world.add(scene);
  const hero = tomcat ? makeTomcat(w) : makeTrainingJet(w, 0xfff1bd),
    wingmate = makeTrainingJet(w, 0x479ccc),
    transport = makeTrainingJet(w, 0x55dbe0);
  scene.add(hero, wingmate, transport);
  const models = new Map<number, { group: THREE.Group; shield: THREE.Mesh }>();
  function enemy(t: CombatTarget) {
    const base = t.kind === 'fort' || t.kind === 'carrier';
    const g =
      base || t.kind === 'relay'
        ? new THREE.Group()
        : makeTrainingJet(w, t.kind === 'ace' ? 0xd13066 : 0xe56a3d);
    if (base) {
      w.part(g, w.pebble, 0x354b6b, [0, 0, 0], [2.6, 0.8, 1.4]);
      w.part(g, w.ball, 0xff883a, [0, 0.46, 0], [0.65, 0.5, 0.65]);
      for (const side of [-1, 1])
        w.part(g, w.box, 0x7762b2, [side * 1.65, 0.48, 0], [0.46, 0.95, 0.46]);
      if (t.kind === 'carrier') w.part(g, w.box, 0x6c8297, [0, 0.14, 0], [1.3, 0.2, 4.5]);
    } else if (t.kind === 'relay') {
      w.part(g, w.pebble, 0xbd58ff, [0, 0, 0], [0.95, 1.55, 0.95]);
      w.part(g, w.tube, 0xffe3ad, [0, 0, 0], [1.35, 0.12, 1.35]);
    }
    const shield = new THREE.Mesh(
      w.ball,
      new THREE.MeshBasicMaterial({
        color: 0x59c9ff,
        wireframe: true,
        transparent: true,
        opacity: 0.32,
      }),
    );
    shield.scale.set(2.9, 1.55, 2.5);
    g.add(shield);
    scene.add(g);
    return { group: g, shield };
  }
  // Recycle short-lived flashes, including targets destroyed as a new wave arrives.
  const sparks = Array.from({ length: 8 }, () => {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffbf64,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), material);
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, material, start: -10, size: 1 };
  });
  let nextSpark = 0;
  const ray = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineBasicMaterial({ color: 0xfff08b }),
  );
  ray.frustumCulled = false;
  scene.add(ray);
  function at(node: THREE.Object3D, x: number, y: number, z: number) {
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    node.position.set(x * z * tan * camera.aspect, y * z * tan, -z);
  }
  return (s?: Sortie) => {
    scene.visible = !!s;
    if (!s) return;
    scene.position.copy(camera.position);
    scene.quaternion.copy(camera.quaternion);
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    const unit = Math.min(1, camera.aspect);
    const heroAt = aircraftScreen(s.x, s.y);
    at(hero, heroAt.x, heroAt.y, 11);
    hero.scale.setScalar(0.86 * unit);
    hero.rotation.set(0.18 + s.y * 0.14, -s.x * 0.29, -s.x * 0.52);
    for (const [id, model] of models) {
      if (!model.group.visible || s.targets.some((t) => t.id === id && t.hp > 0)) continue;
      const spark = sparks[nextSpark++ % sparks.length];
      spark.mesh.position.copy(model.group.position);
      spark.start = s.time;
      spark.size = model.group.scale.x;
    }
    for (const spark of sparks) {
      const age = (s.time - spark.start) / 0.42;
      spark.mesh.visible = age < 1;
      if (spark.mesh.visible) {
        spark.mesh.scale.setScalar(spark.size * (1 + age * 2.4));
        spark.material.opacity = 1 - age;
        spark.mesh.rotation.z = age * 2;
      }
    }
    at(wingmate, -0.53 + Math.sin(s.time * 0.8) * 0.03, -0.27 + Math.cos(s.time * 0.65) * 0.04, 28);
    wingmate.scale.setScalar(0.95 * unit);
    wingmate.rotation.z = -s.x * 0.16;
    transport.visible = !!s.mission.escort;
    if (transport.visible) {
      at(transport, -0.58 + 0.07 * Math.sin(s.time), -0.39, 32);
      transport.scale.setScalar(unit);
    }
    for (const model of models.values()) model.group.visible = false;
    for (const t of s.targets) {
      if (!t.hp) continue;
      let model = models.get(t.id);
      if (!model) {
        model = enemy(t);
        models.set(t.id, model);
      }
      const z = 85 - t.depth * 72;
      model.group.visible = true;
      at(model.group, t.x, t.y, z);
      model.group.scale.setScalar(
        z * tan * unit * (0.063 + t.depth * 0.07) * (t.flash > 0 ? 1.22 : 1),
      );
      model.group.rotation.y =
        t.kind === 'relay' ? s.time : Math.PI + 0.24 * Math.sin(t.age + t.id);
      model.group.rotation.z =
        t.kind === 'ace' ? 0.42 * Math.cos(t.age * 1.4) : 0.08 * Math.sin(t.age);
      model.shield.visible = shielded(s, t);
    }
    ray.visible = s.beam > 0;
    if (ray.visible) {
      const pos = ray.geometry.getAttribute('position') as THREE.BufferAttribute;
      pos.setXYZ(0, hero.position.x, hero.position.y, hero.position.z);
      pos.setXYZ(1, s.x * 70 * tan * camera.aspect, s.y * 70 * tan, -70);
      pos.needsUpdate = true;
    }
  };
}
