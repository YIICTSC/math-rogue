import type { LanguageMode } from '../types';
import { trans } from './textUtils';

const JAPANESE_BATTLE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/画鋲投げ/g, 'クリップ渡し'],
  [/カンチョー/g, '指さし確認'],
  [/袋叩き/g, '連続発表'],
  [/ヘッドロック/g, 'チームミーティング'],
  [/割れた窓ガラス/g, 'ステンドグラス'],
];

const HIRAGANA_BATTLE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/がびょうなげ/g, 'クリップわたし'],
  [/かんちょー/g, 'ゆびさしかくにん'],
  [/ふくろだたき/g, 'れんぞくはっぴょう'],
  [/へっどろっく/g, 'チームミーティング'],
  [/われたまどガラス/g, 'ステンドグラス'],
];

const ENGLISH_BATTLE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/(?:Sucker Punch|Surprise Poke)/gi, 'Pointing Check'],
  [/(?:Carnage|Group Pummeling)/gi, 'Rapid-Fire Presentation'],
  [/(?:Choke|Headlock)/gi, 'Team Meeting'],
  [/Thumbtack Throw/gi, 'Clip Pass'],
  [/(?:Broken Window Glass|割れた窓ガラス)/gi, 'Stained Glass'],
];

const applyReplacements = (text: string, replacements: Array<[RegExp, string]>) =>
  replacements.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);

export const toAge9BattleText = (text: string, languageMode: string): string => {
  if (!text) return text;
  if (languageMode === 'ENGLISH') return applyReplacements(text, ENGLISH_BATTLE_REPLACEMENTS);
  if (languageMode === 'HIRAGANA') return applyReplacements(text, HIRAGANA_BATTLE_REPLACEMENTS);
  return applyReplacements(text, JAPANESE_BATTLE_REPLACEMENTS);
};

export const transBattle = (text: string, languageMode: string): string => {
  const safeSourceText = applyReplacements(text, JAPANESE_BATTLE_REPLACEMENTS);
  return toAge9BattleText(trans(safeSourceText, languageMode as LanguageMode), languageMode);
};
