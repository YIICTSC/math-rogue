
class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  private isMuted: boolean = false;
  private isPlayingBGM: boolean = false;
  private currentBgmType: 'battle' | 'menu' | 'math' | 'poker_shop' | 'poker_play' | null = null;
  
  // Sequencer State
  private nextNoteTime: number = 0;
  private current16thNote: number = 0;
  private tempo: number = 120;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s
  private timerID: number | null = null;
  
  // Jazz Logic
  private swing: number = 0; // 0 = straight, 0.33 = triplet swing, 0.5 = hard swing

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

      // Apply Swing: Delay every 2nd 16th note (mostly affecting 8th note feel in 16th grid)
      // 0, 1, 2, 3 -> 1 and 3 are off-beats in 16th grid? No, 0=Down, 2=8th Up.
      // Standard Swing affects the "and" of the beat.
      // In 16th grid: 0(1), 1(e), 2(&), 3(a). 
      // We want to delay 2 and maybe 1/3 appropriately, but simple shuffle delays 2 and 6...
      // Let's just delay odd 8th notes: indices 2, 6, 10, 14.
      
      let actualTime = time;
      if (this.swing > 0 && (beatNumber % 4 === 2)) {
          const secondsPerBeat = 60.0 / this.tempo;
          actualTime += (secondsPerBeat * 0.25) * this.swing; 
      }

      if (this.currentBgmType === 'battle') {
          // --- BATTLE THEME ---
          if (beatNumber % 2 === 0) { 
             const measure = Math.floor(Date.now() / 2000) % 4; 
             const rootMap = [55, 55, 48, 52]; 
             const root = rootMap[measure] || 55;
             this.playOsc(root, actualTime, 0.15, 'sawtooth', 0.5, this.bgmGain);
          }
          if (beatNumber % 4 === 0) this.playNoise(actualTime, 0.08, 0.8, 'kick'); 
          if (beatNumber % 8 === 4) this.playNoise(actualTime, 0.12, 0.6, 'snare');
          if (beatNumber % 2 === 0) this.playNoise(actualTime, 0.04, 0.2, 'hat');

          const arpPattern = [220, 329, 440, 523, 440, 329, 261, 220, 196, 246, 293, 196, 207, 246, 207, 220];
          const note = arpPattern[beatNumber];
          if (note) {
              this.playOsc(note, actualTime, 0.1, 'square', 0.2, this.bgmGain);
              this.playOsc(note * 1.01, actualTime, 0.1, 'square', 0.2, this.bgmGain); 
          }

      } else if (this.currentBgmType === 'menu') {
          // --- MENU / MAP THEME ---
          if (beatNumber === 0) {
              const chords = [
                  [220, 261, 329], [174, 220, 261], 
                  [196, 246, 293], [164, 207, 246]
              ];
              const chord = chords[Math.floor(Math.random() * chords.length)];
              this.playChord(chord, actualTime, 2.0, 'triangle', 0.2);
          }
          if (Math.random() < 0.2) {
              const scale = [440, 523, 587, 659, 783, 880, 1046]; 
              const note = scale[Math.floor(Math.random() * scale.length)];
              this.playOsc(note * 2, actualTime, 0.3, 'sine', 0.15, this.bgmGain);
          }

      } else if (this.currentBgmType === 'math') {
          // --- MATH CHALLENGE ---
          if (beatNumber % 4 === 0) this.playOsc(800, actualTime, 0.05, 'triangle', 0.3, this.bgmGain); 
          else if (beatNumber % 4 === 2) this.playOsc(600, actualTime, 0.05, 'triangle', 0.2, this.bgmGain); 
          if (beatNumber % 8 === 0) {
              const bassNotes = [220, 220, 247, 261];
              const note = bassNotes[Math.floor((Date.now() / 2000) % 4)];
              this.playOsc(note / 2, actualTime, 0.2, 'sine', 0.4, this.bgmGain);
          }
          if (Math.random() < 0.1 && beatNumber % 2 !== 0) {
              this.playOsc(1500, actualTime, 0.05, 'square', 0.05, this.bgmGain);
          }

      } else if (this.currentBgmType === 'poker_shop') {
          // --- POKER SHOP (Relaxing Bossa/Lo-fi) ---
          // Chord Progression (CMaj7 - Am7 - Dm7 - G7) style
          // Frequencies: C4=261, E4=329, G4=392, B4=493
          const measure = Math.floor(beatNumber / 16) % 4;
          
          // Smooth Chords (Pad) - Every 1st beat of bar
          if (beatNumber % 16 === 0) {
              let chord: number[] = [];
              if (measure === 0) chord = [261.63, 329.63, 392.00, 493.88]; // CMaj7
              else if (measure === 1) chord = [220.00, 261.63, 329.63, 392.00]; // Am7
              else if (measure === 2) chord = [293.66, 349.23, 440.00, 523.25]; // Dm7
              else chord = [196.00, 246.94, 293.66, 349.23]; // G7
              
              this.playChord(chord, actualTime, 2.5, 'sine', 0.15); // Soft Sine Pad
          }

          // Relaxed Melody (Pentatonic improv)
          if (beatNumber % 4 === 0 && Math.random() > 0.4) {
               const scale = [523.25, 587.33, 659.25, 783.99, 880.00]; // C Major Pentatonic
               const note = scale[Math.floor(Math.random() * scale.length)];
               this.playOsc(note, actualTime, 0.3, 'triangle', 0.1, this.bgmGain);
          }

          // Percussion (Bossa-ish Clave)
          // Pattern: x . . x . . x . / . . x . x . . . 
          const clave = [0, 3, 6, 10, 12]; // 16th grid indices
          if (clave.includes(beatNumber % 16)) {
              this.playNoise(actualTime, 0.03, 0.1, 'hat'); // Very soft rimshot/hat
          }

      } else if (this.currentBgmType === 'poker_play') {
          // --- POKER PLAY (Cool Swing Jazz) ---
          // Walking Bass (Quarter Notes)
          if (beatNumber % 4 === 0) {
              // A Minor Blues Walking Bass
              // A (220) -> C (261) -> D (293) -> E (329) or similar walk
              const walkPattern = [
                  [110, 130, 146, 155], // A, C, D, Eb (Blue note)
                  [164, 146, 130, 123], // E, D, C, B
                  [110, 110, 146, 164], 
                  [196, 164, 146, 123]  // G...
              ];
              const measure = Math.floor(beatNumber / 16) % 4;
              const beatInBar = (beatNumber % 16) / 4;
              const note = walkPattern[measure][beatInBar];
              
              this.playOsc(note, actualTime, 0.3, 'triangle', 0.5, this.bgmGain); // Upright Bass sound
          }

          // Piano Stabs (Off-beats / Charleston)
          // Pattern: 1 . & . 
          if (beatNumber % 16 === 0 || beatNumber % 16 === 6) { // Beat 1 and "2-and"
              const measure = Math.floor(beatNumber / 16) % 4;
              let chord: number[] = [];
              // A min 7 / D 7 / E 7 alt
              if (measure % 2 === 0) chord = [220, 261, 329, 392]; // Am7
              else chord = [146, 185, 220, 261]; // D7
              
              // Short, sharp stabs
              this.playChord(chord, actualTime, 0.1, 'square', 0.1); 
          }

          // Ride Cymbal (Swing Pattern: Ding, ding-a-ding)
          // 0, 2, 3(skip), 4, 6, 7(skip)... 
          // Grid: 0, 4, 6(swing), 8, 12, 14(swing)
          if (beatNumber % 4 === 0) {
              this.playNoise(actualTime, 0.05, 0.2, 'hat'); // Beat
          } else if (beatNumber % 4 === 2) {
              this.playNoise(actualTime, 0.03, 0.15, 'hat'); // Swing note
          }
          // Soft snare on 2 and 4 (Backbeat)
          if (beatNumber % 16 === 4 || beatNumber % 16 === 12) {
               this.playNoise(actualTime, 0.1, 0.3, 'snare');
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
      
      // Envelope
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.01); 
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + duration);
  }

  private playChord(freqs: number[], time: number, duration: number, type: OscillatorType, vol: number) {
      if (!this.bgmGain) return;
      // Strum slightly
      freqs.forEach((f, i) => {
          this.playOsc(f, time + (i * 0.02), duration, type, vol / freqs.length, this.bgmGain!);
      });
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
      gain.connect(this.bgmGain); 
      src.start(time);
      src.stop(time + duration);
  }

  // --- Public API ---
  public playBGM(type: 'battle' | 'menu' | 'math' | 'poker_shop' | 'poker_play') {
      if (this.isPlayingBGM && this.currentBgmType === type) return;
      
      this.init(); 
      if (this.timerID) clearTimeout(this.timerID);
      
      this.currentBgmType = type;
      this.isPlayingBGM = true;
      this.swing = 0; // Reset swing
      
      if (type === 'battle') { this.tempo = 135; }
      else if (type === 'math') { this.tempo = 110; }
      else if (type === 'poker_play') { 
          this.tempo = 120; 
          this.swing = 0.6; // Heavy Swing
      }
      else if (type === 'poker_shop') { 
          this.tempo = 90; 
          this.swing = 0; // Straight (Bossa feel is in the timing)
      }
      else { this.tempo = 90; }

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
          this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime, 0.1);
      }
  }

  public playSound(effect: 'select' | 'attack' | 'block' | 'win' | 'lose' | 'correct' | 'wrong') {
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const t = this.ctx.currentTime;

      switch(effect) {
          case 'select':
              this.playOsc(1100, t, 0.05, 'triangle', 0.2, this.sfxGain);
              break;
          case 'attack':
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
              this.playNoise(t, 0.15, 0.5, 'snare');
              break;
          case 'block':
              this.playOsc(600, t, 0.1, 'square', 0.2, this.sfxGain);
              this.playOsc(850, t, 0.08, 'square', 0.2, this.sfxGain);
              break;
          case 'win':
              const fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
              fanfare.forEach((freq, i) => {
                  this.playOsc(freq, t + i*0.08, 0.4, 'square', 0.2, this.sfxGain!);
              });
              break;
          case 'lose':
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
          case 'correct':
              this.playOsc(880, t, 0.1, 'sine', 0.3, this.sfxGain);
              this.playOsc(1108, t + 0.05, 0.1, 'sine', 0.3, this.sfxGain);
              this.playOsc(1318, t + 0.1, 0.4, 'sine', 0.3, this.sfxGain);
              break;
          case 'wrong':
              const wrongOsc = this.ctx.createOscillator();
              wrongOsc.type = 'sawtooth';
              wrongOsc.frequency.setValueAtTime(150, t);
              wrongOsc.frequency.linearRampToValueAtTime(100, t + 0.3);
              const wrongGain = this.ctx.createGain();
              wrongGain.gain.setValueAtTime(0.5, t);
              wrongGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
              wrongOsc.connect(wrongGain);
              wrongGain.connect(this.sfxGain);
              wrongOsc.start(t);
              wrongOsc.stop(t + 0.3);
              break;
      }
  }
}

export const audioService = new AudioService();
