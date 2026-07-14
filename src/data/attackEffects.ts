import { AttackEffectKey, Card, TargetType } from '../types';

export type AttackEffectDefinition = {
    key: AttackEffectKey;
    label: string;
    row: number;
    frames: number;
    frameMs: number;
};

export const ATTACK_EFFECT_COLUMNS = 4;

export const ATTACK_EFFECTS: Record<AttackEffectKey, AttackEffectDefinition> = {
    slash: { key: 'slash', label: '斬撃', row: 0, frames: 4, frameMs: 75 },
    impact: { key: 'impact', label: '打撃', row: 1, frames: 4, frameMs: 75 },
    projectile: { key: 'projectile', label: '投てき', row: 2, frames: 4, frameMs: 75 },
    fire: { key: 'fire', label: '火炎', row: 3, frames: 4, frameMs: 80 },
    lightning: { key: 'lightning', label: '電撃', row: 4, frames: 4, frameMs: 70 },
    poison: { key: 'poison', label: '毒', row: 5, frames: 4, frameMs: 90 },
    shockwave: { key: 'shockwave', label: '衝撃波', row: 6, frames: 4, frameMs: 80 },
    multihit: { key: 'multihit', label: '連撃', row: 7, frames: 4, frameMs: 65 },
    drain: { key: 'drain', label: '吸収/回復', row: 8, frames: 4, frameMs: 90 },
    finisher: { key: 'finisher', label: '決め技/成長', row: 9, frames: 4, frameMs: 85 },
    laser: { key: 'laser', label: 'レーザー', row: 10, frames: 4, frameMs: 65 },
    soundwave: { key: 'soundwave', label: '音波', row: 11, frames: 4, frameMs: 80 },
    wind: { key: 'wind', label: '風/掃除', row: 12, frames: 4, frameMs: 80 },
    plant: { key: 'plant', label: '植物', row: 13, frames: 4, frameMs: 85 },
    graduation: { key: 'graduation', label: '卒業/伝説', row: 14, frames: 4, frameMs: 85 },
    explosion: { key: 'explosion', label: '爆発', row: 15, frames: 4, frameMs: 80 },
    critical: { key: 'critical', label: '会心', row: 16, frames: 4, frameMs: 70 },
    flash: { key: 'flash', label: '閃光', row: 17, frames: 4, frameMs: 65 },
};

export const ATTACK_EFFECT_LIST = Object.values(ATTACK_EFFECTS);

const includesAny = (text: string, terms: string[]) => terms.some(term => text.includes(term));

export const getMultihitFrameSequence = (hitCount: number): number[] => {
    const count = Math.max(1, Math.floor(hitCount));
    if (count === 1) return [0];
    if (count === 2) return [0, 1];
    if (count === 3) return [0, 1, 0];
    if (count === 4) return [0, 1, 0, 1];
    if (count === 5) return [0, 1, 0, 1, 2];

    const sequence = [0, 1, 2, 3];
    for (let i = 4; i < count; i++) {
        sequence.push(i % 2 === 0 ? 2 : 3);
    }
    return sequence;
};

export const getAttackEffectKeyForCard = (card: Card, hitCount = 1, defeated = false): AttackEffectKey => {
    const name = `${card.name} ${card.originalNames?.join(' ') || ''}`;
    const texture = card.textureRef || '';

    if (includesAny(name, ['卒業式', '伝説の鉛筆', '至高の盆栽'])) return 'graduation';
    if (includesAny(name, ['目からビーム', 'レーザーポインター'])) return 'laser';
    if (includesAny(name, ['大声', '終わりのチャイム'])) return 'soundwave';
    if (includesAny(name, ['台風', '大掃除', '雑巾がけ', '掃除の時間'])) return 'wind';
    if (includesAny(texture, ['PLANT']) && !includesAny(name, ['火', '炎', '爆炎'])) return 'plant';
    if (defeated && (card.fatalEnergy || card.fatalPermanentDamage || card.fatalMaxHp || card.capture)) return 'finisher';
    if (card.lifesteal || card.heal || includesAny(name, ['いただきます', 'つまみ食い', '早弁', '給食当番'])) return 'drain';
    if (card.poison || card.poisonMultiplier || includesAny(name, ['毒', 'ドク', '悪口', '毒舌'])) return 'poison';
    if (hitCount >= 3 || card.playCopies || card.hitsPerSkillInHand || card.hitsPerAttackPlayed || includesAny(name, ['往復', '袋叩き', '千本', 'グルグル'])) return 'multihit';
    if (includesAny(texture, ['FLAME']) || includesAny(name, ['火', '炎', '焼', '熱', '台風', '寒いギャグ', '口喧嘩', 'キレる'])) return 'fire';
    if (includesAny(texture, ['LIGHTNING', 'EYE']) || includesAny(name, ['雷', '電', 'ビーム', 'レーザー', '大声', 'ひらめき', '夜ふかし'])) return 'lightning';
    if (card.target === TargetType.ALL_ENEMIES || includesAny(name, ['大掃除', '卒業式', '終わりのチャイム', '衝撃'])) return 'shockwave';
    if (includesAny(texture, ['DAGGER']) || includesAny(name, ['投げ', 'ブーメラン', '火縄銃', '画鋲', '豆鉄砲', '削りかす', 'チョーク'])) return 'projectile';
    if (includesAny(texture, ['FIST', 'SHOE', 'BACKPACK', 'HUMANOID', 'BEAST']) || includesAny(name, ['パンチ', 'キック', '頭突き', 'タックル', '腕ぐるぐるアタック', 'ビンタ', 'アッパー', 'げんこつ', '防具ごと体当たり'])) return 'impact';
    if (includesAny(name, ['伝説', '学習', '黄金', '至高', '覚醒'])) return 'finisher';

    return 'slash';
};
