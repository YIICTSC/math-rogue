import React from 'react';
import { X } from 'lucide-react';
import { Card as ICard, LanguageMode } from '../types';
import { buildEnglishCardDescription, trans } from '../utils/textUtils';
import Card, { KEYWORD_DEFINITIONS } from './Card';
import { toAge9BattleText, transBattle } from '../utils/ageRatingCopy';

interface CardInspectionModalProps {
  card: ICard;
  languageMode: LanguageMode;
  onClose: () => void;
  onOpenArt?: (card: ICard) => void;
}

const getCardKeywords = (card: ICard) => {
  const keywords = [];
  if (card.consumedOnUse) keywords.push(KEYWORD_DEFINITIONS.CONSUMED_ON_USE);
  if (card.exhaust && !card.consumedOnUse) keywords.push(KEYWORD_DEFINITIONS.EXHAUST);
  if (card.strength || card.description.includes('ムキムキ')) keywords.push(KEYWORD_DEFINITIONS.STRENGTH);
  if (card.vulnerable || card.description.includes('びくびく')) keywords.push(KEYWORD_DEFINITIONS.VULNERABLE);
  if (card.weak || card.description.includes('へろへろ')) keywords.push(KEYWORD_DEFINITIONS.WEAK);
  if (card.block || card.description.includes('ブロック')) keywords.push(KEYWORD_DEFINITIONS.BLOCK);
  if (card.draw || card.description.includes('引く')) keywords.push(KEYWORD_DEFINITIONS.DRAW);
  return keywords;
};

const getProcessedDescription = (card: ICard, languageMode: LanguageMode) => {
  if (languageMode === 'ENGLISH') return toAge9BattleText(buildEnglishCardDescription(card), languageMode);

  let desc = trans(card.description, languageMode);
  if (card.magicBoostedEffectText) return desc;
  if (card.damage !== undefined) desc = desc.replace(/(\d+)ダメージ/g, `${card.damage}${trans('ダメージ', languageMode)}`);
  if (card.block !== undefined) desc = desc.replace(/ブロック(\d+)/g, `${trans('ブロック', languageMode)}${card.block}`);
  if (card.poison !== undefined) desc = desc.replace(/ドクドク(\d+)/g, `${trans('ドクドク', languageMode)}${card.poison}`);
  if (card.weak !== undefined) desc = desc.replace(/へろへろ(\d+)/g, `${trans('へろへろ', languageMode)}${card.weak}`);
  if (card.vulnerable !== undefined) desc = desc.replace(/びくびく(\d+)/g, `${trans('びくびく', languageMode)}${card.vulnerable}`);
  if (card.strength !== undefined) desc = desc.replace(/ムキムキ(\d+)/g, `${trans('ムキムキ', languageMode)}${card.strength}`);
  return toAge9BattleText(desc, languageMode);
};

const CardInspectionModal: React.FC<CardInspectionModalProps> = ({ card, languageMode, onClose, onOpenArt }) => (
  <div
    className="app-modal-overlay app-card-inspection-modal-overlay fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div
      className="app-card-inspection-card-preview scale-125 md:scale-[1.85] mb-10 transform transition-transform cursor-zoom-in"
      onClick={(event) => {
        event.stopPropagation();
        onOpenArt?.(card);
      }}
      title={trans('タッチでイラスト拡大', languageMode)}
    >
      <Card card={card} onClick={() => {}} disabled={false} languageMode={languageMode} />
    </div>
    <div
      className="app-modal-panel app-card-inspection-detail bg-gray-800 border-2 border-white p-4 md:p-6 rounded-lg max-w-sm w-full shadow-2xl relative max-h-[50vh] overflow-y-auto custom-scrollbar"
      onClick={(event) => event.stopPropagation()}
    >
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white p-2">
        <X size={24} />
      </button>
      <h3 className="text-2xl font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-2">
        {card.holographic ? `${trans('キラ', languageMode)} ` : ''}{transBattle(card.name, languageMode)}{card.upgraded ? '+' : ''}
      </h3>
      <div className="flex gap-2 mb-4 text-xs text-gray-400 font-mono">
        <span className="bg-blue-900/50 px-2 py-1 rounded border border-blue-500/30">
          {trans('コスト', languageMode)}: {card.cost}
        </span>
        <span className="bg-purple-900/50 px-2 py-1 rounded border border-purple-500/30">
          {transBattle(card.type, languageMode)}
        </span>
        {card.holographic && (
          <span className="bg-cyan-900/60 px-2 py-1 rounded border border-cyan-300/50 text-cyan-100">
            {trans('キラ', languageMode)}
          </span>
        )}
      </div>
      <p className="text-lg text-white mb-6 leading-relaxed whitespace-pre-wrap font-bold bg-black/30 p-3 rounded">
        {getProcessedDescription(card, languageMode)}
      </p>

      <div className="space-y-2">
        {getCardKeywords(card).map((keyword, index) => (
          <div key={index} className="flex flex-col text-left text-sm bg-gray-700/50 p-2 rounded border border-gray-600">
            <span className="font-bold text-yellow-300 mb-0.5">{transBattle(keyword.title, languageMode)}</span>
            <span className="text-gray-300 text-xs">{transBattle(keyword.desc, languageMode)}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default CardInspectionModal;
