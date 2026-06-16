import { MAGIC_HEROES } from './magicHeroes';

export const FRIENDSHIP_EVENTS = MAGIC_HEROES.map((hero) => ({
  id: `FRIEND_${hero.id}`,
  heroId: hero.id,
  title: `${hero.name}との親友の誓い`,
  requiredFriendship: 80,
  summary: `${hero.name}と互いの進路と使命を支え合う約束をする。`,
}));
