import type { LanguageMode } from '../../types';

export type Phrase = readonly [japanese: string, english: string, reading: string];
export const localize = (text: Phrase, language: LanguageMode) =>
  text[language === 'ENGLISH' ? 1 : language === 'HIRAGANA' ? 2 : 0];
export type Aircraft = 'parachute' | 'glider' | 'jetpack' | 'plane';
export type Training = 'practice' | 'exam';
export interface Point {
  x: number;
  z: number;
}
export interface Position extends Point {
  y: number;
}
export interface Airport {
  code: string;
  name: Phrase;
  landscape: Phrase;
  region: 'snow' | 'coast' | 'bay' | 'alps' | 'port' | 'island' | 'volcano' | 'reef';
  sky: number;
  grass: number;
  sea: number;
  wind: Point;
  bend: number;
  runway: number;
}

// Airport names and IATA codes identify the stops. Flight paths and airfields are original arcade courses.
export const AIRPORTS: readonly Airport[] = [
  {
    code: 'CTS',
    name: ['新千歳', 'New Chitose', 'しんちとせ'],
    landscape: ['雪原と白樺の森', 'Snowfields and birch woods', 'せつげんと しらかばの もり'],
    region: 'snow',
    sky: 0x81bedb,
    grass: 0xcadcd6,
    sea: 0x438fa8,
    wind: { x: 0.8, z: 0.2 },
    bend: 0,
    runway: 1,
  },
  {
    code: 'SDJ',
    name: ['仙台', 'Sendai', 'せんだい'],
    landscape: [
      '松林と太平洋の浜辺',
      'Pacific beaches and pine groves',
      'まつばやしと たいへいようの はまべ',
    ],
    region: 'coast',
    sky: 0x7bbbd6,
    grass: 0x8eb96b,
    sea: 0x328caa,
    wind: { x: -1.3, z: -0.4 },
    bend: -0.55,
    runway: 9,
  },
  {
    code: 'HND',
    name: ['羽田', 'Haneda', 'はねだ'],
    landscape: [
      '東京湾の橋とビル群',
      'Bridges and the Tokyo Bay skyline',
      'とうきょうわんの はしと ビルぐん',
    ],
    region: 'bay',
    sky: 0xe3b89e,
    grass: 0x9fae80,
    sea: 0x528ba4,
    wind: { x: 1.8, z: 0.45 },
    bend: 0.75,
    runway: 34,
  },
  {
    code: 'MMJ',
    name: ['松本', 'Matsumoto', 'まつもと'],
    landscape: [
      'アルプスに囲まれた盆地',
      'An alpine valley surrounded by peaks',
      'アルプスに かこまれた ぼんち',
    ],
    region: 'alps',
    sky: 0x87b8e5,
    grass: 0x87b785,
    sea: 0x549ead,
    wind: { x: -1.4, z: 0.65 },
    bend: -1,
    runway: 18,
  },
  {
    code: 'NGO',
    name: ['中部国際', 'Chubu Centrair', 'ちゅうぶこくさい'],
    landscape: [
      '伊勢湾の港と海上空港',
      'A harbor airfield on Ise Bay',
      'いせわんの みなとと かいじょうくうこう',
    ],
    region: 'port',
    sky: 0x8bc7d9,
    grass: 0x9bb789,
    sea: 0x3a9cab,
    wind: { x: 1.65, z: -0.6 },
    bend: 0.45,
    runway: 36,
  },
  {
    code: 'KIX',
    name: ['関西国際', 'Kansai International', 'かんさいこくさい'],
    landscape: [
      '大阪湾に延びる連絡橋',
      'Island runways and an Osaka Bay causeway',
      'おおさかわんに のびる れんらくきょう',
    ],
    region: 'island',
    sky: 0xa5a9cf,
    grass: 0x9bad86,
    sea: 0x547caa,
    wind: { x: -1.95, z: 0.55 },
    bend: -0.8,
    runway: 24,
  },
  {
    code: 'KOJ',
    name: ['鹿児島', 'Kagoshima', 'かごしま'],
    landscape: [
      '桜島を望む台地と茶畑',
      'Tea fields beneath a volcanic skyline',
      'さくらじまを のぞむ だいちと ちゃばたけ',
    ],
    region: 'volcano',
    sky: 0xf2bf9c,
    grass: 0x91b06c,
    sea: 0x4d9aa6,
    wind: { x: 1.4, z: 0.8 },
    bend: 1,
    runway: 34,
  },
  {
    code: 'OKA',
    name: ['那覇', 'Naha', 'なは'],
    landscape: [
      '珊瑚礁とエメラルドの海',
      'An emerald lagoon and coral reefs',
      'さんごしょうと エメラルドの うみ',
    ],
    region: 'reef',
    sky: 0x70d6e2,
    grass: 0x9ac979,
    sea: 0x28b6b9,
    wind: { x: -1.7, z: -0.9 },
    bend: -0.35,
    runway: 36,
  },
];

interface Discipline {
  id: Aircraft;
  name: Phrase;
  assignment: Phrase;
  controls: Phrase;
  primary: Phrase;
  secondary: Phrase;
}

