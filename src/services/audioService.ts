
class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  private isMuted: boolean = false;
  private isPlayingBGM: boolean = false;
  private currentBgmType: 'battle' | 'menu' | null = null;
  
  // Sequencer State
  private nextNoteTime: number = 0;
  private current16thNote: number = 0;
  private tempo: number = 120;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s
  private timerID: number | null = null;

  // Cache buffers
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {}

  public init() {
    if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(e => console.warn(e));
        return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    
    // Master Chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    
    // Simple Delay/Reverb Effect (Echo)
    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.25; // 250ms echo
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.3;
    const delayFilter = this.ctx.createBiquadFilter();
    delayFilter.frequency.value = 2000; // Lowpass filter on echoes

    this.masterGain.connect(this.ctx.destination);
    
    // Send effect
    this.masterGain.connect(delay);
    delay.connect(delayFilter);
    delayFilter.connect(feedback);
    feedback.connect(delay);
    feedback.connect(this.masterGain);

    // BGM Bus
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.4;
    this.bgmGain.connect(this.masterGain);

    // SFX Bus
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);

    // Create Noise Buffer for Percussion
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds buffer
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
  }

  // --- Scheduler & Sequencer ---
  private nextNote() {
      const secondsPerBeat = 60.0 / this.tempo;
      this.nextNoteTime += 0.25 * secondsPerBeat; // Advance by 1/16th note
      this.current16thNote++;
      if (this.current16thNote === 16) {
          this.current16thNote = 0;
      }
  }

  private scheduleNote(beatNumber: number, time: number) {
      if (!this.bgmGain || this.isMuted) return;

      if (this.currentBgmType === 'battle') {
          // --- BATTLE THEME ---
          // Bass Line (Driving 8th notes) - A Minor ish
          if (beatNumber % 2 === 0) { 
             const measure = Math.floor(Date.now() / 2000) % 4; // Rudimentary progression
             const rootMap = [55, 55, 48, 52]; // A1, A1, G1, Ab1 (Driving tension)
             const root = rootMap[measure] || 55;
             this.playOsc(root, time, 0.15, 'sawtooth', 0.5, this.bgmGain);
          }
          
          // Drums
          if (beatNumber % 4 === 0) this.playNoise(time, 0.08, 0.8, 'kick'); // Kick on beats
          if (beatNumber % 8 === 4) this.playNoise(time, 0.12, 0.6, 'snare'); // Snare on backbeat
          if (beatNumber % 2 === 0) this.playNoise(time, 0.04, 0.2, 'hat'); // 8th note hats

          // Melody / Arpeggios (Fast 16ths)
          const arpPattern = [220, 329, 440, 523, 440, 329, 261, 220, 196, 246, 293, 196, 207, 246, 207, 220];
          const note = arpPattern[beatNumber];
          if (note) {
              // Main Lead
              this.playOsc(note, time, 0.1, 'square', 0.2, this.bgmGain);
              // Detuned Harmony for "Chorus" effect
              this.playOsc(note * 1.01, time, 0.1, 'square', 0.2, this.bgmGain); 
          }

      } else if (this.currentBgmType === 'menu') {
          // --- MENU / MAP THEME ---
          // Slow, atmospheric chords on beat 0 of a measure (simulated)
          if (beatNumber === 0) {
              // Random minor/mysterious chords
              const chords = [
                  [220, 261, 329], // Am
                  [174, 220, 261], // Fmaj7
                  [196, 246, 293], // G
                  [164, 207, 246]  // E7ish
              ];
              const chord = chords[Math.floor(Math.random() * chords.length)];
              chord.forEach((freq, i) => {
                  // Staggered entry (strum)
                  this.playOsc(freq, time + i*0.05, 2.0, 'triangle', 0.2, this.bgmGain!);
              });
          }
          
          // Random "Twinkles" (High pitch sine/triangle)
          if (Math.random() < 0.2) {
              const scale = [440, 523, 587, 659, 783, 880, 1046]; // Am pentatonic
              const note = scale[Math.floor(Math.random() * scale.length)];
              this.playOsc(note * 2, time, 0.3, 'sine', 0.15, this.bgmGain);
          }
      }
  }

  private scheduler() {
      if (!this.isPlayingBGM || !this.ctx) return;
      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
          this.scheduleNote(this.current16thNote, this.nextNoteTime);
          this.nextNote();
      }
      this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  // --- Sound Generators ---
  private playOsc(freq: number, time: number, duration: number, type: OscillatorType, vol: number, dest: AudioNode) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      
      // Envelope (ADSR-like)
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.01); // Attack
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration); // Decay/Release

      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + duration);
  }

  private playNoise(time: number, duration: number, vol: number, type: 'kick' | 'snare' | 'hat') {
      if (!this.ctx || !this.noiseBuffer || !this.bgmGain) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      if (type === 'kick') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(150, time);
          filter.frequency.exponentialRampToValueAtTime(0.01, time + duration);
          gain.gain.setValueAtTime(vol, time);
      } else if (type === 'snare') {
          filter.type = 'highpass';
          filter.frequency.value = 1000;
          gain.gain.setValueAtTime(vol * 0.8, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
      } else { // hat
          filter.type = 'highpass';
          filter.frequency.value = 5000;
          gain.gain.setValueAtTime(vol * 0.3, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
      }

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain); // Use BGM gain for drums too, or split if needed
      src.start(time);
      src.stop(time + duration);
  }

  // --- Public API ---
  public playBGM(type: 'battle' | 'menu') {
      // Don't restart if already playing same type
      if (this.isPlayingBGM && this.currentBgmType === type) return;
      
      this.init(); // Ensure ctx is ready
      if (this.timerID) clearTimeout(this.timerID);
      
      this.currentBgmType = type;
      this.isPlayingBGM = true;
      this.tempo = type === 'battle' ? 135 : 90;
      this.current16thNote = 0;
      if (this.ctx) this.nextNoteTime = this.ctx.currentTime + 0.1;
      this.scheduler();
  }

  public stopBGM() {
      this.isPlayingBGM = false;
      if (this.timerID) clearTimeout(this.timerID);
      this.currentBgmType = null;
  }

  public toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.masterGain && this.ctx) {
          // Smooth mute
          this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime, 0.1);
      }
  }

  public playSound(effect: 'select' | 'attack' | 'block' | 'win' | 'lose') {
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const t = this.ctx.currentTime;

      switch(effect) {
          case 'select':
              // High pitched blip
              this.playOsc(1100, t, 0.05, 'triangle', 0.2, this.sfxGain);
              break;
          case 'attack':
              // Impact: Pitch sweep + Noise
              const osc = this.ctx.createOscillator();
              osc.frequency.setValueAtTime(400, t);
              osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
              const g = this.ctx.createGain();
              g.gain.setValueAtTime(0.6, t);
              g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
              osc.connect(g);
              g.connect(this.sfxGain);
              osc.start(t);
              osc.stop(t+0.15);
              this.playNoise(t, 0.15, 0.5, 'snare'); // Crunch
              break;
          case 'block':
              // Metallic Clank (2 square waves detuned)
              this.playOsc(600, t, 0.1, 'square', 0.2, this.sfxGain);
              this.playOsc(850, t, 0.08, 'square', 0.2, this.sfxGain);
              break;
          case 'win':
              // Fanfare Arpeggio (C Major)
              const fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
              fanfare.forEach((freq, i) => {
                  this.playOsc(freq, t + i*0.08, 0.4, 'square', 0.2, this.sfxGain!);
              });
              break;
          case 'lose':
              // Sad descending slide
              const loseOsc = this.ctx.createOscillator();
              loseOsc.type = 'sawtooth';
              loseOsc.frequency.setValueAtTime(300, t);
              loseOsc.frequency.linearRampToValueAtTime(50, t + 1.0);
              const loseGain = this.ctx.createGain();
              loseGain.gain.setValueAtTime(0.4, t);
              loseGain.gain.linearRampToValueAtTime(0, t + 1.0);
              loseOsc.connect(loseGain);
              loseGain.connect(this.sfxGain);
              loseOsc.start(t);
              loseOsc.stop(t + 1.0);
              break;
      }
  }
}

export const audioService = new AudioService();
