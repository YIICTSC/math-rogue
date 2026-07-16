import type { AssignmentAnswerRecord, AssignmentPayload } from '../types';

const DEFAULT_BASE_URL = 'https://learning-rogue-management.yishigeict.chatgpt.site';
const CONNECTION_KEY = 'pixel_spire_management_connection';
const ASSIGNMENTS_KEY = 'pixel_spire_management_assignments';
const QUEUE_KEY = 'pixel_spire_management_progress_queue';

export interface ManagementConnection {
  learnerToken: string;
  learnerId: string;
  linkedAt: string;
  baseUrl: string;
}

export interface ManagementAssignment {
  id: string;
  version: number;
  title: string;
  description?: string | null;
  subject?: string | null;
  unitId: string;
  unitLabel: string;
  targetCorrect: number;
  answerMode: string;
  dueAt?: string | null;
  rewardEnabled: boolean;
  status: string;
  correctCount: number;
  answeredCount: number;
  retryCorrectCount: number;
}

export interface PendingManagementReward {
  grantId: string;
  assignmentId: string;
  assignmentTitle: string;
  grantedAt: string;
}

interface ProgressEvent {
  eventId: string;
  assignmentId: string;
  assignmentVersion: number;
  problemKey: string;
  unitId: string;
  correct: boolean;
  isRetry: boolean;
  elapsedMs: number;
  occurredAt: string;
  platform: string;
  schemaVersion: number;
}

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const connection = learningManagementService.getConnection();
  const response = await fetch(`${connection?.baseUrl || DEFAULT_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(connection ? { Authorization: `Bearer ${connection.learnerToken}` } : {}),
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || `通信に失敗しました (${response.status})`);
  return body;
};

const platform = () => {
  if (navigator.userAgent.toLowerCase().includes('electron')) return 'steam-windows';
  return /android/i.test(navigator.userAgent) ? 'android' : /iphone|ipad/i.test(navigator.userAgent) ? 'ios' : 'web';
};

export const learningManagementService = {
  isAvailable: () => typeof window !== 'undefined' && typeof fetch !== 'undefined',

  getConnection: (): ManagementConnection | null => readJson<ManagementConnection | null>(CONNECTION_KEY, null),

  getCachedAssignments: (): ManagementAssignment[] => readJson<ManagementAssignment[]>(ASSIGNMENTS_KEY, []),

  getQueuedProgressCount: (): number => readJson<ProgressEvent[]>(QUEUE_KEY, []).length,

  linkDevice: async (code: string): Promise<ManagementConnection> => {
    const normalizedCode = code.replace(/\s+/g, '').toUpperCase();
    if (!normalizedCode) throw new Error('連携コードを入力してください。');
    const result = await request<{ learnerToken: string; learnerId: string; linkedAt: string }>('/api/v1/learner-devices/link', {
      method: 'POST', body: JSON.stringify({ code: normalizedCode, platform: platform() }),
    });
    const connection = { ...result, baseUrl: DEFAULT_BASE_URL };
    localStorage.setItem(CONNECTION_KEY, JSON.stringify(connection));
    return connection;
  },

  unlinkDevice: () => {
    localStorage.removeItem(CONNECTION_KEY);
    localStorage.removeItem(ASSIGNMENTS_KEY);
    localStorage.removeItem(QUEUE_KEY);
  },

  fetchAssignments: async (): Promise<ManagementAssignment[]> => {
    const result = await request<{ assignments: ManagementAssignment[] }>('/api/v1/learner/assignments');
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(result.assignments));
    return result.assignments;
  },

  toAssignmentPayload: (assignment: ManagementAssignment): AssignmentPayload => ({
    id: assignment.id,
    title: assignment.title,
    units: [{ id: assignment.unitId, name: assignment.unitLabel, modes: [assignment.unitId], targetCorrect: assignment.targetCorrect }],
    customProblems: [],
    dueAt: assignment.dueAt || '',
    gameMode: 'CHALLENGE_ONLY',
    answerMode: assignment.answerMode.toLowerCase() === 'input' ? 'INPUT' : 'CHOICE',
    createdAt: new Date().toISOString(),
    source: 'MANAGEMENT',
    serverVersion: assignment.version,
    description: assignment.description || undefined,
    rewardEnabled: assignment.rewardEnabled,
  }),

  queueProgress: (assignment: AssignmentPayload, answer: AssignmentAnswerRecord) => {
    if (assignment.source !== 'MANAGEMENT') return;
    const queue = readJson<ProgressEvent[]>(QUEUE_KEY, []);
    const problemKey = answer.problemKey || answer.problemId || `${answer.mode}:${answer.answeredAt}`;
    queue.push({
      eventId: crypto.randomUUID(), assignmentId: assignment.id, assignmentVersion: assignment.serverVersion || 1,
      problemKey, unitId: answer.mode, correct: answer.correct, isRetry: Boolean(answer.isRetry),
      elapsedMs: Math.max(0, answer.elapsedMs || 0), occurredAt: answer.answeredAt, platform: platform(), schemaVersion: 1,
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-2000)));
  },

  flushProgress: async (): Promise<number> => {
    if (!learningManagementService.getConnection()) return 0;
    let queue = readJson<ProgressEvent[]>(QUEUE_KEY, []);
    let sent = 0;
    while (queue.length > 0) {
      const chunk = queue.slice(0, 100);
      await request('/api/v1/learner/progress/batch', { method: 'POST', body: JSON.stringify({ events: chunk }) });
      queue = queue.slice(chunk.length);
      sent += chunk.length;
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
    return sent;
  },

  getPendingRewards: async (): Promise<PendingManagementReward[]> => {
    const result = await request<{ rewards: PendingManagementReward[] }>('/api/v1/learner/rewards/pending');
    return result.rewards;
  },

  claimReward: async (grantId: string): Promise<void> => {
    await request(`/api/v1/learner/rewards/${encodeURIComponent(grantId)}/claim`, { method: 'POST' });
  },
};
