import { NodeType } from '../types';
import { assetUrl } from '../utils/assetPaths';

export interface BattleBackgroundScene {
  id: string;
  image: string;
  flavorTexts: string[];
}

const battleBackgroundUrl = (fileName: string) => assetUrl(`sprites/backgrounds/learning-rogue/${fileName}`);

export const BATTLE_BACKGROUND_SCENES: BattleBackgroundScene[] = [
  {
    id: 'classroom',
    image: battleBackgroundUrl('battle-classroom.webp'),
    flavorTexts: [
      '放課後の教室に、まだ消えていないチョークの匂いが残っている。',
      '机の影が長く伸び、黒板の前に不穏な気配が集まっている。',
      'カーテンが揺れ、誰もいない教室に小さな物音が響いた。'
    ]
  },
  {
    id: 'library',
    image: battleBackgroundUrl('battle-library.webp'),
    flavorTexts: [
      '図書室の本棚の奥で、ページをめくる音だけが続いている。',
      '古い本の匂いにまぎれて、ただならぬ気配が近づいてくる。',
      '机の上のしおりがひとりでに動き、戦いの合図になった。'
    ]
  },
  {
    id: 'science-lab',
    image: battleBackgroundUrl('battle-science-lab.webp'),
    flavorTexts: [
      '理科室のフラスコが青白く光り、実験台の影がざわついた。',
      'アルコールランプの火が揺れ、薬品棚の奥から気配がした。',
      '人体模型の視線を背中に感じながら、実験台の前に立つ。'
    ]
  },
  {
    id: 'hallway',
    image: battleBackgroundUrl('battle-hallway.webp'),
    flavorTexts: [
      '夕暮れの廊下に、上履きの足音がひとつ余計に響いている。',
      '掲示板の紙が揺れ、長い廊下の奥から何かが近づいてくる。',
      'ワックスの匂いが残る廊下で、逃げ道はまっすぐ後ろだけだ。'
    ]
  },
  {
    id: 'rooftop',
    image: battleBackgroundUrl('battle-rooftop.webp'),
    flavorTexts: [
      '屋上のフェンスが風に鳴り、空の色が戦いを急かしている。',
      '風に舞うプリントの向こうで、影がこちらを見ている。',
      '夕焼けの屋上に立つと、校舎全体が静まり返った。'
    ]
  },
  {
    id: 'courtyard',
    image: battleBackgroundUrl('battle-courtyard.webp'),
    flavorTexts: [
      '校庭の砂ぼこりが舞い、遊具の影が長く伸びている。',
      '誰もいないはずの校庭で、鉄棒がかすかに鳴った。',
      '校舎の窓が夕日を返し、土の上に戦いの気配が満ちた。'
    ]
  },
  {
    id: 'music-room',
    image: battleBackgroundUrl('battle-music-room.webp'),
    flavorTexts: [
      '音楽室のピアノが、触れてもいないのに低く鳴った。',
      '譜面台の影が揺れ、カーテンの向こうから旋律が漏れる。',
      '壁の肖像画に見下ろされながら、静かな音楽室で身構えた。'
    ]
  },
  {
    id: 'gym',
    image: battleBackgroundUrl('battle-gym.webp'),
    flavorTexts: [
      '体育館の床がきしみ、ステージの暗がりに大きな気配がある。',
      'バスケットゴールの影が伸び、広い体育館が妙に狭く感じる。',
      '夕方の体育館に、ボールの跳ねる音だけが一度響いた。'
    ]
  }
];

