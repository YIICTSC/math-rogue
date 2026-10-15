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
    GameScreen.RPG_ONLINE,
    GameScreen.GAKURO_KART,
    GameScreen.GAKURO_GOLF,
    GameScreen.MINI_GAME_GAKUROGEAR,
    GameScreen.GAKURO_CRAFT,
    GameScreen.TYPING_MODE_SELECTION,
    'FUTURE_ONLINE_MODE',
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
    localStorage.setItem(saveKey, JSON.stringify({ screen, player: {}, map: [] }));
    assert.equal(storageService.loadGame(),null,`${screen} must not load through Continue`);
  }

  storageService.saveGame({ screen: GameScreen.MAP, player: { currentHp: 10 }, map: [], rewards: [], narrativeLog: [], combatLog: [] });
  assert.equal(storageService.hasSaveFile(), true, 'a main-adventure map state should still enable Continue');
  const mainSave = localStorage.getItem(saveKey);
  storageService.saveGame({ screen: GameScreen.RPG_ONLINE, player: {}, map: [] });
  assert.equal(localStorage.getItem(saveKey), mainSave, 'RPG Online must preserve the existing main adventure');
  for (const screen of [GameScreen.MAP, GameScreen.BATTLE, GameScreen.REST, GameScreen.REWARD]) {
    storageService.saveGame({ screen, rpgOnline: true, player: {}, map: [] });
    assert.equal(localStorage.getItem(saveKey), mainSave, `RPG native ${screen} must preserve the main adventure`);
  }

  for(const screen of miniGames){storageService.saveGame({screen,player:{},map:[]});assert.equal(localStorage.getItem(saveKey),mainSave,`${screen} must not overwrite a main adventure`);assert.equal(storageService.loadGame().screen,GameScreen.MAP);}
  for(const mode of ['COOP','RACE']){localStorage.setItem(saveKey,JSON.stringify({screen:GameScreen.MAP,challengeMode:mode,player:{},map:[]}));assert.equal(storageService.loadGame(),null,`${mode} legacy online session is not a main continuation`);}
  for(const screen of [GameScreen.MODE_SELECTION,GameScreen.RELIC_SELECTION,GameScreen.DECK_CONSTRUCTION,GameScreen.MAP,GameScreen.BATTLE,GameScreen.MATH_CHALLENGE,GameScreen.KANJI_CHALLENGE,GameScreen.ENGLISH_CHALLENGE,GameScreen.GENERAL_CHALLENGE,GameScreen.REWARD,GameScreen.REST,GameScreen.SHOP,GameScreen.EVENT,GameScreen.TREASURE,GameScreen.GARDEN,GameScreen.FLOOR_RESULT,GameScreen.ENDLESS_OPENING,GameScreen.ENDLESS_TRUE_ENDING,GameScreen.ENDLESS_CLEAR]){storageService.saveGame({screen,player:{currentHp:10},map:[],rewards:[],narrativeLog:[],combatLog:[]});assert.equal(storageService.loadGame().screen,screen,`${screen} main progression remains resumable`);}
  console.log('PASS: all four online modes and legacy/future mini-game saves excluded; existing main save preserved; main progression remains resumable.');
} finally {
  await server.close();
}
