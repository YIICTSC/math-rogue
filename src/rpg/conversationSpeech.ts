import { residentVoiceMoras, renderResidentVoice, residentVoiceSupported, unlockResidentVoice } from "./residentVoiceSynth";
import { audioService } from "../services/audioService";
import { speechPlan, type ConversationVoice } from "./conversationVoice";
/** Owns only RPG utterances; an idle cleanup must never cancel another game's speech. */
let stopCurrent: (() => void) | undefined;
let generation = 0;
export function stopConversationSpeech() {
  generation++;
  stopCurrent?.();
}
function deviceSpeechSupported() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}
let deviceUnlocked = false;
/** Call from a tap/key gesture, including before a dialogue React effect starts on iOS. */
export function unlockConversationSpeech(engine: ConversationVoice["engine"] = "original") {
  const context = unlockResidentVoice();
  if (engine === "device" && !deviceUnlocked && !stopCurrent && deviceSpeechSupported()) {
    try {
      const prime = new SpeechSynthesisUtterance(' '); prime.lang = 'ja-JP'; prime.volume = 0;
      window.speechSynthesis.speak(prime); deviceUnlocked = true;
    } catch { /* Retry at the next gesture. */ }
  }
  return context;
}
export function conversationSpeechSupported() {
  return residentVoiceSupported() || deviceSpeechSupported();
}

function speakOriginal(moras: NonNullable<ReturnType<typeof residentVoiceMoras>>, config: ConversationVoice): Promise<boolean> {
  return new Promise(resolve => {
    let source: AudioBufferSourceNode | undefined;
    let gain: GainNode | undefined;
    let ended = false;
    let guard: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const finish = (completed = false) => {
      if (ended) return;
      ended = true;
      clearInterval(guard); clearTimeout(timeout);
      if (source) { source.onended = null; try { source.stop(); } catch {} source.disconnect(); }
      gain?.disconnect();
      if (stopCurrent === cancel) stopCurrent = undefined;
      resolve(completed);
    };
    const cancel = () => finish(false);
    stopCurrent = cancel;
    try {
      const ctx = unlockResidentVoice();
      if (!ctx) { cancel(); return; }
      timeout = setTimeout(cancel, 3000);
      void (async () => {
        if (ctx.state !== 'running') await ctx.resume();
        if (ended) return;
        if (!audioService.canPlayConversationVoice()) { cancel(); return; }
        const samples = renderResidentVoice(moras, config);
        const buffer = ctx.createBuffer(1, samples.length, 22050);
        buffer.getChannelData(0).set(samples);
        source = ctx.createBufferSource(); source.buffer = buffer;
        gain = ctx.createGain(); gain.gain.value = Math.min(1, audioService.getVoiceVolume());
        source.connect(gain); gain.connect(ctx.destination);
        source.onended = () => finish(true);
        guard = setInterval(() => {
          if (!audioService.canPlayConversationVoice() || ctx.state !== 'running') cancel();
          else gain?.gain.setTargetAtTime(Math.min(1, audioService.getVoiceVolume()), ctx.currentTime, .02);
        }, 60);
        clearTimeout(timeout);
        timeout = setTimeout(cancel, buffer.duration * 1000 + 2000);
        source.start();
      })().catch(cancel);
    } catch { cancel(); }
  });
}

/** Match the language before considering voice identity; never read Japanese with an English voice. */
export function selectConversationDeviceVoice(voices: SpeechSynthesisVoice[], language: string, timbre: number) {
  const locale = language === 'ENGLISH' ? 'en-US' : 'ja-JP';
  const score = (v: SpeechSynthesisVoice) => Number(Boolean(v.localService)) * 40
    + Number(v.lang.toLowerCase() === locale.toLowerCase()) * 20
    + Number(/enhanced|premium|natural|neural|高品質/i.test(v.name)) * 15;
  const matches = voices.filter(v => v.lang.toLowerCase().replace('_', '-').startsWith(locale.slice(0, 2)))
    .sort((a,b) => score(b)-score(a) || Number(Boolean(b.default))-Number(Boolean(a.default)) || a.name.localeCompare(b.name) || (a.voiceURI || a.name).localeCompare(b.voiceURI || b.name));
  if (!matches.length) return undefined;
  const best = matches.filter(v => score(v) === score(matches[0]));
  return best[timbre % best.length];
}

export function conversationDevicePlan(text: string, config: ConversationVoice) {
  const recommended = !config.engine || config.engine === 'auto';
  // Keep whole sentences so the native engine can infer Japanese word boundaries.
  const phrasing = recommended ? {...config, style: config.style === 'robot' ? 'robot' as const : 'smooth' as const} : config;
  return speechPlan(text, phrasing).map(part => recommended ? {
    ...part,
    // Native TTS already has prosody. Large pitch shifts obscure its consonants.
    pitch: Math.max(.85, Math.min(1.25, 1 + (part.pitch - 1) * .35)),
    rate: Math.max(.82, Math.min(1.08, part.rate * .94)),
  } : part);
}

