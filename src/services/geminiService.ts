

// Local data lists to replace AI generation
export const ENEMY_NAMES = [
  // Tier 1: Small/Cute/Weak
  "野良犬", "意地悪なカラス", "消しゴムのカス", "グレムリン", "スズメバチ", 
  "掃除サボり魔", "迷子の幽霊", "暴走した三輪車", "凶暴なハムスター",
  "画鋲の妖精", "埃の塊", "放置された傘", "裏庭のミミズ", "給食の残りカス",
  "校庭の雑草", "ちぎれたノート", "さまよう上履き", "水槽の金魚",
  "忘れられたリコーダー", "実験失敗スライム",

  // Tier 2: Medium/Strange
  "宿題の悪魔", "給食泥棒", "動く人体模型", "トイレの花子さん",
  "イジワルな上級生", "リコーダーの亡霊", "チョーク・ゴーレム", 
  "跳び箱ミミック", "反復横跳びマン", "図書室の主", "音楽室の肖像画",
  "理科室の骸骨", "家庭科室の包丁", "プールサイドの影", "焼却炉の精霊",
  "放送室の怪人", "保健室の偽医者", "体育館のバスケットボール", "呪いの日本人形",
  "巨大ムカデ",

  // Tier 3: Elite/Strong/Abstract
  "体育の先生", "教頭先生", "終わらない宿題", "伝説の不良",
  "激怒した用務員さん", "修学旅行の枕投げ", "校門の守護者", "PTA会長",
  "期末テストの化身", "部活の鬼顧問", "無限の廊下", "真夜中のチャイム",
  "卒業式の幻影", "通知表の悪夢", "闇の教育委員会", "伝説の用務員",
  "禁断の参考書", "校舎の古龍", "時間を食べる時計", "異界からの転校生"
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
  return getRandom(ENEMY_NAMES);
};
