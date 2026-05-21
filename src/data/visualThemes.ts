import type { Character, Enemy } from '../types';
import { assetUrl } from '../utils/assetPaths';
import { HIGH_SCHOOL_STARTER_REPLACEMENTS } from './highSchoolCards';

export type VisualThemeId = 'elementary' | 'high-school';
export type HighSchoolHeroAction = 'idle' | 'attack' | 'skill';
export type HighSchoolEnemyAction = HighSchoolHeroAction;

const HIGH_SCHOOL_CHARACTER_NAMES = [
  '反逆の高校生',
  '生物部の先輩',
  '謎めく転入生',
  '化学研究会長',
  'バスケ部エース',
  '放送部ディレクター',
  '文芸部書記',
  '学食の料理長',
  '園芸部部長',
];

export const getThemedCharacters = (characters: Character[], theme: VisualThemeId): Character[] => {
  if (theme !== 'high-school') return characters;
  return characters.map((character, index) => ({
    ...character,
    name: HIGH_SCHOOL_CHARACTER_NAMES[index] ?? character.name,
    imageData: assetUrl(`sprites/high-school/characters/${index % 9}.png`),
    deckTemplate: character.deckTemplate.map(cardId => HIGH_SCHOOL_STARTER_REPLACEMENTS[cardId] ?? cardId),
  }));
};

const HIGH_SCHOOL_CHARACTER_INDEX_BY_ID: Record<string, number> = {
  WARRIOR: 0,
  CARETAKER: 1,
  ASSASSIN: 2,
  MAGE: 3,
  DODGEBALL: 4,
  BARD: 5,
  LIBRARIAN: 6,
  CHEF: 7,
  GARDENER: 8,
};

export const getHighSchoolCharacterSpritePath = (
  characterId: string | undefined,
  action: HighSchoolHeroAction,
) => {
  const imageIndex = HIGH_SCHOOL_CHARACTER_INDEX_BY_ID[characterId ?? 'WARRIOR'] ?? 0;
  const folder = action === 'idle' ? 'characters' : `characters-${action}`;
  return assetUrl(`sprites/high-school/${folder}/${imageIndex}.png`);
};

export const HIGH_SCHOOL_ENEMY_VARIANTS = [
  { name: '予備校の亡霊', imageIndex: 0 },
  { name: '風紀委員の騎士', imageIndex: 1 },
  { name: '模試答案の怪物', imageIndex: 2 },
  { name: '噂話の影', imageIndex: 3 },
  { name: '部活主将の残像', imageIndex: 4 },
  { name: 'スマホの幽鬼', imageIndex: 5 },
  { name: '化学室の異常体', imageIndex: 6 },
  { name: '奨学金の死神', imageIndex: 7 },
  { name: '期末試験の覇王', imageIndex: 8 },
  { name: '進路相談の小鬼', imageIndex: 9 },
  { name: '宿題運搬ロボ', imageIndex: 10 },
  { name: '保健室の鏡怪', imageIndex: 11 },
  { name: '補習時間の亡霊', imageIndex: 12 },
  { name: '赤点竜', imageIndex: 13 },
  { name: '購買機の魔物', imageIndex: 14 },
  { name: '黒板鳥', imageIndex: 15 },
  { name: '居残りの影', imageIndex: 16 },
  { name: '終業ベルの番人', imageIndex: 17 },
] as const;

const HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS = [
  { name: '監督官の先輩', imageIndex: 0 },
  { name: '剣道部の風紀委員', imageIndex: 1 },
  { name: '白衣の査問官', imageIndex: 2 },
  { name: '禁書管理の書記', imageIndex: 3 },
  { name: '銀髪の審査員', imageIndex: 4 },
  { name: '鎖の執行部員', imageIndex: 5 },
  { name: '赤章の副会長', imageIndex: 6 },
  { name: '実験区画の主任', imageIndex: 7 },
  { name: '表彰台の王子', imageIndex: 8 },
  { name: '紅衣の監察官', imageIndex: 9 },
  { name: '冬制服の支配者', imageIndex: 10 },
  { name: '紫扇の評議員', imageIndex: 11 },
  { name: '黒翼の番長', imageIndex: 12 },
  { name: '卒業審査の理事', imageIndex: 13 },
  { name: '進路指導室の総裁', imageIndex: 14 },
] as const;

const getStableIndex = (text: string, size: number) => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash % size;
};

export const getHighSchoolEnemyVariant = (enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>) => {
  const humanoid = getHighSchoolHumanoidEnemyVariant(enemy);
  if (humanoid) return humanoid;
  if (enemy.enemyType === 'THE_HEART') {
    return enemy.phase === 2
      ? { name: '卒業審査の深層', imageIndex: 8 }
      : { name: '進路指導室の支配者', imageIndex: 8 };
  }
  return HIGH_SCHOOL_ENEMY_VARIANTS[getStableIndex(enemy.name, HIGH_SCHOOL_ENEMY_VARIANTS.length)];
};

