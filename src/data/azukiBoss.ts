import { CardType, TargetType, type Card } from '../types';

export const AZUKI_BOSS_NAME = 'あずき';
export const AZUKI_ENCOUNTER_FLAG = 'AZUKI_ENCOUNTERED';
export const AZUKI_BOSS_FLAG = 'AZUKI_BOSS_ACTIVE';

const azukiCard = (
  illustrationPath: string,
  card: Omit<Card, 'id' | 'visualTheme' | 'enemyIllustrationName' | 'enemyIllustrationEnemyType' | 'illustrationRefs'>
): Omit<Card, 'id'> => ({
  ...card,
  visualTheme: 'high-school',
  illustrationRefs: [`asset:${illustrationPath}`],
});

export const AZUKI_REWARD_CARDS: Array<Omit<Card, 'id'>> = [
  azukiCard('sprites/high-school/azuki/pounce.webp', { name: 'あずきのじゃれつき', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '16ダメージ。ブロック8。', damage: 16, block: 8, rarity: 'RARE' }),
  azukiCard('sprites/high-school/azuki/idle.webp', { name: 'ふわふわガード', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック20。次のターン、1枚引く。', block: 20, nextTurnDraw: 1, rarity: 'RARE' }),
  azukiCard('sprites/high-school/azuki/charge.webp', { name: 'あずきダッシュ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '11ダメージを2回。', damage: 11, playCopies: 1, rarity: 'RARE' }),
  azukiCard('sprites/high-school/azuki/howl.webp', { name: 'わんわんエール', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ムキムキ3。カチカチ3。', strength: 3, applyPower: { id: 'DEXTERITY', amount: 3 }, rarity: 'RARE' }),
  azukiCard('event-illustrations/あずきとの出会い.webp', { name: 'おさんぽ日和', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'カードを3枚引く。HPを8回復。廃棄。', draw: 3, heal: 8, exhaust: true, rarity: 'RARE' }),
  azukiCard('sprites/high-school/azuki/alert.webp', { name: 'まもってあげる', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック30。キラキラ1。', block: 30, applyPower: { id: 'ARTIFACT', amount: 1 }, rarity: 'RARE' }),
  azukiCard('sprites/high-school/azuki/defeated.webp', { name: 'しっぽの約束', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン終了時、ブロック6を得る。', applyPower: { id: 'METALLICIZE', amount: 6 }, rarity: 'RARE' }),
];

