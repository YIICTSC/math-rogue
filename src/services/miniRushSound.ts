type Note = readonly [frequency: number, start: number, length: number, volume: number, noise?: number, bend?: number];

// A shared bell motif answers the same opening interval on clear and on miss.
const CUES = {
  start: [[523, 0, .105, .22], [784, .075, .13, .2]],
  clear: [[523, 0, .17, .22], [784, .085, .17, .22], [1047, .17, .28, .2], [659, .17, .2, .07]],
  finale: [[523, 0, .17, .24], [784, .085, .17, .23], [1047, .17, .24, .23], [1319, .28, .27, .18], [784, .28, .24, .09]],
  miss: [[523, 0, .125, .19], [415, .09, .16, .18], [311, .19, .24, .18], [156, .19, .22, .08]],
  time: [[784, 0, .075, .15], [784, .073, .075, .15], [523, .155, .13, .18], [311, .24, .21, .17]],
  step: [[140, 0, .085, .22, .22, -.35]],
  gravel: [[150, 0, .13, .24, .77, -.4], [100, .05, .08, .12, .65]],
  grass: [[210, 0, .085, .12, .55, -.32]],
  jump: [[310, 0, .17, .24, .08, 1.13]],
  dodge: [[300, 0, .13, .21, .72, -.62]],
  tap: [[187, 0, .085, .22, .27, -.24]],
  snap: [[660, 0, .055, .19, .29, -.22], [360, .036, .045, .11]],
  snip: [[1800, 0, .045, .16, .7, -.66], [680, .041, .043, .13, .42]],
  paper: [[950, 0, .08, .12, .74, -.38], [580, .034, .074, .075, .65]],
  drop: [[240, 0, .07, .22, .16, -.52], [130, .05, .073, .13]],
  water: [[520, 0, .085, .16, .22, .48], [330, .039, .09, .15, .3, .67]],
  collect: [[880, 0, .085, .17], [1175, .042, .09, .14]],
  shot: [[230, 0, .155, .23, .24, 1.13], [710, .08, .08, .085, .4, -.55]],
  bell: [[784, 0, .21, .22], [1568, .008, .135, .065]],
  brush: [[420, 0, .1, .15, .58, -.15]],
  sizzle: [[1900, 0, .18, .17, .85, -.36], [680, .04, .11, .08, .58]],
  plate: [[1250, 0, .075, .19], [1760, .047, .08, .12]],
  spark: [[1080, 0, .115, .19, .61, -.66], [2280, .05, .09, .115, .5]],
  beat: [[784, 0, .105, .2], [262, 0, .055, .1]],
} satisfies Record<string, readonly Note[]>;

export type MiniRushCue = keyof typeof CUES;

export function isRushJingle(cue: MiniRushCue) {
  return cue === 'start' || cue === 'clear' || cue === 'finale' || cue === 'miss' || cue === 'time';
}

export function renderMiniRushCue(context: AudioContext, cue: MiniRushCue) {
  const notes: readonly Note[] = CUES[cue];
  const sampleRate = context.sampleRate;
  const duration = Math.max(...notes.map(([, start, length]) => start + length));
  const buffer = context.createBuffer(1, Math.ceil(duration * sampleRate), sampleRate);
  const samples = buffer.getChannelData(0);
  for (const [frequency, start, length, volume, noise = 0, bend = 0] of notes) {
    const startIndex = Math.floor(start * sampleRate);
    let phase = 0;
    let previousNoise = 0;
    for (let i = 0; i < Math.floor(length * sampleRate); i++) {
      const elapsed = i / sampleRate;
      const position = elapsed / length;
      phase += (2 * Math.PI * frequency * (1 + position * bend)) / sampleRate;
      const envelope = Math.min(1, elapsed / .005) * (1 - position) ** 2;
      const bell = Math.sin(phase) * .82 + Math.sin(phase * 2) * .18;
      const random = Math.random() * 2 - 1;
      const texture = (random - previousNoise) * .5;
      previousNoise = random;
      samples[startIndex + i] += envelope * volume * (bell * (1 - noise) + texture * noise);
    }
  }
  return buffer;
}
