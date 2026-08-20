
import { GameScreen } from './types';
import { storageService } from './services/storageService';
import { Club, Skull, Compass, Mountain, Crown, Send, LucideIcon, Rocket, Gem, Dice5, Sparkles, CircleDot, Grid3X3, Layers3 } from 'lucide-react';

export interface MiniGameConfig {
  id: string;
  name: string;
  titleLines: string[];
  description: string;
  screen: GameScreen;
  threshold: number;
  typeLabel: string;
  typeColor: string;
  glowColor: string;
  icon: LucideIcon;
  clearAction: () => void;
  /** 雑学カテゴリから直接開くゲーム。全体のミニゲーム一覧には出さない。 */
  categoryOnly?: boolean;
}

export const MINI_GAMES: MiniGameConfig[] = [
  {
    id: 'GO_HOME',
    name: '帰宅ダッシュ',
    titleLines: ['帰宅', 'ダッシュ'],
    description: '障害物をよけて帰宅せよ！レベルアップで教科を強化。',
    screen: GameScreen.MINI_GAME_GO_HOME,
    threshold: 500,
    typeLabel: 'RUN',
    typeColor: 'bg-orange-600',
    glowColor: 'rgba(249,115,22,0.4)',
    icon: Rocket,
    clearAction: () => {} // ステートレスなゲームとして実装
  },
  {
    id: 'SURVIVOR',
    name: '校庭サバイバー',
    titleLines: ['校庭', 'サバイバー'],
    description: '迫りくる敵の大群から生き残れ！ヴァンサバ風アクション。',
    screen: GameScreen.MINI_GAME_SURVIVOR,
    threshold: 1000,
    typeLabel: 'ACTION',
    typeColor: 'bg-red-600',
    glowColor: 'rgba(239,68,68,0.4)',
    icon: Skull,
    clearAction: () => {
      // Survivorは現状中断データがないためログ出力のみ
      console.log("Survivor state cleared");
    }
  },
  {
    id: 'POKER',
    name: '放課後ポーカー',
    titleLines: ['放課後', 'ポーカー'],
    description: 'ポーカー役でスコアを伸ばせ！サポーターを集めるローグライク。',
    screen: GameScreen.MINI_GAME_POKER,
    threshold: 1500,
    typeLabel: 'CARD',
    typeColor: 'bg-purple-600',
    glowColor: 'rgba(168,85,247,0.4)',
    icon: Club,
    clearAction: () => storageService.clearPokerState()
  },
  {
    id: 'DUNGEON',
    name: '風来の小学生',
    titleLines: ['風来の', '小学生'],
    description: '1000回遊べるランダムダンジョン。GB風ローグライクRPG。',
    screen: GameScreen.MINI_GAME_DUNGEON,
    threshold: 2000,
    typeLabel: 'RETRO',
    typeColor: 'bg-[#306230]',
    glowColor: 'rgba(139,172,15,0.4)',
    icon: Compass,
    clearAction: () => storageService.clearDungeonState()
  },
  {
    id: 'KOCHO',
    name: '校長対決',
    titleLines: ['校長', '対決'],
    description: 'ターン制戦略バトル。行動を予約して敵を倒せ！',
    screen: GameScreen.MINI_GAME_KOCHO,
    threshold: 2500,
    typeLabel: 'STRATEGY',
    typeColor: 'bg-pink-600',
    glowColor: 'rgba(168,85,247,0.4)',
    icon: Crown,
    clearAction: () => storageService.clearKochoState()
  },
  {
    id: 'PAPER_PLANE',
    name: '紙飛行機バトル',
    titleLines: ['紙飛行機', 'バトル'],
    description: 'パーツを組み合わせて機体をビルド。3x3マスの戦略オートバトル。',
    screen: GameScreen.MINI_GAME_PAPER_PLANE,
    threshold: 3000,
    typeLabel: 'BUILD',
    typeColor: 'bg-sky-600',
    glowColor: 'rgba(14,165,233,0.4)',
    icon: Send,
    clearAction: () => storageService.clearPaperPlaneState()
  },
  {
    id: 'DUNGEON_2',
    name: '風来の小学生2',
    titleLines: ['風来の', '小学生2'],
    description: '更なる深淵へ...進化したローグライクRPG。',
    screen: GameScreen.MINI_GAME_DUNGEON_2,
    threshold: 3500,
    typeLabel: 'SEQUEL',
    typeColor: 'bg-cyan-700',
    glowColor: 'rgba(34,211,238,0.4)',
    icon: Mountain,
    clearAction: () => storageService.clearDungeonState2()
  },
  {
    id: 'STONE_GLOW',
    name: '石ころの煌めき',
    titleLines: ['石ころの', '煌めき'],
    description: '石ころを集め、鉱山カードを買って煌めき点を競おう。',
    screen: GameScreen.MINI_GAME_STONE_GLOW,
    threshold: 0,
    typeLabel: 'BOARD',
    typeColor: 'bg-emerald-600',
    glowColor: 'rgba(16,185,129,0.4)',
    icon: Gem,
    categoryOnly: true,
    clearAction: () => {}
  },
  {
    id: 'SCHOOL_TRPG',
    name: '放課後スクールTRPG',
    titleLines: ['放課後', 'スクールTRPG'],
    description: 'サイコロを振って学校生活の物語を進めよう。',
    screen: GameScreen.MINI_GAME_SCHOOL_TRPG,
    threshold: 0,
    typeLabel: 'TRPG',
    typeColor: 'bg-amber-600',
    glowColor: 'rgba(245,158,11,0.4)',
    icon: Dice5,
    categoryOnly: true,
    clearAction: () => {}
  },
  {
    id: 'LEARNING_TCG',
    name: '学習ローグTCG',
    titleLines: ['学習ローグ', 'TCG'],
    description: '本編のカードイラストで3レーンを制圧する配置型TCG。',
    screen: GameScreen.MINI_GAME_LEARNING_TCG,
    threshold: 0,
    typeLabel: 'CARD',
    typeColor: 'bg-violet-600',
    glowColor: 'rgba(139,92,246,0.4)',
    icon: Sparkles,
    categoryOnly: true,
    clearAction: () => {}
  },
  {
    id: 'SHOGI',
    name: 'ミニ将棋',
    titleLines: ['ミニ', '将棋'],
    description: '5×5のランダム盤で駒を動かし、標準8種と50種のユニーク駒で相手の王を詰めよう。',
    screen: GameScreen.MINI_GAME_SHOGI,
    threshold: 0,
    typeLabel: 'SHOGI',
    typeColor: 'bg-red-700',
    glowColor: 'rgba(185,28,28,0.4)',
    icon: Grid3X3,
    categoryOnly: true,
    clearAction: () => {}
  },
  {
    id: 'GO',
    name: '九路盤 囲碁',
    titleLines: ['九路盤', '囲碁'],
    description: '石を置き、相手の石を囲んで取ろう。',
    screen: GameScreen.MINI_GAME_GO,
    threshold: 0,
    typeLabel: 'GO',
    typeColor: 'bg-stone-600',
    glowColor: 'rgba(120,113,108,0.4)',
    icon: CircleDot,
    categoryOnly: true,
    clearAction: () => {}
  },
  {
    id: 'CHESS',
    name: 'スクールチェス',
    titleLines: ['スクール', 'チェス'],
    description: '駒の動きを覚えながら、相手のキングを狙おう。',
    screen: GameScreen.MINI_GAME_CHESS,
    threshold: 0,
    typeLabel: 'CHESS',
    typeColor: 'bg-sky-700',
    glowColor: 'rgba(14,116,144,0.4)',
    icon: Crown,
    categoryOnly: true,
    clearAction: () => {}
  },
  {
    id: 'MAHJONG',
    name: 'まなび麻雀',
    titleLines: ['まなび', '麻雀'],
    description: '牌を入れ替えて、同じ牌の組をそろえよう。',
    screen: GameScreen.MINI_GAME_MAHJONG,
    threshold: 0,
    typeLabel: 'MAHJONG',
    typeColor: 'bg-teal-700',
    glowColor: 'rgba(13,148,136,0.4)',
    icon: Layers3,
    categoryOnly: true,
    clearAction: () => {}
  }
];
