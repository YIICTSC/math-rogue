import {createVrCharacter} from './character';
import type {KartAvatar} from '../gakuro-kart/avatar';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { assetUrl } from '../../utils/assetPaths';
import { cameraAngle, cameraBlocked, sensorActive, clearSight, holdCandidate, objectivesComplete, type Mission, type Point, type Run } from './engine';

export type ViewMode = 'overhead' | 'first' | 'third';
export type ViewSettings = { mode: ViewMode; yaw: number; exitReady?: boolean; others?: { id: string; name: string; player: Point & { angle: number }; out: boolean; avatar?: KartAvatar }[] };

export function createScene(host: HTMLElement, mission: Mission, avatar?: KartAvatar) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
  renderer.setPixelRatio(1); renderer.setClearColor(0x071718); host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'GAKURO 3D');
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x071718, 28, 55);
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 90);
  const perspective = new THREE.PerspectiveCamera(72, 1, .035, 60);
  camera.position.set(0, 24, 15); camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xa7e9da, 0x182f39, 2));
  const light = new THREE.DirectionalLight(0xffdfae, 2); light.position.set(-7, 18, 8); scene.add(light);
  const mats: THREE.Material[] = [];
  const mat = (color: number) => { const m = new THREE.MeshLambertMaterial({ color, flatShading: true }); mats.push(m); return m; };
  function cube(w: number, h: number, d: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D = scene) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
  const size = mission.size ?? 8;
  for (let x = -size + 1; x < size; x += 2) for (let z = -size + 1; z < size; z += 2) cube(2, .12, 2, (x + z) % 4 === 0 ? 0x344b48 : 0x293f3e, x, -.1, z);
  const grid = new THREE.GridHelper(size * 2, Math.round(size * 2), 0x638276, 0x496359); grid.position.y = .001; scene.add(grid);
  cube(size * 2 + .4, 2.5, .3, 0x456260, 0, 1.2, -size-.1); cube(.3, 2.5, size*2, 0x456260, -size-.1, 1.2, 0); cube(.3, 2.5, size*2, 0x456260, size+.1, 1.2, 0);
  for (const x of [-6, -2, 2, 6]) { cube(2.2, 1.1, .1, 0x88b5ab, x, 1.6, -7.9); cube(2.4, .1, .2, 0xc1bea0, x, 1, -7.85); }
  cube(3.3, 1.1, .12, 0x163e32, 0, 1.6, -7.88);
  const frontWall = cube(size*2+.4, 2.5, .3, 0x456260, 0, 1.2, size+.1);
  const doors: { group: THREE.Group; index: number }[] = [];
  const decorations: { holder: THREE.Group; kind: string; w: number; h: number; d: number }[] = [];
  for (const b of mission.obstacles) {
    const holder = new THREE.Group(); holder.position.set(b.x, 0, b.z); scene.add(holder);
    cube(b.w, b.h - (b.clearance ?? 0), b.d, b.kind === 'crawl' ? 0xc5a254 : b.kind === 'door' ? 0x538ea5 : b.kind === 'wall' ? 0x607775 : b.kind === 'planter' ? 0x426244 : 0x746049, 0, (b.h + (b.clearance ?? 0)) / 2, 0, holder);
    if (b.kind === 'door') doors.push({ group: holder, index: b.switchId ?? 0 });
    if (b.kind === 'crawl') cube(b.w, .07, b.d + .03, 0xf6e3a0, 0, b.clearance!, 0, holder);
    if (['desk', 'shelf', 'planter'].includes(b.kind)) decorations.push({ holder, kind: b.kind, w: b.w, h: b.h, d: b.d });
  }
  const switches = (mission.switches ?? []).map(p => {
    cube(.12, .8, .12, 0x94a6a1, p.x, .4, p.z);
    return cube(.4, .25, .3, 0xffbb5e, p.x, .9, p.z);
  });
  const sensors = (mission.sensors ?? []).map(b => {
    const beam = cube(b.w, .045, b.d, 0xff6579, b.x, 1.1, b.z);
    for (const side of [-1, 1]) cube(.12, 1.25, .12, 0x557681, b.x + (b.w > b.d ? b.w / 2 * side : 0), .625, b.z + (b.d > b.w ? b.d / 2 * side : 0));
    return beam;
  });
  function actor(color: number) { const g = new THREE.Group(); cube(.48, .65, .3, color, 0, .82, 0, g); cube(.34, .35, .32, 0xd7ad82, 0, 1.32, 0, g); cube(.37, .12, .34, 0x1a2526, 0, 1.52, 0, g); for (const x of [-.16, .16]) cube(.16, .5, .2, 0x172a30, x, .25, 0, g); scene.add(g); return g; }
  let player = avatar ? createVrCharacter(avatar) : actor(0x2d8d9c); if (avatar) scene.add(player); const guards = mission.routes.map(() => actor(0xb78748));
  const ring = (color: number, radius: number, p: Point) => { const m = new THREE.Mesh(new THREE.RingGeometry(radius * .78, radius, 24), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(p.x, .025, p.z); scene.add(m); return m; };
  const playerRing = ring(0x8affee, .5, mission.spawn);
  const exit = ring(0x405958, .85, mission.exit);
  const targets = mission.targets.map(p => { const g = new THREE.Group(); cube(.48, .08, .6, 0x79e9ff, 0, .45, 0, g); cube(.35, .02, .08, 0xf0ffff, 0, .5, .12, g); g.position.set(p.x, 0, p.z); scene.add(g); ring(0x3e838e, .52, p); return g; });
  const cones = [...guards, ...mission.cameras].map(() => {
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(32 * 9), 3));
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xedc55c, transparent: true, opacity: .23, side: THREE.DoubleSide, depthWrite: false })); scene.add(mesh); return mesh;
  });
  mission.cameras.forEach(c => { cube(.18, 2.5, .18, 0x8da5a1, c.x, 1.25, c.z); cube(.4, .3, .45, 0xd3d4bb, c.x, 2.5, c.z); });
  const noise = ring(0xffce78, 1, mission.spawn); noise.visible = false;
  const sleepMarkers = guards.map(() => {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 64;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#c4f3ff'; ctx.font = 'bold 38px monospace'; ctx.fillText('Z z z', 4, 44);
    const texture = new THREE.CanvasTexture(canvas); const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false })); sprite.scale.set(1.3, .65, 1); scene.add(sprite); return sprite;
  });
  const bubble = new THREE.Mesh(new THREE.IcosahedronGeometry(.2, 1), new THREE.MeshBasicMaterial({ color: 0x8beaff, transparent: true, opacity: .7, wireframe: true })); scene.add(bubble);
  const holdRing = ring(0xf8ec8c, .6, mission.spawn);
  const aim = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineDashedMaterial({ color: 0x99dbe5, dashSize: .2, gapSize: .2, transparent: true, opacity: .45 })); scene.add(aim);
  // Bright toy proportions distinguish the bubble tool from a real weapon.
  const toy = new THREE.Group(); cube(.15, .18, .38, 0x5acdd5, .36, .85, .25, toy); cube(.2, .2, .08, 0xf2cf64, .36, .85, .46, toy); scene.add(toy);
  let disposed = false;
  const assets: THREE.Object3D[] = [];
  new GLTFLoader().load(assetUrl('models/gakurogear/school-kit.glb'), gltf => {
    if (disposed) { disposeObject(gltf.scene); return; } assets.push(gltf.scene);
    for (const d of decorations) { const model = gltf.scene.getObjectByName(d.kind); if (!model) continue; disposeObject(d.holder); d.holder.clear(); const clone = model.clone(true); clone.position.set(0, 0, 0); clone.scale.set(d.w / 2, d.h / (d.kind === 'shelf' ? 2 : 1), d.d / (d.kind === 'shelf' ? 1 : 1.2)); d.holder.add(clone); }
    const student = gltf.scene.getObjectByName('student');
    if (student && !avatar) { disposeObject(player); player.clear(); const clone = student.clone(true); clone.position.set(0, 0, 0); player.add(clone); }
    host.dataset.models = 'blender';
  }, undefined, () => { host.dataset.models = 'fallback'; });
  const resize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(Math.min(w, 960), Math.min(w, 960) * h / w, false); const aspect = w / h, half = Math.max(size * 1.28, size * 1.2 / aspect); camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half; camera.updateProjectionMatrix(); perspective.aspect = aspect; perspective.updateProjectionMatrix(); };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const remoteActors = new Map<string, THREE.Group>();
  let frameState: Run | undefined;
  function drawCone(index: number, p: Point, angle: number, crouch: boolean, range: number) {
    const attr = cones[index].geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < 32; i++) {
      attr.setXYZ(i * 3, p.x, .035, p.z);
      for (let edge = 0; edge < 2; edge++) { const a = angle - .6 + (i + edge) / 32 * 1.2; let r = .1; for (; r < range; r += .15) { const to = { x: p.x + Math.sin(a) * r, z: p.z + Math.cos(a) * r }; if (Math.abs(to.x) > size || Math.abs(to.z) > size || !clearSight(mission, p, to, crouch, frameState)) break; } attr.setXYZ(i * 3 + edge + 1, p.x + Math.sin(a) * r, .035, p.z + Math.cos(a) * r); }
    } attr.needsUpdate = true; cones[index].geometry.computeBoundingSphere();
  }
  function draw(s: Run, view: ViewSettings = { mode: 'overhead', yaw: s.player.angle }) {
    frameState = s;
    remoteActors.forEach((g,id)=>{g.visible=!!view.others?.some(p=>p.id===id);});
    for(const other of view.others??[]) { let g=remoteActors.get(other.id);if(!g||g.userData.avatarKey!==JSON.stringify(other.avatar)){if(g){scene.remove(g);disposeObject(g);}g=other.avatar?createVrCharacter(other.avatar):actor(0xc98eeb);g.userData.avatarKey=JSON.stringify(other.avatar);scene.add(g);remoteActors.set(other.id,g);}g.visible=true;g.position.set(other.player.x,0,other.player.z);g.rotation.y=other.player.angle;g.scale.y=other.out?.45:1; }

    host.dataset.view = view.mode;
    frontWall.visible = view.mode !== 'overhead';
    doors.forEach(d => { d.group.visible = !s.switches[d.index]; });
    switches.forEach((mesh, i) => (mesh.material as THREE.MeshLambertMaterial).color.setHex(s.switches[i] ? 0x73ffb0 : 0xffbb5e));
    sensors.forEach((mesh, i) => { mesh.visible = sensorActive(mission.sensors![i].period, s.time); });
    const eye = s.crouch ? .62 : 1.38;
    const forward = new THREE.Vector3(Math.sin(view.yaw), 0, Math.cos(view.yaw));
    const focus = new THREE.Vector3(s.player.x, eye, s.player.z);
    if (view.mode === 'first') { perspective.position.copy(focus); perspective.lookAt(focus.clone().add(forward)); }
    if (view.mode === 'third') {
      const desired = focus.clone().addScaledVector(forward, -3.8); desired.y += s.crouch ? 1 : 1.5;
      let safe = focus.clone();
      for (let t = .025; t <= 1; t += .025) { const q = focus.clone().lerp(desired, t); if (cameraBlocked(mission, s, { x: q.x, z: q.z }, q.y)) break; safe = q; }
      perspective.position.copy(safe); perspective.lookAt(focus.clone().addScaledVector(forward, 2));
    }
    player.visible = view.mode !== 'first'; playerRing.visible = view.mode === 'overhead';
    player.position.set(s.player.x, 0, s.player.z); player.rotation.y = s.player.angle; player.scale.y = s.crouch ? .55 : 1;
    playerRing.position.set(s.player.x, .025, s.player.z);
    s.guards.forEach((g, i) => {
      guards[i].position.set(g.x, g.sleep > 0 ? .23 : 0, g.z); guards[i].rotation.set(g.sleep > 0 ? Math.PI / 2 : 0, g.angle, 0);
      cones[i].visible = g.sleep <= 0 && s.holdTarget !== i;
      if (cones[i].visible) drawCone(i, g, g.angle, s.crouch, mission.sightRange);
      sleepMarkers[i].visible = g.sleep > 0; sleepMarkers[i].position.set(g.x, 1.4 + Math.sin(s.time * 2) * .12, g.z);
    });
    toy.visible = view.mode !== 'first'; toy.position.copy(player.position); toy.rotation.y = s.player.angle; toy.scale.y = s.crouch ? .55 : 1;
    const candidate = holdCandidate(mission, s); holdRing.visible = candidate >= 0;
    if (candidate >= 0) holdRing.position.set(s.guards[candidate].x, .04, s.guards[candidate].z);
    bubble.visible = !!s.bubble;
    if (s.bubble) { const t = Math.min(1, ( .4 - s.bubble.life) / .2); bubble.position.set(s.bubble.x + (s.bubble.end.x - s.bubble.x) * t, .7, s.bubble.z + (s.bubble.end.z - s.bubble.z) * t); bubble.scale.setScalar(t === 1 ? 1 + ( .2 - s.bubble.life) * 8 : 1); }
    const ray = aim.geometry.getAttribute('position') as THREE.BufferAttribute;
    let aimDistance = .2;
    for (; aimDistance < 6; aimDistance += .1) { const q = { x: s.player.x + Math.sin(s.player.angle) * aimDistance, z: s.player.z + Math.cos(s.player.angle) * aimDistance }; if (Math.abs(q.x) > size || Math.abs(q.z) > size || !clearSight(mission, s.player, q, true, s)) break; }
    ray.setXYZ(0, s.player.x, .12, s.player.z); ray.setXYZ(1, s.player.x + Math.sin(s.player.angle) * aimDistance, .12, s.player.z + Math.cos(s.player.angle) * aimDistance); ray.needsUpdate = true; aim.geometry.computeBoundingSphere(); aim.computeLineDistances(); aim.visible = s.ammo > 0;
    mission.cameras.forEach((c, i) => drawCone(guards.length + i, c, cameraAngle(mission, i, s.time), s.crouch, 6.3));
    targets.forEach((t, i) => { t.visible = !s.collected[i]; t.rotation.y = s.time; t.position.y = Math.sin(s.time * 3) * .1; });
    (exit.material as THREE.MeshBasicMaterial).color.setHex((view.exitReady ?? objectivesComplete(mission, s)) ? 0x6cffab : 0x405958);
    noise.visible = !!s.noise; if (s.noise) { noise.position.set(s.noise.x, .04, s.noise.z); noise.scale.setScalar(1 + (3 - s.noise.life) % 1); }
    renderer.render(scene, view.mode === 'overhead' ? camera : perspective);
  }
  function disposeObject(object: THREE.Object3D) { object.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); } }); }
  return { draw, portrait(){frontWall.visible=false;player.visible=true;player.position.set(0,0,0);player.rotation.set(0,0,0);playerRing.visible=false;toy.visible=false;aim.visible=false;exit.visible=false;holdRing.visible=false;bubble.visible=false;noise.visible=false;perspective.fov=40;perspective.updateProjectionMatrix();perspective.position.set(0,1.05,Math.max(2.7,1.5/perspective.aspect));perspective.lookAt(0,.7,0);renderer.render(scene,perspective);}, preview(time:number){frontWall.visible=false;player.visible=false;playerRing.visible=false;toy.visible=false;aim.visible=false;const angle=.35+Math.sin(time*.12)*.3;perspective.position.set(Math.sin(angle)*size*2.1,size*1.6,Math.cos(angle)*size*2.1);perspective.lookAt(0,.5,0);targets.forEach((t,i)=>{t.rotation.y=time*.4;});renderer.render(scene,perspective);}, setAvatar(next:KartAvatar){const replacement=createVrCharacter(next);replacement.position.copy(player.position);replacement.rotation.copy(player.rotation);replacement.visible=player.visible;scene.remove(player);disposeObject(player);player=replacement;scene.add(player);}, dispose() { disposed = true; observer.disconnect(); sleepMarkers.forEach(s => { s.material.map?.dispose(); s.material.dispose(); }); aim.geometry.dispose(); (aim.material as THREE.Material).dispose(); disposeObject(scene); assets.forEach(disposeObject); mats.forEach(m => m.dispose()); renderer.dispose(); renderer.domElement.remove(); } };
}
