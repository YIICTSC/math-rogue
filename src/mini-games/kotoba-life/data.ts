/** Original cast and places for Kotoba Days. Player-taught words are kept verbatim. */
export interface Localized { ja: string; en: string; kana?: string }
export const text = (value: Localized, english = false): string => english ? value.en : value.ja;
export const words = (ja: string, en: string, kana?: string): Localized => ({ ja, en, ...(kana ? { kana } : {}) });
export type CharacterId = 'mugi' | 'momo' | 'sora' | 'kohaku' | 'pico';
export type RoomId = 'sunroom' | 'tatami' | 'loft' | 'seaside' | 'forest' | 'atelier' | 'rainy' | 'attic';
export type NpcId = 'bakery' | 'florist' | 'station';
export type WordCategory = 'food' | 'place' | 'activity' | 'feeling' | 'thing' | 'person';

export const CHARACTERS: ReadonlyArray<{
  id: CharacterId; name: Localized; species: string; description: Localized;
  color: string; accent: string;
}> = [
  { id: 'mugi', name: words('むぎ', 'Mugi'), species: 'capybara', description: words('のんびり屋のカピバラ。おやつと、何もしない時間が好き。', 'An easygoing capybara who loves snacks and doing absolutely nothing.'), color: '#c99c71', accent: '#e6ba73' },
  { id: 'momo', name: words('もも', 'Momo'), species: 'rabbit', description: words('空想好きのうさぎ。小さな発見を大きな物語にする。', 'An imaginative rabbit who turns tiny discoveries into grand stories.'), color: '#ebd8d1', accent: '#d895a8' },
  { id: 'sora', name: words('そら', 'Sora'), species: 'otter', description: words('好奇心いっぱいのカワウソ。なんでも試して確かめたい。', 'A curious otter who learns by trying things out.'), color: '#97735e', accent: '#8ab9c1' },
  { id: 'kohaku', name: words('こはく', 'Kohaku'), species: 'fox', description: words('ちょっぴり照れ屋のきつね。好きなものは、そっと大切に。', 'A shy fox who quietly treasures favorite things.'), color: '#d39a64', accent: '#8ca88c' },
  { id: 'pico', name: words('ぴこ', 'Pico'), species: 'penguin', description: words('まじめで、おっちょこちょいなペンギン。毎日が小さな研究。', 'An earnest, delightfully clumsy penguin. Every day is a little experiment.'), color: '#718f9f', accent: '#e3bb71' },
];

export const ROOMS: ReadonlyArray<{ id: RoomId; name: Localized; description: Localized; image: string }> = [
  { id: 'sunroom', name: words('木漏れ日の部屋', 'Sunlit room'), description: words('あたたかい光と、白いカーテン。', 'Warm light and white curtains.') },
  { id: 'tatami', name: words('畳の小部屋', 'Tatami nook'), description: words('畳の香りに、ほっとひと息。', 'A quiet pause on fresh tatami.') },
  { id: 'loft', name: words('街のロフト', 'City loft'), description: words('窓の向こうは、いつもの街。', 'An everyday neighborhood beyond the window.') },
  { id: 'seaside', name: words('海辺の家', 'Seaside home'), description: words('潮風が、午後をゆっくり運ぶ。', 'A sea breeze carries the afternoon along.') },
  { id: 'forest', name: words('森のコテージ', 'Forest cottage'), description: words('緑に囲まれた、小さな隠れ家。', 'A little hideaway surrounded by green.') },
  { id: 'atelier', name: words('小さなアトリエ', 'Little atelier'), description: words('絵の具と本と、作りかけの夢。', 'Paint, books, and dreams in progress.') },
  { id: 'rainy', name: words('雨音の部屋', 'Rainy-day room'), description: words('窓を流れる雨を、一緒に眺めよう。', 'Watch the rain trickle down the window together.') },
  { id: 'attic', name: words('屋根裏の部屋', 'Attic retreat'), description: words('斜めの天井と、星の見える窓。', 'A sloping ceiling and a window to the stars.') },
].map(room => ({ ...room, id: room.id as RoomId, image: `/sprites/kotoba-life/rooms/${room.id}.webp` }));

export const NPCS: ReadonlyArray<{ id: NpcId; name: Localized; role: Localized; place: Localized; image: string }> = [
  { id: 'bakery', name: words('川村さん', 'Ms. Kawamura'), role: words('パン屋さん', 'Baker'), place: words('角のパン屋', 'Corner bakery'), image: '/sprites/kotoba-life/town/bakery.webp' },
  { id: 'florist', name: words('佐伯さん', 'Mr. Saeki'), role: words('花屋さん', 'Florist'), place: words('駅前の花屋', 'Station florist'), image: '/sprites/kotoba-life/town/florist.webp' },
  { id: 'station', name: words('中村さん', 'Mr. Nakamura', 'なかむらさん'), role: words('まちの案内人', 'Neighborhood guide'), place: words('小さな駅前', 'Little station square'), image: '/sprites/kotoba-life/town/station.webp' },
];

export const WORD_CATEGORIES: ReadonlyArray<{ id: WordCategory; label: Localized }> = [
  { id: 'food', label: words('食べもの', 'Food') },
  { id: 'place', label: words('場所', 'Place') },
  { id: 'activity', label: words('すること', 'Activity') },
  { id: 'feeling', label: words('気持ち', 'Feeling') },
  { id: 'thing', label: words('もの', 'Thing') },
  { id: 'person', label: words('人・なまえ', 'Person / name') },
];

export const CHARACTER_IDS = CHARACTERS.map(character => character.id);
export const ROOM_IDS = ROOMS.map(room => room.id);
export const NPC_IDS = NPCS.map(npc => npc.id);
export const CATEGORY_IDS = WORD_CATEGORIES.map(category => category.id);
