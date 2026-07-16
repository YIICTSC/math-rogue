import { AnswerMode, AssignmentAnswerResult, AssignmentPayload, GameMode } from '../types';

export type ManagementProfile = {
  learnerId: string;
  token: string;
  linkedAt: string;
  displayName?: string;
};

export type ManagedAssignment = {
  id: string;
  version: number;
  title: string;
  description?: string | null;
  subject: string;
  unitId: string;
  unitLabel: string;
  targetCorrect: number;
  answerMode: string;
  gameMode: string;
  dueAt?: string | null;
  rewardEnabled: boolean;
  status: 'unopened' | 'in_progress' | 'completed' | string;
  correctCount: number;
  answeredCount: number;
  retryCorrectCount: number;
};

export type ManagementRelationship = {
  groupId: string;
  groupName: string;
  groupType: string;
  organizationName: string;
  organizationType: string;
};

type ProgressEvent = {
  eventId: string;
  assignmentId: string;
  assignmentVersion: number;
  problemKey: string;
  unitId: string;
  correct: boolean;
  isRetry: boolean;
  elapsedMs: number;
  occurredAt: string;
  platform: 'web' | 'steam' | 'ios' | 'android';
  schemaVersion: 1;
};

const PROFILE_KEY = 'learning_rogue_management_profile_v1';
const ASSIGNMENTS_KEY = 'learning_rogue_management_assignments_v1';
const PROGRESS_QUEUE_KEY = 'learning_rogue_management_progress_queue_v1';
const API_OVERRIDE_KEY = 'learning_rogue_management_api_v1';
const DEFAULT_API_URL = 'https://learning-rogue-management.yishigeict.chatgpt.site';

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(window.localStorage.getItem(key) || '') as T; } catch { return fallback; }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* local persistence must not block play */ }
};

