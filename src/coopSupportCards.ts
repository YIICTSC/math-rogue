import { CoopSupportCard } from './types';

export const COOP_SUPPORT_LIBRARY: CoopSupportCard[] = [
  { id: 'coop-cheer', effectId: 'ALLY_HEAL', name: '応援エール', description: '味方1人のHPを10回復する。', rarity: 'COMMON' },
  { id: 'coop-iron-wall', effectId: 'ALLY_BLOCK', name: '鉄壁サポート', description: '味方1人にブロック20を与える。', rarity: 'COMMON' },
  { id: 'coop-energy-drink', effectId: 'ALLY_NEXT_ENERGY', name: '元気ドリンク', description: '味方1人の次のターンのエナジーを1増やす。', rarity: 'UNCOMMON' },
  { id: 'coop-inspiration-note', effectId: 'ALLY_DRAW', name: 'ひらめきメモ', description: '味方1人がカードを2枚引く。', rarity: 'COMMON' },
  { id: 'coop-brave-baton', effectId: 'ALLY_ATTACK_BOOST', name: '勇気のバトン', description: '味方1人の次の攻撃ダメージを強化する。', rarity: 'UNCOMMON' },
  { id: 'coop-lucky-charm', effectId: 'ALLY_BUFFER', name: 'ラッキーお守り', description: '味方1人が次に受けるダメージを0にする。', rarity: 'UNCOMMON' },
  { id: 'coop-deep-breath', effectId: 'TEAM_CLEANSE', name: 'みんなで深呼吸', description: '味方全体の弱体・脆弱・毒をそれぞれ1軽減する。', rarity: 'UNCOMMON' },
  { id: 'coop-school-lunch', effectId: 'TEAM_HEAL', name: 'チーム給食', description: '味方全体のHPを5回復する。', rarity: 'UNCOMMON' },
  { id: 'coop-bandage', effectId: 'REVIVE_BANDAGE', name: '救急ばんそうこう', description: '戦闘不能の味方1人をHP15で復活させる。', rarity: 'RARE' },
  { id: 'coop-miracle', effectId: 'REVIVE_NURSE', name: '保健室の奇跡', description: '戦闘不能の味方1人を最大HPの25%で復活し、ブロック10を与える。', rarity: 'RARE' }
];

export const getRandomCoopSupportCard = (): CoopSupportCard => {
  const roll = Math.random() * 100;
  const rarity =
    roll > 93 ? 'RARE'
      : roll > 58 ? 'UNCOMMON'
        : 'COMMON';
  const pool = COOP_SUPPORT_LIBRARY.filter(card => card.rarity === rarity);
  return { ...(pool[Math.floor(Math.random() * pool.length)] || COOP_SUPPORT_LIBRARY[0]) };
};
