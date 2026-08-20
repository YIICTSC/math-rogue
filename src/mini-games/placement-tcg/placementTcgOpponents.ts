import type React from 'react';
import { assetUrl } from '../../utils/assetPaths';

export interface PlacementTcgOpponent {
  id: string;
  name: string;
  index: number;
  isEndless: boolean;
}

const REGULAR_RIVALS: PlacementTcgOpponent[] = [
  { id: 'rival_lucky_nanami', name: 'ラッキー七海', index: 0, isEndless: false },
  { id: 'rival_math_bancho', name: '計算番長', index: 1, isEndless: false },
  { id: 'rival_stationery_leo', name: '文具王レオ', index: 2, isEndless: false },
  { id: 'rival_lunch_misuzu', name: '給食マスター美鈴', index: 3, isEndless: false },
  { id: 'rival_iron_hayato', name: '鉄壁ハヤト', index: 4, isEndless: false },
  { id: 'rival_music_sora', name: '音楽室のソラ', index: 5, isEndless: false },
  { id: 'rival_science_rika', name: '理科室リカ', index: 6, isEndless: false },
  { id: 'rival_library_ren', name: '図書委員レン', index: 7, isEndless: false },
  { id: 'rival_discipline_ayame', name: '風紀のアヤメ', index: 8, isEndless: false },
  { id: 'rival_art_momo', name: '美術部モモ', index: 9, isEndless: false },
  { id: 'rival_track_kakeru', name: '陸上カケル', index: 10, isEndless: false },
  { id: 'rival_occult_kurosaki', name: 'オカルト黒崎', index: 11, isEndless: false },
  { id: 'rival_president_karen', name: '生徒会長カレン', index: 12, isEndless: false },
  { id: 'rival_baseball_takumi', name: '野球部タクミ', index: 13, isEndless: false },
  { id: 'rival_twins_minato', name: '双子のミナト', index: 14, isEndless: false },
  { id: 'rival_tea_yui', name: '茶道のユイ', index: 15, isEndless: false },
  { id: 'rival_alien_aru', name: '宇宙転校生アル', index: 16, isEndless: false },
  { id: 'rival_principal_shion', name: '校長の孫シオン', index: 17, isEndless: false },
  { id: 'rival_galaxy_mio', name: '銀河ノートのミオ', index: 18, isEndless: false },
  { id: 'rival_shop_goro', name: '購買部ゴロー', index: 19, isEndless: false },
  { id: 'rival_maze_rin', name: '迷路名人リン', index: 20, isEndless: false },
  { id: 'rival_raffle_hina', name: '福引きヒナ', index: 21, isEndless: false },
  { id: 'rival_hidden_jin', name: '裏番長ジン', index: 22, isEndless: false },
  { id: 'rival_graduate_akira', name: '卒業王アキラ', index: 23, isEndless: false },
];

