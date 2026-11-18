import { assetUrl } from '../../../utils/assetPaths';
import type { WeaponKind } from './mastery';
import type { AbilityEffect } from '../student/abilities';

type Point = { x: number; y: number };
type Wave = 'line' | 'sweep' | 'field' | 'cross' | 'ring';
type FrameArt = keyof typeof SEQUENCES;
export type CombatAbilityEffect = AbilityEffect | 'thrust' | 'pierce' | 'snipe' | 'spin' | 'quake';

export const ATTACK_ATLAS_PATH = 'sprites/dungeon-combat/action-frames-v1.webp';
const CELL = 160;
const FRAME_COUNT = 4;

// Each ImageGen sequence occupies four consecutive cels in the packed WebP.
const SEQUENCES = {
  sword: 0, greatsword: 1, axe: 2, hammer: 3,
  rapier: 4, spear: 5, bow: 6, fist: 7,
  staff: 8, whip: 9, chakram: 10, sparks: 11,
  fire: 12, ice: 13, thunder: 14, water: 15,
  leaf: 16, star: 17, shadow: 18, song: 19,
  alchemy: 20, dawn: 21, break: 22, pulse: 23,
} as const;

const weaponWaves: Record<WeaponKind, Wave> = {
  fist: 'line', sword: 'sweep', greatsword: 'sweep', axe: 'sweep',
  rapier: 'line', spear: 'line', bow: 'line', whip: 'sweep',
  staff: 'cross', hammer: 'sweep', chakram: 'ring',
};
const abilityArt: Record<CombatAbilityEffect, FrameArt> = {
  slash: 'dawn', fire: 'fire', ice: 'ice', leaf: 'leaf', star: 'star', shadow: 'shadow',
  thunder: 'thunder', water: 'water', song: 'song', alchemy: 'alchemy',
  thrust: 'rapier', pierce: 'break', snipe: 'bow', spin: 'chakram', quake: 'hammer',
};
const finishArt: Record<WeaponKind, FrameArt> = {
  fist: 'pulse', sword: 'dawn', greatsword: 'shadow', axe: 'fire', rapier: 'break',
  spear: 'thunder', bow: 'star', whip: 'leaf', staff: 'alchemy', hammer: 'thunder', chakram: 'pulse',
};

const secretArt: Partial<Record<WeaponKind, FrameArt>> = {
  sword: 'star', spear: 'dawn', hammer: 'pulse', fist: 'break',
};

export type AttackFootprint = {
  origin: Point;
  cells: readonly Point[];
  hits: readonly Point[];
  direction: Point;
  art: FrameArt;
  wave: Wave;
  accent?: FrameArt;
  weaponTier?: number;
};

export function weaponFootprint(kind: WeaponKind, origin: Point, direction: Point,
  cells: readonly Point[], hits: readonly Point[], tier = 0): AttackFootprint {
  return {
    origin, direction, cells, hits, art: kind, weaponTier: tier,
    wave: tier ? weaponWaves[kind] : kind === 'sword' || kind === 'axe' || kind === 'greatsword' || kind === 'whip'
      ? 'sweep' : 'line',
    accent: tier === 5 ? secretArt[kind] ?? finishArt[kind]
      : tier === 4 ? finishArt[kind] : tier === 3 ? 'pulse' : tier === 1 ? 'sparks' : undefined,
  };
}

export function abilityFootprint(effect: CombatAbilityEffect, origin: Point, direction: Point,
  cells: readonly Point[], hits: readonly Point[], line = false, accent?: 'dash' | 'signature' | 'status'): AttackFootprint {
  return {
    origin, direction, cells, hits, art: abilityArt[effect],
    wave: line ? 'line' : effect === 'song' || effect === 'star' || effect === 'alchemy' || effect === 'spin' ? 'ring' : 'field',
    accent: accent === 'dash' ? 'break' : accent === 'signature' ? 'star' : accent === 'status' ? 'pulse' : undefined,
  };
}

let atlas: HTMLImageElement | undefined;
let atlasRetryAt = 0;

export function preloadAttackArt(): HTMLImageElement | undefined {
  if (typeof Image === 'undefined') return;
  if (atlas && (!atlas.complete || atlas.naturalWidth)) return atlas;
  if (Date.now() < atlasRetryAt) return;
  atlasRetryAt = Date.now() + 2000;
  atlas = new Image();
  atlas.src = assetUrl(ATTACK_ATLAS_PATH);
  return atlas;
}

type ArtBox = Point & { angle: number; width: number; height: number };

function fitArt(cells: readonly Point[], direction: Point, strip = false): ArtBox {
  const angle = Math.atan2(direction.y, direction.x);
  const cos = Math.cos(angle), sin = Math.sin(angle);
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const { x, y } of cells) {
    const u = x * cos + y * sin, v = y * cos - x * sin;
    left = Math.min(left, u);
    right = Math.max(right, u);
    top = Math.min(top, v);
    bottom = Math.max(bottom, v);
  }
  const u = (left + right) / 2, v = (top + bottom) / 2;
  const cellSpan = Math.abs(cos) + Math.abs(sin);
  return {
    x: u * cos - v * sin, y: u * sin + v * cos, angle,
    width: right - left + cellSpan,
    height: bottom - top + cellSpan * (strip ? .78 : 1),
  };
}

