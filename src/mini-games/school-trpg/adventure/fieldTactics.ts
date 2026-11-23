import { type Intent } from './content';
import { techniqueFor } from './battleTechniques';
import { fieldCondition, fieldSkill } from './frontierState';
import {
  fieldFloor,
  glancingSight,
  neighbors,
  pathsFrom,
  pathTo,
  terrainAt,
} from './frontierWorld';
import { cellPoint, floorKey, neighbor, type Floor } from './world';
import { equipped, type Adventure, type CombatMove, type Encounter } from './state';

export type Tactics = {
  cells: number[];
  aim: number | null;
  linked?: { foe: number; until: number };
};

export const borrowedCreature = (battle: Encounter) => {
  const link = battle.tactics?.linked;
  return link && link.until >= battle.turn && battle.enemies[link.foe]?.hp > 0 ? link.foe : -1;
};

export function actionPosition(s: Adventure) {
  const d = s.delve!;
  const battle = d.encounter;
  const link = battle ? borrowedCreature(battle) : -1;
  return link < 0 ? d.cell : battle!.tactics!.cells[link];
}

export function startTactics(s: Adventure, count: number): Tactics {
  const d = s.delve!;
  const floor = fieldFloor(s);
  const reached = pathsFrom(d.cell, (cell) => floor.open.has(cell));
  const candidates = [...reached.keys()].filter((cell) => cell !== d.cell);
  const preferred = candidates.filter(
    (cell) => reached.get(cell)!.steps >= 2 && !floor.features[cell],
  );
  return { cells: [...new Set([...preferred, ...candidates])].slice(0, count), aim: null };
}

export const occupied = (battle: Encounter, cell: number, except = -1) =>
  battle.tactics?.cells.some(
    (value, i) => i !== except && value === cell && battle.enemies[i].hp > 0,
  ) ?? false;

const distance = (a: number, b: number) => {
  const x = cellPoint(a),
    y = cellPoint(b);
  return Math.abs(x.x - y.x) + Math.abs(x.y - y.y);
};

export function canTacticalStep(s: Adventure, cell: number, floor = fieldFloor(s)) {
  const d = s.delve;
  const battle = d?.encounter;
  if (
    !d ||
    !battle?.tactics ||
    !Number.isInteger(cell) ||
    !neighbors(actionPosition(s)).includes(cell) ||
    !floor.open.has(cell) ||
    occupied(battle, cell)
  )
    return false;
  if (borrowedCreature(battle) >= 0) return cell !== d.cell;
  const feature = floor.features[d.cell];
  const record = s.floors[floorKey(s.location, d.floor)];
  return (
    !['runes', 'trap'].includes(feature ?? '') ||
    record?.cleared.includes(d.cell) ||
    cell === d.previous
  );
}

export function moveRange(s: Adventure, move: CombatMove) {
  const technique = techniqueFor(move);
  if (technique) return technique.range + Number(move === 'bowPin' && fieldSkill(s, 'marksman'));
  if (move === 'spark') return 4;
  if (move === 'parley' || move === 'befriend' || move === 'study') return 4;
  if (move !== 'strike') return 1;
  if (s.delve?.encounter && borrowedCreature(s.delve.encounter) >= 0) return 1;
  const weapon = equipped(s, 'weapon')?.weapon;
  return weapon === 'bow' ? 3 + Number(fieldSkill(s, 'marksman')) : weapon === 'spear' ? 2 : 1;
}

export function tacticalTarget(s: Adventure, move: CombatMove, index: number, floor?: Floor) {
  const d = s.delve;
  const battle = d?.encounter;
  if (!battle?.tactics) return true;
  if (move === 'guard' || move === 'retreat' || techniqueFor(move)?.range === 0) return true;
  if (!(battle.enemies[index]?.hp > 0) || borrowedCreature(battle) === index) return false;
  const from = actionPosition(s);
  const target = battle.tactics.cells[index];
  if (move === 'pikeShove') {
    const a = cellPoint(from), b = cellPoint(target);
    if (a.x !== b.x && a.y !== b.y) return false;
  }
  return glancingSight(
    floor ?? fieldFloor(s),
    from,
    target,
    moveRange(s, move),
  );
}

export function enemyInRange(
  s: Adventure,
  battle: Encounter,
  index: number,
  intent: Intent,
  floor: Floor,
) {
  if (!battle.tactics) return true;
  const d = s.delve!;
  const point = battle.tactics.cells[index];
  const range = intent === 'hex' || intent === 'drain' ? 3 : 1;
  if (glancingSight(floor, point, d.cell, range)) return true;
  if ((battle.enemies[index].pinnedUntil ?? 0) >= battle.turn) return false;
  if (terrainAt(s, point, d.floor, floor) === 'resin' && battle.turn % 2 === 1) return false;
  const reached = pathsFrom(
    point,
    (cell) => floor.open.has(cell) && (!occupied(battle, cell, index) || cell === d.cell),
  );
  const path = pathTo(reached, point, d.cell);
  if (path.length > 1) battle.tactics.cells[index] = path[0];
  return false;
}

export function shoveFoe(s: Adventure, battle: Encounter, index: number, tiles: number, floor: Floor) {
  const board = battle.tactics!;
  const actor = cellPoint(actionPosition(s));
  const origin = board.cells[index];
  const foe = cellPoint(origin);
  const dx = foe.x - actor.x, dy = foe.y - actor.y;
  const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
  let cell = origin;
  let collision: 'wall' | number | null = null;
  for (let step = 0; step < tiles; step++) {
    const next = neighbor(cell, direction);
    if (!floor.open.has(next) || next === s.delve!.cell) {
      collision = 'wall';
      break;
    }
    const blockingFoe = board.cells.findIndex((point, other) => point === next && other !== index && battle.enemies[other].hp > 0);
    if (blockingFoe >= 0) {
      if (blockingFoe !== borrowedCreature(battle)) collision = blockingFoe;
      break;
    }
    cell = next;
  }
  board.cells[index] = cell;
  return { origin, cell, collision };
}

export function coverBonus(s: Adventure, floor: Floor) {
  const d = s.delve!;
  const walls = neighbors(d.cell).filter((cell) => !floor.open.has(cell)).length;
  const vapor = terrainAt(s, d.cell, d.floor, floor) === 'steam';
  return (
    Math.min(2, walls) +
    Number(vapor) * 2 +
    Number(fieldSkill(s, 'stance')) * 2 +
    Number(fieldCondition(s, 'wing')) +
    Number(fieldCondition(s, 'phase')) * 3
  );
}

export function distanceToTarget(s: Adventure, index: number) {
  const d = s.delve;
  if (!d?.encounter?.tactics || !Number.isInteger(d.encounter.tactics.cells[index])) return 0;
  return distance(actionPosition(s), d.encounter.tactics.cells[index]);
}
