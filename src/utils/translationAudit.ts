export type EnglishTranslationIssueKind =
  | 'late-dom-translation'
  | 'generic-fallback'
  | 'japanese-remains';

export interface EnglishTranslationIssue {
  kind: EnglishTranslationIssueKind;
  source: string;
  output: string;
  screen: string;
  location: string;
  count: number;
  firstSeenAt: string;
}

export interface EnglishTranslationAuditApi {
  readonly entries: EnglishTranslationIssue[];
  clear: () => void;
  snapshot: () => EnglishTranslationIssue[];
}

declare global {
  interface Window {
    __learningRogueTranslationAudit?: EnglishTranslationAuditApi;
  }
}

export const JAPANESE_VISIBLE_TEXT_PATTERN = /[ぁ-ゖァ-ヺ㐀-鿿々〆ヵヶ]/;

// These phrases are emergency placeholders, not translations. They must never
// make a translation audit look green merely because they contain no Japanese.
export const GENERIC_ENGLISH_FALLBACK_PATTERN = /(?:^|\b)(?:Choose Option|Event Details|School Foe|Choose a fitting event action|Discovery\.|A magical academy event unfolds\.?|Choose a Thoughtful Response|The short break helped your body and mind recover\.|You handled the (?:event|situation|moment).*|You turned the event into a useful tool for the road ahead\.|You handled the situation carefully and turned the experience into progress\.)(?:$|\b)/;

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

const getAuditApi = (): EnglishTranslationAuditApi | null => {
  if (typeof window === 'undefined') return null;
  if (window.__learningRogueTranslationAudit) return window.__learningRogueTranslationAudit;

  const entries: EnglishTranslationIssue[] = [];
  const syncDataset = () => {
    document.documentElement.dataset.translationAuditEntries = JSON.stringify(entries);
    document.documentElement.dataset.translationAuditCount = String(entries.length);
  };
  const api: EnglishTranslationAuditApi = {
    entries,
    clear: () => {
      entries.splice(0, entries.length);
      syncDataset();
    },
    snapshot: () => entries.map((entry) => ({ ...entry })),
  };
  window.__learningRogueTranslationAudit = api;
  syncDataset();
  return api;
};

export const recordEnglishTranslationIssue = (
  kind: EnglishTranslationIssueKind,
  source: string,
  output: string,
  location = 'translation',
): void => {
  const api = getAuditApi();
  if (!api) return;
  const normalizedSource = normalize(source);
  const normalizedOutput = normalize(output);
  if (!normalizedSource && !normalizedOutput) return;
  const screen = document.documentElement.dataset.translationAuditScreen || 'UNKNOWN';
  const existing = api.entries.find((entry) => (
    entry.kind === kind &&
    entry.source === normalizedSource &&
    entry.output === normalizedOutput &&
    entry.screen === screen &&
    entry.location === location
  ));
  if (existing) {
    existing.count += 1;
    document.documentElement.dataset.translationAuditEntries = JSON.stringify(api.entries);
    return;
  }
  const entry: EnglishTranslationIssue = {
    kind,
    source: normalizedSource,
    output: normalizedOutput,
    screen,
    location,
    count: 1,
    firstSeenAt: new Date().toISOString(),
  };
  api.entries.push(entry);
  document.documentElement.dataset.translationAuditEntries = JSON.stringify(api.entries);
  document.documentElement.dataset.translationAuditCount = String(api.entries.length);
  console.error('[English translation audit]', entry);
};

export const auditEnglishTranslationResult = (
  source: string,
  output: string,
  location = 'translation',
): void => {
  getAuditApi();
  if (JAPANESE_VISIBLE_TEXT_PATTERN.test(output)) {
    recordEnglishTranslationIssue('japanese-remains', source, output, location);
    return;
  }
  if (GENERIC_ENGLISH_FALLBACK_PATTERN.test(normalize(output))) {
    recordEnglishTranslationIssue('generic-fallback', source, output, location);
  }
};

export const auditLateDomTranslation = (
  source: string,
  output: string,
  location: string,
): void => {
  if (!JAPANESE_VISIBLE_TEXT_PATTERN.test(source)) return;
  recordEnglishTranslationIssue('late-dom-translation', source, output, location);
  auditEnglishTranslationResult(source, output, location);
};
