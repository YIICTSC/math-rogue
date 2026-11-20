import { makeFormation } from './combatScene';
import type { Sortie } from './combat';
import * as THREE from 'three';
import { makeAirfield } from './airfield';
import { makeAircraft, Workshop } from './aircraftModels';
import type { Lesson } from './courses';
import { altitude, windAt, type Flight, type FlightInput } from './simulation';
import { groundHeight, SEA_LEVEL } from './terrain';

export function makeFlightScene(
  canvas: HTMLCanvasElement,
  lesson: Lesson,
  patrol = false,
  tomcat = false,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.55));
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(53, 1, 0.24, 4900);
  const horizon = new THREE.Color(lesson.airport.sky).lerp(new THREE.Color(0xffefd1), 0.48);
  scene.background = horizon;
  scene.fog = new THREE.FogExp2(horizon, 0.00053);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(3600, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        horizon: { value: horizon },
        zenith: { value: new THREE.Color(lesson.airport.sky).multiplyScalar(0.72) },
      },
      vertexShader:
        'varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:
        'uniform vec3 horizon;uniform vec3 zenith;varying vec3 direction;void main(){gl_FragColor=vec4(mix(horizon,zenith,smoothstep(-0.04,0.67,normalize(direction).y)),1.0);\n#include <colorspace_fragment>\n}',
    }),
  );
  scene.add(sky, new THREE.HemisphereLight(0xfff5e0, 0x9cb9b1, 2.12));
  const sunlight = new THREE.DirectionalLight(0xffead2, 1.9);
  sunlight.position.set(-380, 660, -280);
  scene.add(sunlight);
  const w = new Workshop(),
    { field, sock } = makeAirfield(lesson.airport, w),
    aircraft = makeAircraft(lesson.aircraft, w, patrol, tomcat);
  scene.add(field, aircraft.body);
  const routeMarkers = new THREE.Group();
  scene.add(routeMarkers);
  const rings = lesson.gates.map((gate, index) => {
    const previous = index === 0 ? lesson.start : lesson.gates[index - 1];
    const hoop = new THREE.Mesh(
      new THREE.TorusGeometry(gate.radius, lesson.aircraft === 'jetpack' ? 0.65 : 1.04, 7, 44),
      new THREE.MeshBasicMaterial({ color: 0xff9c37, transparent: true, opacity: 1 }),
    );
    hoop.position.set(gate.x, gate.y, gate.z);
    if (lesson.aircraft === 'jetpack') hoop.rotation.x = Math.PI / 2;
    else hoop.rotation.y = Math.atan2(gate.x - previous.x, gate.z - previous.z);
    const tabs = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + 0.785;
      const tab = w.part(
        tabs,
        w.pebble,
        0xfff1c0,
        [Math.cos(a) * gate.radius, Math.sin(a) * gate.radius, 0],
        [1.65, 1.65, 1.65],
      );
      tab.rotation.z = a;
    }
    hoop.add(tabs);
    routeMarkers.add(hoop);
    return hoop;
  });
  const target = new THREE.Group();
  target.position.set(lesson.target.x, 0.32, lesson.target.z);
  routeMarkers.add(target);
  for (const [outer, inner, color] of lesson.aircraft === 'plane'
    ? [
        [9, 7, 0xffb447],
        [4, 2, 0xfaf1c8],
      ]
    : [
        [18, 14, 0xf9ecd0],
        [13, 9, 0xe77543],
        [8, 4, 0xf9ecd0],
        [3, 0, 0xe77543],
      ]) {
    const circle = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 48),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    circle.rotation.x = -Math.PI / 2;
    target.add(circle);
  }
  const thermal = new THREE.Group();
  if (lesson.aircraft === 'glider') {
    thermal.position.set(lesson.thermal.x, 0, lesson.thermal.z);
    scene.add(thermal);
    for (let j = 0; j < 5; j++) {
      const points: THREE.Vector3[] = [];
      for (let k = 0; k <= 45; k++) {
        const a = (k / 45) * Math.PI * 1.55 + j * 1.2;
        points.push(
          new THREE.Vector3(Math.cos(a) * (18 + j * 2), (k / 45) * 15, Math.sin(a) * (18 + j * 2)),
        );
      }
      const swirl = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0xffda7c, transparent: true, opacity: 0.85 }),
      );
      swirl.position.y = 2 + j * 13;
      thermal.add(swirl);
    }
  }
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 20),
    new THREE.MeshBasicMaterial({
      color: 0x263d46,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);
  const desired = new THREE.Vector3(),
    look = new THREE.Vector3(),
    center = new THREE.Vector3();
  let first = true,
    lastWidth = 0,
    lastHeight = 0,
    oldGate = -1;
  const formation = patrol ? makeFormation(scene, camera, w, tomcat) : null;
  function draw(s: Flight, i: FlightInput, survey: boolean, dt: number, battle?: Sortie) {
    const width = canvas.clientWidth,
      height = canvas.clientHeight;
    if (width < 1 || height < 1) return;
    if (width !== lastWidth || height !== lastHeight) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < height ? 62 : 53;
      camera.updateProjectionMatrix();
      lastWidth = width;
      lastHeight = height;
    }
    aircraft.update(s, i, dt);
    const agl = altitude(s),
      wind = windAt(s);
    sock.rotation.y = Math.atan2(wind.x, wind.z) + 0.09 * Math.sin(s.elapsed * 3);
    thermal.rotation.y = s.elapsed * 0.27;
    if (oldGate !== s.nextGate) {
      rings.forEach((ring, k) => {
        ring.visible = k >= s.nextGate;
        ring.material.color.setHex(k === s.nextGate ? 0xffa62f : 0x82d5dc);
        ring.material.opacity = k === s.nextGate ? 1 : lesson.mode === 'practice' ? 0.6 : 0.35;
        ring.children[0].visible = k === s.nextGate;
      });
      oldGate = s.nextGate;
    }
    if (rings[s.nextGate]) rings[s.nextGate].scale.setScalar(1 + 0.016 * Math.sin(s.elapsed * 3.1));
    shadow.position.set(
      s.x,
      Math.max(SEA_LEVEL, groundHeight(lesson.airport, s.x, s.z)) + 0.36,
      s.z,
    );
    const span = lesson.aircraft === 'plane' || lesson.aircraft === 'glider' ? 4 : 1.25;
    shadow.scale.set(span * (1 + Math.min(agl, 65) * 0.009), span * 0.62, 1);
    shadow.material.opacity = 0.34 / (1 + agl * 0.009);
    const forwardX = Math.sin(s.heading),
      forwardZ = -Math.cos(s.heading);
    const compact = lesson.aircraft === 'jetpack',
      large = lesson.aircraft === 'glider' || lesson.aircraft === 'plane';
    const distance = survey ? 35 : large ? 20 : compact ? 7.5 : 12.2;
    const heightOffset = survey ? 54 : large ? 9.5 : compact ? 4.4 : 7;
    desired.set(s.x - forwardX * distance, s.y + heightOffset, s.z - forwardZ * distance);
    const lead = survey ? 7 : large ? 19 : compact ? 11 : 17;
    const lookDown = survey
      ? 0
      : large
        ? 1.2 + Math.min(3, agl * 0.03)
        : compact
          ? 0.2
          : Math.min(7, agl * 0.12);
    center.set(s.x + forwardX * lead, s.y - lookDown + 1.8, s.z + forwardZ * lead);
    if (first) {
      camera.position.copy(desired);
      look.copy(center);
      first = false;
    } else {
      camera.position.lerp(desired, 1 - Math.exp(-7 * dt));
      look.lerp(center, 1 - Math.exp(-9 * dt));
    }
    camera.position.y = Math.max(
      camera.position.y,
      groundHeight(lesson.airport, camera.position.x, camera.position.z) + 1.5,
    );
    camera.lookAt(look);
    sky.position.copy(camera.position);
    routeMarkers.visible = !battle;
    aircraft.body.visible = !battle;
    formation?.(battle);
    renderer.render(scene, camera);
  }
  return {
    draw,
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>([w.box, w.ball, w.pebble, w.tube, w.cone]);
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          geometries.add(object.geometry);
          for (const m of Array.isArray(object.material) ? object.material : [object.material])
            materials.add(m);
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => {
        if ('map' in m && m.map instanceof THREE.Texture) m.map.dispose();
        m.dispose();
      });
      renderer.dispose();
      if (!canvas.isConnected) renderer.forceContextLoss();
    },
  };
}
