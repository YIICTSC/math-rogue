import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AnswerMode, AssignmentAnswerResult, AssignmentPayload, GameMode, LanguageMode } from '../../types';
import { audioService } from '../../services/audioService';
import { storageService } from '../../services/storageService';
import { assetUrl } from '../../utils/assetPaths';
import { trans } from '../../utils/textUtils';
import MiniGameProblemChallenge from '../../components/MiniGameProblemChallenge';
import {
  createShogiGame,
  getAdvancedStageUniqueCount,
  getPieceDefinition,
  getShogiMovementTargets,
  playShogiMove,
  selectShogiPiece,
  type ShogiGameState,
  type ShogiMode,
  type ShogiPlayMode,
  type ShogiTarget,
} from './shogiEngine';
import {
  ADVANCED_PIECES,
  STANDARD_PIECES,
  type ShogiPiece,
  type ShogiPieceKind,
} from './shogiPieces';
import { getShogiPieceEnglish, type ShogiPieceEnglishCopy } from './shogiTranslations';

interface ShogiMiniGameProps {
  onBack: () => void;
  onFinish?: (result: 'WIN' | 'LOSE') => void;
  languageMode?: LanguageMode;
  problemMode?: GameMode;
  problemModePool?: string[];
  answerMode?: AnswerMode;
  assignment?: AssignmentPayload | null;
  onAnswerResult?: (result: AssignmentAnswerResult) => void;
}

interface ShogiProgress {
  highestStage: number;
  completedStages: number[];
  standardWins: number;
}

const SAVE_KEY = 'learning_rogue_shogi_progress_v2';
const copy = (languageMode: LanguageMode | undefined, jp: string, en: string, hira = transHiragana(jp)) =>
  languageMode === 'ENGLISH' ? en : languageMode === 'HIRAGANA' ? hira : jp;

const transHiragana = (value: string) => trans(value, 'HIRAGANA')
  .replace(/駒の動きを見て/g, 'こまのうごきをみて')
  .replace(/王を守りながら/g, 'おうをまもりながら')
  .replace(/相手の玉を詰ませよう/g, 'あいてのぎょくをつませよう')
  .replace(/毎回異なる盤面で遊べます/g, 'まいかいことなるばんめんであそべます')
  .replace(/毎かい/g, 'まいかい')
  .replace(/異なる/g, 'ことなる')
  .replace(/ばん面/g, 'ばんめん')
  .replace(/遊べます/g, 'あそべます')
  .replace(/標準8たね/g, 'ひょうじゅん8しゅ')
  .replace(/標準8種/g, 'ひょうじゅん8しゅ')
  .replace(/標準/g, 'ひょうじゅん')
  .replace(/動き/g, 'うごき')
  .replace(/(\d+)たね/g, '$1しゅ')
  .replace(/王将/g, 'おうしょう')
  .replace(/玉将/g, 'ぎょくしょう')
  .replace(/飛車/g, 'ひしゃ')
  .replace(/角行/g, 'かくぎょう')
  .replace(/金将/g, 'きんしょう')
  .replace(/銀将/g, 'ぎんしょう')
  .replace(/桂馬/g, 'けいま')
  .replace(/香車/g, 'きょうしゃ')
  .replace(/歩兵/g, 'ふひょう')
  .replace(/捕獲/g, 'ほかく')
  .replace(/打ち駒/g, 'うちごま')
  .replace(/打ちこま/g, 'うちごま')
  .replace(/長押し/g, 'ながおし')
  .replace(/操作/g, 'そうさ')
  .replace(/持ち/g, 'もち')
  .replace(/ランダム配置/g, 'ランダムはいち')
  .replace(/ユニーク駒/g, 'ユニークこま')
  .replace(/このステージの/g, 'このステージの')
  .replace(/ステージを選択/g, 'ステージをせんたく')
  .replace(/解禁/g, 'かいきん')
  .replace(/駒/g, 'こま')
  .replace(/将/g, 'しょう')
  .replace(/盤/g, 'ばん')
  .replace(/王/g, 'おう')
  .replace(/玉/g, 'ぎょく')
  .replace(/成り状態/g, 'なりじょうたい')
  .replace(/未成/g, 'みせい')
  .replace(/合法手/g, 'ごうほうて')
  .replace(/現在の/g, 'げんざいの')
  .replace(/選択/g, 'せんたく')
  .replace(/表示/g, 'ひょうじ')
  .replace(/移動/g, 'いどう')
  .replace(/詳細/g, 'しょうさい')
  .replace(/戻る/g, 'もどる')
  .replace(/持ち駒/g, 'もちごま')
  .replace(/新しい盤面で再戦/g, 'あたらしいばんめんでさいせん')
  .replace(/盤面を引き直す/g, 'ばんめんをひきなおす')
  .replace(/勝利/g, 'しょうり')
  .replace(/敗北/g, 'はいぼく')
  .replace(/引き分け/g, 'ひきわけ')
  .replace(/龍/g, 'りゅう')
  .replace(/竜/g, 'りゅう')
  .replace(/ばん面/g, 'ばんめん');

