import { useEffect, useRef } from 'react';
import { useTableVoice } from '../shared/useTableVoice';
import type { ClubView } from './model';
import { clubScoreAwards } from './scoreAwards';

export function useCardVoices(view: ClubView | null) {
  const previous = useRef<ClubView | null>(null);
  const award =
    view &&
    clubScoreAwards(previous.current, view).find((candidate) =>
      candidate.reasons.some((event) => event.key !== 'points'),
    );
  useEffect(() => {
    previous.current = view ? { ...view, log: [...view.log] } : null;
  }, [view]);
  useTableVoice(
    view
      ? {
          ...view,
          hero: view.players[view.self].hero,
          silentResult: ['draw', 'repetition', 'hostEnded'].includes(view.resultReason ?? ''),
        }
      : null,
    award ? { hero: award.player.hero, event: 'score' } : undefined,
  );
}
