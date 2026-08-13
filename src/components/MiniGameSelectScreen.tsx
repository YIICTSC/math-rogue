
import React, { useState, useRef } from 'react';
import { ArrowLeft, Gamepad2, AlertTriangle, Trash2, Lock } from 'lucide-react';
import { audioService } from '../services/audioService';
import { MINI_GAMES, MiniGameConfig } from '../miniGameConfig';
import { GameScreen, LanguageMode } from '../types';
import { assetUrl } from '../utils/assetPaths';
import { trans } from '../utils/textUtils';

interface MiniGameSelectScreenProps {
  onSelect: (screen: GameScreen) => void;
  onBack: () => void;
  totalMathCorrect: number;
  isDebug: boolean;
  languageMode: LanguageMode;
}

type MiniGameSpriteDefinition = {
  src: string;
  columns: number;
  rows: number;
  index: number;
  cell?: number;
  gap?: number;
  offsetX?: number;
  offsetY?: number;
};

const MINI_GAME_SPRITE_ICONS: Record<string, MiniGameSpriteDefinition> = {
  GO_HOME: { src: 'sprites/go-home-dash-8-loop-grid.webp', columns: 8, rows: 1, index: 2 },
  SURVIVOR: { src: 'sprites/schoolyard-survivor-weapons.webp', columns: 8, rows: 5, index: 0 },
  POKER: { src: 'sprites/after-school-poker-card-ornaments.webp', columns: 8, rows: 2, index: 0 },
  DUNGEON: { src: 'sprites/furai-sfc-v2-hero-base-5x5.webp', columns: 5, rows: 5, index: 0, cell: 72, gap: 16 },
  KOCHO: { src: 'sprites/kocho-hero-actions-01.webp', columns: 5, rows: 5, index: 0 },
  PAPER_PLANE: { src: 'sprites/paper-plane/pilots-02.webp', columns: 5, rows: 5, index: 1, offsetX: -12, offsetY: 2 },
  DUNGEON_2: { src: 'sprites/furai-shogakusei2-card-sheet.webp', columns: 6, rows: 5, index: 0, cell: 72, gap: 16 },
};

