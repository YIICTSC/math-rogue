import { COMPANION_ROLES, FOES } from './content';
import { maxHp, nextRandom, note, recover, type Adventure, type Ally, type Encounter } from './state';
import { fieldFloor, glancingSight } from './frontierWorld';

const loan = (s: Adventure, id: string) => s.gear.find((gear) => gear.id === s.frontier.lent[id]);

export function formParty(s: Adventure): Ally[] {
  return s.followers.flatMap((id) => {
    const friend = s.friends[id];
    if (!friend) return [];
    const max = 12 + s.level * 2 + friend.trust + (friend.memories ?? 0) * 3 +
      (COMPANION_ROLES[friend.resident.role].ward ? 6 : 0) + (loan(s, id)?.slot === 'coat' ? 5 : 0);
    return [{ id, hp: max, max }];
  });
}
export const battleParty = (s: Adventure, encounter: Encounter) =>
  (encounter.allies ??= formParty(s));

export function envoySupport(s: Adventure, encounter: Encounter) {
  const party = battleParty(s, encounter).filter((member) => member.hp > 0 && s.frontier.orders[member.id] !== 'hold');
  const roleOf = (member: Ally) => COMPANION_ROLES[s.friends[member.id].resident.role];
  encounter.guard ||= party.some((member) => roleOf(member).ward);
  if (!party.some((member) => roleOf(member).healer || s.frontier.orders[member.id] === 'support')) return;
  if (s.hp < maxHp(s)) recover(s, 2, 0);
  else {
    const patient = party.find((member) => member.hp < member.max);
    if (patient) patient.hp = Math.min(patient.max, patient.hp + 2);
  }
}

export function companionTurn(s: Adventure, encounter: Encounter) {
  const party = battleParty(s, encounter);
  const floor = encounter.tactics ? fieldFloor(s) : null;
  for (const ally of party) {
    const order = s.frontier.orders[ally.id];
    if (ally.hp <= 0 || order === 'hold') continue;
    const friend = s.friends[ally.id];
    const role = COMPANION_ROLES[friend.resident.role];
    const patient = party.find((member) => member.hp > 0 && member.hp * 2 <= member.max);
    const healHero = s.hp * 2 <= maxHp(s);
    const healing = 3 + Math.floor((s.level + friend.trust) / 3);
    const name = friend.resident.name;
    if ((order === 'support' || (role.healer && (s.journey.formation === 'shelter' || encounter.turn % 2 === 0))) && (healHero || patient)) {
      if (healHero) recover(s, healing, 1);
      else if (patient) patient.hp = Math.min(patient.max, patient.hp + healing);
      note(s, [name[0] + 'が負傷者を手当てした。', name[1] + ' treats an injured ally.'], 'good');
    } else {
      const target = encounter.enemies.find((enemy, index) => enemy.hp > 0 && (!floor ||
        glancingSight(floor, s.delve!.cell, encounter.tactics!.cells[index], role.style === 'steel' ? 2 : 4)));
      if (!target) continue;
      const template = FOES[target.template];
      const modifier = template.weak === role.style ? 3 : template.resist === role.style ? -2 : 0;
      const gear = loan(s, ally.id);
      const damage = Math.max(1, 1 + Math.floor((s.level + friend.trust) / 2) + modifier + nextRandom(s, 3) +
        Number(order === 'strike') * 2 + (gear?.slot === 'weapon' ? Math.min(4, gear.power) : 0));
      target.hp = Math.max(0, target.hp - damage);
      target.known ||= template.weak === role.style;
      note(s, [name[0] + 'が' + damage + 'ダメージ。', name[1] + ' deals ' + damage + ' damage.'], 'good');
    }
  }
}

export function targetOfEnemy(s: Adventure, battle: Encounter) {
  const conscious = battleParty(s, battle).filter((ally) => ally.hp > 0 && s.frontier.orders[ally.id] !== 'hold');
  const line = conscious.filter((ally) => COMPANION_ROLES[s.friends[ally.id].resident.role].ward);
  const targets = [...line, ...conscious];
  if (!targets.length) return undefined;
  return targets[nextRandom(s, targets.length + 2)];
}
