import { CARDS_LIBRARY, CHARACTERS } from '../../constants';
import { ABYSS_HEROES } from '../../components/school-dungeon/dungeons2/roster';
import { CHRONICLE_HEROES } from '../../components/school-dungeon/chronicles/story';
import { HEROES as LANTERN_HEROES } from '../lantern-war/roster';
import { MAGIC_CARDS } from '../../data/magicCards';
import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS } from '../../data/magicHeroes';
import { PROTAGONISTS, type ProtagonistId } from '../../three/protagonistCatalog';
import { TargetType, type Card } from '../../types';
import { DASH_HERO_ART } from '../go-home-dash/heroes';
import type { Copy } from './campaign';

export type Element = 'steel' | 'fire' | 'ice' | 'storm' | 'wind' | 'light' | 'dark';
export type Target = 'foe' | 'foes' | 'self' | 'ally' | 'party';
export type Skill = {
  damage?: number; block?: number; heal?: number; draw?: number; energy?: number; poison?: number; weak?: number; expose?: number;
  strength?: number; reflect?: number; nextDraw?: number; nextEnergy?: number; repeats?: number; recall?: number;
  copy?: boolean; cleanse?: boolean; upgrade?: boolean; transform?: boolean; summon?: boolean; pierce?: boolean; exhaust?: boolean;
};
export type Technique = { id: string; name: Copy; cost: number; target: Target; element: Element; skill: Skill; source?: Card; mastery?: boolean };
export type DeckCard = { key: string; rank?: number; element?: Element; parts?: string[] };
export type Archetype = 'edge' | 'guard' | 'heart' | 'flow' | 'arcana' | 'craft';
export type Outfit = 'scarf' | 'armor' | 'tunic' | 'robe' | 'vest' | 'cloak';
export type Job = {
  id: string; name: Copy; role: Copy; tier: number; stats: readonly [number, number, number, number];
  color: readonly [string, string]; outfit: Outfit; style: Archetype; signature: Technique; mastery: Technique; mentor?: string;
};
export const ELEMENTS: Record<Element, Copy> = {
  steel: ['無属性', 'Physical'], fire: ['炎', 'Fire'], ice: ['氷', 'Ice'], storm: ['雷', 'Lightning'], wind: ['風', 'Wind'], light: ['光', 'Light'], dark: ['闇', 'Dark'],
};
export const ELEMENT_COLOR: Record<Element, string> = {
  steel: '#ffe8bf', fire: '#ff8751', ice: '#a4e3ff', storm: '#e6d77d', wind: '#94edb3', light: '#ffd494', dark: '#bd94ed',
};
export const tech = (id: string, name: Copy, target: Target, skill: Skill, element: Element = 'steel', cost = 1): Technique =>
  ({ id, name, target, skill, element, cost });

function fromMain(source: Card, target?: Target, element: Element = 'steel'): Technique {
  const count = (value: number | undefined, limit: number) => value ? Math.min(limit, Math.max(1, value)) : undefined;
  const damage = source.damage ? Math.min(14, Math.max(4, Math.round(source.damage * .85))) : undefined;
  const skill: Skill = {
    damage, block: count(source.block, 11), heal: count(source.heal, 12), draw: count(source.draw, 2),
    energy: count(source.energy, 1), nextEnergy: count(source.nextTurnEnergy, 1), nextDraw: count(source.nextTurnDraw, 1),
    poison: count(source.poison, 4), weak: count(source.weak, 2), expose: count(source.vulnerable, 2),
    strength: count(source.strength, 3), repeats: source.playCopies ? 2 : undefined, exhaust: source.exhaust || undefined,
  };
  if (!Object.values(skill).some(Boolean)) skill.block = 7;
  return {
    id: source.id, name: [source.name, source.name], source, element, skill,
    target: target ?? (source.target === TargetType.ALL_ENEMIES ? 'foes' : damage || skill.weak || skill.poison || skill.expose ? 'foe' : 'self'),
    cost: Math.min(2, Math.max(0, source.cost)),
  };
}

const port = (id: string, en: string) => {
  const source = CARDS_LIBRARY[id];
  if (!source) throw new Error(`Missing original card ${id}`);
  const card = fromMain({ ...source, id });
  return { ...card, name: [source.name, en] as const };
};
const STRIKE = port('STRIKE', 'Pencil Strike');
const GUARD = port('DEFEND', 'Notebook Guard');
const SCHOOL_EDGE = port('HS_STARTER_EDGE', 'Penblade');
const SCHOOL_GUARD = port('HS_STARTER_GUARD', 'Reference Guard');
const COMMON = [
  STRIKE, GUARD, SCHOOL_EDGE, SCHOOL_GUARD,
  port('TWIN_STRIKE', 'Twin Strike'), port('POISON_STAB', 'Poison Jab'), port('QUICK_SLASH', 'Quick Slice'),
  port('IRON_WAVE', 'Indoor-Shoe Kick'), port('THUNDERCLAP', 'Thunderous Voice'), port('HS_STARTER_SPARK', 'Lab Spark'),
  port('HS_STARTER_RESONANCE', 'Resonant Tuning'), port('HS_STARTER_HEAT', 'Griddle Heat'),
  tech('remedy', ['薬草の手当て', 'Herbal Remedy'], 'ally', { heal: 9, cleanse: true }, 'light'),
  tech('field-note', ['観察ノート', 'Field Notes'], 'self', { block: 4, draw: 1 }),
  tech('opening', ['はじまりの一歩', 'First Step'], 'foe', { damage: 7, expose: 1 }),
  tech('camp-shield', ['野営の護り', 'Camp Ward'], 'party', { block: 4 }, 'light'),
  tech('remnant', ['忘却を踏み越える', 'Striding Past Oblivion'], 'foes', { damage: 15, pierce: true }, 'dark', 2),
  tech('artifact', ['記憶の召喚', 'Memory Invocation'], 'foes', { damage: 9, summon: true, exhaust: true }, 'light', 2),
  tech('turnpage', ['頁をめくる', 'Turn the Page'], 'self', { recall: 1, block: 5 }),
  tech('transfigure', ['旅装変身', 'Travel Aspect'], 'self', { transform: true, exhaust: true }, 'light', 2),
];

