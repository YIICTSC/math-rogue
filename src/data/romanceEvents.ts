import { MAGIC_HEROES, type MagicHero } from './magicHeroes';
import { ROMANCE_TARGETS, type RomanceTarget } from './romanceTargets';

export type MagicRomanceStageId = 'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'r6';
export type MagicRelationshipStage = 'MEET' | 'TRUST' | 'CLOSER' | 'CRISIS' | 'PROMISE' | 'ENDING';
export type MagicEventAssetStatus = 'ready' | 'planned';

export interface MagicRelationshipStageDefinition {
  id: MagicRomanceStageId;
  stage: MagicRelationshipStage;
  label: string;
  requiredAffection: number;
  chapter: 1 | 2 | 3 | 4;
  affectionGain: number;
  requiredStudyRate?: number;
  isQuestionMarkEvent: boolean;
  summary: string;
}

export interface MagicRelationshipEvent {
  id: string;
  heroId: string;
  heroName: string;
  targetId: string;
  targetName: string;
  targetRole: string;
  routeId: string;
  stageId: MagicRomanceStageId;
  stage: MagicRelationshipStage;
  stageLabel: string;
  title: string;
  requiredAffection: number;
  requiredStudyRate?: number;
  chapter: 1 | 2 | 3 | 4;
  affectionGain: number;
  isQuestionMarkEvent: boolean;
  imagePath: string;
  assetStatus: MagicEventAssetStatus;
  situation: string;
  summary: string;
}

export interface MagicCommonEventImage {
  id: string;
  title: string;
  description: string;
  imageIndex: number;
  imagePath: string;
  assetStatus: MagicEventAssetStatus;
}

export interface MagicEventImageManifestItem {
  id: string;
  kind: 'common' | 'romance';
  title: string;
  imagePath: string;
  assetStatus: MagicEventAssetStatus;
  heroId?: string;
  targetId?: string;
  stageId?: MagicRomanceStageId;
}

export const MAGIC_RELATIONSHIP_STAGES: MagicRelationshipStageDefinition[] = [
  {
    id: 'r1',
    stage: 'MEET',
    label: '出会い',
    requiredAffection: 0,
    chapter: 1,
    affectionGain: 20,
    isQuestionMarkEvent: true,
    summary: '初対面、または恋愛ルートの入口。相手の役割と第一印象を示す。',
  },
  {
    id: 'r2',
    stage: 'TRUST',
    label: '信頼',
    requiredAffection: 20,
    chapter: 1,
    affectionGain: 20,
    requiredStudyRate: 70,
    isQuestionMarkEvent: true,
    summary: '学習、学園生活、魔法訓練で小さく協力し、信頼を得る。',
  },
  {
    id: 'r3',
    stage: 'CLOSER',
    label: '接近',
    requiredAffection: 40,
    chapter: 2,
    affectionGain: 20,
    requiredStudyRate: 70,
    isQuestionMarkEvent: true,
    summary: '放課後、休日、秘密共有で距離が縮まる。',
  },
  {
    id: 'r4',
    stage: 'CRISIS',
    label: '危機',
    requiredAffection: 60,
    chapter: 3,
    affectionGain: 20,
    requiredStudyRate: 85,
    isQuestionMarkEvent: true,
    summary: '魔法少女としての危機を二人で越え、関係が特別になる。',
  },
  {
    id: 'r5',
    stage: 'PROMISE',
    label: '告白/約束',
    requiredAffection: 80,
    chapter: 3,
    affectionGain: 15,
    requiredStudyRate: 85,
    isQuestionMarkEvent: true,
    summary: '恋心、使命、進路の約束を確認する。',
  },
  {
    id: 'r6',
    stage: 'ENDING',
    label: '個別エンド',
    requiredAffection: 95,
    chapter: 4,
    affectionGain: 0,
    requiredStudyRate: 95,
    isQuestionMarkEvent: false,
    summary: '4章ボス撃破後に表示する個別恋愛エンド。真恋愛エンド候補を兼ねる。',
  },
];

