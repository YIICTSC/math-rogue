import React, { useState } from "react";
import type { World, Action } from "../engine";
import type { LanguageMode } from "../../types";
import { c, copy } from "../town/catalog";
import { farmMapTargets, type FarmMapTarget } from "./mapTargets";
import { farmBusy, plotLimit } from "./model";
import { calendar } from "../town/model";
import { CROPS, cropById, animalById, petById } from "./catalog";
import { PET_TRICKS, trickCopy } from "../lifestyle/catalog";
import FarmSprite from "./Sprite";
import LifeIcon from "../lifestyle/LifeIcon";
import "./quick.css";
export default function FarmQuickActions({
  world,
  selfId,
  send,
  languageMode,
  onOpen,
  disabled,
}: {
  world: World;
  selfId: string;
  send: (a: Action) => void;
  languageMode: LanguageMode;
  onOpen: () => void;
  disabled: boolean;
}) {
  const p = world.players[selfId],
    f = world.farm?.people[selfId],
    cal = calendar(world),
    L = (ja: string, en: string, hi: string) =>
      copy(c(ja, en, hi), languageMode),
    [selected, setSelected] = useState(""),
    [seed, setSeed] = useState("");
  const targets = p
      ? farmMapTargets(world, p).filter(
          (t) => t.kind !== "plot" || Number(t.id) < plotLimit(f!),
        )
      : [],
    target =
      targets.find((t) => `${t.kind}:${t.id}` === selected) || targets[0];
  if (!f || !target || p.life?.indoors) return null;
  const busy = disabled || world.ended || farmBusy(world, p),
    plot =
      target.kind === "plot"
        ? f.plots.find((a) => String(a.slot) === target.id)
        : undefined,
    animal =
      target.kind === "animal"
        ? f.animals.find((a) => a.id === target.id)
        : undefined,
    pet =
      target.kind === "pet"
        ? f.pets.find((a) => a.id === target.id)
        : undefined;
  const seeds = CROPS.filter(
      (c) =>
        (f.seeds[c.id] || 0) > 0 &&
        (c.season === cal.season || f.upgrades.includes("greenhouse")),
    ),
    chosen = seeds.find((c) => c.id === seed) || seeds[0];
  const act = (
      operation: string,
      extra: { crop?: string; trick?: string } = {},
    ) =>
      send({
        type: "farm-quick",
        kind: target.kind,
        id: target.id,
        operation,
        ...extra,
      }),
    icon = (t: FarmMapTarget) => {
      const item =
        t.kind === "plot"
          ? f.plots.find((p) => String(p.slot) === t.id)?.crop
          : t.kind === "animal"
            ? f.animals.find((a) => a.id === t.id)?.kind
            : f.pets.find((a) => a.id === t.id)?.kind;
      return item ? (
        <FarmSprite kind={t.kind === "plot" ? "crop" : t.kind} id={item} />
      ) : (
        <LifeIcon index={6} size={34} />
      );
    };
  return (
    <section
      className="rpg-farm-quick"
      aria-label={L(
        "近くの農作業",
        "Nearby farm actions",
        "ちかくののうさぎょう",
      )}
      data-testid="farm-quick"
    >
      <div className="rpg-farm-targets">
        {targets.slice(0, 5).map((t) => (
          <button
            key={`${t.kind}:${t.id}`}
            aria-pressed={t === target}
            aria-label={
              t.kind === "plot"
                ? `${L("畑", "Plot", "はたけ")} ${Number(t.id) + 1}`
                : t.kind === "animal"
                  ? f.animals.find((a) => a.id === t.id)!.name
                  : f.pets.find((a) => a.id === t.id)!.name
            }
            onClick={() => setSelected(`${t.kind}:${t.id}`)}
          >
            {icon(t)}
          </button>
        ))}
        <button
          onClick={onOpen}
          aria-label={L(
            "農園を詳しく見る",
            "Open farm details",
            "のうえんをくわしくみる",
          )}
        >
          ⋯
        </button>
      </div>
      <strong>
        {plot
          ? `${plot.crop ? copy(cropById(plot.crop)!.name, languageMode) : L("空いている畑", "Empty plot", "あいているはたけ")} ${Number(target.id) + 1}`
          : animal?.name || pet?.name}
      </strong>
      <div className="rpg-farm-buttons">
        {plot &&
          (!plot.crop ? (
            <>
              <select
                aria-label={L("植える種", "Seeds to plant", "うえるたね")}
                value={chosen?.id || ""}
                onChange={(e) => setSeed(e.target.value)}
                disabled={busy || !seeds.length}
              >
                {seeds.map((s) => (
                  <option key={s.id} value={s.id}>
                    {copy(s.name, languageMode)} ×{f.seeds[s.id]}
                  </option>
                ))}
                {!seeds.length && (
                  <option value="">
                    {L(
                      "種と設備で種を買おう",
                      "Buy seeds in Seeds & upgrades",
                      "たねとせつびでたねをかおう",
                    )}
                  </option>
                )}
              </select>
              <button
                disabled={busy || !chosen}
                onClick={() => act("plant", { crop: chosen!.id })}
              >
                🌱 {L("植える", "Plant", "うえる")}
              </button>
            </>
          ) : (
            <>
              <button
                disabled={busy || plot.water === cal.day}
                onClick={() => act("water")}
              >
                💧{" "}
                {plot.water === cal.day
                  ? L("水やり済み", "Watered", "みずやりずみ")
                  : L("水やり", "Water", "みずやり")}
              </button>
              <button
                disabled={busy || plot.growth < cropById(plot.crop)!.days}
                onClick={() => act("harvest")}
              >
                🧺 {L("収穫", "Harvest", "しゅうかく")}
              </button>
              {!plot.fertilizer && (
                <button
                  disabled={busy || f.compost < 1}
                  onClick={() => act("fertilize")}
                >
                  🌿 {L("堆肥", "Fertilize", "たいひ")}
                </button>
              )}
              <small>
                {L("成長", "Growth", "せいちょう")} {plot.growth}/
                {cropById(plot.crop)!.days}
              </small>
            </>
          ))}
        {animal && (
          <>
            <button
              disabled={busy || animal.feed === cal.day || !f.feed}
              onClick={() => act("feed")}
            >
              {L("えさ", "Feed", "えさ")}
            </button>
            <button
              disabled={busy || animal.brush === cal.day}
              onClick={() => act("brush")}
            >
              {L("ブラシ", "Brush", "ぶらし")}
            </button>
            <button
              disabled={busy || animal.pat === cal.day}
              onClick={() => act("pat")}
            >
              ♡ {L("なでる", "Pat", "なでる")}
            </button>
            <button
              disabled={busy || !animal.ready}
              onClick={() => act("collect")}
            >
              🧺 {L("受け取る", "Collect", "うけとる")} {animal.ready || ""}
            </button>
          </>
        )}
        {pet && (
          <>
            <button
              disabled={busy || pet.cares.feed === cal.day || !f.feed}
              onClick={() => act("feed")}
            >
              {L("えさ", "Feed", "えさ")}
            </button>
            <button
              disabled={busy || pet.cares.pat === cal.day}
              onClick={() => act("pat")}
            >
              ♡ {L("なでる", "Pat", "なでる")}
            </button>
            <button
              disabled={busy || pet.cares.play === cal.day}
              onClick={() => act("play")}
            >
              {L("遊ぶ", "Play", "あそぶ")}
            </button>
            <button
              disabled={busy || pet.cares.train === cal.day}
              onClick={() => act("train")}
            >
              {L("しつけ", "Train", "しつけ")}
            </button>
            {PET_TRICKS.filter(
              (t) => pet.trained >= t[4] && pet.bond >= 10 + t[4] / 2,
            )
              .slice(0, 2)
              .map((t) => (
                <button
                  key={t[0]}
                  disabled={
                    busy ||
                    pet.hunger < 15 ||
                    world.life.time < (pet.lastTrick ?? -100) + 8
                  }
                  onClick={() => act("trick", { trick: t[0] })}
                >
                  ★ {copy(trickCopy(t), languageMode)}
                </button>
              ))}
          </>
        )}
      </div>
    </section>
  );
}
