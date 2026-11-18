import * as THREE from 'three';
import { Workshop } from './aircraftModels';
import type { Airport } from './courses';
import { aircraftScreen, shielded, type CombatTarget, type Sortie } from './combat';

// The exercise takes place above a cloud layer. Every target is a fictional simulator object.
export function combatScene(canvas: HTMLCanvasElement, port: Airport) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1));
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(56, 1, 0.1, 1100),
    w = new Workshop();
  const sky = new THREE.Color(port.sky);
  scene.background = sky;
  scene.fog = new THREE.FogExp2(sky, 0.0028);
  scene.add(new THREE.HemisphereLight(0xfff6df, 0x7390b2, 2.3));
  const sun = new THREE.DirectionalLight(0xffefd7, 2);
  sun.position.set(-4, 7, 3);
  scene.add(sun);
  function jet(color: number) {
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
  const hero = jet(0xfff1bd),
    transport = jet(0x55dbe0);
  scene.add(hero, transport);
  // A painted horizon keeps distant targets readable as the exercise changes altitude.
  const backdrop = new THREE.Mesh(
    new THREE.SphereGeometry(950, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        zenith: { value: sky.clone().multiplyScalar(0.49) },
        horizon: { value: new THREE.Color(0xffdfb9) },
      },
      vertexShader:
        'varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `uniform vec3 zenith; uniform vec3 horizon; varying vec3 direction;
        void main(){vec3 dir=normalize(direction);
          float glow=pow(max(0.0,dot(dir,normalize(vec3(-0.54,0.40,-1.0)))),96.0);
          gl_FragColor=vec4(mix(horizon,zenith,smoothstep(-0.1,0.52,dir.y))+vec3(0.46,0.29,0.10)*glow,1.0);
          #include <colorspace_fragment>
        }`,
    }),
  );
  scene.add(backdrop);
  const mountains = new THREE.Group();
  scene.add(mountains);
  for (let i = 0; i < 32; i++) {
    const height = 46 + 35 * Math.sin(i * 4.3);
    const peak = w.part(
      mountains,
      w.cone,
      i % 3 ? 0x697a91 : 0x606c8b,
      [(i - 16) * 54, -46, -530 - Math.cos(i * 1.9) * 40],
      [94, height, 90],
    );
    peak.rotation.y = i;
  }
  const clouds = new THREE.Group();
  scene.add(clouds);
  for (let n = 0; n < 86; n++) {
    const x = Math.sin(n * 47.18) * 490;
    w.part(
      clouds,
      w.pebble,
      n % 4 ? 0xffefdd : 0xc6d7e0,
      [x, -30 - (n % 7) * 3, -((n * 63) % 780)],
      [22 + (n % 19), 5 + (n % 6), 18 + (n % 17)],
    );
  }
  w.part(scene, w.box, port.sea, [0, -80, -390], [2400, 2, 1800]);
  const models = new Map<number, { group: THREE.Group; shield: THREE.Mesh }>();
  function enemy(t: CombatTarget) {
    const base = t.kind === 'fort' || t.kind === 'carrier';
    const g =
      base || t.kind === 'relay' ? new THREE.Group() : jet(t.kind === 'ace' ? 0xd13066 : 0xe56a3d);
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
  const tan = Math.tan((28 * Math.PI) / 180);
  function at(node: THREE.Object3D, x: number, y: number, z: number) {
    node.position.set(x * z * tan * camera.aspect, y * z * tan, -z);
  }
  return {
    draw(s: Sortie) {
      const width = canvas.clientWidth,
        height = canvas.clientHeight;
      if (!width || !height) return;
      if (
        camera.aspect !== width / height ||
        canvas.width !== Math.floor(width * renderer.getPixelRatio())
      ) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
      clouds.children.forEach((cloud, i) => {
        cloud.position.z = 12 - ((((i * 63 - s.time * 18) % 780) + 780) % 780);
      });
      mountains.position.x = -s.x * 15;
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
      renderer.render(scene, camera);
    },
    dispose() {
      const geos = new Set<THREE.BufferGeometry>([w.box, w.ball, w.tube, w.cone, w.pebble]),
        paints = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
          geos.add(o.geometry);
          for (const mat of Array.isArray(o.material) ? o.material : [o.material]) paints.add(mat);
        }
      });
      geos.forEach((g) => g.dispose());
      paints.forEach((m) => m.dispose());
      renderer.dispose();
      if (!canvas.isConnected) renderer.forceContextLoss();
    },
  };
}