const localizeShogiText = (value: string, languageMode?: LanguageMode) =>
  languageMode === 'JAPANESE' || !languageMode ? value : languageMode === 'HIRAGANA' ? transHiragana(value) : trans(value, 'ENGLISH');

const localizeShogiPieceField = (
  kind: ShogiPieceKind,
  field: keyof ShogiPieceEnglishCopy,
  value: string,
  languageMode?: LanguageMode,
) => languageMode === 'ENGLISH'
  ? getShogiPieceEnglish(kind, field, value)
  : languageMode === 'HIRAGANA'
    ? transHiragana(value)
    : value;

const localizeShogiMessage = (value: string, languageMode?: LanguageMode) => {
  const messages: Record<string, [string, string]> = {
    '新しい盤面を生成しました。駒を選んで移動範囲を確認。': ['New board generated. Select a piece to see every movement destination.', 'あたらしいばんめんをせいせいしました。こまをえらんでいどうはんいをかくにん。'],
    '駒本来の移動先を表示しています。王が危険になる手も指せます。失敗から守り方を学びましょう。': ['Showing every destination allowed by the piece movement. Risky moves are allowed; learn king safety from the resulting defeat.', 'こまほんらいのいどうさきをひょうじしています。おうがきけんになるてもさせます。しっぱいからまもりかたをまなびましょう。'],
    'この駒は駒の動きとして移動先がありません。': ['This piece has no destination under its movement rule.', 'このこまはこまのうごきとしていどうさきがありません。'],
    'そのマスには移動できません。表示された候補を選んでください。': ['That square is outside this piece\'s movement. Choose a highlighted destination.', 'そのマスにはいどうできません。ひょうじされたこうほをえらんでください。'],
    'CPUが指しました。あなたの手番です。': ['CPU moved. Your turn.', 'CPUがさしました。あなたのばんです。'],
    '相手の王を取りました。勝利！': ['You captured the enemy king. Victory!', 'あいてのおうをとりました。しょうり！'],
    '王を取られました。敗北。': ['Your king was captured. Defeat.', 'おうをとられました。はいぼく。'],
    '詰みです。勝利！': ['Checkmate. Victory!', 'つみです。しょうり！'],
    '動かせる駒がありません。引き分けです。': ['There are no movable pieces. Draw.', 'うごかせるこまがありません。ひきわけです。'],
    'CPUに動かせる駒がありません。引き分けです。': ['CPU has no movable pieces. Draw.', 'CPUにうごかせるこまがありません。ひきわけです。'],
    '詰みです。敗北。': ['Checkmate. Defeat.', 'つみです。はいぼく。'],
  };
  if (value.startsWith('ステージ') && value.includes('駒を選んで移動範囲を確認。')) {
    const stage = value.match(/^ステージ(\d+)/)?.[1] || '';
    return copy(languageMode, value, `Stage ${stage}: select a piece to see every movement destination.`, `ステージ${stage}：こまをえらんでいどうはんいをかくにん。`);
  }
  const translated = messages[value];
  return translated ? copy(languageMode, value, translated[0], translated[1]) : localizeShogiText(value, languageMode);
};

const loadProgress = (): ShogiProgress => {
  try {
    const value = JSON.parse(localStorage.getItem(SAVE_KEY) || '');
    if (value && typeof value.highestStage === 'number') {
      return {
        highestStage: Math.max(1, Math.min(100, value.highestStage)),
        completedStages: Array.isArray(value.completedStages) ? value.completedStages : [],
        standardWins: typeof value.standardWins === 'number' ? value.standardWins : 0,
      };
    }
  } catch {
    // First play or unavailable storage.
  }
  return { highestStage: 1, completedStages: [], standardWins: 0 };
};

const saveProgress = (progress: ShogiProgress) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
  } catch {
    // Storage can be unavailable in embedded previews.
  }
};

const glyphFor = (piece: ShogiPiece): string => {
  if (piece.kind.startsWith('ADV_')) return getPieceDefinition(piece.kind).glyph;
  if (!piece.promoted) return getPieceDefinition(piece.kind).glyph;
  // 標準将棋の成り飛車は説明文・駒字とも「龍」で統一する。
  if (piece.kind === 'R') return '龍';
  if (piece.kind === 'B') return '馬';
  if (piece.kind === 'S') return '全';
  if (piece.kind === 'N') return '圭';
  if (piece.kind === 'L') return '杏';
  if (piece.kind === 'P') return 'と';
  return getPieceDefinition(piece.kind).glyph;
};

const SHOGI_PIECE_ICON = assetUrl('sprites/shogi/shogi-piece-realistic.png');

