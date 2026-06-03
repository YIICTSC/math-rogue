import { Card, CardType, TargetType } from '../types';

export const CARD_ERASER_TEMPLATE_ID = 'CARD_ERASER';
export const CARD_ERASER_NAME = 'カード消しゴム';

export interface ErasableEffectOption {
  id: string;
  label: string;
  description: string;
}

const cleanDescription = (description: string): string =>
  description
    .replace(/。{2,}/g, '。')
    .replace(/^。/, '')
    .replace(/\s+/g, '')
    .trim();

const removeDescriptionParts = (description: string, patterns: RegExp[]): string => {
  let next = description;
  patterns.forEach(pattern => {
    next = next.replace(pattern, '');
  });
  return cleanDescription(next);
};

export const getErasableEffectOptions = (card: Card): ErasableEffectOption[] => {
  if (card.name === CARD_ERASER_NAME || card.originalNames?.includes(CARD_ERASER_NAME)) return [];
  const options: ErasableEffectOption[] = [];

  if (card.exhaust && !card.consumedOnUse) {
    options.push({ id: 'exhaust', label: '廃棄を削除', description: '使用後に廃棄されなくなる。' });
  }
  if ((card.selfDamage || 0) > 0) {
    options.push({ id: 'selfDamage', label: '自分へのダメージを削除', description: `自分に${card.selfDamage}ダメージを受けなくなる。` });
  }
  if ((card.promptsDiscard || 0) > 0) {
    options.push({ id: 'promptsDiscard', label: '手札を捨てる効果を削除', description: '追加でカードを捨てる必要がなくなる。' });
  }
  if ((card.promptsExhaust || 0) > 0) {
    options.push({ id: 'promptsExhaust', label: 'カード廃棄選択を削除', description: '追加でカードを廃棄する必要がなくなる。' });
  }
  if (card.playCondition === 'DRAW_PILE_EMPTY') {
    options.push({ id: 'drawPileEmptyCondition', label: '山札0条件を削除', description: '山札が0でなくても使えるようになる。' });
  }
  if (card.playCondition === 'HAND_ONLY_ATTACKS') {
    options.push({ id: 'handOnlyAttacksCondition', label: '手札条件を削除', description: '手札内容に関係なく使えるようになる。' });
  }
  if (card.target === TargetType.SELF && (card.vulnerable || 0) > 0) {
    options.push({ id: 'selfVulnerable', label: '自分へのびくびくを削除', description: '自分にびくびくを付与しなくなる。' });
  }
  if (card.type !== CardType.STATUS && card.unplayable) {
    options.push({ id: 'unplayable', label: '使用不可を削除', description: '戦闘中に使えるようになる。' });
  }

  return options;
};

export const eraseCardEffect = (card: Card, effectId: string): Card => {
  const next: Card = {
    ...card,
    id: `erased-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    originalNames: Array.from(new Set([...(card.originalNames || []), card.name])),
  };

  switch (effectId) {
    case 'exhaust':
      delete next.exhaust;
      next.description = removeDescriptionParts(next.description, [/廃棄。?/g, /使用後、この戦闘中はデッキから除外される。?/g]);
      break;
    case 'selfDamage':
      delete next.selfDamage;
      next.description = removeDescriptionParts(next.description, [/自分に\d+ダメージ[、。]?/g, /反動でHP-\d+[、。]?/g]);
      break;
    case 'promptsDiscard':
      delete next.promptsDiscard;
      next.description = removeDescriptionParts(next.description, [/手札\d*枚?捨てる。?/g, /手札を全て捨て、?/g, /非0コス捨てる。?/g]);
      break;
    case 'promptsExhaust':
      delete next.promptsExhaust;
      next.description = removeDescriptionParts(next.description, [/手札の[^。]*廃棄。?/g, /手札を全て廃棄。?/g, /全廃棄。?/g]);
      break;
    case 'drawPileEmptyCondition':
      delete next.playCondition;
      next.description = removeDescriptionParts(next.description, [/山札0の時のみ。?/g, /山札が0のときのみ。?/g]);
      break;
    case 'handOnlyAttacksCondition':
      delete next.playCondition;
      next.description = removeDescriptionParts(next.description, [/手札が攻撃のみの時だけ。?/g]);
      break;
    case 'selfVulnerable':
      delete next.vulnerable;
      next.description = removeDescriptionParts(next.description, [/自分にびくびく\d*を?与える。?/g]);
      break;
    case 'unplayable':
      delete next.unplayable;
      next.description = removeDescriptionParts(next.description, [/使用不可。?/g]);
      break;
  }

  if (!next.description) {
    next.description = card.description;
  }
  return next;
};