function paintFrame(ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, art: FrameArt,
  box: ArtBox, progress: number, opacity = 1, flip = false) {
  if (progress < 0 || progress >= 1) return;
  const frame = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
  const sequence = SEQUENCES[art];
  ctx.save();
  ctx.translate(box.x, box.y);
  ctx.rotate(box.angle);
  if (flip) ctx.scale(1, -1);
  ctx.globalAlpha *= opacity * Math.min(1, (1 - progress) * 7);
  ctx.drawImage(sheet, (sequence % 2 * FRAME_COUNT + frame) * CELL, Math.floor(sequence / 2) * CELL,
    CELL, CELL, -box.width / 2, -box.height / 2, box.width, box.height);
  ctx.restore();
}

const right = { x: 1, y: 0 };
const arms = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];

function paintMain(ctx: CanvasRenderingContext2D, sheet: HTMLImageElement,
  effect: AttackFootprint, progress: number, opacity = 1, flip = false) {
  const { cells, origin, direction, art, wave } = effect;
  if (wave === 'cross') {
    // Each staff ray has a fixed heading, including the two away from the facing direction.
    for (const dir of arms) {
      const ray = cells.filter(p => {
        const dx = p.x - origin.x, dy = p.y - origin.y;
        return dx * dir.y === dy * dir.x && dx * dir.x + dy * dir.y > 0;
      });
      if (ray.length) paintFrame(ctx, sheet, art, fitArt(ray, dir, true), progress, opacity, flip);
    }
    return;
  }
  if (wave === 'field' && cells.length > 1) {
    // The eight parts share the same footprint and fan outward, even where there are no targets.
    const sectors: Point[][] = Array.from({ length: 8 }, () => []);
    for (const cell of cells) {
      const dx = cell.x - origin.x, dy = cell.y - origin.y;
      if (!dx && !dy) continue;
      const index = (Math.round(Math.atan2(dy, dx) * 4 / Math.PI) + 8) % 8;
      sectors[index].push(cell);
    }
    for (const [i, sector] of sectors.entries()) {
      if (!sector.length) continue;
      const angle = i * Math.PI / 4;
      paintFrame(ctx, sheet, art, fitArt(sector, { x: Math.cos(angle), y: Math.sin(angle) }), progress, opacity, flip);
    }
    if (cells.some(p => p.x === origin.x && p.y === origin.y)) {
      paintFrame(ctx, sheet, art, fitArt([origin], direction), progress, opacity, flip);
    }
    return;
  }
  paintFrame(ctx, sheet, art, fitArt(cells, wave === 'ring' ? right : direction, wave === 'line'), progress, opacity, flip);
}

export function drawAttackFootprint(ctx: CanvasRenderingContext2D, effect: AttackFootprint, startX: number,
  startY: number, tileSize: number, progress: number, visible: (x: number, y: number) => boolean,
  reducedMotion = false) {
  const { cells, hits, accent, weaponTier: tier = 0 } = effect;
  if (!cells.length || progress >= 1) return;
  const sheet = preloadAttackArt();
  if (!sheet?.complete || !sheet.naturalWidth) return;
  const visibleCells = cells.filter(({ x, y }) => visible(x, y));
  if (!visibleCells.length) return;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate((.5 - startX) * tileSize, (.5 - startY) * tileSize);
  ctx.scale(tileSize, tileSize);
  // The path clips transparent art at walls and the edge of vision. It never paints the grid.
  ctx.beginPath();
  for (const { x, y } of visibleCells) ctx.rect(x - .5, y - .5, 1, 1);
  ctx.clip();

  const t = reducedMotion ? .38 : Math.max(0, progress);
  paintMain(ctx, sheet, effect, t, reducedMotion ? Math.max(0, 1 - progress) : 1);
  if (!reducedMotion) {
    if (tier === 2) paintMain(ctx, sheet, effect, (t - .27) / .72, .79, true);
    if (tier === 3) paintMain(ctx, sheet, effect, (t - .20) / .70, .65, true);
    if (accent) {
      const delay = tier === 5 ? .16 : tier === 4 ? .33 : .24;
      const box = fitArt(cells, effect.wave === 'line' || effect.wave === 'sweep' ? effect.direction : right,
        effect.wave === 'line');
      paintFrame(ctx, sheet, accent, box, (t - delay) / (1 - delay), tier >= 4 ? .88 : tier === 1 ? .37 : .61);
    }
  }
  for (const { x, y } of hits) {
    if (!visible(x, y)) continue;
    const localTime = reducedMotion ? t : (t - .20) / .62;
    paintFrame(ctx, sheet, 'sparks', { x, y, angle: (x + y) * .7, width: .85, height: .85 }, localTime, .92);
  }
  ctx.restore();
}
