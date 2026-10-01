import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { HOLES } from './course';
import type { GolfView } from './engine';
const colors = ['#f9d66b', '#79dbff', '#fa91ae', '#c1e881', '#b9a0ff', '#ffad72'];
export default function GolfCanvas({ view, selfId, aim, overview }: { view: GolfView | null; selfId: string; aim: number; overview: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null), state = useRef({ view, selfId, aim, overview }); state.current = { view, selfId, aim, overview };
  const holeIndex = view?.players.find(p => p.id === selfId)?.hole ?? 0;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = canvas.current!; let renderer: THREE.WebGLRenderer | undefined, frame = 0, disposed = false;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#afdbdf'); scene.fog = new THREE.Fog('#afdbdf', 180, 560);
    const resources: (THREE.BufferGeometry | THREE.Material)[] = [];
    const geo = <T extends THREE.BufferGeometry>(g: T) => { resources.push(g); return g; };
    const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: .85, ...extra }); resources.push(m); return m; };
    const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
    const lost = (event: Event) => { event.preventDefault(); setFailed(true); disposed = true; cancelAnimationFrame(frame); };
    let observer: ResizeObserver | undefined;
    try {
      setFailed(false); renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      scene.add(new THREE.HemisphereLight('#efffff', '#456744', 2.1));
      const sun = new THREE.DirectionalLight('#fff4ce', 2.8); sun.position.set(-70, 130, -30); scene.add(sun);
      const hole = HOLES[holeIndex];
      mesh(geo(new THREE.BoxGeometry(220, 3, hole.cup.z + 160)), mat('#477d57'), 0, -1.6, hole.cup.z / 2);
      // Alternating mowing strips follow the line from tee to green.
      const length = Math.hypot(hole.cup.x, hole.cup.z), angle = Math.atan2(hole.cup.x, hole.cup.z);
      for (let i = 0; i < Math.ceil(length / 12); i++) {
        const z = i * 12; const strip = mesh(geo(new THREE.PlaneGeometry(hole.fairway * 2, 12)), mat(i % 2 ? '#72a464' : '#7bac6b'), Math.sin(angle) * z, .01, Math.cos(angle) * z);
        strip.rotation.set(-Math.PI / 2, 0, -angle);
      }
      const ellipse = (x: number, z: number, rx: number, rz: number, color: string, y = .03) => { const o = mesh(geo(new THREE.CircleGeometry(1, 48)), mat(color), x, y, z); o.rotation.x = -Math.PI / 2; o.scale.set(rx, rz, 1); return o; };
      for (const h of hole.water) { ellipse(h.x, h.z, h.rx + 1.5, h.rz + 1.5, '#b0c99a'); ellipse(h.x, h.z, h.rx, h.rz, '#4fa6b7', .04); }
      for (const h of hole.sand) ellipse(h.x, h.z, h.rx, h.rz, '#e4d6a5');
      ellipse(hole.cup.x, hole.cup.z, 17, 17, '#94c975', .05);
      ellipse(hole.cup.x, hole.cup.z, .9, .9, '#163a31', .07);
      mesh(geo(new THREE.CylinderGeometry(.1, .1, 6, 8)), mat('#f7f0d4'), hole.cup.x, 3, hole.cup.z);
      const flag = mesh(geo(new THREE.PlaneGeometry(3.2, 1.8)), mat('#ed735f', { side: THREE.DoubleSide }), hole.cup.x + 1.6, 5, hole.cup.z);
      const treeGeo = geo(new THREE.ConeGeometry(6, 16, 7)), trunkGeo = geo(new THREE.CylinderGeometry(.6, .8, 5, 6));
      const leaves = mat('#2f6650'), trunk = mat('#755b43');
      for (let i = 0; i < 34; i++) { const x = (i % 2 ? 1 : -1) * (49 + (i * 7 % 19)), z = -12 + i * (hole.cup.z + 50) / 34; mesh(trunkGeo, trunk, x, 2, z); mesh(treeGeo, leaves, x, 11, z); }
      for (const x of [-3, 3]) mesh(geo(new THREE.BoxGeometry(.6, .5, .6)), mat('#f4edda'), x, .25, -1.8);
      const ballGeo = geo(new THREE.SphereGeometry(.55, 12, 8));
      const markers = new Map<string, THREE.Group>();
      const lineMat = new THREE.LineDashedMaterial({ color: '#fff6c9', dashSize: 2, gapSize: 1 }); resources.push(lineMat);
      const lineGeo = geo(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]));
      const aimLine = new THREE.Line(lineGeo, lineMat); scene.add(aimLine);
      const camera = new THREE.PerspectiveCamera(48, 1, .1, 800); camera.position.set(60, 100, -65);
      const target = new THREE.Vector3(), cameraGoal = new THREE.Vector3(), lookAt = new THREE.Vector3();
      observer = new ResizeObserver(() => { const { width, height } = el.getBoundingClientRect(); if (width && height && renderer) { renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); } }); observer.observe(el);
      el.addEventListener('webglcontextlost', lost);
      let previous = performance.now();
      const draw = (now: number) => {
        if (disposed || !renderer) return;
        const dt = Math.min(.1, (now - previous) / 1000); previous = now;
        const { view: current, selfId: id, aim: direction, overview: full } = state.current;
        const me = current?.players.find(p => p.id === id);
        const active = (current?.players || []).filter(p => p.hole === holeIndex && p.connected);
        for (const p of active) {
          let group = markers.get(p.id);
          if (!group) {
            group = new THREE.Group();
            const ball = new THREE.Mesh(ballGeo, mat(p.id === id ? '#fffdf1' : colors[p.slot % colors.length])); group.add(ball);
            const ring = new THREE.Mesh(geo(new THREE.TorusGeometry(1.1, .09, 6, 24)), mat(colors[p.slot % colors.length])); ring.rotation.x = Math.PI / 2; group.add(ring);
            group.position.set(p.x, p.y + .55, p.z); scene.add(group); markers.set(p.id, group);
          }
          group.visible = true; target.set(p.x, p.y + .55, p.z); group.position.lerp(target, 1 - Math.exp(-dt * 16));
        }
        for (const [id, group] of markers) if (!active.some(p => p.id === id)) group.visible = false;
        const ball = me ? markers.get(me.id)?.position || new THREE.Vector3(me.x, me.y, me.z) : new THREE.Vector3(0, 0, 0);
        const base = Math.atan2(hole.cup.x - ball.x, hole.cup.z - ball.z);
        if (full || !me || current?.phase === 'lobby') { cameraGoal.set(65, hole.cup.z * .65 + 45, hole.cup.z * .28); target.set(0, 0, hole.cup.z / 2); }
        else { cameraGoal.set(ball.x - Math.sin(base) * 26, Math.max(17, ball.y + 14), ball.z - Math.cos(base) * 26); target.set(ball.x + Math.sin(base) * 13, Math.max(1, ball.y * .7), ball.z + Math.cos(base) * 13); }
        camera.position.lerp(cameraGoal, 1 - Math.exp(-dt * 3)); lookAt.lerp(target, 1 - Math.exp(-dt * 5)); camera.lookAt(lookAt);
        aimLine.visible = !!me && (me.phase === 'aim' || me.phase === 'ready');
        if (me) { const positions = lineGeo.getAttribute('position') as THREE.BufferAttribute; positions.setXYZ(0, me.x, .2, me.z); positions.setXYZ(1, me.x + Math.sin(direction) * 35, .2, me.z + Math.cos(direction) * 35); positions.needsUpdate = true; lineGeo.computeBoundingSphere(); aimLine.computeLineDistances(); }
        flag.rotation.y = Math.sin(now / 700) * .12;
        renderer.render(scene, camera); frame = requestAnimationFrame(draw);
      }; frame = requestAnimationFrame(draw);
    } catch (error) { console.error('Golf renderer initialization failed', error); setFailed(true); }
    return () => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); el.removeEventListener('webglcontextlost', lost); resources.forEach(r => r.dispose()); renderer?.dispose(); };
  }, [holeIndex, selfId]);
  return <><canvas className="gg-canvas" ref={canvas} aria-label="GAKURO GOLF 3D course" />{failed && <div className="gg-render-error" role="alert">3D rendering unavailable. Enable WebGL and reload.</div>}</>;
}
