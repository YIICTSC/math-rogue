import assert from 'node:assert/strict';
import { createServer } from 'vite';

const values = new Map();
globalThis.localStorage = {
  get length() { return values.size; },
  key(index) { return [...values.keys()][index] ?? null; },
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); },
  clear() { values.clear(); },
};

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

try {
  const { storageService } = await server.ssrLoadModule('/src/services/storageService.ts');
  const { GameScreen } = await server.ssrLoadModule('/src/types.ts');
  const saveKey = 'pixel_spire_save_state_v1';
  const miniGames = [
    GameScreen.MINI_GAME_STONE_GLOW,
    GameScreen.MINI_GAME_SCHOOL_TRPG,
    GameScreen.MINI_GAME_LEARNING_TCG,
    GameScreen.MINI_GAME_SHOGI,
    GameScreen.MINI_GAME_GO,
    GameScreen.MINI_GAME_CHESS,
    GameScreen.MINI_GAME_MAHJONG,
    GameScreen.MINI_GAME_CRANE,
  ];

  for (const screen of miniGames) {
    storageService.clearSave();
    storageService.saveGame({ screen, player: {}, map: [] });
    assert.equal(localStorage.getItem(saveKey), null, `${screen} must not create the main Continue save`);

    localStorage.setItem(saveKey, JSON.stringify({ screen, player: {}, map: [] }));
    assert.equal(storageService.hasSaveFile(), false, `${screen} must not enable Continue when found in a legacy save`);
    assert.equal(localStorage.getItem(saveKey), null, `${screen} legacy save should be removed`);
  }

  storageService.saveGame({ screen: GameScreen.MAP, player: { currentHp: 10 }, map: [] });
  assert.equal(storageService.hasSaveFile(), true, 'a main-adventure map state should still enable Continue');

  console.log('Title Continue isolation passed for all added mini-games, including the crane game.');
} finally {
  await server.close();
}
