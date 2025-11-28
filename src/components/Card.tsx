
import React, { useState, useRef } from 'react';
import { Card as CardType, CardType as EnumCardType } from '../types';

interface CardProps {
  card: CardType;
  onClick: () => void;
  disabled: boolean;
}

const KEYWORD_DEFINITIONS: Record<string, { title: string; desc: string }> = {
  EXHAUST: { title: '廃棄', desc: '使用後、この戦闘中はデッキから除外される。' },
  STRENGTH: { title: '筋力', desc: '攻撃ダメージがその数値分増加する。' },
  VULNERABLE: { title: '脆弱', desc: '攻撃から受けるダメージが50%増加する。' },
  WEAK: { title: '弱体', desc: '攻撃で与えるダメージが25%減少する。' },
  BLOCK: { title: 'ブロック', desc: '次のターンまで、敵からのダメージを防ぐ。' },
  DRAW: { title: 'ドロー', desc: '山札からカードを引く。' },
};

const Card: React.FC<CardProps> = ({ card, onClick, disabled }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const longPressTimer = useRef<any>(null);
  const isLongPress = useRef(false);

  // --- Touch / Long Press Logic for Mobile ---
  const handleTouchStart = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowTooltip(true);
    }, 500);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (isLongPress.current) {
      if (e.cancelable) e.preventDefault();
      setShowTooltip(false);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (showTooltip) setShowTooltip(false);
  };

  // --- Style Logic ---
  const getTypeColor = (type: EnumCardType) => {
    switch (type) {
      case EnumCardType.ATTACK: return 'border-red-500 bg-red-900/95';
      case EnumCardType.SKILL: return 'border-blue-500 bg-blue-900/95';
      case EnumCardType.POWER: return 'border-yellow-500 bg-yellow-900/95';
      default: return 'border-gray-500 bg-gray-800';
    }
  };

  const getTypeText = (type: EnumCardType) => {
    switch (type) {
      case EnumCardType.ATTACK: return '攻撃';
      case EnumCardType.SKILL: return 'スキル';
      case EnumCardType.POWER: return 'パワー';
      default: return 'その他';
    }
  };

  const activeKeywords = (() => {
    const keywords = [];
    if (card.exhaust) keywords.push(KEYWORD_DEFINITIONS.EXHAUST);
    if (card.strength || card.description.includes('筋力')) keywords.push(KEYWORD_DEFINITIONS.STRENGTH);
    if (card.vulnerable || card.description.includes('脆弱')) keywords.push(KEYWORD_DEFINITIONS.VULNERABLE);
    if (card.weak || card.description.includes('弱体')) keywords.push(KEYWORD_DEFINITIONS.WEAK);
    if (card.block || card.description.includes('ブロック')) keywords.push(KEYWORD_DEFINITIONS.BLOCK);
    if (card.draw || card.description.includes('引く')) keywords.push(KEYWORD_DEFINITIONS.DRAW);
    return keywords;
  })();

  const renderCardArt = (type: EnumCardType) => {
    const commonProps = {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 16 16",
      className: "w-12 h-12 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]",
      shapeRendering: "crispEdges"
    };

    if (type === EnumCardType.ATTACK) {
      return (
        <svg {...commonProps}>
          <path d="M10 3h2v2h-2z M8 5h2v2h-2z M6 7h2v2h-2z M4 9h2v2h-2z" fill="#E2E8F0" />
          <path d="M11 4h1v1h-1z M9 6h1v1h-1z M7 8h1v1h-1z M5 10h1v1h-1z" fill="#94A3B8" />
          <path d="M3 11h2v2h-2z M9 9h3v2h-3z" fill="#475569" />
          <path d="M4 12h2v2h-2z" fill="#854D0E" />
          <path d="M2 14h2v2h-2z" fill="#5F370E" />
        </svg>
      );
    } else if (type === EnumCardType.SKILL) {
      return (
        <svg {...commonProps}>
           <path d="M3 2h10v6c0 4-5 7-5 7S3 12 3 8V2z" fill="#1E293B" />
           <path d="M4 3h8v5c0 3-4 5-4 5S4 11 4 8V3z" fill="#3B82F6" />
           <path d="M7 4h2v2h2v2H9v3H7V8H5V6h2V4z" fill="#E2E8F0" />
        </svg>
      );
    } else {
      return (
        <svg {...commonProps}>
          <path d="M9 1h-3l-3 7h4l-2 7 8-9h-4l3-5z" fill="#FACC15" />
          <path d="M9 1h-3l-3 7h1l-1 2 2-2h-2l3-7z" fill="#FEF08A" opacity="0.5"/>
        </svg>
      );
    }
  };

  const renderDescription = () => {
      let desc = card.description;
      
      if (card.damage !== undefined) {
          desc = desc.replace(/(\d+)ダメージ/g, `${card.damage}ダメージ`);
      }
      if (card.block !== undefined) {
          desc = desc.replace(/ブロック(\d+)/g, `ブロック${card.block}`);
      }
      if (card.poison !== undefined) {
          desc = desc.replace(/毒(\d+)/g, `毒${card.poison}`);
      }
      if (card.weak !== undefined) {
          desc = desc.replace(/弱体(\d+)/g, `弱体${card.weak}`);
      }
      if (card.vulnerable !== undefined) {
          desc = desc.replace(/脆弱(\d+)/g, `脆弱${card.vulnerable}`);
      }

      return (
        <span className={card.upgraded ? "text-green-300 font-bold" : ""}>
            {desc}
        </span>
      );
  };

  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={(e) => e.preventDefault()}
      className={`
        relative w-32 h-48 border-[3px] rounded-lg p-2 flex flex-col justify-between 
        transition-all duration-200 select-none group touch-manipulation
        ${getTypeColor(card.type)}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer hover:-translate-y-4 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:z-50'}
      `}
    >
      {/* Tooltip */}
      {showTooltip && activeKeywords.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-black border-2 border-white p-2 z-[100] shadow-2xl pointer-events-none">
          {activeKeywords.map((k, idx) => (
            <div key={k.title} className={`text-left ${idx !== activeKeywords.length - 1 ? 'mb-2 border-b border-gray-700 pb-1' : ''}`}>
              <div className="text-yellow-400 font-bold text-xs">{k.title}</div>
              <div className="text-gray-300 text-[10px] leading-tight">{k.desc}</div>
            </div>
          ))}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center relative z-10 mb-1">
        <span className={`text-[11px] font-bold truncate w-20 drop-shadow-md ${card.upgraded ? 'text-green-400' : 'text-white'}`}>
            {card.name}{card.upgraded ? '+' : ''}
        </span>
        <div className={`w-5 h-5 flex items-center justify-center rounded text-[10px] border border-white font-bold shrink-0 shadow-sm ${card.upgraded && card.cost < 99 ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
          {card.cost}
        </div>
      </div>

      {/* Art */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80 z-0">
        {renderCardArt(card.type)}
      </div>

      {/* Description */}
      <div className="relative z-10 mt-auto flex flex-col items-center w-full">
        <div className="bg-black/60 p-1 rounded border border-white/10 backdrop-blur-[1px] w-full min-h-[2.5rem] flex items-center justify-center flex-col">
            <div className="text-[8px] text-white leading-tight text-center whitespace-pre-wrap">
                {renderDescription()}
                {card.exhaust && <span className="text-gray-400 block font-bold text-[7px] mt-0.5">[廃棄]</span>}
            </div>
        </div>
        <div className="text-[8px] text-center mt-1 text-white/60 font-mono tracking-tighter">
            {getTypeText(card.type)}
        </div>
      </div>
    </div>
  );
};

export default Card;
