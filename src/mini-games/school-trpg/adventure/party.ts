import { COMPANION_ROLES, FOES, type ResidentRole } from './content';
import {
  maxHp,
  nextRandom,
  note,
  recover,
  type Adventure,
  type Ally,
  type Encounter,
} from './state';
import { fieldFloor, glancingSight, pathTo, pathsFrom, terrainAt } from './frontierWorld';
import {
  foePoint,
  heroPoint,
  hurtFoe,
  partyPoint,
  type BattleEvent,
  type BattlePoint,
} from './battleFeedback';
import { borrowedCreature, occupied, partyAt, partyPositions } from './fieldTactics';
import type { Floor } from './world';

export const companionLoan = (s: Adventure, id: string) =>
  s.gear.find((gear) => gear.id === s.frontier.lent[id]);

export function companionParameters(s: Adventure, id: string, role: ResidentRole) {
  const friend = s.friends[id];
  const trust = friend?.trust ?? 0;
  const memories = friend?.memories ?? 0;
  const spec = COMPANION_ROLES[role];
  const gear = companionLoan(s, id);
  return {
    trust,
    memories,
    style: spec.style,
    healer: spec.healer || s.frontier.orders[id] === 'support',
    ward: spec.ward,
    order: s.frontier.orders[id] ?? 'balance',
    max:
      12 +
      s.level * 2 +
      trust +
      memories * 3 +
      (spec.ward ? 6 : 0) +
      (gear?.slot === 'coat' ? 5 : 0),
    power:
      1 +
      Math.floor((s.level + trust) / 2) +
      Number(s.frontier.orders[id] === 'strike') * 2 +
      (gear?.slot === 'weapon' ? Math.min(4, gear.power) : 0),
    defense:
      (spec.ward ? 3 : 1) +
      Math.floor(s.level / 4) +
      (gear?.slot === 'coat' ? Math.min(3, gear.power) : 0),
    healing: 3 + Math.floor((s.level + trust) / 3),
    range: spec.style === 'steel' ? 2 : 4,
  };
}

export function formParty(s: Adventure): Ally[] {
  return s.followers.flatMap((id) => {
    const friend = s.friends[id];
    if (!friend) return [];
    const { max } = companionParameters(s, id, friend.resident.role);
    return [{ id, hp: max, max }];
  });
}

export const battleParty = (s: Adventure, encounter: Encounter) =>
  (encounter.allies ??= formParty(s));

function heal(
  s: Adventure,
  battle: Encounter,
  healer: Ally,
  patient: Ally | undefined,
  amount: number,
  focus: number,
  events?: BattleEvent[],
) {
  const before = patient?.hp ?? s.hp;
  if (patient) patient.hp = Math.min(patient.max, patient.hp + amount);
  else recover(s, amount, focus);
  const restored = (patient?.hp ?? s.hp) - before;
  const from = partyPoint(battle, healer.id);
  const to = patient ? partyPoint(battle, patient.id) : heroPoint(s);
  events?.push({ art: 'heal', from, to, outcome: 'power', hp: restored || undefined });
  return restored;
}

function advanceCompanion(
  s: Adventure,
  battle: Encounter,
  ally: Ally,
  floor: Floor,
  range: number,
  targets: number[],
  events?: BattleEvent[],
) {
  const positions = (battle.tactics!.party ??= partyPositions(s, battle, floor));
  const hero = s.delve!.cell;
  const from = partyPoint(battle, ally.id);
  const start = positions[ally.id];
  const walkable = (cell: number) =>
    floor.open.has(cell) &&
    cell !== hero &&
    !occupied(battle, cell) &&
    !partyAt(battle, positions, cell) &&
    !['fire', 'heat', 'wire'].includes(terrainAt(s, cell, s.delve!.floor, floor));
  const reached = pathsFrom(start ?? hero, walkable, start === undefined ? 1 : 7);
  const candidates = [...reached.keys()].slice(1);
  const destination =
    candidates.find((cell) =>
      targets.some((index) => glancingSight(floor, cell, battle.tactics!.cells[index], range)),
    ) ?? (start === undefined ? candidates[0] : undefined);
  if (destination === undefined) return false;
  positions[ally.id] = pathTo(reached, start ?? hero, destination)[0];
  const to = partyPoint(battle, ally.id);
  events?.push({
    art: 'wind',
    from: start === undefined ? { side: 'party', id: ally.id, cell: hero } : from,
    to,
    outcome: 'move',
  });
  return true;
}

