
import { AssignmentAnswerRecord, AssignmentPayload, GameState, GameScreen, RankingEntry, Card, PokerScoreEntry, SurvivorScoreEntry, DungeonScoreEntry, PokerRunState, KochoScoreEntry, PaperPlaneScoreEntry, LanguageMode, GoHomeScoreEntry, StudentProfile } from '../types';
import type { MagicEndingGalleryEntry } from './magicEndingService';
import type { ThemedEndingGalleryEntry } from '../data/themedEndingSequences';
import type { VisualThemeId } from '../data/visualThemes';
import type { ProblemSetView } from '../utils/localePreferences';
import { isProblemSetView } from '../utils/localePreferences';
import { DEBUG_FEATURES_ENABLED } from '../config/runtime';

const STORAGE_KEY_UNLOCKED_CARDS = 'pixel_spire_unlocked_cards_v1';
const STORAGE_KEY_UNLOCKED_RELICS = 'pixel_spire_unlocked_relics_v1';
const STORAGE_KEY_UNLOCKED_POTIONS = 'pixel_spire_unlocked_potions_v1';
const STORAGE_KEY_DEFEATED_ENEMIES = 'pixel_spire_defeated_enemies_v1';
const STORAGE_KEY_MAGIC_ENDING_GALLERY = 'pixel_spire_magic_ending_gallery_v1';
const STORAGE_KEY_THEMED_ENDING_GALLERY = 'pixel_spire_themed_ending_gallery_v1';

const STORAGE_KEY_GAME_STATE = 'pixel_spire_save_state_v1';
// The title screen's "Continue" entry belongs only to the main roguelike.
// Every mini-game owns its own progress/state key and must never create or
// validate the main-adventure resume slot.
const NON_RESUMABLE_GAME_SCREENS = new Set<GameScreen>([
  GameScreen.START_MENU,
  GameScreen.GAME_OVER,
  GameScreen.ENDING,
  GameScreen.MAGIC_ROMANCE_ENDING,
  GameScreen.VICTORY,
  GameScreen.COMPENDIUM,
  GameScreen.HELP,
  GameScreen.CHARACTER_SELECTION,
  GameScreen.DIFFICULTY_SELECTION,
  GameScreen.RANKING,
  GameScreen.PROBLEM_CHALLENGE,
  GameScreen.ASSIGNMENT_CREATE,
  GameScreen.SUBMISSION,
  GameScreen.REWARD_CARD_ALBUM,
  GameScreen.DEBUG_MENU,
  GameScreen.MAGIC_EVENT_SIMULATION,
  GameScreen.MINI_GAME_SELECT,
  GameScreen.MINI_GAME_MODE_SELECTION,
  GameScreen.MINI_GAME_POKER,
  GameScreen.MINI_GAME_SURVIVOR,
  GameScreen.MINI_GAME_DUNGEON,
  GameScreen.MINI_GAME_DUNGEON_2,
  GameScreen.MINI_GAME_KOCHO,
  GameScreen.MINI_GAME_PAPER_PLANE,
  GameScreen.MINI_GAME_GO_HOME,
  GameScreen.MINI_GAME_STONE_GLOW,
  GameScreen.MINI_GAME_SCHOOL_TRPG,
  GameScreen.MINI_GAME_LEARNING_TCG,
  GameScreen.MINI_GAME_SHOGI,
  GameScreen.MINI_GAME_GO,
  GameScreen.MINI_GAME_CHESS,
  GameScreen.MINI_GAME_MAHJONG,
]);

const isMainAdventureResumeState = (value: unknown): value is GameState => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GameState>;
  return typeof candidate.screen === 'string'
    && !NON_RESUMABLE_GAME_SCREENS.has(candidate.screen as GameScreen)
    && candidate.challengeMode !== 'COOP'
    && Boolean(candidate.player)
    && Array.isArray(candidate.map);
};
const STORAGE_KEY_CLEAR_COUNT = 'pixel_spire_clear_count_v1';
const STORAGE_KEY_THEME_CLEAR_COUNTS = 'pixel_spire_theme_clear_counts_v1';
const STORAGE_KEY_RANKING = 'pixel_spire_ranking_v1';
const STORAGE_KEY_POKER_RANKING = 'pixel_spire_poker_ranking_v1';
const STORAGE_KEY_SURVIVOR_RANKING = 'pixel_spire_survivor_ranking_v1';
const STORAGE_KEY_DUNGEON_RANKING = 'pixel_spire_dungeon_ranking_v1';
const STORAGE_KEY_LEGACY_CARD = 'pixel_spire_legacy_card_v1';
const STORAGE_KEY_COOP_LEGACY_CARD = 'pixel_spire_coop_legacy_card_v1';
const STORAGE_KEY_DEBUG_MATH_SKIP = 'pixel_spire_debug_math_skip_v1';
const STORAGE_KEY_DEBUG_HP_ONE = 'pixel_spire_debug_hp_one_v1';
const STORAGE_KEY_DEBUG_MINI_GAME_UNLOCK = 'pixel_spire_debug_mini_game_unlock_v1';
const STORAGE_KEY_UI_PREVIEW_CHECKLIST = 'pixel_spire_ui_preview_checklist_v1';
const STORAGE_KEY_MATH_CORRECT_COUNT = 'pixel_spire_math_correct_count_v1';
const STORAGE_KEY_CHALLENGE_RECORDS = 'pixel_spire_challenge_records_v1';
const STORAGE_KEY_MAX_UNLOCKED_DIFFICULTY = 'pixel_spire_max_unlocked_difficulty_v1';
const STORAGE_KEY_FIRST_STARTER_RELIC_SKIPPED = 'pixel_spire_first_starter_relic_skipped_v1';

const STORAGE_KEY_DUNGEON_STATE = 'pixel_spire_dungeon_state_v1';
const STORAGE_KEY_POKER_STATE = 'pixel_spire_poker_state_v1';
const STORAGE_KEY_POKER_EXPANDED_SUPPORTERS_UNLOCKED = 'pixel_spire_poker_expanded_supporters_unlocked_v1';

// For School Dungeon 2
const STORAGE_KEY_DUNGEON_STATE_2 = 'pixel_spire_dungeon_state_2_v1';
const STORAGE_KEY_DUNGEON_RANKING_2 = 'pixel_spire_dungeon_ranking_2_v1';

// For Kocho Showdown
const STORAGE_KEY_KOCHO_STATE = 'pixel_spire_kocho_state_v1';
const STORAGE_KEY_KOCHO_RANKING = 'pixel_spire_kocho_ranking_v1';
const STORAGE_KEY_KOCHO_UNLOCKED_CARDS = 'pixel_spire_kocho_unlocked_cards_v1';
const STORAGE_KEY_KOCHO_MAX_UNLOCKED_DIFFICULTY = 'pixel_spire_kocho_max_unlocked_difficulty_v1';

// For Paper Plane Battle
const STORAGE_KEY_PAPER_PLANE_STATE = 'pixel_spire_paper_plane_state_v1';
const STORAGE_KEY_PAPER_PLANE_PROGRESS = 'pixel_spire_paper_plane_progress_v1';
const STORAGE_KEY_PAPER_PLANE_RANKING = 'pixel_spire_paper_plane_ranking_v1';

// For Go Home Dash
const STORAGE_KEY_GO_HOME_RANKING = 'pixel_spire_go_home_ranking_v1';

// --- BATTLE TUTORIAL FLAG ---
const STORAGE_KEY_SEEN_BATTLE_TUTORIAL = 'pixel_spire_seen_battle_tutorial_v1';
const STORAGE_KEY_SEEN_PARRY_TUTORIAL = 'pixel_spire_seen_parry_tutorial_v1';
const STORAGE_KEY_SEEN_EXHAUST_CARD_HINT = 'pixel_spire_seen_exhaust_card_hint_v1';
const STORAGE_KEY_SEEN_RETAIN_CARD_HINT = 'pixel_spire_seen_retain_card_hint_v1';
const STORAGE_KEY_SEEN_FRIENDSHIP_COMBO_TUTORIAL = 'pixel_spire_seen_friendship_combo_tutorial_v1';
const STORAGE_KEY_SEEN_MAGIC_TRANSFORMATION_TUTORIAL = 'pixel_spire_seen_magic_transformation_tutorial_v1';
const STORAGE_KEY_SEEN_POKER_TUTORIAL = 'pixel_spire_seen_poker_tutorial_v1';

