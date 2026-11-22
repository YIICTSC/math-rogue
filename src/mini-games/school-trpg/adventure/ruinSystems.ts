import { type Biome, type Good, type Stat, type Text } from './content';
import { FACTIONS, alliesWith, changeStanding } from './factions';
import { ARCHIVE_CHOICES, CIRCUIT_MODES, type ArchiveChoice, type CircuitMode } from './fieldworkState';
import { advance, awardExperience, awardInspiration, note, rollCheck, spendGoods, succeeded, type Adventure } from './state';
import { DIRECTIONS, ENTRY_CELL, SIDE, addressKey, floorKey, generateFloor, hash, neighbor, townAt, type Address, type Floor } from './world';

type Effects = Partial<Record<'light' | 'patrol' | 'checks' | 'shards', number>>;
type Mechanism = {
  name: Text;
  good: Good;
  stat: Stat;
  channel: { name: Text; effects: Effects };
  isolate: { name: Text; effects: Effects };
};

export const MECHANISMS = {
  academy: {
    name: ['鳴鐘リレー', 'Belfry relay', 'めいしょう リレー'], good: 'ore', stat: 'insight',
    channel: { name: ['回廊の灯りへつなぐ', 'Power the corridor lamps', 'かいろうの あかりに つなぐ'], effects: { light: -1, patrol: 1 } },
    isolate: { name: ['鐘を止める', 'Silence the bells', 'かねを とめる'], effects: { patrol: -1, checks: -1 } },
  },
  grove: {
    name: ['根脈の送水機', 'Rootwater pump', 'こんみゃくの そうすいき'], good: 'timber', stat: 'finesse',
    channel: { name: ['乾いた根に送水', 'Water the dry roots', 'かわいた ねに みずを おくる'], effects: { checks: -2, patrol: 1 } },
    isolate: { name: ['根脈から水を抜く', 'Drain the root channels', 'ねの みずを ぬく'], effects: { patrol: -1, checks: 1 } },
  },
  coast: {
    name: ['干満の水門', 'Tidal sluice', 'かんまんの すいもん'], good: 'ore', stat: 'might',
    channel: { name: ['潮を水路へ逃がす', 'Divert the tide into the canal', 'しおを すいろへ にがす'], effects: { shards: 2, light: 1 } },
    isolate: { name: ['潮溜まりを締め切る', 'Seal the tide pools', 'しおだまりを しめきる'], effects: { light: -1, shards: -1 } },
  },
  alpine: {
    name: ['霜鏡の反射器', 'Frostmirror reflector', 'しもかがみの はんしゃき'], good: 'thread', stat: 'insight',
    channel: { name: ['反射光を通路へ通す', 'Send reflected light down the passages', 'ひかりを つうろへ とおす'], effects: { light: -1, checks: 1 } },
    isolate: { name: ['鏡を伏せて影を消す', 'Turn down the mirrors', 'かがみを ふせる'], effects: { checks: -2, light: 1 } },
  },
  ember: {
    name: ['余熱のるつぼ', 'Ember crucible', 'よねつの るつぼ'], good: 'ore', stat: 'might',
    channel: { name: ['余熱で閉じた扉を動かす', 'Use stored heat to open the passage', 'よねつで とびらを うごかす'], effects: { shards: 2, patrol: 1 } },
    isolate: { name: ['炉を冷まして騒音を止める', 'Cool the furnace and quiet the halls', 'ろを さまして しずかに する'], effects: { patrol: -1, light: 1 } },
  },
  sky: {
    name: ['星脈の集光器', 'Astral lens', 'せいみゃくの しゅうこうき'], good: 'lantern', stat: 'insight',
    channel: { name: ['星の光を遺跡の奥へ送る', 'Project starlight into the ruins', 'ほしの ひかりを おくへ おくる'], effects: { light: -1, shards: 1, patrol: 1 } },
    isolate: { name: ['遮光板を下ろす', 'Lower the blackout shutters', 'しゃこうばんを おろす'], effects: { patrol: -1, checks: -1, light: 1 } },
  },
} satisfies Record<Biome, Mechanism>;

