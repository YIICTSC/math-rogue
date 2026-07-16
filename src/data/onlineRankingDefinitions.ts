import type { OnlineRankingDefinition, OnlinePeriodType } from '../services/onlineRankingService';

export const ONLINE_RANKING_FALLBACKS: OnlineRankingDefinition[] = [
  { id: 'learning_correct', label: '今週の正解王', unit: '問', accent: 'cyan', description: '期間内に正解した問題数' },
  { id: 'learning_accuracy', label: '正答率マスター', unit: '%', accent: 'green', description: '10問以上に挑戦したときの正答率' },
  { id: 'learning_retry', label: '苦手克服王', unit: '問', accent: 'violet', description: '間違えた後に正解できた問題数' },
  { id: 'assignment_complete', label: '課題達成王', unit: '件', accent: 'amber', description: '達成した課題数' },
  { id: 'adventure_score', label: '冒険王', unit: 'pt', accent: 'rose', description: '1人での冒険の最高スコア' },
  { id: 'coop_adventure_score', label: '協力プレイ冒険', unit: 'pt', accent: 'lime', description: '登録済みの仲間と協力して記録したチーム最高スコア', scope: 'team' },
  { id: 'card_standard_power', label: '最強カード王', unit: '威力', accent: 'lime', description: '標準条件の最大威力' },
  { id: 'card_efficiency', label: 'カードコスパ王', unit: '威力/EN', accent: 'orange', description: 'エナジー1あたりの最大標準威力' },
  { id: 'card_collection', label: 'カードコレクター', unit: '種', accent: 'blue', description: 'カードの収集数' },
  { id: 'card_collection_rate', label: 'カード収集率王', unit: '%', accent: 'teal', description: '通常カード全体に対する収集率' },
  { id: 'card_actual_damage', label: '実戦最大一撃王', unit: 'ダメージ', accent: 'red', description: '実戦で記録した1回の最大ダメージ' },
  { id: 'poker_best_hand', label: '放課後ポーカー', unit: '点', accent: 'gold', description: '放課後ポーカーの最高ハンド得点' },
  { id: 'survivor_score', label: '校庭サバイバー', unit: 'pt', accent: 'magenta', description: '校庭サバイバーの最高スコア' },
  { id: 'dungeon_score', label: '風来の小学生', unit: 'pt', accent: 'indigo', description: '風来の小学生の最高スコア' },
  { id: 'dungeon2_score', label: '風来の小学生2', unit: 'pt', accent: 'navy', description: '風来の小学生2の最高スコア' },
  { id: 'kocho_score', label: '校長対決', unit: 'pt', accent: 'purple', description: '校長対決・エンドレスの最高到達スコア' },
  { id: 'paper_plane_score', label: '紙飛行機バトル', unit: 'pt', accent: 'sky', description: '紙飛行機バトルの最高スコア' },
  { id: 'go_home_score', label: '帰宅ダッシュ', unit: 'pt', accent: 'yellow', description: '帰宅ダッシュの最高スコア' },
  { id: 'growth_clear_count', label: '冒険踏破王', unit: '回', accent: 'emerald', description: '学習ローグの累計クリア回数' },
  { id: 'growth_mastered_modes', label: '学びの達人王', unit: '分野', accent: 'mint', description: 'マスターした学習分野の数' },
];

export type OnlineRankingCategoryId = 'learning' | 'adventure' | 'cards' | 'minigames' | 'growth';

export type OnlineRankingCategory = {
  id: OnlineRankingCategoryId;
  label: string;
  caption: string;
  rankingIds: string[];
};

export const ONLINE_RANKING_CATEGORIES: OnlineRankingCategory[] = [
  {
    id: 'learning',
    label: '問題・課題',
    caption: 'LEARNING',
    rankingIds: ['learning_correct', 'learning_accuracy', 'learning_retry', 'assignment_complete'],
  },
  {
    id: 'adventure',
    label: '冒険・協力',
    caption: 'ADVENTURE',
    rankingIds: ['adventure_score', 'coop_adventure_score'],
  },
  {
    id: 'cards',
    label: 'カード',
    caption: 'CARDS',
    rankingIds: ['card_standard_power', 'card_efficiency', 'card_collection', 'card_collection_rate', 'card_actual_damage'],
  },
  {
    id: 'minigames',
    label: 'ミニゲーム',
    caption: 'MINIGAMES',
    rankingIds: ['poker_best_hand', 'survivor_score', 'dungeon_score', 'dungeon2_score', 'kocho_score', 'paper_plane_score', 'go_home_score'],
  },
  {
    id: 'growth',
    label: '成長',
    caption: 'GROWTH',
    rankingIds: ['growth_clear_count', 'growth_mastered_modes'],
  },
];

export const getOnlineRankingCategory = (rankingId: string) => (
  ONLINE_RANKING_CATEGORIES.find((category) => category.rankingIds.includes(rankingId)) || ONLINE_RANKING_CATEGORIES[0]
);

export const getOnlineRankingLabel = (rankingId: string) => (
  ONLINE_RANKING_FALLBACKS.find((ranking) => ranking.id === rankingId)?.label || rankingId
);

export const getOnlineRankingPeriodLabel = (periodType: OnlinePeriodType | string) => {
  if (periodType === 'daily') return '今日のランキング';
  if (periodType === 'weekly') return '週間ランキング';
  if (periodType === 'monthly') return '月間ランキング';
  if (periodType === 'season') return 'シーズンランキング';
  if (periodType === 'all') return '歴代ランキング';
  return 'ランキング';
};
