/** Scratches the live song with a variable delay, without moving its transport. */
export function createScratchGraph(context: BaseAudioContext, source: AudioNode) {
  const dry = context.createGain(), wet = context.createGain(), delay = context.createDelay(.2), output = context.createGain();
  source.connect(dry).connect(output);
  source.connect(delay).connect(wet).connect(output);
  wet.gain.value = 0;
  let active = false, scheduledUntil = 0;
  const schedule = () => {
    if (!active) return;
    const now = context.currentTime;
    if (scheduledUntil < now) {
      scheduledUntil = now;
      delay.delayTime.cancelScheduledValues(now);
      delay.delayTime.setValueAtTime(.02, now);
    }
    while (scheduledUntil < now + .5) {
      // Increasing delay faster than real time reads the song backwards.
      delay.delayTime.linearRampToValueAtTime(.1, scheduledUntil + .04);
      delay.delayTime.linearRampToValueAtTime(.02, scheduledUntil + .16);
      scheduledUntil += .16;
    }
  };
  const setActive = (value: boolean) => {
    if (active === value) return;
    active = value;
    const now = context.currentTime;
    dry.gain.cancelScheduledValues(now);
    wet.gain.cancelScheduledValues(now);
    dry.gain.setTargetAtTime(value ? 0 : 1, now, .005);
    wet.gain.setTargetAtTime(value ? 1 : 0, now, .005);
    if (value) {
      scheduledUntil = now;
      delay.delayTime.cancelScheduledValues(now);
      delay.delayTime.setValueAtTime(.02, now);
      schedule();
    }
    else { delay.delayTime.cancelScheduledValues(now); scheduledUntil = 0; }
  };
  return { output, setActive, schedule, dispose() {
    source.disconnect(); dry.disconnect(); wet.disconnect(); delay.disconnect(); output.disconnect();
  } };
}

export function createSongScratch(audio: HTMLAudioElement) {
  let context: AudioContext | undefined;
  let graph: ReturnType<typeof createScratchGraph> | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let volume = 1;
  let disposed = false;
  const prepare = () => {
    if (disposed) return;
    if (!context) {
      const Constructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Constructor) return;
      context = new Constructor();
      graph = createScratchGraph(context, context.createMediaElementSource(audio));
      graph.output.connect(context.destination);
      graph.output.gain.value = volume;
      audio.volume = 1;
    }
    if (context.state === 'suspended') void context.resume().catch(() => {});
  };
  const setActive = (active: boolean) => {
    if (active) prepare();
    graph?.setActive(active);
    if (timer) clearInterval(timer);
    timer = active && graph ? setInterval(() => graph?.schedule(), 100) : undefined;
  };
  return { prepare, setActive, setVolume(value: number) {
    volume = value;
    if (graph && context) graph.output.gain.setTargetAtTime(value, context.currentTime, .005);
    audio.volume = graph ? 1 : value;
  }, dispose() {
    disposed = true;
    setActive(false);
    graph?.dispose();
    if (context) void context.close().catch(() => {});
  } };
}

/** Lift quiet accents, while retaining dynamics and honoring the SFX bus. */
export const rhythmHitVolume = (velocity: number) => Math.min(1, .5 + Math.max(0, velocity) * .8);
