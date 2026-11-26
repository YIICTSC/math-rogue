import { audioService } from '../services/audioService';
import type { QuestionAudioPrompt } from '../services/questionSpeech';
import type { LanguageMode } from '../types';
import { questionSpeechMessage, useQuestionPronunciation } from '../utils/useQuestionPronunciation';

export default function QuestionListenButton({ prompt, questionKey, languageMode = 'JAPANESE', disabled = false, autoPlay = false, translate }: {
  prompt?: QuestionAudioPrompt;
  questionKey: string;
  languageMode?: LanguageMode;
  disabled?: boolean;
  autoPlay?: boolean;
  translate?: (text: string) => string;
}) {
  const { play, status } = useQuestionPronunciation(audioService, prompt, questionKey, { enabled: !disabled, autoPlay });
  const message = questionSpeechMessage(status, languageMode);
  const label = translate?.('聞く') ?? (languageMode === 'ENGLISH' ? 'Listen' : languageMode === 'HIRAGANA' ? 'きく' : '聞く');
  if (!prompt) return null;
  return <>
    <button type="button" disabled={disabled} onClick={() => play()}>{label}</button>
    {message && <small role="status" className="block">{translate ? translate(message) : message}</small>}
  </>;
}
