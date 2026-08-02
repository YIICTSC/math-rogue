import { Card, TargetType, CardType } from '../types';
import { CARDS_LIBRARY } from '../constants';
import { storageService } from './storageService';
import { createAssignmentRewardCard } from '../utils/cardUtils';
import { childSafetyService } from './childSafetyService';

export type OnlineRankingProfile = {
  id: string;
  publicCode: string;
  displayName: string;
  token: string;
  registeredAt: string;
};

export type OnlinePeriodType = 'daily' | 'weekly' | 'monthly' | 'season' | 'all';
export type OnlinePlatform = 'web' | 'steam' | 'ios' | 'android';

export type OnlineLeaderboardEntry = {
  entryId?: string;
  playerId?: string;
  teamId?: string;
  displayName: string;
  publicCode?: string;
  memberNames?: string[];
  memberPublicCodes?: string[];
  score: number;
  rank: number;
  metadata?: Record<string, unknown>;
  currentTitle?: string;
};

export type OnlineRankingDefinition = {
  id: string;
  label: string;
  unit: string;
  accent: string;
  description: string;
  calculation: string;
  scope?: 'individual' | 'team';
};

export type OnlineReward = {
  id: string;
  rankingId: string;
  periodType: string;
  periodKey: string;
  awardedRank: number;
  card: Card;
};

const PROFILE_KEY = 'learning_rogue_online_ranking_profile_v1';
const INITIAL_PROMPT_DECLINED_KEY = 'learning_rogue_online_ranking_initial_prompt_declined_v1';
const API_OVERRIDE_KEY = 'learning_rogue_online_ranking_api_v1';
const SUBMISSION_QUEUE_KEY = 'learning_rogue_online_submission_queue_v1';
const DIRTY_SNAPSHOT_KEY = 'learning_rogue_online_snapshot_dirty_v1';
const DEFAULT_RANKING_URL = 'https://learning-rogue-ranking.yishigeict.chatgpt.site';
const AUTO_SYNC_DEBOUNCE_MS = 45_000;

type QueuedSubmission = { id: string; compactKey?: string; path: string; body: string; attempts: number; nextAttemptAt: number; createdAt: number };
class OnlineRequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }
let autoSyncTimer: number | null = null;
let snapshotSyncPromise: Promise<void> | null = null;

const submissionHash = (value: string) => {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash.toString(36);
};

const createGeneratedRankingRewardCard = (reward: OnlineReward): Card => {
  const pool = Object.values(CARDS_LIBRARY).filter((card) =>
    card.type !== CardType.STATUS
    && card.type !== CardType.CURSE
    && card.rarity !== 'SPECIAL'
    && !card.eraserOnly
  );
  const hash = Number.parseInt(submissionHash(reward.id), 36) >>> 0;
  const template = pool[hash % Math.max(1, pool.length)];
  if (!template) return reward.card;
  return {
    ...createAssignmentRewardCard(
      { ...template, id: `ranking-reward-base-${reward.id}` },
      { id: `ranking-reward-card-${reward.id}`, variant: hash % 6 },
    ),
    rewardSource: 'RANKING',
    rankingId: reward.rankingId,
    periodId: reward.periodKey,
    awardedRank: reward.awardedRank,
    grantedAt: new Date().toISOString(),
  };
};

const getQueue = (): QueuedSubmission[] => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SUBMISSION_QUEUE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.path === 'string' && typeof item.body === 'string').slice(-100) : [];
  } catch { return []; }
};

const saveQueue = (queue: QueuedSubmission[]) => {
  try { window.localStorage.setItem(SUBMISSION_QUEUE_KEY, JSON.stringify(queue.slice(-100))); } catch { /* queue failure must not block play */ }
};

const isNonPositiveScoreSubmission = (item: Pick<QueuedSubmission, 'path' | 'body'>) => {
  if (item.path !== '/api/v1/scores' && item.path !== '/api/v1/teams/scores') return false;
  try {
    const value = Number((JSON.parse(item.body) as { value?: unknown }).value);
    return !Number.isFinite(value) || value <= 0;
  } catch {
    return false;
  }
};

