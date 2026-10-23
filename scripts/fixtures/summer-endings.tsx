import '../../src/styles.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import EndlessEndingSequenceScreen from '../../src/components/EndlessEndingSequenceScreen';
import MagicVacationCommonEndingSequenceScreen from '../../src/components/MagicVacationCommonEndingSequenceScreen';
import MagicRomanceEndingScreen from '../../src/components/MagicRomanceEndingScreen';
import { ENDLESS_REVISION_COPY } from '../../src/data/endlessEndingCopyRevision';
import { MAGIC_FRIENDSHIP_ROUTES } from '../../src/data/magicFriendshipRoutes';
import { audioService } from '../../src/services/audioService';
import { LanguageMode, type Player } from '../../src/types';
import type { VisualThemeId } from '../../src/data/visualThemes';
import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS } from '../../src/data/magicHeroes';
import { getThemedEndingCharacterName } from '../../src/data/themedEndingSequences';
import { storageService } from '../../src/services/storageService';
import { buildMagicSummerEpilogueGalleryEntry, getMagicEndingGalleryEntries } from '../../src/services/magicEndingService';

const root = createRoot(document.getElementById('root')!);
let serial = 0;
const realMagicVoice = audioService.playMagicEventVoice.bind(audioService);
const realStopMagic = audioService.stopMagicEventVoices.bind(audioService);
const realStopHighSchool = audioService.stopHighSchoolVoices.bind(audioService);
const realHighSchoolVoice = audioService.playHighSchoolVoiceFile.bind(audioService);
const qa = {
  enableRealAudio() { audioService.stopMagicEventVoices = realStopMagic; audioService.stopHighSchoolVoices = realStopHighSchool; audioService.playMagicEventVoice = realMagicVoice; audioService.playHighSchoolVoiceFile = realHighSchoolVoice; audioService.init(); audioService.setVoiceVolume(.8); },
  completions: 0, stopped: 0, voices: [] as string[],
  show(kind: 'true' | 'epilogue' | 'friendship', id: string, theme: VisualThemeId, languageMode: LanguageMode, vacation = true) {
    const onComplete = () => { qa.completions++; root.render(<div data-qa-result="done">done</div>); };
    const key = ++serial;
    if (kind === 'true') {
      const entry = ENDLESS_REVISION_COPY[theme][id];
      const name = theme === 'magic' ? [...MAGIC_HEROES, ...MAGIC_MALE_PROTAGONISTS].find(h => h.id === id)!.name : getThemedEndingCharacterName(theme, entry.baseCharacterId, 'JAPANESE');
      root.render(<EndlessEndingSequenceScreen key={key} kind="TRUE" theme={theme} characterId={entry.baseCharacterId} characterName={name} magicProtagonistId={theme === 'magic' ? id : undefined} appearanceMode={vacation ? 'VACATION' : 'STANDARD'} languageMode={languageMode} onComplete={onComplete} />);
    } else if (kind === 'epilogue') {
      root.render(<MagicVacationCommonEndingSequenceScreen key={key} heroId={id} languageMode={languageMode} onComplete={onComplete} />);
    } else {
      const route = MAGIC_FRIENDSHIP_ROUTES.find(route => route.id === id)!;
      const player = { appearanceMode: vacation ? 'VACATION' : 'STANDARD', magicRomance: {
        affection: { [id]: 100 }, stages: { [id]: 2 }, selectedCounts: {}, completedEventIds: [],
      } } as Player;
      root.render(<MagicRomanceEndingScreen key={key} player={player} heroId={route.heroId} languageMode={languageMode} onComplete={onComplete} />);
    }
  },
  leave() { root.render(<div data-qa-result="left">left</div>); },
  async showGallery(languageMode: LanguageMode) {
    localStorage.clear(); // Isolated browser QA origin, never the user's app origin.
    const player = { appearanceMode: 'VACATION', magicRomance: { affection: { AKARI_SHIZUKU: 100 }, stages: { AKARI_SHIZUKU: 2 }, selectedCounts: {}, completedEventIds: [] } } as Player;
    storageService.saveMagicEndingGalleryEntries([
      buildMagicSummerEpilogueGalleryEntry('AKARI', 1),
      ...getMagicEndingGalleryEntries(player, 'AKARI', 2),
    ]);
    const { default: Compendium } = await import('../../src/components/CompendiumScreen');
    root.render(<Compendium key={++serial} unlockedCardNames={[]} languageMode={languageMode} visualTheme="magic" appearanceMode="VACATION" onBack={() => qa.leave()} />);
  },
};
audioService.stopMagicEventVoices = () => { qa.stopped++; };
audioService.stopHighSchoolVoices = () => { qa.stopped++; };
audioService.playMagicEventVoice = async (hero, line) => { qa.voices.push(`${hero}/${line}`); return true; };
audioService.playHighSchoolVoiceFile = async (hero, line) => { qa.voices.push(`${hero}/${line}`); return true; };
(window as any).__summer = qa;
root.render(<div data-qa-ready="true">ready</div>);
