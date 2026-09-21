import type { CharacterAppearanceMode, LanguageMode } from '../types';
import type { VisualThemeId } from './visualThemes';

export type VacationNarrativeTheme = 'high-school' | 'magic';

const localize = (
  languageMode: LanguageMode,
  japanese: string,
  hiragana: string,
  english: string,
): string => {
  if (languageMode === 'ENGLISH') return english;
  if (languageMode === 'HIRAGANA') return hiragana;
  return japanese;
};

export const isNormalVacationRun = (
  visualTheme: VisualThemeId | undefined,
  appearanceMode: CharacterAppearanceMode | undefined,
  isEndless = false,
): visualTheme is VacationNarrativeTheme => (
  !isEndless
  && appearanceMode === 'VACATION'
  && (visualTheme === 'high-school' || visualTheme === 'magic')
);

export const getVacationAdventureStartLog = (
  theme: VacationNarrativeTheme,
  languageMode: LanguageMode,
): string => theme === 'magic'
  ? localize(
      languageMode,
      '星海のバカンスと臨海研修が始まった。',
      'せいかいの ばかんすと りんかいけんしゅうが はじまった。',
      'The seaside magic vacation and coastal training have begun.',
    )
  : localize(
      languageMode,
      '夏休みの特別な旅が始まった。',
      'なつやすみの とくべつな たびが はじまった。',
      'A special summer vacation journey has begun.',
    );

export const getVacationActAdvanceLog = (
  theme: VacationNarrativeTheme,
  nextAct: number,
  languageMode: LanguageMode,
): string => theme === 'magic'
  ? localize(
      languageMode,
      `星海の旅は次の目的地へ。第${nextAct}章へ進んだ。体力が全回復した！`,
      `せいかいの たびは つぎの もくてきちへ。だい${nextAct}しょうへ すすんだ。たいりょくが ぜんかいふくした！`,
      `The star-sea journey moves to its next destination. Act ${nextAct} begins. HP fully restored!`,
    )
  : localize(
      languageMode,
      `海辺の旅は次の目的地へ。第${nextAct}章へ進んだ。体力が全回復した！`,
      `うみべの たびは つぎの もくてきちへ。だい${nextAct}しょうへ すすんだ。たいりょくが ぜんかいふくした！`,
      `The seaside trip moves to its next destination. Act ${nextAct} begins. HP fully restored!`,
    );

export const getVacationGameOverTitle = (
  theme: VacationNarrativeTheme,
  languageMode: LanguageMode,
): string => theme === 'magic'
  ? localize(languageMode, '星海の旅はここで途切れた…', 'せいかいの たびは ここで とぎれた…', 'The star-sea journey ends here...')
  : localize(languageMode, '夏の旅はここで途切れた…', 'なつの たびは ここで とぎれた…', 'The summer journey ends here...');

export const getVacationLegacyCarryTitle = (languageMode: LanguageMode): string => localize(
  languageMode,
  '旅の記憶は受け継がれた…',
  'たびの きおくは うけつがれた…',
  'The memory of the journey lives on...',
);

export const getVacationLegacyCarryBody = (
  theme: VacationNarrativeTheme,
  languageMode: LanguageMode,
): string => theme === 'magic'
  ? localize(languageMode, '星砂の記憶は次の挑戦へ託された。', 'ほしすなの きおくは つぎの ちょうせんへ たくされた。', 'The memory of the star sand is entrusted to the next challenge.')
  : localize(languageMode, '夏の思い出は次の挑戦へ託された。', 'なつの おもいでは つぎの ちょうせんへ たくされた。', 'The summer memory is entrusted to the next challenge.');

export const getVacationEndingTitle = (
  theme: VacationNarrativeTheme,
  languageMode: LanguageMode,
): string => theme === 'magic'
  ? localize(languageMode, '星海の夜明け', 'せいかいの よあけ', 'Dawn over the Starry Sea')
  : localize(languageMode, '夏休みの旅、おつかれさま！', 'なつやすみの たび、おつかれさま！', 'Summer Journey Complete!');

