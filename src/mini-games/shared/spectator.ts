/** Pick another connected participant whenever possible. */
export function nextSpectatorTarget(ids: readonly string[], current: string | null, random = Math.random): string | null {
  const choices = ids.filter(id => id !== current);
  const pool = choices.length ? choices : ids;
  return pool.length ? pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] : null;
}

export const SPECTATOR_INTERVAL_MS = 8000;
