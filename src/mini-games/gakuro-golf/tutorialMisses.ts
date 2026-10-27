/** Track confirmed shots from the local player's snapshots, once per shot. */
export type TutorialMissTracker = { shotId: number | null; consecutive: number };
export const initialTutorialMissTracker = (): TutorialMissTracker => ({ shotId: null, consecutive: 0 });
export function recordTutorialShot(previous: TutorialMissTracker, shotId: number, quality: 'nice' | 'good' | 'miss' | undefined): { tracker: TutorialMissTracker; restart: boolean } {
  if (previous.shotId === null || shotId < previous.shotId || shotId > previous.shotId + 1) return { tracker: { shotId, consecutive: 0 }, restart: false };
  if (shotId === previous.shotId) return { tracker: previous, restart: false };
  const consecutive = quality === 'miss' ? previous.consecutive + 1 : 0;
  return { tracker: { shotId, consecutive: consecutive >= 5 ? 0 : consecutive }, restart: consecutive >= 5 };
}