export const MAGIC_COMMON_EVENT_IMAGES: MagicCommonEventImage[] = [
  { id: 'COMMON_MAGIC_EVENT_00', title: '星図教室の放課後', description: '星図の黒板前で進路と使命を話す。', imageIndex: 0, imagePath: 'sprites/magic/events/0.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_01', title: '月光の中庭', description: '月光の噴水前で冷静な判断を求められる。', imageIndex: 1, imagePath: 'sprites/magic/events/1.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_02', title: '花の迷宮演習', description: '花の訓練迷宮で治癒と選択を学ぶ。', imageIndex: 2, imagePath: 'sprites/magic/events/2.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_03', title: '炎の魔法実技', description: '結界内で炎の実技と本音がぶつかる。', imageIndex: 3, imagePath: 'sprites/magic/events/3.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_04', title: '深淵図書館の栞', description: '禁書棚の奥で敵幹部の葛藤に触れる。', imageIndex: 4, imagePath: 'sprites/magic/events/4.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_05', title: '時計塔の補習', description: '止まった時計塔で失敗のやり直しを考える。', imageIndex: 5, imagePath: 'sprites/magic/events/5.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_06', title: '風渡りの屋上', description: '屋上の風の中で言えない言葉を交わす。', imageIndex: 6, imagePath: 'sprites/magic/events/6.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_07', title: '夢見の保健室', description: '悪夢の気配を舞台魔法でほどく。', imageIndex: 7, imagePath: 'sprites/magic/events/7.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_08', title: '光の礼拝堂', description: 'ステンドグラス下で二つの世界の使命を選ぶ。', imageIndex: 8, imagePath: 'sprites/magic/events/8.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_09', title: '魔法陣の廊下', description: '廊下の魔法陣が次の出会いを示す。', imageIndex: 9, imagePath: 'sprites/magic/events/9.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_10', title: 'SNSに届いた予兆', description: '端末の予兆メッセージと幻術のノイズ。', imageIndex: 10, imagePath: 'sprites/magic/events/10.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_11', title: '購買部の魔法雑貨', description: '魔法雑貨の中から今日だけの助けを選ぶ。', imageIndex: 11, imagePath: 'sprites/magic/events/11.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_12', title: '寮の作戦会議', description: '夜の寮で作戦と友情を固める。', imageIndex: 12, imagePath: 'sprites/magic/events/12.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_13', title: '水族館の約束', description: '水槽前で戦いから離れた本音を交わす。', imageIndex: 13, imagePath: 'sprites/magic/events/13.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_14', title: '夏祭りの結界', description: '屋台の光の中、結界のほころびを塞ぐ。', imageIndex: 14, imagePath: 'sprites/magic/events/14.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_15', title: '文化祭の秘密舞台', description: '舞台袖で魔法と恋心が同時に揺れる。', imageIndex: 15, imagePath: 'sprites/magic/events/15.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_16', title: 'クリスマス街の魔光', description: '街のイルミネーションに異世界信号が混じる。', imageIndex: 16, imagePath: 'sprites/magic/events/16.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_17', title: 'バレンタインの魔法包み', description: '小さな包みに気持ちと魔力を込める。', imageIndex: 17, imagePath: 'sprites/magic/events/17.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_18', title: '卒業式前夜の星空', description: '最後の夜に九人の願いが一つになる。', imageIndex: 18, imagePath: 'sprites/magic/events/18.webp', assetStatus: 'ready' },
  { id: 'COMMON_MAGIC_EVENT_19', title: '真夜中の変身訓練', description: '誰もいない訓練場で変身後の自分と向き合う。', imageIndex: 19, imagePath: 'sprites/magic/events/19.webp', assetStatus: 'ready' },
];

