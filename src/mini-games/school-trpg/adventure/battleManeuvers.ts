import {
  foePoint,
  heroPoint,
  hurtFoe,
  partyPoint,
  type BattleArt,
  type BattleEvent,
  type BattlePoint,
} from './battleFeedback';
import { techniqueFor, type Maneuver, type TechniqueId } from './battleTechniques';
import { borrowedCreature, shoveFoe } from './fieldTactics';
import { glancingSight, igniteOilAt, neighbors, terrainAt } from './frontierWorld';
import { note, recover, type Adventure, type Encounter } from './state';
import { cellPoint, type Floor } from './world';

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
  effect: Maneuver,
  art: BattleArt,
  floor?: Floor,
  events?: BattleEvent[],
) {
  const chain = effect === 'chain';
  const from = effect === 'sweepHero' ? actingPoint(s, battle) : foePoint(battle, index);
  const cell = from.cell;
  const origin = actingPoint(s, battle).cell;
  const conducts = (point: number) =>
    ['puddle', 'wire'].includes(terrainAt(s, point, s.delve!.floor, floor));
  if (chain && (!floor || cell === undefined || !conducts(cell))) return;
  const linked = borrowedCreature(battle);
  let hits = 0;
  for (const [other, foe] of battle.enemies.entries()) {
    if (other === index || other === linked || foe.hp <= 0) continue;
    if (floor && battle.tactics && cell !== undefined) {
      const to = battle.tactics.cells[other];
      const conductive =
        (chain || effect === 'conductiveArea') &&
        conducts(cell) &&
        neighbors(cell).some(
          (next) =>
            floor.open.has(next) && conducts(next) && (next === to || neighbors(next).includes(to)),
        );
      const radius = ['blast', 'scatter', 'sweepHero', 'pierce'].includes(effect) ? 2 : 1;
      let connects = conductive || glancingSight(floor, cell, to, radius);
      if (connects && effect === 'pierce' && origin !== undefined) {
        const a = cellPoint(origin),
          b = cellPoint(cell),
          c = cellPoint(to);
        connects =
          (a.x === b.x && b.x === c.x && (b.y - a.y) * (c.y - b.y) > 0) ||
          (a.y === b.y && b.y === c.y && (b.x - a.x) * (c.x - b.x) > 0);
      }
      if (!connects) continue;
    } else if (
      effect === 'pierce' ? other <= index : Math.abs(other - index) > (effect === 'blast' ? 2 : 1)
    )
      continue;
    hurtFoe(battle, other, Math.max(1, Math.round(damage / 2)), art, from, events);
    if (effect === 'frostArea' && foe.hp > 0) pinFoe(battle, other);
    hits++;
    if (hits === 2 && (effect === 'chain' || effect === 'scatter')) break;
  }
  if (hits)
    note(
      s,
      chain
        ? [`電撃が別の敵${hits}体に伝わった。`, `Lightning arcs to ${hits} more creatures.`]
        : [`技が別の敵${hits}体にも届いた。`, `The technique hits ${hits} more creatures.`],
      'good',
    );
}

function pinFoe(battle: Encounter, index: number) {
  if (battle.tactics) battle.enemies[index].pinnedUntil = battle.turn + 1;
  else battle.enemies[index].stagger = true;
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
      case 'sweepHero':
      case 'frostArea':
      case 'blast':
      case 'pierce':
      case 'scatter':
      case 'conductiveArea':
        splash(s, battle, index, damage, effect, technique.art, floor, events);
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
          power('heal', hero, partyPoint(battle, patient.id), events, amount);
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
      case 'riposte':
        battle.riposte = true;
        power(technique.art, hero, hero, events);
        note(s, [
          '相手の動きを待ち、反撃の構えを取った。',
          'You brace and watch for an opening to counter.',
        ]);
        break;
      case 'coordinate':
        battle.coordinated = true;
        battle.combo = Math.min(4, battle.combo + 1);
        power(technique.art, hero, hero, events);
        note(
          s,
          ['合図を送り、仲間と攻める。', 'You signal the party to press the attack.'],
          'good',
        );
        break;
      case 'secondWind': {
        const before = s.hp;
        recover(s, 8, 3);
        power(technique.art, hero, hero, events, s.hp - before);
        note(s, ['息を整え、体勢を立て直した。', 'You catch your breath and regroup.'], 'good');
        break;
      }
      case 'tideWard':
        battle.tideWard = true;
        power(technique.art, hero, hero, events);
        for (const ally of battle.allies ?? []) {
          if (ally.hp <= 0) continue;
          const amount = Math.min(3, ally.max - ally.hp);
          ally.hp += amount;
          power(technique.art, hero, partyPoint(battle, ally.id), events, amount);
        }
        note(s, ['引き潮の結界が味方を包んだ。', 'The ebb-tide ward shelters the party.'], 'good');
        break;
      case 'ignite':
      case 'igniteArea': {
        const cell = battle.tactics?.cells[index];
        if (!floor || cell === undefined) break;
        const area = effect === 'igniteArea' ? [cell, ...neighbors(cell)] : [cell];
        const lit = area.filter((tile) => floor.open.has(tile) && igniteOilAt(s, tile, floor));
        for (const tile of lit) {
          const occupant = battle.tactics!.cells.findIndex(
            (position, other) => position === tile && battle.enemies[other].hp > 0,
          );
          const point = occupant < 0 ? { ...actor, cell: tile } : foePoint(battle, occupant);
          power('fire', { ...actor, cell: tile }, point, events);
        }
        if (lit.length) note(s, ['油膜に火がついた。', 'The oil slick catches fire.'], 'good');
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
            pinFoe(battle, index);
            power(
              technique.unlock ? technique.art : 'snare',
              actor,
              foePoint(battle, index),
              events,
            );
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
          case 'stagger':
            foe.stagger = true;
            break;
        }
    }
  }
}