const getPlatform = (): ProgressEvent['platform'] => {
  const configured = String(import.meta.env.VITE_APP_PLATFORM || '').trim().toLowerCase();
  if (['web', 'steam', 'ios', 'android'].includes(configured)) return configured as ProgressEvent['platform'];
  const capacitor = (window as typeof window & { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.();
  if (capacitor === 'ios' || capacitor === 'android') return capacitor;
  if (/steam/i.test(navigator.userAgent)) return 'steam';
  return 'web';
};

const getApiBase = () => {
  const override = typeof window === 'undefined' ? '' : window.localStorage.getItem(API_OVERRIDE_KEY)?.trim();
  const configured = String(import.meta.env.VITE_MANAGEMENT_API_URL || '').trim();
  return (override || configured || DEFAULT_API_URL).replace(/\/$/, '');
};

const request = async <T>(path: string, init: RequestInit = {}, token?: string): Promise<T> => {
  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || '管理ポータルと通信できませんでした。');
  return data;
};

const fallbackModeForSubject = (subject: string): GameMode => {
  if (subject.includes('国語')) return GameMode.KOKUGO_G1_1;
  if (subject.includes('英語')) return GameMode.ENGLISH_G3_1;
  if (subject.includes('理科')) return GameMode.SCIENCE_3_1;
  if (subject.includes('社会')) return GameMode.SOCIAL_3_1;
  if (subject.includes('生活')) return GameMode.LIFE_1_1;
  return GameMode.MATH_G1_1;
};

const resolveMode = (assignment: ManagedAssignment): GameMode => {
  const modes = new Set<string>(Object.values(GameMode));
  return modes.has(assignment.unitId) ? assignment.unitId as GameMode : fallbackModeForSubject(assignment.subject);
};

export const toAssignmentPayload = (assignment: ManagedAssignment): AssignmentPayload => ({
  id: assignment.id,
  title: assignment.title,
  units: [{
    id: assignment.unitId || `managed:${assignment.id}`,
    name: assignment.unitLabel || assignment.subject,
    modes: [resolveMode(assignment)],
    targetCorrect: Math.max(1, Number(assignment.targetCorrect || 10)),
  }],
  customProblems: [],
  dueAt: assignment.dueAt || '',
  gameMode: 'FREE',
  answerMode: (String(assignment.answerMode).toUpperCase() === 'INPUT' ? 'INPUT' : 'CHOICE') as AnswerMode,
  createdAt: new Date().toISOString(),
  managementPortal: {
    version: Number(assignment.version || 1),
    unitId: assignment.unitId,
    subject: assignment.subject,
    description: assignment.description || undefined,
    rewardEnabled: assignment.rewardEnabled,
  },
});

const makeEventId = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto
  ? crypto.randomUUID()
  : `progress-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getQueue = () => readJson<ProgressEvent[]>(PROGRESS_QUEUE_KEY, []).filter(Boolean).slice(-300);
const saveQueue = (queue: ProgressEvent[]) => writeJson(PROGRESS_QUEUE_KEY, queue.slice(-300));

export const managementPortalService = {
  getProfile: () => readJson<ManagementProfile | null>(PROFILE_KEY, null),
  getCachedAssignments: () => readJson<ManagedAssignment[]>(ASSIGNMENTS_KEY, []),

  async linkDevice(code: string) {
    const result = await request<{ learnerToken: string; learnerId: string; linkedAt: string }>('/api/v1/learner-devices/link', {
      method: 'POST',
      body: JSON.stringify({ code: code.replace(/\s/g, '').toUpperCase(), platform: getPlatform() }),
    });
    const profile: ManagementProfile = { learnerId: result.learnerId, token: result.learnerToken, linkedAt: result.linkedAt };
    writeJson(PROFILE_KEY, profile);
    try {
      const relationships = await this.fetchRelationships();
      profile.displayName = relationships.learner.displayName;
      writeJson(PROFILE_KEY, profile);
    } catch { /* the token is still valid even if the label lookup is offline */ }
    return profile;
  },

  unlinkDevice() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PROFILE_KEY);
      window.localStorage.removeItem(ASSIGNMENTS_KEY);
      window.localStorage.removeItem(PROGRESS_QUEUE_KEY);
    }
  },

  async fetchAssignments() {
    const profile = this.getProfile();
    if (!profile) throw new Error('管理ポータルとの端末連携が必要です。');
    const result = await request<{ assignments: ManagedAssignment[] }>('/api/v1/learner/assignments', {}, profile.token);
    writeJson(ASSIGNMENTS_KEY, result.assignments);
    return result.assignments;
  },

  async fetchRelationships() {
    const profile = this.getProfile();
    if (!profile) throw new Error('管理ポータルとの端末連携が必要です。');
    return request<{ learner: { id: string; displayName: string }; relationships: ManagementRelationship[] }>('/api/v1/learner/relationships', {}, profile.token);
  },

  queueAnswer(assignment: AssignmentPayload, result: AssignmentAnswerResult) {
    if (!assignment.managementPortal || !this.getProfile()) return;
    const event: ProgressEvent = {
      eventId: makeEventId(),
      assignmentId: assignment.id,
      assignmentVersion: assignment.managementPortal.version,
      problemKey: String(result.problemKey || result.problemId || `${result.mode}:${Date.now()}`).slice(0, 160),
      unitId: assignment.managementPortal.unitId || assignment.units[0]?.id || result.mode,
      correct: result.correct,
      isRetry: Boolean(result.isRetry),
      elapsedMs: Math.max(0, Math.round(result.elapsedMs || 0)),
      occurredAt: new Date().toISOString(),
      platform: getPlatform(),
      schemaVersion: 1,
    };
    saveQueue([...getQueue(), event]);
    void this.flushProgress();
  },

  async flushProgress() {
    const profile = this.getProfile();
    const events = getQueue();
    if (!profile || events.length === 0 || (typeof navigator !== 'undefined' && !navigator.onLine)) return { accepted: 0, remaining: events.length };
    const batch = events.slice(0, 50);
    try {
      const result = await request<{ accepted: number; duplicates: number }>('/api/v1/learner/progress/batch', {
        method: 'POST',
        body: JSON.stringify({ events: batch }),
      }, profile.token);
      const remaining = events.slice(batch.length);
      saveQueue(remaining);
      return { accepted: result.accepted + result.duplicates, remaining: remaining.length };
    } catch {
      return { accepted: 0, remaining: events.length };
    }
  },

  async completeAssignment(assignmentId: string) {
    const profile = this.getProfile();
    if (!profile) return;
    await this.flushProgress();
    await request(`/api/v1/learner/assignments/${encodeURIComponent(assignmentId)}/complete`, { method: 'POST', body: '{}' }, profile.token);
  },

  async claimPendingRewards(assignmentId?: string) {
    const profile = this.getProfile();
    if (!profile) return 0;
    const result = await request<{ rewards: Array<{ grantId: string; assignmentId: string }> }>('/api/v1/learner/rewards/pending', {}, profile.token);
    const rewards = assignmentId ? result.rewards.filter((item) => item.assignmentId === assignmentId) : result.rewards;
    for (const reward of rewards) {
      await request(`/api/v1/learner/rewards/${encodeURIComponent(reward.grantId)}/claim`, { method: 'POST', body: '{}' }, profile.token);
    }
    return rewards.length;
  },
};