const getSubmissionCompactKey = (path: string, body: string) => {
  try {
    const data = JSON.parse(body) as Record<string, unknown>;
    if (path === '/api/v1/cards/snapshot' || path === '/api/v1/activity/snapshot') return path;
    if (path === '/api/v1/learning/daily-summary') return `${path}:${data.date || ''}`;
    if (path === '/api/v1/scores') return `${path}:${data.rankingId || ''}:${data.periodType || ''}:${data.periodKey || ''}`;
    if (path === '/api/v1/teams/scores') return `${path}:${data.recordId || ''}`;
  } catch { /* malformed bodies use the content hash only */ }
  return undefined;
};

const queueSubmission = (path: string, body: string) => {
  const compactKey = getSubmissionCompactKey(path, body);
  const queue = compactKey ? getQueue().filter((item) => item.compactKey !== compactKey) : getQueue();
  const id = `${path}:${submissionHash(body)}`;
  if (queue.some((item) => item.id === id)) return;
  queue.push({ id, compactKey, path, body, attempts: 0, nextAttemptAt: Date.now(), createdAt: Date.now() });
  saveQueue(queue);
};

const scheduleDirtySnapshotSync = () => {
  if (autoSyncTimer !== null) window.clearTimeout(autoSyncTimer);
  autoSyncTimer = window.setTimeout(() => {
    autoSyncTimer = null;
    void onlineRankingService.syncDirtySnapshots().catch(() => undefined);
  }, AUTO_SYNC_DEBOUNCE_MS);
};

