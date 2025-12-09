import { ENEMY_LIBRARY } from '../constants';

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
  // Get all enemy names but exclude the boss name so it doesn't appear as a standard mob
  const names = Object.keys(ENEMY_LIBRARY).filter(name => name !== "校長先生");
  return getRandom(names);
};
