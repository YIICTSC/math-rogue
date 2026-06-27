import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card as CardType, CardType as EnumCardType, LanguageMode } from '../types';
import PixelSprite from './PixelSprite';
import EnemyIllustration from './EnemyIllustration';
import { buildEnglishCardDescription, trans } from '../utils/textUtils';
import { getCardIllustrationPaths } from '../utils/cardIllustration';
import { createEnemyIllustrationRef, getStatusCategoryLabel, getStatusCategoryClass, parseEnemyIllustrationRef } from '../utils/cardUtils';
import { assetUrl } from '../utils/assetPaths';
import type { VisualThemeId } from '../data/visualThemes';

interface CardProps {
  card: CardType;
  onClick: () => void;
  disabled: boolean;
  onInspect?: (card: CardType) => void;
  languageMode?: LanguageMode;
  gamepadZone?: string;
  gamepadOrder?: number;
}

export const KEYWORD_DEFINITIONS: Record<string, { title: string; desc: string }> = {
  EXHAUST: { title: '廃棄', desc: '使用後、この戦闘中はデッキから除外される。' },
  CONSUMED_ON_USE: { title: '使い切り', desc: '使用後、このゲーム中のデッキから除外される。カード消しゴムでは消せない。' },
  STRENGTH: { title: 'ムキムキ', desc: '攻撃ダメージがその数値分アップ！' },
  VULNERABLE: { title: 'びくびく', desc: '攻撃から受けるダメージが50%増えちゃう！' },
  WEAK: { title: 'へろへろ', desc: '攻撃で与えるダメージが25%減っちゃう...' },
  BLOCK: { title: 'ブロック', desc: '次のターンまで、敵からのダメージを防ぐ。' },
  DRAW: { title: 'ドロー', desc: '山札からカードを引く。' },
};

const MAX_ILLUSTRATION_REFS = 8;
const HOLOGRAPHIC_PRISM_ASSETS: Record<NonNullable<CardType['holographicVariant']>, string> = {
  red: 'card-illustrations/holographic-prism-red.png',
  yellow: 'card-illustrations/holographic-prism-yellow.png',
  blue: 'card-illustrations/holographic-prism-blue.png',
  purple: 'card-illustrations/holographic-prism-purple.png',
};
const HOLOGRAPHIC_VARIANT_BY_CARD_TYPE: Partial<Record<EnumCardType, NonNullable<CardType['holographicVariant']>>> = {
  [EnumCardType.ATTACK]: 'red',
  [EnumCardType.POWER]: 'yellow',
  [EnumCardType.SKILL]: 'blue',
  [EnumCardType.SUMMON]: 'purple',
};

const getStableHolographicVariant = (card: CardType): NonNullable<CardType['holographicVariant']> => {
  return HOLOGRAPHIC_VARIANT_BY_CARD_TYPE[card.type] || card.holographicVariant || 'blue';
};

const extractCompositeIllustrationRefs = (card: CardType): string[] => {
  if (card.illustrationRefs && card.illustrationRefs.length > 0) {
    return card.illustrationRefs.filter(Boolean).slice(0, MAX_ILLUSTRATION_REFS);
  }

  const enemyNames = [
    ...(card.enemyIllustrationNames || []),
    ...(card.enemyIllustrationName ? [card.enemyIllustrationName] : []),
  ].filter(Boolean) as string[];
  if (enemyNames.length > 0) return [createEnemyIllustrationRef(card, enemyNames[0])];

  if (card.capture && card.textureRef && !card.textureRef.includes('|')) {
    return [createEnemyIllustrationRef(card, card.textureRef)];
  }

  if (card.name) return [`card:${card.name}`];
  if (card.textureRef) return [`pixel:${card.textureRef}`];
  return [];
};