const getPlatform = (): OnlinePlatform => {
  const configured = String(import.meta.env.VITE_APP_PLATFORM || '').trim().toLowerCase();
  if (['web', 'steam', 'ios', 'android'].includes(configured)) return configured as OnlinePlatform;
  const capacitor = (window as typeof window & { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.();
  if (capacitor === 'ios' || capacitor === 'android') return capacitor;
  if (/steam/i.test(navigator.userAgent)) return 'steam';
  return 'web';
};

const getApiBase = () => {
  const override = window.localStorage.getItem(API_OVERRIDE_KEY)?.trim();
  if (override) return override.replace(/\/$/, '');
  const configured = String(import.meta.env.VITE_RANKING_API_URL || '').trim();
  if (configured) return configured.replace(/\/$/, '');
  if (getPlatform() === 'web' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000';
  }
  return DEFAULT_RANKING_URL;
};

const request = async <T>(path: string, init: RequestInit = {}, auth = false): Promise<T> => {
  if (!childSafetyService.canContactRemoteServices()) {
    throw new Error('年齢区分を選択するまでオンライン機能は利用できません。');
  }
  const base = getApiBase();
  if (!base) throw new Error('オンラインランキングは準備中です。');
  const profile = onlineRankingService.getProfile();
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(auth && profile ? { authorization: `Bearer ${profile.token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new OnlineRequestError(data.error || 'オンラインランキングと通信できませんでした。', response.status);
  return data;
};

const submitOrQueue = async (path: string, body: string) => {
  try { await request(path, { method: 'POST', body }, true); }
  catch (reason) {
    if (!(reason instanceof OnlineRequestError) || reason.status >= 500 || reason.status === 408 || reason.status === 429) {
      queueSubmission(path, body);
      return;
    }
    throw reason;
  }
};

const flushPendingSubmissions = async () => {
  const profile = onlineRankingService.getProfile();
  if (!profile || (typeof navigator !== 'undefined' && !navigator.onLine)) return { sent: 0, remaining: getQueue().length };
  const storedQueue = getQueue();
  const queue = storedQueue.filter((item) => !isNonPositiveScoreSubmission(item));
  if (queue.length !== storedQueue.length) saveQueue(queue);
  const remaining: QueuedSubmission[] = [];
  let sent = 0;
  for (const item of queue.slice(0, 20)) {
    if (item.nextAttemptAt > Date.now()) { remaining.push(item); continue; }
    try {
      await request(item.path, { method: 'POST', body: item.body }, true);
      sent += 1;
    } catch (reason) {
      if (reason instanceof OnlineRequestError && reason.status >= 400 && reason.status < 500 && reason.status !== 408 && reason.status !== 429) continue;
      const attempts = item.attempts + 1;
      remaining.push({ ...item, attempts, nextAttemptAt: Date.now() + Math.min(30 * 60 * 1000, 5000 * 2 ** Math.min(attempts, 8)) });
    }
  }
  remaining.push(...queue.slice(20));
  saveQueue(remaining);
  return { sent, remaining: remaining.length };
};

const jstParts = (date: Date) => {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return { y: jst.getUTCFullYear(), m: jst.getUTCMonth(), d: jst.getUTCDate(), day: jst.getUTCDay() };
};

const getPeriodWindow = (type: OnlinePeriodType, now = new Date()) => {
  if (type === 'all') return { start: 0, key: 'all' };
  const { y, m, d, day } = jstParts(now);
  if (type === 'daily') {
    const start = Date.UTC(y, m, d) - 9 * 60 * 60 * 1000;
    return { start, key: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` };
  }
  if (type === 'monthly') {
    const start = Date.UTC(y, m, 1) - 9 * 60 * 60 * 1000;
    return { start, key: `${y}-${String(m + 1).padStart(2, '0')}` };
  }
  if (type === 'weekly') {
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const date = new Date(Date.UTC(y, m, d + mondayOffset));
    const start = date.getTime() - 9 * 60 * 60 * 1000;
    return { start, key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}` };
  }
  const epoch = Date.UTC(2026, 6, 13) - 9 * 60 * 60 * 1000;
  const seasonIndex = Math.max(0, Math.floor((now.getTime() - epoch) / (56 * 86400000)));
  return { start: epoch + seasonIndex * 56 * 86400000, key: `S${String(seasonIndex + 1).padStart(2, '0')}` };
};

const rewardCardTimestamp = (card: Card) => {
  const matched = card.id.match(/(?:assignment-reward-card|ranking-reward-card)-(?:(?:reward:)?[^:]+:)*?(\d{12,})/);
  if (matched) return Number(matched[1]);
  const simple = card.id.match(/assignment-reward-card-(\d+)/);
  return simple ? Number(simple[1]) : 0;
};

type DailyLearningSummary = {
  date: string;
  answeredCount: number;
  correctCount: number;
  retryCorrectCount: number;
  assignmentsCompleted: number;
  elapsedMs: number;
  summaryVersion: number;
  platform: OnlinePlatform;
  source: 'learning-rogue';
};

const jstDateKey = (timestamp: number) => {
  const date = new Date(timestamp + 9 * 60 * 60 * 1000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

const getDailyLearningSummaries = (registeredAt: string): DailyLearningSummary[] => {
  const registrationTimestamp = Date.parse(registeredAt);
  const summaries = new Map<string, DailyLearningSummary>();
  const getSummary = (date: string) => {
    const existing = summaries.get(date);
    if (existing) return existing;
    const created: DailyLearningSummary = {
      date,
      answeredCount: 0,
      correctCount: 0,
      retryCorrectCount: 0,
      assignmentsCompleted: 0,
      elapsedMs: 0,
      summaryVersion: 1,
      platform: getPlatform(),
      source: 'learning-rogue',
    };
    summaries.set(date, created);
    return created;
  };
  for (const answer of storageService.getAssignmentAnswers()) {
    const timestamp = Date.parse(answer.answeredAt);
    if (!Number.isFinite(timestamp) || timestamp < registrationTimestamp) continue;
    const summary = getSummary(jstDateKey(timestamp));
    summary.answeredCount += 1;
    if (answer.correct) summary.correctCount += 1;
    if (answer.correct && answer.isRetry) summary.retryCorrectCount += 1;
    summary.elapsedMs = Math.min(86400000, summary.elapsedMs + Math.round(Math.max(0, Math.min(Number(answer.elapsedMs) || 0, 3600000))));
  }
  for (const card of storageService.getRewardCardAlbum()) {
    if (!card.id.startsWith('assignment-reward-card-')) continue;
    const timestamp = rewardCardTimestamp(card);
    if (!Number.isFinite(timestamp) || timestamp <= 0 || timestamp < registrationTimestamp) continue;
    getSummary(jstDateKey(timestamp)).assignmentsCompleted += 1;
  }
  return [...summaries.values()].sort((a, b) => a.date.localeCompare(b.date));
};

type SafeCardComponents = {
  cardKey: string;
  name: string;
  cost: number;
  baseDamage: number;
  blockDamage: number;
  blockGain: number;
  handDamage: number;
  attackChainDamage: number;
  strikeDamage: number;
  drawPileDamage: number;
  hits: number;
};

const safeMetric = (value: unknown, maximum = 1_000_000) => Math.max(0, Math.min(maximum, Math.floor(Number(value) || 0)));

const getSafeCardComponents = (card: Card, deck: Card[], index: number): SafeCardComponents | null => {
  if (card.target === TargetType.SELF && !card.damageBasedOnBlock && !(card.block && card.block > 0)) return null;
  const strikeCount = deck.filter((item) => item.name === 'えんぴつ攻撃' || item.originalNames?.includes('えんぴつ攻撃')).length;
  const attackCount = deck.filter((item) => item.type === CardType.ATTACK).length;
  const skillCount = deck.filter((item) => item.type === CardType.SKILL).length;
  const assumedHand = Math.min(5, Math.max(1, deck.length));
  const assumedDrawPile = Math.max(0, deck.length - assumedHand);
  const assumedPriorAttacks = Math.max(0, Math.min(2, attackCount - 1));
  let hits = 1 + (card.playCopies || 0);
  if (card.hitsPerSkillInHand) hits = Math.max(1, Math.min(4, skillCount));
  if (card.hitsPerAttackPlayed) hits = Math.max(1, assumedPriorAttacks);
  return {
    cardKey: `card-${index}`,
    name: String(card.name || 'カード').slice(0, 40),
    cost: safeMetric(card.cost, 20),
    baseDamage: safeMetric(card.damage),
    blockDamage: card.damageBasedOnBlock ? 12 : 0,
    blockGain: safeMetric(card.block),
    handDamage: safeMetric(Math.max(0, assumedHand - 1) * (card.damagePerCardInHand || 0)),
    attackChainDamage: safeMetric(assumedPriorAttacks * (card.damagePerAttackPlayed || 0)),
    strikeDamage: safeMetric(strikeCount * (card.damagePerStrike || 0)),
    drawPileDamage: safeMetric(assumedDrawPile * (card.damagePerCardInDraw || 0)),
    hits: Math.max(1, Math.min(100, safeMetric(hits, 100))),
  };
};

const getOwnedCards = () => {
  const unlockedNames = new Set(storageService.getUnlockedCards());
  const baseCards = Object.values(CARDS_LIBRARY);
  const ownedBase = baseCards.filter((card) => unlockedNames.has(card.name)).map((card, index) => ({ ...card, id: `library-${index}` } as Card));
  const rewards = storageService.getRewardCardAlbum();
  return { baseCards, ownedBase, rewards, all: [...ownedBase, ...rewards] };
};

const snapshotHash = (value: string) => {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash.toString(36);
};

const getCardSnapshot = () => {
  const { baseCards, ownedBase, rewards, all } = getOwnedCards();
  const uniqueBaseNames = new Set(baseCards.map((card) => card.name));
  const uniqueOwnedBaseNames = new Set(ownedBase.map((card) => card.name));
  const cards = all.map((card, index) => getSafeCardComponents(card, all, index)).filter((card): card is SafeCardComponents => card !== null);
  const highestDamage = storageService.getHighestCardDamage().damage;
  const collectionCount = uniqueOwnedBaseNames.size + rewards.length;
  const signature = `${collectionCount}:${uniqueOwnedBaseNames.size}:${cards.map((card) => `${card.name}:${card.cost}:${card.baseDamage}:${card.blockGain}:${card.hits}`).join('|')}:${highestDamage}`;
  return {
    snapshotId: `card-v2-${snapshotHash(signature)}`,
    snapshotVersion: 2,
    collectionCount,
    baseCollectionCount: uniqueOwnedBaseNames.size,
    totalAvailable: Math.max(1, uniqueBaseNames.size),
    actualHighestDamage: highestDamage,
    cards,
    platform: getPlatform(),
    source: 'learning-rogue',
  };
};

const maxAfter = <T extends { date: number }>(entries: T[], start: number, score: (entry: T) => number) => entries
  .filter((entry) => Number(entry.date) >= start)
  .reduce((max, entry) => Math.max(max, safeMetric(score(entry), 1_000_000_000)), 0);

const getActivitySnapshot = (registeredAt: string) => {
  const periods = (['daily', 'weekly', 'monthly', 'season', 'all'] as OnlinePeriodType[]).map((periodType) => {
    const window = getPeriodWindow(periodType);
    const start = Math.max(window.start, Date.parse(registeredAt) || 0);
    return {
      periodType,
      poker: maxAfter(storageService.getPokerScores(), start, (entry) => entry.bestHandScore),
      survivor: maxAfter(storageService.getSurvivorScores(), start, (entry) => entry.score),
      dungeon: maxAfter(storageService.getDungeonScores(), start, (entry) => entry.score),
      dungeon2: maxAfter(storageService.getDungeonScores2(), start, (entry) => entry.score),
      kocho: maxAfter(storageService.getKochoScores(), start, (entry) => Math.max(
        entry.endlessScore || 0,
        (entry.endlessFloor || 0) * 1000 + (entry.endlessKills || 0),
        entry.stage * 100 + (entry.victory ? 50 : 0),
      )),
      paperPlane: maxAfter(storageService.getPaperPlaneScores(), start, (entry) => entry.score),
      goHome: maxAfter(storageService.getGoHomeScores(), start, (entry) => entry.score),
    };
  });
  const modeCorrectCounts = storageService.getModeCorrectCounts();
  const growth = {
    clearCount: safeMetric(storageService.getClearCount(), 1_000_000),
    masteredModes: safeMetric(new Set(storageService.getMasteredModes()).size, 10_000),
    totalCorrect: safeMetric(Object.values(modeCorrectCounts).reduce((sum, count) => sum + Math.max(0, Number(count) || 0), 0), 1_000_000_000),
  };
  const signature = `${periods.map((period) => Object.values(period).join(':')).join('|')}:${Object.values(growth).join(':')}`;
  return {
    snapshotId: `activity-v1-${snapshotHash(signature)}`,
    snapshotVersion: 1,
    periods,
    growth,
    platform: getPlatform(),
    source: 'learning-rogue',
  };
};

const getSnapshot = (periodType: OnlinePeriodType, registeredAt: string) => {
  const { start, key } = getPeriodWindow(periodType);
  const effectiveStart = Math.max(start, Date.parse(registeredAt) || 0);
  const adventures = storageService.getLocalScores().filter((entry) => entry.date >= effectiveStart && entry.challengeMode !== 'COOP');
  const maxAdventure = adventures.reduce((max, entry) => Math.max(max, entry.score), 0);
  return {
    periodKey: key,
    values: {
      adventure_score: maxAdventure,
    },
  };
};

export const onlineRankingService = {
  isAvailable: () => Boolean(getApiBase()) && childSafetyService.canContactRemoteServices(),
  hasDeclinedInitialPrompt: () => typeof window !== 'undefined' && window.localStorage.getItem(INITIAL_PROMPT_DECLINED_KEY) === '1',
  declineInitialPrompt: () => {
    if (typeof window !== 'undefined') window.localStorage.setItem(INITIAL_PROMPT_DECLINED_KEY, '1');
  },
  clearInitialPromptDecline: () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(INITIAL_PROMPT_DECLINED_KEY);
  },
  getPlatform,
  getPendingSubmissionCount: () => getQueue().length,
  flushPendingSubmissions,
  markSnapshotsDirty: () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DIRTY_SNAPSHOT_KEY, String(Date.now()));
    if (onlineRankingService.getProfile() && childSafetyService.canSubmitRanking()) scheduleDirtySnapshotSync();
  },
  hasDirtySnapshots: () => typeof window !== 'undefined' && Boolean(window.localStorage.getItem(DIRTY_SNAPSHOT_KEY)),
  syncDirtySnapshots: async () => {
    if (!onlineRankingService.getProfile() || !childSafetyService.canSubmitRanking() || !onlineRankingService.hasDirtySnapshots()) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    await onlineRankingService.syncCurrentSnapshots();
  },
  getPublicUrl: () => String(import.meta.env.VITE_RANKING_PUBLIC_URL || DEFAULT_RANKING_URL).replace(/\/$/, ''),

  getProfile: (): OnlineRankingProfile | null => {
    try {
      const stored = window.localStorage.getItem(PROFILE_KEY);
      if (!stored) return null;
      const profile = JSON.parse(stored) as OnlineRankingProfile;
      if (!profile.registeredAt) {
        profile.registeredAt = new Date().toISOString();
        window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      }
      return profile;
    } catch { return null; }
  },

  getSuggestions: async () => {
    const data = await request<{ suggestions: string[] }>('/api/v1/names/suggestions');
    return data.suggestions;
  },

  register: async (displayName: string) => {
    const data = await request<{ player: Omit<OnlineRankingProfile, 'token'>; token: string }>('/api/v1/players/register', {
      method: 'POST',
      body: JSON.stringify({
        displayName,
        acceptedTerms: true,
        platform: getPlatform(),
        source: 'learning-rogue',
        ageBand: childSafetyService.getSettings().ageBand,
      }),
    });
    const profile = { ...data.player, token: data.token };
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    onlineRankingService.clearInitialPromptDecline();
    return profile;
  },

  verifyChildConsent: async (guardianConsentProof: string) => {
    if (!onlineRankingService.getProfile()) throw new Error('ランキングへの参加登録が必要です。');
    await request<{ verified: boolean; verifiedAt: string }>('/api/v1/players/consent', {
      method: 'POST',
      body: JSON.stringify({ guardianConsentProof }),
    }, true);
    childSafetyService.authorizeRankingByGuardian();
  },

  updateDisplayName: async (displayName: string) => {
    const current = onlineRankingService.getProfile();
    if (!current) throw new Error('ランキングへの参加登録が必要です。');
    const data = await request<{ player: Pick<OnlineRankingProfile, 'id' | 'publicCode' | 'displayName'> }>('/api/v1/players/display-name', {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    }, true);
    const profile = { ...current, ...data.player };
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return profile;
  },

  getLeaderboard: async (rankingId: string, periodType: OnlinePeriodType) => {
    return request<{ ranking: OnlineRankingDefinition; periodType: OnlinePeriodType; periodKey: string; entries: OnlineLeaderboardEntry[]; rankings: OnlineRankingDefinition[] }>(`/api/v1/leaderboards?rankingId=${encodeURIComponent(rankingId)}&periodType=${periodType}&platform=${getPlatform()}&source=learning-rogue`);
  },

  createDeviceLinkCode: async () => request<{ code: string; expiresAt: string; expiresInSeconds: number }>('/api/v1/devices/link-code', {
    method: 'POST',
    body: JSON.stringify({ platform: getPlatform(), source: 'learning-rogue' }),
  }, true),

  redeemDeviceLinkCode: async (code: string) => {
    const data = await request<{ player: Omit<OnlineRankingProfile, 'token'>; token: string }>('/api/v1/devices/redeem', {
      method: 'POST',
      body: JSON.stringify({ code, platform: getPlatform(), source: 'learning-rogue' }),
    });
    const profile = { ...data.player, token: data.token };
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return profile;
  },

  syncCurrentSnapshots: async () => {
    const profile = onlineRankingService.getProfile();
    if (!profile || !childSafetyService.canSubmitRanking()) return;
    if (snapshotSyncPromise) return snapshotSyncPromise;
    const dirtyVersion = window.localStorage.getItem(DIRTY_SNAPSHOT_KEY);
    snapshotSyncPromise = (async () => {
      await flushPendingSubmissions();
      for (const summary of getDailyLearningSummaries(profile.registeredAt)) {
        await submitOrQueue('/api/v1/learning/daily-summary', JSON.stringify(summary));
      }
      await submitOrQueue('/api/v1/cards/snapshot', JSON.stringify(getCardSnapshot()));
      await submitOrQueue('/api/v1/activity/snapshot', JSON.stringify(getActivitySnapshot(profile.registeredAt)));
      for (const periodType of ['weekly', 'monthly', 'season', 'all'] as OnlinePeriodType[]) {
        const snapshot = getSnapshot(periodType, profile.registeredAt);
        for (const [rankingId, value] of Object.entries(snapshot.values)) {
          if (!Number.isFinite(value) || value <= 0) continue;
          await submitOrQueue('/api/v1/scores', JSON.stringify({
            recordId: `snapshot:${rankingId}:${periodType}:${snapshot.periodKey}:${value}`,
            rankingId,
            periodType,
            periodKey: snapshot.periodKey,
            value,
            occurredAt: new Date().toISOString(),
            platform: getPlatform(),
            source: 'learning-rogue',
          }));
        }
      }
      const coopRuns = storageService.getLocalScores().filter((entry) => entry.challengeMode === 'COOP' && (entry.teamPublicCodes?.length || 0) >= 2);
      for (const run of coopRuns) {
        const value = safeMetric(run.score, 100_000_000);
        if (value <= 0) continue;
        for (const periodType of ['weekly', 'monthly', 'season', 'all'] as OnlinePeriodType[]) {
          await submitOrQueue('/api/v1/teams/scores', JSON.stringify({
            recordId: `${run.id}:${periodType}`,
            rankingId: 'coop_adventure_score',
            periodType,
            value,
            occurredAt: new Date(run.date).toISOString(),
            memberPublicCodes: run.teamPublicCodes,
            metadata: { act: safeMetric(run.act, 100), floor: safeMetric(run.floor, 10000), victory: !!run.victory },
            platform: getPlatform(),
            source: 'learning-rogue',
          }));
        }
      }
      await flushPendingSubmissions();
      if (window.localStorage.getItem(DIRTY_SNAPSHOT_KEY) === dirtyVersion) {
        window.localStorage.removeItem(DIRTY_SNAPSHOT_KEY);
      }
    })().finally(() => { snapshotSyncPromise = null; });
    return snapshotSyncPromise;
  },

  claimPendingRewards: async (): Promise<OnlineReward[]> => {
    if (!onlineRankingService.getProfile() || !childSafetyService.canSubmitRanking()) return [];
    const pending = await request<{ rewards: OnlineReward[] }>('/api/v1/rewards/pending', {}, true);
    const claimed: OnlineReward[] = [];
    const existingIds = new Set(storageService.getRewardCardAlbum().map((card) => card.id));
    for (const reward of pending.rewards) {
      const result = await request<{ reward: OnlineReward }>(`/api/v1/rewards/${encodeURIComponent(reward.id)}/claim`, { method: 'POST', body: '{}' }, true);
      const claimedReward = result.reward.card.rewardGeneration === 'ASSIGNMENT_REWARD'
        ? { ...result.reward, card: createGeneratedRankingRewardCard(result.reward) }
        : result.reward;
      if (!existingIds.has(claimedReward.card.id)) {
        storageService.saveRewardCardToAlbum(claimedReward.card);
        existingIds.add(claimedReward.card.id);
      }
      claimed.push(claimedReward);
    }
    return claimed;
  },
  clearLocalProfile: () => {
    window.localStorage.removeItem(PROFILE_KEY);
    window.localStorage.removeItem(SUBMISSION_QUEUE_KEY);
    window.localStorage.removeItem(DIRTY_SNAPSHOT_KEY);
  },
  deleteServerData: async () => {
    const profile = onlineRankingService.getProfile();
    if (!profile) {
      onlineRankingService.clearLocalProfile();
      return;
    }
    await request('/api/v1/players/me', { method: 'DELETE' }, true);
    onlineRankingService.clearLocalProfile();
    childSafetyService.revokeRankingConsent();
  },
};
