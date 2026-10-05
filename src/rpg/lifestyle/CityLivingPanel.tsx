import React from "react";
import type { World, Action } from "../engine";
import type { LanguageMode } from "../../types";
import { c, copy } from "../town/catalog";
import { cityBuilding } from "../city/catalog";
import { CITY_PROJECTS, DISTRICT_PLANS } from "./catalog";
import { cityRequests, cityAdvice } from "./cityLiving";
import LifeIcon from "./LifeIcon";
import "./lifestyle.css";
export default function CityLivingPanel({
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
  const s = world.city!,
    C = (v: Parameters<typeof copy>[0]) => copy(v, languageMode),
    L = (ja: string, en: string, hi: string) => C(c(ja, en, hi));
  return (
    <section className="life-expansion" data-testid="city-living">
      <header>
        <LifeIcon index={15} />
        <h3>
          {L("市民とつくる街", "A town made together", "しみんとつくるまち")}
        </h3>
      </header>
      {cityAdvice(s).map((v, i) => (
        <p key={i}>{C(v)}</p>
      ))}
      <div className="life-expansion-grid">
        {cityRequests(world).map((q) => (
          <article key={q.id}>
            <strong>{C(q.name)}</strong>
            <p>{C(q.detail)}</p>
            <button
              disabled={!q.ready || s.living?.claimed.includes(q.id)}
              onClick={() => send({ type: "city-request", id: q.id })}
            >
              {L(
                "要望達成の報酬",
                "Fulfilment reward",
                "ようぼうたっせいのほうしゅう",
              )}{" "}
              +{q.reward}
            </button>
          </article>
        ))}
      </div>
      <h3>
        {L("交流プロジェクト", "Community projects", "こうりゅうぷろじぇくと")}
      </h3>
      <div className="life-expansion-grid">
        {CITY_PROJECTS.map((d) => {
          const p = s.living?.projects.find((p) => p.id === d.id);
          return (
            <article key={d.id}>
              <LifeIcon index={d.icon} />
              <strong>{C(d.name)}</strong>
              <span>
                {d.cost} · {d.months}
                {L("か月", " months", "かげつ")}
              </span>
              <small>
                {L("幸福度", "Happiness", "こうふくど")} +{d.happiness} ·{" "}
                {L("汚染", "Pollution", "おせん")} −{d.pollution}
              </small>
              <button
                disabled={!!p || s.treasury < d.cost}
                onClick={() => send({ type: "city-project", project: d.id })}
              >
                {p
                  ? p.complete
                    ? L("完成", "Complete", "かんせい")
                    : `${Math.min(d.months, s.month - p.started)}/${d.months}`
                  : L(
                      "取り組みを始める",
                      "Start project",
                      "とりくみをはじめる",
                    )}
              </button>
            </article>
          );
        })}
      </div>
      <h3>{L("地区の暮らし方", "District identity", "ちくのくらしかた")}</h3>
      <p>
        {L(
          "建物ごとに地区方針を指定。変更は30コイン。雇用・緑・幸福度に反映されます。",
          "Choose each building’s district plan. Changes cost 30 and affect jobs, greenery and happiness.",
          "たてものごとにちくほうしんをしてい。へんこうはさんじゅうこいん。こよう・みどり・こうふくどにはんえいされます。",
        )}
      </p>
      <div className="life-expansion-grid">
        {s.lots
          .filter((l) => l.owner === selfId)
          .map((l) => (
            <label key={l.id}>
              {C(cityBuilding(l.kind)!.name)} ({l.x},{l.y})
              <select
                value={l.district || "balanced"}
                disabled={s.treasury < 30}
                onChange={(e) =>
                  send({
                    type: "city-district",
                    id: l.id,
                    plan: e.target.value,
                  })
                }
              >
                {DISTRICT_PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {C(p.name)}
                  </option>
                ))}
              </select>
            </label>
          ))}
      </div>
    </section>
  );
}
