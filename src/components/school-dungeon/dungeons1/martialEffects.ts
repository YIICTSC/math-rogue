import { WEAPONS, type WeaponKind } from './mastery';
import type { AbilityEffect } from '../student/abilities';

type Point = { x: number; y: number };
type Motion = 'cut' | 'cleave' | 'hew' | 'flame' | 'bolt' | 'needle' | 'lance' | 'arrow' | 'punch' | 'quake' | 'lash' | 'rim' | 'surge';
type Palette = { motion: Motion; color: string };

const weaponMotion: Record<WeaponKind, Motion> = {
  fist: 'punch', sword: 'cut', greatsword: 'cleave', rapier: 'needle',
  axe: 'hew', spear: 'lance', staff: 'surge', hammer: 'quake',
  bow: 'arrow', whip: 'lash', chakram: 'rim',
};
const abilityMotion: Record<AbilityEffect, Motion> = {
  slash: 'cut', fire: 'flame', ice: 'lance', leaf: 'lash', star: 'surge',
  shadow: 'cleave', thunder: 'bolt', water: 'surge', song: 'rim', alchemy: 'surge',
};

export type AttackFootprint = {
  origin: Point;
  cells: readonly Point[];
  hits: readonly Point[];
  direction: Point;
  palette: Palette;
  wave: 'line' | 'sweep' | 'outward';
  strength: number;
};

export function weaponFootprint(kind: WeaponKind, origin: Point, direction: Point,
  cells: readonly Point[], hits: readonly Point[], tier = 0): AttackFootprint {
  const motion = weaponMotion[kind];
  return {
    origin, direction, cells, hits, palette: { motion, color: WEAPONS[kind].color }, strength: tier,
    wave: motion === 'cut' || motion === 'cleave' || motion === 'hew' || motion === 'lash' ? 'sweep'
      : motion === 'needle' || motion === 'lance' || motion === 'arrow' ? 'line' : 'outward',
  };
}

export function abilityFootprint(effect: AbilityEffect, color: string, origin: Point, direction: Point,
  cells: readonly Point[], hits: readonly Point[], line = false): AttackFootprint {
  return {
    origin, direction, cells, hits, strength: 3,
    palette: { motion: abilityMotion[effect], color }, wave: line ? 'line' : 'outward',
  };
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const TAU = 2 * Math.PI;

function paintTrail(ctx: CanvasRenderingContext2D, motion: Motion, color: string, t: number, strength: number, span: number) {
  const advance = 1 - (1 - clamp(t * 2.4)) ** 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fillStyle = color;
  ctx.strokeStyle = '#fff8dc';
  ctx.lineWidth = strength >= 3 ? .055 : .032;
  ctx.beginPath();

  switch (motion) {
    case 'cut':
    case 'cleave': {
      const wide = motion === 'cleave' ? .29 : .16;
      const tip = .12 + advance * .64;
      ctx.moveTo(-.69, -.36);
      ctx.quadraticCurveTo(-.08, -.44 - wide, tip, .39);
      ctx.quadraticCurveTo(.06, -.25 + wide, -.69, -.36);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-.63, -.36);
      ctx.quadraticCurveTo(-.08, -.44 - wide, tip, .39);
      ctx.stroke();
      break;
    }
    case 'hew': {
      const drop = -.48 + advance * .66;
      ctx.moveTo(-.48, drop - .35);
      ctx.quadraticCurveTo(.46, drop - .29, .53, drop + .11);
      ctx.quadraticCurveTo(.30, drop + .29, .12, drop + .38);
      ctx.quadraticCurveTo(.20, drop - .04, -.48, drop - .35);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-.48, drop - .35);
      ctx.quadraticCurveTo(.46, drop - .29, .53, drop + .11);
      ctx.stroke();
      break;
    }
    case 'flame':
      ctx.moveTo(-span, .25);
      ctx.quadraticCurveTo(-.36, -.42, .56 * advance, -.32);
      ctx.lineTo(.20, -.10);
      ctx.quadraticCurveTo(.38, -.22, .68 * advance, -.03);
      ctx.quadraticCurveTo(.33, .48, -span, .25);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-.43, .20);
      ctx.quadraticCurveTo(-.13, -.08, .54 * advance, -.04);
      ctx.stroke();
      break;
    case 'bolt':
      ctx.moveTo(-span, 0);
      ctx.lineTo(-.20, -.20);
      ctx.lineTo(-.03, .14);
      ctx.lineTo(.16, -.16);
      ctx.lineTo(span * advance, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = .13;
      ctx.stroke();
      ctx.strokeStyle = '#fff8dc';
      ctx.lineWidth = .042;
      ctx.stroke();
      break;
    case 'needle':
    case 'lance':
    case 'arrow': {
      const width = motion === 'needle' ? .085 : motion === 'arrow' ? .055 : .22;
      const tip = -span + 2 * span * advance;
      ctx.moveTo(-span, -width * .22);
      ctx.lineTo(tip - .23, -width);
      ctx.lineTo(tip, 0);
      ctx.lineTo(tip - .23, width);
      ctx.lineTo(-span, width * .22);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-span, 0);
      ctx.lineTo(tip, 0);
      ctx.stroke();
      if (motion === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(tip - .21, -.16);
        ctx.lineTo(tip, 0);
        ctx.lineTo(tip - .21, .16);
        ctx.stroke();
      }
      break;
    }
    case 'lash':
      ctx.moveTo(-.72, .31);
      ctx.bezierCurveTo(-.42, -.8, .13, .73, -.38 + advance * 1.12, -.28);
      ctx.strokeStyle = color;
      ctx.lineWidth = .12;
      ctx.stroke();
      ctx.strokeStyle = '#fff8dc';
      ctx.lineWidth = .033;
      ctx.stroke();
      break;
    case 'punch':
    case 'quake': {
      ctx.moveTo(-.56, 0);
      ctx.lineTo(.16 + advance * .43, -.19);
      ctx.lineTo(.34, -.065);
      ctx.lineTo(.68, 0);
      ctx.lineTo(.34, .065);
      ctx.lineTo(.16 + advance * .43, .19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (motion === 'quake') {
        ctx.beginPath();
        ctx.moveTo(-.52, -.49);
        ctx.lineTo(-.08, -.19);
        ctx.lineTo(-.17, .27);
        ctx.lineTo(.38, .57);
        ctx.moveTo(-.17, .27);
        ctx.lineTo(.51, .05);
        ctx.stroke();
      }
      break;
    }
    case 'rim':
    case 'surge':
      for (const offset of [0, .19]) {
        const x = -.46 + advance * .92 - offset;
        ctx.beginPath();
        ctx.moveTo(x - .14, -.63);
        ctx.quadraticCurveTo(x + .50, 0, x - .14, .63);
        ctx.strokeStyle = offset ? color : '#fff8dc';
        ctx.lineWidth = motion === 'rim' ? .07 : .11;
        ctx.stroke();
      }
      break;
  }
}