export const getVacationEndingMessage = (
  theme: VacationNarrativeTheme,
  languageMode: LanguageMode,
): string => theme === 'magic'
  ? localize(
      languageMode,
      '星界化した海の異常を収め、臨海研修の最終日に朝の光を取り戻しました。\n学び、迷い、誰かを大切にした夏の記憶は、日常へ帰ってもあなたの魔法を支えます。\n海に残る星砂を胸に、それぞれの明日へ帰りましょう。',
      'せいかいかした うみの いじょうを おさめ、りんかいけんしゅうの さいしゅうびに あさの ひかりを とりもどしました。\nまなび、まよい、だれかを たいせつにした なつの きおくは、にちじょうへ かえっても あなたの まほうを ささえます。\nうみに のこる ほしすなを むねに、それぞれの あしたへ かえりましょう。',
      'The astral disturbance over the sea has been calmed, and morning light returns on the final day of coastal training.\nThe summer memories of learning, uncertainty, and caring for someone will keep supporting your magic after you return to everyday life.\nCarry the star sand in your heart and head home toward tomorrow.',
    )
  : localize(
      languageMode,
      '夜の海辺で真・校長との決着をつけ、仲間たちの夏休みを取り戻しました。\n旅先で重ねた出会いと選択は、日常へ戻っても消えない思い出になります。\nまた次の夏へ、自分の答えを持って進んでいきましょう。',
      'よるの うみべで しん・こうちょうとの けっちゃくを つけ、なかまたちの なつやすみを とりもどしました。\nたびさきで かさねた であいと せんたくは、にちじょうへ もどっても きえない おもいでに なります。\nまた つぎの なつへ、じぶんの こたえを もって すすんで いきましょう。',
      'You settled the final battle with the True Principal by the night sea and won back your friends’ summer vacation.\nThe encounters and choices made on this trip will remain even after everyday life returns.\nCarry your own answer forward toward the next summer.',
    );

export const getVacationLegacyPrompt = (
  theme: VacationNarrativeTheme,
  languageMode: LanguageMode,
): string => theme === 'magic'
  ? localize(languageMode, '次の星海の旅に持っていくカードを1枚選んでください', 'つぎの せいかいの たびに もっていく かーどを 1まい えらんでください', 'Choose one card to carry into your next star-sea journey.')
  : localize(languageMode, '次の夏の挑戦に持っていくカードを1枚選んでください', 'つぎの なつの ちょうせんに もっていく かーどを 1まい えらんでください', 'Choose one card to carry into your next summer challenge.');

export const getVacationNewCardMessage = (
  theme: VacationNarrativeTheme,
  languageMode: LanguageMode,
): string => theme === 'magic'
  ? localize(languageMode, 'この夏に得た新しい力が、次の星海の旅から現れるようになります！', 'この なつに えた あたらしい ちからが、つぎの せいかいの たびから あらわれるように なります！', 'The new power gained this summer can appear from your next star-sea journey!')
  : localize(languageMode, 'この夏に得た新しい成果が、次の挑戦から現れるようになります！', 'この なつに えた あたらしい せいかが、つぎの ちょうせんから あらわれるように なります！', 'The new achievement from this summer can appear from your next challenge!');

export const getVacationLegacyAddedMessage = (
  theme: VacationNarrativeTheme,
  languageMode: LanguageMode,
): string => theme === 'magic'
  ? localize(languageMode, '次の星海の旅の初期デッキに追加されます。', 'つぎの せいかいの たびの しょきでっきに ついかされます。', 'It will be added to the starting deck for your next star-sea journey.')
  : localize(languageMode, '次の夏の挑戦の初期デッキに追加されます。', 'つぎの なつの ちょうせんの しょきでっきに ついかされます。', 'It will be added to the starting deck for your next summer challenge.');
