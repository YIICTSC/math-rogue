import { audioService } from "../services/audioService";
import { speechPlan, type ConversationVoice } from "./conversationVoice";
/** Owns only RPG utterances; an idle cleanup must never cancel another game's speech. */
let stopCurrent: (() => void) | undefined;
export function stopConversationSpeech() {
  stopCurrent?.();
}
export function conversationSpeechSupported() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
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
