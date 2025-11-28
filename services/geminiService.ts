
// Local data lists to replace AI generation
const ENEMY_NAMES = [
  "スライム", "穢れたゴブリン", "彷徨う骸骨", "闇の司祭", "オークの戦士",
  "吸血コウモリ", "呪われた鎧", "影の暗殺者", "マッドゴーレム", "深淵の騎士",
  "狂気の魔道士", "人食い植物", "石像ガーゴイル", "亡霊騎士", "黒い霧",
  "洞窟蜘蛛", "リザードマン", "さまよう魂", "鉄の処女", "キメラ"
];

const FLAVOR_TEXTS = [
  "冷たい風が吹き抜けていく...", "暗闇から視線を感じる...", "血の匂いが充満している。",
  "遠くで何かが崩れる音がした。", "この場所は何かがおかしい...", "背筋に悪寒が走る。",
  "静寂が逆に恐ろしい...", "壁に不気味な文字が刻まれている。", "かつての冒険者の遺骨がある...", 
  "殺気が満ちている！", "水滴の落ちる音が響く。", "何かの儀式の跡がある。",
  "古い旗が揺れている。", "ここには誰もいないはずだ。", "足元がぬかるんでいる。"
];

const getRandom = (list: string[]) => list[Math.floor(Math.random() * list.length)];

// Functions match the original signature but return instantly
export const generateFlavorText = async (context: string): Promise<string> => {
  // context is ignored, just return random atmospheric text
  return getRandom(FLAVOR_TEXTS);
};

export const generateEnemyName = async (floor: number): Promise<string> => {
  return getRandom(ENEMY_NAMES);
};