// --- ENGLISH VOICE FLAG ---
const STORAGE_KEY_ENGLISH_VOICE = 'pixel_spire_english_voice_v1';

// --- BGM MODE FLAG ---
const STORAGE_KEY_BGM_MODE = 'pixel_spire_bgm_mode_v1';
const STORAGE_KEY_SEEN_BGM_SWITCH_HINT = 'pixel_spire_seen_bgm_switch_hint_v1';

// --- LANGUAGE MODE FLAG ---
const STORAGE_KEY_LANGUAGE_MODE = 'pixel_spire_language_mode_v1';
const STORAGE_KEY_PROBLEM_SET_VIEW = 'pixel_spire_problem_set_view_v1';
const STORAGE_KEY_APP_SETTINGS = 'pixel_spire_app_settings_v1';
const STORAGE_KEY_KANJI_STROKE_ORDER = 'pixel_spire_kanji_stroke_order_v1';
const STORAGE_KEY_KANJI_TRACE_GUIDE = 'pixel_spire_kanji_trace_guide_v1';

// --- PLAY TIME ---
const STORAGE_KEY_TOTAL_PLAY_TIME = 'pixel_spire_total_play_time_v1';
const STORAGE_KEY_DAILY_PLAY_TIME = 'pixel_spire_daily_play_time_v1';
const STORAGE_KEY_MODE_CORRECT_COUNTS = 'pixel_spire_mode_correct_counts_v1';
const STORAGE_KEY_MASTERED_MODES = 'pixel_spire_mastered_modes_v1';
const STORAGE_KEY_TYPING_WEAK_KEYS = 'pixel_spire_typing_weak_keys_v1';
const STORAGE_KEY_HINT_STREAKS = 'pixel_spire_hint_streaks_v1';
const STORAGE_KEY_CURRENT_ASSIGNMENT = 'pixel_spire_current_assignment_v1';
const STORAGE_KEY_ASSIGNMENT_ANSWERS = 'pixel_spire_assignment_answers_v1';
const STORAGE_KEY_STUDENT_PROFILE = 'pixel_spire_student_profile_v1';
const STORAGE_KEY_REWARD_CARD_ALBUM = 'pixel_spire_reward_card_album_v1';
const STORAGE_KEY_REWARD_CARD_CLAIMED_ASSIGNMENTS = 'pixel_spire_reward_card_claimed_assignments_v1';
const STORAGE_KEY_COMPLETED_DAILY_ASSIGNMENTS = 'pixel_spire_completed_daily_assignments_v1';
const STORAGE_KEY_HIGHEST_CARD_DAMAGE = 'pixel_spire_highest_card_damage_v1';
export const ONLINE_RANKING_DATA_CHANGED_EVENT = 'learning-rogue:online-ranking-data-changed';

const notifyOnlineRankingDataChanged = (reason: string) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ONLINE_RANKING_DATA_CHANGED_EVENT, { detail: { reason } }));
};

// --- CUSTOM CHARACTER IMAGES ---
const STORAGE_KEY_CUSTOM_IMAGES = 'pixel_spire_custom_images_v1';
const STORAGE_TRANSFER_PREFIX = 'pixel_spire_';
const LEGACY_BURN_NAME = 'やほど';
const BURN_NAME = 'やけど';

export interface PaperPlaneProgress {
    rank: number; // Association Level (Clear Count equivalent)
    rerollCount: number; // Consumable rerolls
    maxClearedLevel: Record<string, number>; // Map of Ship ID -> Max Ascension Level cleared
    unlockedPartNames: string[];
}

export interface StorageTransferPayload {
    version: number;
    appName: string;
    exportedAt: string;
    origin: string;
    entries: Record<string, string>;
}

export type UiPreviewCheckTarget = 'pc' | 'mobileLandscape' | 'mobilePortrait' | 'buttonLayout';
export type UiPreviewChecklist = Record<string, Partial<Record<UiPreviewCheckTarget, boolean>>>;

const STORAGE_TRANSFER_TEXT_PREFIX = 'LRZ1:';

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const base64UrlToBytes = (base64Url: string): Uint8Array => {
  const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const streamToBytes = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> => {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    total += value.length;
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.length;
  });
  return bytes;
};

const gzipText = async (text: string): Promise<string | null> => {
  const CompressionStreamCtor = globalThis.CompressionStream;
  if (!CompressionStreamCtor) return null;

  const stream = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStreamCtor('gzip'));
  const bytes = await streamToBytes(stream);
  return `${STORAGE_TRANSFER_TEXT_PREFIX}${bytesToBase64Url(bytes)}`;
};

const gunzipText = async (text: string): Promise<string> => {
  const DecompressionStreamCtor = globalThis.DecompressionStream;
  if (!DecompressionStreamCtor) {
    throw new Error('このブラウザでは圧縮データを読み込めません。ファイル読み込みを試すか、最新版のブラウザで開いてください。');
  }

  const compressed = base64UrlToBytes(text.slice(STORAGE_TRANSFER_TEXT_PREFIX.length));
  const stream = new Blob([compressed])
    .stream()
    .pipeThrough(new DecompressionStreamCtor('gzip'));
  const bytes = await streamToBytes(stream);
  return new TextDecoder().decode(bytes);
};

export const serializeTransferData = async (payload: StorageTransferPayload): Promise<string> => {
  const minified = JSON.stringify(payload);
  try {
    return (await gzipText(minified)) || minified;
  } catch {
    return minified;
  }
};

export const parseTransferData = async (payloadText: string): Promise<unknown> => {
  const trimmed = payloadText.trim();
  if (trimmed.startsWith(STORAGE_TRANSFER_TEXT_PREFIX)) {
    return JSON.parse(await gunzipText(trimmed));
  }
  return JSON.parse(trimmed);
};

/**
 * ローカルの現在日付を取得する（YYYY-MM-DD）
 * toISOString() は UTC になるため使用しない
 */
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const collectTransferEntries = (): Record<string, string> => {
  const entries: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(STORAGE_TRANSFER_PREFIX)) continue;
    const value = localStorage.getItem(key);
    if (value != null) {
      entries[key] = value;
    }
  }
  return entries;
};

const normalizeTransferEntries = (payload: unknown): Record<string, string> => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('データ形式が正しくありません。');
  }

  const base = payload as Record<string, unknown>;
  const rawEntries =
    base.entries && typeof base.entries === 'object' && !Array.isArray(base.entries)
      ? (base.entries as Record<string, unknown>)
      : base;

  const entries = Object.entries(rawEntries)
    .filter(([key]) => key.startsWith(STORAGE_TRANSFER_PREFIX));

  if (entries.length === 0) {
    throw new Error('引き継ぎ可能な保存データが見つかりませんでした。');
  }

  const normalized: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (typeof value !== 'string') {
      throw new Error(`保存データ ${key} の形式が不正です。`);
    }
    normalized[key] = value;
  }

  return normalized;
};

const normalizeBurnText = (text: string | undefined): string | undefined =>
  typeof text === 'string' ? text.replaceAll(LEGACY_BURN_NAME, BURN_NAME) : text;

const normalizeBurnCard = (card: Card): Card => {
  const nextName = card.name === LEGACY_BURN_NAME ? BURN_NAME : card.name;
  const nextDescription = normalizeBurnText(card.description) || card.description;
  if (nextName === card.name && nextDescription === card.description) return card;
  return { ...card, name: nextName, description: nextDescription };
};

const normalizeBurnCards = (cards: Card[] | undefined): Card[] | undefined =>
  cards ? cards.map(normalizeBurnCard) : cards;

type LegacyLanguageGradeProfile = Partial<StudentProfile> & {
  gradeByLanguage?: Partial<Record<LanguageMode, string>>;
  schoolYearByLanguage?: Partial<Record<LanguageMode, number>>;
};

