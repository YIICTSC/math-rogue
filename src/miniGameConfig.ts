
import { GameScreen } from './types';
import { storageService } from './services/storageService';
import { Club, Skull, Compass, Mountain, Crown, Send, LucideIcon, Rocket, Gem, Dice5, Sparkles, CircleDot, Grid3X3, Layers3, Heart } from 'lucide-react';
import { clearSchoolTrpgCampaign } from './mini-games/school-trpg/schoolTrpgSave';
import { RUSH_BEST_KEY, STORY_KEY } from './mini-games/after-school-rush/rules';

export interface MiniGameConfig {
  id: string;
  name: string;
  titleLines: string[];
  description: string;
  screen: GameScreen;
  threshold: number;
  /**
   * Main-adventure clears required before this game appears.  The original
   * seven games continue to use `threshold` (correct answers); the seven
   * trivia mini-games use this progression so they are earned by actually
   * finishing the main adventure.
   */
  mainClearRequired?: number;
  typeLabel: string;
  typeColor: string;
  glowColor: string;
  icon: LucideIcon;
  clearAction: () => void;
  /** 雑学カテゴリから直接開くゲーム。後方互換のため残している表示制御フラグ。 */
  categoryOnly?: boolean;
}

export interface MiniGameUnlockProgress {
  totalMathCorrect: number;
  mainClearCount: number;
}

export const isMiniGameUnlocked = (
  game: MiniGameConfig,
  progress: MiniGameUnlockProgress,
): boolean => (
  progress.totalMathCorrect >= game.threshold
  && progress.mainClearCount >= (game.mainClearRequired ?? 0)
);

