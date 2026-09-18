import { NodeType, type CharacterAppearanceMode } from '../types';
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

export const HIGH_SCHOOL_VACATION_BATTLE_BACKGROUND_SCENES: BattleBackgroundScene[] = [
  {
    id: 'classroom',
    image: battleBackgroundUrl('high-school-vacation-battle-beach.webp'),
    flavorTexts: [
      '潮風が制服の代わりに夏の匂いを運び、砂浜の空気が一気に張りつめた。',
      '波が引いた瞬間、足元の砂に戦いの間合いができた。',
      '遠くの海の家から聞こえる声を背に、夏休みらしくない勝負が始まる。'
    ]
  },
  {
    id: 'library',
    image: battleBackgroundUrl('high-school-vacation-battle-boardwalk.webp'),
    flavorTexts: [
      '海沿いの木道に足音が響き、潮騒の向こうから敵の気配が近づく。',
      'アイスの看板が揺れる横で、のんびりした遊歩道が戦場へ変わった。',
      '夕日に光る手すりの先で、逃げずに向き合う相手が待っている。'
    ]
  },
  {
    id: 'science-lab',
    image: battleBackgroundUrl('high-school-vacation-battle-beach-house.webp'),
    flavorTexts: [
      '焼きそばの香りが残る広場で、椅子を避けながら身構えた。',
      '冷たい飲み物の氷が鳴り、休憩の空気が一瞬で消える。',
      '海の家ののれんが風に跳ね、次の一手を急かしている。'
    ]
  },
  {
    id: 'hallway',
    image: battleBackgroundUrl('high-school-vacation-battle-seaside-station.webp'),
    flavorTexts: [
      'ホームの向こうに海が見える。次の電車より先に、この勝負を終わらせる。',
      '発車ベルの余韻の中、駅前の静けさが妙に緊張している。',
      '旅行鞄を置き、潮風の吹く駅前で戦う準備を整えた。'
    ]
  },
  {
    id: 'rooftop',
    image: battleBackgroundUrl('high-school-vacation-battle-lookout.webp'),
    flavorTexts: [
      '岬を渡る強い風が、疲れも迷いもまとめて吹き飛ばそうとする。',
      '水平線まで見える場所で、背後にはもう逃げ道がない。',
      '灯台の白い壁を背に、夏空の下で正面から向き合った。'
    ]
  },
  {
    id: 'courtyard',
    image: battleBackgroundUrl('high-school-vacation-battle-resort-pool.webp'),
    flavorTexts: [
      '水面の反射が揺れ、プールサイドの明るさとは裏腹に空気が鋭くなる。',
      'デッキに残った水滴を踏まないよう、足場を確かめて構えた。',
      '休暇の歓声が遠のき、聞こえるのは水音と互いの呼吸だけになった。'
    ]
  },
  {
    id: 'music-room',
    image: battleBackgroundUrl('high-school-vacation-battle-tide-cave.webp'),
    flavorTexts: [
      '潮だまりの青い光が洞の天井へ反射し、影が大きく揺れる。',
      '足元を流れる浅い水を避けながら、相手との距離を測った。',
      '涼しい洞窟の奥で、波音が戦いの合図のように響いた。'
    ]
  },
  {
    id: 'gym',
    image: battleBackgroundUrl('high-school-vacation-battle-night-stage.webp'),
    flavorTexts: [
      '祭りの灯りが消えかけた浜で、最後の花火より大きな勝負が始まる。',
      '夜の海が真っ黒に広がり、足元の砂だけが月明かりに白い。',
      '楽しかった一日の終わりを守るため、浜辺の中央へ一歩踏み出した。'
    ]
  }
];

