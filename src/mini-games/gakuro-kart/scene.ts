import { createKartParts } from './kartModels';
import { cameraRoadFloor, chaseCameraPose } from './camera';
import { AVATAR_COLORS, BODY_COLORS, HAIR_COLORS, type KartAvatar } from './avatar';
import { createAvatarParts, type AvatarColor } from './avatarModels';
import { LANE_COLORS, QUIZ_GATES, QUIZ_END, laneCenter, quizDistance } from './learning';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { COURSES, FEATURES, getTrack, sampleTrack, ROAD_WIDTH } from './track';
import { MAX_RACERS, type Race } from './engine';

type InstancePart = { mesh: T.InstancedMesh; offset: T.Vector3; rotation: T.Euler; scale: T.Vector3; effect?: 'flame' | 'shield' | 'spark' | 'shadow'; colored?: boolean; avatarColor?: AvatarColor; visible?: (a: KartAvatar) => boolean };
export class KartScene {
  private renderer: T.WebGLRenderer;
  private scene = new T.Scene();
  private camera = new T.PerspectiveCamera(68, 1, .2, 1700);
  private parts: InstancePart[] = [];
  private boxes: T.Object3D[] = [];
  private quizRoad = new T.Group();
  private crashObstacle = new T.Group();
  private particles: T.Points;
  private state: Race;
  private received = performance.now();
  private smoothed = new Map<string, { distance: number; x: number }>();
  private clock = performance.now();
  private elapsed = 0;
  private dummy = new T.Object3D();
  private car = new T.Object3D();
  private matrix = new T.Matrix4();
  private cameraReady = false;
  private quality = 1;
  private frames = 0; private frameTime = 0;
  private size = { width: 0, height: 0 };
  private textures: T.Texture[] = [];
  constructor(private canvas: HTMLCanvasElement, world: Race, private selfId: string, private preview: boolean, private onFailure: () => void) {
    this.state = world;
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = T.SRGBColorSpace; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.3;
    const theme = COURSES[world.course]; this.scene.background = new T.Color(theme.sky); this.scene.fog = new T.Fog(theme.fog, 150, 950);
    this.scene.add(new T.HemisphereLight([1, 4, 5].includes(world.course) ? '#ecffff' : '#b7bfff', '#393452', 2.4));
    const sun = new T.DirectionalLight([1, 4, 5].includes(world.course) ? '#fff4ce' : '#ffd8bf', 3.2); sun.position.set(-160, 250, 70); this.scene.add(sun);
    this.buildWorld(); this.buildCars(); this.buildQuizRoad();
    const pos = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) { pos[i * 3] = Math.sin(i * 17.34) * 200 + 180; pos[i * 3 + 1] = 12 + (i % 23) * 4; pos[i * 3 + 2] = Math.cos(i * 29.41) * 330 - 70; }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    this.particles = new T.Points(geo, new T.PointsMaterial({ color: theme.accent, size: .65, transparent: true, opacity: .6, depthWrite: false })); this.scene.add(this.particles);
    canvas.addEventListener('webglcontextlost', this.lost);
  }
  private lost = (e: Event) => { e.preventDefault(); this.onFailure(); };
  setWorld(world: Race) { if (world !== this.state) { this.state = world; this.received = performance.now(); } }
  private standard(color: T.ColorRepresentation, metalness = 0, roughness = .65, emissive?: T.ColorRepresentation) {
    return new T.MeshStandardMaterial({ color, metalness, roughness, ...(emissive ? { emissive, emissiveIntensity: .65 } : {}) });
  }
  private texture(kind: 'road' | 'windows' | 'banner' | 'pad') {
    const c = document.createElement('canvas'); c.width = 512; c.height = kind === 'banner' ? 128 : 512; const ctx = c.getContext('2d')!;
    if (kind === 'road') {
      ctx.fillStyle = '#283143'; ctx.fillRect(0, 0, 512, 512); let n = 143;
      for (let i = 0; i < 14000; i++) { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; ctx.fillStyle = i % 2 ? '#ffffff08' : '#0000000c'; ctx.fillRect(n % 512, (n >>> 12) % 512, 2, 2); }
      ctx.fillStyle = '#46505d'; ctx.fillRect(0, 0, 3, 512); ctx.fillRect(509, 0, 3, 512);
    } else if (kind === 'windows') {
      ctx.fillStyle = '#23334d'; ctx.fillRect(0, 0, 512, 512);
      for (let y = 8; y < 512; y += 32) for (let x = 10; x < 512; x += 48) { ctx.fillStyle = (x + y) % 5 ? '#6eb5c8' : '#ebd5a4'; ctx.fillRect(x, y, 22, 14); }
    } else if (kind === 'banner') {
      ctx.fillStyle = '#0c1830'; ctx.fillRect(0, 0, 512, 128); ctx.strokeStyle = COURSES[this.state.course].accent; ctx.lineWidth = 10; ctx.strokeRect(2, 2, 508, 124);
      ctx.fillStyle = '#f3fffe'; ctx.font = '900 55px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GAKURO GP', 256, 83);
    } else {
      ctx.fillStyle = '#164345'; ctx.fillRect(0, 0, 512, 512); ctx.strokeStyle = '#67ffe4'; ctx.lineWidth = 34;
      for (let y = -40; y < 560; y += 150) { ctx.beginPath(); ctx.moveTo(60, y + 90); ctx.lineTo(256, y); ctx.lineTo(452, y + 90); ctx.stroke(); }
    }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy()); this.textures.push(t); return t;
  }
  private ribbon(left: number, right: number, lift: number, material: T.Material, texture = false) {
    const track = getTrack(this.state.course), vertices: number[] = [], uv: number[] = [], indices: number[] = [];
    for (let i = 0; i <= 1024; i++) {
      for (const lane of [left, right]) { const p = sampleTrack(i / 1024 * track.length, this.state.course, lane); vertices.push(p.x, p.y + lift, p.z); uv.push(lane === left ? 0 : 1, i / 1024 * (texture ? track.length / 24 : 1)); }
      if (i < 1024) { const k = i * 2; indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(indices); g.computeVertexNormals();
    this.scene.add(new T.Mesh(g, material));
  }
  private staticInstances(geometry: T.BufferGeometry, material: T.Material, count: number, place: (i: number, o: T.Object3D) => void) {
    const mesh = new T.InstancedMesh(geometry, material, count), o = new T.Object3D();
    for (let i = 0; i < count; i++) { o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); place(i, o); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); }
    mesh.computeBoundingSphere(); this.scene.add(mesh); return mesh;
  }
  private buildWorld() {
    const course = this.state.course, theme = COURSES[course], track = getTrack(course);
    const road = this.standard('#ffffff', .25, .78); road.map = this.texture('road'); road.side = T.DoubleSide;
    this.ribbon(-ROAD_WIDTH / 2, ROAD_WIDTH / 2, 0, road, true);
    const foundation = this.standard('#111b33', .4); foundation.side = T.DoubleSide; this.ribbon(-15, 15, -.28, foundation);
    const neon = new T.MeshBasicMaterial({ color: theme.accent, side: T.DoubleSide });
    for (const s of [-1, 1]) {
      this.ribbon(s * 13 - .14, s * 13 + .14, .75, neon);
      this.ribbon(s * 11.5 - .13, s * 11.5 + .13, .018, new T.MeshBasicMaterial({ color: '#d4dfeb', side: T.DoubleSide }));
    }
    this.staticInstances(new T.BoxGeometry(.5, .75, 8), this.standard('#425978', .65), 440, (i, o) => {
      const p = sampleTrack(Math.floor(i / 2) / 220 * track.length, course, i % 2 ? 13 : -13); o.position.set(p.x, p.y + .2, p.z); o.rotation.y = Math.atan2(p.tx, p.tz); o.rotation.x = -Math.atan(p.ty);
    });
    for (let side = 0; side < 2; side++) this.staticInstances(new T.BoxGeometry(1.2, .08, 3), new T.MeshBasicMaterial({ color: side ? theme.second : '#e5f9ff' }), 440, (i, o) => {
      const p = sampleTrack((i * 2 + side) / 880 * track.length, course, i % 2 ? 12 : -12); o.position.set(p.x, p.y + .08, p.z); o.rotation.y = Math.atan2(p.tx, p.tz); o.rotation.x = -Math.atan(p.ty);
    });
    this.staticInstances(new T.BoxGeometry(.14, .02, 4), new T.MeshBasicMaterial({ color: '#778497' }), 300, (i, o) => {
      const p = sampleTrack(Math.floor(i / 2) / 150 * track.length, course, i % 2 ? 4 : -4); o.position.set(p.x, p.y + .025, p.z); o.rotation.y = Math.atan2(p.tx, p.tz);
    });
    const ground = new T.Mesh(new T.PlaneGeometry(4000, 4000), this.standard(theme.ground)); ground.rotation.x = -Math.PI / 2; ground.position.y = -28; this.scene.add(ground);
    if (course === 3) {
      // Oversized bookshelves beside the library circuit.
      for (const [shelf, color] of ['#ce715e', '#728ccc', '#e3c378', '#79b0a4'].entries()) this.staticInstances(new T.BoxGeometry(2.4, 8, 4), this.standard(color), 32, (i, o) => {
        const p = sampleTrack((i + .25 * shelf) / 32 * track.length, course, i % 2 ? 26 + shelf * 3 : -26 - shelf * 3); o.position.set(p.x, p.y + 4, p.z); o.rotation.y = Math.atan2(p.tx, p.tz); o.scale.y = .8 + i % 3 * .2;
      });
    }
    if (course === 4) {
      this.staticInstances(new T.ConeGeometry(9, 24, 8), this.standard('#33674e'), 100, (i, o) => { const p = sampleTrack(i / 100 * track.length, course, i % 2 ? 33 : -33); o.position.set(p.x, p.y + 12, p.z); });
    }
    if (course === 5) {
      const water = new T.Mesh(new T.PlaneGeometry(4000, 4000), this.standard('#267ba8', .25, .18)); water.rotation.x = -Math.PI / 2; water.position.y = -27.8; this.scene.add(water);
      this.staticInstances(new T.ConeGeometry(9, 15, 3), this.standard('#fff6d6'), 30, (i, o) => { const p = sampleTrack(i / 30 * track.length, course, i % 2 ? 49 : -49); o.position.set(p.x, -12, p.z); o.rotation.y = i; });
    }
    if (course === 6) {
      for (const [band, color] of ['#65ffc9', '#ad8aff', '#70ceff'].entries()) {
        const vertices: number[] = [];
        for (let i = 0; i <= 36; i++) { const x = -250 + i * 30, z = 600 + band * 100 + Math.sin(i / 4) * 60; vertices.push(x, 130 + Math.sin(i / 5) * 25, z, x, 190 + Math.sin(i / 5) * 25, z); }
        const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); const indices: number[] = []; for (let i = 0; i < 36; i++) { const k = i * 2; indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } geometry.setIndex(indices);
        this.scene.add(new T.Mesh(geometry, new T.MeshBasicMaterial({ color, transparent: true, opacity: .32, side: T.DoubleSide, depthWrite: false })));
      }
    }
    if (course === 7) {
      this.staticInstances(new T.BoxGeometry(10, 3, 14), this.standard('#657493'), 90, (i, o) => { const p = sampleTrack(Math.floor(i / 3) / 30 * track.length, course, (i % 2 ? 1 : -1) * (28 + i % 3 * 9)); o.position.set(p.x, p.y + 2 + i % 3 * 3, p.z); o.rotation.y = Math.atan2(p.tx, p.tz); });
    }
    const windows = this.texture('windows');
    const buildings = this.standard([1, 4, 5].includes(course) ? '#efffff' : '#7387a2', .35); buildings.map = windows; buildings.emissiveMap = windows; buildings.emissive = new T.Color(theme.accent); buildings.emissiveIntensity = [1, 4, 5].includes(course) ? .05 : .32;
    this.staticInstances(course === 2 ? new T.CylinderGeometry(.5, .5, 1, 12) : new T.BoxGeometry(1, 1, 1), buildings, 90, (i, o) => {
      const p = sampleTrack(i / 90 * track.length, course, (i % 2 ? -1 : 1) * (40 + i % 4 * 20)), h = 18 + i * 17 % 73;
      o.position.set(p.x, h / 2 - 25, p.z); o.scale.set(13 + i % 3 * 7, h, 13 + i % 4 * 6); o.rotation.y = Math.atan2(p.tx, p.tz);
    });
    this.staticInstances(new T.CylinderGeometry(7, 3, 18, 6), this.standard(course === 1 ? '#67a397' : '#28384f'), 54, (i, o) => {
      const p = sampleTrack(i / 54 * track.length, course, i % 2 ? 25 : -25); o.position.set(p.x, p.y - 10, p.z); o.scale.set(1.5, 1, 1.5);
    });
    this.staticInstances(new T.CylinderGeometry(.4, .65, 7, 6), this.standard('#615161'), 90, (i, o) => {
      const p = sampleTrack(i / 90 * track.length, course, i % 2 ? 22 : -22); o.position.set(p.x, p.y + 1, p.z);
    });
    this.staticInstances(new T.IcosahedronGeometry(4.7, 1), this.standard([1, 4].includes(course) ? '#75c5a2' : course === 0 ? '#e98caf' : course === 6 ? '#98cfff' : '#dc9b80'), 90, (i, o) => {
      const p = sampleTrack(i / 90 * track.length, course, i % 2 ? 22 : -22); o.position.set(p.x, p.y + 6, p.z); o.scale.set(1, .8 + i % 3 * .1, 1); o.rotation.y = i;
    });
    for (let i = 0; i < 7; i++) {
      const p = sampleTrack(i / 7 * track.length, course), group = new T.Group(); group.position.set(p.x, p.y, p.z); group.rotation.y = Math.atan2(p.tx, p.tz);
      for (const s of [-1, 1]) { const pillar = new T.Mesh(new T.BoxGeometry(.8, 11, .9), this.standard('#3b536b', .6, .4, theme.accent)); pillar.position.set(s * 14, 5.5, 0); group.add(pillar); }
      const top = new T.Mesh(new T.BoxGeometry(28, .5, .8), neon); top.position.y = 11; group.add(top);
      if (!i) {
        const banner = new T.Mesh(new T.BoxGeometry(22, 4.2, .3), new T.MeshBasicMaterial({ map: this.texture('banner') })); banner.position.y = 9; group.add(banner);
        for (let x = 0; x < 16; x++) for (let z = 0; z < 2; z++) { const tile = new T.Mesh(new T.PlaneGeometry(1.5, 1.5), new T.MeshBasicMaterial({ color: (x + z) % 2 ? '#18213b' : '#eaffff' })); tile.rotation.x = -Math.PI / 2; tile.position.set(-11.25 + x * 1.5, .05, z * 1.5); group.add(tile); }
      } this.scene.add(group);
    }
    const padTexture = this.texture('pad');
    for (const f of FEATURES) {
      const p = sampleTrack(f.at * track.length, course, f.lane);
      if (f.type === 'box') {
        const group = new T.Group(); group.position.set(p.x, p.y + 2.3, p.z);
        group.add(new T.Mesh(new T.OctahedronGeometry(1.65), this.standard('#9aeaff', .5, .18, '#23aacc')));
        const ring = new T.Mesh(new T.TorusGeometry(1.9, .055, 5, 24), neon); ring.rotation.x = Math.PI / 2; group.add(ring);
        this.scene.add(group); this.boxes.push(group);
      } else {
        const pad = new T.Mesh(new T.BoxGeometry(f.type === 'jump' ? 10 : 5.6, f.type === 'jump' ? .9 : .045, 7), new T.MeshStandardMaterial({ map: padTexture, emissiveMap: padTexture, emissive: '#66ffdd', emissiveIntensity: .9 }));
        pad.position.set(p.x, p.y + (f.type === 'jump' ? .35 : .06), p.z); pad.rotation.set(f.type === 'jump' ? -.11 : 0, Math.atan2(p.tx, p.tz), 0); this.scene.add(pad);
      }
    }
    if (course === 1) this.staticInstances(new T.IcosahedronGeometry(1, 2), this.standard('#ecfaff', 0, 1), 50, (i, o) => {
      o.position.set(Math.sin(i * 17.3) * 500 + 180, -17 + i % 4 * 2, Math.cos(i * 9.3) * 580 - 50); o.scale.set(30 + i % 3 * 15, 10, 25 + i % 5 * 9);
    });
    const moon = new T.Mesh(new T.SphereGeometry(36, 24, 16), new T.MeshBasicMaterial({ color: course === 1 ? '#fff3cb' : '#ffc4a4' })); moon.position.set(-190, 220, 410); this.scene.add(moon);
    const halo = new T.Mesh(new T.TorusGeometry(53, .7, 6, 64), new T.MeshBasicMaterial({ color: theme.second })); halo.position.copy(moon.position); halo.rotation.set(.65, -.4, .5); this.scene.add(halo);
  }
  private buildQuizRoad() {
    const course = this.state.course;
    for (let lane = 0; lane < 4; lane++) {
        const material = new T.MeshBasicMaterial({ color: LANE_COLORS[lane], transparent: true, opacity: .17, depthWrite: false });
        const center = sampleTrack(QUIZ_END / 2, course, laneCenter(lane));
        const strip = new T.Mesh(new T.BoxGeometry(5.75, .025, QUIZ_END), material);
        strip.position.set(center.x, center.y + .06, center.z); strip.rotation.y = Math.atan2(center.tx, center.tz); this.quizRoad.add(strip);
        for (let d = 25; d < QUIZ_END; d += 30) {
          const p = sampleTrack(d, course, laneCenter(lane));
          const c = document.createElement('canvas'); c.width = 128; c.height = 128;
          const ctx = c.getContext('2d')!; ctx.fillStyle = LANE_COLORS[lane]; ctx.font = '900 90px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(lane + 1), 64, 100);
          const texture = new T.CanvasTexture(c); texture.colorSpace = T.SRGBColorSpace; this.textures.push(texture);
          const number = new T.Mesh(new T.PlaneGeometry(3, 3), new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: T.DoubleSide }));
          number.rotation.set(-Math.PI / 2, 0, Math.PI); number.position.set(p.x, p.y + .1, p.z); this.quizRoad.add(number);
        }
        for (const distance of QUIZ_GATES) {
          const p = sampleTrack(distance, course, laneCenter(lane)), group = new T.Group(); group.position.set(p.x, p.y, p.z);
          const mat = new T.MeshBasicMaterial({ color: LANE_COLORS[lane] });
          for (const side of [-1, 1]) { const post = new T.Mesh(new T.BoxGeometry(.12, 5, .2), mat); post.position.set(side * 2.9, 2.5, 0); group.add(post); }
          const top = new T.Mesh(new T.BoxGeometry(5.9, .2, .2), mat); top.position.y = 5; group.add(top);
          const line = new T.Mesh(new T.BoxGeometry(5.8, .04, .6), mat); line.position.y = .12; group.add(line); this.quizRoad.add(group);
        }
    }
    const barrier = new T.Mesh(new T.BoxGeometry(2.8, 1.1, .6), this.standard('#ffb74f', .25)); barrier.position.y = .8; this.crashObstacle.add(barrier);
    for (const x of [-1, 0, 1]) { const stripe = new T.Mesh(new T.BoxGeometry(.3, 1.1, .64), this.standard('#18213b')); stripe.position.set(x, .8, 0); stripe.rotation.z = -.3; this.crashObstacle.add(stripe); }
    this.scene.add(this.quizRoad, this.crashObstacle);
  }
  private part(geometry: T.BufferGeometry, material: T.Material, offset: number[], scale = [1, 1, 1], rotation = [0, 0, 0], effect?: InstancePart['effect'], colored = false) {
    const mesh = new T.InstancedMesh(geometry, material, MAX_RACERS); mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.frustumCulled = false; this.scene.add(mesh);
    const part: InstancePart = { mesh, offset: new T.Vector3(...offset), scale: new T.Vector3(...scale), rotation: new T.Euler(...rotation), effect, colored }; this.parts.push(part); return part;
  }
  private buildCars() {
    const shell = new RoundedBoxGeometry(1, 1, 1, 2, .12);
    for (const asset of [...createKartParts(), ...createAvatarParts()]) {
      const part = this.part(asset.geometry, asset.material, asset.position, asset.scale, asset.rotation);
      part.avatarColor = asset.color; part.visible = asset.visible;
    }
    for (const x of [-.59, .59]) {
      this.part(shell, new T.MeshBasicMaterial({ color: '#ff576b' }), [x, .78, -1.64], [.32, .12, .04]);
      this.part(new T.ConeGeometry(.3, 2.7, 7), new T.MeshBasicMaterial({ color: '#7efff0', transparent: true, opacity: .9 }), [x, .53, -2.5], [1, 1, 1], [-Math.PI / 2, 0, 0], 'flame');
      this.part(new T.IcosahedronGeometry(.2), new T.MeshBasicMaterial({ color: '#ffc565' }), [x * 1.8, .2, -1.45], [1, 1, 1], [0, 0, 0], 'spark');
    }
    this.part(new T.SphereGeometry(1, 16, 10), new T.MeshBasicMaterial({ color: '#73e6ff', transparent: true, opacity: .14, depthWrite: false }), [0, 1, 0], [1.8, 1.8, 2.3], [0, 0, 0], 'shield');
    this.part(new T.CircleGeometry(1, 16), new T.MeshBasicMaterial({ color: '#050c1e', transparent: true, opacity: .3, depthWrite: false }), [0, .035, 0], [1.6, 2.2, 1], [-Math.PI / 2, 0, 0], 'shadow');
  }
  draw(now: number) {
    const dt = Math.min(.06, (now - this.clock) / 1000); this.clock = now; this.elapsed += dt;
    const width = this.canvas.clientWidth, height = this.canvas.clientHeight; if (!width || !height) return;
    if (width !== this.size.width || height !== this.size.height) { this.size = { width, height }; this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); }
    this.frameTime += dt; this.frames++;
    if (this.frames === 180) { if (this.frameTime / this.frames > .027 && this.quality > .65) { this.quality -= .15; this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5) * this.quality); this.size.width = 0; } this.frames = 0; this.frameTime = 0; }
    const w = this.state, me = w.players[this.selfId] || Object.values(w.players)[0]; if (!me) return;
    this.quizRoad.visible = !!w.lesson && !me.finish && quizDistance(me.distance, getTrack(w.course).length) < QUIZ_END && !this.preview;
    this.crashObstacle.visible = me.crash > 0;
    if (me.crash > 0) { const impact = sampleTrack(me.distance + 2, w.course, me.x); this.crashObstacle.position.set(impact.x, impact.y, impact.z); this.crashObstacle.rotation.y = Math.atan2(impact.tx, impact.tz); }
    const racers = Object.values(w.players), age = w.phase === 'race' && !w.paused ? Math.min(.15, (now - this.received) / 1000) : 0;
    let ownPoint = sampleTrack(me.distance, w.course, me.x), ownDistance = me.distance;
    for (const part of this.parts) part.mesh.count = 0;
    racers.forEach((p, index) => {
      const target = p.distance + p.speed * age, s = this.smoothed.get(p.id) || { distance: target, x: p.x };
      if (Math.abs(s.distance - target) > 40 || w.phase === 'lobby') { s.distance = target; s.x = p.x; }
      const blend = 1 - Math.exp(-dt * 18); s.distance += (target - s.distance) * blend; s.x += (p.x - s.x) * blend; this.smoothed.set(p.id, s);
      const pt = sampleTrack(s.distance, w.course, s.x), jump = p.jump > 0 ? Math.sin(Math.PI * Math.min(1, p.jump / 1.3)) * 4.5 : 0;
      if (p.id === me.id) { ownPoint = pt; ownDistance = s.distance; }
      this.car.position.set(pt.x, pt.y + jump + .07 + (p.crash > 0 ? Math.abs(Math.sin(p.crash * 8)) * .55 : 0), pt.z); this.car.rotation.set(-Math.atan(pt.ty), Math.atan2(pt.tx, pt.tz) + p.steer * (p.drift ? .38 : .09) + (p.crash > 0 ? (2.4 - p.crash) * Math.PI * 3 : 0), -p.steer * .045); this.car.updateMatrix();
      // During free run, compare physical positions on the circuit across laps.
      let gap = p.distance - me.distance;
      if (me.finish) { const length = getTrack(w.course).length; gap = ((gap + length / 2) % length + length) % length - length / 2; }
      for (const part of this.parts) {
        if (part.visible && !part.visible(p.avatar)) continue;
        const partIndex = part.mesh.count++;
        this.dummy.position.copy(part.offset); this.dummy.rotation.copy(part.rotation); this.dummy.scale.copy(part.scale);
        if (part.effect === 'flame') this.dummy.scale.setScalar(p.boost > 0 ? .85 + Math.sin(now * .043 + index) * .15 : .001);
        if (part.effect === 'shield' && p.shield <= 0) this.dummy.scale.setScalar(.001);
        if (part.effect === 'spark') { this.dummy.scale.setScalar((p.charge > .25 || p.crash > 0) ? 1 + Math.sin(now * .07 + index) * .4 : .001); this.dummy.position.z -= (now / 90 + index) % 1.5; }
        if (part.effect === 'shadow') this.dummy.position.y -= jump;
        if (!this.preview && p.id !== me.id && gap < -3) this.dummy.scale.setScalar(.001);
        this.dummy.updateMatrix(); this.matrix.multiplyMatrices(this.car.matrix, this.dummy.matrix); part.mesh.setMatrixAt(partIndex, this.matrix);
        if (part.colored) part.mesh.setColorAt(partIndex, new T.Color(AVATAR_COLORS[p.avatar.outfit]));
        if (part.avatarColor) { const colors = part.avatarColor === 'body' ? BODY_COLORS : part.avatarColor === 'hair' ? HAIR_COLORS : AVATAR_COLORS; part.mesh.setColorAt(partIndex, new T.Color(colors[p.avatar[part.avatarColor]])); }
      }
    });
    for (const part of this.parts) { part.mesh.instanceMatrix.needsUpdate = true; if (part.mesh.instanceColor) part.mesh.instanceColor.needsUpdate = true; }
    const target = new T.Vector3(), look = new T.Vector3();
    if (this.preview) {
      const orbit = Math.sin(this.elapsed * .25) * .7, p = ownPoint; target.set(p.x + Math.sin(orbit + .65) * 6, p.y + 3.6, p.z + Math.cos(orbit + .65) * 6); look.set(p.x, p.y + 1.55, p.z);
    } else {
      const pose = chaseCameraPose(ownDistance, w.course, this.smoothed.get(me.id)?.x ?? me.x, me.jump > 0);
      target.set(pose.position.x, pose.position.y, pose.position.z);
      if (me.crash > 0) { target.x += Math.sin(now * .04) * .2; target.y += Math.cos(now * .035) * .15; }
      look.set(pose.look.x, pose.look.y, pose.look.z);
      const fov = 66 + Math.min(12, me.speed / 7) + (me.boost > 0 ? 6 : 0); this.camera.fov += (fov - this.camera.fov) * (1 - Math.exp(-dt * 5)); this.camera.updateProjectionMatrix();
    }
    if (!this.cameraReady) { this.camera.position.copy(target); this.cameraReady = true; } else this.camera.position.lerp(target, 1 - Math.exp(-dt * 18));
    if (!this.preview) this.camera.position.y = Math.max(this.camera.position.y, cameraRoadFloor(this.camera.position, ownDistance, w.course));
    this.camera.lookAt(look);
    for (let i = 0; i < this.boxes.length; i++) { this.boxes[i].rotation.y = this.elapsed * 1.3; this.boxes[i].rotation.z = Math.sin(this.elapsed * 1.5 + i) * .16; }
    this.particles.position.y = Math.sin(this.elapsed * .3) * 3; this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.canvas.removeEventListener('webglcontextlost', this.lost);
    const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
    this.scene.traverse(o => { const m = o as T.Mesh; if (m.geometry) geometries.add(m.geometry); if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(v => materials.add(v)); if (o instanceof T.InstancedMesh) o.dispose(); });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); this.textures.forEach(t => t.dispose()); this.renderer.dispose();
  }
}
