
import { GameState, GameScreen, RankingEntry } from '../types';

const STORAGE_KEY_UNLOCKED_CARDS = 'pixel_spire_unlocked_cards_v1';
const STORAGE_KEY_GAME_STATE = 'pixel_spire_save_state_v1';
const STORAGE_KEY_CLEAR_COUNT = 'pixel_spire_clear_count_v1';
const STORAGE_KEY_RANKING = 'pixel_spire_ranking_v1';

export const storageService = {
  // --- Unlocked Cards ---
  getUnlockedCards: (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_UNLOCKED_CARDS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("Failed to load unlocked cards", e);
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

  // --- Game State (Save/Load) ---
  saveGame: (state: GameState) => {
    try {
      // Don't save if we are on transient screens
      if (state.screen === GameScreen.START_MENU || 
          state.screen === GameScreen.GAME_OVER || 
          state.screen === GameScreen.ENDING ||
          state.screen === GameScreen.VICTORY ||
          state.screen === GameScreen.COMPENDIUM || 
          state.screen === GameScreen.HELP ||
          state.screen === GameScreen.CHARACTER_SELECTION ||
          state.screen === GameScreen.RANKING
      ) { 
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

  resetProgress: () => {
      localStorage.removeItem(STORAGE_KEY_UNLOCKED_CARDS);
      localStorage.removeItem(STORAGE_KEY_GAME_STATE);
      localStorage.removeItem(STORAGE_KEY_CLEAR_COUNT);
      localStorage.removeItem(STORAGE_KEY_RANKING);
  }
};