export const MAGIC_VACATION_BATTLE_BACKGROUND_SCENES: BattleBackgroundScene[] = [
  {
    id: 'classroom',
    image: battleBackgroundUrl('magic-vacation-battle-beach.webp'),
    flavorTexts: [
      '星砂が足元で淡く光り、潮風に揺れた結界が戦いの形へ組み上がる。',
      '明るい浜辺に魔力の輪が走り、楽しいだけでは終わらない夏が始まった。',
      '波打ち際の光粒が杖へ集まり、海と魔法が同時に息をする。'
    ]
  },
  {
    id: 'library',
    image: battleBackgroundUrl('magic-vacation-battle-aquarium.webp'),
    flavorTexts: [
      '大水槽の青い光が床へ揺れ、魚影の向こうで魔力が膨らんだ。',
      '静かな水族館に結界音が響き、展示室が一瞬で戦場へ変わる。',
      'クラゲの光と魔法陣が重なり、青い影の中で互いの位置を確かめた。'
    ]
  },
  {
    id: 'science-lab',
    image: battleBackgroundUrl('magic-vacation-battle-tidepool.webp'),
    flavorTexts: [
      '潮だまりの水が結晶へ変わり、足元に小さな魔法陣がいくつも開く。',
      '貝殻の間を走る光が一本につながり、封じられた魔力を目覚めさせた。',
      '波が引くたび結晶の色が変わり、次の術式を知らせている。'
    ]
  },
  {
    id: 'hallway',
    image: battleBackgroundUrl('magic-vacation-battle-boardwalk.webp'),
    flavorTexts: [
      '夕焼けの遊歩道に光の線が伸び、海側の結界だけが不自然に揺れた。',
      '潮風がリボンのように魔力を運び、木道の先で敵意が形になる。',
      '旅のざわめきが遠のき、夕暮れの海と魔法の足音だけが残った。'
    ]
  },
  {
    id: 'rooftop',
    image: battleBackgroundUrl('magic-vacation-battle-lighthouse.webp'),
    flavorTexts: [
      '灯台の光が月を横切り、風の中に巨大な術式が浮かび上がる。',
      '岬を叩く潮風の中、杖の光だけがまっすぐ相手を指した。',
      '眼下の海が銀色に光り、逃げ場のない空の下で結界が閉じる。'
    ]
  },
  {
    id: 'courtyard',
    image: battleBackgroundUrl('magic-vacation-battle-summer-shrine.webp'),
    flavorTexts: [
      '提灯の灯りに紛れて封印札が舞い、祭りの境内が静かに閉ざされた。',
      '鈴の音が一度鳴ると、石畳へ星と月の紋様が広がった。',
      '屋台の灯りの向こうで結界が軋み、楽しい夜を守る戦いが始まる。'
    ]
  },
  {
    id: 'music-room',
    image: battleBackgroundUrl('magic-vacation-battle-resort-stage.webp'),
    flavorTexts: [
      '無人のステージに幻奏の光が走り、海風が幕の代わりに揺れた。',
      '照明が一つずつ灯り、誰もいない客席へ魔力の音が広がっていく。',
      '波音と旋律が重なり、夏の舞台が決闘のステージへ変わった。'
    ]
  },
  {
    id: 'gym',
    image: battleBackgroundUrl('magic-vacation-battle-astral-shore.webp'),
    flavorTexts: [
      '星界の海が夜空とつながり、水平線そのものが巨大な結界になった。',
      '祭りの灯りが消え、海上に立ち上がる光の壁だけが世界を照らす。',
      'ここまでの夏を終わらせないため、星の波打ち際で最後の魔力を解放する。'
    ]
  }
];

const sceneById = new Map(BATTLE_BACKGROUND_SCENES.map(scene => [scene.id, scene]));
const magicSceneById = new Map(MAGIC_BATTLE_BACKGROUND_SCENES.map(scene => [scene.id, scene]));
const highSchoolVacationSceneById = new Map(HIGH_SCHOOL_VACATION_BATTLE_BACKGROUND_SCENES.map(scene => [scene.id, scene]));
const magicVacationSceneById = new Map(MAGIC_VACATION_BATTLE_BACKGROUND_SCENES.map(scene => [scene.id, scene]));

const getSceneCollection = (
  visualTheme: 'elementary' | 'high-school' | 'magic',
  appearanceMode: CharacterAppearanceMode
) => {
  if (appearanceMode === 'VACATION' && visualTheme === 'high-school') {
    return { scenes: HIGH_SCHOOL_VACATION_BATTLE_BACKGROUND_SCENES, byId: highSchoolVacationSceneById };
  }
  if (appearanceMode === 'VACATION' && visualTheme === 'magic') {
    return { scenes: MAGIC_VACATION_BATTLE_BACKGROUND_SCENES, byId: magicVacationSceneById };
  }
  if (visualTheme === 'magic') {
    return { scenes: MAGIC_BATTLE_BACKGROUND_SCENES, byId: magicSceneById };
  }
  return { scenes: BATTLE_BACKGROUND_SCENES, byId: sceneById };
};

export const chooseBattleBackgroundScene = (
  nodeType: NodeType | undefined,
  act: number,
  floor: number,
  visualTheme: 'elementary' | 'high-school' | 'magic' = 'elementary',
  appearanceMode: CharacterAppearanceMode = 'STANDARD'
): BattleBackgroundScene => {
  const { scenes, byId } = getSceneCollection(visualTheme, appearanceMode);
  if (nodeType === NodeType.BOSS) return byId.get('gym') ?? scenes[0];
  const regularScenes = scenes.filter(scene => scene.id !== 'gym');
  const index = Math.abs((act * 7 + floor * 3) % regularScenes.length);
  return regularScenes[index] ?? scenes[0];
};

export const getBattleBackgroundSceneById = (
  id: string | undefined,
  visualTheme: 'elementary' | 'high-school' | 'magic' = 'elementary',
  appearanceMode: CharacterAppearanceMode = 'STANDARD'
): BattleBackgroundScene => {
  const { scenes, byId } = getSceneCollection(visualTheme, appearanceMode);
  return byId.get(id ?? '') ?? scenes[0];
};

export const getBattleBackgroundFlavor = (scene: BattleBackgroundScene, seed: number): string => {
  const choices = scene.flavorTexts;
  return choices[Math.abs(seed) % choices.length] ?? choices[0] ?? '校舎の空気が張りつめている。';
};
