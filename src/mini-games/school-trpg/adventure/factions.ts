import { BIOME_IDS, GOODS, type Biome, type Good, type Text } from './content';
import { advance, note, spendGoods, type Adventure } from './state';
import { dayAt, hash, residentPresent, residentsAt, townAt, type Address, type Resident } from './world';

export const FACTIONS = {
  academy: { name: ['鐘楼記録院', 'Belfry Archive', 'しょうろうきろくいん'], rival: 'ember', gift: 'thread',
    line: ['古い記録は公開すべきだと考えている。炉工組合とは製法の扱いで意見が割れる。', 'They want old records to be public. They disagree with the smiths over who can see workshop designs.'] },
  grove: { name: ['種守の輪', 'Circle of the Seedkeepers', 'たねもりの わ'], rival: 'alpine', gift: 'seed',
    line: ['種を分け合い、新しい畑を育てる。峠案内組が林道を広げることには反対している。', 'They share seed stock and tend new gardens. They oppose the expansion of mountain roads through their woods.'] },
  coast: { name: ['潮路の渡し衆', 'Tideway Ferrymen', 'しおじの わたししゅう'], rival: 'sky', gift: 'fish',
    line: ['港の舟と水門を守る。風見の観測団とは、物資を海路と空路のどちらに回すかで競っている。', 'They keep the ferries and locks running. They compete with the sky watchers over shipping routes.'] },
  alpine: { name: ['白嶺案内組', 'Snowridge Guides', 'はくれい あんないぐみ'], rival: 'grove', gift: 'ore',
    line: ['道を整え、冬でも人と食糧が峠を越えられるようにしている。', 'They keep the passes open so food and travelers can cross in winter.'] },
  ember: { name: ['赤炉工匠組合', 'Red Kiln Union', 'せきろ こうしょうくみあい'], rival: 'academy', gift: 'timber',
    line: ['炉と工房を共同で営む。危ない製法を公開するなら、まず使い方を教えるべきだと考える。', 'They share their kilns and workshops. They want to teach safe methods before publishing workshop plans.'] },
  sky: { name: ['風見の観測団', 'Skywatch Observatory', 'かざみの かんそくだん'], rival: 'coast', gift: 'lantern',
    line: ['星と風を測り、浮島の間に航路を引く。軽い荷物なら、港を経由せず届けたい。', 'They chart wind and stars between islands and want a direct route for small cargo.'] },
} satisfies Record<Biome, { name: Text; line: Text; gift: Good; rival: Biome }>;

export const standing = (s: Adventure, id: Biome) => s.fieldwork.standing[id] ?? 0;
export const alliesWith = (s: Adventure, id: Biome) => standing(s, id) >= 7;
export const favorAvailable = (s: Adventure, id: Biome) => s.fieldwork.lastFavor[id] !== dayAt(s.time);

export function standingName(value: number): Text {
  if (value >= 7) return ['盟友', 'Allied', 'めいゆう'];
  if (value >= 3) return ['友好', 'Friendly', 'ゆうこう'];
  if (value <= -3) return ['警戒', 'Wary', 'けいかい'];
  return ['中立', 'Neutral', 'ちゅうりつ'];
}

export function residentFaction(address: Address, resident: Resident): Biome {
  return resident.role === 'broker' || resident.role === 'keeper' ? townAt(address).biome :
    BIOME_IDS[hash(resident.id + '/guild') % BIOME_IDS.length];
}

export function changeStanding(s: Adventure, id: Biome, delta: number) {
  const current = standing(s, id);
  const next = Math.max(-8, Math.min(12, current + delta));
  if (next !== current) s.fieldwork.standing[id] = next;
}

export function pledgeHelp(s: Adventure, id: string) {
  const resident = residentsAt(s.location).find((person) => person.id === id);
  if (!resident || (!s.followers.includes(id) && !residentPresent(resident, s.time))) return false;
  const key = residentFaction(s.location, resident);
  const faction = FACTIONS[key];
  if (standing(s, key) >= 12 || !favorAvailable(s, key) || !spendGoods(s, { [faction.gift]: 1 })) return false;
  s.fieldwork.lastFavor[key] = dayAt(s.time);
  changeStanding(s, key, 2);
  changeStanding(s, faction.rival, -1);
  advance(s, 1);
  const rival = FACTIONS[faction.rival];
  note(s, [
    faction.name[0] + 'に' + GOODS[faction.gift].name[0] + 'を届けた。' + rival.name[0] + 'は動向を気にしている。',
    'Delivered ' + GOODS[faction.gift].name[1] + ' to the ' + faction.name[1] + '. The ' + rival.name[1] + ' took notice.',
  ], 'story');
  return true;
}