const job = (id: string, name: Copy, role: Copy, tier: number, style: Archetype, stats: Job['stats'], color: Job['color'], outfit: Outfit,
  action: Copy, target: Target, skill: Skill, element: Element, advanced: Copy, boost: Skill, mentor?: string): Job => ({
  id, name, role, tier, style, stats, color, outfit, mentor,
  signature: tech(`job:${id}`, action, target, skill, element, skill.summon ? 2 : 1),
  mastery: { ...tech(`master:${id}`, advanced, target, boost, element, boost.summon || boost.transform ? 2 : 1), mastery: true },
});

export const JOB_LIST = [
  job('adventurer', ['冒険者', 'Adventurer'], ['攻守のバランス', 'Balanced offense and defense'], 0, 'edge', [4,1,1,1], ['#396d61','#8ec6a0'], 'scarf', ['道を切り開く','Trailblaze'], 'foe', { damage:7, block:3 }, 'steel', ['開拓の手順','Pioneer’s Plan'], { damage:9, block:5, draw:1 }),
  job('swordsman', ['剣士', 'Swordsman'], ['強力な物理攻撃', 'Physical offense'], 0, 'edge', [3,3,0,0], ['#a64643','#f3a564'], 'tunic', ['割石斬','Stonecleaver'], 'foe', { damage:10 }, 'steel', ['峰割り','Ridgebreaker'], { damage:12, pierce:true }),
  job('guardian', ['守護騎士', 'Guardian'], ['味方をかばう', 'Protects allies'], 0, 'guard', [10,0,0,3], ['#345883','#91bfe9'], 'armor', ['盾の誓約','Shield Oath'], 'ally', { block:11 }, 'light', ['反照の盾','Reflecting Shield'], { block:14, reflect:3 }),
  job('monk', ['武闘家', 'Brawler'], ['コンボと連撃', 'Combos and multi-hits'], 0, 'edge', [6,2,0,1], ['#9a532e','#ecb374'], 'scarf', ['二連掌','Twin Palms'], 'foe', { damage:5, repeats:2 }, 'steel', ['三拍子連環','Three-Beat Chain'], { damage:4, repeats:3 }),
  job('mage', ['魔導士', 'Mage'], ['属性と範囲攻撃', 'Elemental area damage'], 0, 'arcana', [0,0,3,0], ['#503e81','#bfa3f1'], 'robe', ['野火','Wildfire'], 'foes', { damage:5 }, 'fire', ['野火の輪','Wildfire Ring'], { damage:8 }),
  job('medic', ['治癒術師', 'Healer'], ['回復と状態異常解除', 'Healing and cleansing'], 0, 'heart', [3,0,2,0], ['#8c486c','#f4b3cd'], 'robe', ['花の祝祷','Flower Benediction'], 'ally', { heal:13 }, 'light', ['百花の祝祷','Hundred-Flower Rite'], { heal:17, cleanse:true }),
  job('archer', ['弓術士', 'Archer'], ['後衛からの精密射撃', 'Precision from the rear'], 0, 'flow', [3,2,0,1], ['#376a40','#b0d27a'], 'vest', ['追い風の矢','Tailwind Arrow'], 'foe', { damage:8, expose:1 }, 'wind', ['裂風の矢','Galesplit Arrow'], { damage:11, expose:2 }),
  job('scout', ['斥候', 'Scout'], ['回避と手札の補充', 'Evasion and drawing'], 0, 'flow', [0,1,1,2], ['#376064','#79d1cf'], 'cloak', ['霧渡り','Miststep'], 'self', { block:6, draw:2 }, 'wind', ['風の抜け道','Shortcut in the Wind'], { block:8, draw:2, nextEnergy:1 }),
  job('scholar', ['学者', 'Scholar'], ['分析と学びの補助', 'Analysis and study'], 0, 'craft', [0,0,2,1], ['#494a83','#a5bbed'], 'vest', ['観測線','Sightline'], 'foe', { damage:6, expose:2 }, 'storm', ['仮説の実証','Proof of Hypothesis'], { damage:8, expose:2, draw:1 }),
  job('alchemist', ['錬金術師', 'Alchemist'], ['薬と継続ダメージ', 'Medicines and damage over time'], 0, 'craft', [3,0,2,1], ['#496f5c','#a4e1ae'], 'vest', ['蜂蜜と毒','Honey and Venom'], 'foe', { damage:5, poison:4 }, 'dark', ['蒸留した毒','Distilled Venom'], { poison:7, weak:2 }),
  job('spellblade', ['魔法剣士', 'Spellblade'], ['魔力を込めた剣', 'Elemental blade technique'], 1, 'edge', [4,3,2,0], ['#663e73','#f0a6d7'], 'tunic', ['焔刃','Flameblade'], 'foe', { damage:13 }, 'fire', ['残火の一閃','Ember Flash'], { damage:15, expose:1 }, 'swordsman'),
  job('spirit', ['精霊術師', 'Spirit Caller'], ['精霊による全体支援', 'Party support from spirits'], 1, 'heart', [3,1,3,1], ['#45785e','#b6fad2'], 'robe', ['精霊の雨','Spirit Rain'], 'party', { heal:5, block:3 }, 'wind', ['木霊の抱擁','Echoing Embrace'], { heal:7, cleanse:true }, 'medic'),
  job('chronist', ['時術師', 'Chronist'], ['カードの再使用', 'Reuses spent cards'], 1, 'craft', [1,0,3,1], ['#366e74','#95e3e5'], 'cloak', ['一頁戻し','Back One Page'], 'self', { recall:1, draw:1 }, 'ice', ['反復回廊','Looping Hall'], { recall:2, nextEnergy:1 }, 'scholar'),
  job('tactician', ['戦術家', 'Tactician'], ['味方の攻勢を支援', 'Supports allied offense'], 1, 'guard', [7,1,1,2], ['#78623e','#e7c577'], 'armor', ['前進の号令','Advance Order'], 'party', { strength:1, block:3 }, 'steel', ['総員反撃','Countermarch'], { strength:2, reflect:2 }, 'guardian'),
  job('cantor', ['音律師', 'Cantor'], ['歌で態勢を整える', 'Songs restore formation'], 1, 'heart', [4,0,3,2], ['#803c6e','#f9b1df'], 'scarf', ['黎明の小曲','Dawn Song'], 'party', { heal:4, nextDraw:1 }, 'light', ['調律の大合唱','Chorus of Accord'], { heal:7, block:3 }, 'medic'),
  job('beast', ['獣使い', 'Beastkeeper'], ['魔物と連携して牽制', 'Fights alongside beasts'], 1, 'flow', [7,3,1,0], ['#725338','#dec196'], 'vest', ['梟の追い撃ち','Owl Pursuit'], 'foe', { damage:6, repeats:2, weak:1 }, 'wind', ['灰狼の遠吠え','Graywolf Howl'], { damage:13, weak:2 }, 'archer'),
  job('summoner', ['召喚術師', 'Summoner'], ['召喚獣の範囲攻撃', 'Conjures area attacks'], 1, 'arcana', [2,0,5,0], ['#554490','#ccbafc'], 'robe', ['稲妻の使い','Lightning Familiar'], 'foes', { damage:9, summon:true }, 'storm', ['雷獣の呼び声','Thundercat’s Call'], { damage:12, summon:true, weak:1 }, 'mage'),
  job('runes', ['符術師', 'Runesmith'], ['弱体と反射結界', 'Weakening and warding'], 1, 'arcana', [2,0,3,3], ['#573759','#cba1dd'], 'cloak', ['墨の守符','Inkwell Ward'], 'foes', { weak:1, poison:2, block:3 }, 'dark', ['写し身の結界','Echo Seal'], { weak:2, poison:3, reflect:4 }, 'alchemist'),
  job('astral', ['星界騎士', 'Astral Knight'], ['強固な全体結界', 'Heavy party barrier'], 2, 'guard', [14,2,3,4], ['#465393','#ffc978'], 'armor', ['星環障壁','Astral Ring'], 'party', { block:10, reflect:2 }, 'light', ['天蓋の護り','Firmament Guard'], { block:13, cleanse:true }, 'tactician'),
  job('sage', ['知識の賢者', 'Sage of Letters'], ['回復・強化・知識', 'Restoration and knowledge'], 2, 'heart', [6,0,5,2], ['#82663e','#ffe5a9'], 'robe', ['知恵の手渡し','Share Wisdom'], 'party', { heal:10, cleanse:true }, 'light', ['万巻の書架','Endless Stacks'], { heal:12, nextDraw:1, cleanse:true }, 'spirit'),
  job('phantom', ['幻影剣士', 'Phantom Blade'], ['防御を無視する連撃', 'Piercing multi-hit damage'], 2, 'edge', [6,5,1,3], ['#5f497b','#e0a0e2'], 'tunic', ['背影斬','Shadowslash'], 'foe', { damage:8, repeats:2, pierce:true }, 'dark', ['三つの影','Three Shadows'], { damage:7, repeats:3, pierce:true }, 'spellblade'),
  job('skymage', ['天空術師', 'Sky Weaver'], ['風と雲の全体攻撃', 'Wind and clouds strike all foes'], 2, 'arcana', [4,0,5,2], ['#416f8d','#b1edf0'], 'cloak', ['雲の矢雨','Cloudburst'], 'foes', { damage:10, weak:1 }, 'wind', ['嵐の針路','Storm Course'], { damage:12, weak:2 }, 'summoner'),
  job('drake', ['竜契士', 'Drakebound'], ['竜と挑む大技', 'Devastating drake summons'], 2, 'flow', [9,4,3,1], ['#8b4936','#ffbc74'], 'armor', ['竜の息吹','Drake Breath'], 'foes', { damage:14, summon:true }, 'fire', ['竜との契約','Drake Covenant'], { damage:17, summon:true, expose:1 }, 'beast'),
  job('omni', ['万象魔導士', 'Prismatic Mage'], ['結界を破る属性魔法', 'Breaks magical barriers'], 2, 'arcana', [3,0,7,0], ['#594282','#efd0ff'], 'robe', ['無色の閃光','Colorless Flash'], 'foes', { damage:12, pierce:true }, 'storm', ['万象の虹','Prismatic Array'], { damage:14, pierce:true, expose:1 }, 'runes'),
  job('cardmaster', ['カードマスター', 'Cardmaster'], ['複製と手札強化', 'Copies and strengthens cards'], 2, 'craft', [5,1,4,2], ['#493984','#ffdc8a'], 'vest', ['合わせ写し','Mirror Copy'], 'self', { copy:true, upgrade:true }, 'light', ['千枚の手','Thousand-Card Hand'], { copy:true, upgrade:true, draw:2 }, 'chronist'),
  job('seeker', ['世界の探究者', 'World Seeker'], ['総合戦術と旅装変身', 'Flexible tactics and transformation'], 2, 'craft', [8,3,3,3], ['#41665a','#f7ca87'], 'scarf', ['世界図の余白','Blank on the Chart'], 'self', { transform:true, nextEnergy:1, exhaust:true }, 'light', ['余白の歩き方','Treading the Margins'], { transform:true, nextDraw:2, exhaust:true }, 'tactician'),
] as const;
export const JOBS: Record<string, Job> = Object.fromEntries(JOB_LIST.map(entry => [entry.id, entry]));

