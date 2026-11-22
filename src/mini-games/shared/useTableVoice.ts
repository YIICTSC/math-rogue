import { useEffect, useRef } from 'react';
import { audioService } from '../../services/audioService';
import type { CardClubVoiceEvent } from '../../data/cardClubVoices';
import { declarationsSince, type TableDeclaration } from './tableDeclarations';

type Cue = { hero: string; event: CardClubVoiceEvent | 'score' };
type VoiceSnapshot = {
  game: string;
  phase: string;
  round: number;
  revision: number;
  turn: number;
  self: number;
  hero: string;
  players: { hero: string }[];
  winners: number[];
  declarations?: TableDeclaration[];
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
    declaring: false,
  });
  useEffect(() => {
    const old = oldRef.current;
    const m = memory.current;
    oldRef.current = frame;
    if (!frame) {
      m.generation++;
      m.pending = null;
      m.declaring = false;
      audioService.stopCardClubVoices();
      return;
    }
    const newMatch = !old || old.game !== frame.game || old.revision > frame.revision;
    if (!newMatch && old.revision === frame.revision) return;

    const speak = (cue: Cue, isDeclaration = false) => {
      const generation = m.generation;
      const play = () => {
        if (generation !== m.generation) return Promise.resolve(false);
        m.lastSpoke = Date.now();
        return cue.event === 'score'
          ? audioService.playCardClubScoreVoice(cue.hero)
          : audioService.playCardClubVoice(cue.hero, cue.event);
      };
      const playback = m.pending ? m.pending.then(play, play) : play();
      m.pending = playback;
      m.declaring = m.declaring || isDeclaration;
      void playback
        .catch(() => false)
        .finally(() => {
          if (m.pending === playback) {
            m.pending = null;
            m.declaring = false;
          }
        });
    };

    if (newMatch) {
      m.generation++;
      m.turns = 0;
      m.pending = null;
      m.declaring = false;
      speak({ hero: frame.hero, event: frame.start ?? 'start' });
    }
    const calls =
      !newMatch || frame.revision === 0
        ? declarationsSince(frame, newMatch ? -1 : old.revision)
        : [];
    if (calls.length && !newMatch && m.pending && !m.declaring) {
      m.generation++;
      m.pending = null;
      audioService.stopCardClubVoices();
    }
    for (const call of calls) {
      const hero = frame.players[call.seat]?.hero;
      if (hero) call.lines.forEach((event) => speak({ hero, event }, true));
    }
    if (newMatch) return;
    if (!calls.length && special) speak(special);

    if (frame.phase === 'result' && old.phase !== 'result' && !frame.silentResult) {
      speak({ hero: frame.hero, event: frame.winners.includes(frame.self) ? 'win' : 'lose' });
      return;
    }
    const newTurn =
      old.turn !== frame.turn || old.phase !== frame.phase || old.round !== frame.round;
    if (newTurn && frame.turn === frame.self && frame.phase !== 'round' && frame.phase !== 'result') {
      m.turns++;
      if (!m.pending && m.turns % 5 === 0 && Date.now() - m.lastSpoke >= 13_000)
        speak({ hero: frame.hero, event: 'turn' });
    }
  }, [frame, special]);

  useEffect(
    () => () => {
      oldRef.current = null;
      memory.current.generation++;
      memory.current.pending = null;
      memory.current.declaring = false;
      audioService.stopCardClubVoices();
    },
    [],
  );
}
