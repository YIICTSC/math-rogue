import { reconcileSchoolTrpgUnlocks } from './schoolTrpgEngine';
import type { TrpgCampaignState } from './schoolTrpgTypes';

export const SCHOOL_TRPG_SAVE_KEY = 'learning_rogue_school_trpg_campaign_v1_slot-1';
const SCHOOL_TRPG_PENDING_KEY = 'learning_rogue_school_trpg_campaign_v1_pending';

type SaveEnvelope = {
  schema: 'school-trpg-campaign';
  version: 1;
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
    version: 1,
    updatedAt: new Date().toISOString(),
    checksum: checksum(serializedCampaign),
    campaign,
  };
};

const parseEnvelope = (raw: string | null): SaveEnvelope | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SaveEnvelope>;
    if (parsed.schema !== 'school-trpg-campaign' || parsed.version !== 1 || !parsed.campaign) return null;
    const campaign = parsed.campaign as TrpgCampaignState;
    if (campaign.version !== 1 || typeof campaign.seed !== 'number' || !Array.isArray(campaign.unlockedLocationIds)) return null;
    if (checksum(JSON.stringify(campaign)) !== parsed.checksum) return null;
    return parsed as SaveEnvelope;
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