export const ShogiPieceIcon: React.FC<{
  glyph: string;
  cpu?: boolean;
  promoted?: boolean;
  compact?: boolean;
  className?: string;
}> = ({ glyph, cpu = false, promoted = false, compact = false, className = '' }) => (
  <span className={[
    'shogi-piece-icon',
    cpu ? 'cpu' : '',
    promoted ? 'promoted' : '',
    compact ? 'compact' : '',
    className,
  ].filter(Boolean).join(' ')} aria-hidden="true">
    <img src={SHOGI_PIECE_ICON} alt="" draggable={false} />
    <span className="shogi-piece-glyph">{glyph}</span>
  </span>
);

// 駒名は固有表記として日本語を維持する。古い翻訳キャッシュや汎用辞書が
// 混入しても「Choose Option」などを画面へ出さず、駒字へ安全にフォールバックする。
const GENERIC_PIECE_LABELS = new Set([
  'Choose Option',
  'Event Details',
  'School Foe',
  'Item',
  'Choose a fitting event action',
]);
const pieceLabelFor = (definition: ReturnType<typeof getPieceDefinition>) =>
  GENERIC_PIECE_LABELS.has(definition.name.trim()) ? definition.glyph : definition.name;

const targetLabel = (target: ShogiTarget, languageMode?: LanguageMode) => {
  if (target.status === 'CAPTURE') return copy(languageMode, '捕獲できるマス', 'Capture square');
  if (target.status === 'DROP') return copy(languageMode, '持ち駒を打てるマス', 'Drop square');
  if (target.status === 'SPECIAL') return copy(languageMode, '特殊移動の候補', 'Special move');
  return copy(languageMode, '移動できるマス', 'Movement destination');
};

