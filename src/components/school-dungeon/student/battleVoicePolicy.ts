import { PROTAGONISTS } from '../../../three/protagonistCatalog';
import { abyssHero } from '../dungeons2/roster';
import type { StudentAudioAction } from './audio';

const mainHeroes = new Set<string>(PROTAGONISTS.map(hero => hero.id));
/** Use the exact banks used by the main adventure, not a newly described speaker. */
export function mainBattleVoiceIdentity(heroId: string) {
  if (!mainHeroes.has(heroId)) return null;
  if (heroId.startsWith('high-school-')) return { theme: 'high-school', id: heroId.slice(12).toUpperCase() } as const;
  if (heroId.startsWith('magic-')) return { theme: 'magic', id: heroId.slice(6).toUpperCase() } as const;
  return null;
}

export function dungeons1BattleVoice(heroId: string, action: StudentAudioAction, finish: boolean, random: () => number) {
  const identity = mainBattleVoiceIdentity(heroId);
  if (!identity || ['walk', 'pickup', 'equip', 'stairs', 'talk'].includes(action)) return null;
  // The magic bank has named offensive spells, not recovery/item dialogue.
  if (identity.theme === 'magic' && ['heal', 'item', 'use', 'read'].includes(action)) return null;
  const name = identity.theme === 'high-school'
    ? action === 'defeat' ? 'defeat'
      : finish || action === 'win' ? 'finish'
      : action === 'damage' || action === 'trap' ? 'damage'
      : ['heal', 'item', 'use', 'read'].includes(action) ? 'item'
      : ['ultimate', 'skill', 'swing', 'transform'].includes(action) ? 'power' : 'attack'
    : action === 'damage' || action === 'trap' || action === 'defeat' ? 'damage'
      : finish || ['win', 'ultimate', 'skill', 'swing', 'transform'].includes(action) ? 'spell' : 'attack';
  const count = identity.theme === 'high-school' ? 5 : 3;
  const variant = 1 + Math.min(count - 1, Math.max(0, Math.floor(random() * count)));
  return { ...identity, file: `${name}-${variant}` };
}

/** Named skills only speak their own name; ordinary items never announce a skill. */
export function dungeons2BattleVoice(heroId: string, action: StudentAudioAction, finish: boolean, random: () => number, abilityName?: string) {
  const hero = abyssHero(heroId);
  if (!hero || ['walk', 'pickup', 'equip', 'stairs', 'talk', 'read', 'use', 'item', 'skill', 'swing'].includes(action)) return null;
  let file: string;
  if (action === 'ultimate') {
    const skill = hero.skills.findIndex(skill => skill.en === abilityName);
    if (abilityName === hero.card.en) file = 'card';
    else if (skill >= 0) file = `ultimate-${skill + 1}`;
    else return null;
  } else file = action === 'defeat' ? 'defeat' : finish || action === 'win' ? 'finish'
    : action === 'damage' || action === 'trap' ? 'damage' : action === 'heal' ? 'heal'
    : action === 'transform' ? 'transform' : 'attack';
  const variant = Math.min(2, Math.max(0, Math.floor(random() * 3)));
  return { theme: 'dungeons2', id: hero.id.slice(10), file: variant ? `${file}-alt-${variant}` : file } as const;
}

export const hasEstablishedDungeonVoice = (actor: string) => Boolean(mainBattleVoiceIdentity(actor) || abyssHero(actor));
