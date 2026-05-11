import { NodeType } from '../types';

export interface BattleBackgroundScene {
  id: string;
  image: string;
  flavorTexts: string[];
}

const BATTLE_BACKGROUND_BASE = '/sprites/backgrounds/learning-rogue';

export const BATTLE_BACKGROUND_SCENES: BattleBackgroundScene[] = [
  {
    id: 'classroom',
    image: `${BATTLE_BACKGROUND_BASE}/battle-classroom.webp`,
    flavorTexts: [
      '放課後の教室に、まだ消えていないチョークの匂いが残っている。',
      '机の影が長く伸び、黒板の前に不穏な気配が集まっている。',
      'カーテンが揺れ、誰もいない教室に小さな物音が響いた。'
    ]
  },
  {
    id: 'library',
    image: `${BATTLE_BACKGROUND_BASE}/battle-library.webp`,
    flavorTexts: [
      '図書室の本棚の奥で、ページをめくる音だけが続いている。',
      '古い本の匂いにまぎれて、ただならぬ気配が近づいてくる。',
      '机の上のしおりがひとりでに動き、戦いの合図になった。'
    ]
  },
  {
    id: 'science-lab',
    image: `${BATTLE_BACKGROUND_BASE}/battle-science-lab.webp`,
    flavorTexts: [
      '理科室のフラスコが青白く光り、実験台の影がざわついた。',
      'アルコールランプの火が揺れ、薬品棚の奥から気配がした。',
      '人体模型の視線を背中に感じながら、実験台の前に立つ。'
    ]
  },
  {
    id: 'hallway',
    image: `${BATTLE_BACKGROUND_BASE}/battle-hallway.webp`,
    flavorTexts: [
      '夕暮れの廊下に、上履きの足音がひとつ余計に響いている。',
      '掲示板の紙が揺れ、長い廊下の奥から何かが近づいてくる。',
      'ワックスの匂いが残る廊下で、逃げ道はまっすぐ後ろだけだ。'
    ]
  },
  {
    id: 'rooftop',
    image: `${BATTLE_BACKGROUND_BASE}/battle-rooftop.webp`,
    flavorTexts: [
      '屋上のフェンスが風に鳴り、空の色が戦いを急かしている。',
      '風に舞うプリントの向こうで、影がこちらを見ている。',
      '夕焼けの屋上に立つと、校舎全体が静まり返った。'
    ]
  },
  {
    id: 'courtyard',
    image: `${BATTLE_BACKGROUND_BASE}/battle-courtyard.webp`,
    flavorTexts: [
      '校庭の砂ぼこりが舞い、遊具の影が長く伸びている。',
      '誰もいないはずの校庭で、鉄棒がかすかに鳴った。',
      '校舎の窓が夕日を返し、土の上に戦いの気配が満ちた。'
    ]
  },
  {
    id: 'music-room',
    image: `${BATTLE_BACKGROUND_BASE}/battle-music-room.webp`,
    flavorTexts: [
      '音楽室のピアノが、触れてもいないのに低く鳴った。',
      '譜面台の影が揺れ、カーテンの向こうから旋律が漏れる。',
      '壁の肖像画に見下ろされながら、静かな音楽室で身構えた。'
    ]
  },
  {
    id: 'gym',
    image: `${BATTLE_BACKGROUND_BASE}/battle-gym.webp`,
    flavorTexts: [
      '体育館の床がきしみ、ステージの暗がりに大きな気配がある。',
      'バスケットゴールの影が伸び、広い体育館が妙に狭く感じる。',
      '夕方の体育館に、ボールの跳ねる音だけが一度響いた。'
    ]
  }
];

const sceneById = new Map(BATTLE_BACKGROUND_SCENES.map(scene => [scene.id, scene]));

export const chooseBattleBackgroundScene = (
  nodeType: NodeType | undefined,
  act: number,
  floor: number
): BattleBackgroundScene => {
  if (nodeType === NodeType.BOSS) return sceneById.get('gym') ?? BATTLE_BACKGROUND_SCENES[0];
  const regularScenes = BATTLE_BACKGROUND_SCENES.filter(scene => scene.id !== 'gym');
  const index = Math.abs((act * 7 + floor * 3) % regularScenes.length);
  return regularScenes[index] ?? BATTLE_BACKGROUND_SCENES[0];
};

export const getBattleBackgroundSceneById = (id: string | undefined): BattleBackgroundScene => {
  return sceneById.get(id ?? '') ?? BATTLE_BACKGROUND_SCENES[0];
};

export const getBattleBackgroundFlavor = (scene: BattleBackgroundScene, seed: number): string => {
  const choices = scene.flavorTexts;
  return choices[Math.abs(seed) % choices.length] ?? choices[0] ?? '校舎の空気が張りつめている。';
};
