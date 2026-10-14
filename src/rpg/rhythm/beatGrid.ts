import type { RhythmSong } from './catalog.generated';

/** Shared scrolling geometry for notes and beat lines. Keep the original
 * pixels per second when moving the judgement line from 80% to the pad edge. */
export function rhythmScrollLayout(height: number, speed: number) {
  const hit = height - 1;
  const travel = (3.1 - speed * .35) * hit / (height * .8);
  return { hit, travel };
}

/** Pass the same calibrated song clock used for note judgement. */
export function rhythmBeatPhase(song: Pick<RhythmSong, 'bpm' | 'offset'>, time: number) {
  return (time - song.offset) / (60 / song.bpm);
}

export function rhythmGridLines(song: Pick<RhythmSong, 'bpm' | 'offset'>, time: number, travel: number, hit: number) {
  const beat = 60 / song.bpm;
  const lines: { beat: number; time: number; y: number }[] = [];
  for (let index = Math.ceil(rhythmBeatPhase(song, time) - 1e-9); ; index++) {
    const at = song.offset + index * beat;
    if (at >= time + travel) break;
    lines.push({ beat: index, time: at, y: hit - (at - time) / travel * hit });
  }
  return lines;
}