type DeviceResult = 'completed' | 'cancelled' | 'unavailable';
function speakDevice(text: string, config: ConversationVoice, language: string): Promise<DeviceResult> {
  return new Promise(resolve => {
    const synth = window.speechSynthesis;
    let ended = false, started = false, partStarted = false, index = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let guard: ReturnType<typeof setInterval> | undefined;
    let discovery: ReturnType<typeof setTimeout> | undefined;
    let utterance: SpeechSynthesisUtterance | undefined;
    const parts = conversationDevicePlan(text.slice(0, 240), config);
    let selected: SpeechSynthesisVoice | undefined;
    const finish = (result: DeviceResult) => {
      if (ended) return;
      ended = true;
      clearTimeout(timer); clearTimeout(discovery); clearInterval(guard);
      synth.removeEventListener?.('voiceschanged', discover);
      if (utterance) { utterance.onend = null; utterance.onerror = null; utterance.onstart = null; }
      if (stopCurrent === cancel) stopCurrent = undefined;
      resolve(result);
    };
    const cancel = () => { if (!ended) { finish('cancelled'); if (utterance) synth.cancel(); } };
    const unavailable = () => { if (!ended) { const hadStarted = started; finish(hadStarted ? 'cancelled' : 'unavailable'); if (utterance) synth.cancel(); } };
    stopCurrent = cancel;
    const next = () => {
      if (ended) return;
      if (!audioService.canPlayConversationVoice()) { cancel(); return; }
      if (index >= parts.length) { finish('completed'); return; }
      partStarted = false;
      utterance = new SpeechSynthesisUtterance(parts[index].text);
      utterance.lang = language === 'ENGLISH' ? 'en-US' : 'ja-JP';
      utterance.voice = selected!;
      utterance.pitch = parts[index].pitch;
      utterance.rate = parts[index].rate;
      utterance.volume = Math.min(1, audioService.getVoiceVolume());
      utterance.onstart = () => {
        started = true; partStarted = true; clearTimeout(timer);
        timer = setTimeout(cancel, Math.max(6000, parts[index].text.length * 450 / parts[index].rate));
      };
      utterance.onend = () => {
        if (ended) return;
        started = true; partStarted = true;
        const pause = parts[index++].pause;
        clearTimeout(timer); timer = setTimeout(next, pause);
      };
      utterance.onerror = unavailable;
      // A missing/unavailable mobile voice must not leave a conversation hanging.
      timer = setTimeout(unavailable, 2500);
      try { if (synth.paused) synth.resume(); synth.speak(utterance); } catch { unavailable(); }
    };
    const begin = () => {
      clearTimeout(discovery); synth.removeEventListener?.('voiceschanged', discover);
      guard = setInterval(() => {
        if (!audioService.canPlayConversationVoice()) cancel();
        else if (utterance) {
          utterance.volume = Math.min(1, audioService.getVoiceVolume());
          // Some mobile engines omit onstart; their speaking state still prevents a repeated fallback.
          if (!partStarted && synth.speaking) { started = true; partStarted = true; clearTimeout(timer); timer = setTimeout(cancel, Math.max(6000, (parts[index]?.text.length || 1) * 450 / config.rate)); }
        }
      }, 80);
      next();
    };
    function discover() {
      if (ended) return;
      try { selected = selectConversationDeviceVoice(synth.getVoices(), language, config.timbre); } catch { finish('unavailable'); return; }
      if (selected) begin();
    }
    // getVoices() is initially empty on several browsers; MDN recommends voiceschanged.
    synth.addEventListener?.('voiceschanged', discover);
    discovery = setTimeout(() => { if (!selected) finish('unavailable'); }, 900);
    discover();
  });
}

export async function speakConversation(text: string, config: ConversationVoice, language: string): Promise<boolean> {
  stopConversationSpeech();
  const token = generation;
  if (!conversationSpeechSupported() || !config.enabled || !audioService.canPlayConversationVoice()) return false;
  const moras = language !== 'ENGLISH' ? residentVoiceMoras(text) : null;
  const fallback = () => moras && residentVoiceSupported() ? speakOriginal(moras, config) : Promise.resolve(false);
  if (config.engine !== 'device' && moras && residentVoiceSupported()) return fallback();
  if (!deviceSpeechSupported()) return config.engine === 'device' ? false : fallback();
  const result = await speakDevice(text, config, language);
  if (result === 'completed') return true;
  if (result === 'unavailable' && config.engine !== 'device' && token === generation && audioService.canPlayConversationVoice()) return fallback();
  return false;
}