export const MAGIC_BATTLE_BACKGROUND_SCENES: BattleBackgroundScene[] = [
  {
    id: 'classroom',
    image: battleBackgroundUrl('magic-battle-classroom.webp'),
    flavorTexts: [
      '魔法陣の光が教室の床を走り、黒板の星図が静かに輝いた。',
      '浮かび上がった机の影を抜けて、授業では教わらない戦いが始まる。',
      'チョークの粉が星屑に変わり、変身した心に魔力が満ちていく。'
    ]
  },
  {
    id: 'library',
    image: battleBackgroundUrl('magic-battle-library.webp'),
    flavorTexts: [
      '深淵図書館の本棚が開き、封じられた呪文がページからこぼれた。',
      '月明かりを受けた魔導書が舞い、知識の迷宮が戦場へ変わる。',
      '静かな閲覧席の奥で、古い契約の鎖がきしむ音がした。'
    ]
  },
  {
    id: 'science-lab',
    image: battleBackgroundUrl('magic-battle-science-lab.webp'),
    flavorTexts: [
      '錬金フラスコが淡く発光し、実験台の上で時間の歯車が回り出す。',
      '薬品棚の影に隠れた魔力が、理科室全体を結界へ作り替えた。',
      '結晶化した魔素が床を伝い、次の一手を待つように震えている。'
    ]
  },
  {
    id: 'hallway',
    image: battleBackgroundUrl('magic-battle-hallway.webp'),
    flavorTexts: [
      '黄昏の廊下にステンドグラスの光が落ち、封印扉が遠くで鳴った。',
      '掲示板の紙片がリボンのように舞い、廊下の奥から敵意が近づく。',
      '放課後の足音が消えた瞬間、学園の裏側が姿を現した。'
    ]
  },
  {
    id: 'rooftop',
    image: battleBackgroundUrl('magic-battle-rooftop.webp'),
    flavorTexts: [
      '大きな月の下、屋上の結界が星座の形に組み上がっていく。',
      '夜風に羽根と光粒が舞い、遠い街明かりが小さくまたたいた。',
      'フェンスの向こうの空へ、願いと覚悟がまっすぐ伸びていく。'
    ]
  },
  {
    id: 'courtyard',
    image: battleBackgroundUrl('magic-battle-courtyard.webp'),
    flavorTexts: [
      '中庭の噴水が星の水を吹き上げ、花壇の結界が淡く開いた。',
      '夜の学園に花びらが舞い、優しい光の奥で危険な気配が揺れる。',
      '校舎に囲まれた広場が、恋も友情も守るための戦場になった。'
    ]
  },
  {
    id: 'music-room',
    image: battleBackgroundUrl('magic-battle-music-room.webp'),
    flavorTexts: [
      '音楽ホールの譜面が光の粒に変わり、夢の舞台が幕を開ける。',
      '誰も弾いていないピアノが和音を鳴らし、紫の魔力が渦を巻いた。',
      'シャンデリアの光が降り注ぎ、悪夢を断つための旋律が響く。'
    ]
  },
  {
    id: 'gym',
    image: battleBackgroundUrl('magic-battle-gym.webp'),
    flavorTexts: [
      '訓練場の結界ドームが閉じ、床の星印が決戦の位置を示した。',
      '魔法標的が赤く灯り、奥義を放つための魔力が一気に高まる。',
      '広いホールに歓声はない。ただ、巨悪へ向かう覚悟だけが満ちている。'
    ]
  }
];

const sceneById = new Map(BATTLE_BACKGROUND_SCENES.map(scene => [scene.id, scene]));
const magicSceneById = new Map(MAGIC_BATTLE_BACKGROUND_SCENES.map(scene => [scene.id, scene]));

export const chooseBattleBackgroundScene = (
  nodeType: NodeType | undefined,
  act: number,
  floor: number,
  visualTheme: 'elementary' | 'high-school' | 'magic' = 'elementary'
): BattleBackgroundScene => {
  const scenes = visualTheme === 'magic' ? MAGIC_BATTLE_BACKGROUND_SCENES : BATTLE_BACKGROUND_SCENES;
  const byId = visualTheme === 'magic' ? magicSceneById : sceneById;
  if (nodeType === NodeType.BOSS) return byId.get('gym') ?? scenes[0];
  const regularScenes = scenes.filter(scene => scene.id !== 'gym');
  const index = Math.abs((act * 7 + floor * 3) % regularScenes.length);
  return regularScenes[index] ?? scenes[0];
};

export const getBattleBackgroundSceneById = (
  id: string | undefined,
  visualTheme: 'elementary' | 'high-school' | 'magic' = 'elementary'
): BattleBackgroundScene => {
  if (visualTheme === 'magic') return magicSceneById.get(id ?? '') ?? MAGIC_BATTLE_BACKGROUND_SCENES[0];
  return sceneById.get(id ?? '') ?? BATTLE_BACKGROUND_SCENES[0];
};

export const getBattleBackgroundFlavor = (scene: BattleBackgroundScene, seed: number): string => {
  const choices = scene.flavorTexts;
  return choices[Math.abs(seed) % choices.length] ?? choices[0] ?? '校舎の空気が張りつめている。';
};