const CHAPTERS = {
  academy: [
    ['最初の鐘は授業のためではなく、増水を知らせるために造られた。', 'The first bell warned of floods long before it announced classes.'],
    ['水路番と先生は、鐘を聞けない谷間に別の合図を設けることにした。', 'Teachers and waterkeepers agreed to find a different signal for valleys that could not hear the bell.'],
    ['最後の扉の裏に、谷の家々へ遠くから光を返した鏡の設計が残されている。', 'Plans behind the last door show the mirrors that sent the signal to each home.'],
  ],
  grove: [
    ['最初の畑は、人の家より先に巨木の下に作られた。', 'The first garden beneath the ancient tree predates every house.'],
    ['干ばつの年、種守は一番丈夫な種をしまわず、峠の向こうにも配った。', 'In a year of drought the seedkeepers shared their hardiest seeds across the pass.'],
    ['地下に張った根の間に、種を受け取った家の名札がそっと埋められている。', 'Name tags lie between the underground roots, left by the families who received the seeds.'],
  ],
  coast: [
    ['干潮でしか橋を渡れなかった頃、船守は月を潮の暦に描いた。', 'When the bridge could only be crossed at low tide, ferry crews painted the moon on their tide calendar.'],
    ['風読みの旅人が、旗の振り方を渡し衆に教えた。遠くの船からも港が見えるようになった。', 'A wind-reader taught the ferrymen how to signal with flags. Ships could find the harbor from farther away.'],
    ['最後の板には、嵐の日に旗を持って港から船を見送った全員の名がある。', 'The last board names everyone who stood in a storm to signal the departing boats.'],
  ],
  alpine: [
    ['峠の仲間は吹雪の音に負けないよう、石に向きを刻んだ。', 'Pass guides carved directions into rock where the blizzard drowned out voices.'],
    ['道を広げるほど雪が入り込んだため、逆に折り曲げて風を受け流す設計が生まれた。', 'Widening the paths let in more snow, so the builders devised bends to turn the winds.'],
    ['鏡に最後の火を映せば、峠の両側から同じ家に辿りつけたという。', 'By reflecting the last light in a mirror, both sides of the pass could find the same refuge.'],
  ],
  ember: [
    ['炉を造った工匠は、鍛造より先に湯を沸かす管をつないだ。', 'The smith who built the furnace connected hot water pipes before making tools.'],
    ['火を閉じると周囲の家の湯も止まる。町は昼と夜で炉の用途を入れ替えた。', 'Shutting the furnace left nearby homes cold, so the town used the same heat for different work at night.'],
    ['最後の記録に、誰でも直せるよう部品の寸法が一つ残らず書かれていた。', 'The last record lists every part’s dimensions so anyone could repair it.'],
  ],
  sky: [
    ['空の島々を渡る人は、星座よりも揺れる星明かりを頼りにした。', 'Travelers between the sky islands navigated by flickers of starlight.'],
    ['灯りが多いほど星が見えなくなり、観測団は一つだけ窓に灯を残すことにした。', 'Too many lanterns hid the stars. The observatory agreed to leave just one lamp in the window.'],
    ['最後の星図は空を描かず、行方の知れない舟が帰る方角だけを示していた。', 'The last chart drew no sky. It marked only the way home for missing boats.'],
  ],
} satisfies Record<Biome, readonly Text[]>;

const CHAPTER_TYPES: Text[] = [
  ['はじまり', 'Origins', 'はじまり'],
  ['町の選択', 'The town’s choice', 'まちの せんたく'],
  ['残されたもの', 'What remained', 'のこされた もの'],
];
const CHRONICLE_TITLES: Text[] = [
  ['忘れられた工房の記録', 'Record of the forgotten workshop', 'わすれられた こうぼうの きろく'],
  ['窓辺に残る碑文', 'Inscription by the window', 'まどべに のこる ひぶん'],
  ['旅人が託した石板', 'Tablets entrusted by travelers', 'たびびとが たくした せきばん'],
  ['締めない帳面', 'The ledger left open', 'しめない ちょうめん'],
];