const CompositeArtPiece: React.FC<{
  refToken: string;
  seed: string;
  languageMode: LanguageMode;
  visualTheme?: VisualThemeId;
  enemyType?: string;
  phase?: number;
}> = ({ refToken, seed, languageMode, visualTheme = 'elementary', enemyType, phase }) => {
  const [failed, setFailed] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setFailed(false);
    setImageIndex(0);
  }, [refToken]);

  if (refToken.startsWith('enemy:')) {
    const enemyRef = parseEnemyIllustrationRef(refToken);
    const resolvedVisualTheme = enemyRef?.visualTheme || visualTheme;
    return (
      <EnemyIllustration
        name={enemyRef?.name || refToken.substring('enemy:'.length)}
        seed={seed}
        visualTheme={resolvedVisualTheme}
        enemyType={enemyRef?.enemyType || enemyType}
        phase={enemyRef?.phase ?? phase}
        action={resolvedVisualTheme === 'high-school' ? 'attack' : 'idle'}
        className="w-full h-full"
        size={16}
      />
    );
  }

  if (refToken.startsWith('pixel:')) {
    const spriteName = refToken.substring('pixel:'.length);
    return <PixelSprite seed={seed} name={spriteName} className="w-full h-full opacity-90" size={16} />;
  }

  if (refToken.startsWith('magic-rule:')) {
    const [, heroId, index] = refToken.split(':');
    return (
      <img
        src={assetUrl(`sprites/magic/rule-cards/${heroId}/${index}.webp`)}
        alt={heroId}
        className="w-full h-full object-cover opacity-95"
      />
    );
  }

  if (refToken.startsWith('magic-basic:')) {
    const [, heroId, art] = refToken.split(':');
    return (
      <img
        src={assetUrl(`sprites/magic/basic-cards/${heroId}/${art}.webp`)}
        alt={heroId}
        className="w-full h-full object-cover opacity-95"
      />
    );
  }

  if (refToken.startsWith('magic-card:')) {
    const index = refToken.substring('magic-card:'.length);
    return (
      <img
        src={assetUrl(`sprites/magic/cards/${index}.webp`)}
        alt="magic card"
        className="w-full h-full object-cover opacity-95"
      />
    );
  }

  const cardName = refToken.startsWith('card:') ? refToken.substring('card:'.length) : refToken;
  const candidates = getCardIllustrationPaths(seed, trans(cardName, languageMode), [cardName]);
  if (!failed && imageIndex < candidates.length) {
    return (
      <img
        src={candidates[imageIndex]}
        alt={cardName}
        className="w-full h-full object-cover opacity-95"
        onError={() => {
          const next = imageIndex + 1;
          if (next < candidates.length) setImageIndex(next);
          else setFailed(true);
        }}
      />
    );
  }

  return <div className="w-full h-full bg-black/20" />;
};

