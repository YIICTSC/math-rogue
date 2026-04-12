
import { GameState, GameScreen, RankingEntry, Card, PokerScoreEntry, SurvivorScoreEntry, DungeonScoreEntry, PokerRunState, KochoScoreEntry, PaperPlaneScoreEntry, VSRecord, LanguageMode, GoHomeScoreEntry } from '../types';

const STORAGE_KEY_UNLOCKED_CARDS = 'pixel_spire_unlocked_cards_v1';
const STORAGE_KEY_UNLOCKED_RELICS = 'pixel_spire_unlocked_relics_v1';
const STORAGE_KEY_UNLOCKED_POTIONS = 'pixel_spire_unlocked_potions_v1';
const STORAGE_KEY_DEFEATED_ENEMIES = 'pixel_spire_defeated_enemies_v1';

const STORAGE_KEY_GAME_STATE = 'pixel_spire_save_state_v1';
const STORAGE_KEY_CLEAR_COUNT = 'pixel_spire_clear_count_v1';
const STORAGE_KEY_RANKING = 'pixel_spire_ranking_v1';
const STORAGE_KEY_POKER_RANKING = 'pixel_spire_poker_ranking_v1';
const STORAGE_KEY_SURVIVOR_RANKING = 'pixel_spire_survivor_ranking_v1';
const STORAGE_KEY_DUNGEON_RANKING = 'pixel_spire_dungeon_ranking_v1';
const STORAGE_KEY_VS_RANKING = 'pixel_spire_vs_ranking_v1';
const STORAGE_KEY_LEGACY_CARD = 'pixel_spire_legacy_card_v1';
const STORAGE_KEY_DEBUG_MATH_SKIP = 'pixel_spire_debug_math_skip_v1';
const STORAGE_KEY_DEBUG_HP_ONE = 'pixel_spire_debug_hp_one_v1';
const STORAGE_KEY_MATH_CORRECT_COUNT = 'pixel_spire_math_correct_count_v1';
const STORAGE_KEY_CHALLENGE_RECORDS = 'pixel_spire_challenge_records_v1';

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

// For Paper Plane Battle
const STORAGE_KEY_PAPER_PLANE_STATE = 'pixel_spire_paper_plane_state_v1';
const STORAGE_KEY_PAPER_PLANE_PROGRESS = 'pixel_spire_paper_plane_progress_v1';
const STORAGE_KEY_PAPER_PLANE_RANKING = 'pixel_spire_paper_plane_ranking_v1';

// For Go Home Dash
const STORAGE_KEY_GO_HOME_RANKING = 'pixel_spire_go_home_ranking_v1';

// --- BATTLE TUTORIAL FLAG ---
const STORAGE_KEY_SEEN_BATTLE_TUTORIAL = 'pixel_spire_seen_battle_tutorial_v1';

// --- ENGLISH VOICE FLAG ---
const STORAGE_KEY_ENGLISH_VOICE = 'pixel_spire_english_voice_v1';

// --- BGM MODE FLAG ---
const STORAGE_KEY_BGM_MODE = 'pixel_spire_bgm_mode_v1';

// --- LANGUAGE MODE FLAG ---
const STORAGE_KEY_LANGUAGE_MODE = 'pixel_spire_language_mode_v1';