const ENDLESS_RIVALS: PlacementTcgOpponent[] = [
  { id: 'endless_rival_principal_genda', name: '校長ゲンダ', index: 0, isEndless: true },
  { id: 'endless_rival_nurse_makino', name: '保健室マキノ', index: 1, isEndless: true },
  { id: 'endless_rival_caretaker_iwata', name: '用務員イワタ', index: 2, isEndless: true },
  { id: 'endless_rival_librarian_sumire', name: '図書館司書スミレ', index: 3, isEndless: true },
  { id: 'endless_rival_cafeteria_tome', name: '給食長トメ', index: 4, isEndless: true },
  { id: 'endless_rival_coach_goro', name: '体育教師ゴロー', index: 5, isEndless: true },
  { id: 'endless_rival_crossing_guard_hana', name: '見守りハナさん', index: 6, isEndless: true },
  { id: 'endless_rival_stationer_matsui', name: '文房具屋マツイ', index: 7, isEndless: true },
  { id: 'endless_rival_bakery_mugi', name: 'パン屋ムギさん', index: 8, isEndless: true },
  { id: 'endless_rival_bus_driver_sabu', name: 'バス運転手サブ', index: 9, isEndless: true },
  { id: 'endless_rival_flower_rika', name: '花屋リカさん', index: 10, isEndless: true },
  { id: 'endless_rival_police_kondo', name: '交番の近藤さん', index: 11, isEndless: true },
  { id: 'endless_rival_cat_mike', name: '三毛ねこミケ', index: 12, isEndless: true },
  { id: 'endless_rival_dog_pochi', name: 'しば犬ポチ', index: 13, isEndless: true },
  { id: 'endless_rival_rabbit_mochi', name: 'うさぎモチ', index: 14, isEndless: true },
  { id: 'endless_rival_hamster_kurumi', name: 'ハムスターくるみ', index: 15, isEndless: true },
  { id: 'endless_rival_penguin_pen', name: 'ペンギンのペン太', index: 16, isEndless: true },
  { id: 'endless_rival_owl_fukuro', name: 'ふくろう博士', index: 17, isEndless: true },
  { id: 'endless_rival_art_teacher_daigo', name: '美術教師ダイゴ', index: 18, isEndless: true },
  { id: 'endless_rival_music_teacher_otoha', name: '音楽教師オトハ', index: 19, isEndless: true },
  { id: 'endless_rival_science_teacher_tsubaki', name: '理科教師ツバキ', index: 20, isEndless: true },
  { id: 'endless_rival_math_teacher_sakuma', name: '数学教師サクマ', index: 21, isEndless: true },
  { id: 'endless_rival_janitor_robot_jiro', name: '掃除ロボ次郎', index: 22, isEndless: true },
  { id: 'endless_rival_pta_madam_reiko', name: 'PTAレイコ', index: 23, isEndless: true },
  { id: 'endless_rival_turtle_kamekichi', name: 'かめ吉', index: 24, isEndless: true },
  { id: 'endless_rival_sparrow_chun', name: 'すずめのチュン', index: 25, isEndless: true },
  { id: 'endless_rival_hedgehog_hari', name: 'はりねずみハリ', index: 26, isEndless: true },
  { id: 'endless_rival_red_panda_maru', name: 'レッサーマル', index: 27, isEndless: true },
  { id: 'endless_rival_alpaca_paca', name: 'アルパカぱか', index: 28, isEndless: true },
  { id: 'endless_rival_fox_kon', name: 'きつねコン', index: 29, isEndless: true },
  { id: 'endless_rival_convenience_nana', name: 'コンビニ店長ナナ', index: 30, isEndless: true },
  { id: 'endless_rival_bookstore_honda', name: '本屋ホンダ', index: 31, isEndless: true },
  { id: 'endless_rival_dentist_shiro', name: '歯医者シロ先生', index: 32, isEndless: true },
  { id: 'endless_rival_curry_master_kenta', name: 'カレー屋ケンタ', index: 33, isEndless: true },
  { id: 'endless_rival_mailman_hayashi', name: '郵便屋ハヤシ', index: 34, isEndless: true },
  { id: 'endless_rival_mayor_sakura', name: '町長サクラ', index: 35, isEndless: true },
];

export const PLACEMENT_TCG_PRINCIPAL =
  ENDLESS_RIVALS.find(rival => rival.id === 'endless_rival_principal_genda')!;

export const PLACEMENT_TCG_RIVAL_POOL = [
  ...REGULAR_RIVALS,
  ...ENDLESS_RIVALS.filter(rival => rival.id !== PLACEMENT_TCG_PRINCIPAL.id),
];

const ALL_RIVALS = [...REGULAR_RIVALS, ...ENDLESS_RIVALS];

export const getPlacementTcgOpponent = (id: string): PlacementTcgOpponent | null =>
  ALL_RIVALS.find(rival => rival.id === id) || null;

export const createSeededRandom = (initialSeed: number) => {
  let seed = initialSeed >>> 0;
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export const seededShuffle = <T,>(items: readonly T[], seed: number): T[] => {
  const random = createSeededRandom(seed);
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

export const createPlacementTcgOpponents = (seed: number): PlacementTcgOpponent[] => [
  ...seededShuffle(PLACEMENT_TCG_RIVAL_POOL, seed).slice(0, 9),
  PLACEMENT_TCG_PRINCIPAL,
];

export const getPlacementOpponentPortraitStyle = (
  opponent: PlacementTcgOpponent,
  expression: 0 | 1 | 2,
): React.CSSProperties => {
  const sheet = Math.floor(opponent.index / 3) + 1;
  const row = opponent.index % 3;
  const sheetName = `after-school-poker-${opponent.isEndless ? 'endless-rivals' : 'rivals'}-${String(sheet).padStart(2, '0')}.webp`;
  return {
    backgroundImage: `url(${assetUrl(`sprites/${sheetName}`)})`,
    backgroundSize: '300% 300%',
    backgroundPosition: `${expression * 50}% ${row * 50}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
  };
};
