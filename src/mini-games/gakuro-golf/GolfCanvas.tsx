import { configureStorybook, paintedSurface, storybookWater } from '../../three/storybookStyle';
import { useStorybookQuality } from '../../three/StorybookQuality';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { HOLES } from './course';
import type { Club, GolfView, PublicGolfer } from './engine';
import { defaultAvatar, type KartAvatar } from '../gakuro-kart/avatar';
import { BallMotion, predictShot } from './motion';
import { createGolferAssets, type GolferRig } from './golferModels';
import { createCourseScenery } from './courseScenery';
const colors = ['#f9d66b', '#79dbff', '#fa91ae', '#c1e881', '#b9a0ff', '#ffad72'];
const previewPlayer: PublicGolfer = { id: 'preview', name: '', slot: 0, connected: true, hole: 0, strokes: 0, scores: [], x: 0, y: 0, z: 0, phase: 'ready', correct: 3, totalCorrect: 0, shotId: 0, shotsLeft: 3, penalty: false, penaltyKind: null, capped: false };
export default function GolfCanvas({ view, selfId, aim, overview, club = 'driver', power = .7, spin = 0, avatar = defaultAvatar(), portrait = false, spectator = false }: { view: GolfView | null; selfId: string; aim: number; overview: boolean; club?: Club; power?: number; spin?: number; avatar?: KartAvatar; portrait?: boolean; spectator?: boolean }) {
  const quality=useStorybookQuality();
  const canvas = useRef<HTMLCanvasElement>(null), state = useRef({ view, selfId, aim, overview, club, power, spin, avatar, spectator }); state.current = { view, selfId, aim, overview, club, power, spin, avatar, spectator };
  const holeIndex = view?.players.find(p => p.id === selfId)?.hole ?? 0;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = canvas.current!; let renderer: THREE.WebGLRenderer | undefined, frame = 0, disposed = false;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#9bcee5'); scene.fog = new THREE.Fog('#c6ddcc', 210, 750);
    const resources: (THREE.BufferGeometry | THREE.Material)[] = [];
    const golferAssets = createGolferAssets();
    type Marker = { ball: THREE.Mesh; shadow: THREE.Mesh; motion: BallMotion; rig: GolferRig; player: PublicGolfer; swingStart: number; cheerStart: number; origin: THREE.Vector3; direction: number; avatarKey: string };
    const markers = new Map<string, Marker>();
    const geo = <T extends THREE.BufferGeometry>(g: T) => { resources.push(g); return g; };
    const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: .85, ...extra }); resources.push(m); if(extra.map)paintedSurface(m); return m; };
    const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.receiveShadow = true; scene.add(o); return o; };
    const lost = (event: Event) => { event.preventDefault(); setFailed(true); disposed = true; cancelAnimationFrame(frame); };
    let observer: ResizeObserver | undefined, scenery: ReturnType<typeof createCourseScenery> | undefined;
    try {
      setFailed(false); renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true, powerPreference: 'high-performance' });
      const profile=configureStorybook(renderer,quality); renderer.shadowMap.enabled = profile.shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      scene.add(new THREE.HemisphereLight('#efffff', '#456744', 2.1));
      const sun = new THREE.DirectionalLight('#fff4ce', 2.8); sun.position.set(-70, 130, -30); sun.castShadow=profile.shadows;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-90;sun.shadow.camera.right=90;sun.shadow.camera.top=90;sun.shadow.camera.bottom=-90;sun.shadow.camera.far=350;sun.shadow.normalBias=.08; scene.add(sun);
      const hole = HOLES[holeIndex];
      scenery = createCourseScenery(scene,hole,quality);
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
      mesh(geo(new THREE.BoxGeometry(220, 3, hole.cup.z + 160)), mat('#ffffff', {map:scenery.grass}), 0, -1.6, hole.cup.z / 2);
      // Alternating mowing strips follow the line from tee to green.
      const length = Math.hypot(hole.cup.x, hole.cup.z), angle = Math.atan2(hole.cup.x, hole.cup.z);
      for (let i = 0; i < Math.ceil(length / 12); i++) {
        const z = i * 12; const strip = mesh(geo(new THREE.PlaneGeometry(hole.fairway * 2, 12)), mat(i % 2 ? '#f3f6da' : '#ffffff', {map:scenery.fairway}), Math.sin(angle) * z, .01, Math.cos(angle) * z);
        strip.rotation.set(-Math.PI / 2, 0, -angle);
      }
      const ellipse = (x: number, z: number, rx: number, rz: number, color: string, y = .03) => { const o = mesh(geo(new THREE.CircleGeometry(1, 48)), mat(color), x, y, z); o.rotation.x = -Math.PI / 2; o.scale.set(rx, rz, 1); return o; };
      const animatedWater=storybookWater();resources.push(animatedWater.material);
      for (const h of hole.water) { ellipse(h.x, h.z, h.rx + 1.5, h.rz + 1.5, '#b0c99a'); const pool=ellipse(h.x,h.z,h.rx,h.rz,'#4fa6b7',.04);pool.material=animatedWater.material; }
      for (const h of hole.sand) { ellipse(h.x,h.z,h.rx+1,h.rz+1,'#bcc184',.025); ellipse(h.x, h.z, h.rx, h.rz, '#ead9a5'); }
      const green = ellipse(hole.cup.x, hole.cup.z, 17, 17, '#ffffff', .05); (green.material as THREE.MeshStandardMaterial).map = scenery.green;
      ellipse(hole.cup.x, hole.cup.z, .9, .9, '#163a31', .07);
      mesh(geo(new THREE.CylinderGeometry(.1, .1, 6, 8)), mat('#f7f0d4'), hole.cup.x, 3, hole.cup.z);
      const flag = mesh(geo(new THREE.PlaneGeometry(3.2, 1.8)), mat('#ed735f', { side: THREE.DoubleSide }), hole.cup.x + 1.6, 5, hole.cup.z);
      for (const x of [-3, 3]) mesh(geo(new THREE.BoxGeometry(.6, .5, .6)), mat('#f4edda'), x, .25, -1.8);
      const ballGeo = geo(new THREE.SphereGeometry(.16, 12, 8));
      const lineMat = new THREE.LineDashedMaterial({ color: '#fff6c9', dashSize: 2, gapSize: 1 }); resources.push(lineMat);
      const lineGeo = geo(new THREE.BufferGeometry()); lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(512 * 3), 3));
      const aimLine = new THREE.Line(lineGeo, lineMat); scene.add(aimLine);
      const landing = mesh(geo(new THREE.TorusGeometry(1.4, .12, 6, 24)), mat('#fff6c9'), 0, .1, 0); landing.rotation.x = Math.PI / 2;
      const camera = new THREE.PerspectiveCamera(48, 1, .1, 800); camera.position.set(60, 100, -65);
      if (portrait) { camera.position.set(1, 3.8, 8); camera.lookAt(-2, 2.6, 0); }
      const target = new THREE.Vector3(), cameraGoal = new THREE.Vector3(), lookAt = new THREE.Vector3(portrait ? -2 : 0, portrait ? 2.6 : 0, 0);
      let viewportWidth=1,viewportHeight=1,lastLift=-1,offsetWidth=0,offsetHeight=0;
      observer = new ResizeObserver(() => { const { width, height } = el.getBoundingClientRect(); if (width && height && renderer) { viewportWidth=width;viewportHeight=height;renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); } }); observer.observe(el);
      el.addEventListener('webglcontextlost', lost);
      let previous = performance.now();
      let lastView: GolfView | null | undefined, previewKey = '';
      const draw = (now: number) => {
        if (disposed || !renderer) return;
        const dt = Math.min(.1, (now - previous) / 1000); previous = now;
        const { view: current, selfId: id, aim: direction, overview: full, club: selectedClub, power: selectedPower, avatar: localAvatar } = state.current;
        const me = current?.players.find(p => p.id === id);
        const active = (current?.players || [previewPlayer]).filter(p => p.hole === holeIndex && p.connected && !p.spectator);
        const received = lastView !== current; lastView = current;
        const nearest = new Set([...active].sort((a,b) => Math.hypot(a.x-(me?.x||0),a.z-(me?.z||0))-Math.hypot(b.x-(me?.x||0),b.z-(me?.z||0))).slice(0, 12).map(p=>p.id));
        if (me) nearest.add(me.id);
        for (const p of active) {
          const look = (p.id === id && !state.current.spectator) || !current ? localAvatar : p.avatar || defaultAvatar(p.slot);
          let marker = markers.get(p.id);
          if (!marker) {
            const ownBall = p.id === id || !current;
            const ball = new THREE.Mesh(ballGeo, mat(ownBall ? '#fffdf1' : colors[p.slot % colors.length], ownBall ? {} : {transparent:true,opacity:.7,depthWrite:false}));
            if (!ownBall) ball.scale.setScalar(.65); scene.add(ball);
            const shadow = mesh(geo(new THREE.CircleGeometry(.3, 16)), mat('#183e34', {transparent:true,opacity:.3,depthWrite:false}), p.x, .08, p.z); shadow.rotation.x = -Math.PI/2;
            const rig = golferAssets.create(look); rig.root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(rig.root);
            marker = { ball, shadow, rig, motion: new BallMotion(), player: p, swingStart: -Infinity, cheerStart: p.phase === 'holed' && !p.capped ? now : -Infinity, origin: new THREE.Vector3(p.x, 0, p.z), direction: 0, avatarKey: JSON.stringify(look) };
            marker.motion.push(p, now); markers.set(p.id, marker);
          }
          if (received) {
            if (p.phase === 'moving' && (marker.player.phase !== 'moving' || marker.player.strokes !== p.strokes)) {
              marker.swingStart = now;
              marker.origin.set(p.origin?.x ?? marker.player.x, 0, p.origin?.z ?? marker.player.z);
              marker.direction = p.shotAngle ?? Math.atan2(p.x-marker.player.x,p.z-marker.player.z);
            }
            if (p.phase === 'holed' && marker.player.phase !== 'holed' && !p.capped) marker.cheerStart = now;
            marker.motion.push(p, now); marker.player = p;
          }
          const avatarKey = JSON.stringify(look); if (marker.avatarKey !== avatarKey) { marker.rig.update(look); marker.avatarKey = avatarKey; }
          const position = marker.motion.sample(now);
          marker.ball.visible = marker.shadow.visible = true;
          marker.ball.position.set(position.x, position.y + .16, position.z);
          marker.shadow.position.set(position.x, .08, position.z); marker.shadow.scale.setScalar(1 + Math.min(1.8, position.y * .025));
          marker.rig.root.visible = nearest.has(p.id);
          const flying = p.phase === 'moving' || now - marker.swingStart < 900;
          const facing = flying ? marker.direction : p.id === id ? direction : Math.atan2(hole.cup.x-p.x,hole.cup.z-p.z);
          const stance = flying ? marker.origin : position;
          const stanceSide = portrait ? -1 : 1;
          marker.rig.root.position.set(stance.x + Math.cos(facing) * 2.05 * stanceSide, 0, stance.z - Math.sin(facing) * 2.05 * stanceSide);
          // Everyone tees off independently. Spread the waiting golfers to avoid overlapping faces.
          if (current && p.id !== id && Math.hypot(stance.x,stance.z)<.1) {
            marker.rig.root.position.x += (p.slot % 4 - 1.5) * 3;
            marker.rig.root.position.z += 3 + Math.floor(p.slot / 4) * 3;
          }
          marker.rig.root.rotation.y = portrait ? .2 : facing - Math.PI/2;
          const elapsed = (now - marker.swingStart) / 1000;
          const swing = elapsed < .22 ? Math.sin(Math.max(0,elapsed)/.22*Math.PI)*1.45 : elapsed < .85 ? -Math.sin((elapsed-.22)/.63*Math.PI/2)*1.35 : elapsed < 1.3 ? -1.35*(1-(elapsed-.85)/.45) : 0;
          const renderedSwing = portrait ? swing : -swing;
          marker.rig.arms.rotation.z = renderedSwing;
          marker.rig.torso.rotation.y = renderedSwing * -.3;
          marker.rig.torso.rotation.x = .13 + Math.sin(now / 1400) * .012;
          marker.rig.arms.rotation.x = 0; marker.rig.root.rotation.z = 0;
          marker.rig.leftArm.rotation.set(0,0,0); marker.rig.rightArm.rotation.set(0,0,0); marker.rig.club.visible = true;
          const cheer = (now - marker.cheerStart) / 1000;
          if (p.phase === 'holed' && !p.capped && cheer < 6) {
            const pose = (p.hole + p.slot + p.strokes) % 8, beat = Math.sin(cheer * 8), fade = Math.max(0, Math.min(1, cheer * 4, (6-cheer)*2));
            const score = p.strokes - hole.par, mood = score < 0 ? 'delighted' : score === 0 ? 'pleased' : 'frustrated';
            const rig = marker.rig; rig.club.visible = pose === 4 && score < 0;
            rig.arms.rotation.z = 0; rig.arms.rotation.x = 0;
            if (score < 0) {
              rig.leftArm.rotation.z = -fade * (pose === 6 ? .9+beat*.3 : 2.1);
              rig.rightArm.rotation.z = fade * (pose === 6 ? .9-beat*.3 : 2.1);
              rig.leftArm.rotation.x = rig.rightArm.rotation.x = pose === 3 ? fade*.7 : 0;
              rig.torso.rotation.y = fade * (pose === 2 ? Math.sin(cheer*5)*.7 : beat*.15);
              rig.torso.rotation.x = pose === 3 ? fade*(.15+Math.sin(cheer*2)**2*.4) : .08;
              rig.root.position.y = fade * (pose === 0 || pose === 4 || pose === 7 ? Math.abs(beat)*.75 : .08*Math.abs(beat));
              rig.root.rotation.y += pose === 5 ? cheer*2 : Math.sin(cheer*3)*.15;
              rig.root.rotation.z = pose === 1 || pose === 6 ? beat*.12*fade : 0;
            } else if (score === 0) {
              rig.leftArm.rotation.z = fade*(pose%3 === 0 ? -.7 : -.15);
              rig.rightArm.rotation.z = fade*(pose%3 === 1 ? 1.1 : .6);
              rig.rightArm.rotation.x = fade*Math.sin(cheer*5)*.2;
              rig.torso.rotation.x = .08 + fade*Math.sin(cheer*3)**2*.12;
              rig.torso.rotation.y = fade*beat*.05;
              rig.root.position.y = 0;
            } else {
              // Drooped shoulders, head shake, facepalm and a disappointed foot stomp.
              rig.leftArm.rotation.z = pose%3 === 0 ? fade*-.8 : fade*.2;
              rig.rightArm.rotation.z = pose%3 === 1 ? fade*1.7 : fade*-.2;
              rig.rightArm.rotation.x = pose%3 === 1 ? fade*1.2 : 0;
              rig.torso.rotation.x = fade*(.35+Math.sin(cheer*2)**2*.15);
              rig.torso.rotation.y = fade*Math.sin(cheer*5)*.17;
              rig.root.rotation.z = pose%3 === 2 ? fade*Math.sin(cheer*8)*.06 : 0;
              rig.root.position.y = 0;
            }
            if (p.id === id) { el.dataset.celebration = String(pose); el.dataset.reaction = mood; }
          } else if (p.id === id) { delete el.dataset.reaction; delete el.dataset.celebration; }
          marker.rig.clubHead.scale.set(selectedClub === 'putter' && p.id === id ? .42 : .31, .13, .17);
        }
        for (const [id, marker] of markers) if (!active.some(p => p.id === id)) marker.ball.visible = marker.shadow.visible = marker.rig.root.visible = false;
        const ball = me ? markers.get(me.id)?.ball.position || new THREE.Vector3(me.x, me.y, me.z) : new THREE.Vector3(0, 0, 0);
        // Keep the flight camera behind the shot even when the ball passes the cup.
        const base = me?.phase === 'moving' ? markers.get(me.id)?.direction ?? direction : me?.phase === 'aim' ? direction : Math.atan2(hole.cup.x - ball.x, hole.cup.z - ball.z);
        if (portrait) { cameraGoal.set(1, 3.8, 8); target.set(-2, 2.6, 0); }
        else if (full) { cameraGoal.set(65, hole.cup.z * .65 + 45, hole.cup.z * .28); target.set(0, 0, hole.cup.z / 2); }
        else if (!me || current?.phase === 'lobby') { cameraGoal.set(12, 13, -18); target.set(-1, 2, 7); }
        else if (me.phase === 'holed' && !me.capped && now - (markers.get(me.id)?.cheerStart ?? -Infinity) < 6000) {
          const hero = markers.get(me.id)!.rig.root.position; cameraGoal.set(hero.x + 6, 4.5, hero.z + 8); target.set(hero.x, 2.4, hero.z);
        }
        else if (me.phase !== 'moving') {
          // Address view: player in the foreground, green and flag ahead.
          const narrow = camera.aspect < 1, wide = viewportHeight < 550 && camera.aspect > 1, behind = narrow ? 12 : wide ? 16 : 10, side = narrow ? -.8 : camera.aspect < 1.5 ? 1.8 : 4.8;
          cameraGoal.set(ball.x - Math.sin(base) * behind - Math.cos(base) * side, wide ? 6.4 : 5.8, ball.z - Math.cos(base) * behind + Math.sin(base) * side);
          target.set(ball.x + Math.sin(base) * (narrow?24:35), 2.7, ball.z + Math.cos(base) * (narrow?24:35));
        }
        else { cameraGoal.set(ball.x - Math.sin(base) * 26, Math.max(17, ball.y + 14), ball.z - Math.cos(base) * 26); target.set(ball.x + Math.sin(base) * 13, Math.max(1, ball.y * .7), ball.z + Math.cos(base) * 13); }
        // Reserve the bottom HUD area without shrinking the course horizontally.
        const lift = !portrait && !full && me && me.phase !== 'moving' ? me.phase === 'aim'
          ? (viewportHeight < 550 && camera.aspect > 1 ? Math.max(.22,130 / viewportHeight - .11) : camera.aspect < 1 ? .2 : camera.aspect < 1.5 ? .3 : .26) : .14 : 0;
        if(lift!==lastLift||viewportWidth!==offsetWidth||viewportHeight!==offsetHeight){
          lastLift=lift;offsetWidth=viewportWidth;offsetHeight=viewportHeight;
          if(lift) camera.setViewOffset(viewportWidth,viewportHeight,0,viewportHeight*lift,viewportWidth,viewportHeight);
          else if(camera.view?.enabled) camera.clearViewOffset();
        }
        camera.position.lerp(cameraGoal, 1 - Math.exp(-dt * 3)); lookAt.lerp(target, 1 - Math.exp(-dt * 5)); camera.lookAt(lookAt);
        aimLine.visible = !state.current.spectator && !portrait && !!me && me.phase === 'aim'; landing.visible = aimLine.visible;
        if (me && aimLine.visible) {
          const key = [me.x, me.z, me.correct, direction, selectedClub, selectedPower, state.current.spin].join('/');
          if (key !== previewKey) {
            previewKey = key; const points = predictShot(me, selectedClub, direction, selectedPower, state.current.spin);
            const positions = lineGeo.getAttribute('position') as THREE.BufferAttribute;
            points.forEach((p,i) => positions.setXYZ(i,p.x,p.y - .39,p.z)); positions.needsUpdate = true;
            lineGeo.setDrawRange(0,points.length); lineGeo.computeBoundingSphere(); aimLine.computeLineDistances();
            const end = points.at(-1)!; landing.position.set(end.x, .1, end.z);
            el.dataset.trajectoryHeight = String(Math.max(...points.map(p=>p.y)));
          }
        }
        el.dataset.golferCount = String(nearest.size); el.dataset.ballHeight = String(ball.y); el.dataset.swing = String(me ? markers.get(me.id)?.rig.arms.rotation.z || 0 : 0);
        el.dataset.cameraMode = portrait ? 'portrait' : full ? 'overview' : me?.phase==='moving' ? 'flight' : el.dataset.reaction ? 'reaction' : 'address';
        flag.rotation.y = Math.sin(now / 700) * .12;
        scenery?.update(now);animatedWater.update(now/1000);el.dataset.blenderModels=String(scenery?.library.ready?scenery.library.group.userData.models:0);el.dataset.blenderAnimations=String(scenery?.library.group.userData.animations||0);renderer.render(scene, camera); frame = requestAnimationFrame(draw);
      }; frame = requestAnimationFrame(draw);
    } catch (error) { console.error('Golf renderer initialization failed', error); setFailed(true); }
    return () => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); el.removeEventListener('webglcontextlost', lost); markers.forEach(m=>m.rig.dispose()); golferAssets.dispose(); scenery?.dispose(); resources.forEach(r => r.dispose()); renderer?.dispose(); };
  }, [holeIndex, selfId, portrait, quality]);
  return <><canvas className="gg-canvas" ref={canvas} aria-label="GAKURO GOLF 3D course" />{failed && <div className="gg-render-error" role="alert">3D rendering unavailable. Enable WebGL and reload.</div>}</>;
}
