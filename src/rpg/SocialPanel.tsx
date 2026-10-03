import TranslatedUiTree from "../components/TranslatedUiTree";
import type { LanguageMode } from "../types";
import React, { useState } from "react";
import type { World, Action } from "./engine";
import {
  socialLineText,
  relation,
  socialNear,
  type SocialMemory,
} from "./social";
export const DEFAULT_MEMORY: SocialMemory = {
  phrases: [],
  personality: "kind",
  autoTalk: true,
};
export function loadMemory(): SocialMemory {
  try {
    const m = JSON.parse(
      localStorage.getItem("rpg-social-memory-v1") || "null",
    );
    return m &&
      Array.isArray(m.phrases) &&
      m.phrases.length <= 12 &&
      m.phrases.every(
        (p: unknown) => typeof p === "string" && p.length <= 48,
      ) &&
      ["kind", "logical", "quirky"].includes(m.personality) &&
      typeof m.autoTalk === "boolean"
      ? m
      : DEFAULT_MEMORY;
  } catch {
    return DEFAULT_MEMORY;
  }
}
export default function SocialPanel({
  world,
  selfId,
  send,
  onBuilder,
  onMemory,
  languageMode = "JAPANESE",
}: {
  languageMode?: LanguageMode;
  world: World;
  selfId: string;
  send: (a: Action) => void;
  onBuilder: () => void;
  onMemory: (m: SocialMemory) => void;
}) {
  const me = world.players[selfId],
    [phrase, setPhrase] = useState(""),
    [message, setMessage] = useState("");
  const memory = me.memory || loadMemory(),
    others = Object.values(world.players).filter(
      (p) => p.id !== selfId && !p.spectator,
    ),
    request = world.social?.requests.find((r) => r.to === selfId),
    pending = world.social?.requests.find((r) => r.from === selfId),
    talks = (world.social?.talks || [])
      .filter((t) => t.people.includes(selfId))
      .slice(-10)
      .reverse();
  return (
    <TranslatedUiTree mode={languageMode}>
      <section className="rpg-social-panel" data-rpg-panel="social">
        <h2>主人公と交流</h2>
        <button onClick={onBuilder}>オリジナル主人公を作る</button>
        <p>{me.hero?.name || me.name}</p>
        <label>
          会話の性格
          <select
            value={memory.personality}
            onChange={(e) =>
              onMemory({
                ...memory,
                personality: e.target.value as SocialMemory["personality"],
              })
            }
          >
            <option value="kind">やさしい</option>
            <option value="logical">論理的</option>
            <option value="quirky">とぼけた</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={memory.autoTalk}
            onChange={(e) =>
              onMemory({ ...memory, autoTalk: e.target.checked })
            }
          />
          近くの主人公と自動で会話
        </label>
        <p>
          好きな言葉を12個まで覚えます。友好度20で同居、50で結婚を申し込めます。
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (phrase.trim() && memory.phrases.length < 12) {
              onMemory({
                ...memory,
                phrases: [...memory.phrases, phrase.trim()],
              });
              setPhrase("");
            }
          }}
        >
          <label>
            覚えさせる言葉
            <input
              maxLength={48}
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
            />
          </label>
          <button disabled={!phrase.trim() || memory.phrases.length >= 12}>
            言葉を覚える
          </button>
        </form>
        <div className="rpg-memory-phrases">
          {memory.phrases.map((p, i) => (
            <button
              key={i}
              aria-label="言葉を忘れる"
              onClick={() =>
                onMemory({
                  ...memory,
                  phrases: memory.phrases.filter((_, j) => i !== j),
                })
              }
            >
              {p} ×
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (message.trim()) {
              send({ type: "social-player-talk", text: message.trim() });
              setMessage("");
            }
          }}
        >
          <label>
            主人公に話しかける
            <input
              maxLength={80}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <button disabled={!world.started || world.ended || !message.trim()}>
            話す
          </button>
        </form>
        {request && (
          <article role="status">
            <p>
              {world.players[request.from]?.hero?.name ||
                world.players[request.from]?.name}
            </p>
            <strong>
              {request.kind === "cohabit" ? "同居のお誘い" : "結婚のお申し込み"}
            </strong>
            <p>承諾すると成立します。いつでも解消できます。</p>
            <button
              onClick={() =>
                send({
                  type: "social-answer",
                  requestId: request.id,
                  accept: true,
                })
              }
            >
              承諾する
            </button>
            <button
              onClick={() =>
                send({
                  type: "social-answer",
                  requestId: request.id,
                  accept: false,
                })
              }
            >
              お断りする
            </button>
          </article>
        )}
        {pending && <p>相手の返事を待っています。</p>}
        {others.map((p) => {
          const r = relation(world, selfId, p.id),
            near = socialNear(me, p),
            house = world.life.houses.find(
              (h) => h.owner === selfId || h.owner === p.id,
            );
          return (
            <article key={p.id}>
              <strong>{p.hero?.name || p.name}</strong>
              <small>{p.name}</small>
              <p>
                友好度 {r?.friendship || 0}/100 {r?.married ? "結婚" : ""}{" "}
                {r?.houseId ? "同居" : ""}
              </p>
              <meter min={0} max={100} value={r?.friendship || 0} />
              <p>{near ? "近くにいます。" : "近くへ移動して会話できます。"}</p>
              <button
                disabled={
                  !world.started ||
                  world.ended ||
                  !near ||
                  world.life.now - (r?.lastTalk || 0) < 12000
                }
                onClick={() => send({ type: "social-talk", target: p.id })}
              >
                主人公同士で会話
              </button>
              {!r?.houseId ? (
                <button
                  disabled={
                    !near || !house || (r?.friendship || 0) < 20 || !!pending
                  }
                  onClick={() =>
                    send({
                      type: "social-request",
                      target: p.id,
                      kind: "cohabit",
                      houseId: house?.id,
                    })
                  }
                >
                  同居を申し込む
                </button>
              ) : (
                <>
                  <p>
                    {
                      world.life.houses.find((h) => h.id === r.houseId)
                        ?.ownerName
                    }
                  </p>
                  <button
                    onClick={() =>
                      send({
                        type: "social-end",
                        target: p.id,
                        kind: "cohabit",
                      })
                    }
                  >
                    同居を解消
                  </button>
                </>
              )}
              {!r?.married ? (
                <button
                  disabled={!near || (r?.friendship || 0) < 50 || !!pending}
                  onClick={() =>
                    send({
                      type: "social-request",
                      target: p.id,
                      kind: "marry",
                    })
                  }
                >
                  結婚を申し込む
                </button>
              ) : (
                <button
                  onClick={() =>
                    send({ type: "social-end", target: p.id, kind: "marry" })
                  }
                >
                  結婚を解消
                </button>
              )}
            </article>
          );
        })}
        <h3>会話の思い出</h3>
        <div className="rpg-social-log" aria-live="polite">
          {talks.map((t) => (
            <article key={t.id}>
              {t.lines.map((line, i) => (
                <p key={i}>
                  <b>
                    {line.speaker === "player"
                      ? "あなた"
                      : world.players[line.speaker]?.hero?.name ||
                        world.players[line.speaker]?.name ||
                        "仲間"}
                  </b>
                  <span>{socialLineText(line, languageMode)}</span>
                </p>
              ))}
            </article>
          ))}
        </div>
        <p>友好度・同居・結婚と会話履歴は、この部屋の冒険中に共有されます。</p>
      </section>
    </TranslatedUiTree>
  );
}
