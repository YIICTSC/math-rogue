
import type { AttackEffectKey, StatusEffectKey } from '../types';
import type { VisualThemeId } from '../data/visualThemes';
import { getHumanoidEnemyVoiceProfile, type HumanoidEnemyVoiceAction } from '../data/humanoidEnemyVoiceLines';
import { assetUrl } from '../utils/assetPaths';

export type BgmThemeId = VisualThemeId | 'magic-female' | 'magic-male';

declare const __APP_ASSET_VERSION__: string | undefined;

const APP_ASSET_VERSION = typeof __APP_ASSET_VERSION__ === 'string' ? __APP_ASSET_VERSION__ : 'dev';
const versionBgmPath = (path: string) =>
    `${path}${path.includes('?') ? '&' : '?'}v=${encodeURIComponent(APP_ASSET_VERSION)}`;
const IS_IOS_BUILD = String(import.meta.env.VITE_APP_PLATFORM || '').trim().toLowerCase() === 'ios';

type CommonSoundEffect =
  | 'select'
  | 'attack'
  | 'block'
  | 'win'
  | 'lose'
  | 'correct'
  | 'wrong'
  | 'buff'
  | 'debuff'
  | 'damage'
  | 'explosion'
  | 'finisher_slash'
  | 'finisher_explosion'
  | 'jump';

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  private isMuted: boolean = false;
  private isPlayingBGM: boolean = false;
  private isBgmPaused: boolean = false;
  private hasUnlockedAudio: boolean = false;
  private backgroundPlaybackEnabled: boolean = false;
  private isLooping: boolean = true;
  private currentBgmType: string | null = null;
  private bgmAdvanceMode: 'random' | 'sorted' = 'random';
  private bgmSequence: string[] = [];
  
  private bgmMode: 'OSCILLATOR' | 'NEW' | 'OLD' | 'STUDY' = 'NEW';
  private bgmTheme: BgmThemeId = 'elementary';
  private bgmVolume: number = 1;
  private sfxVolume: number = 0.6;
  private voiceVolume: number = 0.8;
  private audioBuffers: Record<string, AudioBuffer> = {};
  private sfxBuffers: Record<string, AudioBuffer> = {};
  private sfxLoadPromises: Record<string, Promise<AudioBuffer | null> | undefined> = {};
  private activeSfxSources: Map<string, Set<AudioBufferSourceNode>> = new Map();
  private activeHtmlSfx: Map<string, Set<HTMLAudioElement>> = new Map();
  private htmlSfxStopTimers: WeakMap<HTMLAudioElement, number> = new WeakMap();
  private sfxPlaybackGenerations: Map<string, number> = new Map();
  private magicEventVoiceSequenceId = 0;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentHtmlAudio: HTMLAudioElement | null = null;
  private activeBgmHtmlAudios: Set<HTMLAudioElement> = new Set();
  private bgmMediaSources: Map<HTMLAudioElement, MediaElementAudioSourceNode> = new Map();
  private playbackGeneration: number = 0;
  private pausedForAppBackground: boolean = false;
  private backgroundSuspendPromise: Promise<void> = Promise.resolve();
  private foregroundRecoveryPromise: Promise<void> | null = null;
  private appIsActive: boolean = true;
  private appLifecycleGeneration: number = 0;

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
    'dungeon_library', 'dungeon_roof', 'battle', 'boss', 'mid_boss', 'final_boss', 'dungeon_boss',
    'kocho_setup', 'kocho_battle', 'kocho_boss', 'poker_shop', 'poker_play', 'survivor_metal',
    'paper_plane_battle', 'paper_plane_setup', 'paper_plane_vacation', 'relic_select',
    'menu', 'map', 'shop', 'event', 'rest', 'reward', 'math', 'victory', 'game_over'
  ];
  private unplayedBgmList: string[] = [...this.bgmList];

  constructor() {}

  private parseBgmSequenceEntry(entry: string): { theme?: BgmThemeId; type: string } {
      const separatorIndex = entry.indexOf('::');
      if (separatorIndex === -1) return { type: entry };
      const theme = entry.slice(0, separatorIndex) as BgmThemeId;
      const type = entry.slice(separatorIndex + 2);
      return { theme, type };
  }

  public init() {
    if (this.ctx?.state === 'closed') {
        this.ctx = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.currentSource = null;
        this.currentHtmlAudio = null;
        this.activeBgmHtmlAudios.clear();
        this.bgmMediaSources.clear();
    }
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
    this.bgmGain.gain.value = this.bgmVolume;
    this.bgmGain.connect(this.masterGain);

    // SFX Bus
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    // Create Noise Buffer for Percussion
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds buffer
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
  }

  private async resumeAudioContext(attempts = 1) {
      const retryCount = Math.max(1, attempts);
      for (let attempt = 0; attempt < retryCount; attempt++) {
          this.init();
          if (!this.ctx) return false;
          if ((this.ctx.state as AudioContextState) === 'running') return true;
          // WKWebView can complete a background suspend after the first foreground
          // resume request. Retrying after the suspend has settled prevents the
          // context from being left permanently silent.
          await Promise.race([
              this.ctx.resume().catch(() => undefined),
              new Promise<void>(resolve => window.setTimeout(resolve, 300)),
          ]);
          if ((this.ctx.state as AudioContextState) === 'running') return true;
          if (attempt + 1 < retryCount) {
              await new Promise<void>(resolve => window.setTimeout(resolve, 150 * (attempt + 1)));
          }
      }
      return this.ctx?.state === 'running';
  }

  public setBgmMode(mode: 'OSCILLATOR' | 'MP3' | 'NEW' | 'OLD' | 'STUDY') {
      const normalizedMode = mode === 'MP3' ? 'NEW' : mode;
      if (this.bgmMode === normalizedMode) return;
      this.bgmMode = normalizedMode;
      
      // If currently playing, restart with new mode
      if (this.isPlayingBGM && this.currentBgmType) {
          const type = this.currentBgmType;
          const loop = this.isLooping;
          this.stopBGM();
          this.playBGM(type as any, loop);
      }
  }

  public getBgmMode() {
      return this.bgmMode;
  }

  public async setBgmTheme(theme: BgmThemeId) {
      if (this.bgmTheme === theme) return;
      this.bgmTheme = theme;
      await this.restartCurrentBGM();
  }

  public setBackgroundPlaybackEnabled(enabled: boolean) {
      this.backgroundPlaybackEnabled = enabled;
  }

  public isBackgroundPlaybackEnabled() {
      return this.backgroundPlaybackEnabled;
  }

  public async unlockAudio() {
      if (!this.appIsActive || (typeof document !== 'undefined' && document.hidden)) return;
      const lifecycleGeneration = this.appLifecycleGeneration;
      const contextReady = await this.resumeAudioContext(IS_IOS_BUILD ? 3 : 1);
      // A pointer event can start this asynchronous recovery immediately before
      // iOS backgrounds the app. Never let that stale gesture restart BGM after
      // the background pause has won.
      if (
          !this.appIsActive
          || lifecycleGeneration !== this.appLifecycleGeneration
          || (typeof document !== 'undefined' && document.hidden)
      ) return;
      if (!this.ctx) return;
      const needsPlaybackRetry = (
          this.isPlayingBGM
          && this.bgmMode !== 'STUDY'
          && !this.isBgmPaused
          && (
              (!this.currentSource && !this.currentHtmlAudio)
              || (IS_IOS_BUILD && Boolean(this.currentHtmlAudio?.paused))
              // iOS BGM is played directly by HTMLAudioElement. CarPlay can keep
              // Web Audio suspended while that element is healthy, so a suspended
              // context must not restart the music on every screen touch.
              || (!IS_IOS_BUILD && !contextReady)
          )
      );
      this.hasUnlockedAudio = true;
      if (needsPlaybackRetry) {
          await this.restartCurrentBGM();
      }
  }

  public handleAppBackground() {
      if (this.backgroundPlaybackEnabled) return;
      if (this.appIsActive) {
          this.appIsActive = false;
          this.appLifecycleGeneration += 1;
      }
      this.pausedForAppBackground = this.pausedForAppBackground || this.isPlayingBGM;
      const previousSuspend = this.backgroundSuspendPromise;
      const currentSuspend = this.pauseBGM();
      // Both Capacitor and document visibility can report the same transition.
      // Preserve every in-flight suspend instead of replacing the first promise
      // with an already-resolved duplicate call.
      this.backgroundSuspendPromise = Promise.all([previousSuspend, currentSuspend]).then(() => undefined);
      this.magicEventVoiceSequenceId += 1;
      for (const name of Array.from(new Set([
          ...this.activeSfxSources.keys(),
          ...this.activeHtmlSfx.keys(),
      ]))) {
          this.stopActiveSfx(name);
      }
  }

  public async handleAppForeground() {
      if (!this.appIsActive) {
          this.appIsActive = true;
          this.appLifecycleGeneration += 1;
      }
      if (this.foregroundRecoveryPromise) return this.foregroundRecoveryPromise;
      const lifecycleGeneration = this.appLifecycleGeneration;
      const recovery = (async () => {
          const shouldRestartBgm = (
              this.pausedForAppBackground
              && this.isPlayingBGM
              && Boolean(this.currentBgmType)
              && this.bgmMode !== 'STUDY'
          );
          this.pausedForAppBackground = false;
          // Wait for the background suspend request before asking iOS to resume.
          // Without this ordering, suspend() can win the race and silence both
          // Web Audio SE and MP3 BGM after returning to the app.
          await this.backgroundSuspendPromise.catch(() => undefined);
          await this.resumeAudioContext(IS_IOS_BUILD ? 4 : 1);
          if (
              shouldRestartBgm
              && this.appIsActive
              && lifecycleGeneration === this.appLifecycleGeneration
              && (typeof document === 'undefined' || !document.hidden)
          ) {
              this.isBgmPaused = false;
              await this.restartCurrentBGM();
          }
      })();
      this.foregroundRecoveryPromise = recovery;
      try {
          await recovery;
      } finally {
          if (this.foregroundRecoveryPromise === recovery) {
              this.foregroundRecoveryPromise = null;
          }
      }
  }

  private async restartCurrentBGM() {
      if (!this.currentBgmType || !this.isPlayingBGM || this.bgmMode === 'STUDY') return;
      const type = this.currentBgmType;
      const loop = this.isLooping;
      this.stopBGM();
      await this.playBGM(type as any, loop);
  }

  public setBgmVolume(volume: number) {
      this.bgmVolume = Math.max(0, Math.min(1.5, volume));
      if (this.bgmGain && this.ctx) {
          this.bgmGain.gain.setTargetAtTime(this.bgmVolume, this.ctx.currentTime, 0.05);
      }
      if (this.currentHtmlAudio) {
          this.currentHtmlAudio.volume = this.bgmMediaSources.has(this.currentHtmlAudio)
              ? 1
              : Math.min(1, this.bgmVolume);
      }
      this.activeBgmHtmlAudios.forEach(audio => {
          audio.volume = this.bgmMediaSources.has(audio) ? 1 : Math.min(1, this.bgmVolume);
      });
  }

  public getBgmVolume() {
      return this.bgmVolume;
  }

  public setSfxVolume(volume: number) {
      this.sfxVolume = Math.max(0, Math.min(1.5, volume));
      if (this.sfxGain && this.ctx) {
          this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
      }
      this.activeHtmlSfx.forEach((audios, name) => {
          if (this.isVoiceSfxName(name)) return;
          audios.forEach(audio => {
              audio.volume = Math.min(1, this.sfxVolume);
          });
      });
  }

  public getSfxVolume() {
      return this.sfxVolume;
  }

  public setVoiceVolume(volume: number) {
      this.voiceVolume = Math.max(0, Math.min(1.5, volume));
      this.activeHtmlSfx.forEach((audios, name) => {
          if (!this.isVoiceSfxName(name)) return;
          audios.forEach(audio => {
              audio.volume = Math.min(1, this.voiceVolume);
          });
      });
  }

  public getVoiceVolume() {
      return this.voiceVolume;
  }

  public getBgmTrackList() {
      return [...this.bgmList] as const;
  }

  public getBgmTheme() {
      return this.bgmTheme;
  }

  public setBgmAdvanceMode(mode: 'random' | 'sorted', sequence?: string[]) {
      this.bgmAdvanceMode = mode;
      this.bgmSequence = sequence && sequence.length > 0 ? [...sequence] : [...this.bgmList];
      this.unplayedBgmList = [...this.bgmSequence];
  }

  public getBgmAdvanceMode() {
      return this.bgmAdvanceMode;
  }

  public getCurrentBgmType() {
      return this.currentBgmType;
  }

  public getIsBgmPaused() {
      return this.isBgmPaused;
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

      // ランダム再生（ループなし）の場合、一定小節（例：32小節＝512個の16分音符）で次の曲へ
      if (!this.isLooping && this.current16thNote === 0 && this.total16thNotes > 0 && this.total16thNotes % 512 === 0) {
          if (this.bgmAdvanceMode === 'sorted') {
              this.playNextSequentialBGM();
          } else {
              this.playRandomBGM();
          }
          return;
      }

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
      this.isBgmPaused = false;
      this.isLooping = loop;
      const playbackGeneration = this.playbackGeneration;
      this.swing = 0; 
      if (this.bgmMode === 'STUDY') return;

      if (this.bgmMode === 'NEW' || this.bgmMode === 'OLD') {
          await this.playMp3(type, loop, playbackGeneration);
      } else {
          this.playOscillatorBGM(type);
      }
  }

  public async switchThemeAndPlayBGM(theme: BgmThemeId, type: 'battle' | 'mid_boss' | 'boss' | 'final_boss' | 'menu' | 'map' | 'shop' | 'event' | 'rest' | 'reward' | 'victory' | 'game_over' | 'math' | 'poker_shop' | 'poker_play' | 'survivor_metal' | 'school_psyche' | 'dungeon_gym' | 'dungeon_science' | 'dungeon_music' | 'dungeon_library' | 'dungeon_roof' | 'dungeon_boss' | 'paper_plane_setup' | 'paper_plane_battle' | 'paper_plane_vacation' | 'relic_select' | 'kocho_setup' | 'kocho_battle' | 'kocho_boss', loop: boolean = true) {
      this.bgmTheme = theme;
      this.stopBGM();
      await this.playBGM(type, loop);
  }

  public async playRandomBGM() {
      // Refresh the pool if empty
      if (this.unplayedBgmList.length === 0) {
          this.unplayedBgmList = this.bgmSequence.length > 0 ? [...this.bgmSequence] : [...this.bgmList];
      }

      // Filter out current BGM if possible to prevent immediate repeats on pool refresh
      let candidates = this.unplayedBgmList;
      if (candidates.length > 1 && this.currentBgmType) {
          candidates = candidates.filter(entry => {
              const parsed = this.parseBgmSequenceEntry(entry);
              return parsed.type !== this.currentBgmType || (parsed.theme && parsed.theme !== this.bgmTheme);
          });
      }

      const nextIndex = Math.floor(Math.random() * candidates.length);
      const next = candidates[nextIndex];
      const parsed = this.parseBgmSequenceEntry(next);
      
      // Remove from unplayed list
      this.unplayedBgmList = this.unplayedBgmList.filter(t => t !== next);
      if (parsed.theme) this.bgmTheme = parsed.theme;

      // ランダム再生時は自動で次へ行くように loop=false にする
      await this.playBGM(parsed.type as any, false);
  }

  public async playNextSequentialBGM() {
      const sequence = this.bgmSequence.length > 0 ? this.bgmSequence : [...this.bgmList];
      if (sequence.length === 0) return;
      const currentIndex = this.currentBgmType
          ? sequence.findIndex(track => {
              const parsed = this.parseBgmSequenceEntry(track);
              return parsed.type === this.currentBgmType && (!parsed.theme || parsed.theme === this.bgmTheme);
          })
          : -1;
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % sequence.length : 0;
      const parsed = this.parseBgmSequenceEntry(sequence[nextIndex]);
      if (parsed.theme) this.bgmTheme = parsed.theme;
      await this.playBGM(parsed.type as any, false);
  }

  private async playMp3(type: string, loop: boolean, playbackGeneration: number) {
      if (!this.ctx || !this.bgmGain) return;
      if (!this.isCurrentPlayback(type, playbackGeneration)) return;
      const bgmRoot = this.bgmMode === 'NEW' ? 'bgm-new' : 'bgm';
      const resolvedTheme = this.bgmTheme === 'magic-female' && type === 'menu'
          ? 'magic'
          : this.bgmTheme;
      const themedPaths = resolvedTheme !== 'elementary'
          ? [
              assetUrl(`${bgmRoot}/${resolvedTheme}/${type}.mp3`),
              `/${bgmRoot}/${resolvedTheme}/${type}.mp3`,
              `${bgmRoot}/${resolvedTheme}/${type}.mp3`,
          ]
          : [];
      const sharedMagicPaths = resolvedTheme.startsWith('magic-')
          ? [
              assetUrl(`${bgmRoot}/magic/${type}.mp3`),
              `/${bgmRoot}/magic/${type}.mp3`,
              `${bgmRoot}/magic/${type}.mp3`,
          ]
          : [];
      const paths = [
          ...themedPaths,
          ...sharedMagicPaths,
          assetUrl(`${bgmRoot}/${type}.mp3`),
          `/${bgmRoot}/${type}.mp3`,
          `${bgmRoot}/${type}.mp3`,
          `/${type}.mp3`,
          `${type}.mp3`
      ].map(versionBgmPath);
      // WKWebView can leave a decoded Web Audio source silent even after the context is
      // resumed. Native iOS builds therefore use the media element path first, while the
      // existing Web Audio decoder remains the fallback for malformed/unsupported files.
      if (IS_IOS_BUILD && await this.playHtmlAudioMp3(paths, loop, type, playbackGeneration)) return;
      if (!this.isCurrentPlayback(type, playbackGeneration)) return;
      const cacheKey = `${this.bgmMode}:${this.bgmTheme}:${type}`;
      let buffer = this.audioBuffers[cacheKey];
      if (!buffer) {
          for (const path of paths) {
              try {
                  const response = await fetch(path);
                  if (response.ok) {
                      const arrayBuffer = await response.arrayBuffer();
                      buffer = await this.ctx.decodeAudioData(arrayBuffer);
                      this.audioBuffers[cacheKey] = buffer;
                      break; 
                  }
              } catch (e) {}
          }
      }
      if (!buffer) {
          if (!this.isCurrentPlayback(type, playbackGeneration)) return;
          this.playOscillatorBGM(type);
          return;
      }
      if (!this.isCurrentPlayback(type, playbackGeneration)) return;
      if (this.bgmMode !== 'NEW' && this.bgmMode !== 'OLD') return;

      try {
          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = loop;
          source.connect(this.bgmGain);
          source.onended = () => {
              if (this.isPlayingBGM && !loop) {
                  if (this.bgmAdvanceMode === 'sorted') {
                      this.playNextSequentialBGM();
                  } else {
                      this.playRandomBGM();
                  }
              }
          };
          source.start(0);
          this.currentSource = source;
      } catch (e) {
          console.error("Audio playback error:", e);
      }
  }

  private async playHtmlAudioMp3(paths: string[], loop: boolean, type: string, playbackGeneration: number) {
      for (const path of paths) {
          let audio: HTMLAudioElement | null = null;
          try {
              void this.resumeAudioContext();
              audio = new Audio(path);
              audio.preload = 'auto';
              audio.loop = loop;
              // Keep iOS BGM on the media element's native playback path. Routing
              // it through WKWebView's AudioContext makes the stream repeatedly
              // detach and rebuffer when iOS changes output routes (CarPlay,
              // Bluetooth, AirPlay), which sounds like short chopped fragments.
              // SFX/voices can remain on Web Audio; BGM volume is applied directly.
              const routedThroughWebAudio = !IS_IOS_BUILD && this.connectHtmlBgmToGain(audio);
              audio.volume = routedThroughWebAudio ? 1 : Math.min(1, this.bgmVolume);
              audio.onended = () => {
                  if (this.isPlayingBGM && !loop) {
                      if (this.bgmAdvanceMode === 'sorted') {
                          this.playNextSequentialBGM();
                      } else {
                          this.playRandomBGM();
                      }
                  }
              };
              await audio.play();
              if (!this.isCurrentPlayback(type, playbackGeneration)) {
                  audio.pause();
                  audio.currentTime = 0;
                  this.disconnectHtmlBgm(audio);
                  return true;
              }
              this.currentHtmlAudio = audio;
              this.activeBgmHtmlAudios.add(audio);
              return true;
          } catch {
              if (audio) this.disconnectHtmlBgm(audio);
              // Try the next URL shape before falling back to synthesized BGM.
          }
      }
      return false;
  }

  private connectHtmlBgmToGain(audio: HTMLAudioElement) {
      // A media element routed into a suspended WKWebView AudioContext is silent.
      // Keep it on the native media path until Web Audio has actually recovered;
      // the element's own volume still observes the in-game BGM setting.
      if (!this.ctx || !this.bgmGain || this.ctx.state !== 'running') return false;
      try {
          const source = this.ctx.createMediaElementSource(audio);
          source.connect(this.bgmGain);
          this.bgmMediaSources.set(audio, source);
          return true;
      } catch {
          return false;
      }
  }

  private disconnectHtmlBgm(audio: HTMLAudioElement) {
      const source = this.bgmMediaSources.get(audio);
      if (!source) return;
      try {
          source.disconnect();
      } catch {}
      this.bgmMediaSources.delete(audio);
  }

  private isCurrentPlayback(type: string, playbackGeneration: number) {
      return this.isPlayingBGM
          && this.currentBgmType === type
          && this.playbackGeneration === playbackGeneration;
  }

  public stopBGM() {
      this.playbackGeneration += 1;
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
      if (this.currentHtmlAudio) {
          this.currentHtmlAudio.onended = null;
          this.currentHtmlAudio.pause();
          this.currentHtmlAudio.currentTime = 0;
          this.disconnectHtmlBgm(this.currentHtmlAudio);
          this.currentHtmlAudio = null;
      }
      this.activeBgmHtmlAudios.forEach(audio => {
          try {
              audio.onended = null;
              audio.pause();
              audio.currentTime = 0;
          } catch {}
          this.disconnectHtmlBgm(audio);
      });
      this.activeBgmHtmlAudios.clear();
      this.isPlayingBGM = false;
      this.isBgmPaused = false;
      this.currentBgmType = null;
  }

  public pauseBGM(): Promise<void> {
      if (!this.isPlayingBGM || this.isBgmPaused) return Promise.resolve();
      this.activeBgmHtmlAudios.forEach(audio => {
          try {
              audio.pause();
          } catch {}
      });
      this.isBgmPaused = true;
      if (!this.ctx) return Promise.resolve();
      return this.ctx.suspend().then(() => undefined).catch(() => undefined);
  }

  public async resumeBGM() {
      if (!this.ctx || !this.isPlayingBGM || !this.isBgmPaused) return;
      await this.resumeAudioContext();
      const audio = this.currentHtmlAudio;
      if (audio) {
          const resumed = await audio.play().then(() => true).catch(() => false);
          if (!resumed && this.currentBgmType) {
              this.isBgmPaused = false;
              await this.restartCurrentBGM();
              return;
          }
      }
      this.isBgmPaused = false;
  }

  public stopAllAudio() {
      this.stopBGM();
      const activeSfxNames = new Set([
          ...this.activeSfxSources.keys(),
          ...this.activeHtmlSfx.keys(),
      ]);
      for (const name of activeSfxNames) {
          this.stopActiveSfx(name);
      }
      if (!this.ctx || !this.masterGain) return;
      if (this.sfxGain) {
          try {
              this.sfxGain.disconnect();
          } catch {}
      }
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
  }

  public toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.masterGain && this.ctx) {
          this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime, 0.1);
      }
  }

  private playAttackSynth(t: number) {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.6, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.15);
      this.playNoise(t, 0.15, 0.5, 'snare');
  }

  private playExplosionSynth(t: number) {
      if (!this.sfxGain) return;
      this.playOsc(90, t, 0.25, 'sawtooth', 0.45, this.sfxGain);
      this.playOsc(55, t, 0.35, 'triangle', 0.35, this.sfxGain);
      this.playNoise(t, 0.24, 0.9, 'kick');
      this.playNoise(t + 0.03, 0.2, 0.7, 'snare');
  }

  private async loadSfxBuffer(name: string) {
      if (this.sfxBuffers[name]) return this.sfxBuffers[name];
      if (this.sfxLoadPromises[name]) return this.sfxLoadPromises[name];

      const promise = (async () => {
          const paths = [assetUrl(`sfx/${name}.mp3`), `/sfx/${name}.mp3`, `sfx/${name}.mp3`];
          for (const path of paths) {
              try {
                  const response = await fetch(path);
                  if (!response.ok) continue;
                  const arrayBuffer = await response.arrayBuffer();
                  const buffer = await this.ctx!.decodeAudioData(arrayBuffer);
                  this.sfxBuffers[name] = buffer;
                  return buffer;
              } catch {}
          }
          return null;
      })();

      this.sfxLoadPromises[name] = promise;
      const buffer = await promise;
      delete this.sfxLoadPromises[name];
      return buffer;
  }

  public async preloadSfx(names: string[]) {
      this.init();
      if (!this.ctx) return;
      // Decoding does not require the context to be running. On iOS, awaiting
      // resume() outside a user gesture can remain pending indefinitely and used
      // to prevent every bundled SE from being preloaded.
      await Promise.all(names.map(name => this.loadSfxBuffer(name).catch(() => null)));
  }

  public async preloadEssentialSfx() {
      await this.preloadSfx([
          'attack-effects/slash',
          'attack-effects/impact',
          'attack-effects/projectile',
          'attack-effects/explosion',
          'attack-effects/fire',
          'attack-effects/lightning',
          'attack-effects/poison',
          'attack-effects/shockwave',
          'attack-effects/multihit',
          'attack-effects/drain',
          'attack-effects/finisher',
          'attack-effects/laser',
          'attack-effects/soundwave',
          'attack-effects/wind',
          'attack-effects/plant',
          'attack-effects/graduation',
          'attack-effects/critical',
          'attack-effects/flash',
          'status-effects/block',
          'status-effects/buff',
          'status-effects/debuff',
          'status-effects/heal',
          'status-effects/strength',
          'status-effects/weak',
          'status-effects/vulnerable',
          'status-effects/poison',
          'finisher-slash',
          'finisher-explosion',
          'jump',
      ]);
  }

  private stopActiveSfx(name: string) {
      const sources = this.activeSfxSources.get(name);
      if (sources) {
          for (const source of sources) {
              try {
                  source.onended = null;
                  source.stop();
                  source.disconnect();
              } catch {}
          }
          this.activeSfxSources.delete(name);
      }

      const htmlAudios = this.activeHtmlSfx.get(name);
      if (!htmlAudios) return;
      for (const audio of htmlAudios) {
          const timer = this.htmlSfxStopTimers.get(audio);
          if (timer) window.clearTimeout(timer);
          audio.onended = null;
          audio.pause();
          audio.currentTime = 0;
      }
      this.activeHtmlSfx.delete(name);
  }

  private startSfxSource(name: string, buffer: AudioBuffer, maxDurationMs: number, overlap: boolean) {
      if (!this.ctx || !this.sfxGain) return false;
      if (!overlap) this.stopActiveSfx(name);
      try {
          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(this.sfxGain);
          const sources = this.activeSfxSources.get(name) ?? new Set<AudioBufferSourceNode>();
          sources.add(source);
          this.activeSfxSources.set(name, sources);
          source.onended = () => {
              sources.delete(source);
              if (sources.size === 0) this.activeSfxSources.delete(name);
              try {
                  source.disconnect();
              } catch {}
          };
          source.start(0);
          source.stop(this.ctx.currentTime + Math.min(buffer.duration, maxDurationMs / 1000));
          return true;
      } catch {
          return false;
      }
  }

  private async playHtmlSfx(
      name: string,
      paths: string[],
      maxDurationMs: number,
      overlap: boolean,
      generation: number,
  ): Promise<boolean> {
      void this.resumeAudioContext();
      for (const path of paths) {
          try {
              const audio = new Audio(path);
              audio.preload = 'auto';
              const htmlVolume = this.getHtmlSfxVolume(name);
              audio.volume = htmlVolume;
              await audio.play();
              if (!overlap && this.sfxPlaybackGenerations.get(name) !== generation) {
                  audio.pause();
                  audio.currentTime = 0;
                  return true;
              }
              if (!overlap) this.stopActiveSfx(name);

              const audios = this.activeHtmlSfx.get(name) ?? new Set<HTMLAudioElement>();
              audios.add(audio);
              this.activeHtmlSfx.set(name, audios);
              const cleanup = () => {
                  const timer = this.htmlSfxStopTimers.get(audio);
                  if (timer) window.clearTimeout(timer);
                  audios.delete(audio);
                  if (audios.size === 0) this.activeHtmlSfx.delete(name);
              };
              audio.onended = cleanup;
              const timer = window.setTimeout(() => {
                  audio.pause();
                  audio.currentTime = 0;
                  cleanup();
              }, maxDurationMs);
              this.htmlSfxStopTimers.set(audio, timer);
              return await new Promise<boolean>((resolve) => {
                  let settled = false;
                  const settle = () => {
                      if (settled) return;
                      settled = true;
                      resolve(true);
                  };
                  const cleanupAndSettle = () => {
                      cleanup();
                      settle();
                  };
                  audio.onended = cleanupAndSettle;
                  const existingTimer = this.htmlSfxStopTimers.get(audio);
                  if (existingTimer) window.clearTimeout(existingTimer);
                  const settleTimer = window.setTimeout(() => {
                      audio.pause();
                      audio.currentTime = 0;
                      cleanupAndSettle();
                  }, maxDurationMs);
                  this.htmlSfxStopTimers.set(audio, settleTimer);
              });
          } catch {
              // Try the next URL shape before falling back to WebAudio or synth.
          }
      }
      return false;
  }

  private isVoiceSfxName(name: string) {
      return name.startsWith('magic-voice-') || name.startsWith('magic-event-voice-') || name.startsWith('high-school-voice-') || name.startsWith('enemy-voice-');
  }

  private getHtmlSfxVolume(name: string) {
      return this.isVoiceSfxName(name) ? this.voiceVolume : this.sfxVolume;
  }

  private playSfxMp3(name: string, fallback: () => void, options?: { maxDurationMs?: number; overlap?: boolean }) {
      this.init();
      if (!this.ctx || !this.sfxGain) {
          fallback();
          return;
      }

      const maxDurationMs = options?.maxDurationMs ?? 1400;
      const overlap = options?.overlap ?? false;
      const generation = (this.sfxPlaybackGenerations.get(name) ?? 0) + 1;
      this.sfxPlaybackGenerations.set(name, generation);

      const startPlayback = () => {
          const cached = this.sfxBuffers[name];
          if (cached) {
              if (!this.startSfxSource(name, cached, maxDurationMs, overlap)) fallback();
              return;
          }

          // Use the packaged file on the first play too. Waiting for a fetch and
          // falling back immediately made every first mini-game action sound like
          // the old oscillator-only SE, especially on iOS.
          void this.playHtmlSfx(
              name,
              [
                  assetUrl(`sfx/${name}.mp3`),
                  `/sfx/${name}.mp3`,
                  `sfx/${name}.mp3`,
              ],
              maxDurationMs,
              overlap,
              generation,
          ).then(played => {
              if (!played) fallback();
          });
          void this.loadSfxBuffer(name);
      };

      if (this.ctx.state !== 'running') {
          void this.resumeAudioContext().then(ready => {
              if (ready) startPlayback();
          });
          return;
      }
      startPlayback();
  }

  private playAttackSlashSfx() {
      this.playSfxMp3('attack-effects/slash', () => this.playAttackSynth(this.ctx!.currentTime), {
          maxDurationMs: 320,
          overlap: true,
      });
  }

  public playAttackSlashSequence(hitCount: number, intervalMs: number = 80) {
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const count = Math.max(1, Math.min(100, Math.floor(hitCount)));
      for (let i = 0; i < count; i++) {
          window.setTimeout(() => this.playAttackSlashSfx(), i * intervalMs);
      }
  }

  public playAttackEffectSound(effect: AttackEffectKey, hitCount: number = 1) {
      const fallbackByEffect: Record<AttackEffectKey, () => void> = {
          slash: () => this.playAttackSynth(this.ctx!.currentTime),
          impact: () => this.playSound('damage'),
          projectile: () => this.playAttackSynth(this.ctx!.currentTime),
          fire: () => this.playSound('explosion'),
          lightning: () => this.playSound('buff'),
          poison: () => this.playSound('debuff'),
          shockwave: () => this.playSound('explosion'),
          multihit: () => this.playAttackSynth(this.ctx!.currentTime),
          drain: () => this.playSound('buff'),
          finisher: () => this.playSound('finisher_slash'),
          laser: () => this.playSound('buff'),
          soundwave: () => this.playSound('explosion'),
          wind: () => this.playSound('buff'),
          plant: () => this.playSound('buff'),
          graduation: () => this.playSound('finisher_explosion'),
          explosion: () => this.playSound('explosion'),
          critical: () => this.playSound('finisher_slash'),
          flash: () => this.playSound('buff'),
      };
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      if (effect === 'multihit') {
          this.playAttackSlashSequence(hitCount, 80);
          return;
      }
      this.playSfxMp3(`attack-effects/${effect}`, fallbackByEffect[effect], { maxDurationMs: 1400 });
  }

  public playStatusEffectSound(effect: StatusEffectKey) {
      const fallbackByEffect: Record<StatusEffectKey, () => void> = {
          block: () => this.playSound('block'),
          heal: () => this.playSound('buff'),
          buff: () => this.playSound('buff'),
          strength: () => this.playSound('buff'),
          debuff: () => this.playSound('debuff'),
          weak: () => this.playSound('debuff'),
          vulnerable: () => this.playSound('debuff'),
          poison: () => this.playSound('debuff'),
      };
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      this.playSfxMp3(`status-effects/${effect}`, fallbackByEffect[effect], { maxDurationMs: 1400 });
  }

  public playMagicVoice(heroId: string | undefined, action: 'attack' | 'damage' | 'spell' = 'attack', variantCount = 3, spellIndex?: number, transformed = false) {
      const safeAction = action.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
      const voiceName = safeAction === 'spell'
          ? `spell-${Math.max(1, Math.min(3, spellIndex ?? 1))}`
          : `${safeAction}-${Math.floor(Math.random() * Math.max(1, variantCount)) + 1}`;
      this.playMagicVoiceFile(heroId, voiceName, 2200, transformed);
  }

  public playMagicVoiceFile(heroId: string | undefined, voiceName: string | undefined, maxDurationMs = 2200, _transformed = false) {
      if (!heroId || !voiceName) return Promise.resolve(false);
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return Promise.resolve(false);
      const safeHeroId = heroId.replace(/[^A-Z0-9_-]/gi, '').toUpperCase();
      const safeVoiceName = voiceName.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
      if (!safeHeroId || !safeVoiceName) return Promise.resolve(false);
      this.ctx.resume().catch(() => {});
      const voiceNameForPath = safeVoiceName;
      const name = `magic-voice-${safeHeroId}-${safeVoiceName}`;
      const generation = (this.sfxPlaybackGenerations.get(name) ?? 0) + 1;
      this.sfxPlaybackGenerations.set(name, generation);
      return this.playHtmlSfx(
          name,
          [
              assetUrl(`sfx/magic-voices/${safeHeroId}/${voiceNameForPath}.ogg`),
              assetUrl(`sfx/magic-voices/${safeHeroId}/${voiceNameForPath}.wav`),
              `/sfx/magic-voices/${safeHeroId}/${voiceNameForPath}.ogg`,
              `/sfx/magic-voices/${safeHeroId}/${voiceNameForPath}.wav`,
              `sfx/magic-voices/${safeHeroId}/${voiceNameForPath}.ogg`,
              `sfx/magic-voices/${safeHeroId}/${voiceNameForPath}.wav`,
          ],
          maxDurationMs,
          false,
          generation,
      );
  }

  public playHighSchoolVoice(
      heroId: string | undefined,
      action: 'attack' | 'summon' | 'block' | 'power' | 'damage' | 'item' | 'finish' | 'defeat' = 'attack',
      variantCount = 5,
  ) {
      const safeAction = action.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
      const voiceName = `${safeAction}-${Math.floor(Math.random() * Math.max(1, variantCount)) + 1}`;
      this.playHighSchoolVoiceFile(heroId, voiceName, 2600);
  }

  public playHighSchoolVoiceFile(heroId: string | undefined, voiceName: string | undefined, maxDurationMs = 2600) {
      if (!heroId || !voiceName) return Promise.resolve(false);
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return Promise.resolve(false);
      const safeHeroId = heroId.replace(/[^A-Z0-9_-]/gi, '').toUpperCase();
      const safeVoiceName = voiceName.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
      if (!safeHeroId || !safeVoiceName) return Promise.resolve(false);
      this.ctx.resume().catch(() => {});
      const name = `high-school-voice-${safeHeroId}-${safeVoiceName}`;
      const generation = (this.sfxPlaybackGenerations.get(name) ?? 0) + 1;
      this.sfxPlaybackGenerations.set(name, generation);
      return this.playHtmlSfx(
          name,
          [
              assetUrl(`sfx/high-school-voices/${safeHeroId}/${safeVoiceName}.ogg`),
              assetUrl(`sfx/high-school-voices/${safeHeroId}/${safeVoiceName}.wav`),
              `/sfx/high-school-voices/${safeHeroId}/${safeVoiceName}.ogg`,
              `/sfx/high-school-voices/${safeHeroId}/${safeVoiceName}.wav`,
              `sfx/high-school-voices/${safeHeroId}/${safeVoiceName}.ogg`,
              `sfx/high-school-voices/${safeHeroId}/${safeVoiceName}.wav`,
          ],
          maxDurationMs,
          false,
          generation,
      );
  }

  public playHumanoidEnemyVoice(
      theme: VisualThemeId | undefined,
      enemyName: string | undefined,
      action: HumanoidEnemyVoiceAction,
      maxDurationMs = 2600,
  ) {
      const profile = getHumanoidEnemyVoiceProfile(theme, enemyName);
      if (!profile) return Promise.resolve(false);
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return Promise.resolve(false);
      this.ctx.resume().catch(() => {});
      const safeAction = action.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
      const name = `enemy-voice-${profile.theme}-${profile.id}-${safeAction}`;
      const generation = (this.sfxPlaybackGenerations.get(name) ?? 0) + 1;
      this.sfxPlaybackGenerations.set(name, generation);
      return this.playHtmlSfx(
          name,
          [
              assetUrl(`sfx/enemy-voices/${profile.theme}/${profile.id}/${safeAction}.ogg`),
              assetUrl(`sfx/enemy-voices/${profile.theme}/${profile.id}/${safeAction}.wav`),
              `/sfx/enemy-voices/${profile.theme}/${profile.id}/${safeAction}.ogg`,
              `/sfx/enemy-voices/${profile.theme}/${profile.id}/${safeAction}.wav`,
              `sfx/enemy-voices/${profile.theme}/${profile.id}/${safeAction}.ogg`,
              `sfx/enemy-voices/${profile.theme}/${profile.id}/${safeAction}.wav`,
          ],
          maxDurationMs,
          false,
          generation,
      );
  }

  public async playMagicEventVoice(heroId: string | undefined, lineId: string | undefined, delayMs = 0) {
      if (!heroId || !lineId) return false;
      if (delayMs > 0) {
          await new Promise(resolve => window.setTimeout(resolve, delayMs));
      }
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return false;
      const safeHeroId = heroId.replace(/[^A-Z0-9_-]/gi, '').toUpperCase();
      const safeLineId = lineId.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
      if (!safeHeroId || !safeLineId) return false;
      this.ctx.resume().catch(() => {});
      const name = `magic-event-voice-${safeHeroId}-${safeLineId}`;
      const generation = (this.sfxPlaybackGenerations.get(name) ?? 0) + 1;
      this.sfxPlaybackGenerations.set(name, generation);
      return this.playHtmlSfx(
          name,
          [
              assetUrl(`sfx/magic-event-voices/${safeHeroId}/${safeLineId}.ogg`),
              assetUrl(`sfx/magic-event-voices/${safeHeroId}/${safeLineId}.wav`),
              `/sfx/magic-event-voices/${safeHeroId}/${safeLineId}.ogg`,
              `/sfx/magic-event-voices/${safeHeroId}/${safeLineId}.wav`,
              `sfx/magic-event-voices/${safeHeroId}/${safeLineId}.ogg`,
              `sfx/magic-event-voices/${safeHeroId}/${safeLineId}.wav`,
          ],
          12000,
          false,
          generation,
      );
  }

  public async playMagicEventVoiceSequence(lines: Array<{ heroId?: string; lineId?: string }>, gapMs = 180) {
      this.stopMagicEventVoices();
      const sequenceId = this.magicEventVoiceSequenceId + 1;
      this.magicEventVoiceSequenceId = sequenceId;
      for (const line of lines) {
          if (this.magicEventVoiceSequenceId !== sequenceId) return;
          await this.playMagicEventVoice(line.heroId, line.lineId);
          if (this.magicEventVoiceSequenceId !== sequenceId) return;
          await new Promise(resolve => window.setTimeout(resolve, gapMs));
      }
  }

  public stopMagicEventVoices() {
      this.magicEventVoiceSequenceId += 1;
      for (const name of Array.from(this.activeHtmlSfx.keys())) {
          if (name.startsWith('magic-event-voice-')) {
              this.stopActiveSfx(name);
          }
      }
  }

  private playSynthSound(effect: CommonSoundEffect) {
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const t = this.ctx.currentTime;
      switch(effect) {
          case 'select':
              this.playOsc(1100, t, 0.05, 'triangle', 0.2, this.sfxGain);
              break;
          case 'attack':
          case 'finisher_slash':
              this.playAttackSynth(t);
              break;
          case 'block':
              this.playOsc(600, t, 0.1, 'square', 0.2, this.sfxGain);
              this.playOsc(850, t, 0.08, 'square', 0.2, this.sfxGain);
              break;
          case 'win': {
              const fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
              fanfare.forEach((freq, index) => {
                  this.playOsc(freq, t + index * 0.08, 0.4, 'square', 0.2, this.sfxGain!);
              });
              break;
          }
          case 'lose': {
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
          case 'correct':
              this.playOsc(880, t, 0.1, 'sine', 0.3, this.sfxGain);
              this.playOsc(1108, t + 0.05, 0.1, 'sine', 0.3, this.sfxGain);
              this.playOsc(1318, t + 0.1, 0.4, 'sine', 0.3, this.sfxGain);
              break;
          case 'wrong': {
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
          case 'explosion':
          case 'finisher_explosion':
              this.playExplosionSynth(t);
              break;
          case 'jump':
              this.playOsc(360, t, 0.08, 'triangle', 0.22, this.sfxGain);
              this.playOsc(640, t + 0.04, 0.12, 'sine', 0.18, this.sfxGain);
              break;
      }
  }

  public playSound(effect: CommonSoundEffect) {
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      if (this.ctx.state !== 'running') {
          void this.resumeAudioContext().then(ready => {
              if (ready) this.playSound(effect);
          });
          return;
      }
      this.playSynthSound(effect);
  }

  public playBattleSound(effect: CommonSoundEffect) {
      this.init();
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      if (this.ctx.state !== 'running') {
          void this.resumeAudioContext().then(ready => {
              if (ready) this.playBattleSound(effect);
          });
          return;
      }
      const fileByEffect: Record<CommonSoundEffect, { name: string; maxDurationMs: number; overlap?: boolean }> = {
          select: { name: 'attack-effects/flash', maxDurationMs: 420 },
          attack: { name: 'attack-effects/impact', maxDurationMs: 720, overlap: true },
          block: { name: 'status-effects/block', maxDurationMs: 900 },
          win: { name: 'attack-effects/graduation', maxDurationMs: 1500 },
          lose: { name: 'status-effects/weak', maxDurationMs: 1300 },
          correct: { name: 'status-effects/buff', maxDurationMs: 1100 },
          wrong: { name: 'status-effects/debuff', maxDurationMs: 1100 },
          buff: { name: 'status-effects/buff', maxDurationMs: 1100 },
          debuff: { name: 'status-effects/debuff', maxDurationMs: 1100 },
          damage: { name: 'attack-effects/impact', maxDurationMs: 800, overlap: true },
          explosion: { name: 'attack-effects/explosion', maxDurationMs: 1500, overlap: true },
          finisher_slash: { name: 'finisher-slash', maxDurationMs: 900, overlap: true },
          finisher_explosion: { name: 'finisher-explosion', maxDurationMs: 1500, overlap: true },
          jump: { name: 'jump', maxDurationMs: 900, overlap: true },
      };
      const file = fileByEffect[effect];
      this.playSfxMp3(file.name, () => this.playSynthSound(effect), {
          maxDurationMs: file.maxDurationMs,
          overlap: file.overlap,
      });
  }
}

export const audioService = new AudioService();
