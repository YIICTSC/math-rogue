import { CardType, TargetType, type Card } from '../types';

export const DODOMEDESU_EVENT_STAGE_FLAG = 'DODOMEDESU_EVENT_STAGE';
export const DODOMEDESU_BOSS_READY_FLAG = 'DODOMEDESU_BOSS_READY';
export const DODOMEDESU_BOSS_ACTIVE_FLAG = 'DODOMEDESU_BOSS_ACTIVE';
export const DODOMEDESU_NAME = 'ドドメデス';
export const GENZO_NAME = 'ゲンゾー';

const dodomedesuCard = (illustrationPath: string, card: Omit<Card, 'id' | 'visualTheme' | 'illustrationRefs'>): Omit<Card, 'id'> => ({
  ...card,
  visualTheme: 'high-school',
  illustrationRefs: [`asset:${illustrationPath}`],
});

export const DODOMEDESU_REWARD_CARDS: Array<Omit<Card, 'id'>> = [
  dodomedesuCard('enemy-illustrations/ドドメデス.webp', { name: '最後のゲーム', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '敵全体に24ダメージ。', damage: 24, rarity: 'RARE' }),
  dodomedesuCard('enemy-illustrations/ゲンゾー-孤立.webp', { name: 'ゲンゾーの大慌て', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'カードを4枚引く。1枚捨てる。', draw: 4, promptsDiscard: 1, rarity: 'RARE' }),
  dodomedesuCard('enemy-illustrations/ドドメデス-困惑.webp', { name: 'ドドメデスの困惑', cost: 0, type: CardType.SKILL, target: TargetType.ALL_ENEMIES, description: '敵全体にへろへろ3。廃棄。', applyPower: { id: 'WEAK', amount: 3 }, exhaust: true, rarity: 'RARE' }),
  dodomedesuCard('event-illustrations/dodomedesu-event-4.webp', { name: '覚醒前夜', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'ムキムキ3。キラキラ2。', strength: 3, applyPower: { id: 'ARTIFACT', amount: 2 }, rarity: 'RARE' }),
  dodomedesuCard('event-illustrations/dodomedesu-event-5.webp', { name: '二人の覚醒', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン終了時、ブロック9を得る。', applyPower: { id: 'METALLICIZE', amount: 9 }, rarity: 'RARE' }),
];

export const DODOMEDESU_EVENT_STAGES = [
  {
    title: 'ゲンゾーとどどめの出会い',
    description: '放課後のゲーム卓で、戦士を名乗るゲンゾーと、いつもの調子で笑うどどめに出会った。二人はとても友好的で、一緒に遊ぼうと手招きしている。',
  },
  {
    title: 'ゲンゾーの勝負論',
    description: '再会したゲンゾーは「遊びにも限界を越える瞬間が必要だ」と熱く語る。どどめは目を輝かせ、その言葉を何度も繰り返した。',
  },
  {
    title: 'どどめの危険なひらめき',
    description: 'どどめの話は少しずつ破綻し始めた。「全部のルールを同時に使えば、ずっと終わらない最高のゲームになる」。ゲンゾーは満足そうにうなずく。',
  },
  {
    title: '覚醒前夜',
    description: 'ゲンゾーはどどめの頭上に立ち、心の奥に眠る力を呼び起こそうとしている。止めるべきか、二人の選んだ遊びを見届けるべきか。',
  },
  {
    title: 'ドドメデス覚醒',
    description: '渦巻く空の下、どどめの姿が巨大に変わる。頭上には戦士ゲンゾー。二人は「最後のゲームを始めよう」と、こちらへ勝負を挑んだ。',
  },
] as const;