export type WorldOfOrigin = 'elementary' | 'high-school' | 'magic' | 'guest';
export type Hair = 'spike' | 'bob' | 'long' | 'pony' | 'braid' | 'buns' | 'wave';
export type Passive = 'resolve' | 'guard' | 'venom' | 'tempo' | 'echo' | 'focus' | 'hearty' | 'bloom' | 'spark' |
  'link' | 'moon' | 'heat' | 'ward' | 'recall' | 'gale' | 'refrain' | 'code' | 'precision' | 'riposte';
type Identity = { job: string; passive: Passive; color: string; hairColor: string; hair: Hair; token: string; en: string; voice: Copy; side: Copy };
const identity = (job: string, passive: Passive, color: string, hairColor: string, hair: Hair, token: string, en: string, jaVoice: string, enVoice: string, jaSide: string, enSide: string): Identity =>
  ({ job, passive, color, hairColor, hair, token, en, voice: [jaVoice, enVoice], side: [jaSide, enSide] });
const IDENTITIES: Record<ProtagonistId, Identity> = {
  'elementary-warrior': identity('adventurer','resolve','#d75b48','#4c2e30','spike','scarf','Spirited Pupil','道が消えたなら、みんなで足あとをつけよう！','If the path is gone, let’s make one with our footprints!','遠回りしたおかげで、友だちが待っていたことに気づいた。','The long way around was how I noticed a friend had waited.'),
  'elementary-caretaker': identity('guardian','guard','#be8b48','#72492d','bob','cap','Animal Keeper','あの子、威嚇してる。怖いのはこっちだけじゃないよ。','It’s trying to scare us. We aren’t the only ones afraid.','巣の前に落ちた羽を戻すと、ひながまた鳴きはじめた。','I put a fallen feather back at the nest, and the chicks sang again.'),
  'elementary-assassin': identity('scout','venom','#6dac66','#302a39','spike','wrap','Transfer Pupil','裏道、見つけた。声をかけられる前に教えておくよ。','Found a back way. I thought I’d tell you before you had to ask.','初めて、自分から「待ってて」と言った。','For the first time, I asked someone to wait for me.'),
  'elementary-dodgeball': identity('monk','tempo','#e28241','#a05128','spike','band','Dodgeball Ace','投げるタイミングなら任せて。避けるのも得意！','Leave the timing to me. I’m good at dodging, too!','勝つより、全員に一回ずつ球が回るようにした。','Instead of chasing a win, I made sure everyone got a turn.'),
  'elementary-bard': identity('archer','echo','#e0aa51','#614231','bob','headphones','School Broadcaster','聞こえますか？ 迷った人は、鐘が二回鳴る方へ！','Can you hear me? If you’re lost, listen for two bells!','小さな声まで拾ったら、村から返事が来た。','I caught the quietest voice, and the whole village answered.'),
  'elementary-librarian': identity('scholar','focus','#9b73c7','#2f3e5a','long','glasses','Library Monitor','本があった場所は、棚の色が違う。何がなくなったか調べられる。','The shelf is lighter where a book was. We can work out what vanished.','書き込みは禁止のはずなのに、消えかけた字を一緒になぞった。','We weren’t supposed to write in books, but we traced the fading letters together.'),
  'elementary-chef': identity('medic','hearty','#da7887','#6b3535','bob','cap','Lunch Captain','呼ばれた順でなくていいよ。お腹が空いた人からどうぞ！','Forget the line. Anyone who’s hungry, come first!','最後の一切れを半分にしたら、前よりおいしかった。','The last slice tasted better when I shared it.'),
  'elementary-gardener': identity('medic','bloom','#7ea446','#4b5033','braid','leaf','Garden Monitor','芽が出るまで、この札を目印にしておこう。','Let’s mark this spot until the seed sprouts.','忘れても、来年はここに花が咲く。','Even if we forget, flowers will grow here next year.'),
  'elementary-mage': identity('mage','spark','#65a6d2','#435c71','spike','glasses','Science Club Captain','さっきと同じやり方でもう一度。変わったのは水の量だけ！','Same method one more time. Only the amount of water changed!','壊れた装置に失敗の理由を書き添えた。','I wrote down why it failed and left the note on the machine.'),
  'high-school-warrior': identity('swordsman','resolve','#6589be','#202333','spike','crest','Rebellious Student','進むのは賛成。でも帰った先で何を話すかも、考えとけよ。','I’m in. Just think about what we’re going to tell them when we get back.','最後尾から歩けば、遅れたやつに最初に気づく。','From the back of the line, you’re first to notice someone falling behind.'),
  'high-school-caretaker': identity('guardian','guard','#aa8870','#634333','bob','leaf','Biology Club Senior','捕まえなくていい。帰る場所が分かれば落ち着くから。','We don’t need to catch it. It will settle once it knows its way home.','標本にせず、村の草むらへそっと放した。','Instead of making it a specimen, I released it in the village grass.'),
  'high-school-assassin': identity('scout','venom','#748880','#282a3e','long','ribbon','Mysterious Transfer','見逃してくれたのは誰？ ありがとうくらい、言っておきたい。','Who let me slip by? I’d like to say thank you.','素性を尋ねられる前に、自分のことを一つ話した。','I told them one thing about myself before anyone asked.'),
  'high-school-mage': identity('alchemist','spark','#6d9ea8','#3b434d','spike','glasses','Chemistry Society Chair','旅の道具は条件が変わっても動くように。失敗の予備も積んでおこう。','Pack tools that still work when conditions change. Bring spares for the experiments.','発明品の説明書に「直してもいい」と書き足した。','I added a line to the manual: feel free to fix this.'),
  'high-school-dodgeball': identity('monk','tempo','#d37c49','#924d2c','spike','band','Basketball Ace','空いてる場所に走って。次はそっちに回す！','Run into space. The next pass is yours!','自分の名前より先に、パスをくれた相手の名前を書いた。','I wrote my teammate’s name before my own.'),
  'high-school-bard': identity('archer','echo','#c0a488','#625170','wave','headphones','Broadcast Director','派手な音はあと回し。無事だってことだけ伝えよう。','Save the fanfare. Just tell them everyone is safe.','あの夜の小さな物音が、いちばん長く残った。','The faintest sound from that night lasted the longest.'),
  'high-school-librarian': identity('scholar','focus','#8c86ba','#293955','long','glasses','Literature Secretary','前の人の文章を消さずに、続きを書く方法があるはず。','We should be able to continue the story without erasing what came before.','空白は間違いじゃない、と返却手帳に書いた。','I wrote in the return ledger that a blank is no mistake.'),
  'high-school-chef': identity('medic','hearty','#a36858','#775141','bob','cap','Cafeteria Chef','味を忘れたなら、舌より先に匂いを思い出すかもね。','If the flavor is gone, the smell may come back first.','同じ鍋なのに、みんなの故郷の味がした。','It was one pot, yet everyone tasted home.'),
  'high-school-gardener': identity('medic','bloom','#77a574','#493a35','braid','leaf','Garden Club Captain','根は見えなくても伸びてる。結果を急がないで。','Roots keep growing out of sight. Don’t rush them.','船の鉢植えには、帰りの分の種ができていた。','The ship’s planter had grown enough seed for the return voyage.'),
  'magic-akari': identity('adventurer','link','#e56b69','#a53149','pony','star','Akari Hoshimiya','一人じゃ見落とす星も、みんななら星座にできるよ。','One of us may miss a star. Together we can find the constellation.','誰かが決めた星座の外にも、導きの星を見つけた。','We found a guiding star outside anyone’s constellation.'),
  'magic-shizuku': identity('guardian','moon','#698aca','#283659','long','glasses','Shizuku Mizuki','鏡のせいで遠く見えるだけ。映らないところから回りましょう。','The mirror only makes it look far away. Let’s go where it can’t see.','凍った鏡を裏返したら、誰かの伝言が読めた。','Turning over the frozen mirror revealed someone’s message.'),
  'magic-hiyori': identity('medic','bloom','#e590b5','#c86f9d','wave','flower','Hiyori Hanasaki','平気って言い切る前に、いっしょに休もう？','Before you say you’re fine, will you rest with me?','薬草を二人で摘んだ。それだけで痛みが少し遠のいた。','We picked herbs together, and the pain felt farther away.'),
  'magic-tsubasa': identity('monk','heat','#e58246','#bd582c','spike','band','Tsubasa Kagami','勝つだけなら簡単。今度は誰かの足場も火で照らしてみる。','Winning is easy. This time the fire can light someone’s way.','古い炉を直し、村へ持ち帰れる大きさの火にした。','I mended the old forge and made a flame small enough to carry home.'),
  'magic-rei': identity('mage','ward','#826293','#2a2338','long','ribbon','Rei Kurobane','気休めは言わない。でも、その呪いまであなたの責任じゃない。','I won’t offer platitudes. But that curse isn’t your fault.','破った護符の一片を、あえて記録に残した。','I deliberately kept one torn piece of the talisman in the record.'),
  'magic-madoka': identity('alchemist','recall','#70cbb0','#56ae9b','buns','glasses','Madoka Midorikawa','復元じゃなくてやり直し、です。だから同じ失敗を選ばなくていい。','It’s a retry, not a restore. We get to choose a different mistake.','時間装置の記録に、協力者を自分と同じ字で刻んだ。','I etched my collaborator’s name into the log in letters as large as mine.'),
  'magic-koharu': identity('archer','gale','#8eb66a','#4a8256','braid','leaf','Koharu Kazamori','矢を放つ前に、あの枝がどちらへ揺れるか見て。','Before you loose the arrow, watch which way that branch sways.','帰りに射った矢は、道標になって風に鳴った。','The arrow I fired on the way back sang in the wind as a signpost.'),
  'magic-mirai': identity('scout','refrain','#a477c8','#7b5d9d','wave','star','Mirai Shido','怖い夢は、もう一度見ると脇役の顔まで見えるのよ。','See a nightmare twice and you start to notice the smaller parts.','自分もこわかったことを、舞台に出る前に打ち明けた。','Before going onstage, I admitted that I’d been afraid too.'),
  'magic-sera': identity('scholar','code','#c7b888','#bcc8ce','bob','star','Sera Shiramine','記録したことより、どうして残したかったかを聞かせて。','Tell me why you wanted to keep it, more than what it says.','記録に書けない気持ちのため、最後の一行は空けておいた。','I left one line blank for feelings I couldn’t put in the record.'),
  'magic-ren': identity('guardian','guard','#5996b4','#4b4d55','spike','scarf','Ren Asagiri','先に行っていいよ。遅れた人を迎えに行くから。','Go ahead. I’ll go back for anyone who fell behind.','道を覚えるまで、同じ帰り道を何度も歩いた。','I walked the same way home until I knew it by heart.'),
  'magic-soma': identity('swordsman','precision','#628dc1','#485a77','bob','crest','Soma Mikage','一度で揃わなくても構わない。足りないところから順番に。','It doesn’t all have to fit at once. Start with the pieces we’re missing.','きれいな設計図に、子どもの手書きの道を描き足した。','A child’s hand-drawn path went on my neatly ruled map.'),
  'magic-minato': identity('medic','hearty','#60bfa5','#5a8f99','bob','scarf','Minato Shiraishi','今日は治すだけじゃなく、追いつくまで隣にいます。','Today I’ll stay beside you until you can catch up.','治癒の練習帳に、眠れた時間も書くことにした。','I started keeping track of sleep in my healing journal.'),
  'magic-riku': identity('scholar','recall','#9f83c9','#716187','wave','glasses','Riku Amane','一秒だけ戻れるなら、謝る時間に使うかな。','If I could get one second back, I might use it to apologize.','測り損ねた一秒を、大切だったと日記に書いた。','In my diary, I wrote that the second I failed to measure mattered.'),
  'magic-yamato': identity('monk','heat','#be565c','#452a38','spike','band','Yamato Kurose','出口は空けておけ。勝っても誰も出られなきゃ台無しだ。','Leave the exit clear. It’s no win if nobody can get out.','壊した柵を直すまで、誰にも見られないと思っていた。','I thought nobody was watching while I repaired the gate I broke.'),
  'magic-leon': identity('mage','refrain','#9c71c2','#957971','wave','ribbon','Leon Kamishiro','本番では譜面どおりにいかない。そこからがいいんだ。','The show won’t follow the score. That’s when it gets good.','喝采が少ない舞台ほど、終演後の言葉を覚えていた。','The smaller the applause, the better I remember what people said afterward.'),
  'magic-elliot': identity('mage','code','#c0a16a','#9a8669','bob','star','Elliot Knox','答えが違うなら、問いの方を一緒に見直しませんか。','If our answers differ, shall we look at the question together?','異国の人にも読めるよう、古い地図に二通りの言葉を残した。','I left two languages on the old map so a stranger could read it.'),
  'magic-sakuya': identity('scout','ward','#9b4e66','#251e30','long','wrap','Sakuya Kujo','封印を解く前に、閉じた理由を忘れるな。','Before you undo a seal, remember why it was closed.','破らなくても通れる扉を、一つ選んで残した。','I chose one door we could open without breaking it down.'),
};