// --- PLAY TIME ---
const STORAGE_KEY_TOTAL_PLAY_TIME = 'pixel_spire_total_play_time_v1';
const STORAGE_KEY_DAILY_PLAY_TIME = 'pixel_spire_daily_play_time_v1';
const STORAGE_KEY_MODE_CORRECT_COUNTS = 'pixel_spire_mode_correct_counts_v1';
const STORAGE_KEY_MASTERED_MODES = 'pixel_spire_mastered_modes_v1';
const STORAGE_KEY_TYPING_WEAK_KEYS = 'pixel_spire_typing_weak_keys_v1';
const STORAGE_KEY_HINT_STREAKS = 'pixel_spire_hint_streaks_v1';

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
  vsOpponent: state.vsOpponent ? normalizeBurnPlayer(state.vsOpponent) : state.vsOpponent,
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
      } catch (e) {
          console.warn("Failed to save clear count", e);
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

  // --- Adventure Log / Scores ---
  saveScore: (entry: RankingEntry) => {
      try {
          const current = storageService.getLocalScores();
          // Increase limit to 50 for a better log experience
          const updated = [entry, ...current].slice(0, 50); 
          localStorage.setItem(STORAGE_KEY_RANKING, JSON.stringify(updated));
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

  // --- VS Battle Records ---
  saveVSRecord: (record: VSRecord) => {
      try {
          const current = storageService.getVSRecords();
          const updated = [record, ...current].slice(0, 50);
          localStorage.setItem(STORAGE_KEY_VS_RANKING, JSON.stringify(updated));
      } catch (e) {
          console.warn("Failed to save VS record", e);
      }
  },

  getVSRecords: (): VSRecord[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_VS_RANKING);
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

  // --- Paper Plane Battle State & Progress & Scores ---
  savePaperPlaneScore: (entry: PaperPlaneScoreEntry) => {
      try {
          const current = storageService.getPaperPlaneScores();
          const updated = [entry, ...current].slice(0, 50);
          localStorage.setItem(STORAGE_KEY_PAPER_PLANE_RANKING, JSON.stringify(updated));
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

  // --- Language Mode ---
  getLanguageMode: (): LanguageMode | null => {
    return localStorage.getItem(STORAGE_KEY_LANGUAGE_MODE) as LanguageMode | null;
  },

  saveLanguageMode: (mode: LanguageMode) => {
    localStorage.setItem(STORAGE_KEY_LANGUAGE_MODE, mode);
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
      const transientOrMini = [
          GameScreen.START_MENU, GameScreen.GAME_OVER, GameScreen.ENDING,
          GameScreen.VICTORY, GameScreen.COMPENDIUM, GameScreen.HELP,
          GameScreen.CHARACTER_SELECTION, GameScreen.RANKING, GameScreen.PROBLEM_CHALLENGE,
          GameScreen.MINI_GAME_SELECT, GameScreen.MINI_GAME_POKER, GameScreen.MINI_GAME_SURVIVOR,
          GameScreen.MINI_GAME_DUNGEON, GameScreen.MINI_GAME_DUNGEON_2, GameScreen.MINI_GAME_KOCHO,
          GameScreen.MINI_GAME_PAPER_PLANE, GameScreen.MINI_GAME_GO_HOME
      ];
      if (transientOrMini.includes(state.screen)) { 
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
      return normalizeBurnGameState(JSON.parse(stored));
    } catch (e) {
      console.warn("Failed to load game state", e);
      return null;
    }
  },

  hasSaveFile: (): boolean => {
      return !!localStorage.getItem(STORAGE_KEY_GAME_STATE);
  },

  clearSave: () => {
      localStorage.removeItem(STORAGE_KEY_GAME_STATE);
  },

  // --- Legacy Card (Inheritance) ---
  saveLegacyCard: (card: Card) => {
      try {
          localStorage.setItem(STORAGE_KEY_LEGACY_CARD, JSON.stringify(card));
      } catch (e) {
          console.warn("Failed to save legacy card", e);
      }
  },

  getLegacyCard: (): Card | null => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_LEGACY_CARD);
          return stored ? JSON.parse(stored) : null;
      } catch (e) {
          return null;
      }
  },

  clearLegacyCard: () => {
      localStorage.removeItem(STORAGE_KEY_LEGACY_CARD);
  },

  // --- Debug Settings ---
  saveDebugMathSkip: (enabled: boolean) => {
      localStorage.setItem(STORAGE_KEY_DEBUG_MATH_SKIP, JSON.stringify(enabled));
  },

  getDebugMathSkip: (): boolean => {
      try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY_DEBUG_MATH_SKIP) || 'false');
      } catch { return false; }
  },

  saveDebugHpOne: (enabled: boolean) => {
      localStorage.setItem(STORAGE_KEY_DEBUG_HP_ONE, JSON.stringify(enabled));
  },

  getDebugHpOne: (): boolean => {
      try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY_DEBUG_HP_ONE) || 'false');
      } catch { return false; }
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

  importTransferData: (payload: string | StorageTransferPayload) => {
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
      localStorage.removeItem(STORAGE_KEY_GAME_STATE);
      localStorage.removeItem(STORAGE_KEY_CLEAR_COUNT);
      localStorage.removeItem(STORAGE_KEY_RANKING);
      localStorage.removeItem(STORAGE_KEY_POKER_RANKING);
      localStorage.removeItem(STORAGE_KEY_POKER_STATE);
      localStorage.removeItem(STORAGE_KEY_SURVIVOR_RANKING);
      localStorage.removeItem(STORAGE_KEY_DUNGEON_RANKING);
      localStorage.removeItem(STORAGE_KEY_DUNGEON_STATE);
      localStorage.removeItem(STORAGE_KEY_DUNGEON_RANKING_2);
      localStorage.removeItem(STORAGE_KEY_DUNGEON_STATE_2);
      localStorage.removeItem(STORAGE_KEY_VS_RANKING);
      localStorage.removeItem(STORAGE_KEY_KOCHO_STATE);
      localStorage.removeItem(STORAGE_KEY_KOCHO_RANKING);
      localStorage.removeItem(STORAGE_KEY_KOCHO_UNLOCKED_CARDS);
      localStorage.removeItem(STORAGE_KEY_PAPER_PLANE_STATE);
      localStorage.removeItem(STORAGE_KEY_PAPER_PLANE_PROGRESS);
      localStorage.removeItem(STORAGE_KEY_PAPER_PLANE_RANKING);
      localStorage.removeItem(STORAGE_KEY_GO_HOME_RANKING);
      // NOTE: STORAGE_KEY_LEGACY_CARD はリセット対象から除外（ユーザー要望）
      localStorage.removeItem(STORAGE_KEY_DEBUG_MATH_SKIP);
      localStorage.removeItem(STORAGE_KEY_DEBUG_HP_ONE);
      localStorage.removeItem(STORAGE_KEY_MATH_CORRECT_COUNT);
      localStorage.removeItem(STORAGE_KEY_SEEN_BATTLE_TUTORIAL);
      localStorage.removeItem(STORAGE_KEY_CHALLENGE_RECORDS);
      localStorage.removeItem(STORAGE_KEY_ENGLISH_VOICE);
      localStorage.removeItem(STORAGE_KEY_BGM_MODE);
      localStorage.removeItem(STORAGE_KEY_LANGUAGE_MODE);
      localStorage.removeItem(STORAGE_KEY_TOTAL_PLAY_TIME);
      localStorage.removeItem(STORAGE_KEY_DAILY_PLAY_TIME);
      localStorage.removeItem(STORAGE_KEY_MODE_CORRECT_COUNTS);
      localStorage.removeItem(STORAGE_KEY_MASTERED_MODES);
      localStorage.removeItem(STORAGE_KEY_CUSTOM_IMAGES);
      localStorage.removeItem(STORAGE_KEY_HINT_STREAKS);
  }
};
