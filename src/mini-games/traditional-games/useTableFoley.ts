import { useEffect, useRef } from 'react';
import { audioService } from '../../services/audioService';
import type { TableView } from './engine';
import { placementSounds } from './sounds';
export function useTableFoley(view: TableView) {
  const heard = useRef('');
  useEffect(() => {
    void audioService.preloadTraditionalSounds();
    return () => audioService.stopTraditionalSounds();
  }, []);
  useEffect(() => {
    const key = `${view.game}:${view.round}:${view.revision}`;
    if (key === heard.current) return;
    // Chain taps from the actual first callback so a busy render cannot collapse a pair.
    const cues = placementSounds(view);
    let timer: number | undefined;
    const play = (index: number) => {
      const cue = cues[index];
      if (!cue) return;
      heard.current = key;
      audioService.playTraditionalSound(cue.material, cue.strength);
      const next = cues[index + 1];
      if (next) timer = window.setTimeout(() => play(index + 1), next.at - cue.at);
    };
    // Scheduling the first tap lets StrictMode cancel its initial setup cleanly.
    if (cues.length) timer = window.setTimeout(() => play(0), 0);
    return () => window.clearTimeout(timer);
  }, [view.game, view.round, view.revision]);
}