export const PASSIVES: Record<Passive, Copy> = {
  resolve:['先陣：毎ターン最初の攻撃＋2','Resolve: first attack each turn +2'], guard:['かばう：毎ターン開始時ブロック＋3','Cover: +3 block each turn'],
  venom:['毒刃：毒を付ける効果＋2','Venom: +2 poison applied'], tempo:['速攻：1ターン目のエナジー＋1','Tempo: +1 energy on turn 1'],
  echo:['応答：ブロック時に反撃＋2','Answer: block cards add 2 counters'], focus:['熟読：開始時ドロー＋1','Close Reading: +1 opening draw'],
  hearty:['滋養：回復効果＋3','Nourish: healing +3'], bloom:['ブルームヒール：超過回復をブロックに変える','Bloom Heal: excess healing becomes block'],
  spark:['次の実験：雷の威力＋3','Next Experiment: lightning power +3'], link:['スターリンク：味方が動いた後の攻撃＋3','Star Link: attacks after an ally acts deal +3'],
  moon:['ルナリフレクト：得たブロックの一部を反射','Lunar Reflect: reflect part of block gained'], heat:['火勢：HP半分以下でダメージ＋4','Forge Heat: +4 damage below half HP'],
  ward:['影札結界：状態異常を付けるとブロック＋3','Shadow Seal: gain 3 block when applying a status'],
  recall:['巻き戻し：各戦闘で最初の使用札を手札へ戻す','Rewind: recover the first card played each fight'],
  gale:['ゲイルステップ：後衛から風・射撃が強い','Gale Step: stronger wind and ranged attacks from the rear'],
  refrain:['アンコール：3枚使うたびにドロー','Encore: draw every third card played'], code:['星界コード：カードを使うと連携＋1','Astral Code: +1 Link when playing cards'],
  precision:['氷の秩序：氷の威力＋3','Icy Order: ice power +3'], riposte:['迎撃：自分の防御が削られるたびに反撃','Riposte: counter when block is hit'],
};

