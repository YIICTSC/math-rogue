
import { GameScreen } from './types';
import { storageService } from './services/storageService';
import { Club, Skull, Compass, Mountain, Crown, Send, LucideIcon, Rocket } from 'lucide-react';

export interface MiniGameConfig {
  id: string;
  name: string;
  description: string;
  screen: GameScreen;
  threshold: number;
  typeLabel: string;
  typeColor: string;
  glowColor: string;
  icon: LucideIcon;
  clearAction: () => void;
}

export const MINI_GAMES: MiniGameConfig[] = [
  {
    id: 'GO_HOME',
    name: '帰宅ダッシュ',
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
    description: '役を作ってスコアを稼げ！アイテムを駆使するローグライク。',
    screen: GameScreen.MINI_GAME_POKER,
    threshold: 1500,
    typeLabel: 'POPULAR',
    typeColor: 'bg-purple-600',
    glowColor: 'rgba(168,85,247,0.4)',
    icon: Club,
    clearAction: () => storageService.clearPokerState()
  },
  {
    id: 'DUNGEON',
    name: '風来の小学生',
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
    description: '更なる深淵へ...進化したローグライクRPG。',
    screen: GameScreen.MINI_GAME_DUNGEON_2,
    threshold: 3500,
    typeLabel: 'SEQUEL',
    typeColor: 'bg-cyan-700',
    glowColor: 'rgba(34,211,238,0.4)',
    icon: Mountain,
    clearAction: () => storageService.clearDungeonState2()
  }
];
