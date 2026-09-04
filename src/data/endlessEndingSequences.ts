import type { LanguageMode } from '../types';
import { transEventText } from '../utils/textUtils';
import { MAGIC_HERO_ID_BY_CHARACTER_ID, type VisualThemeId } from './visualThemes';
import {
  ENDLESS_REVISION_COPY,
  type EndlessRevisionEntry,
  type EndlessRevisionPageCopy,
} from './endlessEndingCopyRevision';

export type EndlessEndingKind = 'OPENING' | 'TRUE';

export interface EndlessEndingPage {
  title: string;
  titleHiragana: string;
  titleEnglish: string;
  scene: string;
  text: string;
  textHiragana: string;
  textEnglish: string;
  dialogue: string;
  dialogueHiragana: string;
  dialogueEnglish: string;
  imagePath: string;
}

export interface EndlessEndingSequence {
  id: string;
  characterId: string;
  characterName: string;
  kind: EndlessEndingKind;
  pages: [EndlessEndingPage, EndlessEndingPage, EndlessEndingPage];
}

const localizeRevisionText = (value: string, languageMode: LanguageMode): string =>
  languageMode === 'JAPANESE' ? value : transEventText(value, languageMode);

const getRevisionEntry = (
  characterId: string,
  theme: VisualThemeId,
  magicProtagonistId?: string,
): EndlessRevisionEntry => {
  const normalizedCharacterId = characterId.trim().toUpperCase();
  if (theme === 'magic') {
    const requestedMagicId = magicProtagonistId?.toUpperCase();
    const femaleMagicId = MAGIC_HERO_ID_BY_CHARACTER_ID[normalizedCharacterId] ?? 'AKARI';
    return (
      (requestedMagicId ? ENDLESS_REVISION_COPY.magic[requestedMagicId] : undefined) ??
      ENDLESS_REVISION_COPY.magic[femaleMagicId] ??
      // Never cross the theme boundary on a malformed/legacy protagonist ID.
      // The old elementary fallback paired elementary copy with high-school
      // artwork when a high-school save contained an unknown ID.
      ENDLESS_REVISION_COPY.magic.AKARI
    );
  }
  if (theme === 'high-school') {
    return ENDLESS_REVISION_COPY['high-school'][normalizedCharacterId]
      ?? ENDLESS_REVISION_COPY['high-school'].WARRIOR;
  }
  return ENDLESS_REVISION_COPY.elementary[normalizedCharacterId]
    ?? ENDLESS_REVISION_COPY.elementary.WARRIOR;
};

export const getEndlessEndingVoiceHeroId = (
  characterId: string,
  theme: VisualThemeId,
  magicProtagonistId?: string,
): string => getRevisionEntry(characterId, theme, magicProtagonistId).protagonistId;

const getRevisionImagePath = (
  theme: VisualThemeId,
  entry: EndlessRevisionEntry,
  page: EndlessRevisionPageCopy,
): string => {
  if (theme === 'magic') {
    const protagonistFolder = entry.magicGender === 'male'
      ? `male/${entry.protagonistId.toLowerCase()}`
      : entry.baseCharacterId.toLowerCase();
    return `sprites/endless-endings/magic/${protagonistFolder}/${page.imageKey}.webp`;
  }
  const themeFolder = theme === 'elementary' ? '' : `${theme}/`;
  return `sprites/endless-endings/${themeFolder}${entry.baseCharacterId.toLowerCase()}/${page.imageKey}.webp`;
};

export const getEndlessEndingSequence = (
  kind: EndlessEndingKind,
  characterId: string,
  characterName: string,
  theme: VisualThemeId = 'elementary',
  magicProtagonistId?: string,
): EndlessEndingSequence => {
  const resolvedTheme: VisualThemeId = theme === 'high-school' || theme === 'magic' ? theme : 'elementary';
  const entry = getRevisionEntry(characterId, resolvedTheme, magicProtagonistId);
  const copies = kind === 'OPENING' ? entry.opening : entry.true;
  const pages = copies.map((copy) => ({
    title: copy.title,
    titleHiragana: localizeRevisionText(copy.title, 'HIRAGANA'),
    titleEnglish: localizeRevisionText(copy.title, 'ENGLISH'),
    scene: copy.scene,
    text: copy.text,
    textHiragana: localizeRevisionText(copy.text, 'HIRAGANA'),
    textEnglish: localizeRevisionText(copy.text, 'ENGLISH'),
    dialogue: copy.dialogue,
    dialogueHiragana: localizeRevisionText(copy.dialogue, 'HIRAGANA'),
    dialogueEnglish: localizeRevisionText(copy.dialogue, 'ENGLISH'),
    imagePath: getRevisionImagePath(resolvedTheme, entry, copy),
  })) as [EndlessEndingPage, EndlessEndingPage, EndlessEndingPage];

  return {
    id: `${kind.toLowerCase()}-${entry.protagonistId.toLowerCase()}`,
    characterId: entry.baseCharacterId,
    characterName,
    kind,
    pages,
  };
};

export const getEndlessEndingLocalizedTitle = (page: EndlessEndingPage, languageMode: LanguageMode): string =>
  languageMode === 'ENGLISH' ? page.titleEnglish : languageMode === 'HIRAGANA' ? page.titleHiragana : page.title;

export const getEndlessEndingLocalizedText = (page: EndlessEndingPage, languageMode: LanguageMode): string =>
  languageMode === 'ENGLISH' ? page.textEnglish : languageMode === 'HIRAGANA' ? page.textHiragana : page.text;

export const getEndlessEndingLocalizedDialogue = (page: EndlessEndingPage, languageMode: LanguageMode): string =>
  languageMode === 'ENGLISH' ? page.dialogueEnglish : languageMode === 'HIRAGANA' ? page.dialogueHiragana : page.dialogue;
