import { COMPANION_ROLES, FOES } from './content';
import { maxHp, nextRandom, note, recover, type Adventure, type Ally, type Encounter } from './state';

export function formParty(s: Adventure): Ally[] {
  return s.followers.flatMap((id) => {
    const friend = s.friends[id];
    if (!friend) return [];
    const max = 12 + s.level * 2 + friend.trust + (COMPANION_ROLES[friend.resident.role].ward ? 6 : 0);
    return [{ id, hp: max, max }];
  });
}
export const battleParty = (s: Adventure, encounter: Encounter) =>
  (encounter.allies ??= formParty(s));

export function companionTurn(s: Adventure, encounter: Encounter) {
  const party = battleParty(s, encounter);
  for (const ally of party) {
    if (ally.hp <= 0) continue;
    const target = encounter.enemies.find((enemy) => enemy.hp > 0);
    if (!target) return;
    const friend = s.friends[ally.id];
    const role = COMPANION_ROLES[friend.resident.role];
    const patient = party.find((member) => member.hp > 0 && member.hp * 2 <= member.max);
    const healHero = s.hp * 2 <= maxHp(s);
    const healing = 3 + Math.floor((s.level + friend.trust) / 3);
    const name = friend.resident.name;
    if (role.healer && encounter.turn % 2 === 0 && (healHero || patient)) {
      if (healHero) recover(s, healing, 1);
      else if (patient) patient.hp = Math.min(patient.max, patient.hp + healing);
      note(s, [name[0] + 'が負傷者を手当てした。', name[1] + ' treats an injured ally.'], 'good');
    } else {
      const template = FOES[target.template];
      const modifier = template.weak === role.style ? 3 : template.resist === role.style ? -2 : 0;
      const damage = Math.max(1, 1 + Math.floor((s.level + friend.trust) / 2) + modifier + nextRandom(s, 3));
      target.hp = Math.max(0, target.hp - damage);
      target.known ||= template.weak === role.style;
      note(s, [name[0] + 'が' + damage + 'ダメージ。', name[1] + ' deals ' + damage + ' damage.'], 'good');
    }
  }
}

export function targetOfEnemy(s: Adventure, battle: Encounter) {
  const conscious = battleParty(s, battle).filter((ally) => ally.hp > 0);
  const line = conscious.filter((ally) => COMPANION_ROLES[s.friends[ally.id].resident.role].ward);
  const targets = [...line, ...conscious];
  if (!targets.length) return undefined;
  return targets[nextRandom(s, targets.length + 2)];
}
