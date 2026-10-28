import {elevationAt} from './elevation';
import type { Enemy, World } from './engine';
import { ENEMIES } from './visuals';

/** Six readable movement patterns; the windup stores its aim before a charge. */
export function stepEnemy(w: World, e: Enemy, dt: number) {
  const profile = ENEMIES[e.kind] || ENEMIES[0];
  e.phase += dt;
  e.cool -= dt;
  e.exposed = Math.max(0, (e.exposed || 0) - dt);
  e.strike = Math.max(0, (e.strike || 0) - dt);
  const dx = w.x - e.x, dy = w.y - e.y, distance = Math.hypot(dx, dy) || 1;
  let vx = dx / distance, vy = dy / distance, speed = profile.speed;
  e.facing = dx < 0 ? -1 : 1;
  if (e.windup && e.windup > 0) {
    e.windup = Math.max(0, e.windup - dt);
    speed = 0;
    if (e.windup === 0) {
      e.strike = profile.behavior === 'charge' ? .42 : .3;
      if (profile.behavior === 'ranged' || profile.behavior === 'sentry') {
        const aim = e.aim ?? Math.atan2(dy, dx);
        const count = profile.behavior === 'sentry' ? 3 : 1;
        for (let i = 0; i < count; i++) {
          const a = aim + (i - (count - 1) / 2) * .22;
          w.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, life: 3, friendly: false });
        }
      }
    }
  } else if (e.cool <= 0) {
    e.aim = Math.atan2(dy, dx);
    e.windup = profile.behavior === 'charge' ? .65 : .45;
    e.cool = profile.behavior === 'ranged' ? 3 : 2.6;
    speed = 0;
  } else if (profile.behavior === 'charge' && (e.strike || 0) > 0) {
    vx = Math.cos(e.aim ?? 0); vy = Math.sin(e.aim ?? 0); speed = 5.2;
  } else if (profile.behavior === 'orbit') {
    const radial = distance > 2.6 ? .65 : distance < 1.8 ? -.6 : .05;
    const sign = e.kind % 2 ? -1 : 1;
    vx = dx / distance * radial - dy / distance * .8 * sign;
    vy = dy / distance * radial + dx / distance * .8 * sign;
  } else if (profile.behavior === 'ranged') {
    const spacing = distance < 2.5 ? -.7 : distance > 4 ? .6 : 0;
    vx *= spacing; vy *= spacing;
  } else if (profile.behavior === 'hop') {
    speed *= e.phase % 1.2 < .4 ? 2.4 : .12;
  } else if (profile.behavior === 'sentry') {
    speed *= distance > 3 ? .6 : .12;
  }
  // Axis separation lets enemies slide along a wall instead of freezing diagonally.
  if (w.enemyCan(e.x + vx * speed * dt, e.y,e)) e.x += vx * speed * dt;
  if (w.enemyCan(e.x, e.y + vy * speed * dt,e)) e.y += vy * speed * dt;
  e.moving = speed > .15 && Math.hypot(vx, vy) > .1;
  if ((w.inSky||Math.abs(elevationAt(w.s.chapter,w.s.room,w.x,w.y)-elevationAt(w.s.chapter,w.s.room,e.x,e.y))<.45)&&Math.hypot(w.x - e.x, w.y - e.y) < .65 && w.hurt <= 0) w.hit();
}

export function enemyFrame(e: Enemy) {
  if ((e.windup || 0) > 0) return 4;
  if ((e.strike || 0) > 0) return 5;
  return e.moving ? 2 + Math.floor(e.phase * 8) % 2 : Math.floor(e.phase * 3) % 2;
}
