
const STORAGE_KEY_UNLOCKED_CARDS = 'pixel_spire_unlocked_cards_v1';

export const storageService = {
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

  resetProgress: () => {
      localStorage.removeItem(STORAGE_KEY_UNLOCKED_CARDS);
  }
};