const createEmptyStudentProfile = (): StudentProfile => ({
  grade: '',
  className: '',
  number: '',
  name: '',
  schoolYear: undefined,
  dailyAssignmentLanguageMode: undefined,
});

const getStudentGradeLanguageKey = (grade?: string): 'JAPANESE' | 'ENGLISH' | undefined => {
  if (!grade) return undefined;
  if (/^Grade\s*[1-8]$/i.test(grade) || grade === 'Adult') return 'ENGLISH';
  if (/^(小学[1-6]年生|中学[1-3]年生|高校以上|大人)$/.test(grade)) return 'JAPANESE';
  return undefined;
};

const normalizeStudentProfile = (profile: LegacyLanguageGradeProfile | null | undefined): StudentProfile => {
  const base = { ...createEmptyStudentProfile(), ...(profile || {}) };
  const inferredLanguage = base.dailyAssignmentLanguageMode
    || getStudentGradeLanguageKey(base.grade)
    || (base.gradeByLanguage?.ENGLISH ? 'ENGLISH' : undefined)
    || (base.gradeByLanguage?.JAPANESE ? 'JAPANESE' : undefined);
  const migratedGrade = base.grade || (inferredLanguage ? base.gradeByLanguage?.[inferredLanguage] : '') || '';
  const migratedSchoolYear = base.schoolYear || (inferredLanguage ? base.schoolYearByLanguage?.[inferredLanguage] : undefined);
  return {
    ...base,
    grade: migratedGrade,
    className: base.className || '',
    number: base.number || '',
    name: base.name || '',
    schoolYear: migratedSchoolYear,
    dailyAssignmentLanguageMode: inferredLanguage,
  };
};

const normalizeBurnPlayer = (player: GameState['player']): GameState['player'] => ({
  ...player,
  deck: normalizeBurnCards(player.deck) || [],
  hand: normalizeBurnCards(player.hand) || [],
  discardPile: normalizeBurnCards(player.discardPile) || [],
  drawPile: normalizeBurnCards(player.drawPile) || [],
  codexBuffer: normalizeBurnCards(player.codexBuffer),
  floatingText: player.floatingText
    ? { ...player.floatingText, text: normalizeBurnText(player.floatingText.text) || player.floatingText.text }
    : player.floatingText,
});

const normalizeBurnRewards = (rewards: GameState['rewards']): GameState['rewards'] =>
  rewards.map((reward) =>
    reward.type === 'CARD' && reward.value && typeof reward.value === 'object'
      ? { ...reward, value: normalizeBurnCard(reward.value as Card) }
      : reward
  );

const normalizeBurnGameState = (state: GameState): GameState => ({
  ...state,
  player: normalizeBurnPlayer(state.player),
  rewards: normalizeBurnRewards(state.rewards),
  codexOptions: normalizeBurnCards(state.codexOptions),
  narrativeLog: state.narrativeLog.map((entry) => normalizeBurnText(entry) || entry),
  combatLog: state.combatLog.map((entry) => normalizeBurnText(entry) || entry),
  newlyUnlockedCardName: normalizeBurnText(state.newlyUnlockedCardName),
  coopBattleState: state.coopBattleState
    ? {
        ...state.coopBattleState,
        players: state.coopBattleState.players.map((entry) => ({
          ...entry,
          player: normalizeBurnPlayer(entry.player),
        })),
      }
    : state.coopBattleState,
});

