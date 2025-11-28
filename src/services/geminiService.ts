
// Local data lists to replace AI generation
export const ENEMY_NAMES = [
  // 低層・雑魚
  "野良犬", "意地悪なカラス", "消しゴムのカス", "グレムリン", "スズメバチ", 
  "掃除サボり魔", "迷子の幽霊", "暴走した三輪車", "凶暴なハムスター",
  "画鋲の妖精", "埃の塊", "放置された傘",

  // 中層・強敵
  "宿題の悪魔", "給食泥棒", "動く人体模型", "トイレの花子さん",
  "イジワルな上級生", "リコーダーの亡霊", "チョーク・ゴーレム", 
  "跳び箱ミミック", "反復横跳びマン", "図書室の主",

  // エリート・高層
  "体育の先生", "教頭先生", "終わらない宿題", "伝説の不良",
  "激怒した用務員さん", "修学旅行の枕投げ", "校門の守護者"
];

const FLAVOR_TEXTS = [
  "チャイムが鳴り響く...", "廊下の奥から視線を感じる...", "給食のいい匂いがする。",
  "遠くでボールの音がした。", "この教室は何かがおかしい...", "背筋に悪寒が走る。",
  "静寂が逆に恐ろしい...", "黒板に不気味な文字が書かれている。", "忘れ物が落ちている...", 
  "殺気が満ちている！", "水道の蛇口から水が漏れている。", "チョークの粉が舞っている。",
  "カーテンが揺れている。", "ここには誰もいないはずだ。", "上履きが片方ない..."
];

const getRandom = (list: string[]) => list[Math.floor(Math.random() * list.length)];

// Functions match the original signature but return instantly
export const generateFlavorText = async (context: string): Promise<string> => {
  return getRandom(FLAVOR_TEXTS);
};

export const generateEnemyName = async (floor: number): Promise<string> => {
  // Simple scaling: harder names for deeper floors could be implemented here,
  // but for now random selection from the pool is fine as stats scale numerically.
  return getRandom(ENEMY_NAMES);
};
