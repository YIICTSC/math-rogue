import { reconcileSchoolTrpgUnlocks } from './schoolTrpgEngine';
import type { TrpgCampaignState } from './schoolTrpgTypes';

export const SCHOOL_TRPG_SAVE_KEY = 'learning_rogue_school_trpg_campaign_v1_slot-1';
const SCHOOL_TRPG_PENDING_KEY = 'learning_rogue_school_trpg_campaign_v1_pending';
export const SCHOOL_TRPG_SAVE_VERSION = 2;

type SaveEnvelope = {
  schema: 'school-trpg-campaign';
  version: 1 | 2;
  updatedAt: string;
  checksum: string;
  campaign: TrpgCampaignState;
};
const checksum = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const createEnvelope = (campaign: TrpgCampaignState): SaveEnvelope => {
  const serializedCampaign = JSON.stringify(campaign);
  return {
    schema: 'school-trpg-campaign',
    version: SCHOOL_TRPG_SAVE_VERSION,
    updatedAt: new Date().toISOString(),
    checksum: checksum(serializedCampaign),
    campaign,
  };
};

const parseEnvelope = (raw: string | null): SaveEnvelope | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SaveEnvelope>;
    if (parsed.schema !== 'school-trpg-campaign' || (parsed.version !== 1 && parsed.version !== SCHOOL_TRPG_SAVE_VERSION) || !parsed.campaign) return null;
    const rawCampaign = parsed.campaign as TrpgCampaignState;
    if (checksum(JSON.stringify(rawCampaign)) !== parsed.checksum) return null;
    const campaign = {
      ...rawCampaign,
      // Chapter 1 is additive; saves created before the expansion had no
      // chapter field and continue from the prologue by default.
      chapter: Number.isInteger(rawCampaign.chapter) && rawCampaign.chapter >= 0 ? rawCampaign.chapter : 0,
    } as TrpgCampaignState;
    // Added after schema v1 shipped; keep older saves byte-for-byte equivalent
    // after loading while rejecting malformed optional values. Do not add an
    // own property when an old save never had the field.
    if (Object.prototype.hasOwnProperty.call(rawCampaign, 'endingSummary')) {
      const endingSummary = rawCampaign.endingSummary;
      if (endingSummary
        && typeof endingSummary === 'object'
        && typeof endingSummary.ja === 'string'
        && typeof endingSummary.hira === 'string'
        && typeof endingSummary.en === 'string') {
        campaign.endingSummary = endingSummary;
      } else {
        delete campaign.endingSummary;
      }
    }
    if (Object.prototype.hasOwnProperty.call(rawCampaign, 'endingHistory')) {
      if (Array.isArray(rawCampaign.endingHistory) && rawCampaign.endingHistory.every(id => typeof id === 'string')) {
        campaign.endingHistory = rawCampaign.endingHistory;
      } else {
        delete campaign.endingHistory;
      }
    }
    if (Object.prototype.hasOwnProperty.call(rawCampaign, 'locationStates')) {
      const validStates = new Set(['UNVISITED', 'SEEN', 'RESOLVED', 'ALTERED', 'COMPANION_REACTION']);
      if (rawCampaign.locationStates && typeof rawCampaign.locationStates === 'object'
        && Object.values(rawCampaign.locationStates).every(state => validStates.has(state))) {
        campaign.locationStates = rawCampaign.locationStates;
      } else {
        delete campaign.locationStates;
      }
    }
    // v1 encounters did not carry phase/context metadata. Preserve the old
    // encounter values and fill only the optional fields needed by the v2 UI.
    if (campaign.combat) {
      campaign.combat = {
        ...campaign.combat,
        phase: Number.isFinite(campaign.combat.phase) ? campaign.combat.phase : 1,
        actionHistory: Array.isArray(campaign.combat.actionHistory) ? campaign.combat.actionHistory : [],
      };
    }
    if (campaign.version !== 1 || typeof campaign.seed !== 'number' || !Array.isArray(campaign.unlockedLocationIds)) return null;
    return { ...parsed, campaign } as SaveEnvelope;
  } catch {
    return null;
  }
};

export const loadSchoolTrpgCampaign = (): TrpgCampaignState | null => {
  if (typeof window === 'undefined') return null;
  const stable = parseEnvelope(window.localStorage.getItem(SCHOOL_TRPG_SAVE_KEY));
  const pending = parseEnvelope(window.localStorage.getItem(SCHOOL_TRPG_PENDING_KEY));
  const candidates = [stable, pending].filter((entry): entry is SaveEnvelope => Boolean(entry));
  if (!candidates.length) return null;
  candidates.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  return reconcileSchoolTrpgUnlocks(candidates[0].campaign);
};

export const saveSchoolTrpgCampaign = (campaign: TrpgCampaignState): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const envelope = createEnvelope(campaign);
    const serialized = JSON.stringify(envelope);
    window.localStorage.setItem(SCHOOL_TRPG_PENDING_KEY, serialized);
    if (!parseEnvelope(window.localStorage.getItem(SCHOOL_TRPG_PENDING_KEY))) return false;
    window.localStorage.setItem(SCHOOL_TRPG_SAVE_KEY, serialized);
    window.localStorage.removeItem(SCHOOL_TRPG_PENDING_KEY);
    return true;
  } catch {
    return false;
  }
};

export const clearSchoolTrpgCampaign = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SCHOOL_TRPG_SAVE_KEY);
    window.localStorage.removeItem(SCHOOL_TRPG_PENDING_KEY);
  } catch {
    // Storage can be unavailable in embedded previews.
  }
};