export const storageService = {
  getCurrentAssignment: (): AssignmentPayload | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT_ASSIGNMENT);
      if (!stored) return null;
      const assignment = JSON.parse(stored) as AssignmentPayload;
      return {
        ...assignment,
        units: (assignment.units || []).map((unit) => ({
          ...unit,
          targetCorrect: Math.max(1, Number(unit.targetCorrect || 10)),
        })),
        customProblems: (assignment.customProblems || []).map((problem) => ({
          ...problem,
          question: String(problem.question || ''),
          answer: String(problem.answer || ''),
          options: Array.isArray(problem.options) ? problem.options.map((option) => String(option || '')) : [],
          imageUrl: problem.imageUrl ? String(problem.imageUrl) : undefined,
          imageAlt: problem.imageAlt ? String(problem.imageAlt) : undefined,
        })),
        customTargetCorrect: Math.max(1, Number(assignment.customTargetCorrect || (assignment.customProblems || []).length || 10)),
      };
    } catch (e) {
      return null;
    }
  },

  saveCurrentAssignment: (assignment: AssignmentPayload) => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_ASSIGNMENT, JSON.stringify(assignment));
    } catch (e) {
      console.warn("Failed to save current assignment", e);
    }
  },

  clearCurrentAssignment: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_ASSIGNMENT);
    } catch (e) {
      console.warn("Failed to clear current assignment", e);
    }
  },

  getAssignmentAnswers: (): AssignmentAnswerRecord[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ASSIGNMENT_ANSWERS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  saveAssignmentAnswer: (record: AssignmentAnswerRecord) => {
    try {
      const current = storageService.getAssignmentAnswers();
      localStorage.setItem(STORAGE_KEY_ASSIGNMENT_ANSWERS, JSON.stringify([...current, record]));
      notifyOnlineRankingDataChanged('learning-answer');
    } catch (e) {
      console.warn("Failed to save assignment answer", e);
    }
  },

  getCompletedDailyAssignmentIds: (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMPLETED_DAILY_ASSIGNMENTS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  markDailyAssignmentCompleted: (assignmentId: string) => {
    try {
      const current = storageService.getCompletedDailyAssignmentIds();
      const next = Array.from(new Set([...current, assignmentId])).slice(-60);
      localStorage.setItem(STORAGE_KEY_COMPLETED_DAILY_ASSIGNMENTS, JSON.stringify(next));
    } catch (e) {
      console.warn("Failed to save completed daily assignment", e);
    }
  },

  getStudentProfile: (): StudentProfile => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STUDENT_PROFILE);
      return normalizeStudentProfile(stored ? JSON.parse(stored) : null);
    } catch (e) {
      return createEmptyStudentProfile();
    }
  },

  saveStudentProfile: (profile: StudentProfile) => {
    try {
      const nextProfile = normalizeStudentProfile(profile);
      localStorage.setItem(STORAGE_KEY_STUDENT_PROFILE, JSON.stringify(nextProfile));
    } catch (e) {
      console.warn("Failed to save student profile", e);
    }
  },

  getRewardCardAlbum: (): Card[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REWARD_CARD_ALBUM);
      return stored ? JSON.parse(stored).map((card: Card) => normalizeBurnCard(card)) : [];
    } catch (e) {
      return [];
    }
  },

  saveRewardCardToAlbum: (card: Card) => {
    try {
      const current = storageService.getRewardCardAlbum();
      localStorage.setItem(STORAGE_KEY_REWARD_CARD_ALBUM, JSON.stringify([...current, card]));
      notifyOnlineRankingDataChanged('reward-card');
    } catch (e) {
      console.warn("Failed to save reward card", e);
    }
  },

  deleteRewardCardFromAlbum: (cardId: string) => {
    try {
      const next = storageService.getRewardCardAlbum().filter(card => card.id !== cardId);
      localStorage.setItem(STORAGE_KEY_REWARD_CARD_ALBUM, JSON.stringify(next));
      notifyOnlineRankingDataChanged('reward-card');
    } catch (e) {
      console.warn("Failed to delete reward card", e);
    }
  },

  hasClaimedAssignmentRewardCard: (assignmentId: string): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REWARD_CARD_CLAIMED_ASSIGNMENTS);
      const ids = stored ? JSON.parse(stored) : [];
      return Array.isArray(ids) && ids.includes(assignmentId);
    } catch (e) {
      return false;
    }
  },

  markAssignmentRewardCardClaimed: (assignmentId: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REWARD_CARD_CLAIMED_ASSIGNMENTS);
      const ids = stored ? JSON.parse(stored) : [];
      const next = Array.isArray(ids) ? ids : [];
      if (!next.includes(assignmentId)) {
        localStorage.setItem(STORAGE_KEY_REWARD_CARD_CLAIMED_ASSIGNMENTS, JSON.stringify([...next, assignmentId]));
      }
    } catch (e) {
      console.warn("Failed to mark assignment reward card", e);
    }
  },

  // --- Custom Character Images ---
  saveCustomImage: (charId: string, dataUrl: string) => {
    try {
      const current = storageService.getCustomImages();
      current[charId] = dataUrl;
      localStorage.setItem(STORAGE_KEY_CUSTOM_IMAGES, JSON.stringify(current));
    } catch (e) {
      console.warn("Failed to save custom image", e);
    }
  },

  getCustomImages: (): Record<string, string> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_IMAGES);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  },

  clearCustomImage: (charId: string) => {
    try {
      const current = storageService.getCustomImages();
      delete current[charId];
      localStorage.setItem(STORAGE_KEY_CUSTOM_IMAGES, JSON.stringify(current));
    } catch (e) {
      console.warn("Failed to clear custom image", e);
    }
  },

  // --- Unlocked Items (Cards, Relics, Potions, Enemies) ---
  
  // Cards
  getUnlockedCards: (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_UNLOCKED_CARDS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
  saveUnlockedCard: (cardName: string) => {
    try {
      const current = storageService.getUnlockedCards();
      if (!current.includes(cardName)) {
        const updated = [...current, cardName];
        localStorage.setItem(STORAGE_KEY_UNLOCKED_CARDS, JSON.stringify(updated));
        notifyOnlineRankingDataChanged('card-collection');
      }
    } catch (e) {
      console.warn("Failed to save unlocked card", e);
    }
  },
  saveUnlockedCards: (cardNames: string[]) => {
    try {
      const current = storageService.getUnlockedCards();
      const next = new Set([...current, ...cardNames]);
      localStorage.setItem(STORAGE_KEY_UNLOCKED_CARDS, JSON.stringify(Array.from(next)));
      notifyOnlineRankingDataChanged('card-collection');
    } catch (e) {
      console.warn("Failed to save unlocked cards", e);
    }
  },

  // Relics
  getUnlockedRelics: (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_UNLOCKED_RELICS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
  saveUnlockedRelic: (relicId: string) => {
    try {
      const current = storageService.getUnlockedRelics();
      if (!current.includes(relicId)) {
        const updated = [...current, relicId];
        localStorage.setItem(STORAGE_KEY_UNLOCKED_RELICS, JSON.stringify(updated));
      }
    } catch (e) { console.warn(e); }
  },

  // Potions
  getUnlockedPotions: (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_UNLOCKED_POTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
  saveUnlockedPotion: (potionId: string) => {
    try {
      const current = storageService.getUnlockedPotions();
      if (!current.includes(potionId)) {
        const updated = [...current, potionId];
        localStorage.setItem(STORAGE_KEY_UNLOCKED_POTIONS, JSON.stringify(updated));
      }
    } catch (e) { console.warn(e); }
  },

  // Defeated Enemies (Bestiary)
  getDefeatedEnemies: (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DEFEATED_ENEMIES);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
  saveDefeatedEnemy: (enemyName: string) => {
    try {
      const current = storageService.getDefeatedEnemies();
      if (!current.includes(enemyName)) {
        const updated = [...current, enemyName];
        localStorage.setItem(STORAGE_KEY_DEFEATED_ENEMIES, JSON.stringify(updated));
      }
    } catch (e) { console.warn(e); }
  },

  getMagicEndingGallery: (): MagicEndingGalleryEntry[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MAGIC_ENDING_GALLERY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  saveMagicEndingGalleryEntries: (entries: MagicEndingGalleryEntry[]) => {
    if (entries.length === 0) return;
    try {
      const current = storageService.getMagicEndingGallery();
      const byId = new Map(current.map(entry => [entry.id, entry]));
      entries.forEach(entry => {
        byId.set(entry.id, {
          ...byId.get(entry.id),
          ...entry,
          unlockedAt: byId.get(entry.id)?.unlockedAt ?? entry.unlockedAt,
        });
      });
      localStorage.setItem(STORAGE_KEY_MAGIC_ENDING_GALLERY, JSON.stringify(Array.from(byId.values())));
    } catch (e) {
      console.warn("Failed to save magic ending gallery", e);
    }
  },

  getThemedEndingGallery: (): ThemedEndingGalleryEntry[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_THEMED_ENDING_GALLERY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  saveThemedEndingGalleryEntry: (entry: ThemedEndingGalleryEntry) => {
    try {
      const current = storageService.getThemedEndingGallery();
      const byId = new Map(current.map(item => [item.id, item]));
      byId.set(entry.id, {
        ...byId.get(entry.id),
        ...entry,
        unlockedAt: byId.get(entry.id)?.unlockedAt ?? entry.unlockedAt,
      });
      localStorage.setItem(STORAGE_KEY_THEMED_ENDING_GALLERY, JSON.stringify(Array.from(byId.values())));
    } catch (e) {
      console.warn('Failed to save themed ending gallery', e);
    }
  },

  // --- Clear Count (Unlock Characters) ---
  getClearCount: (): number => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_CLEAR_COUNT);
          return stored ? parseInt(stored, 10) : 0;
      } catch (e) {
          return 0;
      }
  },

  incrementClearCount: () => {
      try {
          const current = storageService.getClearCount();
          localStorage.setItem(STORAGE_KEY_CLEAR_COUNT, (current + 1).toString());
          notifyOnlineRankingDataChanged('clear-count');
      } catch (e) {
          console.warn("Failed to save clear count", e);
      }
  },

  getHighestCardDamage: (): { damage: number; cardName: string; recordedAt: string } => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HIGHEST_CARD_DAMAGE);
      if (!stored) return { damage: 0, cardName: '', recordedAt: '' };
      const parsed = JSON.parse(stored) as { damage?: unknown; cardName?: unknown; recordedAt?: unknown };
      const damage = Number(parsed.damage);
      return {
        damage: Number.isSafeInteger(damage) && damage > 0 ? damage : 0,
        cardName: typeof parsed.cardName === 'string' ? parsed.cardName.slice(0, 40) : '',
        recordedAt: typeof parsed.recordedAt === 'string' ? parsed.recordedAt : '',
      };
    } catch {
      return { damage: 0, cardName: '', recordedAt: '' };
    }
  },

  saveHighestCardDamage: (damage: number, cardName: string) => {
    try {
      const safeDamage = Math.max(0, Math.min(1_000_000_000, Math.floor(Number(damage) || 0)));
      if (safeDamage <= storageService.getHighestCardDamage().damage) return;
      localStorage.setItem(STORAGE_KEY_HIGHEST_CARD_DAMAGE, JSON.stringify({
        damage: safeDamage,
        cardName: String(cardName || '').slice(0, 40),
        recordedAt: new Date().toISOString(),
      }));
      notifyOnlineRankingDataChanged('card-damage');
    } catch (e) {
      console.warn('Failed to save highest card damage', e);
    }
  },

  getThemeClearCounts: (): Record<VisualThemeId, number> => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_THEME_CLEAR_COUNTS);
          const parsed = stored ? JSON.parse(stored) : {};
          return {
              elementary: Math.max(0, Number(parsed.elementary) || 0),
              'high-school': Math.max(0, Number(parsed['high-school']) || 0),
              magic: Math.max(0, Number(parsed.magic) || 0),
          };
      } catch (e) {
          return { elementary: 0, 'high-school': 0, magic: 0 };
      }
  },

  getThemeClearCount: (theme: VisualThemeId): number => {
      return storageService.getThemeClearCounts()[theme] || 0;
  },

  incrementThemeClearCount: (theme: VisualThemeId): number => {
      try {
          const current = storageService.getThemeClearCounts();
          const nextCount = (current[theme] || 0) + 1;
          localStorage.setItem(STORAGE_KEY_THEME_CLEAR_COUNTS, JSON.stringify({
              ...current,
              [theme]: nextCount,
          }));
          return nextCount;
      } catch (e) {
          console.warn("Failed to save theme clear count", e);
          return storageService.getThemeClearCount(theme);
      }
  },

  // --- Math Correct Count ---
  getMathCorrectCount: (): number => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_MATH_CORRECT_COUNT);
          return stored ? parseInt(stored, 10) : 0;
      } catch (e) {
          return 0;
      }
  },

  saveMathCorrectCount: (count: number) => {
      try {
          localStorage.setItem(STORAGE_KEY_MATH_CORRECT_COUNT, count.toString());
      } catch (e) {
          console.warn("Failed to save math correct count", e);
      }
  },

  // --- Challenge Records ---
  getChallengeRecords: (): Record<string, number> => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_CHALLENGE_RECORDS);
          return stored ? JSON.parse(stored) : {};
      } catch (e) {
          return {};
      }
  },

  saveChallengeRecord: (category: string, score: number) => {
      try {
          const current = storageService.getChallengeRecords();
          if (!current[category] || score > current[category]) {
              current[category] = score;
              localStorage.setItem(STORAGE_KEY_CHALLENGE_RECORDS, JSON.stringify(current));
          }
      } catch (e) {
          console.warn("Failed to save challenge record", e);
      }
  },

  getMaxUnlockedDifficulty: (): number => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_MAX_UNLOCKED_DIFFICULTY);
          const parsed = stored ? parseInt(stored, 10) : 1;
          return Math.min(10, Math.max(1, Number.isFinite(parsed) ? parsed : 1));
      } catch (e) {
          return 1;
      }
  },

  unlockDifficulty: (level: number) => {
      try {
          const current = storageService.getMaxUnlockedDifficulty();
          const next = Math.min(10, Math.max(current, level));
          localStorage.setItem(STORAGE_KEY_MAX_UNLOCKED_DIFFICULTY, next.toString());
      } catch (e) {
          console.warn("Failed to unlock difficulty", e);
      }
  },

  hasSkippedFirstStarterRelic: (): boolean => {
      return localStorage.getItem(STORAGE_KEY_FIRST_STARTER_RELIC_SKIPPED) === 'true';
  },

  markFirstStarterRelicSkipped: () => {
      localStorage.setItem(STORAGE_KEY_FIRST_STARTER_RELIC_SKIPPED, 'true');
  },

  // --- Adventure Log / Scores ---
  saveScore: (entry: RankingEntry) => {
      try {
          const current = storageService.getLocalScores();
          // Increase limit to 50 for a better log experience
          const updated = [entry, ...current].slice(0, 50); 
          localStorage.setItem(STORAGE_KEY_RANKING, JSON.stringify(updated));
          notifyOnlineRankingDataChanged(entry.challengeMode === 'COOP' ? 'coop-result' : 'adventure-result');
      } catch (e) {
          console.warn("Failed to save score", e);
      }
  },

  getLocalScores: (): RankingEntry[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_RANKING);
          return stored ? JSON.parse(stored) : [];
      } catch (e) {
          return [];
      }
  },

  // --- Poker Scores ---
  savePokerScore: (entry: PokerScoreEntry) => {
      try {
          const current = storageService.getPokerScores();
          const updated = [entry, ...current].slice(0, 50);
          localStorage.setItem(STORAGE_KEY_POKER_RANKING, JSON.stringify(updated));
          notifyOnlineRankingDataChanged('mini-game-result');
      } catch (e) {
          console.warn("Failed to save poker score", e);
      }
  },

  getPokerScores: (): PokerScoreEntry[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_POKER_RANKING);
          return stored ? JSON.parse(stored) : [];
      } catch (e) {
          return [];
      }
  },

  getPokerExpandedSupporterUnlockCount: (): number => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_POKER_EXPANDED_SUPPORTERS_UNLOCKED);
          if (stored === 'true') return Number.MAX_SAFE_INTEGER;
          const parsed = stored ? parseInt(stored, 10) : 0;
          return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      } catch (e) {
          return 0;
      }
  },

  unlockPokerExpandedSupporters: (maxCount?: number) => {
      try {
          const current = storageService.getPokerExpandedSupporterUnlockCount();
          const next = maxCount !== undefined ? Math.min(current + 1, maxCount) : current + 1;
          localStorage.setItem(STORAGE_KEY_POKER_EXPANDED_SUPPORTERS_UNLOCKED, next.toString());
      } catch (e) {
          console.warn("Failed to unlock poker expanded supporters", e);
      }
  },

  savePokerState: (state: PokerRunState) => {
      try {
          localStorage.setItem(STORAGE_KEY_POKER_STATE, JSON.stringify(state));
      } catch (e) { console.warn("Failed to save poker state", e); }
  },

  loadPokerState: (): PokerRunState | null => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_POKER_STATE);
          return stored ? JSON.parse(stored) : null;
      } catch { return null; }
  },

  clearPokerState: () => {
      localStorage.removeItem(STORAGE_KEY_POKER_STATE);
  },

  // --- Survivor Scores ---
  saveSurvivorScore: (entry: SurvivorScoreEntry) => {
      try {
          const current = storageService.getSurvivorScores();
          const updated = [entry, ...current].slice(0, 50);
          localStorage.setItem(STORAGE_KEY_SURVIVOR_RANKING, JSON.stringify(updated));
          notifyOnlineRankingDataChanged('mini-game-result');
      } catch (e) {
          console.warn("Failed to save survivor score", e);
      }
  },

  getSurvivorScores: (): SurvivorScoreEntry[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_SURVIVOR_RANKING);
          return stored ? JSON.parse(stored) : [];
      } catch (e) {
          return [];
      }
  },

  // --- Dungeon Scores & State (Dungeon 1) ---
  saveDungeonScore: (entry: DungeonScoreEntry) => {
      try {
          const current = storageService.getDungeonScores();
          const updated = [entry, ...current].slice(0, 50);
          localStorage.setItem(STORAGE_KEY_DUNGEON_RANKING, JSON.stringify(updated));
          notifyOnlineRankingDataChanged('mini-game-result');
      } catch (e) {
          console.warn("Failed to save dungeon score", e);
      }
  },

  getDungeonScores: (): DungeonScoreEntry[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_DUNGEON_RANKING);
          return stored ? JSON.parse(stored) : [];
      } catch (e) {
          return [];
      }
  },

  saveDungeonState: (state: any) => {
      try {
          localStorage.setItem(STORAGE_KEY_DUNGEON_STATE, JSON.stringify(state));
      } catch (e) { console.warn("Failed to save dungeon state", e); }
  },

  loadDungeonState: (): any => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_DUNGEON_STATE);
          return stored ? JSON.parse(stored) : null;
      } catch { return null; }
  },

  clearDungeonState: () => {
      localStorage.removeItem(STORAGE_KEY_DUNGEON_STATE);
  },

  // --- Dungeon Scores & State (Dungeon 2) ---
  saveDungeonScore2: (entry: DungeonScoreEntry) => {
      try {
          const current = storageService.getDungeonScores2();
          const updated = [entry, ...current].slice(0, 50);
          localStorage.setItem(STORAGE_KEY_DUNGEON_RANKING_2, JSON.stringify(updated));
          notifyOnlineRankingDataChanged('mini-game-result');
      } catch (e) {
          console.warn("Failed to save dungeon 2 score", e);
      }
  },

  getDungeonScores2: (): DungeonScoreEntry[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_DUNGEON_RANKING_2);
          return stored ? JSON.parse(stored) : [];
      } catch (e) {
          return [];
      }
  },

  saveDungeonState2: (state: any) => {
      try {
          localStorage.setItem(STORAGE_KEY_DUNGEON_STATE_2, JSON.stringify(state));
      } catch (e) { console.warn("Failed to save dungeon 2 state", e); }
  },

  loadDungeonState2: (): any => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_DUNGEON_STATE_2);
          return stored ? JSON.parse(stored) : null;
      } catch { return null; }
  },

  clearDungeonState2: () => {
      localStorage.removeItem(STORAGE_KEY_DUNGEON_STATE_2);
  },

  // --- Kocho Showdown State & Scores ---
  saveKochoScore: (entry: KochoScoreEntry) => {
      try {
          const current = storageService.getKochoScores();
          const updated = [entry, ...current].slice(0, 50);
          localStorage.setItem(STORAGE_KEY_KOCHO_RANKING, JSON.stringify(updated));
          notifyOnlineRankingDataChanged('mini-game-result');
      } catch (e) {
          console.warn("Failed to save kocho score", e);
      }
  },

  getKochoScores: (): KochoScoreEntry[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_KOCHO_RANKING);
          return stored ? JSON.parse(stored) : [];
      } catch (e) {
          return [];
      }
  },

  saveKochoState: (state: any) => {
      try {
          localStorage.setItem(STORAGE_KEY_KOCHO_STATE, JSON.stringify(state));
      } catch (e) { console.warn("Failed to save kocho state", e); }
  },

  loadKochoState: (): any => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_KOCHO_STATE);
          return stored ? JSON.parse(stored) : null;
      } catch { return null; }
  },

  clearKochoState: () => {
      localStorage.removeItem(STORAGE_KEY_KOCHO_STATE);
  },

  getUnlockedKochoCards: (): string[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_KOCHO_UNLOCKED_CARDS);
          return stored ? JSON.parse(stored) : [];
      } catch (e) {
          return [];
      }
  },

  saveUnlockedKochoCard: (cardName: string) => {
      try {
          const current = storageService.getUnlockedKochoCards();
          if (!current.includes(cardName)) {
              localStorage.setItem(STORAGE_KEY_KOCHO_UNLOCKED_CARDS, JSON.stringify([...current, cardName]));
          }
      } catch (e) {
          console.warn("Failed to save kocho unlocked card", e);
      }
  },

  getMaxUnlockedKochoDifficulty: (): number => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_KOCHO_MAX_UNLOCKED_DIFFICULTY);
          const parsed = stored ? parseInt(stored, 10) : 1;
          return Math.min(10, Math.max(1, Number.isFinite(parsed) ? parsed : 1));
      } catch (e) {
          return 1;
      }
  },

  unlockKochoDifficulty: (level: number) => {
      try {
          const current = storageService.getMaxUnlockedKochoDifficulty();
          const next = Math.min(10, Math.max(current, level));
          localStorage.setItem(STORAGE_KEY_KOCHO_MAX_UNLOCKED_DIFFICULTY, next.toString());
      } catch (e) {
          console.warn("Failed to unlock kocho difficulty", e);
      }
  },

  // --- Paper Plane Battle State & Progress & Scores ---
  savePaperPlaneScore: (entry: PaperPlaneScoreEntry) => {
      try {
          const current = storageService.getPaperPlaneScores();
          const updated = [entry, ...current].slice(0, 50);
          localStorage.setItem(STORAGE_KEY_PAPER_PLANE_RANKING, JSON.stringify(updated));
          notifyOnlineRankingDataChanged('mini-game-result');
      } catch (e) {
          console.warn("Failed to save paper plane score", e);
      }
  },

  getPaperPlaneScores: (): PaperPlaneScoreEntry[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_PAPER_PLANE_RANKING);
          return stored ? JSON.parse(stored) : [];
      } catch (e) {
          return [];
      }
  },

  savePaperPlaneState: (state: any) => {
      try {
          localStorage.setItem(STORAGE_KEY_PAPER_PLANE_STATE, JSON.stringify(state));
      } catch (e) { console.warn("Failed to save paper plane state", e); }
  },

  loadPaperPlaneState: (): any => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_PAPER_PLANE_STATE);
          return stored ? JSON.parse(stored) : null;
      } catch { return null; }
  },

  clearPaperPlaneState: () => {
      localStorage.removeItem(STORAGE_KEY_PAPER_PLANE_STATE);
  },

  savePaperPlaneProgress: (progress: PaperPlaneProgress) => {
      try {
          localStorage.setItem(STORAGE_KEY_PAPER_PLANE_PROGRESS, JSON.stringify(progress));
      } catch (e) { console.warn("Failed to save paper plane progress", e); }
  },

  loadPaperPlaneProgress: (): PaperPlaneProgress => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_PAPER_PLANE_PROGRESS);
          if (stored) {
              const parsed = JSON.parse(stored);
              return {
                  rank: parsed.rank ?? 1,
                  rerollCount: parsed.rerollCount ?? 3,
                  maxClearedLevel: parsed.maxClearedLevel ?? {},
                  unlockedPartNames: parsed.unlockedPartNames ?? [],
              };
          }
      } catch (e) { /* ignore */ }
      return { rank: 1, rerollCount: 3, maxClearedLevel: {}, unlockedPartNames: [] };
  },

  // --- Go Home Dash Scores ---
  saveGoHomeScore: (entry: GoHomeScoreEntry) => {
      try {
          const current = storageService.getGoHomeScores();
          const updated = [entry, ...current].slice(0, 50);
          localStorage.setItem(STORAGE_KEY_GO_HOME_RANKING, JSON.stringify(updated));
          notifyOnlineRankingDataChanged('mini-game-result');
      } catch (e) {
          console.warn("Failed to save go home score", e);
      }
  },

  getGoHomeScores: (): GoHomeScoreEntry[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_GO_HOME_RANKING);
          return stored ? JSON.parse(stored) : [];
      } catch (e) {
          return [];
      }
  },

  // --- Battle Tutorial Flag ---
  getSeenBattleTutorial: (): boolean => {
      return localStorage.getItem(STORAGE_KEY_SEEN_BATTLE_TUTORIAL) === 'true';
  },

  saveSeenBattleTutorial: () => {
      localStorage.setItem(STORAGE_KEY_SEEN_BATTLE_TUTORIAL, 'true');
  },

  getSeenParryTutorial: (): boolean => {
      return localStorage.getItem(STORAGE_KEY_SEEN_PARRY_TUTORIAL) === 'true';
  },

  saveSeenParryTutorial: () => {
      localStorage.setItem(STORAGE_KEY_SEEN_PARRY_TUTORIAL, 'true');
  },

  getSeenExhaustCardHint: (): boolean => {
      return localStorage.getItem(STORAGE_KEY_SEEN_EXHAUST_CARD_HINT) === 'true';
  },

  saveSeenExhaustCardHint: () => {
      localStorage.setItem(STORAGE_KEY_SEEN_EXHAUST_CARD_HINT, 'true');
  },

  getSeenRetainCardHint: (): boolean => {
      return localStorage.getItem(STORAGE_KEY_SEEN_RETAIN_CARD_HINT) === 'true';
  },

  saveSeenRetainCardHint: () => {
      localStorage.setItem(STORAGE_KEY_SEEN_RETAIN_CARD_HINT, 'true');
  },

  getSeenFriendshipComboTutorial: (): boolean => {
      return localStorage.getItem(STORAGE_KEY_SEEN_FRIENDSHIP_COMBO_TUTORIAL) === 'true';
  },

  saveSeenFriendshipComboTutorial: () => {
      localStorage.setItem(STORAGE_KEY_SEEN_FRIENDSHIP_COMBO_TUTORIAL, 'true');
  },

  getSeenMagicTransformationTutorial: (): boolean => {
      return localStorage.getItem(STORAGE_KEY_SEEN_MAGIC_TRANSFORMATION_TUTORIAL) === 'true';
  },

  saveSeenMagicTransformationTutorial: () => {
      localStorage.setItem(STORAGE_KEY_SEEN_MAGIC_TRANSFORMATION_TUTORIAL, 'true');
  },

  getSeenPokerTutorial: (): boolean => {
      return localStorage.getItem(STORAGE_KEY_SEEN_POKER_TUTORIAL) === 'true';
  },

  saveSeenPokerTutorial: () => {
      localStorage.setItem(STORAGE_KEY_SEEN_POKER_TUTORIAL, 'true');
  },

  // --- English Voice Flag ---
  getEnglishVoiceEnabled: (): boolean => {
    const stored = localStorage.getItem(STORAGE_KEY_ENGLISH_VOICE);
    return stored === null ? true : stored === 'true';
  },

  saveEnglishVoiceEnabled: (enabled: boolean) => {
    localStorage.setItem(STORAGE_KEY_ENGLISH_VOICE, enabled.toString());
  },

  // --- BGM Mode ---
  getBgmMode: (): string | null => {
    return localStorage.getItem(STORAGE_KEY_BGM_MODE);
  },

  saveBgmMode: (mode: string) => {
    localStorage.setItem(STORAGE_KEY_BGM_MODE, mode);
  },

  getSeenBgmSwitchHint: (): boolean => {
    return localStorage.getItem(STORAGE_KEY_SEEN_BGM_SWITCH_HINT) === 'true';
  },

  saveSeenBgmSwitchHint: () => {
    localStorage.setItem(STORAGE_KEY_SEEN_BGM_SWITCH_HINT, 'true');
  },

  // --- Language Mode ---
  getLanguageMode: (): LanguageMode | null => {
    return localStorage.getItem(STORAGE_KEY_LANGUAGE_MODE) as LanguageMode | null;
  },

  saveLanguageMode: (mode: LanguageMode) => {
    localStorage.setItem(STORAGE_KEY_LANGUAGE_MODE, mode);
  },

  getProblemSetView: (): ProblemSetView | null => {
    const stored = localStorage.getItem(STORAGE_KEY_PROBLEM_SET_VIEW);
    return isProblemSetView(stored) ? stored : null;
  },

  saveProblemSetView: (view: ProblemSetView) => {
    localStorage.setItem(STORAGE_KEY_PROBLEM_SET_VIEW, view);
  },

  getAppSettings: <T>() : T | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_APP_SETTINGS);
      if (!stored) return null;
      return JSON.parse(stored) as T;
    } catch {
      return null;
    }
  },

  saveAppSettings: <T>(settings: T) => {
    try {
      localStorage.setItem(STORAGE_KEY_APP_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save app settings', e);
    }
  },

  getKanjiStrokeOrderPreference: (): boolean | null => {
    const stored = localStorage.getItem(STORAGE_KEY_KANJI_STROKE_ORDER);
    return stored === null ? null : stored === 'true';
  },

  saveKanjiStrokeOrderPreference: (enabled: boolean) => {
    localStorage.setItem(STORAGE_KEY_KANJI_STROKE_ORDER, enabled.toString());
  },

  getKanjiTraceGuidePreference: (): boolean | null => {
    const stored = localStorage.getItem(STORAGE_KEY_KANJI_TRACE_GUIDE);
    return stored === null ? null : stored === 'true';
  },

  saveKanjiTraceGuidePreference: (enabled: boolean) => {
    localStorage.setItem(STORAGE_KEY_KANJI_TRACE_GUIDE, enabled.toString());
  },

  // --- Play Time Management ---
  getTotalPlayTime: (): number => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_TOTAL_PLAY_TIME);
        return stored ? parseInt(stored, 10) : 0;
    } catch { return 0; }
  },

  saveTotalPlayTime: (seconds: number) => {
    localStorage.setItem(STORAGE_KEY_TOTAL_PLAY_TIME, seconds.toString());
  },

  getDailyPlayTime: (): number => {
    try {
        const today = getLocalDateString();
        const stored = localStorage.getItem(STORAGE_KEY_DAILY_PLAY_TIME);
        if (!stored) return 0;
        const data = JSON.parse(stored);
        if (data.date !== today) return 0;
        return data.seconds || 0;
    } catch { return 0; }
  },

  saveDailyPlayTime: (seconds: number) => {
    const today = getLocalDateString();
    localStorage.setItem(STORAGE_KEY_DAILY_PLAY_TIME, JSON.stringify({ date: today, seconds }));
  },

  getHintStreaks: (): Record<string, number> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HINT_STREAKS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  saveHintStreak: (mode: string, count: number) => {
    try {
      const current = storageService.getHintStreaks();
      current[mode] = count;
      localStorage.setItem(STORAGE_KEY_HINT_STREAKS, JSON.stringify(current));
    } catch (e) {
      console.warn("Failed to save hint streak", e);
    }
  },

  getModeCorrectCounts: (): Record<string, number> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MODE_CORRECT_COUNTS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  saveModeCorrectCounts: (counts: Record<string, number>) => {
    localStorage.setItem(STORAGE_KEY_MODE_CORRECT_COUNTS, JSON.stringify(counts));
    notifyOnlineRankingDataChanged('learning-progress');
  },

  getMasteredModes: (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MASTERED_MODES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveMasteredModes: (modes: string[]) => {
    localStorage.setItem(STORAGE_KEY_MASTERED_MODES, JSON.stringify(modes));
    notifyOnlineRankingDataChanged('mastery');
  },

  getTypingWeakKeys: (): Record<string, Record<string, number>> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TYPING_WEAK_KEYS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  recordTypingWeakKey: (lessonId: string, key: string) => {
    try {
      if (!lessonId || !key) return;
      const current = storageService.getTypingWeakKeys();
      const lesson = { ...(current[lessonId] || {}) };
      lesson[key] = (lesson[key] || 0) + 1;
      current[lessonId] = lesson;
      localStorage.setItem(STORAGE_KEY_TYPING_WEAK_KEYS, JSON.stringify(current));
    } catch (e) {
      console.warn("Failed to save typing weak key", e);
    }
  },

  decayTypingWeakKey: (lessonId: string, key: string, amount: number = 1) => {
    try {
      if (!lessonId || !key) return;
      const current = storageService.getTypingWeakKeys();
      const lesson = { ...(current[lessonId] || {}) };
      if (!lesson[key]) return;
      lesson[key] = Math.max(0, lesson[key] - amount);
      if (lesson[key] === 0) delete lesson[key];
      current[lessonId] = lesson;
      localStorage.setItem(STORAGE_KEY_TYPING_WEAK_KEYS, JSON.stringify(current));
    } catch (e) {
      console.warn("Failed to decay typing weak key", e);
    }
  },

  // --- Game State (Save/Load) ---
  saveGame: (state: GameState) => {
    try {
      // Coop setup / coop run data should never appear as "continue".
      // Those sessions depend on live peer connections and are not resumable from local save data.
      if (state.screen === GameScreen.COOP_SETUP || state.challengeMode === 'COOP') {
        return;
      }
      // Don't save if we are on transient screens OR mini-games
      // Title screen resume should only work for the main game
      if (!isMainAdventureResumeState(state)) {
          return;
      }
      localStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save game state", e);
    }
  },

  loadGame: (): GameState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GAME_STATE);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (!isMainAdventureResumeState(parsed)) {
        localStorage.removeItem(STORAGE_KEY_GAME_STATE);
        return null;
      }
      return normalizeBurnGameState(parsed);
    } catch (e) {
      console.warn("Failed to load game state", e);
      return null;
    }
  },

  hasSaveFile: (): boolean => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_GAME_STATE);
        if (!stored) return false;
        const parsed = JSON.parse(stored);
        if (!isMainAdventureResumeState(parsed)) {
          localStorage.removeItem(STORAGE_KEY_GAME_STATE);
          return false;
        }
        return true;
      } catch (e) {
        console.warn("Failed to inspect game save", e);
        return false;
      }
  },

  clearSave: () => {
      localStorage.removeItem(STORAGE_KEY_GAME_STATE);
  },

  // --- Legacy Card (Inheritance) ---
  saveLegacyCard: (card: Card, scope: 'NORMAL' | 'COOP' = 'NORMAL') => {
      try {
          localStorage.setItem(scope === 'COOP' ? STORAGE_KEY_COOP_LEGACY_CARD : STORAGE_KEY_LEGACY_CARD, JSON.stringify(card));
      } catch (e) {
          console.warn("Failed to save legacy card", e);
      }
  },

  getLegacyCard: (scope: 'NORMAL' | 'COOP' = 'NORMAL'): Card | null => {
      try {
          const stored = localStorage.getItem(scope === 'COOP' ? STORAGE_KEY_COOP_LEGACY_CARD : STORAGE_KEY_LEGACY_CARD);
          return stored ? JSON.parse(stored) : null;
      } catch (e) {
          return null;
      }
  },

  clearLegacyCard: (scope: 'NORMAL' | 'COOP' = 'NORMAL') => {
      localStorage.removeItem(scope === 'COOP' ? STORAGE_KEY_COOP_LEGACY_CARD : STORAGE_KEY_LEGACY_CARD);
  },

  // --- Debug Settings ---
  saveDebugMathSkip: (enabled: boolean) => {
      if (!DEBUG_FEATURES_ENABLED) {
          localStorage.removeItem(STORAGE_KEY_DEBUG_MATH_SKIP);
          return;
      }
      localStorage.setItem(STORAGE_KEY_DEBUG_MATH_SKIP, JSON.stringify(enabled));
  },

  getDebugMathSkip: (): boolean => {
      if (!DEBUG_FEATURES_ENABLED) return false;
      try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY_DEBUG_MATH_SKIP) || 'false');
      } catch { return false; }
  },

  saveDebugHpOne: (enabled: boolean) => {
      if (!DEBUG_FEATURES_ENABLED) {
          localStorage.removeItem(STORAGE_KEY_DEBUG_HP_ONE);
          return;
      }
      localStorage.setItem(STORAGE_KEY_DEBUG_HP_ONE, JSON.stringify(enabled));
  },

  getDebugHpOne: (): boolean => {
      if (!DEBUG_FEATURES_ENABLED) return false;
      try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY_DEBUG_HP_ONE) || 'false');
      } catch { return false; }
  },

  saveDebugMiniGameUnlock: (enabled: boolean) => {
      if (!DEBUG_FEATURES_ENABLED) {
          localStorage.removeItem(STORAGE_KEY_DEBUG_MINI_GAME_UNLOCK);
          return;
      }
      localStorage.setItem(STORAGE_KEY_DEBUG_MINI_GAME_UNLOCK, JSON.stringify(enabled));
  },

  getDebugMiniGameUnlock: (): boolean => {
      if (!DEBUG_FEATURES_ENABLED) return false;
      try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY_DEBUG_MINI_GAME_UNLOCK) || 'false');
      } catch { return false; }
  },

  clearDebugSettings: () => {
      localStorage.removeItem(STORAGE_KEY_DEBUG_MATH_SKIP);
      localStorage.removeItem(STORAGE_KEY_DEBUG_HP_ONE);
      localStorage.removeItem(STORAGE_KEY_DEBUG_MINI_GAME_UNLOCK);
  },

  saveUiPreviewChecklist: (checklist: UiPreviewChecklist) => {
      localStorage.setItem(STORAGE_KEY_UI_PREVIEW_CHECKLIST, JSON.stringify(checklist));
  },

  getUiPreviewChecklist: (): UiPreviewChecklist => {
      try {
          const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY_UI_PREVIEW_CHECKLIST) || '{}');
          return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      } catch {
          return {};
      }
  },

  exportTransferData: (): StorageTransferPayload => {
      const entries = collectTransferEntries();
      return {
          version: 1,
          appName: '学習ローグ',
          exportedAt: new Date().toISOString(),
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          entries
      };
  },

  importTransferData: (payload: string | StorageTransferPayload | unknown) => {
      const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
      const entries = normalizeTransferEntries(parsed);

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(STORAGE_TRANSFER_PREFIX)) {
              keysToRemove.push(key);
          }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      Object.entries(entries).forEach(([key, value]) => localStorage.setItem(key, value));

      return { importedKeys: Object.keys(entries).length };
  },

  resetProgress: () => {
      localStorage.removeItem(STORAGE_KEY_UNLOCKED_CARDS);
      localStorage.removeItem(STORAGE_KEY_UNLOCKED_RELICS);
      localStorage.removeItem(STORAGE_KEY_UNLOCKED_POTIONS);
      localStorage.removeItem(STORAGE_KEY_DEFEATED_ENEMIES);
      localStorage.removeItem(STORAGE_KEY_MAGIC_ENDING_GALLERY);
      localStorage.removeItem(STORAGE_KEY_THEMED_ENDING_GALLERY);
      localStorage.removeItem(STORAGE_KEY_GAME_STATE);
      localStorage.removeItem(STORAGE_KEY_CLEAR_COUNT);
      localStorage.removeItem(STORAGE_KEY_THEME_CLEAR_COUNTS);
      localStorage.removeItem(STORAGE_KEY_RANKING);
      localStorage.removeItem(STORAGE_KEY_POKER_RANKING);
      localStorage.removeItem(STORAGE_KEY_POKER_STATE);
      localStorage.removeItem(STORAGE_KEY_SURVIVOR_RANKING);
      localStorage.removeItem(STORAGE_KEY_DUNGEON_RANKING);
      localStorage.removeItem(STORAGE_KEY_DUNGEON_STATE);
      localStorage.removeItem(STORAGE_KEY_DUNGEON_RANKING_2);
      localStorage.removeItem(STORAGE_KEY_DUNGEON_STATE_2);
      localStorage.removeItem(STORAGE_KEY_KOCHO_STATE);
      localStorage.removeItem(STORAGE_KEY_KOCHO_RANKING);
      localStorage.removeItem(STORAGE_KEY_KOCHO_UNLOCKED_CARDS);
      localStorage.removeItem(STORAGE_KEY_KOCHO_MAX_UNLOCKED_DIFFICULTY);
      localStorage.removeItem(STORAGE_KEY_PAPER_PLANE_STATE);
      localStorage.removeItem(STORAGE_KEY_PAPER_PLANE_PROGRESS);
      localStorage.removeItem(STORAGE_KEY_PAPER_PLANE_RANKING);
      localStorage.removeItem(STORAGE_KEY_GO_HOME_RANKING);
      // NOTE: STORAGE_KEY_LEGACY_CARD はリセット対象から除外（ユーザー要望）
      localStorage.removeItem(STORAGE_KEY_DEBUG_MATH_SKIP);
      localStorage.removeItem(STORAGE_KEY_DEBUG_HP_ONE);
      localStorage.removeItem(STORAGE_KEY_DEBUG_MINI_GAME_UNLOCK);
      localStorage.removeItem(STORAGE_KEY_UI_PREVIEW_CHECKLIST);
      localStorage.removeItem(STORAGE_KEY_MATH_CORRECT_COUNT);
      localStorage.removeItem(STORAGE_KEY_SEEN_BATTLE_TUTORIAL);
      localStorage.removeItem(STORAGE_KEY_SEEN_PARRY_TUTORIAL);
      localStorage.removeItem(STORAGE_KEY_SEEN_EXHAUST_CARD_HINT);
      localStorage.removeItem(STORAGE_KEY_SEEN_RETAIN_CARD_HINT);
      localStorage.removeItem(STORAGE_KEY_CHALLENGE_RECORDS);
      localStorage.removeItem(STORAGE_KEY_MAX_UNLOCKED_DIFFICULTY);
      localStorage.removeItem(STORAGE_KEY_FIRST_STARTER_RELIC_SKIPPED);
      localStorage.removeItem(STORAGE_KEY_ENGLISH_VOICE);
      localStorage.removeItem(STORAGE_KEY_BGM_MODE);
      localStorage.removeItem(STORAGE_KEY_SEEN_BGM_SWITCH_HINT);
      localStorage.removeItem(STORAGE_KEY_LANGUAGE_MODE);
      localStorage.removeItem(STORAGE_KEY_PROBLEM_SET_VIEW);
      localStorage.removeItem(STORAGE_KEY_APP_SETTINGS);
      localStorage.removeItem(STORAGE_KEY_TOTAL_PLAY_TIME);
      localStorage.removeItem(STORAGE_KEY_DAILY_PLAY_TIME);
      localStorage.removeItem(STORAGE_KEY_MODE_CORRECT_COUNTS);
      localStorage.removeItem(STORAGE_KEY_MASTERED_MODES);
      localStorage.removeItem(STORAGE_KEY_CUSTOM_IMAGES);
      localStorage.removeItem(STORAGE_KEY_HINT_STREAKS);
      localStorage.removeItem(STORAGE_KEY_HIGHEST_CARD_DAMAGE);
  },

  clearAllLocalData: () => {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
              key.startsWith('pixel_spire_')
              || key.startsWith('learning_rogue_')
              || key.startsWith('learning-rogue-')
          )) {
              keysToRemove.push(key);
          }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
  }
};
