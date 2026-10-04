import CitySprite from "./CitySprite";
import React, { useState, useEffect, useRef } from "react";
import type { World, Action } from "../engine";
import { WIDTH, HEIGHT } from "../engine";
import type { LanguageMode } from "../../types";
import { copy, c } from "../town/catalog";
import {
  CITY_BUILDINGS,
  CITY_SERVICES,
  CITY_POLICIES,
  CITY_CHALLENGES,
  cityBuilding,
} from "./catalog";
import { validCityTile } from "./model";
import "../life.css";
import "./city.css";
import { useRpgPreferences } from "../preferences";
export default function CityPanel({
  world,
  selfId,
  send,
  languageMode,
  onClose,
}: {
  world: World;
  selfId: string;
  send: (a: Action) => void;
  languageMode: LanguageMode;
  onClose: () => void;
}) {
  const prefs = useRpgPreferences(),
    panel = useRef<HTMLElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close.current();
      }
      if (e.key === "Tab") {
        const nodes = Array.from(
            panel.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled),input:not(:disabled),select:not(:disabled)",
            ) || [],
          ) as HTMLElement[],
          first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("keydown", key, true);
      before?.focus();
    };
  }, []);
  const s = world.city!,
    p = world.players[selfId],
    L = (ja: string, en: string, hi: string) =>
      copy(c(ja, en, hi), languageMode),
    C = (v: Parameters<typeof copy>[0]) => copy(v, languageMode);
  const [tab, setTab] = useState("build"),
    [tool, setTool] = useState("road"),
    [target, setTarget] = useState({ x: p.x, y: p.y }),
    [center, setCenter] = useState(s.origin),
    [tax, setTax] = useState(s.tax);
  const minX = Math.max(2, Math.min(WIDTH - 26, center.x - 12)),
    minY = Math.max(2, Math.min(HEIGHT - 20, center.y - 9)),
    lot = s.lots.find((l) => l.x === target.x && l.y === target.y),
    def = cityBuilding(tool),
    canBuild =
      validCityTile(world, target.x, target.y) &&
      !lot &&
      !s.roads.includes(target.y * WIDTH + target.x) &&
      (!def || (s.level >= def.level && s.treasury >= def.cost)),
    own = lot?.owner === selfId;
  const selectBuild = () =>
    send(
      tool === "road"
        ? { type: "city-road", tiles: [target.y * WIDTH + target.x] }
        : { type: "city-build", kind: tool, ...target },
    );
  return (
    <div
      className="rpg-life-backdrop city-backdrop"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <section
        ref={panel}
        className={
          "rpg-life city-panel " +
          (prefs.contrast ? "rpg-high-contrast " : "") +
          (prefs.largeText ? "rpg-large-text " : "") +
          (prefs.largeControls ? "rpg-large-controls " : "") +
          (prefs.reducedMotion ? "rpg-reduced-motion" : "")
        }
        role="dialog"
        aria-modal="true"
        aria-label={L("都市運営", "City management", "としうんえい")}
      >
        <header>
          <div>
            <small>
              FRONTIER CITY · {L("月", "Month", "つき")} {s.month}
            </small>
            <h2>
              {L(
                "みんなの街を育てよう",
                "Grow your city together",
                "みんなのまちをそだてよう",
              )}
            </h2>
          </div>
          <button onClick={onClose} aria-label={L("閉じる", "Close", "とじる")}>
            ×
          </button>
        </header>
        <div className="city-summary">
          <span>☺ {s.happiness}%</span>
          <span>♟ {s.population}</span>
          <span>◈ {Math.floor(s.treasury)}</span>
          <span>
            {L("市の段階", "City level", "しのだんかい")} {s.level}
          </span>
        </div>
        <nav>
          {[
            ["build", "建設", "Build", "けんせつ"],
            ["status", "街の状況", "City status", "まちのじょうきょう"],
            [
              "finance",
              "財政・政策",
              "Finance and policy",
              "ざいせい・せいさく",
            ],
            ["services", "サービス", "Services", "さーびす"],
            ["projects", "街の目標", "City goals", "まちのもくひょう"],
          ].map(([id, ja, en, hi]) => (
            <button
              key={id}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {L(ja, en, hi)}
            </button>
          ))}
        </nav>
        <div className="city-scroll">
          {tab === "build" && (
            <>
              <p>
                {L(
                  "地図で場所を選び、下の建設ボタンで確定。道路は既存の街道につなぎ、建物を道路の隣に建てましょう。",
                  "Choose a map tile and confirm construction below. Connect roads to existing roads and place buildings beside them.",
                  "ちずでばしょをえらび、したのけんせつぼたんでかくてい。どうろはきそんのかいどうにつなぎ、たてものをどうろのとなりにたてましょう。",
                )}
              </p>
              <div className="city-build-layout">
                <div>
                  <div
                    className="city-map"
                    role="group"
                    aria-label={L(
                      "都市建設マップ",
                      "City construction map",
                      "としけんせつまっぷ",
                    )}
                  >
                    {Array.from({ length: 432 }, (_, i) => {
                      const x = minX + (i % 24),
                        y = minY + Math.floor(i / 24),
                        tile = y * WIDTH + x,
                        building = s.lots.find((l) => l.x === x && l.y === y),
                        b = building && cityBuilding(building.kind);
                      return (
                        <button
                          key={i}
                          className={
                            (world.tiles[tile] === "water"
                              ? "water "
                              : world.tiles[tile] === "road" ||
                                  s.roads.includes(tile)
                                ? "road "
                                : "") +
                            (x === target.x && y === target.y
                              ? "selected "
                              : "") +
                            (building?.damage ? "damaged" : "")
                          }
                          aria-label={
                            x +
                            ", " +
                            y +
                            " " +
                            (b ? C(b.name) : L("空き地", "Land", "あきち"))
                          }
                          onClick={() => setTarget({ x, y })}
                        >
                          {b ? (
                            <CitySprite index={b.index} />
                          ) : world.life.houses.some(
                              (h) => h.x === x && h.y === y,
                            ) ? (
                            "⌂"
                          ) : world.sites.some(
                              (s) => s.x === x && s.y === y,
                            ) ? (
                            "◆"
                          ) : (
                            ""
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="city-map-pan">
                    {[
                      [0, -8, "↑"],
                      [-8, 0, "←"],
                      [8, 0, "→"],
                      [0, 8, "↓"],
                    ].map(([dx, dy, label]) => (
                      <button
                        key={String(label)}
                        onClick={() =>
                          setCenter({
                            x: Math.max(
                              12,
                              Math.min(WIDTH - 14, center.x + Number(dx)),
                            ),
                            y: Math.max(
                              9,
                              Math.min(HEIGHT - 11, center.y + Number(dy)),
                            ),
                          })
                        }
                      >
                        {label}
                      </button>
                    ))}
                    <button onClick={() => setCenter({ x: p.x, y: p.y })}>
                      {L("主人公の位置", "Hero location", "しゅじんこうのいち")}
                    </button>
                  </div>
                  <p>
                    {target.x}, {target.y} ·{" "}
                    {lot
                      ? C(cityBuilding(lot.kind)!.name)
                      : def
                        ? C(def.name)
                        : L("道路", "Road", "どうろ")}
                  </p>
                  {lot ? (
                    <>
                      <p>
                        {L("人口", "Population", "じんこう")} {lot.people} · ☺
                        {lot.happiness}% ·{" "}
                        {L(
                          lot.connected ? "道路接続済み" : "道路が未接続",
                          lot.connected
                            ? "Road connected"
                            : "No road connection",
                          lot.connected
                            ? "どうろせつぞくずみ"
                            : "どうろがみせつぞく",
                        )}
                      </p>
                      <div className="city-buttons">
                        <button
                          disabled={!own || lot.level >= 3 || s.level < lot.level || s.treasury < cityBuilding(lot.kind)!.cost * lot.level}
                          onClick={() =>
                            send({ type: "city-upgrade", id: lot.id })
                          }
                        >
                          {L("建物を改良", "Upgrade", "たてものをかいりょう")}{" "}
                          {cityBuilding(lot.kind)!.cost * lot.level}◈
                        </button>
                        <button
                          disabled={!own || !lot.damage || s.treasury < Math.floor(cityBuilding(lot.kind)!.cost * .3)}
                          onClick={() =>
                            send({ type: "city-repair", id: lot.id })
                          }
                        >
                          {L("修理する", "Repair", "しゅうりする")}
                        </button>
                        <button
                          disabled={!own}
                          onClick={() =>
                            send({ type: "city-demolish", id: lot.id })
                          }
                        >
                          {L("取り壊す", "Demolish", "とりこわす")}
                        </button>
                      </div>
                    </>
                  ) : s.roads.includes(target.y * WIDTH + target.x) ? (
                    <button
                      onClick={() =>
                        send({
                          type: "city-road-remove",
                          tiles: [target.y * WIDTH + target.x],
                        })
                      }
                    >
                      {L("道路を撤去", "Remove road", "どうろをてっきょ")}
                    </button>
                  ) : (
                    <button
                      className="city-confirm"
                      disabled={!canBuild || s.treasury < (def?.cost ?? 8)}
                      onClick={selectBuild}
                    >
                      {L("ここに建設する", "Build here", "ここにけんせつする")}{" "}
                      · {def?.cost ?? 8}◈
                    </button>
                  )}
                </div>
                <div className="city-catalog">
                  <button
                    aria-pressed={tool === "road"}
                    onClick={() => setTool("road")}
                  >
                    ╋ {L("道路", "Road", "どうろ")} · 8◈
                  </button>
                  {CITY_BUILDINGS.map((b) => (
                    <button
                      key={b.id}
                      aria-pressed={tool === b.id}
                      disabled={
                        b.level > s.level ||
                        (b.id === "hall" &&
                          s.lots.some((l) => l.kind === "hall"))
                      }
                      onClick={() => setTool(b.id)}
                    >
                      <CitySprite index={b.index} />
                      <strong>{C(b.name)}</strong>
                      <small>
                        {b.cost}◈ ·{" "}
                        {L("月維持費", "Monthly upkeep", "つきいじひ")}{" "}
                        {b.upkeep}
                      </small>
                      {b.level > s.level && (
                        <small>
                          {L("市の段階", "City level", "しのだんかい")}{" "}
                          {b.level}
                        </small>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {tab === "status" && (
            <>
              <div className="town-stat-grid">
                {[
                  [L("幸福度", "Happiness", "こうふくど"), s.happiness],
                  [L("渋滞", "Traffic", "じゅうたい"), s.traffic],
                  [L("汚染", "Pollution", "おせん"), s.pollution],
                ].map(([label, value]) => (
                  <label key={label}>
                    {label} {value}%<meter max={100} value={Number(value)} />
                  </label>
                ))}
              </div>
              <p>
                {L("人口", "Population", "じんこう")} {s.population} ·{" "}
                {L("雇用", "Jobs", "こよう")} {s.jobs} ·{" "}
                {L("住宅需要", "Housing demand", "じゅうたくじゅよう")}{" "}
                {Math.max(0, s.jobs * 2 - s.population)}
              </p>
              <p>
                {L(
                  "電気と水、雇用、近くの公共サービスで住民が増えます。高い税率、工房の汚染、渋滞、災害は幸福度を下げます。",
                  "Power, water, jobs and nearby services attract residents. High taxes, pollution, traffic and disasters reduce happiness.",
                  "でんきとみず、こよう、ちかくのこうきょうさーびすでじゅうみんがふえます。たかいぜいりつ、こうぼうのおせん、じゅうたい、さいがいはこうふくどをさげます。",
                )}
              </p>
              <svg
                viewBox="0 0 480 130"
                aria-label={L(
                  "幸福度の履歴",
                  "Happiness history",
                  "こうふくどのりれき",
                )}
              >
                <path
                  d={
                    s.history.length
                      ? "M" +
                        s.history
                          .map((h, i) => i * 10 + "," + (120 - h.happiness))
                          .join(" L")
                      : ""
                  }
                  fill="none"
                  stroke="#e8c671"
                  strokeWidth={3}
                />
              </svg>
              {s.news
                .slice(-12)
                .reverse()
                .map((n, i) => (
                  <p key={i}>
                    {n.month} ·{" "}
                    {L(
                      (
                        {
                          unlock: "都市運営が解禁",
                          milestone: "街が発展し補助金が届きました",
                          deficit: "赤字です。予算を見直しましょう",
                          fire: "火災発生。建物を修理してください",
                          festival: "街のお祭りを楽しみました",
                          request: "公共サービスを改善しましょう",
                          challenge: "街の目標を達成",
                        } as Record<string, string>
                      )[n.kind] || n.kind,
                      (
                        {
                          unlock: "City unlocked",
                          milestone: "City milestone and grant",
                          deficit: "Budget deficit",
                          fire: "Fire damage: repair needed",
                          festival: "City festival",
                          request: "Improve public services",
                          challenge: "City goal achieved",
                        } as Record<string, string>
                      )[n.kind] || n.kind,
                      (
                        {
                          unlock: "としうんえいがかいきん",
                          milestone: "まちがはってんしほじょきんがとどきました",
                          deficit: "あかじです。よさんをみなおしましょう",
                          fire: "かさいはっせい。たてものをしゅうりしてください",
                          festival: "まちのおまつりをたのしみました",
                          request: "こうきょうさーびすをかいぜんしましょう",
                          challenge: "まちのもくひょうをたっせい",
                        } as Record<string, string>
                      )[n.kind] || n.kind,
                    )}
                  </p>
                ))}
            </>
          )}
          {tab === "finance" && (
            <>
              <p>
                {L("月収入", "Monthly income", "つきしゅうにゅう")} {s.income}◈
                · {L("月支出", "Monthly expenses", "つきししゅつ")} {s.expenses}
                ◈ · {L("収支", "Net balance", "しゅうし")}{" "}
                {s.income - s.expenses}◈
              </p>
              <label>
                {L("税率", "Tax rate", "ぜいりつ")} {tax}%
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value))}
                />
              </label>
              <button onClick={() => send({ type: "city-tax", tax })}>
                {L("税率を適用", "Apply tax rate", "ぜいりつをてきよう")}
              </button>
              <p>
                {L("借入残高", "Loan balance", "かりいれざんだか")}{" "}
                {s.debt || 0}◈
              </p>
              <div className="city-buttons">
                <button
                  disabled={(s.debt || 0) >= 5000}
                  onClick={() => send({ type: "city-loan", amount: 500 })}
                >
                  {L("500を借りる", "Borrow 500", "500をかりる")}
                </button>
                <button
                  disabled={!s.debt || s.treasury < 1}
                  onClick={() => send({ type: "city-repay" })}
                >
                  {L("借入を返済", "Repay loan", "かりいれをへんさい")}
                </button>
                <button
                  disabled={
                    s.treasury >= 100 || s.month - (s.aidMonth ?? -6) < 6
                  }
                  onClick={() => send({ type: "city-aid" })}
                >
                  {L(
                    "緊急援助を申請",
                    "Request emergency aid",
                    "きんきゅうえんじょをしんせい",
                  )}
                </button>
              </div>
              <h3>{L("街の政策", "City policies", "まちのせいさく")}</h3>
              {CITY_POLICIES.map((v, i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={s.policies[i]}
                    onChange={(e) =>
                      send({
                        type: "city-policy",
                        index: i,
                        enabled: e.target.checked,
                      })
                    }
                  />
                  {C(v)} · 12◈/{L("月", "month", "つき")}
                </label>
              ))}
            </>
          )}
          {tab === "services" && (
            <>
              {CITY_SERVICES.map(([key, label]) => (
                <article className="town-card" key={key}>
                  <strong>
                    {C(label)} · {s.services[key] || 0}%
                  </strong>
                  <meter value={s.services[key] || 0} max={100} />
                  <label>
                    {L("サービス予算", "Service budget", "さーびすよさん")}
                    <select
                      value={s.budgets[key]}
                      onChange={(e) =>
                        send({
                          type: "city-budget",
                          service: key,
                          amount: Number(e.target.value),
                        })
                      }
                    >
                      {[50, 75, 100, 125, 150].map((n) => (
                        <option key={n} value={n}>
                          {n}%
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
              ))}
            </>
          )}
          {tab === "projects" && (
            <>
              <h3>
                {C(CITY_CHALLENGES[s.challenge])} · {s.challengeRound + 1}
              </h3>
              <p>
                {
                  [
                    s.population + "/" + (25 + 25 * s.challengeRound),
                    s.happiness + "/65",
                    s.lots.filter((l) => l.kind === "park").length +
                      "/" +
                      (2 + s.challengeRound),
                    s.jobs + "/" + (30 + 20 * s.challengeRound),
                    s.lots.filter((l) => l.connected).length +
                      "/" +
                      Math.max(8, s.lots.length),
                    Object.values(s.services).filter((v) => v >= 75).length +
                      "/6",
                  ][s.challenge]
                }
              </p>
              <button onClick={() => send({ type: "city-challenge" })}>
                {L(
                  "達成報酬を受け取る",
                  "Claim goal reward",
                  "たっせいほうしゅうをうけとる",
                )}{" "}
                · {250 + 75 * s.challengeRound}◈
              </button>
              <p>
                {L(
                  "目標は繰り返し更新されます。都市運営に制限時間やゲームオーバーはありません。30秒で1か月進み、財政・需要・事件が変化します。",
                  "Goals repeat with new targets. There is no time limit or game over. Every 30 seconds a month passes, changing finances, demand and events.",
                  "もくひょうはくりかえしこうしんされます。としうんえいにせいげんじかんやげーむおーばーはありません。30びょうで1かげつすすみ、ざいせい・じゅよう・じけんがへんかします。",
                )}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
