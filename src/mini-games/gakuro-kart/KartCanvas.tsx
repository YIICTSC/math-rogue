import React, { useEffect, useRef } from 'react';
import { assetUrl } from '../../utils/assetPaths';
import { COURSES, roadOffset, TRACK_LENGTH, type Race, type Racer } from './engine';
export const HERO_SHEET = 'sprites/mini-games/crane-game/crane-game-protagonist-prizes-3x2-alpha-v1.webp';
const colors = ['#ef785f', '#65b4eb', '#f4be59'];
export default function KartCanvas({ world, selfId }: { world: Race; selfId: string }) {
  const canvas = useRef<HTMLCanvasElement>(null), state = useRef(world);
  state.current = world;
  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext('2d')!;
    const sheet = new Image(); sheet.src = assetUrl(HERO_SHEET);
    let frame = 0;
    function draw() {
      const w: Race = state.current, p = w.players[selfId] || Object.values(w.players)[0];
      if (!p) return;
      const width = c.clientWidth, height = c.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
      if (c.width !== Math.round(width * dpr) || c.height !== Math.round(height * dpr)) { c.width = Math.round(width * dpr); c.height = Math.round(height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
      const course = COURSES[w.course], horizon = height * .31;
      ctx.fillStyle = course.sky; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff1cf'; ctx.beginPath(); ctx.arc(width * .79, horizon * .39, 27, 0, Math.PI * 2); ctx.fill();
      // A school skyline, shelving, or science towers, all drawn from original geometry.
      for (let i = -1; i < 9; i++) {
        const x = i * width / 7 - Math.sin(p.distance / 1400) * 30, b = width / 8;
        const h = horizon * (.35 + (i % 3 + 3) % 3 * .15);
        ctx.fillStyle = w.course === 1 ? '#634937' : w.course === 2 ? '#cbdbe2' : '#f8e8cd';
        ctx.fillRect(x, horizon - h, b, h);
        ctx.fillStyle = w.course === 1 ? '#db9470' : '#638793';
        for (let j = 0; j < 4; j++) for (let k = 0; k < 3; k++) ctx.fillRect(x + 8 + j * b / 5, horizon - h + 10 + k * h / 4, b / 9, h / 8);
        if (i === 3 && w.course === 0) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + b / 2, horizon - h + 12, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#294c5b'; ctx.fillRect(x + b / 2, horizon - h + 5, 2, 8); }
      }
      const project = (z: number) => {
        const scale = 1 / (1 + z / 100), y = horizon + (height - horizon) * scale;
        const bend = (roadOffset(p.distance + z, w.course) - roadOffset(p.distance, w.course)) * width * .0015 * scale;
        return { x: width / 2 + bend - p.x * width * .34 * scale, y, half: width * .43 * scale, scale };
      };
      for (let y = Math.floor(horizon); y < height; y += 2) {
        const scale = Math.max(.015, (y - horizon) / (height - horizon)), z = 100 / scale - 100, pt = project(z);
        const band = Math.floor((p.distance + z) / 45) % 2;
        ctx.fillStyle = band ? course.ground : w.course === 0 ? '#83b56c' : course.ground; ctx.fillRect(0, y, width, 2);
        ctx.fillStyle = band ? '#fbf2d8' : '#d86b5a'; ctx.fillRect(pt.x - pt.half * 1.06, y, pt.half * 2.12, 2);
        ctx.fillStyle = course.road; ctx.fillRect(pt.x - pt.half, y, pt.half * 2, 2);
        if (band) { ctx.fillStyle = '#f7edcb'; ctx.fillRect(pt.x - pt.half / 3, y, Math.max(1, scale * 3), 2); ctx.fillRect(pt.x + pt.half / 3, y, Math.max(1, scale * 3), 2); }
        if ((p.distance + z) % TRACK_LENGTH < 12) for (let cell = 0; cell < 16; cell++) {
          ctx.fillStyle = (cell + Math.floor((p.distance + z) / 6)) % 2 ? '#243d48' : '#fff';
          ctx.fillRect(pt.x - pt.half + cell * pt.half / 8, y, pt.half / 8 + 1, 2);
        }
      }
      for (let z = 1200; z > 40; z -= 90) {
        const fixed = Math.floor((p.distance + z) / 90) * 90 - p.distance;
        if (fixed <= 0) continue;
        const pt = project(fixed), side = Math.floor((p.distance + fixed) / 90) % 2 ? -1 : 1, x = pt.x + side * pt.half * 1.35, s = pt.scale;
        ctx.fillStyle = '#765a45'; ctx.fillRect(x - 5 * s, pt.y - 80 * s, 10 * s, 80 * s);
        ctx.fillStyle = w.course === 0 ? '#efb7bd' : w.course === 1 ? '#d8b677' : '#b4dbe0';
        ctx.fillRect(x - 28 * s, pt.y - 95 * s, 56 * s, 50 * s);
        if (w.course === 0) { ctx.fillRect(x - 38 * s, pt.y - 83 * s, 76 * s, 30 * s); ctx.fillStyle = '#f8d4d5'; ctx.fillRect(x - 20 * s, pt.y - 100 * s, 30 * s, 25 * s); }
      }
      const boxZ = p.nextBox - p.distance;
      if (boxZ > 0 && boxZ < 1300) {
        const pt = project(boxZ), size = 42 * pt.scale;
        ctx.fillStyle = '#ffd45d'; ctx.fillRect(pt.x - size / 2, pt.y - size, size, size);
        ctx.fillStyle = '#304959'; ctx.font = `bold ${Math.max(8, size * .7)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('?', pt.x, pt.y - size * .2);
      }
      const kart = (r: Racer, x: number, y: number, scale: number) => {
        const s = scale * Math.max(.75, Math.min(width / 750, 1.2));
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = '#19334288'; ctx.beginPath(); ctx.ellipse(0, 0, 55 * s, 13 * s, 0, 0, Math.PI * 2); ctx.fill();
        if (r.boost > 0) { ctx.fillStyle = '#ffe285'; ctx.fillRect(-22 * s, 0, 44 * s, 24 * s); }
        ctx.fillStyle = '#23323f'; ctx.fillRect(-51 * s, -29 * s, 23 * s, 32 * s); ctx.fillRect(28 * s, -29 * s, 23 * s, 32 * s);
        ctx.fillStyle = colors[r.hero]; ctx.fillRect(-40 * s, -33 * s, 80 * s, 34 * s);
        if (sheet.complete && sheet.naturalWidth) ctx.drawImage(sheet, r.hero * sheet.width / 3, 0, sheet.width / 3, sheet.height / 2, -46 * s, -115 * s, 92 * s, 110 * s);
        ctx.fillStyle = colors[r.hero]; ctx.fillRect(-40 * s, -23 * s, 80 * s, 18 * s);
        ctx.fillStyle = r.brake ? '#ff3549' : '#fff3c3'; ctx.fillRect(-33 * s, -18 * s, 13 * s, 7 * s); ctx.fillRect(20 * s, -18 * s, 13 * s, 7 * s);
        if (r.shield > 0) { ctx.strokeStyle = '#81fbef'; ctx.lineWidth = 3; ctx.strokeRect(-57 * s, -117 * s, 114 * s, 125 * s); }
        ctx.restore();
      };
      Object.values(w.players).filter(r => r.id !== selfId && r.distance > p.distance && r.distance - p.distance < 1400).sort((a, b) => b.distance - a.distance).forEach(r => {
        const pt = project(r.distance - p.distance + 25); kart(r, pt.x + r.x * pt.half, pt.y, pt.scale);
      });
      kart(p, width / 2 + p.steer * 9, height * .87, 1.2);
      if (Math.abs(p.x) > .93) { ctx.fillStyle = '#fceda7'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('コースアウト！ 中央へ戻ろう', width / 2, height * .5); }
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); sheet.src = ''; };
  }, [selfId]);
  return <canvas ref={canvas} className="gk-canvas" aria-label="School kart race course" />;
}
