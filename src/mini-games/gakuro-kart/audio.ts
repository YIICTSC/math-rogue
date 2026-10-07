import { lapQuestion } from './learning';
import type { Race } from './engine';
/** Original synthesized engine, soundtrack and race cues. */
export class KartAudio {
  private context: AudioContext | null = null;
  private unlockPromise: Promise<boolean> | null = null;
  private master: GainNode | null = null;
  private motor: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private skid: AudioBufferSourceNode | null = null; private skidGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lastDistance = 0; private lastSpeed = 0; private lastCrash = false; private lastSlow = false;
  private lastAnswers = 0; private lastQuizLap = -1; private lastLap = 0; private finished = false; private seed = -1; private lastJump = false;
  private step = 0; private nextBeat = 0; private boost = false; private countdown = 0; private item = false;
  enabled = true;
  async unlock(): Promise<boolean> {
    if (!this.context) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      this.context = new AC(); this.master = this.context.createGain(); this.master.gain.value = this.enabled ? .4 : 0; this.master.connect(this.context.destination);
      this.motor = this.context.createOscillator(); this.motor.type = 'sawtooth'; this.motorGain = this.context.createGain(); this.motorGain.gain.value = 0;
      const filter = this.context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 850; this.filter = filter;
      this.motor.connect(filter); filter.connect(this.motorGain); this.motorGain.connect(this.master); this.motor.start();
      this.noiseBuffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
      const data = this.noiseBuffer.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.skid = this.context.createBufferSource(); this.skid.buffer = this.noiseBuffer; this.skid.loop = true;
      const skidFilter = this.context.createBiquadFilter(); skidFilter.type = 'bandpass'; skidFilter.frequency.value = 1800; skidFilter.Q.value = 1.8;
      this.skidGain = this.context.createGain(); this.skidGain.gain.value = 0;
      this.skid.connect(skidFilter); skidFilter.connect(this.skidGain); this.skidGain.connect(this.master); this.skid.start();
    }
    const context = this.context;
    const isRunning = () => context.state === 'running';
    if (isRunning()) return true;
    if (this.unlockPromise) return this.unlockPromise;

