import type { Active } from '../../src/mini-games/after-school-rush/engine';
import { actionWorld, nextBeat, noteLane, S, timingGoal, timingX } from '../../src/mini-games/after-school-rush/action/physics';
export function actionDriver(stage: Active) {
  const s = stage.round.state, spec = stage.round.entry.game.action!, world = actionWorld(spec, s), t = s[S.T];
  let x = 0, y = 0, a = false, b = false;
  const dx = (to: number, from: number, margin = 15) => Math.abs(to - from) < margin ? 0 : Math.sign(to - from);
  const toward = (tx: number, ty: number) => {
    const vx = tx - s[S.X], vy = ty - (s[S.Y] - 35), len = Math.hypot(vx, vy);
    if (len > 25) { x = vx / len; y = vy / len; }
  };
  switch (spec.family) {
    case 'run': case 'climb': {
      const dir = spec.variant % 2 ? -1 : 1;
      x = dir;
      const p = spec.variant % 2 ? 1000 - s[S.X] : s[S.X];
      const platforms = world.platforms.map(k => ({ x: spec.variant % 2 ? 1000 - k.x - k.w : k.x, y: k.y, w: k.w })).sort((a, b) => a.x - b.x);
      const floor = platforms.find(k => p >= k.x - 10 && p <= k.x + k.w + 10 && Math.abs(s[S.Y] - k.y) < 2);
      a = !!floor && (floor.x + floor.w < 990 && p > floor.x + floor.w - 95
        || world.hazards.some(h => { const hx = spec.variant % 2 ? 1000 - h.x : h.x; return hx > p && hx - p < 145; }));
      break;
    }
    case 'hurdles': {
      const next = world.hazards.find(h => h.x > s[S.X] - 100);
      if (next && next.x - s[S.X] < 135) { if (next.high) b = true; else a = s[S.VY] === 0; }
      break;
    }
    case 'collect': case 'sweep': {
      const i = world.targets.findIndex((_, i) => !(s[S.MASK] & 1 << i)), target = world.targets[i];
      if (target) { toward(target.x, target.y); if (spec.family === 'collect') a = true; else a = Math.hypot(target.x - s[S.X], target.y - s[S.Y] + 35) < 125; }
      break;
    }
    case 'catch': {
      const target = world.targets.find((_, i) => !(s[S.MASK] & 1 << i));
      if (target) { x = dx(target.x, s[S.X], 18); a = target.y > 345 && Math.abs(target.x - s[S.X]) < 100; }
      break;
    }
    case 'dodge': toward(s[S.Y] < 510 ? s[S.X] : 170 + Math.sin(t / 700) * 80, 500); a = s[S.Y] < 480; b = t % 1500 < 20; break;
    case 'aim': { const target = world.targets[0]; const vx = target.x - s[S.X], vy = target.y - s[S.Y], len = Math.hypot(vx, vy); if (len > 65) { x = vx / len; y = vy / len; } else a = true; break; }
    case 'timing': a = Math.abs(timingX(s) - timingGoal(spec)) < 85; break;
    case 'balance': x = Math.max(-1, Math.min(1, -s[S.LEAN] * 2 - (spec.variant % 2 ? -.23 : .23) / .85)); break;
    case 'push': x = dx(s[S.BOX_X] - (spec.variant % 2 ? -110 : 110), s[S.X], 12); a = Math.abs(s[S.X] - s[S.BOX_X]) < 140; break;
    case 'flap': {
      const gate = world.hazards.find(h => h.x > s[S.X] - 85), target = (gate?.y ?? 285) + 42;
      a = s[S.Y] > target && s[S.VY] > -30;
      if (s[S.Y] < target - 90 && s[S.VY] < 80) y = 1;
      break;
    }
    case 'duel': {
      const enemy = world.enemy!; const dist = Math.abs(enemy.x - s[S.X]);
      if (dist > 140) x = Math.sign(enemy.x - s[S.X]);
      a = dist < 170 && (!spec.boss || t % 1600 > 970 || t % 1600 < 200);
      b = t % 1600 > 430 && t % 1600 < 700;
      break;
    }
    case 'throw': a = s[S.BALL_X] < 0; if (s[S.ANGLE] > 33) x = -1; else if (s[S.ANGLE] < 31) x = 1; break;
    case 'rhythm': if (Math.abs(t - nextBeat(s)) < 45) { if (noteLane(s, s[S.NOTE])) b = true; else a = true; } break;
    case 'chase': toward(world.enemy!.x, world.enemy!.y); a = Math.hypot(world.enemy!.x - s[S.X], world.enemy!.y - s[S.Y] + 35) < 140; b = !a; break;
    case 'brake': y = s[S.Y] > 245 ? -1 : 0; if (s[S.X] > world.goal.x - 35) b = true; break;
    case 'carry': {
      if (!s[S.CARRIED]) { const egg = s[S.MASK] ? { x: s[S.BOX_X], y: s[S.BOX_Y] } : { x: 150, y: 300 }; toward(egg.x, egg.y); a = Math.hypot(egg.x - s[S.X], egg.y - s[S.Y] + 35) < 100; }
      else if (s[S.X] < 745) { if (s[S.Y] > 155 && s[S.X] < 360) toward(s[S.X], 90); else toward(770, 90); }
      else toward(world.goal.x, world.goal.y);
      break;
    }
  }
  return { x, y, a: a && t >= s[S.READY_A], b: b && t >= s[S.READY_B] };
}