const TARGET_STAGE_SITUATIONS: Record<string, Record<MagicRomanceStageId, string>> = {
  REN: {
    r1: '校門や屋上で、幼なじみの近さを感じる出会い。',
    r2: '勉強ノートや風の防護で、いつもの支えを受け取る。',
    r3: '雨宿り、商店街、帰り道で、日常の距離が変わる。',
    r4: '主人公をかばう風の防護結界で、信頼が危機を越える。',
    r5: 'いつもの場所で、変わらない関係を新しい約束にする。',
    r6: '卒業後も変わらない日常と、新しい恋人関係を描く。',
  },
  SOMA: {
    r1: '生徒会室で、規律と責任を背負う相手として出会う。',
    r2: '数学補習や書類整理で、完璧主義の奥の優しさを知る。',
    r3: '夜の校舎巡回で、互いの弱さを静かに共有する。',
    r4: '秩序結界の暴走を二人で抑える。',
    r5: '完璧でない本音を受け止め、対等な約束を交わす。',
    r6: '学園を支える未来を、二人で選ぶ。',
  },
  MINATO: {
    r1: '保健室や廊下で、後輩の相談から関係が始まる。',
    r2: '生物実習や治癒補助で、努力を認め合う。',
    r3: '水族館や購買部で、優しい時間を過ごす。',
    r4: '回復魔法の限界に向き合い、守るだけでなく支え合う。',
    r5: '守られるだけではない決意を、柔らかく伝える。',
    r6: '互いを支え合う卒業後の未来を描く。',
  },
  RIKU: {
    r1: '時計塔で、時間を観測する先輩と出会う。',
    r2: '情報整理や時間メモで、失敗を次へ進める。',
    r3: '放課後の研究室や屋上で、先送りしていた本音に近づく。',
    r4: '時間分岐の危機で、選ぶ覚悟を問われる。',
    r5: '先送りしない告白として、今の気持ちを確かめる。',
    r6: '未来を観測するだけでなく、二人で選ぶ。',
  },
  YAMATO: {
    r1: '体育館裏で、誤解と不器用な優しさから始まる。',
    r2: '実技練習で、炎の制御と信頼を学ぶ。',
    r3: '夏祭りや夜道で、素直でない優しさを知る。',
    r4: '無茶を止める共闘で、互いの居場所を守る。',
    r5: '不器用な言葉で、笑える居場所を約束する。',
    r6: '肩肘張らずに笑える日常を、二人で選ぶ。',
  },
  LEON: {
    r1: '舞台で、華やかなライバル宣言を受ける。',
    r2: '音楽室や幻術練習で、互いの努力を認める。',
    r3: '文化祭や秘密舞台で、勝負以外の表情を知る。',
    r4: '夢の暴走を止め、ライバル以上の信頼を得る。',
    r5: '勝敗を越えた告白として、互いを高める約束をする。',
    r6: '同じ舞台に立ち続ける未来を描く。',
  },
  ELLIOT: {
    r1: '転校初日や図書室で、星界の違和感に気づく。',
    r2: '英語、古書、星界文字を通して秘密に近づく。',
    r3: '図書室やクリスマス街で、二つの世界を感じる。',
    r4: '異世界信号の遮断で、帰る場所と残る理由を問う。',
    r5: '元の世界と今の世界、そのどちらも大切にすると約束する。',
    r6: '二つの世界をつなぐ未来を選ぶ。',
  },
  SAKUYA: {
    r1: '敵として遭遇し、冷たい封印術と葛藤を知る。',
    r2: '停戦と封印調査で、敵味方の境界が揺らぐ。',
    r3: '闇劇場や裏路地で、罪と記憶に触れる。',
    r4: '敵陣からの離反をかけた共闘で、救済を選ぶ。',
    r5: '許されたい願いを受け止め、未来への約束を交わす。',
    r6: '罪を背負いながらも、共に進む未来を描く。',
  },
};

const HERO_EVENT_FOCUS: Record<string, string> = {
  AKARI: '星光、手を差し出す構図、前向きに相手を引っ張る表情。',
  SHIZUKU: '月光、鏡や水面、眼鏡の反射、静かな観察と選択。',
  HIYORI: '花、保健室、傷や不安に寄り添う柔らかい距離。',
  TSUBASA: '炎、実技場、体育館、共闘と衝突の動き。',
  REI: '禁書、封印札、暗い背景に差す赤い光、秘密と赦し。',
  MADOKA: '時計、実験器具、ノート、失敗から進む研究の空気。',
  KOHARU: '屋上、温室、風、精霊樹、静かな守護と決断。',
  MIRAI: '舞台、照明、夢、笑顔の裏の弱さ。',
  SERA: '星界、礼拝堂、白い光、祈りと希望。',
};