export const MiniGameSpriteIcon: React.FC<{
  game: MiniGameConfig;
  className?: string;
}> = ({ game, className = 'h-7 w-7 md:h-9 md:w-9' }) => {
  const sprite = MINI_GAME_SPRITE_ICONS[game.id];
  const fallbackIcon = <game.icon size={24} className="text-white fill-current md:w-7 md:h-7" />;

  if (!sprite) return fallbackIcon;

  const col = sprite.index % sprite.columns;
  const row = Math.floor(sprite.index / sprite.columns);
  const src = assetUrl(sprite.src);

  if (sprite.cell && sprite.gap) {
    const sheetWidth = sprite.gap + sprite.columns * (sprite.cell + sprite.gap);
    const sheetHeight = sprite.gap + sprite.rows * (sprite.cell + sprite.gap);
    const sx = sprite.gap + col * (sprite.cell + sprite.gap);
    const sy = sprite.gap + row * (sprite.cell + sprite.gap);

    return (
      <div className={`relative ${className} overflow-hidden`} style={{ imageRendering: 'pixelated' }}>
        <div
          className="absolute bg-no-repeat"
          style={{
            left: `-${(sx / sprite.cell) * 100}%`,
            top: `-${(sy / sprite.cell) * 100}%`,
            width: `${(sheetWidth / sprite.cell) * 100}%`,
            height: `${(sheetHeight / sprite.cell) * 100}%`,
            backgroundImage: `url("${src}")`,
            backgroundSize: '100% 100%',
            imageRendering: 'pixelated',
            transform: `translate(${sprite.offsetX ?? 0}%, ${sprite.offsetY ?? 0}%)`,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} bg-no-repeat`}
      style={{
        backgroundImage: `url("${src}")`,
        backgroundSize: `${sprite.columns * 100}% ${sprite.rows * 100}%`,
        backgroundPosition: `${sprite.columns === 1 ? 0 : (col / (sprite.columns - 1)) * 100}% ${sprite.rows === 1 ? 0 : (row / (sprite.rows - 1)) * 100}%`,
        imageRendering: 'pixelated',
        transform: `translate(${sprite.offsetX ?? 0}%, ${sprite.offsetY ?? 0}%)`,
      }}
    />
  );
};

const MiniGameSelectScreen: React.FC<MiniGameSelectScreenProps> = ({ onSelect, onBack, totalMathCorrect, isDebug, languageMode }) => {
  const [deleteTarget, setDeleteTarget] = useState<MiniGameConfig | null>(null);
  const longPressTimer = useRef<any>(null);
  const isLongPress = useRef(false);

  const isUnlocked = (game: MiniGameConfig) => {
    if (isDebug) return true;
    return totalMathCorrect >= game.threshold;
  };
  const firstUnlockedGameId = MINI_GAMES.find(isUnlocked)?.id;

  const handlePressStart = (game: MiniGameConfig) => {
    if (!isUnlocked(game)) return;
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setDeleteTarget(game);
      audioService.playSound('wrong');
    }, 800); // 0.8s long press
  };

  const handlePressEnd = (e: React.MouseEvent | React.TouchEvent, game: MiniGameConfig) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (!isUnlocked(game)) {
      audioService.playSound('wrong');
      return;
    }

    if (isLongPress.current) {
      e.preventDefault();
      return;
    }
    if ('button' in e && e.button !== 0) return;

    // Normal click
    onSelect(game.screen);
  };

  const handleCancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    
    deleteTarget.clearAction();
    audioService.playSound('buff');
    setDeleteTarget(null);
  };

  const bindPress = (game: MiniGameConfig) => ({
    onClick: (event: React.MouseEvent) => {
      // HTMLElement.click() and keyboard activation use detail=0. Pointer and
      // touch launches are already handled by their release events below.
      if (event.detail !== 0 || !isUnlocked(game)) return;
      onSelect(game.screen);
    },
    onMouseDown: () => handlePressStart(game),
    onMouseUp: (e: React.MouseEvent) => handlePressEnd(e, game),
    onMouseLeave: handleCancelPress,
    onTouchStart: () => handlePressStart(game),
    onTouchEnd: (e: React.TouchEvent) => handlePressEnd(e, game),
    onTouchMove: handleCancelPress,
    onContextMenu: (event: React.MouseEvent) => {
      event.preventDefault();
      if (!isUnlocked(game)) {
        audioService.playSound('wrong');
        return;
      }
      setDeleteTarget(game);
      audioService.playSound('wrong');
    }
  });

  const LockedOverlay: React.FC<{ threshold: number }> = ({ threshold }) => {
    const remaining = Math.max(0, threshold - totalMathCorrect);
    return (
      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl z-20 pointer-events-none">
        <Lock className="text-gray-500 mb-2" size={32} />
        <div className="text-gray-400 font-bold text-xs">{trans('LOCKED', languageMode)}</div>
        <div className="text-yellow-500 font-bold text-[10px] mt-1">{trans('あと', languageMode)} {remaining} {trans('問', languageMode)}</div>
      </div>
    );
  };

  return (
    <div
      data-gamepad-initial-scope="mini-game-selection"
      className="main-mini-game-select-screen flex flex-col h-full w-full bg-gray-900 bg-cover bg-center text-white relative"
      style={{ backgroundImage: `url(${assetUrl('sprites/backgrounds/learning-rogue/selection-entrance.webp')})` }}
    >
      <div className="absolute inset-0 bg-slate-950/64 pointer-events-none" />
      <div className="absolute inset-0 texture-dark-matter opacity-30 pointer-events-none"></div>
      
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="app-modal-overlay fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" data-gamepad-initial-scope="mini-game-delete-confirm">
          <div className="app-modal-panel app-delete-confirm-modal bg-gray-800 border-2 border-red-500 p-6 rounded-lg max-w-sm w-full shadow-2xl text-center" data-gamepad-navigation-root>
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-white mb-2">{trans('セーブデータを削除しますか？', languageMode)}</h3>
            <p className="text-sm text-gray-300 mb-6">
              {languageMode === 'ENGLISH'
                ? `"${trans(deleteTarget.name, languageMode)}" save data will be deleted and restarted from the beginning.`
                : `「${trans(deleteTarget.name, languageMode)}」${trans('の中断データを削除して最初からやり直します。', languageMode)}`}
              <br/><span className="text-red-400 text-xs">{trans('(この操作は取り消せません)', languageMode)}</span>
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={confirmDelete} 
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded font-bold flex items-center transition-colors shadow-lg"
              >
                <Trash2 size={16} className="mr-2"/> {trans('削除する', languageMode)}
              </button>
              <button
                data-gamepad-initial-choice
                onClick={() => setDeleteTarget(null)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded font-bold transition-colors"
              >
                {trans('キャンセル', languageMode)}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ios-safe-ui-x z-10 w-full h-full flex flex-col items-center p-4 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-5xl flex flex-col items-center min-h-full justify-start md:justify-center py-8 md:py-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse flex items-center shrink-0">
            <Gamepad2 className="mr-2 md:mr-3 text-yellow-400" size={28} /> {trans('ミニゲーム選択', languageMode)}
          </h2>
          <p className="text-xs text-gray-500 mb-6 animate-pulse text-center">
            {languageMode === 'ENGLISH'
              ? 'Hold the button, or focus a game and press Y, to delete its save data.'
              : '※ボタン長押し、またはゲームに合わせてYボタンでセーブデータを削除できます'}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full mb-8 shrink-0 px-1 md:px-2">
            {MINI_GAMES.map((game) => (
              <button
                key={game.id}
                data-gamepad-initial-choice={game.id === firstUnlockedGameId ? true : undefined}
                data-gamepad-delete-target={isUnlocked(game) ? true : undefined}
                aria-keyshortcuts={isUnlocked(game) ? 'Y' : undefined}
                {...bindPress(game)}
                className={`group relative bg-slate-800 border-4 border-slate-600 hover:border-white p-2 md:p-4 rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-left transition-all shadow-xl overflow-hidden h-36 md:h-32 ${!isUnlocked(game) ? 'grayscale opacity-60' : 'hover:bg-slate-700'}`}
                style={{ 
                  borderColor: isUnlocked(game) ? undefined : '#475569',
                  boxShadow: isUnlocked(game) ? `0 0 20px ${game.glowColor}` : undefined
                }}
              >
                {!isUnlocked(game) && <LockedOverlay threshold={game.threshold} />}
                <div className={`absolute top-0 right-0 ${game.typeColor} text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-md z-10`}>
                  {trans(game.typeLabel, languageMode)}
                </div>
                
                <div className={`p-2 md:p-3 rounded-full mb-2 md:mb-0 md:mr-3 group-hover:scale-110 transition-transform duration-300 border-2 border-white/10 shrink-0 bg-black/20`}>
                  <MiniGameSpriteIcon game={game} />
                </div>

                <div className="flex flex-col items-center md:items-start w-full">
                  <span
                    className={`mini-game-title text-sm md:text-lg font-bold mb-1 text-white transition-colors ${languageMode === 'ENGLISH' ? 'mini-game-title-english' : ''}`}
                    aria-label={trans(game.name, languageMode)}
                  >
                    {languageMode === 'JAPANESE' || languageMode === 'HIRAGANA'
                      ? game.titleLines.map((line) => (
                          <span key={line} className="mini-game-title-line">{trans(line, languageMode)}</span>
                        ))
                      : <span className="mini-game-title-line">{trans(game.name, languageMode)}</span>}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-gray-400 group-hover:text-gray-200 leading-tight block">
                    {trans(game.description, languageMode)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button 
            onClick={onBack} 
            className="text-gray-400 hover:text-white flex items-center border-b border-transparent hover:border-white transition-colors text-base py-2 mt-auto shrink-0"
          >
            <ArrowLeft className="mr-2" size={20} /> {trans('タイトルへ戻る', languageMode)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniGameSelectScreen;