export const MINI_GAMES: MiniGameConfig[] = [
  {
    id: 'KOTOBA_LIFE',
    name: 'ことば日和',
    titleLines: ['ことば日和'],
    description: 'ことばを教え、小さなともだちと暮らす会話ゲーム。',
    screen: GameScreen.MINI_GAME_KOTOBA_LIFE,
    threshold: 0,
    typeLabel: 'LIFE',
    typeColor: 'bg-emerald-800',
    glowColor: 'rgba(168,200,160,0.5)',
    icon: Heart,
    clearAction: () => localStorage.removeItem('learning-rogue:kotoba-life:v1'),
  },
  {
    id: 'GAKURO',
    categoryOnly: true, // Launched from the main title, not the mini-game list.
    name: 'GAKURO VRトレーニング',
    titleLines: ['GAKURO', 'VRトレーニング'],
    description: '見回りをかわし、資料を集めて学校から脱出。',
    screen: GameScreen.MINI_GAME_GAKUROGEAR,
    threshold: 0,
    typeLabel: 'STEALTH',
    typeColor: 'bg-emerald-900',
    glowColor: 'rgba(150,200,160,0.4)',
    icon: Compass,
    clearAction: () => { localStorage.removeItem('gakurogear-vr-v1'); }
  },
  {
    id: 'AFTER_SCHOOL_RUSH',
    name: '放課後ミニラッシュ',
    titleLines: ['放課後ミニラッシュ'],
    description: 'スティックとA・Bで、走る・跳ぶ・よける！ 全240本の瞬間アクション。',
    screen: GameScreen.MINI_GAME_AFTER_SCHOOL_RUSH,
    threshold: 0,
    typeLabel: 'ARCADE',
    typeColor: 'bg-violet-700',
    glowColor: 'rgba(246,191,77,0.55)',
    icon: Sparkles,
    clearAction: () => {
      localStorage.removeItem(RUSH_BEST_KEY);
      localStorage.removeItem(STORY_KEY);
    },
  },
  {
    id: 'GO_HOME',
    name: '帰宅ダッシュ',
    titleLines: ['帰宅', 'ダッシュ'],
    description: '障害物をかわし、教科を育てて帰宅を目指そう。',
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
    description: '武器を育て、校庭に迫る敵の大群を切り抜けよう。',
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
    description: '役をそろえ、サポーターと高得点を目指そう。',
    screen: GameScreen.MINI_GAME_POKER,
    threshold: 1500,
    typeLabel: 'CARD',
    typeColor: 'bg-purple-600',
    glowColor: 'rgba(168,85,247,0.4)',
    icon: Club,
    clearAction: () => storageService.clearPokerState()
  },
  {
    id: 'CARD_CLUB',
    name: '放課後トランプゲーム集',
    titleLines: ['放課後', 'トランプゲーム集'],
    description: '世界のトランプゲームを、ひとりでもオンラインでも。',
    screen: GameScreen.MINI_GAME_CARD_CLUB,
    threshold: 1500,
    typeLabel: 'CARD CLUB',
    typeColor: 'bg-emerald-900',
    glowColor: 'rgba(234,208,142,0.5)',
    icon: Club,
    clearAction: () => {},
  },
  {
    id: 'DUNGEON',
    name: '学習ローグダンジョンズ',
    titleLines: ['学習ローグ', 'ダンジョンズ'],
    description: '道具とひらめき技を駆使して、毎回変わる迷宮を探索。',
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
    description: '行動を予約し、連携で敵を倒す戦略バトル。',
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
    description: 'パーツで機体を組み、3×3マスの自動バトル。',
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
    name: '学習ローグダンジョンズ2',
    titleLines: ['学習ローグ', 'ダンジョンズ2'],
    description: 'カードとひらめき技で挑む、奥深い迷宮探索。',
    screen: GameScreen.MINI_GAME_DUNGEON_2,
    threshold: 3500,
    typeLabel: 'SEQUEL',
    typeColor: 'bg-cyan-700',
    glowColor: 'rgba(34,211,238,0.4)',
    icon: Mountain,
    clearAction: () => storageService.clearDungeonState2()
  },
  {id:'STAR_TIDE',name:'星潮の航路',titleLines:['星潮の','航路'],description:'風と火を活かし、探索と料理を楽しむ冒険RPG。',screen:GameScreen.MINI_GAME_STAR_TIDE,threshold:4000,typeLabel:'ARPG',typeColor:'bg-teal-800',glowColor:'rgba(121,211,197,0.5)',icon:Compass,clearAction:()=>localStorage.removeItem('learning-rogue:star-tide:v1')},
  {id:'LANTERN_WAR',name:'継界戦記 灯を継ぐ者たち',titleLines:['継界戦記','灯を継ぐ者たち'],description:'仲間を編成し、作戦と部隊指揮で戦場を切り開こう。',screen:GameScreen.MINI_GAME_LANTERN_WAR,threshold:4500,typeLabel:'SRPG',typeColor:'bg-emerald-950',glowColor:'rgba(215,188,128,0.5)',icon:Crown,clearAction:()=>localStorage.removeItem('learning-rogue:lantern-war:v1')},
  {
    id: 'SHOGI',
    name: 'ミニ将棋',
    titleLines: ['ミニ', '将棋'],
    description: '駒を動かし、王を守る戦い方を学ぶ5×5将棋。',
    screen: GameScreen.MINI_GAME_SHOGI,
    threshold: 0,
    mainClearRequired: 1,
    typeLabel: 'SHOGI',
    typeColor: 'bg-red-700',
    glowColor: 'rgba(185,28,28,0.4)',
    icon: Grid3X3,
    clearAction: () => {}
  },
  {
    id: 'GO',
    name: '九路盤 囲碁',
    titleLines: ['九路盤', '囲碁'],
    description: '石を囲んで取り、盤上の陣地を広げよう。',
    screen: GameScreen.MINI_GAME_GO,
    threshold: 0,
    mainClearRequired: 2,
    typeLabel: 'GO',
    typeColor: 'bg-stone-600',
    glowColor: 'rgba(120,113,108,0.4)',
    icon: CircleDot,
    clearAction: () => {}
  },
  {
    id: 'CHESS',
    name: 'スクールチェス',
    titleLines: ['スクール', 'チェス'],
    description: '駒の動きを覚え、キングを守る戦略を磨こう。',
    screen: GameScreen.MINI_GAME_CHESS,
    threshold: 0,
    mainClearRequired: 3,
    typeLabel: 'CHESS',
    typeColor: 'bg-sky-700',
    glowColor: 'rgba(14,116,144,0.4)',
    icon: Crown,
    clearAction: () => {}
  },
  {
    id: 'MAHJONG',
    name: 'まなび麻雀',
    titleLines: ['まなび', '麻雀'],
    description: '牌と遺物を集め、麻雀の冒険へ出かけよう。',
    screen: GameScreen.MINI_GAME_MAHJONG,
    threshold: 0,
    mainClearRequired: 4,
    typeLabel: 'MAHJONG',
    typeColor: 'bg-teal-700',
    glowColor: 'rgba(13,148,136,0.4)',
    icon: Layers3,
    clearAction: () => {}
  },
  {
    id: 'STONE_GLOW',
    name: '石ころの煌めき',
    titleLines: ['石ころの', '煌めき'],
    description: '石ころと鉱山カードで、得点を競い合おう。',
    screen: GameScreen.MINI_GAME_STONE_GLOW,
    threshold: 0,
    mainClearRequired: 5,
    typeLabel: 'BOARD',
    typeColor: 'bg-emerald-600',
    glowColor: 'rgba(16,185,129,0.4)',
    icon: Gem,
    clearAction: () => {}
  },
  {
    id: 'SCHOOL_TRPG',
    name: '放課後スクールTRPG',
    titleLines: ['放課後', 'スクールTRPG'],
    description: 'サイコロで進める、放課後の物語。',
    screen: GameScreen.MINI_GAME_SCHOOL_TRPG,
    threshold: 0,
    mainClearRequired: 6,
    typeLabel: 'TRPG',
    typeColor: 'bg-amber-600',
    glowColor: 'rgba(245,158,11,0.4)',
    icon: Dice5,
    clearAction: () => clearSchoolTrpgCampaign()
  },
  {
    id: 'LEARNING_TCG',
    name: '学習ローグTCG',
    titleLines: ['学習ローグ', 'TCG'],
    description: 'カードを配置し、3レーンの制圧を目指そう。',
    screen: GameScreen.MINI_GAME_LEARNING_TCG,
    threshold: 0,
    mainClearRequired: 7,
    typeLabel: 'CARD',
    typeColor: 'bg-violet-600',
    glowColor: 'rgba(139,92,246,0.4)',
    icon: Sparkles,
    clearAction: () => {}
  }
];