export function companionTurn(
  s: Adventure,
  battle: Encounter,
  events?: BattleEvent[],
  negotiate = false,
) {
  const party = battleParty(s, battle);
  const floor = battle.tactics ? fieldFloor(s) : null;
  if (battle.tactics && floor) battle.tactics.party ??= partyPositions(s, battle, floor);
  const linked = borrowedCreature(battle);
  for (const ally of party) {
    if (ally.hp <= 0 || s.frontier.orders[ally.id] === 'hold') continue;
    const targets = battle.enemies.flatMap((foe, index) =>
      foe.hp > 0 && index !== linked ? [index] : [],
    );
    if (!targets.length) break;
    const { resident } = s.friends[ally.id];
    const spec = companionParameters(s, ally.id, resident.role);
    const from = partyPoint(battle, ally.id);
    const inReach = (point: BattlePoint, range: number) =>
      !floor ||
      (from.cell !== undefined &&
        point.cell !== undefined &&
        glancingSight(floor, from.cell, point.cell, range));
    const healing = negotiate ? 2 : spec.healing;
    const patient = party.find(
      (member) =>
        member.hp > 0 &&
        member.hp < member.max &&
        (negotiate || member.hp * 2 <= member.max) &&
        inReach(partyPoint(battle, member.id), 4),
    );
    const healHero =
      (negotiate ? s.hp < maxHp(s) : s.hp * 2 <= maxHp(s)) && inReach(heroPoint(s), 4);
    const treat =
      spec.healer &&
      (negotiate ||
        spec.order === 'support' ||
        s.journey.formation === 'shelter' ||
        battle.turn % 2 === 0);
    if (treat && (healHero || patient)) {
      if (
        heal(s, battle, ally, healHero ? undefined : patient, healing, negotiate ? 0 : 1, events) >
        0
      )
        note(
          s,
          [
            resident.name[0] + 'が負傷者を手当てした。',
            resident.name[1] + ' treats an injured ally.',
          ],
          'good',
        );
      continue;
    }
    const index = negotiate
      ? undefined
      : targets.find((target) => inReach(foePoint(battle, target), spec.range));
    if (index !== undefined) {
      const enemy = battle.enemies[index];
      const template = FOES[enemy.template];
      const modifier = template.weak === spec.style ? 3 : template.resist === spec.style ? -2 : 0;
      const damage = Math.max(
        1,
        spec.power + modifier + nextRandom(s, 3) + (battle.coordinated ? 3 : 0),
      );
      const art = spec.style === 'steel' ? 'slash' : spec.style === 'wind' ? 'wind' : 'arcane';
      const lost = hurtFoe(battle, index, damage, art, from, events);
      enemy.known ||= template.weak === spec.style;
      note(
        s,
        [
          resident.name[0] + 'が' + lost + 'ダメージ。',
          resident.name[1] + ' deals ' + lost + ' damage.',
        ],
        'good',
      );
      continue;
    }
    if (
      !negotiate &&
      floor &&
      advanceCompanion(s, battle, ally, floor, spec.range, targets, events)
    )
      continue;
    if (negotiate && spec.ward) battle.guard = true;
    ally.braced = true;
    events?.push({ art: 'guard', from, to: from, outcome: 'power' });
  }
  delete battle.coordinated;
}

export function targetOfEnemy(
  s: Adventure,
  battle: Encounter,
  inReach: (id: string) => boolean,
  heroInReach: boolean,
) {
  const conscious = battleParty(s, battle).filter(
    (ally) =>
      ally.hp > 0 && (!heroInReach || s.frontier.orders[ally.id] !== 'hold') && inReach(ally.id),
  );
  const line = conscious.filter((ally) => COMPANION_ROLES[s.friends[ally.id].resident.role].ward);
  const targets = [...line, ...conscious];
  if (!targets.length) return undefined;
  return targets[nextRandom(s, targets.length + (heroInReach ? 2 : 0))];
}