export const MAGIC_INITIAL_ROMANCE_ROUTE_IDS = [
  'AKARI_REN',
  'AKARI_YAMATO',
  'SHIZUKU_SOMA',
  'SHIZUKU_RIKU',
  'HIYORI_MINATO',
  'HIYORI_REN',
  'TSUBASA_YAMATO',
  'TSUBASA_LEON',
  'REI_SAKUYA',
  'REI_SOMA',
  'MADOKA_RIKU',
  'MADOKA_ELLIOT',
  'KOHARU_REN',
  'KOHARU_SAKUYA',
  'MIRAI_LEON',
  'MIRAI_RIKU',
  'SERA_ELLIOT',
  'SERA_MINATO',
];

export const MAGIC_P1_01_AKARI_ROUTE_IDS = [
  'AKARI_SOMA',
  'AKARI_MINATO',
  'AKARI_RIKU',
  'AKARI_LEON',
  'AKARI_ELLIOT',
  'AKARI_SAKUYA',
];

export const MAGIC_P1_02_SHIZUKU_ROUTE_IDS = [
  'SHIZUKU_REN',
  'SHIZUKU_MINATO',
  'SHIZUKU_YAMATO',
  'SHIZUKU_LEON',
  'SHIZUKU_ELLIOT',
  'SHIZUKU_SAKUYA',
];

export const MAGIC_P1_03_HIYORI_ROUTE_IDS = [
  'HIYORI_SOMA',
  'HIYORI_RIKU',
  'HIYORI_YAMATO',
  'HIYORI_LEON',
  'HIYORI_ELLIOT',
  'HIYORI_SAKUYA',
];

export const MAGIC_P1_04_TSUBASA_ROUTE_IDS = [
  'TSUBASA_REN',
  'TSUBASA_SOMA',
  'TSUBASA_MINATO',
  'TSUBASA_RIKU',
  'TSUBASA_ELLIOT',
  'TSUBASA_SAKUYA',
];

export const MAGIC_P1_05_REI_ROUTE_IDS = [
  'REI_REN',
  'REI_MINATO',
  'REI_RIKU',
  'REI_YAMATO',
  'REI_LEON',
  'REI_ELLIOT',
];

export const MAGIC_P1_06_MADOKA_ROUTE_IDS = [
  'MADOKA_REN',
  'MADOKA_SOMA',
  'MADOKA_MINATO',
  'MADOKA_YAMATO',
  'MADOKA_LEON',
  'MADOKA_SAKUYA',
];

export const MAGIC_P1_07_KOHARU_ROUTE_IDS = [
  'KOHARU_SOMA',
  'KOHARU_MINATO',
  'KOHARU_RIKU',
  'KOHARU_YAMATO',
  'KOHARU_LEON',
  'KOHARU_ELLIOT',
];

export const MAGIC_P1_08_MIRAI_ROUTE_IDS = [
  'MIRAI_REN',
  'MIRAI_SOMA',
  'MIRAI_MINATO',
  'MIRAI_YAMATO',
  'MIRAI_ELLIOT',
  'MIRAI_SAKUYA',
];

export const MAGIC_P1_09_SERA_ROUTE_IDS = [
  'SERA_REN',
  'SERA_SOMA',
  'SERA_RIKU',
  'SERA_YAMATO',
  'SERA_LEON',
  'SERA_SAKUYA',
];

export const MAGIC_P2_01_ENDING_ROUTE_IDS = [
  'AKARI_REN',
  'AKARI_SOMA',
  'AKARI_MINATO',
  'AKARI_RIKU',
  'AKARI_YAMATO',
  'AKARI_LEON',
  'AKARI_ELLIOT',
  'AKARI_SAKUYA',
  'SHIZUKU_REN',
];

export const MAGIC_P2_02_ENDING_ROUTE_IDS = [
  'SHIZUKU_SOMA',
  'SHIZUKU_MINATO',
  'SHIZUKU_RIKU',
  'SHIZUKU_YAMATO',
  'SHIZUKU_LEON',
  'SHIZUKU_ELLIOT',
  'SHIZUKU_SAKUYA',
  'HIYORI_REN',
  'HIYORI_SOMA',
];

export const MAGIC_P2_03_ENDING_ROUTE_IDS = [
  'HIYORI_MINATO',
  'HIYORI_RIKU',
  'HIYORI_YAMATO',
  'HIYORI_LEON',
  'HIYORI_ELLIOT',
  'HIYORI_SAKUYA',
  'TSUBASA_REN',
  'TSUBASA_SOMA',
  'TSUBASA_MINATO',
];