const ModeStart: React.FC<{
  languageMode?: LanguageMode;
  progress: ShogiProgress;
  initialMode?: ShogiMode;
  initialPlayMode?: ShogiPlayMode;
  initialStage?: number;
  onStart: (mode: ShogiMode, stage: number, playMode: ShogiPlayMode) => void;
  onBack: () => void;
}> = ({ languageMode, progress, initialMode = 'STANDARD', initialPlayMode = 'CPU', initialStage = 1, onStart, onBack }) => {
  const [mode, setMode] = useState<ShogiMode>(initialMode);
  const [playMode, setPlayMode] = useState<ShogiPlayMode>(initialPlayMode);
  const [stage, setStage] = useState(initialStage);
  const unlocked = Math.min(100, progress.highestStage);
  // 駒名・駒字は日本語の固有表記。英語の遅延DOM翻訳から保護する。
  return (
    <main className="shogi-mini-shell" data-allow-japanese="true">
      <div className="shogi-mini-backdrop" style={{ backgroundImage: 'url("' + assetUrl('sprites/backgrounds/mini-games/shogi.png') + '")' }} />
      <section className="shogi-mini-start">
        <div className="shogi-mini-emblem">{copy(languageMode, '将 // 5×5', 'SHO // 5x5', 'しょう // 5×5')}</div>
        <p className="shogi-mini-eyebrow">LEARNING ROGUE // TRIVIA LAB</p>
        <h1>{copy(languageMode, 'ミニ将棋', 'MINI SHOGI')}</h1>
        <p className="shogi-mini-lead">
          {copy(languageMode, '駒本来の動きを試し、悪手なら王を取られる実戦型。負けた局面から守り方を学べます。', 'Try every destination allowed by each piece. Risky moves can lose your king, so each defeat teaches better defense.')}
        </p>
        <div className="shogi-mini-mode-tabs">
          <button type="button" className={mode === 'STANDARD' ? 'active' : ''} onClick={() => setMode('STANDARD')}>
            <b>STANDARD</b><span>{copy(languageMode, '標準8種 // ランダム配置', 'Eight standard pieces // random setup')}</span>
          </button>
          <button type="button" className={mode === 'ADVANCE' ? 'active' : ''} onClick={() => setMode('ADVANCE')}>
            <b>ADVANCE</b><span>{copy(languageMode, 'ユニーク駒50種 // 100ステージ', '50 unique pieces // 100 stages')}</span>
          </button>
        </div>
        <div className="shogi-play-mode-tabs" aria-label={copy(languageMode, '対戦方式', 'Play mode')}>
          <button type="button" className={playMode === 'CPU' ? 'active' : ''} onClick={() => setPlayMode('CPU')}>
            <b>{copy(languageMode, 'CPU対戦', 'VS CPU')}</b><span>{copy(languageMode, '一人で学習CPUと対戦', 'Solo learning duel')}</span>
          </button>
          <button type="button" className={playMode === 'LOCAL' ? 'active' : ''} onClick={() => setPlayMode('LOCAL')}>
            <b>{copy(languageMode, '対面対戦', 'FACE-TO-FACE')}</b><span>{copy(languageMode, '同じ画面で先手・後手を交代', 'Two players on one screen')}</span>
          </button>
        </div>
        {mode === 'ADVANCE' && playMode === 'CPU' && (
          <div className="shogi-stage-picker">
            <div className="shogi-stage-picker-head">
              <span>{copy(languageMode, 'ステージを選択', 'Select stage')}</span>
              <b>{unlocked} / 100 {copy(languageMode, '解禁', 'unlocked')}</b>
            </div>
            <div className="shogi-stage-grid">
              {Array.from({ length: 100 }, (_, index) => index + 1).map(value => {
                const isUnlocked = value <= unlocked;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!isUnlocked}
                    className={stage === value ? 'selected' : ''}
                    onClick={() => setStage(value)}
                    aria-label={'Stage ' + value + (isUnlocked ? '' : ' locked')}
                  >
                    {String(value).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
            <p>{copy(languageMode, 'このステージのユニーク駒', 'Unique pieces in this stage')}: <b>{getAdvancedStageUniqueCount(stage)}{copy(languageMode, '種', 'types', 'しゅ')}</b></p>
          </div>
        )}
        <div className="shogi-mini-start-stats">
          <span><b>8</b> STANDARD</span><span><b>50</b> UNIQUE</span><span><b>100</b> STAGES</span>
        </div>
        <div className="shogi-mini-start-actions">
          <button type="button" className="primary" onClick={() => onStart(mode, mode === 'ADVANCE' ? (playMode === 'LOCAL' ? 100 : stage) : 1, playMode)}>
            {playMode === 'LOCAL'
              ? mode === 'ADVANCE' ? copy(languageMode, '対面アドバンス・ランダム局を開始', 'START LOCAL ADVANCE RANDOM') : copy(languageMode, '対面スタンダード局を開始', 'START LOCAL STANDARD')
              : mode === 'ADVANCE' ? 'START STAGE ' + String(stage).padStart(2, '0') : 'START RANDOM DUEL'}
          </button>
          <button type="button" className="secondary" onClick={onBack}>{copy(languageMode, '戻る', 'Back')}</button>
        </div>
      </section>
    </main>
  );
};

const PieceInspector: React.FC<{
  piece: ShogiPiece;
  targetCount: number;
  languageMode?: LanguageMode;
  onClose: () => void;
}> = ({ piece, targetCount, languageMode, onClose }) => {
  const definition = getPieceDefinition(piece.kind);
  // 駒名はルール上の固有表記として全言語モードで日本語を維持する。
  const pieceName = piece.promoted ? glyphFor(piece) : pieceLabelFor(definition);
  return (
    <div className="shogi-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="shogi-piece-modal" onClick={event => event.stopPropagation()}>
        <button type="button" className="shogi-modal-close" onClick={onClose}>×</button>
        <div className="shogi-piece-modal-heading">
          <ShogiPieceIcon glyph={glyphFor(piece)} cpu={piece.side === 'C'} promoted={piece.promoted} className="shogi-piece-big" />
          <div>
            <p className="shogi-mini-eyebrow">{definition.advanced ? 'ADVANCE // STAGE ' + definition.stage : 'STANDARD PIECE'}</p>
            <h2>{pieceName}</h2>
            <span>{piece.promoted ? copy(languageMode, '成り状態', 'Promoted') : copy(languageMode, '未成', 'Unpromoted')}</span>
          </div>
        </div>
        <div className="shogi-piece-modal-grid">
          <article><b>{copy(languageMode, '移動', 'MOVEMENT')}</b><p>{localizeShogiPieceField(piece.kind, 'description', definition.description, languageMode)}</p></article>
          <article><b>{copy(languageMode, '成り', 'PROMOTION')}</b><p>{localizeShogiPieceField(piece.kind, 'promotion', definition.promotion, languageMode)}</p></article>
          <article><b>{copy(languageMode, '制限', 'RESTRICTION')}</b><p>{localizeShogiPieceField(piece.kind, 'restriction', definition.restriction, languageMode)}</p></article>
          {definition.special && <article><b>{copy(languageMode, '特殊能力', 'SPECIAL')}</b><p>{localizeShogiPieceField(piece.kind, 'special', definition.special, languageMode)}</p></article>}
        </div>
        <div className="shogi-piece-modal-footer">
          <span>{copy(languageMode, '現在の移動先', 'Movement destinations')}</span><b>{targetCount}</b>
          <button type="button" onClick={onClose}>{copy(languageMode, '盤面へ戻る', 'Return to board')}</button>
        </div>
      </section>
    </div>
  );
};

const GuideLegend: React.FC<{ languageMode?: LanguageMode }> = ({ languageMode }) => (
  <div className="shogi-guide-legend">
    <span><i className="move" />{copy(languageMode, '移動', 'Move')}</span>
    <span><i className="capture" />{copy(languageMode, '捕獲', 'Capture')}</span>
    <span><i className="drop" />{copy(languageMode, '打ち駒', 'Drop')}</span>
    <span><i className="special" />{copy(languageMode, '特殊', 'Special')}</span>
  </div>
);

const ShogiMiniGame: React.FC<ShogiMiniGameProps> = ({ onBack, onFinish, languageMode, problemMode = 'MIXED' as GameMode, problemModePool, answerMode = 'CHOICE', assignment, onAnswerResult }) => {
  const [progress, setProgress] = useState<ShogiProgress>(() => loadProgress());
  const [game, setGame] = useState<ShogiGameState | null>(null);
  const [startMode, setStartMode] = useState<ShogiMode>('STANDARD');
  const [startPlayMode, setStartPlayMode] = useState<ShogiPlayMode>('CPU');
  const [startStage, setStartStage] = useState(1);
  const [inspect, setInspect] = useState<{ piece: ShogiPiece; targetCount: number } | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showMissionQuiz, setShowMissionQuiz] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const discoveredShogiPiecesRef = useRef(new Set<string>());

  useEffect(() => {
    if (!game) return;
    const visibleKinds = new Set<ShogiPieceKind>([
      ...STANDARD_PIECES.map(piece => piece.kind),
      ...game.board.flatMap(row => row.filter((piece): piece is ShogiPiece => Boolean(piece)).map(piece => piece.kind)),
      ...(Object.keys(game.hands.P).filter(kind => game.hands.P[kind as ShogiPieceKind] > 0) as ShogiPieceKind[]),
      ...(Object.keys(game.hands.C).filter(kind => game.hands.C[kind as ShogiPieceKind] > 0) as ShogiPieceKind[]),
    ]);
    if (game.mode === 'ADVANCE') {
      ADVANCED_PIECES.slice(0, Math.min(50, game.stage))
        .slice(-getAdvancedStageUniqueCount(game.stage))
        .forEach(piece => visibleKinds.add(piece.kind));
    }
    visibleKinds.forEach(kind => {
      const scopeKey = ADVANCED_PIECES.some(piece => piece.kind === kind) ? 'shogi-advanced' : 'shogi-standard';
      const discoveryKey = `${scopeKey}-${kind}`;
      if (discoveredShogiPiecesRef.current.has(discoveryKey)) return;
      discoveredShogiPiecesRef.current.add(discoveryKey);
      storageService.markMiniGameDiscovered('SHOGI', discoveryKey);
    });
  }, [game]);

  useEffect(() => {
    void audioService.playBGM('poker_play');
  }, []);

  const startGame = (mode: ShogiMode, stage: number, playMode: ShogiPlayMode = 'CPU') => {
    setShowMissionQuiz(false);
    // Quiz/result screens may change the BGM. Every new board, including the
    // Advance "next stage" action, explicitly restores the poker track.
    void audioService.playBGM('poker_play');
    setGame(createShogiGame(mode, stage, Date.now() + stage * 97, playMode));
    setInspect(null);
  };

  const restart = () => {
    if (!game) return;
    startGame(game.mode, game.stage, game.playMode);
  };

  const openStagePicker = () => {
    if (!game) return;
    setStartMode(game.mode);
    setStartPlayMode(game.playMode);
    setStartStage(game.mode === 'ADVANCE' ? Math.min(100, game.stage + 1) : 1);
    setGame(null);
  };

  useEffect(() => {
    if (!game?.result) return;
    if (game.result === 'WIN' && game.playMode === 'CPU') {
      setShowMissionQuiz(true);
      setProgress(previous => {
        const nextProgress: ShogiProgress = game.mode === 'ADVANCE'
          ? {
            ...previous,
            highestStage: Math.max(previous.highestStage, Math.min(100, game.stage + 1)),
            completedStages: Array.from(new Set([...previous.completedStages, game.stage])).sort((a, b) => a - b),
          }
          : { ...previous, standardWins: previous.standardWins + 1 };
        saveProgress(nextProgress);
        return nextProgress;
      });
    }
  }, [game?.result, game?.mode, game?.stage, game?.playMode]);

  const selectedTarget = useMemo(
    () => game?.selected ? getShogiMovementTargets(game.board, game.hands, game.selected, game.side) : [],
    [game?.board, game?.hands, game?.selected, game?.side],
  );

  const beginLongPress = (piece: ShogiPiece, row?: number, col?: number) => {
    longPressTriggered.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      const selection = row !== undefined && col !== undefined ? { row, col } : { hand: piece.kind };
      setInspect({ piece, targetCount: game ? getShogiMovementTargets(game.board, game.hands, selection, piece.side).length : 0 });
    }, 450);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const inspectBoardPiece = (piece: ShogiPiece, row: number, col: number) => {
    setInspect({ piece, targetCount: game ? getShogiMovementTargets(game.board, game.hands, { row, col }, piece.side).length : 0 });
  };
  const onSquare = (row: number, col: number) => {
    if (!game || game.result) return;
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (game.selected) {
      const isTarget = selectedTarget.some(target => target.row === row && target.col === col);
      if (isTarget) {
        setGame(previous => previous ? playShogiMove(previous, [row, col]) : previous);
        return;
      }
      if (game.board[row][col]?.side === game.side) {
        setGame(previous => previous ? selectShogiPiece(previous, { row, col }) : previous);
        return;
      }
      setGame(previous => previous ? { ...previous, message: copy(languageMode, '表示された候補を選んでください。', 'Choose a highlighted destination.') } : previous);
      return;
    }
    if (game.board[row][col]?.side === game.side) setGame(previous => previous ? selectShogiPiece(previous, { row, col }) : previous);
  };

  if (!game) return <ModeStart languageMode={languageMode} progress={progress} initialMode={startMode} initialPlayMode={startPlayMode} initialStage={startStage} onStart={startGame} onBack={onBack} />;

  const targetAt = (row: number, col: number) => selectedTarget.find(target => target.row === row && target.col === col);
  const playerHand = Object.entries(game.hands.P).filter(([, count]) => Number(count) > 0) as Array<[ShogiPieceKind, number]>;
  const cpuHand = Object.entries(game.hands.C).filter(([, count]) => Number(count) > 0) as Array<[ShogiPieceKind, number]>;
  const cpuHandCount = cpuHand.reduce((sum, [, count]) => sum + count, 0);
  const statusText = game.result
    ? game.playMode === 'LOCAL'
      ? game.result === 'WIN' ? copy(languageMode, '先手の勝利！', 'FIRST PLAYER WINS!') : game.result === 'LOSE' ? copy(languageMode, '後手の勝利！', 'SECOND PLAYER WINS!') : copy(languageMode, '引き分け', 'DRAW')
      : game.result === 'WIN' ? copy(languageMode, '勝利！', 'VICTORY!') : game.result === 'LOSE' ? copy(languageMode, '敗北', 'DEFEAT') : copy(languageMode, '引き分け', 'DRAW')
    : game.message;
  // 駒名・駒字は日本語の固有表記。英語の遅延DOM翻訳から保護する。
  return (
    <main className="shogi-mini-shell is-playing" data-allow-japanese="true">
      <div className="shogi-mini-backdrop" style={{ backgroundImage: 'url("' + assetUrl('sprites/backgrounds/mini-games/shogi.png') + '")' }} />
      <header className="shogi-mini-header">
        <button type="button" onClick={onBack}>← EXIT</button>
        <div><span>LEARNING ROGUE // TRIVIA LAB</span><b>{game.mode === 'ADVANCE' ? 'ADVANCE SHOGI' : 'MINI SHOGI'}</b></div>
        <strong>{game.playMode === 'LOCAL' ? 'LOCAL // ' + (game.mode === 'ADVANCE' ? 'ADV RANDOM' : 'STANDARD') : game.mode === 'ADVANCE' ? 'STAGE ' + String(game.stage).padStart(2, '0') + ' / 100' : 'RANDOM DUEL'}</strong>
        <button type="button" onClick={() => setShowGuide(true)}>MOVES</button>
      </header>
      <div className="shogi-mini-layout">
        <aside className="shogi-mini-side-panel">
          <p className="shogi-mini-eyebrow">{game.mode === 'ADVANCE' ? 'UNIQUE PIECES' : 'STANDARD PIECES'}</p>
          <h2>{game.mode === 'ADVANCE' ? getAdvancedStageUniqueCount(game.stage) + ' TYPES ACTIVE' : '8 TYPES ACTIVE'}</h2>
          <div className="shogi-mini-side-list">
            {STANDARD_PIECES.map(piece => <span key={piece.kind}><ShogiPieceIcon glyph={piece.glyph} compact />{pieceLabelFor(piece)}</span>)}
            {game.mode === 'ADVANCE' && ADVANCED_PIECES.slice(0, Math.min(50, game.stage)).slice(-getAdvancedStageUniqueCount(game.stage)).map(piece => <span key={piece.kind} className="unique"><ShogiPieceIcon glyph={piece.glyph} compact />{pieceLabelFor(piece)}</span>)}
          </div>
          <div className="shogi-mini-help">
            <b>{copy(languageMode, '操作', 'CONTROLS')}</b>
            <p>{copy(languageMode, '駒を選択：駒本来の移動先を表示', 'Select: show piece movement')}</p>
            <p>{copy(languageMode, '長押し／I：駒の詳細', 'Hold / I: inspect piece')}</p>
          </div>
        </aside>
        <section className="shogi-mini-board-wrap">
          <div className="shogi-opponent-hand" aria-label={copy(languageMode, game.playMode === 'LOCAL' ? '後手の持ち駒' : '相手の持ち駒', game.playMode === 'LOCAL' ? 'SECOND PLAYER HAND' : 'OPPONENT HAND')}>
            <div className="shogi-opponent-hand-heading">
              <span>{copy(languageMode, game.playMode === 'LOCAL' ? '後手の持ち駒' : '相手の持ち駒', game.playMode === 'LOCAL' ? 'SECOND PLAYER HAND' : 'OPPONENT HAND')}</span>
              <b>{cpuHandCount}</b>
            </div>
            <div className="shogi-opponent-hand-list">
              {cpuHand.length ? cpuHand.map(([kind, count]) => {
                const definition = getPieceDefinition(kind);
                return (
                  <button
                    key={kind}
                    type="button"
                    title={pieceLabelFor(definition)}
                    disabled={game.playMode !== 'LOCAL' || game.side !== 'C'}
                    className={game.side === 'C' && game.selected && 'hand' in game.selected && game.selected.hand === kind ? 'selected' : ''}
                    onClick={() => setGame(previous => previous ? selectShogiPiece(previous, { hand: kind }) : previous)}
                    onPointerDown={() => beginLongPress({ kind, side: 'C', promoted: false, hasMoved: false })}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                  >
                    <ShogiPieceIcon glyph={definition.glyph} cpu compact />
                    <b>{pieceLabelFor(definition)}</b>
                    <em>× {count}</em>
                  </button>
                );
              }) : <small>{copy(languageMode, 'まだありません', 'NONE', 'まだありません')}</small>}
            </div>
          </div>
          <div className="shogi-mini-status">
            <span>{copy(languageMode, '手番', 'TURN', 'てばん')} {game.turn}</span>
            <b className={game.side === 'P' ? 'player' : 'cpu'}>{game.playMode === 'LOCAL' ? (game.side === 'P' ? copy(languageMode, '先手', 'FIRST PLAYER') : copy(languageMode, '後手', 'SECOND PLAYER')) : game.side === 'P' ? 'PLAYER PHASE' : 'CPU PHASE'}</b>
            <span>{game.result ? statusText : localizeShogiMessage(statusText, languageMode)}</span>
          </div>
          <div className="shogi-mini-board" role="grid" aria-label={copy(languageMode, '5×5将棋盤', '5x5 shogi board', '5×5しょうぎばん')}>
            {game.board.map((line, row) => line.map((piece, col) => {
              const target = targetAt(row, col);
              const selectedHere = game.selected && 'row' in game.selected && game.selected.row === row && game.selected.col === col;
              return (
                <button
                  key={row + '-' + col}
                  type="button"
                  role="gridcell"
                  aria-label={piece ? piece.kind + ' ' + (piece.promoted ? glyphFor(piece) : pieceLabelFor(getPieceDefinition(piece.kind))) : copy(languageMode, 'empty square', 'empty square', 'からのマス')}
                  className={'shogi-square ' + (selectedHere ? 'selected ' : '') + (target ? 'target-' + target.status.toLowerCase() : '') + (row < 2 ? ' cpu-zone' : row > 2 ? ' player-zone' : ' neutral-zone')}
                  onClick={() => onSquare(row, col)}
                  onPointerDown={() => piece && beginLongPress(piece, row, col)}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onContextMenu={event => {
                    event.preventDefault();
                    if (piece) inspectBoardPiece(piece, row, col);
                  }}
                  onKeyDown={event => {
                    if (piece && (event.key.toLowerCase() === 'i' || event.key === '?')) inspectBoardPiece(piece, row, col);
                  }}
                >
                  {piece && <ShogiPieceIcon glyph={glyphFor(piece)} cpu={piece.side === 'C'} promoted={piece.promoted} className="shogi-piece" />}
                  {target && <span className="shogi-target-marker" aria-label={targetLabel(target, languageMode)}>{target.status === 'CAPTURE' ? '×' : target.status === 'DROP' ? '↓' : target.status === 'SPECIAL' ? '◇' : '•'}</span>}
                </button>
              );
            }))}
          </div>
          <GuideLegend languageMode={languageMode} />
          <div className="shogi-mini-message">{game.result ? statusText : localizeShogiMessage(statusText, languageMode)}</div>
          {game.result && (
            <div className="shogi-result-panel">
              <b>{statusText}</b>
              <span>{game.mode === 'ADVANCE' && game.result === 'WIN' ? 'STAGE ' + game.stage + ' CLEAR' : 'SEED ' + game.seed}</span>
              <div>
                <button type="button" className="primary" onClick={restart}>{copy(languageMode, '新しい盤面で再戦', 'Replay with new board')}</button>
                {game.playMode === 'CPU' && game.mode === 'ADVANCE' && game.result === 'WIN' && game.stage < 100 && <button type="button" className="primary" onClick={() => startGame('ADVANCE', game.stage + 1, 'CPU')}>{copy(languageMode, '次のステージへ', 'Next stage')}</button>}
                <button type="button" className="secondary" onClick={openStagePicker}>{game.playMode === 'LOCAL' ? copy(languageMode, '対戦設定へ', 'Match settings') : copy(languageMode, 'ステージを選ぶ', 'Choose a stage')}</button>
                {game.playMode === 'CPU' && game.result === 'WIN' && onFinish && <button type="button" className="secondary" onClick={() => onFinish('WIN')}>{copy(languageMode, '結果へ', 'Continue')}</button>}
              </div>
            </div>
          )}
        </section>
        <aside className="shogi-mini-hand-panel">
          <p className="shogi-mini-eyebrow">{copy(languageMode, game.playMode === 'LOCAL' ? '先手の持ち駒' : '持ち駒', game.playMode === 'LOCAL' ? 'FIRST PLAYER HAND' : 'CAPTURED PIECES')}</p>
          <h2>{playerHand.length ? playerHand.reduce((sum, [, count]) => sum + count, 0) : 0}</h2>
          <div className="shogi-hand-list">
            {playerHand.length ? playerHand.map(([kind, count]) => {
              const selectedHand = game.selected && 'hand' in game.selected && game.selected.hand === kind;
              const definition = getPieceDefinition(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  disabled={game.side !== 'P'}
                  className={selectedHand ? 'selected' : ''}
                  onClick={() => setGame(previous => previous ? selectShogiPiece(previous, { hand: kind }) : previous)}
                  onPointerDown={() => beginLongPress({ kind, side: 'P', promoted: false, hasMoved: false })}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onKeyDown={event => {
                    if (event.key.toLowerCase() === 'i' || event.key === '?') setInspect({ piece: { kind, side: 'P', promoted: false, hasMoved: false }, targetCount: game ? getShogiMovementTargets(game.board, game.hands, { hand: kind }, 'P').length : 0 });
                  }}
                >
              <ShogiPieceIcon glyph={definition.glyph} compact /><b>{pieceLabelFor(definition)}</b><em>× {count}</em>
                </button>
              );
            }) : <p>{copy(languageMode, 'まだありません。相手駒を取るとここへ入ります。', 'None yet. Captured pieces appear here.', 'まだありません。あいてこまをとるとここへはいります。')}</p>}
          </div>
          {game.selected && 'hand' in game.selected && <div className="shogi-drop-hint">{copy(languageMode, '黄色い矢印のマスへ打てます。', 'Drop on squares marked with yellow arrows.', 'きいろいやじるしのマスへうてます。')}</div>}
          <button type="button" className="shogi-replay-button" onClick={restart}>{copy(languageMode, '盤面を引き直す', 'New random board', 'ばんめんをひきなおす')}</button>
        </aside>
      </div>
      {inspect && <PieceInspector piece={inspect.piece} targetCount={inspect.targetCount} languageMode={languageMode} onClose={() => setInspect(null)} />}
      {showMissionQuiz && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/95 p-2 sm:p-4" data-gamepad-modal="true">
          <MiniGameProblemChallenge
            mode={problemMode}
            modePool={problemModePool}
            answerMode={answerMode}
            assignment={assignment}
            onAnswerResult={onAnswerResult}
            onComplete={() => setShowMissionQuiz(false)}
            languageMode={languageMode}
            rewardHint={languageMode === 'ENGLISH' ? 'Mission clear quiz complete' : 'ミッションクリア問題を完了しました'}
          />
        </div>
      )}
      {showGuide && (
        <div className="shogi-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowGuide(false)}>
          <section className="shogi-piece-modal shogi-move-guide" onClick={event => event.stopPropagation()}>
            <button type="button" className="shogi-modal-close" onClick={() => setShowGuide(false)}>×</button>
            <p className="shogi-mini-eyebrow">MOVE REFERENCE // STANDARD</p>
            <h2>{copy(languageMode, '標準駒の動き', 'Standard piece movement')}</h2>
            <div className="shogi-standard-grid">{STANDARD_PIECES.map(piece => <button key={piece.kind} type="button" onClick={() => setInspect({ piece: { kind: piece.kind, side: 'P', promoted: false, hasMoved: false }, targetCount: 0 })}><ShogiPieceIcon glyph={piece.glyph} compact /><span>{pieceLabelFor(piece)}</span></button>)}</div>
            <p className="shogi-guide-note">{copy(languageMode, '龍は飛車＋斜め1マス、馬は角＋縦横1マスです。駒を長押しすると、現在の盤面での移動先数も確認できます。王が取られる手も指せるため、敗北から守り方を学べます。', '龍 = rook plus one diagonal step. 馬 = bishop plus one orthogonal step. Hold a piece to see its movement count. Risky moves remain playable so defeat can teach king safety.', 'りゅうはひしゃ＋ななめ1マス、うまはかく＋たてよこ1マスです。こまをながおしすると、げんざいのばんめんでのいどうさきすうもかくにんできます。おうがとられるてもさせるため、はいぼくからまもりかたをまなべます。')}</p>
          </section>
        </div>
      )}
    </main>
  );
};

export default ShogiMiniGame;
