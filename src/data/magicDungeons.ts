export interface MagicDungeon {
  id: string;
  chapter: number;
  name: string;
  attribute: string;
  enemyStart: number;
  enemyCount: number;
  bossIndex?: number;
  requiredWins: number;
  cgId: string;
}

export const MAGIC_DUNGEONS: MagicDungeon[] = [
  { id: 'STAR_TEMPLE', chapter: 1, name: '星の神殿', attribute: '星', enemyStart: 0, enemyCount: 6, requiredWins: 2, cgId: 'C011' },
  { id: 'FLOWER_MAZE', chapter: 2, name: '花の迷宮', attribute: '花', enemyStart: 6, enemyCount: 6, requiredWins: 2, cgId: 'C013' },
  { id: 'MOON_GARDEN', chapter: 3, name: '月光庭園', attribute: '月', enemyStart: 12, enemyCount: 6, requiredWins: 3, cgId: 'C012' },
  { id: 'CLOCK_TOWER', chapter: 4, name: '時の時計塔', attribute: '時', enemyStart: 18, enemyCount: 6, requiredWins: 3, cgId: 'C016' },
  { id: 'ABYSS_LIBRARY', chapter: 5, name: '深淵図書館', attribute: '闇', enemyStart: 24, enemyCount: 7, requiredWins: 3, cgId: 'C015' },
  { id: 'DARK_THEATER', chapter: 6, name: '闇の劇場', attribute: '夢', enemyStart: 31, enemyCount: 7, requiredWins: 4, cgId: 'C018' },
  { id: 'DEMON_CASTLE', chapter: 7, name: '魔王城', attribute: '禁', enemyStart: 38, enemyCount: 7, bossIndex: 20, requiredWins: 4, cgId: 'C027' },
  { id: 'TRUE_WORLD', chapter: 8, name: '真エンド異世界', attribute: '光', enemyStart: 0, enemyCount: 45, bossIndex: 21, requiredWins: 5, cgId: 'T007' },
];

export const MAGIC_MONSTER_NAMES = [
  '呪われたチョークインプ', '浮遊する魔導書ミミック', '水晶スライム', '黒板の精霊',
  'ほうきゴーレム', 'インクの小悪魔', '護符コウモリ', '燭台の火精', '魔法球クローラー',
  'ステンドグラス蝶', '生きた大釜', '月影ウサギ', '羽根ペン蛇', '仮面の亡霊',
  'ルーン亀', '星菓子獣', '時計仕掛けの小人', '裂けた外套',
  '呪鏡の欠片獣', '傘の妖魔', '灯籠クラゲ', '折紙ドラゴン', '魔法絨毯マンタ',
  '宝石甲虫', '髑髏花', '幽霊楽器', '雷雲の使い魔', 'ぬいぐるみキメラ',
  '呪いのティーカップ', '魔法陣カタツムリ', 'プリズムアイ', '魔茸の群落',
  '小ガーゴイル', '生きた星図', '薬瓶クラブ', '封印巻物虫',
  '氷杖インプ', '呪いの音楽箱', '小さな不死鳥', '月光羊',
  '鎖の魔眼書', '魔鋏マンティス', '紫水晶の狼', '封印ゼリー', '壊れた杖の案山子',
];

export const MAGIC_HUMANOID_NAMES = [
  '見習い魔女', '仮面の魔法剣士', 'ルーン司書', '水晶錬金術師', '影の奇術師',
  '月社の祓魔師', '茨園の魔女', '鐘の召喚士', '呪娃の人形師', '炎厨房の魔導士',
  '重盾の魔法騎士', '紙嵐の忍術師', '鏡の幻術師', '雷楽団の指揮者', '氷鏡の槍騎士',
  '獣面の地術師', '時計塔の時術師', '灯火の死霊学者', '星見の弓術師', '禁術風紀長',
  '大魔女校長', '星界災厄の女王',
];