export const MAGIC_P2_04_ENDING_ROUTE_IDS = [
  'TSUBASA_RIKU',
  'TSUBASA_YAMATO',
  'TSUBASA_LEON',
  'TSUBASA_ELLIOT',
  'TSUBASA_SAKUYA',
  'REI_REN',
  'REI_SOMA',
  'REI_MINATO',
  'REI_RIKU',
];

export const MAGIC_P2_05_ENDING_ROUTE_IDS = [
  'REI_YAMATO',
  'REI_LEON',
  'REI_ELLIOT',
  'REI_SAKUYA',
  'MADOKA_REN',
  'MADOKA_SOMA',
  'MADOKA_MINATO',
  'MADOKA_RIKU',
  'MADOKA_YAMATO',
];

export const MAGIC_P2_06_ENDING_ROUTE_IDS = [
  'MADOKA_LEON',
  'MADOKA_ELLIOT',
  'MADOKA_SAKUYA',
  'KOHARU_REN',
  'KOHARU_SOMA',
  'KOHARU_MINATO',
  'KOHARU_RIKU',
  'KOHARU_YAMATO',
  'KOHARU_LEON',
];

export const MAGIC_P2_07_ENDING_ROUTE_IDS = [
  'KOHARU_ELLIOT',
  'KOHARU_SAKUYA',
  'MIRAI_REN',
  'MIRAI_SOMA',
  'MIRAI_MINATO',
  'MIRAI_RIKU',
  'MIRAI_YAMATO',
  'MIRAI_LEON',
  'MIRAI_ELLIOT',
];

export const MAGIC_P2_08_ENDING_ROUTE_IDS = [
  'MIRAI_SAKUYA',
  'SERA_REN',
  'SERA_SOMA',
  'SERA_MINATO',
  'SERA_RIKU',
  'SERA_YAMATO',
  'SERA_LEON',
  'SERA_ELLIOT',
  'SERA_SAKUYA',
];

const isReadyAsset = (routeId: string, stageId: MagicRomanceStageId): boolean => {
  if (stageId === 'r6') {
    return (
      MAGIC_P2_01_ENDING_ROUTE_IDS.includes(routeId) ||
      MAGIC_P2_02_ENDING_ROUTE_IDS.includes(routeId) ||
      MAGIC_P2_03_ENDING_ROUTE_IDS.includes(routeId) ||
      MAGIC_P2_04_ENDING_ROUTE_IDS.includes(routeId) ||
      MAGIC_P2_05_ENDING_ROUTE_IDS.includes(routeId) ||
      MAGIC_P2_06_ENDING_ROUTE_IDS.includes(routeId) ||
      MAGIC_P2_07_ENDING_ROUTE_IDS.includes(routeId) ||
      MAGIC_P2_08_ENDING_ROUTE_IDS.includes(routeId)
    );
  }

  return (
    MAGIC_INITIAL_ROMANCE_ROUTE_IDS.includes(routeId) ||
    MAGIC_P1_01_AKARI_ROUTE_IDS.includes(routeId) ||
    MAGIC_P1_02_SHIZUKU_ROUTE_IDS.includes(routeId) ||
    MAGIC_P1_03_HIYORI_ROUTE_IDS.includes(routeId) ||
    MAGIC_P1_04_TSUBASA_ROUTE_IDS.includes(routeId) ||
    MAGIC_P1_05_REI_ROUTE_IDS.includes(routeId) ||
    MAGIC_P1_06_MADOKA_ROUTE_IDS.includes(routeId) ||
    MAGIC_P1_07_KOHARU_ROUTE_IDS.includes(routeId) ||
    MAGIC_P1_08_MIRAI_ROUTE_IDS.includes(routeId) ||
    MAGIC_P1_09_SERA_ROUTE_IDS.includes(routeId)
  );
};

const getHeroFocus = (hero: MagicHero): string => HERO_EVENT_FOCUS[hero.id] ?? hero.personality;
const getTargetSituation = (target: RomanceTarget, stageId: MagicRomanceStageId): string =>
  TARGET_STAGE_SITUATIONS[target.id]?.[stageId] ?? `${target.role}の${target.name}との${stageId}イベント。`;

