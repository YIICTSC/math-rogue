import {
  foePoint,
  heroPoint,
  hurtFoe,
  partyPoint,
  type BattleArt,
  type BattleEvent,
  type BattlePoint,
} from './battleFeedback';
import { techniqueFor, type TechniqueId } from './battleTechniques';
import { borrowedCreature, shoveFoe } from './fieldTactics';
import { glancingSight, igniteOilAt, neighbors, terrainAt } from './frontierWorld';
import { note, recover, type Adventure, type Encounter } from './state';
import type { Floor } from './world';

export function actingPoint(s: Adventure, battle: Encounter) {
  const linked = borrowedCreature(battle);
  return linked < 0 ? heroPoint(s) : foePoint(battle, linked);
}

function push(
  s: Adventure,
  battle: Encounter,
  index: number,
  steps: number,
  floor?: Floor,
  events?: BattleEvent[],
) {
  const foe = battle.enemies[index];
  if (!floor || !battle.tactics) {
    foe.stagger = true;
    note(s, ['敵は体勢を崩した。', 'The creature loses its footing.']);
    return;
  }
  const from = foePoint(battle, index);
  const { origin, cell, collision } = shoveFoe(s, battle, index, steps, floor);
  const position = foePoint(battle, index);
  if (cell !== origin) {
    foe.stagger = true;
    events?.push({ art: 'collision', from, to: position, outcome: 'push' });
    note(s, ['敵を押し出した。', 'You shove the creature back.']);
  }
  if (collision === null) return;
  foe.stagger = true;
  const force = 2 + steps;
  const primary = hurtFoe(battle, index, force, 'collision', position, events);
  if (collision === 'wall') {
    note(s, [`壁にぶつけて${primary}ダメージ。`, `Wall impact deals ${primary} damage.`], 'good');
    return;
  }
  battle.enemies[collision].stagger = true;
  const extra = hurtFoe(battle, collision, force, 'collision', position, events);
  note(
    s,
    [
      `敵同士が衝突し、それぞれに${primary}と${extra}ダメージ。`,
      `The creatures collide, taking ${primary} and ${extra} damage.`,
    ],
    'good',
  );
}

function splash(
  s: Adventure,
  battle: Encounter,
  index: number,
  damage: number,
  chain: boolean,
  floor?: Floor,
  events?: BattleEvent[],
) {
  const from = foePoint(battle, index);
  const cell = from.cell;
  const conducts = (point: number) =>
    ['puddle', 'wire'].includes(terrainAt(s, point, s.delve!.floor, floor));
  if (chain && (!floor || cell === undefined || !conducts(cell))) return;
  const linked = borrowedCreature(battle);
  let hits = 0;
  for (const [other, foe] of battle.enemies.entries()) {
    if (other === index || other === linked || foe.hp <= 0) continue;
    if (floor && battle.tactics && cell !== undefined) {
      const to = battle.tactics.cells[other];
      const connects = chain
        ? neighbors(cell).some(
            (next) =>
              floor.open.has(next) &&
              conducts(next) &&
              (next === to || neighbors(next).includes(to)),
          ) || neighbors(cell).includes(to)
        : glancingSight(floor, cell, to, 1);
      if (!connects) continue;
    } else if (Math.abs(other - index) !== 1) continue;
    hurtFoe(
      battle,
      other,
      Math.max(1, Math.round(damage / 2)),
      chain ? 'shock' : 'slash',
      from,
      events,
    );
    if (++hits === 2) break;
  }
  if (hits)
    note(
      s,
      chain
        ? [`電撃が別の敵${hits}体に伝わった。`, `Lightning arcs to ${hits} more creatures.`]
        : [`払いが別の敵${hits}体にも当たった。`, `The sweep hits ${hits} more creatures.`],
      'good',
    );
}

function power(
  art: BattleArt,
  from: BattlePoint,
  to: BattlePoint,
  events?: BattleEvent[],
  hp?: number,
) {
  events?.push({ art, from, to, outcome: 'power', hp });
}

export function applyManeuvers(
  s: Adventure,
  battle: Encounter,
  index: number,
  move: TechniqueId,
  damage: number,
  heavyWindup: boolean,
  floor?: Floor,
  events?: BattleEvent[],
) {
  const technique = techniqueFor(move)!;
  const foe = battle.enemies[index];
  const hero = heroPoint(s);
  const actor = actingPoint(s, battle);
  for (const effect of technique.effects) {
    switch (effect) {
      case 'sweep':
      case 'chain':
        splash(s, battle, index, damage, effect === 'chain', floor, events);
        break;
      case 'guard':
        battle.guard = true;
        power('guard', hero, hero, events);
        break;
      case 'heal': {
        const before = s.hp;
        recover(s, 6, 0);
        if (s.hp > before) power('heal', hero, hero, events, s.hp - before);
        const patient = battle.allies
          ?.filter((ally) => ally.hp > 0 && ally.hp < ally.max)
          .sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
        if (patient) {
          const amount = Math.min(5, patient.max - patient.hp);
          patient.hp += amount;
          power('heal', hero, partyPoint(s), events, amount);
        }
        note(s, ['傷の手当てをした。', 'You dress the wounds.'], 'good');
        break;
      }
      case 'rally':
        battle.combo = Math.min(4, battle.combo + 2);
        recover(s, 0, 3);
        power('heal', hero, hero, events);
        note(s, ['集中と連携を整えた。', 'You restore Focus and build combo.'], 'good');
        break;
      case 'ignite': {
        const cell = battle.tactics?.cells[index];
        if (floor && cell !== undefined && igniteOilAt(s, cell, floor)) {
          const point = foePoint(battle, index);
          power('fire', point, point, events);
          note(s, ['足元の油膜に火がついた。', 'The oil slick catches fire.'], 'good');
        }
        break;
      }
      default:
        if (!foe || foe.hp <= 0) break;
        switch (effect) {
          case 'push':
          case 'drive':
            if (damage > 0) push(s, battle, index, effect === 'drive' ? 2 : 1, floor, events);
            break;
          case 'pin':
            if (battle.tactics) foe.pinnedUntil = battle.turn + 1;
            else foe.stagger = true;
            power('snare', actor, foePoint(battle, index), events);
            note(s, ['敵を足止めした。', 'You pin the creature in place.'], 'good');
            break;
          case 'mark':
            foe.markedUntil = battle.turn + 3;
            power(technique.art, actor, foePoint(battle, index), events);
            note(
              s,
              [
                '印をつけた。次の命中で追加ダメージ。',
                'Target marked. Your next hit deals bonus damage.',
              ],
              'good',
            );
            break;
          case 'reveal':
            foe.known = true;
            if (!technique.attack) power(technique.art, actor, foePoint(battle, index), events);
            break;
          case 'interrupt':
            if (move === 'envoyDistract' || heavyWindup) foe.stagger = true;
            break;
        }
    }
  }
}
