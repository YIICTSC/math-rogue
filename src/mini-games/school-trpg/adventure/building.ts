import { MASTERWORKS, WEAPONS, type Affix, type Biome, type Good, type Goods, type Masterwork, type Slot, type Text, type Weapon } from './content';
import { forgeGear } from './inventory';
import { regionalMastery } from './journeyState';
import { advance, awardExperience, note, spendGoods, type Adventure } from './state';
import { addressKey } from './world';

export const HOUSE_MATERIALS: Partial<Goods> = { timber: 5, ore: 2 };
export const MAX_HOME_LEVEL = 5;
export const BUILDINGS = {
  kitchen: { name: ['かまど', 'Kitchen hearth', 'かまど'], benefit: ['煮込みと焼きパンを作れる', 'Unlocks stew and bread', 'にこみと やきパンを つくれる'], cost: { timber: 2, ore: 2 }, level: 1 },
  larder: { name: ['保存庫', 'Larder', 'ほぞんこ'], benefit: ['弁当づくりで1食追加', 'Adds one ration when cooking', 'べんとうづくりで 1しょく ついか'], cost: { timber: 3, ore: 1 }, level: 1 },
  forge: { name: ['鍛冶炉', 'Forge', 'かじろ'], benefit: ['武器と防具の製作品質が上がる', 'Raises crafted equipment quality', 'ぶきと ぼうぐの できが よくなる'], cost: { timber: 2, ore: 5 }, level: 2 },
  greenhouse: { name: ['温室', 'Glasshouse', 'おんしつ'], benefit: ['作物が早く育ち、収穫が増える', 'Grow crops faster and harvest more', 'さくもつが はやく そだち、しゅうかくが ふえる'], cost: { timber: 4, ore: 2, seed: 2 }, level: 2 },
  infirmary: { name: ['薬棚', 'Apothecary shelf', 'くすりだな'], benefit: ['濃い回復薬を調合できる', 'Unlocks greater tonic', 'こい かいふくやくを つくれる'], cost: { timber: 3, herb: 4 }, level: 1 },
  watchtower: { name: ['見張り台', 'Lookout', 'みはりだい'], benefit: ['ここからの街道移動を短縮', 'Shortens travel from this town', 'ここからの いどうが はやくなる'], cost: { timber: 5, ore: 2 }, level: 2 },
  loom: { name: ['織り機', 'Loom', 'おりき'], benefit: ['月糸の防具と野営道具を製作', 'Unlocks moonthread armor and camp kits', 'つきいとの ぼうぐと やえいどうぐを つくれる'], cost: { timber: 4, thread: 2 }, level: 2 },
  shrine: { name: ['旅の祭壇', 'Traveler’s shrine', 'たびの さいだん'], benefit: ['家で眠るとひらめきが増える', 'Sleeping at home grants Inspiration', 'いえで ねむると ひらめきを えられる'], cost: { timber: 3, relic: 2, ore: 1 }, level: 3 },
  smokehouse: { name: ['燻製小屋', 'Smokehouse', 'くんせいごや'], benefit: ['郷土料理を1食多く仕込める', 'Makes one extra portion of regional meals', 'りょうりを 1しょく おおく つくれる'], cost: { timber: 6, ore: 3, herb: 2 }, level: 4 },
  mapRoom: { name: ['地図の間', 'Map room', 'ちずの ま'], benefit: ['遠征の聞き込み判定＋2', '+2 to expedition scouting checks', 'えんせいの はんてい＋2'], cost: { timber: 5, thread: 3, relic: 2 }, level: 4 },
  masterForge: { name: ['銘品工房', 'Master workshop', 'めいひんこうぼう'], benefit: ['遠征で学んだ設計から銘品を作れる', 'Craft masterworks learned through expeditions', 'えんせいで まなんだ めいひんを つくれる'], cost: { timber: 7, ore: 8, relic: 4 }, level: 5 },
} satisfies Record<string, { name: Text; benefit: Text; cost: Partial<Goods>; level: number }>;