export const DISCIPLINES: readonly Discipline[] = [
  {
    id: 'parachute',
    name: ['パラシュート', 'Parachute', 'パラシュート'],
    assignment: [
      '空中から飛び降り、布を開いて着地円の中心へ。',
      'Open your canopy and land on the bullseye.',
      'そらから とびおり、ぬのを ひらいて ちゃくちえんの まんなかへ。',
    ],
    controls: [
      '左右で旋回。開傘後は↑で前進、↓やブレーキで落ちる位置を調整。',
      'Steer left or right. After opening, push up to travel or brake to shorten the glide.',
      'さゆうで せんかい。ぬのを ひらいたら ↑で ぜんしん、↓や ブレーキで おちる いちを ちょうせい。',
    ],
    primary: ['開傘', 'Open canopy', 'かいさん'],
    secondary: ['ブレーキ', 'Brake', 'ブレーキ'],
  },
  {
    id: 'glider',
    name: ['ハンググライダー', 'Hang glider', 'ハンググライダー'],
    assignment: [
      '金色の上昇気流で高度を稼ぎ、リングを抜けて草地へ。',
      'Catch the golden thermal, fly through the rings and land in the meadow.',
      'きんいろの じょうしょうきりゅうで たかさを かせぎ、リングを ぬけて くさちへ。',
    ],
    controls: [
      '左右で旋回。↑で機首上げ、↓で降下。着地直前にフレア。',
      'Bank to turn. Pitch up to trade speed for height, down to descend. Flare just before landing.',
      'さゆうで せんかい。↑で きしゅあげ、↓で こうか。ちゃくちの まえに フレア。',
    ],
    primary: ['加速', 'Speed bar', 'かそく'],
    secondary: ['フレア', 'Flare', 'フレア'],
  },
  {
    id: 'jetpack',
    name: ['ロケットベルト', 'Rocket belt', 'ロケットベルト'],
    assignment: [
      '噴射で浮かび、空中の輪で静止してヘリポートへ。',
      'Rise on the jets, hover inside each hoop and settle on the helipad.',
      'ふんしゃで うかび、そらの わで せいしして ヘリポートへ。',
    ],
    controls: [
      '噴射で上昇。↑↓で前後、左右で旋回。ホバーでその場に静止。',
      'Hold thrust to rise. Move forward or back, steer to turn, and hold hover to stop.',
      'ふんしゃで じょうしょう。↑↓で ぜんご、さゆうで せんかい。ホバーで せいし。',
    ],
    primary: ['噴射', 'Thrust', 'ふんしゃ'],
    secondary: ['ホバー', 'Hover', 'ホバー'],
  },
  {
    id: 'plane',
    name: ['軽飛行機', 'Light plane', 'けいひこうき'],
    assignment: [
      '離陸して空港を一周し、滑走路に戻って着陸。',
      'Take off, fly the traffic circuit and land back on the runway.',
      'りりくして くうこうを いっしゅうし、かっそうろに もどって ちゃくりく。',
    ],
    controls: [
      '加速して75 km/hで↑を押し離陸。左右で旋回、↓で降下。着地前に減速。',
      'Hold power and pitch up at 75 km/h to lift off. Bank to turn, pitch down to descend and slow for landing.',
      'かそくして 75 km/hで ↑を おし りりく。さゆうで せんかい、↓で こうか。ちゃくちまえに げんそく。',
    ],
    primary: ['加速', 'Power', 'かそく'],
    secondary: ['減速', 'Slow', 'げんそく'],
  },
];

export interface Gate extends Position {
  radius: number;
}
export interface Lesson {
  airport: Airport;
  aircraft: Aircraft;
  mode: Training;
  start: Position;
  target: Point;
  gates: Gate[];
  thermal: Point;
}
export const RUNWAY = { halfWidth: 32, halfLength: 310 };
export function makeLesson(airport: Airport, aircraft: Aircraft, mode: Training): Lesson {
  const turn = airport.bend < 0 ? -1 : 1;
  const offset = airport.bend * 32;
  const target = aircraft === 'plane' ? { x: 0, z: 100 } : { x: -91, z: -32 + offset };
  const thermal = { x: target.x + 46 * turn, z: 196 + offset };
  const gate = (x: number, y: number, z: number, radius: number): Gate => ({
    x,
    y,
    z,
    radius: radius * (mode === 'practice' ? 1.2 : 1),
  });
  let start: Position, gates: Gate[];
  switch (aircraft) {
    case 'parachute':
      start = { x: target.x - offset * 0.55, y: 178, z: 285 + offset };
      gates = [
        gate(target.x, 77, 165 + offset, 35),
        gate(target.x + offset * 0.22, 32, 56 + offset, 27),
      ];
      break;
    case 'glider':
      start = { x: target.x + 24 * turn, y: 47, z: 389 + offset };
      gates = [
        gate(thermal.x, 43, thermal.z, 31),
        gate(target.x - offset * 0.4, 31, 67 + offset, 28),
      ];
      break;
    case 'jetpack':
      start = { x: target.x + offset * 0.5, y: 0, z: 140 + offset };
      gates = [
        gate(start.x + 14 * turn, 24, 97 + offset, 13),
        gate(target.x - 20 * turn, 34, 42 + offset, 13),
        gate(target.x, 16, -1 + offset, 14),
      ];
      break;
    case 'plane':
      start = { x: 0, y: 0, z: 258 };
      gates = [
        gate(0, 46, -140, 52),
        gate(turn * (153 + Math.abs(offset)), 83, -375, 62),
        gate(turn * 308, 75, -60 + offset, 62),
        gate(turn * 224, 67, 414 + offset, 61),
        gate(0, 49, 504, 50),
        gate(0, 28, 270, 40),
      ];
      break;
  }
  return { airport, aircraft, mode, start, target, gates, thermal };
}
