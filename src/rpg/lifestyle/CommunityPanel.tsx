import React, { useState } from "react";
import type { World, Action } from "../engine";
import type { LanguageMode } from "../../types";
import { c, copy, ALL_DISHES, dishById } from "../town/catalog";
import { residentsOf } from "../town/residents";
import { socialNear } from "../social";
import { farmBusy } from "../farm/model";
import { hasFood } from "../town/model";
import { FoodSprite } from "../town/Sprites";
import LifeIcon from "./LifeIcon";
import "./lifestyle.css";
export default function CommunityPanel({
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
      copy(c(ja, en, hi), languageMode),
    me = world.players[selfId],
    person = world.town?.people[selfId],
    state = world.town?.community;
  const targets = [
    ...residentsOf(world).map((r) => ({
      id: r.id,
      name: copy(r.name, languageMode),
      near: true,
    })),
    ...Object.values(world.players)
      .filter((p) => p.id !== selfId && !p.spectator)
      .map((p) => ({
        id: p.id,
        name: p.hero?.name || p.name,
        near: socialNear(me, p),
      })),
  ];
  const [target, setTarget] = useState(targets[0]?.id || ""),
    [dish, setDish] = useState(""),
    [message, setMessage] = useState(""),
    [wrap, setWrap] = useState(0);
  const sentToday =
    state?.daily?.[selfId]?.day === world.town?.day
      ? state.daily[selfId].count
      : 0;
  const foods = ALL_DISHES.filter((d) => hasFood(person, d.id)),
    selected = foods.find((d) => d.id === dish) || foods[0],
    canSend =
      sentToday < 8 &&
      !!selected &&
      targets.some((t) => t.id === target && t.near) &&
      !world.ended &&
      !farmBusy(world, me);
  const gifts = (state?.gifts || [])
      .filter((g) => g.from === selfId || g.to === selfId)
      .slice(-24)
      .reverse(),
    name = (id: string) =>
      world.town?.people[id]?.name || world.players[id]?.name || id;
  return (
    <section className="life-expansion" data-testid="community-gifts">
      <header>
        <LifeIcon index={0} />
        <div>
          <h3>{L("料理の贈り物", "Food gifts", "りょうりのおくりもの")}</h3>
          <p>
            {L(
              "料理を包んで、気持ちと一緒に届けよう。参加者は受け取るか選べます。",
              "Wrap a meal with a message. Players can choose whether to receive it.",
              "りょうりをつつんで、きもちといっしょにとどけよう。さんかしゃはうけとるかえらべます。",
            )}
          </p>
        </div>
      </header>
      <div className="life-expansion-fields">
        <label>
          {L("贈る相手", "Recipient", "おくるあいて")}
          <select
            aria-label={L("贈る相手", "Recipient", "おくるあいて")}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            {targets.map((t) => (
              <option key={t.id} value={t.id} disabled={!t.near}>
                {t.name}
                {t.near
                  ? ""
                  : ` (${L("近くへ移動", "Move closer", "ちかくへいどう")})`}
              </option>
            ))}
          </select>
        </label>
        <label>
          {L("贈る料理", "Dish", "おくるりょうり")}
          <select
            aria-label={L("贈る料理", "Dish", "おくるりょうり")}
            value={selected?.id || ""}
            onChange={(e) => setDish(e.target.value)}
          >
            {foods.map((d) => (
              <option key={d.id} value={d.id}>
                {copy(d.name, languageMode)} ×
                {(person?.foods[d.id]?.normal || 0) +
                  (person?.foods[d.id]?.perfect || 0)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {L("ひとことメッセージ", "A short message", "ひとことめっせーじ")}
          <input
            aria-label={L(
              "ひとことメッセージ",
              "A short message",
              "ひとことめっせーじ",
            )}
            value={message}
            maxLength={80}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
      </div>
      <div className="life-expansion-wraps">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            aria-pressed={wrap === i}
            onClick={() => setWrap(i)}
            aria-label={`${L("包みを選ぶ", "Choose wrapping", "つつみをえらぶ")} ${i + 1}`}
          >
            <LifeIcon index={i} size={46} />
          </button>
        ))}
      </div>
      <button
        disabled={!canSend}
        onClick={() => {
          if (selected)
            send({
              type: "town-food-gift",
              target,
              dish: selected.id,
              message,
              wrap,
            });
        }}
      >
        {L("料理を贈る", "Send food gift", "りょうりをおくる")}
      </button>
      <small>
        {" "}
        {L("今日の贈り物", "Gifts today", "きょうのおくりもの")} {sentToday}/8
      </small>
      <p>
        {L(
          "親しさのボーナスは相手ごとに1日1回。大成功の料理や誕生日は特別な思い出に。",
          "Friendship bonus once per recipient per day. Perfect dishes and birthdays make special memories.",
          "したしさのぼーなすはあいてごとにいちにちいっかい。だいせいこうのりょうりやたんじょうびはとくべつなおもいでに。",
        )}
      </p>
      <div className="life-expansion-grid">
        {gifts.map((g) => {
          const d = dishById(g.dish);
          return (
            <article key={g.id}>
              <LifeIcon index={g.wrap} size={48} />
              {d && <FoodSprite id={d.id} />}
              <strong>
                {name(g.from)} → {name(g.to)}
              </strong>
              <span>
                {d && copy(d.name, languageMode)}
                {g.perfect ? " ★" : ""}
              </span>
              <p>{g.message}</p>
              <small>
                {g.status === "pending"
                  ? L("受け取り待ち", "Awaiting receipt", "うけとりまち")
                  : g.status === "accepted"
                    ? L(
                        "届いた思い出",
                        "A delivered memory",
                        "とどいたおもいで",
                      )
                    : L(
                        "送り主に返却済み",
                        "Returned to sender",
                        "おくりぬしにへんきゃくずみ",
                      )}
              </small>
              {g.status === "pending" && g.to === selfId && (
                <div>
                  <button
                    disabled={world.ended || farmBusy(world, me)}
                    onClick={() =>
                      send({ type: "town-food-answer", id: g.id, accept: true })
                    }
                  >
                    {L("受け取る", "Receive", "うけとる")}
                  </button>
                  <button
                    disabled={world.ended || farmBusy(world, me)}
                    onClick={() =>
                      send({
                        type: "town-food-answer",
                        id: g.id,
                        accept: false,
                      })
                    }
                  >
                    {L("今回は返す", "Return this gift", "こんかいはかえす")}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
