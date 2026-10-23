/**
 * Audio is being produced in another environment at the user's request.
 * Enable only after all jobs in the exported voice plan pass audio QA.
 * No silent clips or normal-ending voices stand in for summer dialogue.
 */
export const SUMMER_ENDING_VOICES_READY = false;
export const canPlaySummerEndingVoice = (lineId: string) => !lineId.startsWith('vacation-') || SUMMER_ENDING_VOICES_READY;
export const summerTrueVoiceId = (pageIndex: number) => `vacation-endless-true-${pageIndex + 1}`;
export const summerEpilogueVoiceId = (pageIndex: number) => `vacation-epilogue-${pageIndex + 1}`;
export const summerFriendshipVoiceId = (routeId: string, lineIndex: number) =>
  `vacation-friendship-${routeId.toLowerCase().replaceAll('_', '-')}-${lineIndex + 1}`;
