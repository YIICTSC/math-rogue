import type { RhythmSong } from './catalog.generated';

/** Song-clock beats, independent of note speed and input timing calibration. */
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
