
class AudioService {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isMuted: boolean = false;
  private bgmOscillators: OscillatorNode[] = [];

  constructor() {
    // Initialized on user interaction
  }

  public init() {
    // Do not await, fire and forget logic for safety
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(e => console.warn("Audio resume failed", e));
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("Web Audio API is not supported in this browser.");
        return;
      }
      
      this.ctx = new AudioContextClass();
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.gain.value = 0.3; // Master volume
    } catch (e) {
      console.error("AudioService init failed:", e);
      // Fail silently for the game to continue without audio
    }
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number, vol: number = 0.5) {
    if (!this.ctx || !this.gainNode || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.gainNode);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }

  public playSound(effect: 'select' | 'attack' | 'block' | 'win' | 'lose') {
    if (this.isMuted) return;
    // Attempt init if not ready, but don't block
    if (!this.ctx) {
        this.init();
    }
    
    // If still no ctx, abort
    if (!this.ctx) return; 
    
    switch (effect) {
      case 'select':
        this.createOscillator('square', 440, 0.1, 0.1);
        setTimeout(() => this.createOscillator('square', 660, 0.1, 0.1), 50);
        break;
      case 'attack':
        this.createOscillator('sawtooth', 150, 0.1, 0.5);
        this.createOscillator('square', 100, 0.2, 0.5);
        break;
      case 'block':
        this.createOscillator('triangle', 300, 0.3, 0.3);
        break;
      case 'win':
        this.createOscillator('square', 523.25, 0.2);
        setTimeout(() => this.createOscillator('square', 659.25, 0.2), 200);
        setTimeout(() => this.createOscillator('square', 783.99, 0.4), 400);
        break;
      case 'lose':
        this.createOscillator('sawtooth', 100, 0.5);
        setTimeout(() => this.createOscillator('sawtooth', 80, 0.5), 300);
        break;
    }
  }

  public playBGM(type: 'battle' | 'menu') {
    this.stopBGM();
    if (this.isMuted || !this.ctx || !this.gainNode) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      if (type === 'battle') {
        osc.frequency.value = 110; // A2
        // Simple LFO for tension
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 4; // 4Hz wobble
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 10;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();
        this.bgmOscillators.push(lfo);
      } else {
        osc.frequency.value = 220; // A3
      }

      gain.gain.value = 0.05; // Very quiet background drone
      osc.connect(gain);
      gain.connect(this.gainNode);
      osc.start();
      this.bgmOscillators.push(osc);
    } catch (e) {
      console.warn("BGM play failed", e);
    }
  }

  public stopBGM() {
    this.bgmOscillators.forEach(o => {
      try {
        o.stop();
      } catch (e) { /* ignore already stopped */ }
    });
    this.bgmOscillators = [];
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) this.stopBGM();
  }
}

export const audioService = new AudioService();
