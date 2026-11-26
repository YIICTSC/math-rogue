import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playQuestionSpeech, type QuestionAudioPrompt, type QuestionSpeechStatus } from '../services/questionSpeech';
import type { LanguageMode } from '../types';

type PronunciationMixer = Pick<typeof import('../services/audioService')['audioService'], 'acquireBgmSilence' | 'isVoiceEnabled' | 'getVoiceVolume'>;

export function useQuestionPronunciation(
  audio: PronunciationMixer | undefined | null,
  prompt: QuestionAudioPrompt | undefined,
  questionKey: string | number | undefined,
  { enabled = true, autoPlay = true, muteBgm = Boolean(prompt) } = {},
) {
  const [status, setStatus] = useState<QuestionSpeechStatus>('idle');
  const stopPlayback = useRef<(() => void) | undefined>(undefined);
  const autoPlayTimer = useRef<number | undefined>(undefined);
  const text = prompt?.text;
  const lang = prompt?.lang;
  const shouldAutoPlay = autoPlay && prompt?.autoPlay !== false;

  useLayoutEffect(() => muteBgm ? audio?.acquireBgmSilence() : undefined, [audio, muteBgm]);

  const stop = useCallback(() => {
    window.clearTimeout(autoPlayTimer.current);
    stopPlayback.current?.();
    stopPlayback.current = undefined;
    setStatus('idle');
  }, []);

  const play = useCallback((fromGesture = true) => {
    if (!audio || !text || !enabled) return;
    stop();
    if (!audio.isVoiceEnabled()) {
      if (!document.hidden) setStatus('muted');
      return;
    }
    const release = muteBgm ? undefined : audio.acquireBgmSilence();
    let released = false;
    const releasePlaybackSilence = () => {
      if (!released) { released = true; release?.(); }
    };
    const cancel = playQuestionSpeech({ text, lang }, Math.min(1, audio.getVoiceVolume()), fromGesture, (next) => {
      if (next !== 'playing' && next !== 'starting') releasePlaybackSilence();
      setStatus(next);
    });
    stopPlayback.current = () => { cancel(); releasePlaybackSilence(); };
  }, [audio, enabled, lang, muteBgm, stop, text]);

  useEffect(() => {
    stop();
    if (shouldAutoPlay && audio && text && enabled) autoPlayTimer.current = window.setTimeout(() => play(false), 450);
    return () => {
      window.clearTimeout(autoPlayTimer.current);
      stopPlayback.current?.();
      stopPlayback.current = undefined;
    };
  }, [questionKey, audio, enabled, play, shouldAutoPlay, stop, text]);

  return { play, stop, status, speaking: status === 'starting' || status === 'playing' };
}

export function questionSpeechMessage(status: QuestionSpeechStatus, language: LanguageMode) {
  if (status === 'retry') return language === 'ENGLISH' ? 'Tap Listen to play the audio.' : '「きく」をおして おとを ならそう。';
  if (status === 'muted') return language === 'ENGLISH' ? 'Check the mute and voice volume settings.' : 'ミュートと ボイスのおんりょうを たしかめてね。';
  if (status === 'unavailable') return language === 'ENGLISH' ? 'Audio could not play. Check your device’s speech settings and try again.' : 'おとを ならせませんでした。たんまつの よみあげせっていを たしかめてね。';
  return '';
}
