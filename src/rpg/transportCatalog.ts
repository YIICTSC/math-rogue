export const WATERCRAFT = {
  rowboat: { name: ['手こぎボート', 'Rowboat', 'てこぎボート'], slots: 0, speed: 5.2 },
  cargo_boat: { name: ['チェスト付きボート', 'Chest boat', 'チェストつきボート'], slots: 12, speed: 4.8 },
  bamboo_raft: { name: ['竹いかだ', 'Bamboo raft', 'たけいかだ'], slots: 0, speed: 4 },
  cargo_raft: { name: ['貨物いかだ', 'Cargo raft', 'かもついかだ'], slots: 20, speed: 3.6 },
} as const;

export type WatercraftItem = keyof typeof WATERCRAFT;

export function isWatercraftItem(item: unknown): item is WatercraftItem {
  return typeof item === 'string' && Object.hasOwn(WATERCRAFT, item);
}

export const WATERCRAFT_LIMIT = 48;
export const GLIDER_SPEED = 5.4;
export const GLIDER_DESCENT = 1.65;
export const GLIDER_BOOST_SECONDS = 2;