export type Hero = Identity & { id: string; name: Copy; origin: WorldOfOrigin; portrait: string; maxHp: number; signature: Technique; limit: Technique };
const SCHOOL_SPECIALS: Record<string, readonly [string, string]> = {
  warrior:['HS_STARTER_EDGE','Penblade'], caretaker:['HS_STARTER_STEP','Step In'], assassin:['HS_STARTER_FAINT','Feint Report'],
  dodgeball:['HS_STARTER_THROW','Side Throw'], bard:['HS_STARTER_RESONANCE','Resonant Tuning'], librarian:['HS_STARTER_PREP','Forbidden Bookmark'],
  chef:['HS_STARTER_HEAT','Griddle Heat'], gardener:['HS_STARTER_BIND','Black Ribbon Snare'], mage:['HS_STARTER_SPARK','Lab Spark'],
};
const PRIMARY_SPECIALS: Record<string, readonly [string, string]> = {
  warrior:['BASH','Schoolbag Tackle'], caretaker:['CAPTURE_NET','Capture Net'], assassin:['POISON_STAB','Poison Jab'],
  dodgeball:['DAGGER_THROW','Chalk Toss'], bard:['THUNDERCLAP','Thunderous Voice'], librarian:['SHRUG_IT_OFF','Close the Book'],
  chef:['INFLAME','Stoke the Fire'], gardener:['IRON_WAVE','Garden Sweep'], mage:['BALL_LIGHTNING','Ball Lightning'],
};
const MAGIC_NAME: Record<string, string> = {
  akari:'Star Link', shizuku:'Lunar Mirror', hiyori:'Bloom Heal', tsubasa:'Forge Burst', rei:'Shadow Seal', madoka:'Clock Reload',
  koharu:'Gale Step', mirai:'Dream Encore', sera:'Celestial Code', ren:'Azure Ward', soma:'Icy Order', minato:'Clearwater',
  riku:'Time Survey', yamato:'Crimson Fist', leon:'Illusion Score', elliot:'Astral Invocation', sakuya:'Twilight Seal',
};
const MAGIC_SPECIAL: Readonly<Record<string, readonly [Target, Skill, Element]>> = {
  akari:['foes',{ damage:8, block:4 },'light'], shizuku:['ally',{ block:12, reflect:3 },'ice'], hiyori:['ally',{ heal:14, cleanse:true },'light'],
  tsubasa:['foe',{ damage:13, expose:1 },'fire'], rei:['foes',{ poison:4, weak:1 },'dark'], madoka:['self',{ recall:1, nextEnergy:1, block:5 },'storm'],
  koharu:['foe',{ damage:9, draw:1 },'wind'], mirai:['self',{ copy:true, draw:1, block:4 },'dark'], sera:['party',{ strength:1, block:4 },'light'],
  ren:['ally',{ block:12, heal:3 },'wind'], soma:['foe',{ damage:11, weak:2 },'ice'], minato:['party',{ heal:6, cleanse:true },'ice'],
  riku:['self',{ recall:2, block:5 },'storm'], yamato:['foe',{ damage:7, repeats:2 },'fire'], leon:['foes',{ damage:8, nextDraw:1 },'dark'],
  elliot:['foes',{ damage:12, summon:true, exhaust:true },'light'], sakuya:['foe',{ damage:10, poison:4, pierce:true },'dark'],
};
export const HERO_LIST: Hero[] = PROTAGONISTS.map(({ id, name }) => {
  const identity = IDENTITIES[id];
  const origin = id.startsWith('magic-') ? 'magic' : id.startsWith('high-school-') ? 'high-school' : 'elementary';
  const key = id.slice(origin.length + 1);
  const base = CHARACTERS.find(entry => entry.id === key.toUpperCase());
  const magic = [...MAGIC_HEROES, ...MAGIC_MALE_PROTAGONISTS].find(entry => entry.id.toLowerCase() === key);
  const art = DASH_HERO_ART[id] ?? base?.imageData ?? '';
  const special = origin === 'magic' ? MAGIC_SPECIAL[key] : undefined;
  const source = special ? MAGIC_CARDS.find(card => card.magicHeroId === key.toUpperCase()) : undefined;
  const [cardKey, en] = (origin === 'high-school' ? SCHOOL_SPECIALS : PRIMARY_SPECIALS)[key] ?? ['STRIKE','Pencil Strike'];
  const starter = port(cardKey, en);
  const signature = special
    ? { ...tech(`hero:${id}`, [source?.name ?? name, MAGIC_NAME[key]], ...special, key === 'elliot' ? 2 : 1), source }
    : { ...starter, id: `hero:${id}`, element: key === 'mage' ? 'storm' as const : key === 'gardener' ? 'wind' as const : starter.element };
  const healing = ['hearty','bloom'].includes(identity.passive);
  const defense = ['guard','moon','echo'].includes(identity.passive);
  const title: Copy = [magic?.transformedTitle ?? `${signature.name[0]}・決め技`, `${signature.name[1]} Finale`];
  const limit = tech(`limit:${id}`, title, healing || defense ? 'party' : 'foes',
    healing ? { heal:16, cleanse:true, block:4 } : defense ? { block:15, reflect:4 } : { damage:20, pierce:true, ...(['code','recall'].includes(identity.passive) ? { draw:2 } : {}) },
    special?.[2] ?? (healing || defense ? 'light' : signature.element), 0);
  return { ...identity, id, name:[name, identity.en], origin, portrait:art, maxHp:Math.round((base?.maxHp ?? 74) * .5), signature, limit };
});

