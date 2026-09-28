import type { Race } from './engine';
/** Original synthesized engine, soundtrack and race cues. */
export class KartAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private motor: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;
  private step = 0; private nextBeat = 0; private boost = false; private countdown = 0; private item = false;
  enabled = true;
  async unlock() {
    if (!this.context) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.context = new AC(); this.master = this.context.createGain(); this.master.gain.value = this.enabled ? .4 : 0; this.master.connect(this.context.destination);
      this.motor = this.context.createOscillator(); this.motor.type = 'sawtooth'; this.motorGain = this.context.createGain(); this.motorGain.gain.value = 0;
      const filter = this.context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 450;
      this.motor.connect(filter); filter.connect(this.motorGain); this.motorGain.connect(this.master); this.motor.start();
    }
    if (this.context.state === 'suspended') await this.context.resume();
  }
  toggle() { this.enabled = !this.enabled; if (this.context && this.master) this.master.gain.setTargetAtTime(this.enabled ? .4 : 0, this.context.currentTime, .03); return this.enabled; }
  private note(frequency: number, length: number, volume: number, type: OscillatorType = 'sine') {
    if (!this.context || !this.master) return;
    const c = this.context, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = frequency;
    g.gain.setValueAtTime(volume, c.currentTime); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + length); o.connect(g); g.connect(this.master); o.start(); o.stop(c.currentTime + length); o.onended = () => { o.disconnect(); g.disconnect(); };
  }
  update(w: Race | null, id: string) {
    if (!this.context || !this.motor || !this.motorGain) return;
    const p = w?.players[id], racing = w?.phase === 'race' && !w.paused && p && !p.finish && !document.hidden;
    this.motor.frequency.setTargetAtTime(racing ? 42 + p.speed * 2.1 : 40, this.context.currentTime, .06);
    this.motorGain.gain.setTargetAtTime(racing ? .032 : 0, this.context.currentTime, .08);
    const count = w?.phase === 'countdown' ? Math.ceil(w.remaining) : 0;
    if (count && count !== this.countdown) this.note(440, .15, .25);
    if (!count && this.countdown && racing) this.note(880, .5, .25); this.countdown = count;
    if (racing) {
      if (p.boost > 0 && !this.boost) this.note(660, .32, .12, 'triangle'); this.boost = p.boost > 0;
      if (p.item && !this.item) this.note(1108, .2, .1); this.item = !!p.item;
      if (this.context.currentTime >= this.nextBeat) {
        const notes = [110, 0, 164.81, 220, 130.81, 0, 196, 261.63, 146.83, 0, 220, 293.66, 130.81, 196, 164.81, 0];
        const note = notes[this.step++ % notes.length]; if (note) this.note(note, .22, .05, 'triangle'); if (this.step % 4 === 1) this.note(55, .15, .12);
        this.nextBeat = this.context.currentTime + .22;
      }
    }
  }
  close() { void this.context?.close(); this.context = null; }
}