export const getHighSchoolHumanoidEnemyVariant = (enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>) => {
  if (enemy.enemyType === 'THE_HEART') {
    return enemy.phase === 2
      ? HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS[14]
      : HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS[13];
  }
  if (enemy.enemyType === 'GUARDIAN') {
    return HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS[10 + getStableIndex(enemy.name, 3)];
  }
  if (enemy.enemyType === 'ELITE_FORCE') {
    return HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS[5 + getStableIndex(enemy.name, 5)];
  }
  if (enemy.enemyType === 'TEACHER') {
    return HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS[getStableIndex(enemy.name, 5)];
  }
  return null;
};

export const getHighSchoolHumanoidEnemySpritePath = (
  enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>,
  action: HighSchoolEnemyAction,
) => {
  const variant = getHighSchoolHumanoidEnemyVariant(enemy);
  if (!variant) return null;
  const folder = action === 'idle' ? 'humanoid-enemies' : `humanoid-enemies-${action}`;
  return assetUrl(`sprites/high-school/${folder}/${variant.imageIndex}.png`);
};

export const getThemedEnemyDisplayName = (
  enemy: Pick<Enemy, 'name' | 'enemyType' | 'phase'>,
  theme: VisualThemeId,
) => theme === 'high-school' ? getHighSchoolEnemyVariant(enemy).name : enemy.name;

export interface HighSchoolEventTheme {
  title: string;
  description: string;
  imageIndex: number;
}

