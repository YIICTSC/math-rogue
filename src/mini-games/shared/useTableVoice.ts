import { useEffect, useRef } from 'react';
import { audioService } from '../../services/audioService';
import type { CardClubVoiceEvent } from '../../data/cardClubVoices';

type Cue = { hero: string; event: CardClubVoiceEvent | 'score' };
type VoiceSnapshot = {
  game: string;
  phase: string;
  round: number;
  revision: number;
  turn: number;
  self: number;
  hero: string;
  winners: number[];
  start?: 'table-start';
  silentResult?: boolean;
};

export function useTableVoice(frame: VoiceSnapshot | null, special?: Cue) {
  const oldRef = useRef<VoiceSnapshot | null>(null);
  const memory = useRef({
    turns: 0,
    lastSpoke: 0,
    generation: 0,
    pending: null as Promise<boolean> | null,
  });
  useEffect(() => {
    const old = oldRef.current,
      m = memory.current;
    oldRef.current = frame;
    if (!frame) {
      m.generation++;
      m.pending = null;
      audioService.stopCardClubVoices();
      return;
    }
    const newMatch = !old || old.game !== frame.game || old.revision > frame.revision;
    const newTurn =
      newMatch || old.turn !== frame.turn || old.phase !== frame.phase || old.round !== frame.round;
    if (newMatch) m.generation++;
    const speak = (cue: Cue, queued = false) => {
      const generation = m.generation;
      const play = () => {
        if (generation !== m.generation) return Promise.resolve(false);
        m.lastSpoke = Date.now();
        return cue.event === 'score'
          ? audioService.playCardClubScoreVoice(cue.hero)
          : audioService.playCardClubVoice(cue.hero, cue.event);
      };
      const playback = queued && m.pending ? m.pending.then(play, play) : play();
      m.pending = playback;
      void playback
        .catch(() => false)
        .finally(() => {
          if (m.pending === playback) m.pending = null;
        });
    };
    if (newMatch) {
      m.turns = 0;
      m.pending = null;
      speak({ hero: frame.hero, event: frame.start ?? 'start' });
      if (special) speak(special, true);
      return;
    }
    if (old.revision === frame.revision) return;
    const finished = frame.phase === 'result' && old.phase !== 'result' && !frame.silentResult;
    if (special) speak(special, true);
    if (finished) {
      speak(
        { hero: frame.hero, event: frame.winners.includes(frame.self) ? 'win' : 'lose' },
        !!special,
      );
      return;
    }
    if (
      newTurn &&
      frame.turn === frame.self &&
      frame.phase !== 'round' &&
      frame.phase !== 'result'
    ) {
      m.turns++;
      if (!special && !m.pending && m.turns % 5 === 0 && Date.now() - m.lastSpoke >= 13_000)
        speak({ hero: frame.hero, event: 'turn' });
    }
  }, [frame, special]);

  useEffect(
    () => () => {
      memory.current.generation++;
      audioService.stopCardClubVoices();
    },
    [],
  );
}
