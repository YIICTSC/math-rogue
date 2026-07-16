import type { OnlineRankingDefinition, OnlinePeriodType } from '../services/onlineRankingService';

export const ONLINE_RANKING_FALLBACKS: OnlineRankingDefinition[] = [
  { id: 'learning_correct', label: '今週の正解王', unit: '問', accent: 'cyan', description: '期間内に正解した問題数', calculation: '期間内の日別集計の正解数を合計' },
  { id: 'learning_accuracy', label: '正答率マスター', unit: '%', accent: 'green', description: '10問以上に挑戦したときの正答率', calculation: '期間内の正解数÷解答数×100（10問以上で掲載・小数第2位まで）' },
  { id: 'learning_retry', label: '苦手克服王', unit: '問', accent: 'violet', description: '間違えた後に正解できた問題数', calculation: '期間内に一度間違えた後で正解した問題数を合計' },
  { id: 'assignment_complete', label: '課題達成王', unit: '件', accent: 'amber', description: '達成した課題数', calculation: '期間内に最後まで達成した課題数を合計' },
  { id: 'adventure_score', label: '冒険王', unit: 'pt', accent: 'rose', description: '1人での冒険の最高スコア', calculation: '期間内に完了した1人用冒険の最高スコア' },
  { id: 'coop_adventure_score', label: '協力プレイ冒険', unit: 'pt', accent: 'lime', description: '登録済みの仲間と協力して記録したチーム最高スコア', calculation: '同じ登録メンバーで遊んだ協力冒険の期間内最高スコア', scope: 'team' },
  { id: 'card_standard_power', label: '最強カード王', unit: '威力', accent: 'lime', description: '標準条件の最大威力', calculation: '各所持カードの（基本・条件加算ダメージ合計）×発動回数の最大値' },
  { id: 'card_efficiency', label: 'カードコスパ王', unit: '威力/EN', accent: 'orange', description: 'エナジー1あたりの最大標準威力', calculation: '各所持カードの標準威力÷max（1・消費EN）の最大値（小数第2位まで）' },
  { id: 'card_collection', label: 'カードコレクター', unit: '種', accent: 'blue', description: 'カードの収集数', calculation: '解放済み通常カードの種類数＋所持している報酬カード枚数' },
  { id: 'card_block', label: '最強鉄壁王', unit: 'ブロック', accent: 'teal', description: '標準条件で測ったカード1枚の最大ブロック', calculation: '各所持カードの記載ブロック値×発動回数の最大値' },
  { id: 'card_actual_damage', label: '実戦最大一撃王', unit: 'ダメージ', accent: 'red', description: '実戦で記録した1回の最大ダメージ', calculation: '端末に保存された通常戦闘のカード1ヒット最大実ダメージ' },
  { id: 'poker_best_hand', label: '放課後ポーカー', unit: '点', accent: 'gold', description: '放課後ポーカーの最高ハンド得点', calculation: '期間内に完成したポーカーハンド得点の最大値' },
  { id: 'survivor_score', label: '校庭サバイバー', unit: 'pt', accent: 'magenta', description: '校庭サバイバーの最高スコア', calculation: '期間内の校庭サバイバー終了スコアの最大値' },
  { id: 'dungeon_score', label: '風来の小学生', unit: 'pt', accent: 'indigo', description: '風来の小学生の最高スコア', calculation: '期間内の風来の小学生終了スコアの最大値' },
  { id: 'dungeon2_score', label: '風来の小学生2', unit: 'pt', accent: 'navy', description: '風来の小学生2の最高スコア', calculation: '期間内の風来の小学生2終了スコアの最大値' },
  { id: 'kocho_score', label: '校長対決', unit: 'pt', accent: 'purple', description: '校長対決・エンドレスの最高到達スコア', calculation: '各記録のmax（エンドレス得点・階層×1000＋撃破数・ステージ×100＋勝利時50）の期間内最大値' },
  { id: 'paper_plane_score', label: '紙飛行機バトル', unit: 'pt', accent: 'sky', description: '紙飛行機バトルの最高スコア', calculation: '期間内の紙飛行機バトル終了スコアの最大値' },
  { id: 'go_home_score', label: '帰宅ダッシュ', unit: 'pt', accent: 'yellow', description: '帰宅ダッシュの最高スコア', calculation: '期間内の帰宅ダッシュ終了スコアの最大値' },
  { id: 'growth_clear_count', label: '冒険踏破王', unit: '回', accent: 'emerald', description: '学習ローグの累計クリア回数', calculation: '端末に保存された学習ローグの累計クリア回数' },
  { id: 'growth_mastered_modes', label: '学びの達人王', unit: '分野', accent: 'mint', description: 'マスターした学習分野の数', calculation: 'タイピング系を除き、累計正解数が100問以上になった学習モードの重複しない種類数' },
];

export type OnlineRankingCategoryId = 'learning' | 'adventure' | 'cards' | 'minigames';

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
    rankingIds: ['learning_correct', 'learning_accuracy', 'learning_retry', 'assignment_complete', 'growth_mastered_modes'],
  },
  {
    id: 'adventure',
    label: '冒険・協力',
    caption: 'ADVENTURE',
    rankingIds: ['adventure_score', 'coop_adventure_score', 'growth_clear_count'],
  },
  {
    id: 'cards',
    label: 'カード',
    caption: 'CARDS',
    rankingIds: ['card_standard_power', 'card_efficiency', 'card_collection', 'card_block', 'card_actual_damage'],
  },
  {
    id: 'minigames',
    label: 'ミニゲーム',
    caption: 'MINIGAMES',
    rankingIds: ['poker_best_hand', 'survivor_score', 'dungeon_score', 'dungeon2_score', 'kocho_score', 'paper_plane_score', 'go_home_score'],
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
