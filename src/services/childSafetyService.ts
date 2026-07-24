export type AgeBand = '9_12' | '13_15' | '16_17' | '18_PLUS';

export type ChildSafetySettings = {
  version: 1;
  ageBand: AgeBand | null;
  ageSelectedAt?: string;
  learningAggregationAuthorizedAt?: string;
  learningAggregationAuthority?: 'guardian' | 'school';
  rankingConsentVerifiedAt?: string;
  rankingConsentAuthority?: 'guardian';
};

const STORAGE_KEY = 'learning_rogue_child_safety_v1';
export const CHILD_SAFETY_CHANGED_EVENT = 'learning-rogue:child-safety-changed';

const emptySettings = (): ChildSafetySettings => ({
  version: 1,
  ageBand: null,
});

const read = (): ChildSafetySettings => {
  if (typeof window === 'undefined') return emptySettings();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') as Partial<ChildSafetySettings> | null;
    if (!parsed || !['9_12', '13_15', '16_17', '18_PLUS'].includes(String(parsed.ageBand || ''))) {
      return emptySettings();
    }
    return { ...emptySettings(), ...parsed, version: 1, ageBand: parsed.ageBand as AgeBand };
  } catch {
    return emptySettings();
  }
};

const write = (settings: ChildSafetySettings) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(CHILD_SAFETY_CHANGED_EVENT, { detail: settings }));
};

export const childSafetyService = {
  getSettings: read,
  hasAgeSelection: () => Boolean(read().ageBand),
  isChild: () => read().ageBand === '9_12',
  setAgeBand(ageBand: AgeBand) {
    const current = read();
    const changedToChild = ageBand === '9_12' && current.ageBand !== '9_12';
    const next: ChildSafetySettings = {
      ...current,
      ageBand,
      ageSelectedAt: new Date().toISOString(),
      ...(changedToChild ? {
        learningAggregationAuthorizedAt: undefined,
        learningAggregationAuthority: undefined,
        rankingConsentVerifiedAt: undefined,
        rankingConsentAuthority: undefined,
      } : {}),
    };
    write(next);
    return next;
  },
  authorizeLearningAggregation(authority: 'guardian' | 'school') {
    const next = {
      ...read(),
      learningAggregationAuthority: authority,
      learningAggregationAuthorizedAt: new Date().toISOString(),
    };
    write(next);
    return next;
  },
  authorizeRankingByGuardian() {
    const next = {
      ...read(),
      rankingConsentAuthority: 'guardian' as const,
      rankingConsentVerifiedAt: new Date().toISOString(),
    };
    write(next);
    return next;
  },
  revokeRankingConsent() {
    const next = { ...read(), rankingConsentAuthority: undefined, rankingConsentVerifiedAt: undefined };
    write(next);
    return next;
  },
  revokeLearningAggregation() {
    const next = { ...read(), learningAggregationAuthority: undefined, learningAggregationAuthorizedAt: undefined };
    write(next);
    return next;
  },
  canContactRemoteServices: () => Boolean(read().ageBand),
  canUseLearningAggregation: () => {
    const settings = read();
    return settings.ageBand !== '9_12' || Boolean(settings.learningAggregationAuthorizedAt);
  },
  canSubmitRanking: () => {
    const settings = read();
    return settings.ageBand !== '9_12' || Boolean(settings.rankingConsentVerifiedAt);
  },
  // 協力・レースは年齢区分やランキング同意とは独立したゲーム機能。
  // 匿名ランキング投稿と学習集計だけを、それぞれの同意設定で制御する。
  canUsePeerFeatures: () => true,
};
