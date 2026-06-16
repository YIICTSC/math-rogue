import { MAGIC_HEROES } from './magicHeroes';
import { ROMANCE_TARGETS } from './romanceTargets';

export type MagicEventLocation =
  | 'CLASS'
  | 'COURTYARD'
  | 'COUNCIL'
  | 'ROOFTOP'
  | 'LIBRARY'
  | 'DORM'
  | 'HOLIDAY';

export interface MagicEventChoice {
  label: string;
  result: string;
  studyCorrect?: number;
  studyTotal?: number;
  friendship?: number;
  affection?: number;
  teamBond?: number;
}

export interface MagicScenarioEvent {
  id: string;
  category: 'SCHOOL' | 'FRIENDSHIP' | 'ROMANCE' | 'SEASON' | 'CAREER';
  location: MagicEventLocation;
  chapter: number;
  title: string;
  body: string;
  characterId?: string;
  choices: MagicEventChoice[];
}

const schoolSeeds = [
  ['CLASS', '魔法史の小テスト', '禁術の歴史を扱う抜き打ちテストが始まった。'],
  ['CLASS', '実技補習', '魔法陣の線がどうしても閉じず、放課後の補習が決まった。'],
  ['CLASS', '共同研究', '二人一組で属性魔法の相性を調べる課題が出された。'],
  ['LIBRARY', '禁書のささやき', '封印棚の奥から、自分の名前を呼ぶ声が聞こえる。'],
  ['LIBRARY', '閉館後の灯り', '誰もいないはずの閲覧席に魔法灯が一つ残っている。'],
  ['COURTYARD', '精霊樹の落とし物', '精霊樹の根元で、見覚えのない星形の鍵を拾った。'],
  ['COURTYARD', '昼休みの相談', '仲間が進路希望調査票を手に、ため息をついている。'],
  ['ROOFTOP', '風に飛んだノート', '大切な研究ノートが屋上の風にさらわれた。'],
  ['COUNCIL', '生徒会からの依頼', '校内の魔力異常を調査してほしいと頼まれた。'],
] as const;

const schoolEvents: MagicScenarioEvent[] = Array.from({ length: 54 }, (_, index) => {
  const seed = schoolSeeds[index % schoolSeeds.length];
  const chapter = Math.floor(index / schoolSeeds.length) + 1;
  return {
    id: `SCHOOL_${String(index + 1).padStart(3, '0')}`,
    category: 'SCHOOL',
    location: seed[0],
    chapter,
    title: `${seed[1]} ${chapter}`,
    body: `${seed[2]} 第${chapter}章で得た経験をどう生かすかが問われている。`,
    choices: [
      { label: '落ち着いて考える', result: '学んだ内容を整理し、確実な一歩を選んだ。', studyCorrect: 1, studyTotal: 1, teamBond: 1 },
      { label: '仲間に相談する', result: '一人で抱えず、チームで答えを見つけた。', studyTotal: 1, friendship: 3, teamBond: 2 },
    ],
  };
});

const friendshipMoments = [
  ['放課後の約束', '互いに苦手なことを一つずつ教え合う。'],
  ['秘密の相談', '誰にも話せなかった不安を打ち明けられる。'],
  ['共闘訓練', '背中を預けるための連携を練習する。'],
] as const;

const friendshipEvents: MagicScenarioEvent[] = MAGIC_HEROES.flatMap((hero) =>
  friendshipMoments.map(([title, body], index) => ({
    id: `FRIEND_${hero.id}_${index + 1}`,
    category: 'FRIENDSHIP',
    location: index === 0 ? 'COURTYARD' : index === 1 ? 'DORM' : 'ROOFTOP',
    chapter: index * 2 + 1,
    title: `${hero.name}・${title}`,
    body: `${hero.name}と${body}`,
    characterId: hero.id,
    choices: [
      { label: '最後まで話を聞く', result: `${hero.name}は安心したように笑った。`, friendship: 6, teamBond: 2 },
      { label: '自分の経験を話す', result: '互いの弱さを知り、距離が縮まった。', friendship: 5, studyCorrect: 1, studyTotal: 1 },
    ],
  })),
);

const romanceMoments = [
  ['最初の会話', '偶然二人きりになり、思いがけない一面を知る。'],
  ['勉強の誘い', '次の試験へ向けて一緒に勉強しようと誘われる。'],
  ['休日の約束', '学園の外で会う約束を交わす。'],
  ['守りたい理由', '戦う理由と、大切にしたい未来を語り合う。'],
  ['告白の予感', '言葉にできない想いが、沈黙の中で伝わってくる。'],
  ['卒業後の夢', '卒業後も隣にいたいと、未来の話を始める。'],
] as const;

const romanceEvents: MagicScenarioEvent[] = ROMANCE_TARGETS.flatMap((target) =>
  romanceMoments.map(([title, body], index) => ({
    id: `STORY_ROMANCE_${target.id}_${index + 1}`,
    category: 'ROMANCE',
    location: index < 2 ? 'COUNCIL' : index < 4 ? 'ROOFTOP' : 'HOLIDAY',
    chapter: Math.min(8, index + 1),
    title: `${target.name}・${title}`,
    body: `${target.role}の${target.name}と${body}`,
    characterId: target.id,
    choices: [
      { label: '素直な気持ちを伝える', result: `${target.name}はまっすぐに言葉を受け止めた。`, affection: 6, teamBond: 1 },
      { label: 'まず使命を優先する', result: '今できることを確認し、信頼を深めた。', affection: 3, studyCorrect: 1, studyTotal: 1 },
    ],
  })),
);

const seasonalSeeds = [
  ['HOLIDAY', '夏祭りの待ち合わせ', '浴衣姿の仲間たちが神社の鳥居で待っている。'],
  ['COURTYARD', '文化祭前夜', '舞台と模擬店の準備が終わらず、校内に明かりが残る。'],
  ['DORM', 'クリスマス交換会', '寮の暖炉の前に、名前のない小さな贈り物が置かれている。'],
  ['DORM', 'バレンタイン作戦', '九人分のチョコレート作りで台所が戦場になった。'],
  ['CLASS', '進路希望調査', '卒業後に魔法少女を続けるか、答えを書く時が来た。'],
  ['ROOFTOP', '卒業式の前日', '最後の夕焼けを見ながら、三年間を振り返る。'],
] as const;

const seasonalEvents: MagicScenarioEvent[] = Array.from({ length: 18 }, (_, index) => {
  const seed = seasonalSeeds[index % seasonalSeeds.length];
  const loop = Math.floor(index / seasonalSeeds.length) + 1;
  return {
    id: `SEASON_${String(index + 1).padStart(3, '0')}`,
    category: seed[1].includes('進路') || seed[1].includes('卒業') ? 'CAREER' : 'SEASON',
    location: seed[0],
    chapter: Math.min(8, loop * 3),
    title: `${seed[1]} ${loop}`,
    body: seed[2],
    choices: [
      { label: 'みんなとの時間を大切にする', result: '何気ない時間が大切な思い出になった。', friendship: 3, teamBond: 3 },
      { label: '将来について話す', result: '自分の望む未来が少しだけ明確になった。', studyCorrect: 1, studyTotal: 1, affection: 2 },
    ],
  };
});

export const MAGIC_SCENARIO_EVENTS: MagicScenarioEvent[] = [
  ...schoolEvents,
  ...friendshipEvents,
  ...romanceEvents,
  ...seasonalEvents,
];