const buildRomanceEvent = (
  hero: MagicHero,
  target: RomanceTarget,
  stageDefinition: MagicRelationshipStageDefinition,
): MagicRelationshipEvent => {
  const routeId = `${hero.id}_${target.id}`;
  const imagePath = `sprites/magic/events/romance/${hero.id}/${target.id}/${stageDefinition.id}.webp`;
  const targetSituation = getTargetSituation(target, stageDefinition.id);
  const heroFocus = getHeroFocus(hero);

  return {
    id: `ROMANCE_${routeId}_${stageDefinition.id.toUpperCase()}`,
    heroId: hero.id,
    heroName: hero.name,
    targetId: target.id,
    targetName: target.name,
    targetRole: target.role,
    routeId,
    stageId: stageDefinition.id,
    stage: stageDefinition.stage,
    stageLabel: stageDefinition.label,
    title: `${hero.name}×${target.name}・${stageDefinition.label}`,
    requiredAffection: stageDefinition.requiredAffection,
    requiredStudyRate: stageDefinition.requiredStudyRate,
    chapter: stageDefinition.chapter,
    affectionGain: stageDefinition.affectionGain,
    isQuestionMarkEvent: stageDefinition.isQuestionMarkEvent,
    imagePath,
    assetStatus: isReadyAsset(routeId, stageDefinition.id) ? 'ready' : 'planned',
    situation: `${targetSituation} ${hero.name}側の焦点: ${heroFocus}`,
    summary: `${stageDefinition.summary} ${target.role}の${target.name}との関係を、${hero.name}の物語として分岐させる。`,
  };
};

export const ROMANCE_EVENTS: MagicRelationshipEvent[] = MAGIC_HEROES.flatMap((hero) =>
  ROMANCE_TARGETS.flatMap((target) =>
    MAGIC_RELATIONSHIP_STAGES.map((stageDefinition) => buildRomanceEvent(hero, target, stageDefinition)),
  ),
);

export const MAGIC_QUESTION_MARK_ROMANCE_EVENTS: MagicRelationshipEvent[] = ROMANCE_EVENTS.filter(
  (event) => event.isQuestionMarkEvent,
);

export const MAGIC_ROMANCE_ENDING_EVENTS: MagicRelationshipEvent[] = ROMANCE_EVENTS.filter(
  (event) => !event.isQuestionMarkEvent,
);

export const MAGIC_EVENT_IMAGE_MANIFEST: MagicEventImageManifestItem[] = [
  ...MAGIC_COMMON_EVENT_IMAGES.map((event) => ({
    id: event.id,
    kind: 'common' as const,
    title: event.title,
    imagePath: event.imagePath,
    assetStatus: event.assetStatus,
  })),
  ...ROMANCE_EVENTS.map((event) => ({
    id: event.id,
    kind: 'romance' as const,
    title: event.title,
    imagePath: event.imagePath,
    assetStatus: event.assetStatus,
    heroId: event.heroId,
    targetId: event.targetId,
    stageId: event.stageId,
  })),
];

export const MAGIC_EVENT_IMAGE_COUNTS = {
  common: MAGIC_COMMON_EVENT_IMAGES.length,
  romanceQuestionMark: MAGIC_QUESTION_MARK_ROMANCE_EVENTS.length,
  romanceEnding: MAGIC_ROMANCE_ENDING_EVENTS.length,
  romanceTotal: ROMANCE_EVENTS.length,
  total: MAGIC_EVENT_IMAGE_MANIFEST.length,
  ready: MAGIC_EVENT_IMAGE_MANIFEST.filter((event) => event.assetStatus === 'ready').length,
  planned: MAGIC_EVENT_IMAGE_MANIFEST.filter((event) => event.assetStatus === 'planned').length,
} as const;

export const getMagicRomanceEventsForRoute = (heroId: string, targetId: string): MagicRelationshipEvent[] =>
  ROMANCE_EVENTS.filter((event) => event.heroId === heroId && event.targetId === targetId);

export const getNextMagicRomanceEvent = (
  heroId: string,
  targetId: string,
  affection: number,
  completedEventIds: string[],
): MagicRelationshipEvent | undefined =>
  getMagicRomanceEventsForRoute(heroId, targetId).find(
    (event) =>
      event.isQuestionMarkEvent &&
      event.requiredAffection <= affection &&
      !completedEventIds.includes(event.id),
  );
