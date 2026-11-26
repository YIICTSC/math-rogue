import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { isGameAudioInterrupted, prepareWebAudioSession } from './webAudioSession';

export interface QuestionAudioPrompt {
  text: string;
  lang?: string;
  autoPlay?: boolean;
}

export type QuestionSpeechStatus = 'idle' | 'starting' | 'playing' | 'retry' | 'unavailable' | 'muted';

let stopActiveSpeech: (() => void) | undefined;

export function stopQuestionSpeech() {
  stopActiveSpeech?.();
}

function languageTag(lang: string) {
  return lang.toLowerCase().replaceAll('_', '-');
}

export function playQuestionSpeech(
  { text, lang = 'ja-JP' }: QuestionAudioPrompt,
  volume: number,
  fromGesture: boolean,
  onStatus: (status: QuestionSpeechStatus) => void,
) {
  stopQuestionSpeech();
  let finished = false;
  let cancelPlayback = () => {};
  const finish = (status: QuestionSpeechStatus, cancel = false) => {
    if (finished) return;
    finished = true;
    stopActiveSpeech = undefined;
    document.removeEventListener('visibilitychange', onVisibility);
    if (cancel) cancelPlayback();
    onStatus(status);
  };
  const stop = () => finish('idle', true);
  const onVisibility = () => { if (document.hidden) stop(); };
  stopActiveSpeech = stop;
  document.addEventListener('visibilitychange', onVisibility);

  const speakInBrowser = () => {
    if (finished) return;
    const engine = window.speechSynthesis;
    if (!engine || typeof SpeechSynthesisUtterance === 'undefined') {
      finish('unavailable');
      return;
    }
    if (!fromGesture && (navigator.userActivation?.hasBeenActive === false || isGameAudioInterrupted())) {
      finish('retry');
      return;
    }

    prepareWebAudioSession();
    const locale = languageTag(lang);
    const language = locale.split('-')[0];
    const getVoice = () => {
      const voices = engine.getVoices().filter(voice => languageTag(voice.lang).split('-')[0] === language);
      return voices.find(voice => languageTag(voice.lang) === locale && voice.localService)
        ?? voices.find(voice => languageTag(voice.lang) === locale)
        ?? voices.find(voice => voice.localService) ?? voices[0];
    };
    let utterance: SpeechSynthesisUtterance | undefined;
    let watchdog = 0;
    let waitingForVoices = false;
    let started = false;
    const clearWait = () => {
      window.clearTimeout(watchdog);
      engine.removeEventListener?.('voiceschanged', voicesReady);
    };
    const clearUtterance = () => {
      if (utterance) utterance.onstart = utterance.onend = utterance.onerror = null;
    };
    cancelPlayback = () => {
      clearWait();
      clearUtterance();
      engine.cancel();
    };
    const voicesReady = () => {
      const voice = getVoice();
      if (!waitingForVoices || started || !voice || finished) return;
      clearWait();
      clearUtterance();
      engine.cancel();
      speak(voice);
    };
    const speak = (voice = getVoice()) => {
      waitingForVoices = !voice;
      const request = new SpeechSynthesisUtterance(text);
      utterance = request;
      request.lang = lang;
      request.rate = 0.85;
      request.volume = volume;
      if (voice) request.voice = voice;
      request.onstart = () => {
        if (finished || utterance !== request) return;
        started = true;
        clearWait();
        onStatus('playing');
      };
      request.onend = () => {
        if (finished || utterance !== request) return;
        clearWait();
        finish('idle');
      };
      request.onerror = event => {
        if (finished || utterance !== request) return;
        if (waitingForVoices && ['voice-unavailable', 'language-unavailable', 'synthesis-unavailable'].includes(event.error)) return;
        clearWait();
        finish(event.error === 'not-allowed' ? 'retry' : 'unavailable');
      };
      if (waitingForVoices) engine.addEventListener?.('voiceschanged', voicesReady);
      watchdog = window.setTimeout(() => finish(fromGesture ? 'unavailable' : 'retry', true), 2500);
      try {
        engine.resume();
        engine.speak(request);
      } catch { finish('unavailable', true); }
    };
    speak();
  };

  if (!text.trim() || document.hidden) finish('idle');
  else if (volume === 0) finish('muted');
  else {
    onStatus('starting');
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('TextToSpeech')) {
      let didRequest = false;
      let retryTimer: number | undefined;
      cancelPlayback = () => {
        window.clearTimeout(retryTimer);
        if (didRequest) void TextToSpeech.stop().catch(() => undefined);
      };
      const speakNative = (retry: boolean): void => {
        void TextToSpeech.isLanguageSupported({ lang }).then(({ supported }) => {
          if (finished) return;
          if (!supported) {
            // Android can report no voices while its speech engine is connecting.
            if (retry) retryTimer = window.setTimeout(() => speakNative(false), 600);
            else speakInBrowser();
            return;
          }
          didRequest = true;
          onStatus('playing');
          return TextToSpeech.speak({ text, lang, volume, rate: 0.85 }).then(() => finish('idle'));
        }).catch(speakInBrowser);
      };
      speakNative(Capacitor.getPlatform() === 'android');
    } else speakInBrowser();
  }
  return stop;
}
