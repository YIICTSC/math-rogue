import React, { useEffect, useId, useRef, useState } from "react";
import { c, copy } from "./town/catalog";
import TranslatedUiTree from "../components/TranslatedUiTree";
import type { LanguageMode } from "../types";
import {
  DEFAULT_CONVERSATION_VOICE,
  CONVERSATION_PRESETS,
  type ConversationVoice,
} from "./conversationVoice";
import {
  conversationSpeechSupported,
  speakConversation,
  stopConversationSpeech,
} from "./conversationSpeech";
export default function ConversationVoiceSettings({
  voice = DEFAULT_CONVERSATION_VOICE,
  onChange,
  languageMode,
  subject = "主人公の会話音声",
}: {
  subject?: string;
  voice?: ConversationVoice;
  onChange: (voice: ConversationVoice) => void;
  languageMode: LanguageMode;
}) {
  const id = useId(),
    L = (ja: string, en: string, hi: string) =>
      copy(c(ja, en, hi), languageMode);
  const [preview, setPreview] = useState(false);
  const previewGeneration = useRef(0);
  useEffect(
    () => () => {
      stopConversationSpeech();
    },
    [],
  );
  const update = (patch: Partial<ConversationVoice>) => {
    previewGeneration.current++;
    stopConversationSpeech();
    setPreview(false);
    onChange({ ...voice, ...patch });
  };
  return (
    <TranslatedUiTree mode={languageMode}>
      <fieldset className="rpg-conversation-voice">
        <legend>{subject}</legend>
        <label>
          <input
            type="checkbox"
            checked={voice.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
          />
          会話を読み上げる
        </label>
        <div
          className="rpg-voice-presets"
          aria-label={L("声のおすすめ", "Voice presets", "こえのおすすめ")}
        >
          {CONVERSATION_PRESETS.map((p) => (
            <button key={p.id} onClick={() => update({ ...p.voice })}>
              {L(p.ja, p.en, p.hi)}
            </button>
          ))}
        </div>
        <p>
          {L(
            "おすすめは日本語に対応した端末音声を優先し、聞き取りやすい高さと速さで話します。端末音声が使えない場合は独自音声で話します。",
            "Recommended speech uses a matching device voice with clear pitch and pacing, and falls back to the built-in voice when unavailable.",
            "おすすめはにほんごにたいおうしたたんまつおんせいをゆうせんし、ききとりやすいたかさとはやさではなします。たんまつおんせいがつかえないばあいはどくじおんせいではなします。",
          )}
        </p>
        <label>
          {L("音声の種類", "Voice engine", "おんせいのしゅるい")}
          <select value={voice.engine ?? "auto"} onChange={e => update({engine: e.target.value as "auto" | "original" | "device"})}>
            <option value="auto">{L("おすすめ（明瞭な読み上げ）", "Recommended (clear speech)", "おすすめ（めいりょうなよみあげ）")}</option>
            <option value="original">{L("オリジナル音声", "Original voice", "おりじなるおんせい")}</option>
            <option value="device">{L("端末の読み上げ", "Device speech", "たんまつのよみあげ")}</option>
          </select>
        </label>
        <label>
          話し方
          <select
            value={voice.style}
            onChange={(e) =>
              update({ style: e.target.value as ConversationVoice["style"] })
            }
          >
            <option value="robot">ロボット</option>
            <option value="smooth">なめらか</option>
            <option value="bouncy">はずむ</option>
            <option value="warm">
              {L("あたたかい", "Warm", "あたたかい")}
            </option>
            <option value="calm">{L("ゆったり", "Relaxed", "ゆったり")}</option>
            <option value="playful">
              {L("おちゃめ", "Playful", "おちゃめ")}
            </option>
          </select>
        </label>
        <label>
          声質
          <select
            value={voice.timbre}
            onChange={(e) => update({ timbre: Number(e.target.value) })}
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {voice.engine === "device" ? `${L("端末の声", "Device voice", "たんまつのこえ")} ${n + 1}` : [L("まろやか", "Mellow", "まろやか"), L("明るい", "Bright", "あかるい"), L("やわらかい", "Soft", "やわらかい"), L("深い", "Deep", "ふかい")][n]}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={id + "-pitch"}>
          声の高さ <output>{voice.pitch.toFixed(2)}</output>
          <input
            id={id + "-pitch"}
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={voice.pitch}
            onChange={(e) => update({ pitch: Number(e.target.value) })}
          />
        </label>
        <label htmlFor={id + "-rate"}>
          話す速さ <output>{voice.rate.toFixed(2)}</output>
          <input
            id={id + "-rate"}
            type="range"
            min="0.6"
            max="1.6"
            step="0.05"
            value={voice.rate}
            onChange={(e) => update({ rate: Number(e.target.value) })}
          />
        </label>
        <label htmlFor={id + "-intonation"}>
          {L("声の抑揚", "Expression", "こえのよくよう")}{" "}
          <output>{Math.round((voice.intonation ?? 0.65) * 100)}%</output>
          <input
            id={id + "-intonation"}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={voice.intonation ?? 0.65}
            onChange={(e) => update({ intonation: Number(e.target.value) })}
          />
        </label>
        <button
          disabled={!conversationSpeechSupported()}
          onClick={() => {
            const token = ++previewGeneration.current;
            if (preview) {
              stopConversationSpeech();
              setPreview(false);
              return;
            }
            setPreview(true);
            void speakConversation(
              languageMode === "ENGLISH"
                ? "Hello! Let us go fishing together."
                : "こんにちは！ いっしょにつりにいこう。",
              { ...voice, enabled: true },
              languageMode,
            ).finally(() => { if (token === previewGeneration.current) setPreview(false); });
          }}
        >
          {preview ? "試聴を止める" : "声を試聴する"}
        </button>
        <p>
          {conversationSpeechSupported()
            ? L("声設定は保存・共有されます。読みがなのない漢字や英語は端末の音声で読み上げます。", "Voice settings are saved and shared. English and kanji without readings use device speech.", "こえせっていはほぞん・きょうゆうされます。よみがなのないかんじやえいごはたんまつのおんせいでよみあげます。")
            : "この端末は音声読み上げに対応していません。会話は文字で表示します。"}
        </p>
      </fieldset>
    </TranslatedUiTree>
  );
}
