
class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  private isMuted: boolean = false;
  private isPlayingBGM: boolean = false;
  private currentBgmType: string | null = null;
  
  // BGM Mode: Default to STUDY
  private bgmMode: 'OSCILLATOR' | 'MP3' | 'STUDY' = 'STUDY';
  private audioBuffers: Record<string, AudioBuffer> = {};
  private currentSource: AudioBufferSourceNode | null = null;

  // Sequencer State
  private nextNoteTime: number = 0;
  private current16thNote: number = 0;
  private total16thNotes: number = 0; // Total counter for long-form composition
  private tempo: number = 120;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s
  private timerID: number | null = null;
  
  // Jazz Logic
  private swing: number = 0; // 0 = straight, 0.33 = triplet swing, 0.5 = hard swing

  // Cache buffers
  private noiseBuffer: AudioBuffer | null = null;

  // School Chime (Westminster Quarters): E4, C4, D4, G3 ... G3, D4, E4, C4
  private chimeMelody = [329.63, 261.63, 293.66, 196.00, 0, 0, 0, 0, 196.00, 293.66, 329.63, 261.63, 0, 0, 0, 0];

  private bgmList = [
    'school_psyche', 'dungeon_gym', 'dungeon_science', 'dungeon_music', 
    'dungeon_library', 'dungeon_roof', 'battle', 'boss', 'dungeon_boss',
    'kocho_setup', 'kocho_battle', 'kocho_boss'
  ];

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
    delay.delayTime.value = 0.35; // Increased delay for ambient feel
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.4;
    const delayFilter = this.ctx.createBiquadFilter();
    delayFilter.frequency.value = 1500; // Lowpass filter on echoes

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

  public setBgmMode(mode: 'OSCILLATOR' | 'MP3' | 'STUDY') {
      if (this.bgmMode === mode) return;
      this.bgmMode = mode;
      
      // If currently playing, restart with new mode
      if (this.isPlayingBGM && this.currentBgmType) {
          const type = this.currentBgmType;
          this.stopBGM();
          this.playBGM(type as any);
      }
  }

  public getBgmMode() {
      return this.bgmMode;
  }

  // --- Scheduler & Sequencer ---
  private nextNote() {
      const secondsPerBeat = 60.0 / this.tempo;
      this.nextNoteTime += 0.25 * secondsPerBeat; // Advance by 1/16th note
      this.current16thNote++;
      this.total16thNotes++;
      if (this.current16thNote === 16) {
          this.current16thNote = 0;
      }
  }

  private scheduleNote(beatNumber: number, time: number) {
      if (!this.bgmGain || this.isMuted) return;

      let actualTime = time;
      if (this.swing > 0 && (beatNumber % 4 === 2)) {
          const secondsPerBeat = 60.0 / this.tempo;
          actualTime += (secondsPerBeat * 0.25) * this.swing; 
      }

      // Use total16thNotes for long-form progression
      const t = this.total16thNotes;

      if (this.currentBgmType === 'battle') {
          // --- BATTLE THEME (Standard) ---
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

      } else if (this.currentBgmType === 'mid_boss') {
          // --- MID BOSS / ELITE ---
          if (beatNumber % 2 === 0) {
              this.playOsc(55, actualTime, 0.1, 'sawtooth', 0.6, this.bgmGain);
              this.playOsc(110, actualTime, 0.1, 'square', 0.3, this.bgmGain);
          }
          if (beatNumber % 4 === 0) this.playNoise(actualTime, 0.1, 0.9, 'kick');
          if (beatNumber % 4 === 2) this.playNoise(actualTime, 0.1, 0.7, 'snare');
          const arp = [440, 554, 659, 880, 659, 554, 440, 329];
          const note = arp[beatNumber % 8];
          this.playOsc(note, actualTime, 0.1, 'triangle', 0.3, this.bgmGain);

      } else if (this.currentBgmType === 'boss') {
          // --- BOSS THEME ---
          if (beatNumber === 0) {
              const chords = [[110, 164, 196], [98, 146, 174], [87, 130, 155], [110, 164, 196]];
              const measure = Math.floor(t / 16) % 4;
              this.playChord(chords[measure], actualTime, 0.8, 'sawtooth', 0.4);
          }
          if (beatNumber % 8 === 0) this.playNoise(actualTime, 0.2, 1.0, 'kick');
          if (beatNumber % 16 === 8) this.playNoise(actualTime, 0.3, 0.8, 'snare');
          if (beatNumber % 4 === 0) {
              const melody = [440, 440, 392, 493];
              const note = melody[Math.floor(t / 16) % 4];
              this.playOsc(note, actualTime, 0.4, 'square', 0.3, this.bgmGain);
          }

      } else if (this.currentBgmType === 'final_boss') {
          // --- FINAL BOSS ---
          if (beatNumber % 2 === 0) {
              this.playOsc(55, actualTime, 0.1, 'sawtooth', 0.7, this.bgmGain); 
          }
          if (beatNumber % 4 === 0) this.playNoise(actualTime, 0.1, 1.0, 'kick');
          if (beatNumber % 8 === 4) this.playNoise(actualTime, 0.1, 0.9, 'snare');
          this.playNoise(actualTime, 0.02, 0.3, 'hat');
          const arp = [880, 659, 554, 440, 554, 659, 880, 1108];
          const note = arp[beatNumber % 8];
          this.playOsc(note, actualTime, 0.1, 'sawtooth', 0.2, this.bgmGain);
          this.playOsc(note * 1.5, actualTime, 0.1, 'square', 0.1, this.bgmGain);

      } else if (this.currentBgmType === 'menu') {
          // --- START MENU (Title) ---
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

      } else if (this.currentBgmType === 'map') {
          if (beatNumber % 4 === 0) {
              this.playOsc(110, actualTime, 0.1, 'triangle', 0.3, this.bgmGain); 
          }
          if (beatNumber % 16 === 0) {
              const melody = [329, 392, 440, 523];
              const note = melody[Math.floor(t / 64) % 4];
              this.playOsc(note, actualTime, 0.5, 'sine', 0.2, this.bgmGain);
          }

      } else if (this.currentBgmType === 'shop') {
          const measure = Math.floor(beatNumber / 16) % 4;
          if (beatNumber % 4 === 0) {
               const bass = [110, 130, 146, 164]; 
               const note = bass[beatNumber % 4];
               this.playOsc(note, actualTime, 0.3, 'triangle', 0.4, this.bgmGain);
          }
          if (beatNumber % 16 === 0) {
              const chords = [[261, 329, 392], [220, 261, 329], [293, 349, 440], [196, 246, 293]];
              this.playChord(chords[measure], actualTime, 1.0, 'sine', 0.2);
          }
          if (beatNumber % 2 === 0) this.playNoise(actualTime, 0.03, 0.1, 'hat');

      } else if (this.currentBgmType === 'event') {
          if (Math.random() < 0.3 && beatNumber % 4 === 0) {
              const scale = [440, 466, 554, 587, 659]; 
              const note = scale[Math.floor(Math.random() * scale.length)];
              this.playOsc(note, actualTime, 0.5, 'sine', 0.2, this.bgmGain);
          }
          if (beatNumber % 32 === 0) {
               this.playOsc(110, actualTime, 4.0, 'triangle', 0.1, this.bgmGain); 
          }

      } else if (this.currentBgmType === 'rest') {
          const arp = [261, 329, 392, 523, 392, 329]; 
          const note = arp[beatNumber % 6];
          if (note) {
              this.playOsc(note, actualTime, 0.3, 'sine', 0.15, this.bgmGain);
          }
          if (beatNumber % 16 === 0) {
               this.playChord([130, 196, 261], actualTime, 2.0, 'triangle', 0.1);
          }

      } else if (this.currentBgmType === 'reward') {
          if (beatNumber % 4 === 0) {
              const bass = [261, 349, 392, 261];
              const note = bass[Math.floor(t / 16) % 4];
              this.playOsc(note / 2, actualTime, 0.2, 'square', 0.2, this.bgmGain);
          }
          const melody = [523, 523, 587, 659, 587, 523, 493, 392];
          const note = melody[beatNumber % 8];
          if (beatNumber % 2 === 0) {
               this.playOsc(note, actualTime, 0.1, 'triangle', 0.3, this.bgmGain);
          }

      } else if (this.currentBgmType === 'victory') {
          const melody = [523, 523, 523, 659, 783, 783, 659, 783, 880];
          const idx = beatNumber % melody.length;
          this.playOsc(melody[idx], actualTime, 0.3, 'sawtooth', 0.2, this.bgmGain);
          if (beatNumber % 4 === 0) this.playNoise(actualTime, 0.1, 0.5, 'snare');

      } else if (this.currentBgmType === 'game_over') {
          if (beatNumber % 16 === 0) {
              const chord = [220, 261, 311]; 
              this.playChord(chord, actualTime, 3.0, 'sine', 0.2);
          }
          if (beatNumber % 8 === 0) {
              this.playOsc(110, actualTime, 2.0, 'triangle', 0.2, this.bgmGain);
          }

      } else if (this.currentBgmType === 'math') {
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
          const measure = Math.floor(beatNumber / 16) % 4;
          if (beatNumber % 16 === 0) {
              let chord: number[] = [];
              if (measure === 0) chord = [261.63, 329.63, 392.00, 493.88]; 
              else if (measure === 1) chord = [220.00, 261.63, 329.63, 392.00]; 
              else if (measure === 2) chord = [293.66, 349.23, 440.00, 523.25]; 
              else chord = [196.00, 246.94, 293.66, 349.23]; 
              this.playChord(chord, actualTime, 2.5, 'sine', 0.15); 
          }
          if (beatNumber % 4 === 0 && Math.random() > 0.4) {
               const scale = [523.25, 587.33, 659.25, 783.99, 880.00];
               const note = scale[Math.floor(Math.random() * scale.length)];
               this.playOsc(note, actualTime, 0.3, 'triangle', 0.1, this.bgmGain);
          }
          const clave = [0, 3, 6, 10, 12];
          if (clave.includes(beatNumber % 16)) {
              this.playNoise(actualTime, 0.03, 0.1, 'hat');
          }

      } else if (this.currentBgmType === 'poker_play') {
          if (beatNumber % 4 === 0) {
              const walkPattern = [[110, 130, 146, 155], [164, 146, 130, 123], [110, 110, 146, 164], [196, 164, 146, 123]];
              const measure = Math.floor(beatNumber / 16) % 4;
              const beatInBar = (beatNumber % 16) / 4;
              const note = walkPattern[measure][beatInBar];
              this.playOsc(note, actualTime, 0.3, 'triangle', 0.5, this.bgmGain);
          }
          if (beatNumber % 16 === 0 || beatNumber % 16 === 6) {
              const measure = Math.floor(beatNumber / 16) % 4;
              let chord: number[] = [];
              if (measure % 2 === 0) chord = [220, 261, 329, 392]; else chord = [146, 185, 220, 261];
              this.playChord(chord, actualTime, 0.1, 'square', 0.1); 
          }
          if (beatNumber % 4 === 0) { this.playNoise(actualTime, 0.05, 0.2, 'hat'); } else if (beatNumber % 4 === 2) { this.playNoise(actualTime, 0.03, 0.15, 'hat'); }
          if (beatNumber % 16 === 4 || beatNumber % 16 === 12) { this.playNoise(actualTime, 0.1, 0.3, 'snare'); }

      } else if (this.currentBgmType === 'survivor_metal') {
          const measure = Math.floor(beatNumber / 16) % 4;
          if (beatNumber % 4 === 0) this.playNoise(actualTime, 0.05, 0.9, 'kick');
          if (beatNumber % 16 === 4 || beatNumber % 16 === 12) this.playNoise(actualTime, 0.1, 0.7, 'snare');
          if (beatNumber % 2 === 0) this.playNoise(actualTime, 0.02, 0.3, 'hat');
          let root = 82.41;
          if (measure === 1) root = 65.41;
          if (measure === 2) root = 98.00;
          if (measure === 3) root = 73.42;
          if (beatNumber % 2 === 0) {
              this.playOsc(root, actualTime, 0.1, 'sawtooth', 0.6, this.bgmGain);
              this.playOsc(root/2, actualTime, 0.1, 'square', 0.4, this.bgmGain);
          }
          const arp = [
              220, 329, 440, 329, 261, 392, 293, 220, 
              174, 261, 349, 261, 174, 349, 261, 174, 
              196, 293, 392, 293, 196, 392, 293, 196, 
              164, 246, 329, 246, 164, 329, 246, 164  
          ];
          const melodyNote = arp[beatNumber % 32];
          if (melodyNote) {
              this.playOsc(melodyNote, actualTime, 0.12, 'square', 0.15, this.bgmGain);
              this.playOsc(melodyNote * 1.005, actualTime, 0.12, 'sawtooth', 0.1, this.bgmGain); 
          }
      } else if (this.currentBgmType === 'school_psyche') {
          const section = Math.floor((t % 256) / 64);
          if (t % 32 === 0) {
              const droneNote = (section % 2 === 0) ? 98.00 : 87.31; 
              this.playOsc(droneNote, actualTime, 6.0, 'sine', 0.1, this.bgmGain);
              this.playOsc(droneNote * 1.01 + (Math.random()*2), actualTime, 5.0, 'triangle', 0.05, this.bgmGain);
          }
          if (t % 8 === 0) {
              const noteIdx = (t / 8) % this.chimeMelody.length;
              let freq = this.chimeMelody[noteIdx];
              if (freq > 0) {
                  let wave: OscillatorType = 'sine';
                  let detune = 0;
                  if (section >= 1) detune = (Math.random() - 0.5) * 10;
                  if (section === 2) wave = 'triangle';
                  if (section === 3) { wave = 'sawtooth'; freq /= 2; }
                  this.playOsc(freq + detune, actualTime, 2.0, wave, 0.1, this.bgmGain);
                  if (section > 0) this.playOsc((freq + detune) * 2, actualTime + 0.3, 1.0, 'sine', 0.05, this.bgmGain);
              }
          }
          if (section >= 1) {
              if (t % 7 === 0) this.playOsc(1500, actualTime, 0.05, 'square', 0.02, this.bgmGain);
              if (t % 11 === 0 && section >= 2) this.playNoise(actualTime, 0.02, 0.05, 'hat');
              if (t % 13 === 0 && section === 3) this.playOsc(196 * 4, actualTime, 0.1, 'sawtooth', 0.03, this.bgmGain);
          }
          if (Math.random() < 0.02) {
              const freq = 400 + Math.random() * 400;
              this.playOsc(freq, actualTime, 3.0, 'triangle', 0.05, this.bgmGain);
          }
      } else if (this.currentBgmType === 'dungeon_gym') {
          if (beatNumber % 4 === 0) this.playNoise(actualTime, 0.1, 0.5, 'kick');
          if (beatNumber % 4 === 2) this.playNoise(actualTime, 0.1, 0.3, 'snare');
          if (beatNumber % 2 === 0) this.playOsc(110, actualTime, 0.1, 'sawtooth', 0.1, this.bgmGain); 
          if (beatNumber % 8 === 0) {
              this.playOsc(440, actualTime, 0.2, 'square', 0.1, this.bgmGain); 
              this.playOsc(660, actualTime + 0.1, 0.1, 'square', 0.1, this.bgmGain);
          }
      } else if (this.currentBgmType === 'dungeon_science') {
          if (beatNumber % 2 === 0) this.playOsc(150, actualTime, 0.05, 'sine', 0.2, this.bgmGain);
          if (Math.random() < 0.3) {
              const freq = 800 + Math.random() * 1000;
              this.playOsc(freq, actualTime, 0.05, 'square', 0.05, this.bgmGain);
          }
          if (beatNumber % 8 === 0) {
              this.playOsc(220, actualTime, 0.5, 'triangle', 0.1, this.bgmGain);
          }
      } else if (this.currentBgmType === 'dungeon_music') {
          const arp = [261, 329, 392, 523];
          const note = arp[beatNumber % 4];
          if (note) this.playOsc(note, actualTime, 0.3, 'sine', 0.1, this.bgmGain);
          if (beatNumber % 16 === 0) this.playChord([261, 329, 392], actualTime, 1.0, 'triangle', 0.1);
      } else if (this.currentBgmType === 'dungeon_library') {
          if (beatNumber % 16 === 0) this.playNoise(actualTime, 0.05, 0.05, 'hat'); 
          if (Math.random() < 0.1) {
              this.playOsc(300, actualTime, 0.5, 'sine', 0.05, this.bgmGain);
          }
      } else if (this.currentBgmType === 'dungeon_roof') {
          if (beatNumber % 32 === 0) {
              this.playNoise(actualTime, 2.0, 0.05, 'snare'); 
          }
          if (beatNumber % 8 === 0) {
              const melody = [440, 392, 349, 329];
              const note = melody[Math.floor(beatNumber / 8) % 4];
              this.playOsc(note, actualTime, 0.8, 'triangle', 0.1, this.bgmGain);
          }
      } else if (this.currentBgmType === 'dungeon_boss') {
          if (beatNumber % 2 === 0) this.playNoise(actualTime, 0.1, 0.6, 'kick');
          if (beatNumber % 4 === 0) this.playChord([110, 164, 196], actualTime, 0.2, 'sawtooth', 0.3); 
          if (beatNumber % 2 !== 0) this.playOsc(110, actualTime, 0.1, 'square', 0.2, this.bgmGain); 
      } else if (this.currentBgmType === 'kocho_setup') {
          // --- KOCHO SETUP/SHOP THEME ---
          const measure = Math.floor(t / 16) % 4;
          if (beatNumber % 4 === 0) {
              const roots = [110, 123, 130, 146];
              this.playOsc(roots[measure], actualTime, 0.3, 'triangle', 0.4, this.bgmGain);
          }
          if (beatNumber % 16 === 0) {
              const chords = [[261, 329, 392], [293, 349, 440], [261, 311, 392], [246, 311, 370]];
              this.playChord(chords[measure], actualTime, 1.5, 'sine', 0.2);
          }
          if (beatNumber % 8 === 2) this.playNoise(actualTime, 0.02, 0.1, 'hat');

      } else if (this.currentBgmType === 'kocho_battle') {
          // --- KOCHO BATTLE THEME ---
          if (beatNumber % 4 === 0) this.playNoise(actualTime, 0.1, 0.7, 'kick');
          if (beatNumber % 4 === 2) this.playNoise(actualTime, 0.08, 0.5, 'snare');
          if (beatNumber % 2 === 0) {
              const bass = (Math.floor(t / 16) % 2 === 0) ? 82 : 73;
              this.playOsc(bass, actualTime, 0.15, 'sawtooth', 0.5, this.bgmGain);
          }
          const scale = [329, 349, 392, 440, 493, 523];
          if (beatNumber % 4 === 0 && Math.random() > 0.5) {
              const note = scale[Math.floor(Math.random() * scale.length)];
              this.playOsc(note, actualTime, 0.1, 'square', 0.2, this.bgmGain);
          }

      } else if (this.currentBgmType === 'kocho_boss') {
          // --- KOCHO BOSS THEME ---
          if (beatNumber % 2 === 0) this.playNoise(actualTime, 0.1, 0.8, 'kick');
          if (beatNumber % 4 === 2) this.playNoise(actualTime, 0.1, 0.6, 'snare');
          const bass = [55, 55, 61, 65, 55, 55, 61, 48];
          this.playOsc(bass[beatNumber % 8], actualTime, 0.1, 'sawtooth', 0.6, this.bgmGain);
          
          const leadScale = [220, 246, 261, 293, 329, 349, 415];
          if (beatNumber % 2 !== 0) {
              const note = leadScale[Math.floor(Math.random() * leadScale.length)];
              this.playOsc(note, actualTime, 0.1, 'square', 0.3, this.bgmGain);
          }
          if (beatNumber === 0) this.playChord([110, 138, 164], actualTime, 0.5, 'sawtooth', 0.4);

      } else if (this.currentBgmType === 'paper_plane_battle') {
        const scale = [164.81, 196.00, 220.00, 246.94, 293.66]; 
        if (t % 32 === 0) {
            const root = 82.41; 
            this.playOsc(root, actualTime, 4.0, 'sine', 0.15, this.bgmGain);
            this.playOsc(root * 1.5, actualTime, 4.0, 'triangle', 0.03, this.bgmGain); 
        }
        if (beatNumber % 4 === 0) {
            if (Math.random() < 0.4) {
                 const note = scale[Math.floor(Math.random() * scale.length)];
                 this.playOsc(note, actualTime, 0.4, 'sawtooth', 0.08, this.bgmGain);
            }
        }
        if (t % 64 === 16) {
            this.playOsc(659.25, actualTime, 1.0, 'sine', 0.1, this.bgmGain); 
            this.playOsc(587.33, actualTime + 1.0, 0.5, 'sine', 0.1, this.bgmGain); 
            this.playOsc(493.88, actualTime + 1.5, 2.0, 'sine', 0.1, this.bgmGain); 
        }
        if (beatNumber === 0 && Math.random() < 0.3) {
            this.playNoise(actualTime, 2.0, 0.03, 'hat'); 
        }
      } else if (this.currentBgmType === 'paper_plane_setup') {
          if (beatNumber % 8 === 0) {
              this.playOsc(55, actualTime, 1.5, 'square', 0.1, this.bgmGain);
          }
          if (beatNumber % 4 === 0) {
              this.playNoise(actualTime, 0.05, 0.05, 'hat');
          }
          if (t % 16 === 0) {
              const arp = [440, 523, 659, 880];
              const note = arp[Math.floor(t / 16) % 4];
              this.playOsc(note, actualTime, 0.1, 'triangle', 0.05, this.bgmGain);
          }
      } else if (this.currentBgmType === 'paper_plane_vacation') {
          if (beatNumber % 8 === 0) {
              this.playChord([349, 440, 523, 659], actualTime, 2.0, 'sine', 0.15);
          } else if (beatNumber % 8 === 4) {
              this.playChord([392, 493, 587, 698], actualTime, 2.0, 'sine', 0.15);
          }
          const clave = [0, 3, 6, 10, 12]; 
          if (clave.includes(t % 16)) {
              this.playNoise(actualTime, 0.02, 0.05, 'snare');
          }
          if (beatNumber % 4 === 0 && Math.random() < 0.5) {
              const scale = [523, 587, 659, 698, 783];
              const note = scale[Math.floor(Math.random() * scale.length)];
              this.playOsc(note, actualTime, 0.4, 'triangle', 0.1, this.bgmGain);
          }
      } else if (this.currentBgmType === 'relic_select') {
          const measure = Math.floor(t / 16) % 4;
          if (beatNumber % 16 === 0) {
              const roots = [220.00, 174.61, 196.00, 164.81]; 
              const root = roots[measure];
              this.playOsc(root / 2, actualTime, 4.0, 'sine', 0.15, this.bgmGain);
              this.playOsc(root, actualTime, 4.0, 'triangle', 0.05, this.bgmGain);
          }
          if (beatNumber % 2 === 0) {
              const chords = [
                  [440.00, 523.25, 659.25, 783.99, 987.77], 
                  [349.23, 440.00, 523.25, 659.25, 880.00], 
                  [392.00, 493.88, 587.33, 659.25, 783.99], 
                  [329.63, 392.00, 493.88, 587.33, 659.25]  
              ];
              const currentChord = chords[measure];
              const noteIdx = Math.floor(Math.random() * currentChord.length);
              const note = currentChord[noteIdx];
              this.playOsc(note, actualTime, 0.4, 'sine', 0.1, this.bgmGain);
              if (Math.random() < 0.3) {
                  this.playOsc(note * 2, actualTime + 0.1, 0.3, 'sine', 0.05, this.bgmGain); 
              }
          }
          if (beatNumber % 8 === 0) {
              this.playOsc(880, actualTime, 1.5, 'triangle', 0.05, this.bgmGain);
          }
      }
  }

  private playOscillatorBGM(type: string) {
      if (type === 'battle') { this.tempo = 135; }
      else if (type === 'mid_boss') { this.tempo = 150; }
      else if (type === 'boss') { this.tempo = 140; }
      else if (type === 'final_boss') { this.tempo = 170; }
      else if (type === 'menu') { this.tempo = 90; }
      else if (type === 'map') { this.tempo = 100; }
      else if (type === 'shop') { this.tempo = 90; this.swing = 0.3; }
      else if (type === 'event') { this.tempo = 80; }
      else if (type === 'rest') { this.tempo = 70; }
      else if (type === 'reward') { this.tempo = 110; }
      else if (type === 'victory') { this.tempo = 120; }
      else if (type === 'game_over') { this.tempo = 60; }
      else if (type === 'math') { this.tempo = 110; }
      else if (type === 'poker_play') { this.tempo = 120; this.swing = 0.6; }
      else if (type === 'poker_shop') { this.tempo = 90; }
      else if (type === 'survivor_metal') { this.tempo = 170; }
      else if (type === 'school_psyche') { this.tempo = 100; }
      else if (type === 'dungeon_gym') { this.tempo = 110; }
      else if (type === 'dungeon_science') { this.tempo = 125; }
      else if (type === 'dungeon_music') { this.tempo = 90; }
      else if (type === 'dungeon_library') { this.tempo = 60; }
      else if (type === 'dungeon_roof') { this.tempo = 80; }
      else if (type === 'dungeon_boss') { this.tempo = 150; }
      else if (type === 'kocho_setup') { this.tempo = 95; }
      else if (type === 'kocho_battle') { this.tempo = 145; }
      else if (type === 'kocho_boss') { this.tempo = 160; }
      else if (type === 'paper_plane_battle') { this.tempo = 90; }
      else if (type === 'paper_plane_setup') { this.tempo = 80; }
      else if (type === 'paper_plane_vacation') { this.tempo = 110; }
      else if (type === 'relic_select') { this.tempo = 80; }
      else { this.tempo = 90; }

      this.current16thNote = 0;
      this.total16thNotes = 0;
      if (this.ctx) this.nextNoteTime = this.ctx.currentTime + 0.1;
      this.scheduler();
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
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.02); 
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + duration);
  }

  private playChord(freqs: number[], time: number, duration: number, type: OscillatorType, vol: number) {
      if (!this.bgmGain) return;
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
      } else { 
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
  public async playBGM(type: 'battle' | 'mid_boss' | 'boss' | 'final_boss' | 'menu' | 'map' | 'shop' | 'event' | 'rest' | 'reward' | 'victory' | 'game_over' | 'math' | 'poker_shop' | 'poker_play' | 'survivor_metal' | 'school_psyche' | 'dungeon_gym' | 'dungeon_science' | 'dungeon_music' | 'dungeon_library' | 'dungeon_roof' | 'dungeon_boss' | 'paper_plane_setup' | 'paper_plane_battle' | 'paper_plane_vacation' | 'relic_select' | 'kocho_setup' | 'kocho_battle' | 'kocho_boss' | 'random', loop: boolean = true) {
      if (type === 'random') {
          await this.playRandomBGM();
          return;
      }
      
      if (this.isPlayingBGM && this.currentBgmType === type) return;
      this.init(); 
      this.stopBGM();
      this.currentBgmType = type;
      this.isPlayingBGM = true;
      this.swing = 0; 
      if (this.bgmMode === 'STUDY') return;

      if (this.bgmMode === 'MP3') {
          await this.playMp3(type, loop);
      } else {
          this.playOscillatorBGM(type);
      }
  }

  public async playRandomBGM() {
      const candidates = this.bgmList.filter(t => t !== this.currentBgmType);
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      await this.playBGM(next as any, false);
  }

  private async playMp3(type: string, loop: boolean) {
      if (!this.ctx || !this.bgmGain) return;
      let buffer = this.audioBuffers[type];
      if (!buffer) {
          const baseUrl = (import.meta as any).env.BASE_URL;
          const paths = [`${baseUrl}bgm/${type}.mp3`, `/bgm/${type}.mp3`, `bgm/${type}.mp3`, `/${type}.mp3`, `${type}.mp3` ];
          for (const path of paths) {
              try {
                  const response = await fetch(path);
                  if (response.ok) {
                      const arrayBuffer = await response.arrayBuffer();
                      buffer = await this.ctx.decodeAudioData(arrayBuffer);
                      this.audioBuffers[type] = buffer;
                      break; 
                  }
              } catch (e) {}
          }
      }
      if (!buffer) {
          this.playOscillatorBGM(type);
          return;
      }
      if (!this.isPlayingBGM || this.currentBgmType !== type) return;
      if (this.bgmMode !== 'MP3') return;

      try {
          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = loop;
          source.connect(this.bgmGain);
          source.onended = () => {
              if (this.isPlayingBGM && !loop) {
                  this.playRandomBGM();
              }
          };
          source.start(0);
          this.currentSource = source;
      } catch (e) {
          console.error("Audio playback error:", e);
      }
  }

  public stopBGM() {
      if (this.timerID) clearTimeout(this.timerID);
      this.timerID = null;
      if (this.currentSource) {
          try {
              this.currentSource.onended = null;
              this.currentSource.stop();
              this.currentSource.disconnect();
          } catch(e) {}
          this.currentSource = null;
      }
      this.isPlayingBGM = false;
      this.currentBgmType = null;
  }

  public toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.masterGain && this.ctx) {
          this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime, 0.1);
      }
  }

  public playSound(effect: 'select' | 'attack' | 'block' | 'win' | 'lose' | 'correct' | 'wrong' | 'buff' | 'debuff' | 'damage') {
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
          case 'buff':
              this.playOsc(400, t, 0.1, 'sine', 0.3, this.sfxGain);
              this.playOsc(600, t + 0.1, 0.1, 'sine', 0.3, this.sfxGain);
              this.playOsc(1000, t + 0.2, 0.3, 'sine', 0.2, this.sfxGain);
              break;
          case 'debuff':
              this.playOsc(500, t, 0.1, 'sawtooth', 0.3, this.sfxGain);
              this.playOsc(400, t + 0.1, 0.1, 'sawtooth', 0.3, this.sfxGain);
              this.playOsc(300, t + 0.2, 0.3, 'sawtooth', 0.2, this.sfxGain);
              break;
          case 'damage':
              this.playOsc(150, t, 0.1, 'square', 0.3, this.sfxGain);
              this.playOsc(100, t, 0.15, 'sawtooth', 0.3, this.sfxGain);
              this.playNoise(t, 0.1, 0.5, 'kick');
              break;
      }
  }
}

export const audioService = new AudioService();
