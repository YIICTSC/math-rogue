import { SUMMER_ENDING_VOICE_MS } from './summerEndingVoiceDurations';

/** All 197 dedicated CPU-generated summer dialogue clips passed audio and speech QA. */
export const SUMMER_ENDING_VOICES_READY = true;
export const canPlaySummerEndingVoice = (lineId: string) => !lineId.startsWith('vacation-') || SUMMER_ENDING_VOICES_READY;
export const summerTrueVoiceId = (pageIndex: number) => `vacation-endless-true-${pageIndex + 1}`;
export const summerEpilogueVoiceId = (pageIndex: number) => `vacation-epilogue-${pageIndex + 1}`;
export const summerFriendshipVoiceId = (routeId: string, lineIndex: number) =>
  `vacation-friendship-${routeId.toLowerCase().replaceAll('_', '-')}-${lineIndex + 1}`;

/** Preserve long dialogue in both HTMLAudio and WebAudio playback paths. */
export const summerEndingVoiceLimitMs = (theme: string, heroId: string, lineId: string, fallback: number) => {
  const duration = SUMMER_ENDING_VOICE_MS[`${theme}/${heroId}/${lineId}`];
  return duration ? Math.max(fallback, duration + 500) : fallback;
};