export function drawAttackFootprint(ctx: CanvasRenderingContext2D, effect: AttackFootprint, startX: number,
  startY: number, tileSize: number, progress: number, visible: (x: number, y: number) => boolean,
  reducedMotion = false) {
  const { origin, direction, cells, hits, palette, wave, strength } = effect;
  if (!cells.length) return;
  const angle = Math.atan2(direction.y, direction.x);
  const facing = { x: Math.cos(angle), y: Math.sin(angle) };
  const delay = ({ x, y }: Point) => {
    const dx = x - origin.x, dy = y - origin.y;
    if (wave === 'sweep') return dx * facing.y - dy * facing.x + Math.hypot(dx, dy) * .55;
    return Math.max(Math.abs(dx), Math.abs(dy));
  };
  const offsets = cells.map(delay);
  const first = Math.min(...offsets);
  const spread = Math.max(...offsets) - first || 1;
  const hitKeys = new Set(hits.map(({ x, y }) => `${x},${y}`));
  const sharedSweep = wave === 'sweep' && cells.length > 1;
  const active = cells.flatMap(({ x, y }, i) => {
    const start = reducedMotion ? 0 : (offsets[i] - first) / spread * .32;
    return visible(x, y) && progress >= start && progress < 1 ? [{ x, y, start }] : [];
  });

  active.forEach(({ x, y, start }) => {
    const t = clamp((progress - start) / (1 - start));
    const fade = 1 - t;
    ctx.save();
    ctx.translate((x - startX) * tileSize, (y - startY) * tileSize);
    ctx.scale(tileSize, tileSize);
    ctx.beginPath();
    ctx.rect(0, 0, 1, 1);
    ctx.clip();

    // Entire hit cell reads under a short-lived, high-contrast trail.
    ctx.globalAlpha = fade * (strength ? .38 : .2);
    ctx.fillStyle = palette.color;
    ctx.fillRect(0, 0, 1, 1);
    ctx.globalAlpha = fade * .62;
    ctx.lineWidth = .026;
    ctx.strokeStyle = palette.color;
    ctx.strokeRect(.022, .022, .956, .956);
    ctx.translate(.5, .5);
    const radial = wave === 'outward' && (x !== origin.x || y !== origin.y);
    const heading = radial ? Math.atan2(y - origin.y, x - origin.x) : angle;
    ctx.rotate(heading);
    ctx.globalAlpha = fade ** .72;
    const span = .5 / Math.max(Math.abs(Math.cos(heading)), Math.abs(Math.sin(heading)));
    if (!sharedSweep) paintTrail(ctx, palette.motion, palette.color, reducedMotion ? .28 : t, strength, span);

    if (hitKeys.has(`${x},${y}`) && t < .62) {
      ctx.globalAlpha = 1 - t / .62;
      ctx.fillStyle = '#fff4bc';
      for (let spark = 0; spark < 6; spark++) {
        const a = spark * TAU / 6 + .2;
        ctx.save();
        ctx.rotate(a);
        const distance = reducedMotion ? .24 : .06 + t * .62;
        ctx.fillRect(distance, -.025, .15, .05);
        ctx.restore();
      }
    }
    ctx.restore();
  });
  if (sharedSweep && active.length) {
    // Project one blade or whip trail across the whole footprint, clipped to affected cells.
    const local = cells.map(({ x, y }) => {
      const dx = x - origin.x, dy = y - origin.y;
      return { f: dx * facing.x + dy * facing.y, side: dy * facing.x - dx * facing.y };
    });
    const fMin = Math.min(...local.map(p => p.f)), fMax = Math.max(...local.map(p => p.f));
    const sideMin = Math.min(...local.map(p => p.side)), sideMax = Math.max(...local.map(p => p.side));
    ctx.save();
    ctx.beginPath();
    for (const { x, y } of active) ctx.rect((x - startX) * tileSize, (y - startY) * tileSize, tileSize, tileSize);
    ctx.clip();
    ctx.translate((origin.x - startX + .5) * tileSize, (origin.y - startY + .5) * tileSize);
    ctx.rotate(angle);
    ctx.translate((fMin + fMax) * tileSize / 2, (sideMin + sideMax) * tileSize / 2);
    ctx.scale((fMax - fMin + 1) * tileSize, (sideMax - sideMin + 1) * tileSize);
    ctx.globalAlpha = (1 - progress) ** .72;
    paintTrail(ctx, palette.motion, palette.color, reducedMotion ? .28 : progress, strength, .5);
    ctx.restore();
  }

}