const Card: React.FC<CardProps> = ({ card, onClick, disabled, onInspect, languageMode = 'JAPANESE', gamepadZone, gamepadOrder }) => {
  const longPressTimer = useRef<any>(null);
  const isLongPressActive = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const translatedCardName = trans(card.name, languageMode);
  const imageCandidates = useMemo(
    () => getCardIllustrationPaths(card.id, translatedCardName, [card.name]),
    [card.id, card.name, translatedCardName]
  );

  const enemyIllustrationNames = useMemo(() => {
    const explicit = [
      ...(card.enemyIllustrationNames || []),
      ...(card.enemyIllustrationName ? [card.enemyIllustrationName] : []),
    ].filter(Boolean) as string[];
    if (explicit.length > 0) return Array.from(new Set(explicit));

    // Backward compatibility: old captured cards stored enemy name in textureRef.
    if (card.capture && card.textureRef && !card.textureRef.includes('|')) {
      return [card.textureRef];
    }

    return [];
  }, [card.capture, card.textureRef, card.enemyIllustrationName, card.enemyIllustrationNames]);

  const [imageIndex, setImageIndex] = useState(0);
  const compositeIllustrationRefs = useMemo(
    () => extractCompositeIllustrationRefs(card),
    [card]
  );

  useEffect(() => {
    setImageIndex(0);
  }, [card.id, card.name, translatedCardName]);

  const startLongPress = (e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    isLongPressActive.current = false;

    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    longPressTimer.current = setTimeout(() => {
      isLongPressActive.current = true;
      if (onInspect) onInspect(card);
    }, 700);
  };

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
    if (dist > 10) endLongPress();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleCardClick = () => {
    if (!isLongPressActive.current && !disabled) onClick();
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    onClick();
  };

  const getTypeColor = (type: EnumCardType) => {
    switch (type) {
      case EnumCardType.ATTACK:
        return 'border-red-500 bg-red-900/95';
      case EnumCardType.SKILL:
        return 'border-blue-500 bg-blue-900/95';
      case EnumCardType.POWER:
        return 'border-yellow-500 bg-yellow-900/95';
      case EnumCardType.SUMMON:
        return 'border-fuchsia-500 bg-fuchsia-950/95';
      default:
        return 'border-gray-500 bg-gray-800';
    }
  };

  const getTypeText = (type: EnumCardType) => {
    switch (type) {
      case EnumCardType.ATTACK:
        return trans('攻撃', languageMode);
      case EnumCardType.SKILL:
        return trans('スキル', languageMode);
      case EnumCardType.POWER:
        return trans('パワー', languageMode);
      case EnumCardType.SUMMON:
        return trans('サモン', languageMode);
      default:
        return trans('その他', languageMode);
    }
  };

  const renderCardArt = () => {
    const usesMagicRuleCardArt = card.magicRuleCardArt
      || (card.magicRuleCardIndex !== undefined && card.id.startsWith('start-MAGIC_'));

    if (card.familiarSummon) {
      return (
        <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_55%_45%,rgba(236,72,153,0.32),rgba(15,23,42,0.78)_55%,rgba(0,0,0,0.95))]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(248,250,252,0.18),transparent_28%,rgba(239,68,68,0.22)_52%,transparent_70%)]" />
          <img
            src={assetUrl(`sprites/high-school/familiars-action/${card.familiarSummon.imageIndex}.webp`)}
            alt={card.familiarSummon.name}
            className="absolute left-1/2 top-[18%] h-[205%] w-[205%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-100 drop-shadow-[0_0_12px_rgba(244,114,182,0.85)]"
            style={{ transform: 'translate(-50%, -50%)' }}
          />
        </div>
      );
    }

    if (compositeIllustrationRefs.length > 1) {
      const sliceWidth = `${100 / compositeIllustrationRefs.length}%`;
      return (
        <div className="w-full h-full flex overflow-hidden">
          {compositeIllustrationRefs.map((token, idx) => (
            <div key={`${token}-${idx}`} className="h-full border-r border-white/20 last:border-r-0" style={{ width: sliceWidth }}>
              <CompositeArtPiece
                refToken={token}
                seed={`${card.id}-mix-${idx}`}
                languageMode={languageMode}
                visualTheme={card.visualTheme}
                enemyType={card.enemyIllustrationEnemyType}
                phase={card.enemyIllustrationPhase}
              />
            </div>
          ))}
        </div>
      );
    }

    if (enemyIllustrationNames.length > 0) {
      return (
        <EnemyIllustration
          name={enemyIllustrationNames[0]}
          seed={`${card.id}-enemy`}
          aliases={enemyIllustrationNames.slice(1)}
          visualTheme={card.visualTheme}
          enemyType={card.enemyIllustrationEnemyType}
          phase={card.enemyIllustrationPhase}
          action={card.capture && card.visualTheme && card.visualTheme !== 'elementary' ? 'attack' : 'idle'}
          className="w-full h-full"
          size={16}
        />
      );
    }

    if (card.highSchoolCardArtIndex !== undefined) {
      return (
        <img
          src={assetUrl(`sprites/high-school/cards/${card.highSchoolCardArtIndex}.webp`)}
          alt={translatedCardName}
          className="w-full h-full object-cover opacity-95 drop-shadow-md"
        />
      );
    }

    if (usesMagicRuleCardArt && card.magicRuleCardIndex !== undefined && card.magicHeroId) {
      return (
        <img
          src={assetUrl(`sprites/magic/rule-cards/${card.magicHeroId}/${card.magicRuleCardIndex}.webp`)}
          alt={translatedCardName}
          className="w-full h-full object-cover opacity-95 drop-shadow-md"
        />
      );
    }

    if (card.magicBasicCardArt && card.magicHeroId) {
      return (
        <img
          src={assetUrl(`sprites/magic/basic-cards/${card.magicHeroId}/${card.magicBasicCardArt}.webp`)}
          alt={translatedCardName}
          className="w-full h-full object-cover opacity-95 drop-shadow-md"
        />
      );
    }

    if (card.magicCardArtIndex !== undefined) {
      return (
        <img
          src={assetUrl(`sprites/magic/cards/${card.magicCardArtIndex}.webp`)}
          alt={translatedCardName}
          className="w-full h-full object-cover opacity-95 drop-shadow-md"
        />
      );
    }

    if (card.visualTheme === 'high-school' && imageIndex < imageCandidates.length) {
      return (
        <img
          src={imageCandidates[imageIndex]}
          alt={translatedCardName}
          className="w-full h-full object-cover opacity-95 drop-shadow-md"
          onError={() => setImageIndex((prev) => prev + 1)}
        />
      );
    }

    if (imageIndex < imageCandidates.length) {
      return (
        <img
          src={imageCandidates[imageIndex]}
          alt={translatedCardName}
          className="w-full h-full object-cover opacity-95 drop-shadow-md"
          onError={() => setImageIndex((prev) => prev + 1)}
        />
      );
    }

    if (card.textureRef) {
      return <PixelSprite seed={card.id} name={card.textureRef} className="w-full h-full opacity-90 drop-shadow-md" size={16} />;
    }

    return <div className="w-full h-full bg-black/20" />;
  };

  const renderDescription = () => {
    const desc = languageMode === 'ENGLISH' ? buildEnglishCardDescription(card) : trans(card.description, languageMode);
    const textClassName = card.holographic ? 'text-cyan-100 font-bold' : card.upgraded ? 'text-green-300 font-bold' : '';
    if (!card.magicBoostedEffectText) {
      return <span className={textClassName}>{desc}</span>;
    }

    const [effectLine, ...restLines] = desc.split('\n');
    const parts = effectLine.split(/(\d+(?:\.\d+)?)/g);
    return (
      <span className={textClassName}>
        {parts.map((part, index) => (
          /^\d+(?:\.\d+)?$/.test(part) ? (
            <span
              key={`${part}-${index}`}
              className="text-amber-200 font-black drop-shadow-[0_0_4px_rgba(250,204,21,1)] animate-pulse"
            >
              {part}
            </span>
          ) : part
        ))}
        {restLines.length > 0 ? `\n${restLines.join('\n')}` : ''}
      </span>
    );
  };

  const displayName = translatedCardName + (card.upgraded ? '+' : '');
  const needsScroll = displayName.length > 6;
  const statusCategoryLabel = getStatusCategoryLabel(card);
  const statusCategoryClass = getStatusCategoryClass(card);
  const cardFrameClass = card.holographic
    ? 'card-holographic border-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.65)]'
    : '';
  const holographicVariant = getStableHolographicVariant(card);
  const holographicPrismPath = HOLOGRAPHIC_PRISM_ASSETS[holographicVariant];
  const nameColorClass = card.holographic
    ? 'text-black'
    : card.upgraded
      ? 'text-green-400'
      : 'text-white';
  const nameShadowClass = card.holographic
    ? 'drop-shadow-[0_1px_0_rgba(255,255,255,0.85)]'
    : 'drop-shadow-md';

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      data-gamepad-zone={gamepadZone}
      data-gamepad-order={gamepadOrder}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      onPointerDown={startLongPress}
      onPointerUp={endLongPress}
      onPointerLeave={endLongPress}
      onPointerMove={handlePointerMove}
      onContextMenu={handleContextMenu}
      className={`
        relative w-32 h-48 border-[3px] rounded-lg p-2 flex flex-col overflow-visible
        transition-all duration-200 select-none group touch-manipulation
        ${getTypeColor(card.type)}
        ${cardFrameClass}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer hover:-translate-y-4 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:z-50'}
      `}
    >
      {card.holographic && (
        <>
          <div
            className={`card-holographic-prism card-holographic-prism-${holographicVariant} pointer-events-none absolute inset-0 z-[11] rounded-lg`}
            style={{ backgroundImage: `url(${assetUrl(holographicPrismPath)})` }}
          />
          <div className="card-holographic-sheen pointer-events-none absolute inset-0 z-[12] rounded-lg" />
          <div className="card-holographic-sparkles pointer-events-none absolute inset-0 z-[13] rounded-lg" />
        </>
      )}
      {/* Header: fixed */}
      <div className="flex items-center relative z-30 mb-1 h-6 overflow-hidden shrink-0">
        <div className={`w-6 h-6 flex items-center justify-center rounded text-[11px] border border-white font-bold shrink-0 shadow-sm mr-1 ${card.holographic ? 'bg-cyan-300 text-slate-950' : card.upgraded && card.cost < 99 ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
          {card.cost}
        </div>

        {needsScroll ? (
          <div className={`flex-1 overflow-hidden relative text-[13px] font-bold min-w-0 ${nameShadowClass}`}>
            <div className={`flex w-max animate-marquee-scroll ${nameColorClass}`}>
              <span className="pr-4">{displayName}</span>
              <span className="pr-4">{displayName}</span>
            </div>
          </div>
        ) : (
          <span className={`text-[13px] font-bold truncate flex-1 ${nameShadowClass} ${nameColorClass}`}>
            {displayName}
          </span>
        )}
      </div>

      {(card.type === EnumCardType.STATUS || card.type === EnumCardType.CURSE) && statusCategoryLabel && (
        <div className={`mb-1 text-[10px] text-center rounded px-1 py-[1px] shrink-0 ${statusCategoryClass}`}>
          {statusCategoryLabel}
        </div>
      )}

      {/* Description: layer, bottom position */}
      <div className="absolute bottom-5 left-2 right-2 z-[60] pointer-events-none">
        <div className="bg-black/75 p-1 rounded border border-white/10 backdrop-blur-[1px] w-full min-h-[42px] overflow-visible">
          <div className="text-[9px] text-white leading-tight text-left whitespace-pre-wrap break-words w-full font-bold">
            {renderDescription()}
          </div>
        </div>
      </div>

      {/* Art: position unchanged */}
      <div className="relative z-40 mb-1.5">
        <div className="card-art-frame w-[calc(100%+10px)] -ml-[5px] h-[68px] rounded-md border border-white/20 bg-black/95 overflow-hidden flex items-center justify-center">
          {renderCardArt()}
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <div className="text-[9px] text-center mt-0.5 text-white/60 font-mono tracking-tighter">{getTypeText(card.type)}</div>
      </div>
    </div>
  );
};

export default Card;
