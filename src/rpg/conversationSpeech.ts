import { residentVoiceMoras, renderResidentVoice, residentVoiceSupported, unlockResidentVoice } from "./residentVoiceSynth";
import { audioService } from "../services/audioService";
import { speechPlan, type ConversationVoice } from "./conversationVoice";
/** Owns only RPG utterances; an idle cleanup must never cancel another game's speech. */
let stopCurrent: (() => void) | undefined;
export function stopConversationSpeech() {
  stopCurrent?.();
}
function deviceSpeechSupported() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
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

export function speakConversation(
  text: string,
  config: ConversationVoice,
  language: string,
): Promise<boolean> {
  stopConversationSpeech();
  if (
    !conversationSpeechSupported() ||
    !config.enabled ||
    !audioService.canPlayConversationVoice()
  )
    return Promise.resolve(false);
  const moras = config.engine !== "device" && language !== "ENGLISH" ? residentVoiceMoras(text) : null;
  if (moras && residentVoiceSupported()) return speakOriginal(moras, config);
  if (!deviceSpeechSupported()) return Promise.resolve(false);
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    let ended = false,
      timer: ReturnType<typeof setTimeout>,
      guard: ReturnType<typeof setInterval>;
    const finish = (completed = true) => {
      if (ended) return;
      ended = true;
      clearTimeout(timer);
      clearInterval(guard);
      if (stopCurrent === cancel) stopCurrent = undefined;
      resolve(completed);
    };
    const cancel = () => {
      if (!ended) {
        finish(false);
        synth.cancel();
      }
    };
    stopCurrent = cancel;
    const parts = speechPlan(text.slice(0, 240), config);
    let index = 0;
    const next = () => {
      if (ended) return;
      if (!audioService.canPlayConversationVoice()) {
        cancel();
        return;
      }
      if (index >= parts.length) {
        finish();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(parts[index].text);
      utterance.lang = language === "ENGLISH" ? "en-US" : "ja-JP";
      const voices = synth
        .getVoices()
        .filter((v) =>
          v.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2)),
        )
        .sort(
          (a, b) =>
            Number(b.localService) - Number(a.localService) ||
            a.name.localeCompare(b.name),
        );
      if (voices.length)
        utterance.voice = voices[config.timbre % voices.length];
      utterance.pitch = parts[index].pitch;
      utterance.rate = parts[index].rate;
      utterance.volume = Math.min(1, audioService.getVoiceVolume());
      utterance.onend = () => {
        if (ended) return;
        const pause = parts[index].pause;
        index++;
        clearTimeout(timer);
        timer = setTimeout(next, pause);
      };
      utterance.onerror = cancel;
      // Some mobile engines never emit onend when playback is interrupted.
      timer = setTimeout(
        cancel,
        Math.max(6000, (parts[index].text.length * 450) / config.rate),
      );
      synth.speak(utterance);
    };
    guard = setInterval(() => {
      if (!audioService.canPlayConversationVoice()) cancel();
    }, 100);
    next();
  });
}
