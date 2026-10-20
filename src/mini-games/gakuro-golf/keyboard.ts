/** Enter/Space advances only non-shot screens; the shot meter owns aiming keys. */
export function golfAdvanceCommand(phase: string | undefined, key: string) {
  if (key !== 'Enter' && key !== ' ') return null;
  return phase === 'ready' ? {type: 'quiz' as const} : phase === 'holed' ? {type: 'next' as const} : null;
}
