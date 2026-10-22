import { KOCHO_ADVANCED_CARDS, type HeroTechnique } from './techniques';
export type KochoHeroId = 'original' | 'rebel' | 'akari';
export const KOCHO_HEROES = [
  { id: 'original', name: '赤ジャージの勇者', subtitle: '学用品で戦う、いつもの主人公', condition: '最初から使用できます', portrait: 'sprites/kocho/original-portrait.webp' },
  { id: 'rebel', name: '叛逆の高校生', subtitle: '突進と反撃で道を切り開く', condition: '既存主人公で校長を倒すと解放', portrait: 'sprites/high-school/characters/0.webp' },
  { id: 'akari', name: '星宮あかり', subtitle: '星の魔法で攻撃・防御・回復', condition: '叛逆の高校生で校長を倒すと解放', portrait: 'sprites/magic/characters/heroine-01-before.webp' },
] as const;
export const normalizeKochoHero = (value: unknown): KochoHeroId => value === 'rebel' || value === 'akari' ? value : 'original';
export const getKochoHero = (value: unknown) => KOCHO_HEROES.find(h => h.id === normalizeKochoHero(value))!;
export const unlockedKochoHeroes = (cleared: readonly string[]): KochoHeroId[] => [
  'original', ...(cleared.includes('original') ? ['rebel' as const] : []),
  ...(cleared.includes('original') && cleared.includes('rebel') ? ['akari' as const] : []),
];

export interface GuestCard {
  hero: Exclude<KochoHeroId, 'original'>; art: number; name: string;
  type: 'ATTACK' | 'MOVE' | 'UTILITY'; range: number[]; damage: number;
  shield?: number; cooldown: number; color: string; description: string;
  energyCost: number; maxSlots: number;
  effectType?: 'NORMAL' | 'DASH_ATTACK' | 'PIERCE_DASH' | 'PIERCE' | 'COUNTER' | 'STUN' | 'HEAL' | 'PUSH' | 'PULL' | 'RECOIL' | 'FURTHEST' | 'DRAIN';
  technique?: HeroTechnique;
  minStage?: number;
  englishName?: string; englishDescription?: string; hiraganaName?: string; hiraganaDescription?: string;
}
export const KOCHO_GUEST_CARDS: GuestCard[] = [
  { hero:'rebel', art:1, name:'叛逆ナックル', type:'ATTACK', range:[1], damage:4, cooldown:2, color:'bg-red-700', description:'目の前の敵に4ダメージ', energyCost:1, maxSlots:3, effectType:'NORMAL' },
  { hero:'rebel', art:2, name:'紅蓮タックル', type:'ATTACK', range:[1,2,3], damage:3, cooldown:3, color:'bg-orange-700', description:'前方3マスまで突進し、最初の敵に3ダメージ', energyCost:1, maxSlots:3, effectType:'DASH_ATTACK' },
  { hero:'rebel', art:3, name:'旋風キック', type:'ATTACK', range:[-1,1], damage:3, cooldown:3, color:'bg-rose-700', description:'前後1マスの敵すべてに3ダメージ', energyCost:1, maxSlots:3, effectType:'PIERCE' },
  { hero:'rebel', art:4, name:'不屈のガード', type:'UTILITY', range:[0], damage:0, shield:4, cooldown:3, color:'bg-slate-700', description:'シールドを4獲得', energyCost:1, maxSlots:3 },
  { hero:'rebel', art:5, name:'反撃の拳', type:'ATTACK', range:[1], damage:2, cooldown:3, color:'bg-red-800', description:'目の前の敵に2ダメージ。攻撃態勢か行動まで1ターン以下の敵には3倍', energyCost:1, maxSlots:3, effectType:'COUNTER' },
  { hero:'rebel', art:6, name:'校則ブレイカー', type:'ATTACK', range:[1,2,3], damage:4, cooldown:5, color:'bg-rose-900', description:'前方3マスの敵すべてに4ダメージ', energyCost:1, maxSlots:2, effectType:'PIERCE' },
  { hero:'akari', art:1, name:'星のひかり', type:'ATTACK', range:[1,2,3,4], damage:2, cooldown:2, color:'bg-amber-600', description:'前方4マスまでの最初の敵に2ダメージ', energyCost:1, maxSlots:3, effectType:'NORMAL' },
  { hero:'akari', art:2, name:'スターダッシュ', type:'MOVE', range:[1,2], damage:0, cooldown:2, color:'bg-sky-700', description:'前方へ最大2マス移動。敵の手前で止まる', energyCost:1, maxSlots:2 },
  { hero:'akari', art:3, name:'星杖ストライク', type:'ATTACK', range:[1], damage:3, cooldown:3, color:'bg-pink-700', description:'目の前の敵に3ダメージ。敵の行動を1ターン遅らせる', energyCost:1, maxSlots:3, effectType:'STUN' },
  { hero:'akari', art:4, name:'星座シールド', type:'UTILITY', range:[0], damage:0, shield:4, cooldown:3, color:'bg-violet-700', description:'シールドを4獲得', energyCost:1, maxSlots:3 },
  { hero:'akari', art:5, name:'星のいやし', type:'UTILITY', range:[0], damage:0, cooldown:4, color:'bg-emerald-700', description:'HPを3回復。最大HPは超えない', energyCost:1, maxSlots:2, effectType:'HEAL' },
  { hero:'akari', art:6, name:'スターライトレイ', type:'ATTACK', range:[1,2,3,4], damage:3, cooldown:5, color:'bg-indigo-700', description:'前方4マスの敵すべてに3ダメージ', energyCost:1, maxSlots:2, effectType:'PIERCE' },
  ...KOCHO_ADVANCED_CARDS,
];
export const kochoGuestAsset = (hero: Exclude<KochoHeroId, 'original'>, pose: number) => `sprites/kocho/${hero}-${pose}.webp`;
export const kochoGroundAsset = (stage: number, endlessFloor = 0) => {
  const themes = [0,1,3,4,2,1,5];
  return `sprites/kocho/ground-${endlessFloor ? (endlessFloor - 1) % 6 : themes[Math.max(0, Math.min(6, stage - 1))]}.webp`;
};