export const historyTitle = (place: Address) => CHRONICLE_TITLES[hash(addressKey(place) + '/chronicle') % CHRONICLE_TITLES.length];
export const historyParts = (place: Address) => CHAPTERS[townAt(place).biome].map((copy, i) => ({ title: CHAPTER_TYPES[i], copy, bit: 1 << i }));

type Layout = { device: number; inscription: number; shortcut: number };
const cache = new Map<string, Layout>();

function distance(open: Set<number>, from: number, to: number) {
  const queue = [from];
  const visited = new Map([[from, 0]]);
  for (const cell of queue) {
    if (cell === to) return visited.get(cell)!;
    for (let direction = 0; direction < DIRECTIONS.length; direction++) {
      const next = neighbor(cell, direction);
      if (!open.has(next) || visited.has(next)) continue;
      visited.set(next, visited.get(cell)! + 1);
      queue.push(next);
    }
  }
  return 0;
}

export function ruinLayout(place: Address, depth: number, floor = generateFloor(place, depth)): Layout {
  const key = floorKey(place, depth);
  const found = cache.get(key);
  if (found) return found;
  const empty = [...floor.open].filter((cell) => cell !== ENTRY_CELL && !floor.features[cell]);
  empty.sort((a, b) => hash(key + '/fixture/' + a) - hash(key + '/fixture/' + b));
  let shortcut = -1;
  let savedMoves = 2;
  for (let cell = 0; cell < SIDE * SIDE; cell++) {
    if (floor.open.has(cell)) continue;
    for (const axis of [0, 1]) {
      const before = neighbor(cell, axis);
      const after = neighbor(cell, axis + 2);
      if (!floor.open.has(before) || !floor.open.has(after)) continue;
      const saving = distance(floor.open, before, after) - 2;
      if (saving > savedMoves) { shortcut = cell; savedMoves = saving; }
    }
  }
  const layout = { device: empty[0], inscription: empty[1], shortcut };
  if (cache.size >= 128) cache.delete(cache.keys().next().value!);
  cache.set(key, layout);
  return layout;
}

export const circuitAt = (s: Adventure) => s.delve ? s.fieldwork.circuits[floorKey(s.location, s.delve.floor)] : undefined;
export function circuitEffects(s: Adventure): Effects {
  const mode = circuitAt(s)?.mode;
  return mode ? MECHANISMS[townAt(s.location).biome][mode].effects : {};
}

export function ruinFloor(place: Address, depth: number, mode: CircuitMode | null | undefined): Floor {
  const floor = generateFloor(place, depth);
  if (mode === 'channel') {
    const { shortcut } = ruinLayout(place, depth, floor);
    if (shortcut >= 0) floor.open.add(shortcut);
  }
  return floor;
}

export type CircuitMethod = 'materials' | 'history' | 'alliance' | 'check';
export type RuinAction =
  | { type: 'read-inscription' | 'inspect-circuit' }
  | { type: 'set-circuit'; mode: CircuitMode; method: CircuitMethod }
  | { type: 'file-history'; key: string; choice: ArchiveChoice };

export function canSetCircuit(s: Adventure, method: CircuitMethod) {
  const biome = townAt(s.location).biome;
  if (circuitAt(s)?.mode) return true;
  if (method === 'history') return Boolean(s.fieldwork.histories[addressKey(s.location)]);
  if (method === 'materials') return s.goods[MECHANISMS[biome].good] > 0;
  return method === 'alliance' ? alliesWith(s, biome) : method === 'check';
}