export type Improvement = keyof typeof BUILDINGS;
export const IMPROVEMENTS = Object.keys(BUILDINGS) as Improvement[];
export const hasImprovement = (s: Adventure, improvement: Improvement) =>
  Boolean(s.workshop[addressKey(s.location)]?.additions?.[improvement]);

type Blueprint = {
  name: Text;
  cost: Partial<Goods>;
  hours: number;
  requires?: Improvement;
  mastery?: Biome;
  output: { good: Good; amount: number } | { slot: Slot; weapon?: Weapon; affix?: Affix; masterwork?: Masterwork };
};
export const BLUEPRINTS = {
  sabre: { name: WEAPONS.sabre.name, cost: { timber: 1, ore: 3 }, hours: 3, output: { slot: 'weapon', weapon: 'sabre' } },
  knife: { name: WEAPONS.knife.name, cost: { timber: 1, ore: 2 }, hours: 2, output: { slot: 'weapon', weapon: 'knife' } },
  hammer: { name: WEAPONS.hammer.name, cost: { timber: 1, ore: 4 }, hours: 3, output: { slot: 'weapon', weapon: 'hammer' } },
  spear: { name: WEAPONS.spear.name, cost: { timber: 2, ore: 3 }, hours: 3, output: { slot: 'weapon', weapon: 'spear' } },
  bow: { name: WEAPONS.bow.name, cost: { timber: 3, thread: 2 }, hours: 3, output: { slot: 'weapon', weapon: 'bow' } },
  wand: { name: WEAPONS.wand.name, cost: { timber: 1, thread: 2, relic: 1 }, hours: 3, output: { slot: 'weapon', weapon: 'wand' } },
  staff: { name: WEAPONS.staff.name, cost: { timber: 2, relic: 2, thread: 1 }, hours: 4, output: { slot: 'weapon', weapon: 'staff' } },
  ironCoat: { name: ['鉄樹の外套', 'Ironwood coat', 'てつじゅの がいとう'], cost: { ore: 3, thread: 1 }, hours: 3, output: { slot: 'coat', affix: 'sturdy' } },
  woolCoat: { name: ['生命樹の外套', 'Lifewood coat', 'せいめいじゅの がいとう'], cost: { thread: 3, herb: 2 }, hours: 3, output: { slot: 'coat', affix: 'vigor' } },
  moonCoat: { name: ['風切の外套', 'Windcut coat', 'かぜきりの がいとう'], cost: { thread: 4, ore: 1 }, hours: 3, requires: 'loom', output: { slot: 'coat', affix: 'quick' } },
  starCharm: { name: ['星灯の護符', 'Starlit charm', 'ほしあかりの ごふ'], cost: { relic: 1, ore: 1, thread: 1 }, hours: 2, output: { slot: 'charm', affix: 'bright' } },
  riverCharm: { name: ['深呼吸の護符', 'Stillwater charm', 'しんこきゅうの ごふ'], cost: { relic: 1, herb: 2, thread: 1 }, hours: 2, output: { slot: 'charm', affix: 'focus' } },
  trailMeal: { name: ['携行食をまとめて作る', 'Pack trail meals', 'けいこうしょくを つくる'], cost: { meat: 1, grain: 1 }, hours: 1, output: { good: 'ration', amount: 2 } },
  stew: { name: ['魔獣肉の煮込み', 'Cook beast stew', 'まじゅうにくの にこみ'], cost: { meat: 1, herb: 1 }, hours: 1, requires: 'kitchen', output: { good: 'ration', amount: 3 } },
  bread: { name: ['薬草の焼きパン', 'Bake herb bread', 'やくそうの やきパン'], cost: { grain: 2, herb: 1 }, hours: 1, requires: 'kitchen', output: { good: 'ration', amount: 2 } },
  strongerTonic: { name: ['濃い回復薬を調合', 'Brew greater tonics', 'こい かいふくやくを つくる'], cost: { herb: 3, meat: 1 }, hours: 2, requires: 'infirmary', output: { good: 'strongTonic', amount: 2 } },
  fieldKit: { name: ['野営道具を縫う', 'Stitch a camp kit', 'やえいどうぐを ぬう'], cost: { thread: 2, timber: 2, herb: 1 }, hours: 2, requires: 'loom', output: { good: 'fieldKit', amount: 1 } },
  lampBundle: { name: ['長旅の灯油を作る', 'Refine travel lamp oil', 'ながたびの とうゆを つくる'], cost: { meat: 1, timber: 1, herb: 1 }, hours: 2, output: { good: 'lantern', amount: 3 } },
  archiveWand: { name: MASTERWORKS.archiveWand.name, cost: { timber: 3, relic: 4, thread: 3 }, hours: 5, requires: 'masterForge', mastery: 'academy', output: { slot: 'weapon', weapon: 'wand', affix: 'bright', masterwork: 'archiveWand' } },
  groveVest: { name: MASTERWORKS.groveVest.name, cost: { timber: 4, thread: 5, relic: 3 }, hours: 5, requires: 'masterForge', mastery: 'grove', output: { slot: 'coat', affix: 'vigor', masterwork: 'groveVest' } },
  lowTideCharm: { name: MASTERWORKS.lowTideCharm.name, cost: { fish: 4, thread: 4, relic: 4 }, hours: 5, requires: 'masterForge', mastery: 'coast', output: { slot: 'charm', affix: 'kindly', masterwork: 'lowTideCharm' } },
  rimeCoat: { name: MASTERWORKS.rimeCoat.name, cost: { ore: 9, thread: 3, relic: 3 }, hours: 6, requires: 'masterForge', mastery: 'alpine', output: { slot: 'coat', affix: 'sturdy', masterwork: 'rimeCoat' } },
  kilnHammer: { name: MASTERWORKS.kilnHammer.name, cost: { ore: 8, timber: 4, relic: 3 }, hours: 6, requires: 'masterForge', mastery: 'ember', output: { slot: 'weapon', weapon: 'hammer', affix: 'sturdy', masterwork: 'kilnHammer' } },
  skyPike: { name: MASTERWORKS.skyPike.name, cost: { ore: 5, thread: 5, relic: 4 }, hours: 6, requires: 'masterForge', mastery: 'sky', output: { slot: 'weapon', weapon: 'spear', affix: 'quick', masterwork: 'skyPike' } },
} satisfies Record<string, Blueprint>;
export type BlueprintId = keyof typeof BLUEPRINTS;
export const BLUEPRINT_IDS = Object.keys(BLUEPRINTS) as BlueprintId[];
export const blueprint = (id: BlueprintId): Blueprint => BLUEPRINTS[id];

