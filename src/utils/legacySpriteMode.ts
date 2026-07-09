const LEGACY_SPRITE_MODE_KEY = 'learning-rogue-legacy-sprite-mode';

const getSessionStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
};

export const isLegacySpriteModeEnabled = () => (
  getSessionStorage()?.getItem(LEGACY_SPRITE_MODE_KEY) === 'true'
);

export const setLegacySpriteModeEnabled = (enabled: boolean) => {
  const storage = getSessionStorage();
  if (!storage) return;
  if (enabled) {
    storage.setItem(LEGACY_SPRITE_MODE_KEY, 'true');
    return;
  }
  storage.removeItem(LEGACY_SPRITE_MODE_KEY);
};
