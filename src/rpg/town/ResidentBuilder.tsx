import React, { useState } from "react";
import HeroBuilder from "../HeroBuilder";
import ConversationVoiceSettings from "../ConversationVoiceSettings";
import { DEFAULT_CONVERSATION_VOICE } from "../conversationVoice";
import { RESIDENTS, PERSONALITIES, copy } from "./catalog";
import type { World, Action } from "../engine";
import type { LanguageMode } from "../../types";
import type { CustomHero } from "../customHero";
import { assetUrl } from "../../utils/assetPaths";
export default function ResidentBuilder({
  world,
  selfId,
  send,
  languageMode,
}: {
  world: World;
  selfId: string;
  send: (a: Action) => void;
  languageMode: LanguageMode;
}) {
  const L = (ja: string, en: string, hi: string) =>
    languageMode === "ENGLISH" ? en : languageMode === "HIRAGANA" ? hi : ja;
  const [name, setName] = useState(""),
    [portrait, setPortrait] = useState(RESIDENTS[0].portrait),
    [personality, setPersonality] = useState(0),
    [birthday, setBirthday] = useState(0),
    [voice, setVoice] = useState(DEFAULT_CONVERSATION_VOICE),
    [hero, setHero] = useState<CustomHero | null>(null),
    [builder, setBuilder] = useState(false),
    [editing, setEditing] = useState("");
  const list = world.town?.customResidents || [],
    locked = world.ended || !!world.players[selfId]?.spectator;
  return (
    <article className="town-card">
      <h3>{L("住民を作る", "Create residents", "じゅうみんをつくる")}</h3>
      <p>
        {L(
          "16人まで住民を追加できます。写真やイラストから姿を作るか、既存の住民の姿を選べます。作った住民も会話・同居・結婚・家族・言葉の学習に参加します。",
          "Create up to 16 residents using a photo, artwork or an existing appearance. They join conversations, households, marriage, family life and word learning.",
          "16にんまでじゅうみんをついかできます。しゃしんやいらすとからすがたをつくるか、きそんのじゅうみんのすがたをえらべます。つくったじゅうみんもかいわ・どうきょ・けっこん・かぞく・ことばのがくしゅうにさんかします。",
        )}
      </p>
      <label>
        {L("住民の名前", "Resident name", "じゅうみんのなまえ")}
        <input
          aria-label={L("住民の名前", "Resident name", "じゅうみんのなまえ")}
          maxLength={16}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        {L("住民の姿", "Appearance", "じゅうみんのすがた")}
        <select
          disabled={!!editing}
          value={portrait}
          onChange={(e) => {
            setPortrait(e.target.value);
            setHero(null);
          }}
        >
          {RESIDENTS.map((r) => (
            <option key={r.id} value={r.portrait}>
              {copy(r.name, languageMode)}
            </option>
          ))}
        </select>
      </label>
      <img
        style={{ height: 100, objectFit: "contain" }}
        src={hero?.portrait || assetUrl(portrait)}
        alt=""
      />
      <button disabled={!!editing || locked} onClick={() => setBuilder(true)}>
        {L(
          "写真・イラストから作る",
          "Create from a photo or artwork",
          "しゃしん・いらすとからつくる",
        )}
      </button>
      <label>
        {L("住民の性格", "Personality", "じゅうみんのせいかく")}
        <select
          value={personality}
          onChange={(e) => setPersonality(Number(e.target.value))}
        >
          {PERSONALITIES.map((v, i) => (
            <option key={i} value={i}>
              {copy(v, languageMode)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {L("誕生日の日", "Birthday day", "たんじょうびのひ")}
        <input
          type="number"
          min={1}
          max={28}
          value={birthday + 1}
          onChange={(e) =>
            setBirthday(Math.max(0, Math.min(27, Number(e.target.value) - 1)))
          }
        />
      </label>
      <ConversationVoiceSettings
        subject={L(
          "住民の会話音声",
          "Resident conversation voice",
          "じゅうみんのかいわおんせい",
        )}
        voice={voice}
        onChange={setVoice}
        languageMode={languageMode}
      />
      <button
        disabled={locked || !name.trim() || (!editing && list.length >= 16)}
        onClick={() => {
          send(
            editing
              ? {
                  type: "town-resident-edit",
                  id: editing,
                  name,
                  personality,
                  birthday,
                  voice,
                }
              : {
                  type: "town-resident-create",
                  name,
                  personality,
                  birthday,
                  voice,
                  portrait: hero?.portrait || portrait,
                  hero: hero || undefined,
                },
          );
          setName("");
          setEditing("");
        }}
      >
        {L(
          editing ? "住民を更新" : "住民を迎える",
          editing ? "Update resident" : "Welcome resident",
          editing ? "じゅうみんをこうしん" : "じゅうみんをむかえる",
        )}
      </button>
      {editing && (
        <button onClick={() => setEditing("")}>
          {L("編集をやめる", "Cancel editing", "へんしゅうをやめる")}
        </button>
      )}
      <div className="town-grid">
        {list.map((r) => (
          <div key={r.id}>
            <img
              src={
                r.portrait.startsWith("data:")
                  ? r.portrait
                  : assetUrl(r.portrait)
              }
              alt=""
              style={{ height: 80 }}
            />
            <strong>{r.name}</strong>
            {r.owner === selfId && (
              <button
                onClick={() => {
                  setEditing(r.id);
                  setName(r.name);
                  setPersonality(r.personality);
                  setBirthday(r.birthday);
                  setVoice(r.voice);
                  setHero(r.hero || null);
                  setPortrait(r.portrait);
                }}
              >
                {L("住民を編集", "Edit resident", "じゅうみんをへんしゅう")}
              </button>
            )}
          </div>
        ))}
      </div>
      {builder && (
        <HeroBuilder
          initial={hero}
          languageMode={languageMode}
          onClose={() => setBuilder(false)}
          onSave={(h) => {
            if (h) {
              setHero(h);
              setName(h.name);
            }
            setBuilder(false);
          }}
        />
      )}
    </article>
  );
}