export const HIGH_SCHOOL_EVENT_THEMES: HighSchoolEventTheme[] = [
  {
    title: '深夜の自習室',
    description: '誰もいない自習室に、まだ消えていないスタンドライトが一つだけ残っている。',
    imageIndex: 0,
  },
  {
    title: '屋上の夕焼け',
    description: '夕焼けの屋上に風だけが通る。少し立ち止まるにはちょうどいい。',
    imageIndex: 1,
  },
  {
    title: '模試の返却',
    description: '赤い丸が並ぶ答案が返ってきた。次の一手を考える時間だ。',
    imageIndex: 2,
  },
  {
    title: '文化祭の準備',
    description: '教室は装飾と段ボールでいっぱいだ。手伝えば何か得るものがありそうだ。',
    imageIndex: 3,
  },
  {
    title: '掲示板の廊下',
    description: '放課後の廊下に、色とりどりの部活ポスターが並んでいる。',
    imageIndex: 4,
  },
  {
    title: '化学室の事故',
    description: 'フラスコから光が噴き上がった。危険だが、珍しい成果も期待できる。',
    imageIndex: 5,
  },
  {
    title: 'コンビニ休憩',
    description: '帰り道のコンビニで少しだけ息をつく。補給するか、先を急ぐか。',
    imageIndex: 6,
  },
  {
    title: '生徒会室の資料',
    description: '生徒会室の机に、未整理の資料が高く積まれている。',
    imageIndex: 7,
  },
  {
    title: '雨の校門',
    description: '雨に煙る校門で、帰るべきか、もう少しだけ残るべきか迷う。',
    imageIndex: 8,
  },
  {
    title: '放課後の教室',
    description: '人気のない教室に、夕方の光だけが静かに残っている。',
    imageIndex: 9,
  },
  {
    title: '音楽室の夕暮れ',
    description: '人気のない音楽室で、譜面台だけが夕日を受けている。',
    imageIndex: 10,
  },
  {
    title: '体育館の忘れ物',
    description: '静かな体育館に、水筒とタオルだけが残されている。',
    imageIndex: 11,
  },
  {
    title: '図書室の灯り',
    description: '閉館後の図書室に、読みかけの本と灯りが一つ残っている。',
    imageIndex: 12,
  },
  {
    title: '雨上がりの駐輪場',
    description: '濡れた自転車が並ぶ駐輪場に、雨上がりの光が差している。',
    imageIndex: 13,
  },
  {
    title: '保健室の午後',
    description: '白いベッドとカーテンの向こうで、時間だけがゆっくり進んでいる。',
    imageIndex: 14,
  },
  {
    title: '美術室のキャンバス',
    description: '描きかけのキャンバスが、誰かの途中の決意を映している。',
    imageIndex: 15,
  },
  {
    title: '靴箱の夕風',
    description: '開け放たれた昇降口を、放課後の風が静かに抜けていく。',
    imageIndex: 16,
  },
  {
    title: '駅のベンチ',
    description: '終電前のホームに、人の気配だけが薄く残っている。',
    imageIndex: 17,
  },
  { title: '入学式の桜道', description: '桜が舞う校門に、新しい制服のざわめきが満ちている。', imageIndex: 18 },
  { title: '勧誘の中庭', description: '先輩たちの声が飛び交い、部活のチラシが春風に揺れる。', imageIndex: 19 },
  { title: '席替えのくじ', description: '教室の真ん中で、次の景色を決める小さなくじが回っている。', imageIndex: 20 },
  { title: '屋上の昼休み', description: '弁当を広げた友人たちの笑い声が、青空へ抜けていく。', imageIndex: 21 },
  { title: '相合い傘の校門', description: '雨粒の向こうで、一本の傘を分け合う二人が立ち止まる。', imageIndex: 22 },
  { title: '廊下の返却ノート', description: '教師が差し出したノートに、赤字の助言が丁寧に並んでいる。', imageIndex: 23 },
  { title: '生徒会オリエンテーション', description: '長机を囲む声の中に、学校を動かす空気が少しだけ見える。', imageIndex: 24 },
  { title: '桜掃きの放課後', description: '花びらを掃く手元に、春の終わりが静かに積もっていく。', imageIndex: 25 },
  { title: '靴箱の手紙', description: '開いた靴箱の奥に、差出人のない封筒が一通だけ残されている。', imageIndex: 26 },
  { title: '体育祭のリレー', description: '乾いた土を蹴る足音と声援が、真夏の校庭を震わせる。', imageIndex: 27 },
  { title: 'かき氷の準備室', description: '部室では氷とシロップが並び、祭り前の熱気が立ちのぼる。', imageIndex: 28 },
  { title: '試験前の勉強会', description: '図書室の机に参考書が積まれ、眠気より焦りが勝っている。', imageIndex: 29 },
  { title: '蝉時雨の窓辺', description: '窓の外の蝉と扇風機だけが、午後の時間を進めている。', imageIndex: 30 },
  { title: '水泳部の休憩', description: 'プールサイドに水滴が光り、練習後の息が少しずつ整う。', imageIndex: 31 },
  { title: '屋上の花火', description: '夜空に開く光を、言葉少なに見上げる影が並ぶ。', imageIndex: 32 },
  { title: '吹奏楽の合奏', description: '音楽室に重なる音が、まだ未完成の曲を少しずつ形にする。', imageIndex: 33 },
  { title: '夏のコンビニ前', description: '湿った夕方、買ったばかりの飲み物が手のひらを冷やす。', imageIndex: 34 },
  { title: '夕立の駐輪場', description: '屋根を打つ雨音の下で、帰れない生徒たちが空を見上げる。', imageIndex: 35 },
  { title: '文化祭の怪物づくり', description: '段ボールと絵の具の匂いの中、教室が別の世界へ変わっていく。', imageIndex: 36 },
  { title: '落葉の写生会', description: '赤い葉を追う鉛筆の線が、静かな秋を紙に留めていく。', imageIndex: 37 },
  { title: '進路相談室', description: '教師の問いかけの前で、未来が少しだけ具体的な形を持つ。', imageIndex: 38 },
  { title: '修学旅行のホーム', description: '大きな鞄と期待を抱えた列が、発車ベルを待っている。', imageIndex: 39 },
  { title: '夕焼けの野球部', description: '長い影の中で、最後の一球まで声が途切れない。', imageIndex: 40 },
  { title: '家庭科室の焼き菓子', description: '甘い香りが広がり、失敗も笑いに変わる午後になる。', imageIndex: 41 },
  { title: '新聞部の取材', description: '廊下の片隅で、質問の一つひとつが相手の輪郭を映していく。', imageIndex: 42 },
  { title: '紅葉の裏道', description: '体育館裏の道を、友人との会話がゆっくり進んでいく。', imageIndex: 43 },
  { title: '掲示板の結果発表', description: '張り出された紙の前に、人の波とため息が重なっている。', imageIndex: 44 },
  { title: '雪の朝の校門', description: '白く染まった通学路で、足音だけがいつもより柔らかい。', imageIndex: 45 },
  { title: 'ストーブ前の教室', description: '登校直後の教室に、人が少しずつ温まりに集まってくる。', imageIndex: 46 },
  { title: '冬のチャリティー', description: '飾り付けられた廊下で、手渡す品物に小さな善意が混じる。', imageIndex: 47 },
  { title: '初詣の寄り道', description: '冬休み明けの仲間たちが、境内でそれぞれの願いを結ぶ。', imageIndex: 48 },
  { title: '模試面談', description: '机の上の数字を前に、焦りと覚悟が同じ椅子に座っている。', imageIndex: 49 },
  { title: '靴箱のバレンタイン', description: '夕方の昇降口で、小さな箱が思い切りの証になる。', imageIndex: 50 },
  { title: '卒業式の花道', description: '花束と拍手の間を、三年間の時間が静かに通り過ぎていく。', imageIndex: 51 },
  { title: '卒業後の教室', description: '誰もいない教室に、夕日だけが最後まで残っている。', imageIndex: 52 },
  { title: '深夜のファミレス', description: '参考書とドリンクバーの明かりの中で、友人たちがまだ粘っている。', imageIndex: 53 },
];

export const getHighSchoolEventTheme = (title: string): HighSchoolEventTheme =>
  HIGH_SCHOOL_EVENT_THEMES[getStableIndex(title, HIGH_SCHOOL_EVENT_THEMES.length)];