const ABYSS_STYLES = [
  ['swordsman','link','#b7b0db','long','star','light'], ['mage','precision','#a8d7eb','long','ribbon','ice'],
  ['archer','gale','#689863','braid','leaf','wind'], ['mage','ward','#463456','long','star','dark'],
  ['medic','bloom','#d3af72','wave','flower','light'], ['monk','heat','#9e4c31','spike','band','fire'],
  ['guardian','guard','#d7aa68','bob','crest','light'], ['swordsman','riposte','#544268','spike','scarf','dark'],
  ['archer','gale','#849963','bob','leaf','wind'],
] as const;
for(const [index,entry] of ABYSS_HEROES.entries()){
  const [job,passive,hairColor,hair,token,element]=ABYSS_STYLES[index];
  const profile=CHRONICLE_HEROES.find(h=>h.id===entry.id);
  const action=entry.card, support=['bloom','guard'].includes(passive);
  const signature=tech(`hero:${entry.id}`,[action.name,action.en],support?'ally':'foe',
    support?{heal:10,block:8}:{damage:Math.min(15,Math.round(action.power*4)),...(action.status?{weak:2}:{})},element);
  const limit=tech(`limit:${entry.id}`,[entry.transformedTitle,entry.skills[2].en],support?'party':'foes',
    support?{heal:15,cleanse:true,block:6}:{damage:21,pierce:true},element,0);
  HERO_LIST.push({id:entry.id,name:[entry.name,entry.en],en:entry.en,origin:'guest',color:entry.color,hairColor,hair,token,job,passive,
    maxHp:support?39:37,portrait:entry.portrait,signature,limit,
    voice:[profile?.open[0]??entry.role,profile?.open[1]??entry.englishRole],side:[profile?.resolve[0]??entry.role,profile?.resolve[1]??entry.englishRole]});
}
const OTHER_TRAVELERS = [
  ['aster','Aster','swordsman','link','#44596c','spike','crest','light','Star Lantern Blade','sprites/lantern-war/heroes/aster-ready.webp','First hear the people who have to walk the road.','橋の名板より先に、橋を使った人の名を聞いた。','I asked who crossed the bridge before reading its plaque.'],
  ['lyra','Lyra','swordsman','resolve','#d08d66','pony','star','light','Dawn’s Inheritance','sprites/lantern-war/heroes/lyra-ready.webp','I’ll choose a sword that keeps a way home open.','回収した星灯を、港で待っていた人に手渡した。','I handed the recovered lantern to the people waiting at the harbor.'],
  ['nagi','Nagi','archer','gale','#365c64','spike','scarf','wind','New Course','sprites/star-tide/hero-nagi-profile.webp','Even without stars, I can see the light of a friend alongside.','海図に風だけでなく、会った人の記録も残した。','I marked the people I met, as well as the winds, on my chart.'],
  ['mio','Mio','archer','bloom','#54764f','braid','leaf','wind','Echoing Arrows','sprites/star-tide/hero-mio.webp','We should pass on the names of trees to those who have forgotten.','案内板に、木が話す言葉も書き加えた。','I added the words that trees say to the signpost.'],
  ['sena','Sena','alchemist','spark','#7e5e56','bob','glasses','storm','Tomorrow’s Cog','sprites/star-tide/hero-sena.webp','Repair what can move into tomorrow.','動かなくなった時計を、小さなランプに作り替えた。','I turned a stopped clock into a little lamp.'],
  ['end-vesper','Vesper','guardian','riposte','#70576e','long','crest','dark','Fortress of Atonement','','This time, I’ll guard the right people.','先に門を開いて、帰る人を一人ずつ数えた。','I opened the gate first and counted each person returning.'],
  ['end-sable','Sable','archer','precision','#526351','spike','wrap','ice','Dawn Aim','','This sight is for those who need a way out.','矢を撃たずに守れた一日を、地図に記した。','I marked the day I protected people without loose arrows.'],
  ['end-hikari','Mirea','mage','code','#d69259','wave','star','light','Midsummer Lighthouse','','Waves can’t extinguish the light guiding us home.','消えかけた灯台に、海から小舟の灯りが答えた。','Small boat lanterns answered the flickering lighthouse.'],
  ['end-ren','Kai','medic','hearty','#508b96','bob','scarf','ice','Shelter of the Tide','','Let us keep a shore to return to, whichever sea we came from.','入江の岸に、知らない船もつなげる縄を増やした。','I added extra lines to the cove for boats we hadn’t met.'],
] as const;
for(const [id,en,job,passive,hairColor,hair,token,element,techEn,portrait,voice,jaSide,enSide] of OTHER_TRAVELERS){
  const original=LANTERN_HEROES.find(h=>h.id===id)!;
  const support=['bloom','hearty','riposte'].includes(passive);
  const signature=tech(`hero:${id}`,[original.skill,techEn],support?'ally':'foe',
    support?{heal:10,block:6}:{damage:10,draw:1},element);
  const limit=tech(`limit:${id}`,[`${original.skill}・極`,`${techEn} Finale`],support?'party':'foes',
    support?{heal:13,block:9}:{damage:21,expose:1},element,0);
  HERO_LIST.push({id,name:[original.name,en],en,origin:'guest',color:original.color,hairColor,hair,token,job,passive,portrait,
    signature,limit,maxHp:38,voice:[original.motto,voice],side:[jaSide,enSide]});
}
export const HEROES: Record<string, Hero> = Object.fromEntries(HERO_LIST.map(h => [h.id,h]));
export const CARD_LIST = [...COMMON, ...JOB_LIST.flatMap(j => [j.signature,j.mastery]), ...HERO_LIST.map(h => h.signature)];
export const CARDS: Record<string, Technique> = Object.fromEntries(CARD_LIST.map(c => [c.id,c]));
export function starterDeck(hero: Hero): DeckCard[] {
  const [attack, guard] = hero.origin === 'high-school' ? [SCHOOL_EDGE.id,SCHOOL_GUARD.id] : [STRIKE.id,GUARD.id];
  return [attack,attack,attack,guard,guard,guard,'opening','field-note','remedy',hero.signature.id].map(key => ({ key }));
}