export function buildImprovement(s: Adventure, id: Improvement) {
  if (!Object.hasOwn(BUILDINGS, id)) return false;
  const house = s.workshop[addressKey(s.location)];
  const plan = BUILDINGS[id];
  if (!house || house.level < plan.level || hasImprovement(s, id) || !spendGoods(s, plan.cost)) return false;
  (house.additions ??= {})[id] = s.time;
  advance(s, 3);
  s.counters.crafted++;
  note(s, [plan.name[0] + 'を建てた。', 'Built ' + plan.name[1] + '.'], 'good');
  return true;
}

export function fabricate(s: Adventure, id: BlueprintId) {
  if (!Object.hasOwn(BLUEPRINTS, id)) return false;
  const { cost, output, requires, mastery, hours, name } = blueprint(id);
  if ((requires && !hasImprovement(s, requires)) ||
    (mastery && regionalMastery(s, mastery) < 2) || !spendGoods(s, cost)) return false;
  advance(s, hours);
  if ('good' in output) {
    const amount = output.amount + Number(output.good === 'ration' && hasImprovement(s, 'larder'));
    s.goods[output.good] += amount;
    note(s, [name[0] + '。' + amount + '個できた。', name[1] + '. Produced ' + amount + '.'], 'good');
  } else {
    const home = s.workshop[addressKey(s.location)];
    forgeGear(s, s.level + (home?.level ?? 0), mastery ? 3 : hasImprovement(s, 'forge') ? 2 : 1, output.slot, output);
  }
  s.counters.crafted++;
  awardExperience(s, 5);
  return true;
}
