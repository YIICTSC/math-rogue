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
  units?: ManagedAssignmentUnit[];
};

type ManagedAssignmentUnit = {
  unitId: string;
  unitLabel: string;
  targetCorrect: number;
};

type ManagedAssignmentDetail = ManagedAssignment & {
  customProblems?: Array<{
    id: string;
    question: string;
    answer: string;
    options: string[];
    imageUrl?: string;
    imageAlt?: string;
  }>;
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

type LearningActivityEvent = {
  eventId: string;
  assignmentId?: string;
  source: 'assignment' | 'self_study';
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
const ACTIVITY_QUEUE_KEY = 'learning_rogue_management_activity_queue_v1';
const COMPLETION_QUEUE_KEY = 'learning_rogue_management_completion_queue_v1';
const API_OVERRIDE_KEY = 'learning_rogue_management_api_v1';
const DEFAULT_API_URL = 'https://learning-rogue-management.yishigeict.chatgpt.site';

class ManagementRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

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
  if (!response.ok) throw new ManagementRequestError(data.error || '管理ポータルと通信できませんでした。', response.status);
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

const isManagedCurriculumMode = (unitId: string) =>
  /^(?:MATH_G|KOKUGO_G)[1-9]_U\d{2}$/.test(unitId) ||
  /^ENGLISH_G[3-9]_(?:U\d{2}|WORDS)$/.test(unitId) ||
  /^(?:LIFE_[12]|SCIENCE_[3-9]|SOCIAL_[3-9])_U\d{2}$/.test(unitId);

const resolveMode = (unitId: string, subject: string): GameMode => {
  const modes = new Set<string>(Object.values(GameMode));
  return modes.has(unitId) || isManagedCurriculumMode(unitId)
    ? unitId as GameMode
    : fallbackModeForSubject(subject);
};

export const toAssignmentPayload = (assignment: ManagedAssignment): AssignmentPayload => {
  const managedUnits = assignment.units?.length ? assignment.units : [{
    unitId: assignment.unitId,
    unitLabel: assignment.unitLabel,
    targetCorrect: assignment.targetCorrect,
  }];
  return {
    id: assignment.id,
    title: assignment.title,
    units: managedUnits.map((unit) => ({
      id: unit.unitId || `managed:${assignment.id}`,
      name: unit.unitLabel || assignment.subject,
      modes: [resolveMode(unit.unitId, assignment.subject)],
      targetCorrect: Math.max(1, Number(unit.targetCorrect || 10)),
    })),
    customProblems: [],
    dueAt: assignment.dueAt || '',
    gameMode: 'FREE',
    answerMode: (String(assignment.answerMode).toUpperCase() === 'INPUT' ? 'INPUT' : 'CHOICE') as AnswerMode,
    createdAt: new Date().toISOString(),
    managementPortal: {
      version: Number(assignment.version || 1),
      unitId: managedUnits[0]?.unitId || assignment.unitId,
      subject: assignment.subject,
      description: assignment.description || undefined,
      rewardEnabled: assignment.rewardEnabled,
    },
  };
};

const toDetailedAssignmentPayload = (assignment: ManagedAssignmentDetail): AssignmentPayload => ({
  ...toAssignmentPayload(assignment),
  units: assignment.customProblems?.length ? [] : toAssignmentPayload(assignment).units,
  customProblems: assignment.customProblems || [],
  customTargetCorrect: assignment.customProblems?.length ? Math.max(1, Number(assignment.targetCorrect || assignment.customProblems.length)) : undefined,
  gameMode: assignment.customProblems?.length ? 'FREE' : toAssignmentPayload(assignment).gameMode,
});

const makeEventId = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto
  ? crypto.randomUUID()
  : `progress-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getQueue = () => readJson<ProgressEvent[]>(PROGRESS_QUEUE_KEY, []).filter(Boolean).slice(-300);
const saveQueue = (queue: ProgressEvent[]) => writeJson(PROGRESS_QUEUE_KEY, queue.slice(-300));
const getActivityQueue = () => readJson<LearningActivityEvent[]>(ACTIVITY_QUEUE_KEY, []).filter(Boolean).slice(-500);
const saveActivityQueue = (queue: LearningActivityEvent[]) => writeJson(ACTIVITY_QUEUE_KEY, queue.slice(-500));
const getCompletionQueue = () => Array.from(new Set(readJson<string[]>(COMPLETION_QUEUE_KEY, []).filter((id) => typeof id === 'string' && id)));
const saveCompletionQueue = (queue: string[]) => writeJson(COMPLETION_QUEUE_KEY, Array.from(new Set(queue)).slice(-100));

const clearLocalLink = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PROFILE_KEY);
  window.localStorage.removeItem(ASSIGNMENTS_KEY);
  window.localStorage.removeItem(PROGRESS_QUEUE_KEY);
  window.localStorage.removeItem(ACTIVITY_QUEUE_KEY);
  window.localStorage.removeItem(COMPLETION_QUEUE_KEY);
};

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

  async unlinkDevice() {
    const profile = this.getProfile();
    if (!profile) { clearLocalLink(); return; }
    await request('/api/v1/learner-devices/revoke-current', { method: 'POST', body: '{}' }, profile.token);
    clearLocalLink();
  },

  async fetchAssignments() {
    const profile = this.getProfile();
    if (!profile) throw new Error('管理ポータルとの端末連携が必要です。');
    const result = await request<{ assignments: ManagedAssignment[] }>('/api/v1/learner/assignments', {}, profile.token);
    writeJson(ASSIGNMENTS_KEY, result.assignments);
    return result.assignments;
  },

  async fetchAssignmentPayload(assignmentId: string) {
    const profile = this.getProfile();
    if (!profile) throw new Error('管理ポータルとの端末連携が必要です。');
    const result = await request<{ assignment: ManagedAssignmentDetail }>(`/api/v1/learner/assignments/${encodeURIComponent(assignmentId)}`, {}, profile.token);
    const customProblems = await Promise.all((result.assignment.customProblems || []).map(async (problem) => {
      if (!problem.imageUrl) return problem;
      try {
        const response = await fetch(problem.imageUrl, { headers: { authorization: `Bearer ${profile.token}` } });
        if (!response.ok) return { ...problem, imageUrl: undefined };
        return { ...problem, imageUrl: URL.createObjectURL(await response.blob()) };
      } catch {
        return { ...problem, imageUrl: undefined };
      }
    }));
    return toDetailedAssignmentPayload({ ...result.assignment, customProblems });
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
      unitId: assignment.units.find((unit) => unit.modes.includes(result.mode))?.id || assignment.managementPortal.unitId || assignment.units[0]?.id || result.mode,
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

  queueLearningActivity(result: AssignmentAnswerResult, assignment?: AssignmentPayload | null) {
    if (!this.getProfile()) return;
    const managedUnitId = assignment?.units.find((unit) => unit.modes.includes(result.mode))?.id
      || assignment?.managementPortal?.unitId
      || result.mode;
    const event: LearningActivityEvent = {
      eventId: makeEventId(),
      assignmentId: assignment?.managementPortal ? assignment.id : undefined,
      source: assignment?.managementPortal ? 'assignment' : 'self_study',
      unitId: managedUnitId,
      correct: result.correct,
      isRetry: Boolean(result.isRetry),
      elapsedMs: Math.max(0, Math.round(result.elapsedMs || 0)),
      occurredAt: new Date().toISOString(),
      platform: getPlatform(),
      schemaVersion: 1,
    };
    saveActivityQueue([...getActivityQueue(), event]);
    void this.flushLearningActivity();
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

  async flushLearningActivity() {
    const profile = this.getProfile();
    const events = getActivityQueue();
    if (!profile || events.length === 0 || (typeof navigator !== 'undefined' && !navigator.onLine)) return { accepted: 0, remaining: events.length };
    const batch = events.slice(0, 50);
    try {
      const result = await request<{ accepted: number; duplicates: number }>('/api/v1/learner/activity/batch', {
        method: 'POST',
        body: JSON.stringify({ events: batch }),
      }, profile.token);
      const remaining = events.slice(batch.length);
      saveActivityQueue(remaining);
      return { accepted: result.accepted + result.duplicates, remaining: remaining.length };
    } catch {
      return { accepted: 0, remaining: events.length };
    }
  },

  async flushCompletions() {
    const profile = this.getProfile();
    const assignmentIds = getCompletionQueue();
    if (!profile || assignmentIds.length === 0 || (typeof navigator !== 'undefined' && !navigator.onLine)) return { completed: 0, remaining: assignmentIds.length };
    const remaining: string[] = [];
    let completed = 0;
    for (const assignmentId of assignmentIds.slice(0, 20)) {
      try {
        await request(`/api/v1/learner/assignments/${encodeURIComponent(assignmentId)}/complete`, { method: 'POST', body: '{}' }, profile.token);
        await this.claimPendingRewards(assignmentId);
        completed += 1;
      } catch (reason) {
        if (reason instanceof ManagementRequestError && reason.status === 404) continue;
        remaining.push(assignmentId);
      }
    }
    remaining.push(...assignmentIds.slice(20));
    saveCompletionQueue(remaining);
    return { completed, remaining: remaining.length };
  },

  async flushPending() {
    const [progress, activity] = await Promise.all([this.flushProgress(), this.flushLearningActivity()]);
    const completions = await this.flushCompletions();
    return { progress, activity, completions };
  },

  async completeAssignment(assignmentId: string) {
    if (!this.getProfile()) return;
    saveCompletionQueue([...getCompletionQueue(), assignmentId]);
    await this.flushPending();
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
