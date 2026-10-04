import React, { useEffect, useId, useState } from 'react';
import TranslatedUiTree from '../components/TranslatedUiTree';
import type { LanguageMode } from '../types';
import { DEFAULT_CONVERSATION_VOICE, type ConversationVoice } from './conversationVoice';
import { conversationSpeechSupported, speakConversation, stopConversationSpeech } from './conversationSpeech';
export default function ConversationVoiceSettings({ voice = DEFAULT_CONVERSATION_VOICE, onChange, languageMode, subject = '主人公の会話音声' }: {
  subject?: string; voice?: ConversationVoice; onChange: (voice: ConversationVoice) => void; languageMode: LanguageMode;
}) {
  const id = useId();
  const [preview, setPreview] = useState(false);
  useEffect(() => () => { stopConversationSpeech(); }, []);
  const update = (patch: Partial<ConversationVoice>) => { stopConversationSpeech(); onChange({ ...voice, ...patch }); };
  return <TranslatedUiTree mode={languageMode}><fieldset className="rpg-conversation-voice">
    <legend>{subject}</legend>
    <label><input type="checkbox" checked={voice.enabled} onChange={e => update({ enabled: e.target.checked })}/>会話を読み上げる</label>
    <label>話し方<select value={voice.style} onChange={e => update({ style: e.target.value as ConversationVoice['style'] })}>
      <option value="robot">ロボット</option><option value="smooth">なめらか</option><option value="bouncy">はずむ</option>
    </select></label>
    <label>声質<select value={voice.timbre} onChange={e => update({ timbre: Number(e.target.value) })}>
      <option value={0}>声質1</option><option value={1}>声質2</option><option value={2}>声質3</option><option value={3}>声質4</option>
    </select></label>
    <label htmlFor={id + '-pitch'}>声の高さ <output>{voice.pitch.toFixed(2)}</output><input id={id + '-pitch'} type="range" min="0.5" max="2" step="0.05" value={voice.pitch} onChange={e => update({ pitch: Number(e.target.value) })}/></label>
    <label htmlFor={id + '-rate'}>話す速さ <output>{voice.rate.toFixed(2)}</output><input id={id + '-rate'} type="range" min="0.6" max="1.6" step="0.05" value={voice.rate} onChange={e => update({ rate: Number(e.target.value) })}/></label>
    <button disabled={!conversationSpeechSupported()} onClick={() => {
      if (preview) { stopConversationSpeech(); setPreview(false); return; }
      setPreview(true);
      void speakConversation(languageMode === 'ENGLISH' ? 'Hello! Let us go fishing together.' : 'こんにちは！ いっしょに釣りに行こう。', { ...voice, enabled: true }, languageMode).finally(() => setPreview(false));
    }}>{preview ? '試聴を止める' : '声を試聴する'}</button>
    <p>{conversationSpeechSupported() ? '主人公ごとに端末へ保存し、相手にも声設定を共有します。声質は端末の音声に応じて変わります。' : 'この端末は音声読み上げに対応していません。会話は文字で表示します。'}</p>
  </fieldset></TranslatedUiTree>;
}