export const localHistoryChapter = (depth: number) => (depth - 1) % CHAPTER_TYPES.length;

export function applyRuinAction(s: Adventure, action: Exclude<RuinAction, { type: 'file-history' }>) {
  const d = s.delve;
  if (!d || d.encounter) return false;
  const layout = ruinLayout(s.location, d.floor);
  const biome = townAt(s.location).biome;
  if (action.type === 'read-inscription') {
    if (d.cell !== layout.inscription) return false;
    const key = addressKey(s.location);
    const entry = s.fieldwork.histories[key] ??= { place: { ...s.location }, chapters: 0 };
    const part = historyParts(s.location)[localHistoryChapter(d.floor)];
    if (entry.chapters & part.bit) return false;
    entry.chapters |= part.bit;
    awardExperience(s, 5);
    if (entry.chapters === 7) awardInspiration(s);
    note(s, part.copy, 'story');
    return true;
  }
  if (d.cell !== layout.device) return false;
  const key = floorKey(s.location, d.floor);
  const record = circuitAt(s);
  if (action.type === 'inspect-circuit') {
    if (record) return false;
    s.fieldwork.circuits[key] = { mode: null };
    note(s, ['仕掛けのつながりを見取図に記した。', 'You sketch the mechanism and its connections.']);
    return true;
  }
  if (action.type !== 'set-circuit' || !CIRCUIT_MODES.includes(action.mode) || !record ||
    action.mode === record.mode || !canSetCircuit(s, action.method)) return false;
  const device = MECHANISMS[biome];
  if (!record.mode) {
    if (action.method === 'materials' && !spendGoods(s, { [device.good]: 1 })) return false;
    if (action.method === 'check') {
      const result = rollCheck(s, device.stat, 12 + Math.min(6, Math.floor(Math.sqrt(d.floor - 1))));
      if (!succeeded(result)) {
        d.light = Math.max(0, d.light - 2);
        advance(s, 1);
        note(s, ['歯車を合わせ損ねた。灯りを消費したが、仕掛けは再度試せる。', 'The gears slipped. You use up some light and can try again.'], 'risk', result);
        return true;
      }
      note(s, ['工具なしで仕掛けを動かすことができた。', 'You operate the mechanism without tools.'], 'good', result);
    }
    awardExperience(s, 6);
  }
  record.mode = action.mode;
  advance(s, 1);
  if (layout.shortcut >= 0) {
    if (action.mode === 'channel') {
      const floorRecord = s.floors[key];
      if (floorRecord && !floorRecord.seen.includes(layout.shortcut)) floorRecord.seen.push(layout.shortcut);
      note(s, ['見取図に新しい抜け道が現れた。', 'A new shortcut appears on your map.'], 'good');
    } else note(s, ['仕掛けにつながる抜け道を閉じた。', 'You close the shortcut connected to the mechanism.']);
  } else note(s, device[action.mode].name, 'good');
  return true;
}

export function fileHistory(s: Adventure, key: string, choice: ArchiveChoice) {
  if (s.delve || !Object.hasOwn(s.fieldwork.histories, key) || !ARCHIVE_CHOICES.includes(choice)) return false;
  const history = s.fieldwork.histories[key];
  if (history.chapters !== 7 || history.filed) return false;
  history.filed = choice;
  if (choice === 'publish') {
    changeStanding(s, 'academy', 3);
    awardExperience(s, 28);
    note(s, ['三つの記録を綴じ、鐘楼記録院の閲覧棚に預けた。', 'You bind the three accounts and put them on the archive’s reading shelf.'], 'good');
  } else {
    const group = townAt(history.place).biome;
    changeStanding(s, group, 3);
    changeStanding(s, FACTIONS[group].rival, -1);
    s.goods.relic += 3;
    note(s, ['土地の人に記録を返した。お礼に遺物片を受け取った。', 'You return the record to its custodians and receive relic shards in thanks.'], 'good');
  }
  return true;
}