    // iOS WebViews can acknowledge the first resume() while still leaving the
    // context suspended. Retry after that transition settles, as the app-wide
    // audio service does, instead of silently leaving every kart cue muted.
    const resume = (async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (isRunning()) return true;
        await Promise.race([
          context.resume().catch(() => undefined),
          new Promise<void>(resolve => window.setTimeout(resolve, 300)),
        ]);
        if (isRunning()) return true;
        if (attempt < 2) await new Promise<void>(resolve => window.setTimeout(resolve, 150 * (attempt + 1)));
      }
      return isRunning();
    })();
    this.unlockPromise = resume;
    try {
      return await resume;
    } finally {
      if (this.unlockPromise === resume) this.unlockPromise = null;
    }
  }
  toggle() { this.enabled = !this.enabled; if (this.context && this.master) this.master.gain.setTargetAtTime(this.enabled ? .4 : 0, this.context.currentTime, .03); return this.enabled; }
  private note(frequency: number, length: number, volume: number, type: OscillatorType = 'sine') {
    if (!this.context || !this.master) return;
    const c = this.context, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = frequency;
    g.gain.setValueAtTime(volume, c.currentTime); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + length); o.connect(g); g.connect(this.master); o.start(); o.stop(c.currentTime + length); o.onended = () => { o.disconnect(); g.disconnect(); };
  }
  private noise(length: number, volume: number, cutoff: number) {
    if (!this.context || !this.master || !this.noiseBuffer) return;
    const c = this.context, source = c.createBufferSource(), gain = c.createGain(), filter = c.createBiquadFilter();
    source.buffer = this.noiseBuffer; filter.type = 'lowpass'; filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, c.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, c.currentTime + length);
    source.connect(filter); filter.connect(gain); gain.connect(this.master); source.start(); source.stop(c.currentTime + length);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  update(w: Race | null, id: string) {
    if (!this.context || !this.motor || !this.motorGain) return;
    if (w && w.seed !== this.seed) { this.seed = w.seed; this.boost = false; this.item = false; this.lastAnswers = 0; this.lastQuizLap = -1; this.lastCrash = false; this.lastSlow = false; this.lastLap = 0; this.finished = false; this.lastJump = false; this.lastDistance = 0; this.lastSpeed = 0; }
    const p = w?.players[id], racing = w?.phase === 'race' && !w.paused && p && !document.hidden;
    this.motor.frequency.setTargetAtTime(racing ? 52 + (p.speed % 19) * 3 + Math.floor(p.speed / 19) * 17 : 40, this.context.currentTime, .06);
    this.motorGain.gain.setTargetAtTime(racing ? (p.crash ? .035 : .13 + p.speed / 1400) : 0, this.context.currentTime, .08);
    this.filter?.frequency.setTargetAtTime(racing ? 500 + p.speed * 14 : 450, this.context.currentTime, .08);
    this.skidGain?.gain.setTargetAtTime(racing && ((p.drift && Math.abs(p.steer) > .15 && p.speed > 22) || (p.brake && p.speed > 8)) ? .09 : 0, this.context.currentTime, .08);
    const count = w?.phase === 'countdown' ? Math.ceil(w.remaining) : 0;
    if (count && count !== this.countdown) this.note(440, .15, .25);
    if (!count && this.countdown && racing) this.note(880, .5, .25); this.countdown = count;
    if (p?.finish && !this.finished && !document.hidden) { this.note(523, .3, .2); this.note(659, .5, .15); this.note(784, .8, .15); this.finished = true; }
    if (racing) {
      if (p.quizLap !== this.lastQuizLap) { this.lastQuizLap = p.quizLap; this.lastAnswers = 0; }
      const answers = p.quizAnswers.filter(a => a !== -2).length;
      if (answers > this.lastAnswers && w?.lesson) {
        const i = answers - 1, correct = p.quizAnswers[i] === lapQuestion(w.lesson, p.quizLap, i)!.correct;
        this.note(correct ? 1047 : 165, correct ? .4 : .5, .22, correct ? 'sine' : 'triangle');
        if (correct) this.note(1319, .6, .1);
      }
      this.lastAnswers = answers;
      if (p.crash > 0 && !this.lastCrash) { this.noise(.8, .5, 2200); this.note(70, .65, .3, 'sawtooth'); }
      this.lastCrash = p.crash > 0;
      if (p.slow > 0 && !this.lastSlow && !p.crash) this.note(130, .5, .2, 'triangle'); this.lastSlow = p.slow > 0;
      if (p.jump > 0 && !this.lastJump) this.noise(.25, .14, 3200); this.lastJump = p.jump > 0;
      if (this.lastSpeed - p.speed > 10 && !p.crash) this.noise(.15, .15, 900);
      this.lastSpeed = p.speed; this.lastDistance = p.distance;
      if (p.boost > 0 && !this.boost) { this.note(660, .4, .16, 'triangle'); this.noise(.55, .16, 3600); } this.boost = p.boost > 0;
      if (p.item && !this.item) this.note(1108, .2, .1); this.item = !!p.item;
      if (this.context.currentTime >= this.nextBeat) {
        const notes = [110, 0, 164.81, 220, 130.81, 0, 196, 261.63, 146.83, 0, 220, 293.66, 130.81, 196, 164.81, 0];
        const note = notes[this.step++ % notes.length]; if (note) this.note(note, .22, .05, 'triangle'); if (this.step % 4 === 1) this.note(55, .15, .12);
        this.nextBeat = this.context.currentTime + .22;
      }
    }
  }
  close() { this.motor?.stop(); this.skid?.stop(); void this.context?.close(); this.context = null; this.motor = null; this.master = null; }
}
