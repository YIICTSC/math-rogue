
import { GameState, GameScreen, RankingEntry, Card, PokerScoreEntry, SurvivorScoreEntry, DungeonScoreEntry, PokerRunState, KochoScoreEntry, PaperPlaneScoreEntry, VSRecord } from '../types';

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

// For School Dungeon 2
const STORAGE_KEY_DUNGEON_STATE_2 = 'pixel_spire_dungeon_state_2_v1';
const STORAGE_KEY_DUNGEING_2 = 'pixel_spire_dungeon_ranking_2_v1';
const STORAGE_KEY_DUNGEON_RANKING_2 = 'pixel_spire_dungeon_ranking_2_v1';

// For Kocho Showdown
const STORAGE_KEY_KOCHO_STATE = 'pixel_spire_kocho_state_v1';
const STORAGE_KEY_KOCHO_RANKING = 'pixel_spire_kocho_ranking_v1';

// For Paper Plane Battle
const STORAGE_KEY_PAPER_PLANE_STATE = 'pixel_spire_paper_plane_state_v1';
const STORAGE_KEY_PAPER_PLANE_PROGRESS = 'pixel_spire_paper_plane_progress_v1';
const STORAGE_KEY_PAPER_PLANE_RANKING = 'pixel_spire_paper_plane_ranking_v1';

// --- BATTLE TUTORIAL FLAG ---
const STORAGE_KEY_SEEN_BATTLE_TUTORIAL = 'pixel_spire_seen_battle_tutorial_v1';

// --- ENGLISH VOICE FLAG ---
const STORAGE_KEY_ENGLISH_VOICE = 'pixel_spire_english_voice_v1';

// --- BGM MODE FLAG ---
const STORAGE_KEY_BGM_MODE = 'pixel_spire_bgm_mode_v1';

// --- PLAY TIME ---
const STORAGE_KEY_TOTAL_PLAY_TIME = 'pixel_spire_total_play_time_v1';
const STORAGE_KEY_DAILY_PLAY_TIME = 'pixel_spire_daily_play_time_v1';

export interface PaperPlaneProgress {
    rank: number; // Association Level (Clear Count equivalent)
    rerollCount: number; // Consumable rerolls
    maxClearedLevel: Record<string, number>; // Map of Ship ID -> Max Ascension Level cleared
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

export const storageService = {
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

  savePokerState: (state: PokerRunState) => {
      try {
          localStorage.setItem(STORAGE_KEY_POKER_STATE, JSON.stringify(state));
      } catch (e) { console.warn(prev => prev); }
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
      } catch (e) { console.warn(prev => prev); }
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
      } catch (e) { console.warn(prev => prev); }
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
      } catch (e) { console.warn(prev => prev); }
  },

  loadPaperPlaneProgress: (): PaperPlaneProgress => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_PAPER_PLANE_PROGRESS);
          if (stored) return JSON.parse(stored);
      } catch (e) { /* ignore */ }
      return { rank: 1, rerollCount: 3, maxClearedLevel: {} };
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

  // --- Game State (Save/Load) ---
  saveGame: (state: GameState) => {
    try {
      // Don't save if we are on transient screens OR mini-games
      // Title screen resume should only work for the main game
      const transientOrMini = [
          GameScreen.START_MENU, GameScreen.GAME_OVER, GameScreen.ENDING,
          GameScreen.VICTORY, GameScreen.COMPENDIUM, GameScreen.HELP,
          GameScreen.CHARACTER_SELECTION, GameScreen.RANKING, GameScreen.PROBLEM_CHALLENGE,
          GameScreen.MINI_GAME_SELECT, GameScreen.MINI_GAME_POKER, GameScreen.MINI_GAME_SURVIVOR,
          GameScreen.MINI_GAME_DUNGEON, GameScreen.MINI_GAME_DUNGEON_2, GameScreen.MINI_GAME_KOCHO,
          GameScreen.MINI_GAME_PAPER_PLANE
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
      return stored ? JSON.parse(stored) : null;
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
      localStorage.removeItem(STORAGE_KEY_PAPER_PLANE_STATE);
      localStorage.removeItem(STORAGE_KEY_PAPER_PLANE_PROGRESS);
      localStorage.removeItem(STORAGE_KEY_PAPER_PLANE_RANKING);
      localStorage.removeItem(STORAGE_KEY_LEGACY_CARD);
      localStorage.removeItem(STORAGE_KEY_DEBUG_MATH_SKIP);
      localStorage.removeItem(STORAGE_KEY_DEBUG_HP_ONE);
      localStorage.removeItem(STORAGE_KEY_MATH_CORRECT_COUNT);
      localStorage.removeItem(STORAGE_KEY_SEEN_BATTLE_TUTORIAL);
      localStorage.removeItem(STORAGE_KEY_CHALLENGE_RECORDS);
      localStorage.removeItem(STORAGE_KEY_ENGLISH_VOICE);
      localStorage.removeItem(STORAGE_KEY_BGM_MODE);
      localStorage.removeItem(STORAGE_KEY_TOTAL_PLAY_TIME);
      localStorage.removeItem(STORAGE_KEY_DAILY_PLAY_TIME);
  }
};
