import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { World, Action } from "../engine";
import type { LanguageMode } from "../../types";
import { assetUrl } from "../../utils/assetPaths";
import { trans } from "../../utils/textUtils";
import { residentsOf } from "./residents";
import { residentNear, residentPosition } from "./worldResidents";
import {
  copy,
  PERSONALITIES,
  ROUTINES,
  OUTINGS,
  OUTING_SCENES,
  FLOWERS,
  ALL_DISHES,
} from "./catalog";
import { visibleFriendship } from "./model";
import { socialLineText, type SocialLine } from "../social";
import { FlowerSprite, FoodSprite } from "./Sprites";
import WordTeacher from "../WordTeacher";
import "./encounter.css";
import {
  OUTING_ACTIONS,
  OUTING_BACKGROUNDS,
  RESIDENT_STORIES,
} from "./conversationCatalog";
import { residentFacing } from "./sceneView";
import { useRpgPreferences } from "../preferences";
import WorldCanvas from "../WorldCanvas";
const MapScene = lazy(() => import("../WorldScene3D"));
class SceneBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  declare readonly props: {
    children: React.ReactNode;
    fallback: React.ReactNode;
  };
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function ResidentScene({
  world,
  selfId,
  target,
  languageMode,
  send,
  onClose,
  onEvent,
  talkLine,
}: {
  world: World;
  selfId: string;
  target: string;
  languageMode: LanguageMode;
  send: (a: Action) => void;
  onClose: () => void;
  onEvent?: (id: string) => void;
  talkLine?: SocialLine;
}) {
  const prefs = useRpgPreferences();
  const [sceneFailed, setSceneFailed] = useState(false);
  const originalMapView = useRef(prefs.mapView);
  const initialCompleted = useRef(
    new Set(world.town?.outings.filter((o) => o.done).map((o) => o.id)),
  );
  const t = (s: string) => trans(s, languageMode),
    C = (s: Parameters<typeof copy>[0]) => copy(s, languageMode),
    ref = useRef<HTMLElement>(null);
  const [page, setPage] = useState("talk"),
    [gift, setGift] = useState(""),
    [dish, setDish] = useState(""),
    [route, setRoute] = useState(0),
    [now, setNow] = useState(Date.now());
  const me = world.players[selfId],
    town = world.town,
    r = residentsOf(world).find((r) => r.id === target),
    person = town?.people[target],
    mine = town?.people[selfId],
    bond = town?.bonds.find(
      (b) => b.people.includes(selfId) && b.people.includes(target),
    ),
    home = world.life.houses.find((h) => h.owner === selfId),
    custom = town?.customResidents?.find((r) => r.id === target),
    pos = residentPosition(world, target);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => {
      clearInterval(timer);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    if (
      !residentNear(world, me, target) ||
      world.ended ||
      me.nativeScene ||
      me.spectator
    )
      closeRef.current();
  }, [
    world.revision,
    world.ended,
    me.x,
    me.y,
    me.nativeScene,
    me.spectator,
    target,
  ]);
  useEffect(() => {
    if (town?.encounters?.[selfId]?.target === target) return;
    const timer = setTimeout(() => closeRef.current(), 5000);
    return () => clearTimeout(timer);
  }, [town?.encounters?.[selfId]?.target, target]);
  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    const timer = setInterval(
      () => sendRef.current({ type: "town-encounter", target }),
      30000,
    );
    return () => {
      clearInterval(timer);
      sendRef.current({ type: "town-encounter", target: null });
    };
  }, [target]);
  if (!r || !person || !mine) return null;
  const ready =
    residentNear(world, me, target) &&
    town?.encounters?.[selfId]?.target === target &&
    !me.life?.work &&
    !me.duelId &&
    !me.dungeonId &&
    !town.cooking[selfId];
  const flowers = FLOWERS.filter((f) => mine.flowers[f.id] > 0),
    foods = ALL_DISHES.filter(
      (d) =>
        (mine.foods[d.id]?.normal || 0) + (mine.foods[d.id]?.perfect || 0) > 0,
    ),
    flower = flowers.find((f) => f.id === gift) || flowers[0],
    food = foods.find((f) => f.id === dish) || foods[0],
    friendship = visibleFriendship(world, selfId, target);
  const talk = world.social?.talks
      .filter((v) => v.people.includes(selfId) && v.people.includes(target))
      .at(-1),
    line =
      talkLine &&
      talk?.lines.some(
        (l) => l.speaker === talkLine.speaker && l.text === talkLine.text,
      )
        ? talkLine
        : talk?.lines.at(-1),
    portrait = custom?.hero?.frames.idle[0] || r.portrait;
  const act = (a: Action) => {
      if (ready) send(a);
    },
    outing = town.outings.find(
      (o) => !o.done && o.people.includes(selfId) && o.people.includes(target),
    );
  const trip = town.outings
    .filter(
      (o) =>
        o.people.includes(selfId) &&
        o.people.includes(target) &&
        (!o.done || !initialCompleted.current.has(o.id)),
    )
    .at(-1);
  const scenic = page === "outing" && trip;
  const story = town.stories?.[selfId];
  const outdoor = !me.life?.indoors;
  const mapProps = { world, selfId, overview: false, onTile: () => {} };
  const flat = <WorldCanvas {...mapProps} />;
  return (
    <section
      className={"resident-screen resident-" + page}
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label={t("住人との交流")}
      data-testid="resident-screen"
      data-original-map-view={originalMapView.current}
      data-background={
        scenic ? `outing-${trip.route}` : outdoor ? "3D" : "room"
      }
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <header>
        <div>
          <small>{t("住人との交流")}</small>
          <h1>{C(r.name)}</h1>
        </div>
        <span>
          {t("友好度")} {friendship}/100
          <meter value={friendship} min="0" max="100" />
        </span>
        <button onClick={onClose}>{t("マップに戻る")}</button>
      </header>
      <div className="resident-body">
        <div
          className={`resident-stage ${scenic ? "resident-outing-stage" : outdoor ? "resident-world-stage" : ""}`}
          aria-label={C(r.name)}
        >
          {scenic ? (
            <img
              className="resident-outing-background"
              src={assetUrl(OUTING_BACKGROUNDS[trip.route])}
              alt={C(OUTINGS[trip.route])}
            />
          ) : outdoor ? (
            <div className="resident-map-scene" aria-hidden="true">
              <SceneBoundary fallback={flat}>
                <Suspense fallback={flat}>
                  {sceneFailed ? (
                    flat
                  ) : (
                    <MapScene
                      presentation="conversation"
                      hiddenActors={[
                        target,
                        ...(pos.siteId ? [pos.siteId] : []),
                      ]}
                      {...mapProps}
                      facing={residentFacing(me, pos)}
                      onFacing={() => {}}
                      onUnavailable={() => setSceneFailed(true)}
                    />
                  )}
                </Suspense>
              </SceneBoundary>
            </div>
          ) : (
            <>
              <div className="resident-stage-window" />
              <div className="resident-stage-rug" />
            </>
          )}
          {scenic && (
            <div className="resident-destination">
              {C(OUTINGS[trip.route])} · {Math.min(trip.step + 1, 3)}/3
            </div>
          )}
          {(me.hero?.frames.idle[0] || me.profile?.image) && (
            <img
              className={"resident-self " + (scenic ? "resident-traveler" : "")}
              src={assetUrl(me.hero?.frames.idle[0] || me.profile.image)}
              alt=""
            />
          )}
          <img
            className={
              "resident-portrait " +
              (line?.speaker === target ? "speaking" : "")
            }
            src={assetUrl(portrait)}
            alt={C(r.name)}
          />
          <div className="resident-speech" aria-live="polite">
            <strong>
              {line?.speaker === selfId ? me.hero?.name || me.name : C(r.name)}
            </strong>
            <p>
              {line
                ? socialLineText(line, languageMode)
                : t("近くで会うと、おしゃべりや贈り物で仲良くなれます。")}
            </p>
          </div>
          <div className="resident-mood">
            {C(PERSONALITIES[person.personality])} ·{" "}
            {C(ROUTINES[person.routine])}
          </div>
        </div>
        <div className="resident-controls">
          <nav aria-label={t("住人へのアクション")}>
            {[
              ["talk", "おしゃべり"],
              ["gift", "贈り物"],
              ["outing", "お出かけ"],
              ["words", "言葉を教える"],
              ["home", "住人と暮らす"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={page === id}
                onClick={() => setPage(id)}
              >
                {t(label)}
              </button>
            ))}
          </nav>
          <div className="resident-action-content">
            <p className="resident-feedback" role="status">
              {ready ? t(me.message) : t("相手に声をかけています…")}
            </p>
            {page === "talk" && (
              <>
                {story?.target === target ? (
                  <div className="resident-story">
                    <h2>{C(RESIDENT_STORIES[story.index].title)}</h2>
                    <p>{C(RESIDENT_STORIES[story.index].scene)}</p>
                    {RESIDENT_STORIES[story.index].choices.map((choice, i) => (
                      <button
                        key={i}
                        disabled={!ready}
                        onClick={() =>
                          act({ type: "town-story-choice", choice: i })
                        }
                      >
                        {C(choice)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    disabled={!ready || now - (bond?.lastTalk || 0) < 12000}
                    onClick={() => act({ type: "town-story-start", target })}
                  >
                    {t("小さな出来事")}
                  </button>
                )}
                <button
                  className="resident-main-action"
                  disabled={
                    !ready || !!story || now - (bond?.lastTalk || 0) < 12000
                  }
                  onClick={() => act({ type: "town-talk", target })}
                >
                  {t("おしゃべり")}
                </button>
                {now - (bond?.lastTalk || 0) < 12000 && (
                  <p>{t("会話を楽しんでから、次のお話へ。")}</p>
                )}
                {bond?.conflict && (
                  <>
                    <p>
                      {t("ケンカ中")}：{C(bond.conflict.reason)}
                    </p>
                    <button
                      disabled={!ready}
                      onClick={() => act({ type: "town-apologize", target })}
                    >
                      {t("気持ちを伝える")}
                    </button>
                    <button
                      disabled={!ready}
                      onClick={() => act({ type: "town-mediate", target })}
                    >
                      {t("友達に仲裁を頼む")}
                    </button>
                  </>
                )}
                {pos.siteId && onEvent && (
                  <button onClick={() => onEvent(pos.siteId!)}>
                    {t("仕事や旅の話を聞く")}
                  </button>
                )}
                <p>
                  {t(
                    "会話の反応や贈り物の好みを知り、少しずつ友好度を育てましょう。",
                  )}
                </p>
              </>
            )}
            {page === "gift" && (
              <>
                <h2>{t("花を贈る")}</h2>
                {flower ? (
                  <>
                    <FlowerSprite id={flower.id} />
                    <label>
                      {t("贈る花")}
                      <select
                        aria-label={t("贈る花")}
                        value={flower.id}
                        onChange={(e) => setGift(e.target.value)}
                      >
                        {flowers.map((f) => (
                          <option key={f.id} value={f.id}>
                            {C(f.name)} ×{mine.flowers[f.id]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      disabled={!ready}
                      onClick={() =>
                        act({ type: "town-gift", target, flower: flower.id })
                      }
                    >
                      {t("花を贈る")}
                    </button>
                  </>
                ) : (
                  <p>{t("所持している花がありません。")}</p>
                )}
                <h2>{t("料理をふるまう")}</h2>
                {food ? (
                  <>
                    <FoodSprite id={food.id} />
                    <label>
                      {t("料理")}
                      <select
                        aria-label={t("ふるまう料理")}
                        value={food.id}
                        onChange={(e) => setDish(e.target.value)}
                      >
                        {foods.map((d) => (
                          <option key={d.id} value={d.id}>
                            {C(d.name)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      disabled={!ready}
                      onClick={() =>
                        act({ type: "town-meal", target, dish: food.id })
                      }
                    >
                      {t("食べてもらう")}
                    </button>
                  </>
                ) : (
                  <p>{t("料理を作ってから持ってきましょう。")}</p>
                )}
              </>
            )}
            {page === "words" && (
              <WordTeacher
                world={world}
                target={target}
                send={act}
                languageMode={languageMode}
                disabled={!ready}
              />
            )}
            {page === "outing" && (
              <>
                {outing ? (
                  <>
                    <h2>
                      {C(OUTINGS[outing.route])} {outing.step + 1}/3
                    </h2>
                    <p>{C(OUTING_SCENES[outing.route][outing.step])}</p>
                    {OUTING_ACTIONS[outing.route][outing.step].map((v, i) => (
                      <button
                        key={i}
                        disabled={
                          !ready || outing.answers[selfId] !== undefined
                        }
                        onClick={() =>
                          act({
                            type: "town-outing-choice",
                            id: outing.id,
                            choice: i,
                          })
                        }
                      >
                        {C(v)}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        act({ type: "town-outing-leave", id: outing.id })
                      }
                    >
                      {t("今回は帰る")}
                    </button>
                  </>
                ) : (
                  <>
                    <label>
                      {t("行き先")}
                      <select
                        value={route}
                        onChange={(e) => setRoute(Number(e.target.value))}
                      >
                        {OUTINGS.map((v, i) => (
                          <option key={i} value={i}>
                            {C(v)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      disabled={!ready || friendship < 10}
                      onClick={() =>
                        act({
                          type: "town-invite",
                          target,
                          kind: "outing",
                          outing: route,
                        })
                      }
                    >
                      {t("お出かけに誘う")}
                    </button>
                  </>
                )}
                <button
                  disabled={!ready || !home || friendship < 10}
                  onClick={() =>
                    act({ type: "town-invite", target, kind: "visit" })
                  }
                >
                  {t("家に招く")}
                </button>
                <p>
                  {t(
                    "参加者のお誘いは相手が受けた時だけ成立します。住人は友好度10から誘えます。",
                  )}
                </p>
              </>
            )}
            {page === "home" && (
              <>
                <p>
                  {t("友好度20で同居、50で結婚。自分の家を用意しましょう。")}
                </p>
                <button
                  disabled={
                    !ready || !home || friendship < 20 || !!bond?.houseId
                  }
                  onClick={() => act({ type: "town-resident-home", target })}
                >
                  {t("同居を申し込む")}
                </button>
                <button
                  disabled={
                    !ready ||
                    !home ||
                    friendship < 50 ||
                    bond?.marriedDay !== undefined
                  }
                  onClick={() => act({ type: "town-resident-marry", target })}
                >
                  {t("結婚を申し込む")}
                </button>
                {bond?.houseId && (
                  <button
                    disabled={!ready}
                    onClick={() =>
                      act({
                        type: "town-resident-end",
                        target,
                        kind: "cohabit",
                      })
                    }
                  >
                    {t("同居を解消する")}
                  </button>
                )}
                {bond?.marriedDay !== undefined && (
                  <button
                    disabled={!ready}
                    onClick={() =>
                      act({ type: "town-resident-end", target, kind: "marry" })
                    }
                  >
                    {t("結婚を解消する")}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