export type EquipSlot = 'weapon' | 'offhand' | 'head' | 'body' | 'trinket';
export const SLOTS: Record<EquipSlot, Copy> = { weapon:['武器','Weapon'],offhand:['副装備','Off Hand'],head:['頭防具','Head'],body:['胴防具','Body'],trinket:['アクセサリー','Accessory'] };
export type Gear = { id: string; name: Copy; slot: EquipSlot; place: number; price: number; style?: Archetype; atk?: number; ward?: number; hp?: number; magic?: number; draw?: number; link?: number; energy?: number; element?: Element };
const MATERIALS: Copy[] = [['旅人の','Traveler’s'],['歯車銀の','Cogsilver'],['虹晶の','Prismatic'],['潮鏡の','Tideglass'],['飛雲の','Cloudspun'],['余白鋼の','Marginsteel'],['星砂の','Star-Sand']];
const WEAPONS: [Archetype,Copy][] = [
  ['edge',['剣','Blade']],['guard',['槍','Spear']],['heart',['光杖','Lightstaff']],['flow',['弓','Bow']],['arcana',['魔杖','Rod']],['craft',['手甲','Gauntlets']],
];
export const GEAR_LIST: Gear[] = MATERIALS.flatMap(([ja,en], place) => {
  const weapon = WEAPONS.map(([style,[n,e]], index):Gear => ({
    id:`weapon-${style}-${place}`, name:[ja+n,`${en} ${e}`], slot:'weapon', place, style,
    price:30+place*20, atk:1+place+(index<=1?1:0), magic:index>=4?1+place:0, element:place===2?'storm':place===3?'ice':place===4?'wind':undefined,
  }));
  return [...weapon,
    { id:`guard-${place}`, name:[ja+'盾',`${en} Shield`], slot:'offhand', place, price:26+place*18, ward:1+Math.floor(place/2) },
    { id:`hood-${place}`, name:[ja+'帽子',`${en} Cap`], slot:'head', place, price:24+place*15, hp:2+place, magic:Math.floor(place/3) },
    { id:`body-${place}`, name:[ja+'上着',`${en} Coat`], slot:'body', place, price:34+place*20, ward:1+Math.floor(place/3), hp:3+place*2 },
    { id:`charm-${place}`, name:[ja+'護符',`${en} Amulet`], slot:'trinket', place, price:48+place*20, draw:place===1||place===5?1:0, link:place>=3?1:0, energy:place===6?1:0 },
  ];
});
export const GEAR: Record<string,Gear> = Object.fromEntries(GEAR_LIST.map(g => [g.id,g]));
export const RELICS = {
  bookmark: { name:['旅人のしおり','Traveler’s Bookmark'], description:['味方の最初の手札＋1枚','Each ally draws one extra opening card'], place:0, price:68 },
  whistle: { name:['仲間の呼び笛','Companion Whistle'], description:['味方が使うカードの連携＋1','Earn an extra Link for each card played'], place:1, price:94 },
  hourglass: { name:['割れない砂時計','Unbroken Hourglass'], description:['味方の初手エナジー＋1','Each ally gains one opening energy'], place:2, price:125 },
  feather: { name:['帰り風の羽','Homewind Quill'], description:['毎ターンに味方全員がブロック3を得る','All allies gain 3 block each turn'], place:3, price:137 },
  moonstone: { name:['月鏡のかけら','Moon-Mirror Shard'], description:['回復が3増え、超過分をブロックに変える','Healing +3; excess becomes block'], place:4, price:158 },
  atlas: { name:['余白の星図','Atlas of Margins'], description:['受ける攻撃ダメージを2減らす','Reduces incoming attack damage by 2'], place:5, price:181 },
} satisfies Record<string,{ name:Copy; description:Copy; place:number; price:number }>;
export type RelicId = keyof typeof RELICS;
export const ITEMS = {
  tonic: {name:['旅の薬','Travel Tonic'], desc:['HPを24回復','Restores 24 HP'], price:18},
  salve: {name:['清めの軟膏','Cleansing Salve'], desc:['状態異常を消してHPを10回復','Removes ailments and restores 10 HP'], price:25},
  dew: {name:['夜明けの雫','Dawndew'], desc:['戦闘不能をHP半分で回復','Revives an ally at half HP'], price:40},
  oil: {name:['灯芯油','Wick Oil'], desc:['次の探索でエンカウントを避ける','Prevents encounters on the next stretch of road'], price:24},
} satisfies Record<string,{name:Copy;desc:Copy;price:number}>;
export type ItemId = keyof typeof ITEMS;
export type Combo = { id: string; name: Copy; origins?: WorldOfOrigin[]; jobs?: string[]; full?: boolean; tech: Technique };
function combo(id: string,name: Copy, target: Target, skill: Skill, element: Element, condition: Pick<Combo,'origins'|'jobs'|'full'>): Combo {
  return { id,name,...condition,tech:tech(id,name,target,skill,element,0) };
}
export const COMBOS = [
  combo('companions',['先輩と後輩の絆','A Bond Across Years'],'party',{ block:14,strength:2 },'light',{origins:['elementary','high-school']}),
  combo('courage',['勇気と魔法','Magic and Courage'],'foes',{ damage:16,weak:1 },'fire',{origins:['elementary','magic']}),
  combo('wisdom',['知略と魔術','Wit and Sorcery'],'foes',{ damage:15,expose:2 },'storm',{origins:['high-school','magic']}),
  combo('oath',['守護の誓い','Oath of Protection'],'party',{ block:15,heal:10 },'light',{jobs:['guardian','medic']}),
  combo('timespell',['時空魔法連鎖','Spacetime Chain'],'foes',{ damage:17,nextEnergy:1 },'ice',{jobs:['mage','chronist']}),
  combo('crossfire',['クロスアタック','Cross Attack'],'foe',{ damage:16,repeats:2,pierce:true },'wind',{jobs:['swordsman','archer']}),
  combo('all',['知識の共鳴','Resonance of Knowledge'],'foes',{ damage:25,cleanse:true },'light',{full:true}),
];
