import AnimalStage,{PetTricks} from '../lifestyle/AnimalStage';
import { trans } from "../../utils/textUtils";
import React, { useEffect, useRef, useState } from "react";
import type { World, Action } from "../engine";
import type { LanguageMode } from "../../types";
import { copy, c, SEASONS, DAY_SECONDS, dishById } from "../town/catalog";
import { calendar } from "../town/model";
import { canAfford, MATERIAL_NAMES } from "../life";
import {
  CROPS,
  LIVESTOCK,
  PET_SPECIES,
  PRODUCTS,
  FARM_DISHES,
  ingredientById,
  cropById,
  animalById,
  petById,
} from "./catalog";
import {
  ownFarm,
  farmLevel,
  plotLimit,
  animalLimit,
  nearFarm,
  farmSpots,
  farmBusy,
  farmAfford,
  FARM_UPGRADES,
  FARM_GOALS,
  type FarmPlayer,
} from "./model";
import FarmSprite from "./Sprite";
import { useRpgPreferences } from "../preferences";
import "../life.css";
import "./farm.css";
const label = (ja: string, en: string, hi: string, mode: LanguageMode) =>
  copy(c(ja, en, hi), mode);
export function FarmContent({
  world,
  selfId,
  send,
  languageMode,
  showCooking = true,
  onTrack,
}: {
  world: World;
  selfId: string;
  send: (a: Action) => void;
  languageMode: LanguageMode;
  showCooking?: boolean;
  onTrack?: (x: number, y: number) => void;
}) {
  const p = world.players[selfId],
    f = ownFarm(world, selfId),
    cal = calendar(world),
    prefs = useRpgPreferences();
  const L = (ja: string, en: string, hi: string) =>
      label(ja, en, hi, languageMode),
    C = (v: Parameters<typeof copy>[0]) => copy(v, languageMode);
  const [tab, setTab] = useState("field"),
    [slot, setSlot] = useState(0),
    [crop, setCrop] = useState(CROPS[cal.season * 8].id),
    [season, setSeason] = useState(cal.season),
    [name, setName] = useState(""),
    [ingredients, setIngredients] = useState<string[]>([]),
    [readyOnly, setReadyOnly] = useState(false),
    [tick, setTick] = useState(Date.now());
  const cooking = world.town?.cooking[selfId],
    person = world.town?.people[selfId];
  const initializationReady =
    world.started && !world.ended && !farmBusy(world, p);
  useEffect(() => {
    if (!f && initializationReady) send({ type: "farm-start" });
  }, [!!f, selfId, initializationReady]);
  useEffect(() => {
    if (
      !f?.upgrades.includes("greenhouse") &&
      cropById(crop)?.season !== cal.season
    )
      setCrop(CROPS[cal.season * 8].id);
  }, [cal.season, !!f?.upgrades.includes("greenhouse")]);
  useEffect(() => {
    if (!cooking || !showCooking) return;
    const timer = setInterval(() => setTick(Date.now()), 30);
    const tap = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-cook-cancel]")) return;
      e.preventDefault();
      e.stopPropagation();
      send({ type: "town-cook-tap" });
    };
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("[data-cook-cancel]")) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        send({ type: "town-cook-tap" });
      }
    };
    document.addEventListener("pointerdown", tap, true);
    document.addEventListener("keydown", key, true);
    return () => {
      clearInterval(timer);
      document.removeEventListener("pointerdown", tap, true);
      document.removeEventListener("keydown", key, true);
    };
  }, [!!cooking, showCooking, send]);
  if (!f)
    return (
      <p>
        {L(
          "農園の準備中…",
          "Preparing your farm…",
          "のうえんのじゅんびちゅう…",
        )}
      </p>
    );
  const available = !world.ended && !farmBusy(world, p),
    near = nearFarm(p, f) && !p.life?.indoors,
    canTend = available && near,
    plot = f.plots[slot],
    selected = cropById(crop)!,
    level = farmLevel(f),
    limit = plotLimit(f),
    slots = f.plots.filter((s) => s.slot < limit),
    spots = f.x === undefined ? farmSpots(world, p) : [],
    pantry = [...CROPS, ...PRODUCTS].filter((i) => {
      const s = f.pantry[i.id];
      return s && s.normal + s.quality > 0;
    }),
    canCook = !!p.life?.indoors && available;
  const cookable = (d: (typeof FARM_DISHES)[number]) =>
    farmAfford(world, selfId, d.farmCost) &&
    canAfford(p.life?.bag || {}, d.cost);
  const farmName = L(
    "農園・牧場・ペット",
    "Farm, ranch & pets",
    "のうえん・ぼくじょう・ぺっと",
  );
  const upgradeNames = [
    c("自動水やり", "Irrigation", "じどうみずやり"),
    c("四季の温室", "All-season greenhouse", "しきのおんしつ"),
    c("大きな牧舎", "Expanded barn", "おおきなぼくしゃ"),
  ];
  const goalNames = [
    c(
      "初めての収穫：3個",
      "First harvest: 3 items",
      "はじめてのしゅうかく：3こ",
    ),
    c(
      "作物8種類を収穫",
      "Harvest 8 crop species",
      "さくもつ8しゅるいをしゅうかく",
    ),
    c("収穫100個", "Harvest 100 items", "しゅうかく100こ"),
    c("家畜の恵み10個", "Collect 10 animal products", "かちくのめぐみ10こ"),
    c("ペットの絆60", "Reach pet bond 60", "ぺっとのきずな60"),
    c("農園料理8種類", "Cook 8 farm dishes", "のうえんりょうり8しゅるい"),
    c(
      "作物32種類を収穫",
      "Harvest all 32 crops",
      "さくもつ32しゅるいをしゅうかく",
    ),
    c(
      "高品質の作物12種類",
      "Grow 12 premium crops",
      "こうひんしつのさくもつ12しゅるい",
    ),
    c(
      "家畜8種類を飼育",
      "Raise all 8 livestock species",
      "かちく8しゅるいをしいく",
    ),
    c(
      "ペットのおつかい10回",
      "Complete 10 pet errands",
      "ぺっとのおつかい10かい",
    ),
  ];
  const meter = (n: number, text: string) => (
    <label className="farm-meter">
      <span>
        {text} {Math.round(n)}/100
      </span>
      <progress max={100} value={n} />
    </label>
  );
  return (
    <div className="farm-content" data-rpg-panel="farm">
      <div className="farm-summary">
        <b>
          Lv.{level} · {L("農園コイン", "Farm coins", "のうえんこいん")}{" "}
          {f.coins}
        </b>
        <span>
          {C(SEASONS[cal.season])} {cal.date} · {L("飼料", "Feed", "しりょう")}{" "}
          {f.feed} · {L("堆肥", "Compost", "たいひ")} {f.compost}
        </span>
        <small>
          {L(
            "1日は3分。アプリを閉じている間は成長と空腹が止まります。",
            "A day lasts 3 minutes. Growth and hunger pause while the app is closed.",
            "1にちは3ぷん。あぷりをとじているあいだはせいちょうとくうふくがとまります。",
          )}
        </small>
      </div>
      <nav className="farm-tabs" aria-label={farmName}>
        {[
          ["field", c("畑", "Fields", "はたけ")],
          ["ranch", c("家畜", "Livestock", "かちく")],
          ["pets", c("ペット", "Pets", "ぺっと")],
          [
            "pantry",
            c("食材と料理", "Pantry & cooking", "しょくざいとりょうり"),
          ],
          ["shop", c("種と設備", "Seeds & upgrades", "たねとせつび")],
          ["book", c("図鑑と目標", "Collection & goals", "ずかんともくひょう")],
        ].map(([id, text]) => (
          <button
            key={id as string}
            aria-pressed={tab === id}
            onClick={() => setTab(id as string)}
          >
            {C(text as Parameters<typeof copy>[0])}
          </button>
        ))}
      </nav>
      {tab === "field" && (
        <>
          {f.x === undefined ? (
            <article className="farm-card">
              <h3>
                {L(
                  "自分の農園を開こう",
                  "Start your farm",
                  "じぶんののうえんをひらこう",
                )}
              </h3>
              <p>
                {L(
                  "木材4・石材2で農園を作れます。最初は12区画、成長すると24区画。今の季節の種を各3袋プレゼント。",
                  "Build with 4 wood and 2 stone. Start with 12 plots, expanding to 24. Receive 3 seed packets for each crop of the current season.",
                  "もくざい4・せきざい2でのうえんをつくれます。さいしょは12くかく、せいちょうすると24くかく。いまのきせつのたねをかく3ふくろぷれぜんと。",
                )}
              </p>
              <p>{L("場所を選ぶ", "Choose a location", "ばしょをえらぶ")}</p>
              <div className="farm-actions">
                {spots.map((s) => (
                  <button
                    key={`${s.x}:${s.y}`}
                    disabled={
                      !available ||
                      !canAfford(p.life?.bag || {}, { wood: 4, stone: 2 })
                    }
                    onClick={() => send({ type: "farm-establish", ...s })}
                  >
                    {L("ここに開く", "Build here", "ここにひらく")} ({s.x},{" "}
                    {s.y})
                  </button>
                ))}
              </div>
              {!spots.length && (
                <p>
                  {L(
                    "道・水辺・建物から離れた広い場所へ移動してください。",
                    "Move to open land away from roads, water and buildings.",
                    "みち・みずべ・たてものからはなれたひろいばしょへいどうしてください。",
                  )}
                </p>
              )}
            </article>
          ) : (
            <>
              <div className="farm-actions">
                <b>
                  {L("農園の場所", "Farm location", "のうえんのばしょ")} ({f.x},{" "}
                  {f.y})
                </b>
                {onTrack && !near && (
                  <button
                    disabled={!available || !!p.life?.indoors}
                    onClick={() => onTrack(f.x! + 3, f.y! + 3)}
                  >
                    {L("農園へ向かう", "Walk to the farm", "のうえんへむかう")}
                  </button>
                )}
                <button
                  disabled={
                    !canTend ||
                    !slots.some((s) => s.crop && s.water !== cal.day)
                  }
                  onClick={() => send({ type: "farm-water-all" })}
                >
                  💧 {L("まとめて水やり", "Water all", "まとめてみずやり")}
                </button>
                <button
                  disabled={
                    !canTend ||
                    !slots.some(
                      (s) => s.crop && s.growth >= cropById(s.crop)!.days,
                    )
                  }
                  onClick={() => send({ type: "farm-harvest-all" })}
                >
                  🌾 {L("まとめて収穫", "Harvest all", "まとめてしゅうかく")}
                </button>
              </div>
              {!near && (
                <p className="farm-notice">
                  {L(
                    "農園へ移動して世話をしよう。お店や図鑑はどこでも使えます。",
                    "Walk to your farm to tend it. The shop and collection are available anywhere.",
                    "のうえんへいどうしてせわをしよう。おみせやずかんはどこでもつかえます。",
                  )}
                </p>
              )}
              <div
                className="farm-fields"
                role="group"
                aria-label={L("畑の区画", "Farm plots", "はたけのくかく")}
              >
                {f.plots.map((s) => {
                  const c = cropById(s.crop || ""),
                    locked = s.slot >= limit;
                  return (
                    <button
                      key={s.slot}
                      aria-pressed={slot === s.slot}
                      disabled={locked}
                      onClick={() => setSlot(s.slot)}
                      aria-label={`${s.slot + 1} ${c ? C(c.name) : L("空き区画", "Empty plot", "あきくかく")}`}
                      className={`${c && s.growth >= c.days ? "farm-ripe" : ""} ${s.water === cal.day ? "farm-wet" : ""}`}
                    >
                      <small>
                        {s.slot + 1}
                        {locked ? " 🔒" : ""}
                      </small>
                      {c ? (
                        <FarmSprite kind="crop" id={c.id} />
                      ) : (
                        <span aria-hidden="true">{locked ? "🔒" : "＋"}</span>
                      )}
                      <span>{c ? C(c.name) : L("空き", "Empty", "あき")}</span>
                      {c && (
                        <small>
                          {s.growth}/{c.days} {s.water === cal.day ? "💧" : ""}{" "}
                          {s.fertilizer ? "✦" : ""}
                        </small>
                      )}
                    </button>
                  );
                })}
              </div>
              <article className="farm-card">
                <h3>
                  {L("区画", "Plot", "くかく")} {slot + 1}
                </h3>
                {plot.crop ? (
                  <>
                    <h4>{C(cropById(plot.crop)!.name)}</h4>
                    <p>
                      {L("成長", "Growth", "せいちょう")} {plot.growth}/
                      {cropById(plot.crop)!.days} ·{" "}
                      {L("品質", "Quality", "ひんしつ")} {plot.quality} ·{" "}
                      {C(SEASONS[cropById(plot.crop)!.season])}
                    </p>
                    <div className="farm-actions">
                      <button
                        disabled={!canTend || plot.water === cal.day}
                        onClick={() => send({ type: "farm-water", slot })}
                      >
                        💧 {L("水やり", "Water", "みずやり")}
                      </button>
                      <button
                        disabled={!canTend || !f.compost || plot.fertilizer}
                        onClick={() => send({ type: "farm-fertilize", slot })}
                      >
                        {L("堆肥を使う", "Use compost", "たいひをつかう")}
                      </button>
                      <button
                        disabled={
                          !canTend || plot.growth < cropById(plot.crop)!.days
                        }
                        onClick={() => send({ type: "farm-harvest", slot })}
                      >
                        {L("収穫する", "Harvest", "しゅうかくする")}
                      </button>
                      <button
                        disabled={
                          !canTend || plot.growth >= cropById(plot.crop)!.days
                        }
                        onClick={() => send({ type: "farm-clear", slot })}
                      >
                        {L("植え替える", "Clear for replanting", "うえかえる")}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <label>
                      {L("植える種", "Seed to plant", "うえるたね")}
                      <select
                        value={crop}
                        onChange={(e) => setCrop(e.target.value)}
                      >
                        {CROPS.filter(
                          (c) =>
                            c.season === cal.season ||
                            f.upgrades.includes("greenhouse"),
                        ).map((c) => (
                          <option key={c.id} value={c.id}>
                            {C(c.name)} · {f.seeds[c.id] || 0}
                          </option>
                        ))}
                      </select>
                    </label>
                    <FarmSprite kind="crop" id={selected.id} />
                    <p>
                      {selected.days}
                      {L("日で育つ", " days to grow", "にちでそだつ")} ·{" "}
                      {L("収穫", "Yield", "しゅうかく")} {selected.yield}{" "}
                      {selected.regrow > 0 &&
                        L(
                          "・繰り返し収穫できます",
                          " · regrows after harvest",
                          "・くりかえししゅうかくできます",
                        )}
                    </p>
                    <button
                      disabled={
                        !canTend ||
                        slot >= limit ||
                        !(f.seeds[crop] > 0) ||
                        (selected.season !== cal.season &&
                          !f.upgrades.includes("greenhouse"))
                      }
                      onClick={() => send({ type: "farm-plant", crop, slot })}
                    >
                      {L("種を植える", "Plant seeds", "たねをうえる")}
                    </button>
                  </>
                )}
              </article>
            </>
          )}
          <p className="farm-guide">
            {L(
              "毎日水やりすると成長。雨の日は自然に潤います。季節外の作物は休眠し、温室で一年中育てられます。違う仲間の作物への輪作と堆肥で品質アップ。80以上は星付き食材になり、出荷額が2倍。",
              "Water daily for growth; rain also waters crops. Off-season crops pause, while a greenhouse supports year-round growth. Rotate crop families and add compost to improve quality. Quality 80+ earns a star and double sale value.",
              "まいにちみずやりするとせいちょう。あめのひはしぜんにうるおいます。きせつがいのさくもつはきゅうみんし、おんしつでいちねんじゅうそだてられます。ちがうなかまのさくもつへのりんさくとたいひでひんしつあっぷ。80いじょうはほしつきしょくざいになり、しゅっかがくが2ばい。",
            )}
          </p>
        </>
      )}
      {tab === "ranch" && (
        <>
          <p>
            {L(
              "名前を付けて飼育。給餌・ブラシ・掃除は毎日1回。成長すると卵・ミルク・毛などを生産します。世話をすると健康と絆が育ち、品質や生産量が上がります。",
              "Name and raise livestock. Feed, brush and clean once daily. Mature animals produce eggs, milk, wool and more. Care improves health, bonds, quality and yield.",
              "なまえをつけてしいく。きゅうじ・ぶらし・そうじはまいにち1かい。せいちょうするとたまご・みるく・けなどをせいさんします。せわをするとけんこうときずながそだち、ひんしつやせいさんりょうがあがります。",
            )}
          </p>
          <b>
            {f.animals.length}/{animalLimit(f)}
          </b>
          <div className="farm-actions">
            <button
              disabled={!available || f.coins < 10}
              onClick={() => send({ type: "farm-feed-buy" })}
            >
              {L(
                "飼料10個を買う：10コイン",
                "Buy 10 feed: 10 coins",
                "しりょう10こをかう：10こいん",
              )}
            </button>
          </div>
          <div className="farm-grid">
            {f.animals.map((a) => {
              const k = animalById(a.kind)!;
              return (
                <article className="farm-card" key={a.id}>
                  <AnimalStage animal={a} kind="animal" time={world.life.time}/>
                  <h3>{a.name}</h3>
                  <small>
                    {C(k.name)} ·{" "}
                    {cal.day - a.born >= k.days
                      ? L("おとな", "Adult", "おとな")
                      : L("育成中", "Growing", "いくせいちゅう")}
                  </small>
                  {meter(a.health, L("健康", "Health", "けんこう"))}
                  {meter(a.bond, L("絆", "Bond", "きずな"))}
                  <p>
                    <FarmSprite kind="ingredient" id={k.product} />
                    {C(ingredientById(k.product)!.name)} ×{a.ready} ·{" "}
                    {a.progress}/{k.days}
                  </p>
                  <button disabled={!canTend||a.bond<50||a.health<80||cal.day-a.born<2||cal.day-(a.bredDay??-100)<7||f.animals.length>=animalLimit(f)||f.feed<8||f.coins<Math.ceil(k.price/2)} onClick={()=>send({type:'farm-animal-breed',id:a.id,name:a.name.slice(0,10)+' Jr.'})}>{L('新しい家族を迎える','Welcome a baby','あたらしいかぞくをむかえる')} ({Math.ceil(k.price/2)} · {L('飼料','Feed','しりょう')} 8)</button>
                  <button disabled={!canTend||a.pat===cal.day} onClick={()=>send({type:'farm-animal-care',id:a.id,care:'pat'})}>{L('なでて触れ合う','Pet and cuddle','なでてふれあう')}</button>
                  <div className="farm-actions">
                    {(["feed", "brush", "clean", "collect"] as const).map(
                      (care, i) => (
                        <button
                          key={care}
                          disabled={
                            !canTend ||
                            (care === "collect"
                              ? !a.ready
                              : a[care] === cal.day ||
                                (care === "feed" && !f.feed))
                          }
                          onClick={() =>
                            send({ type: "farm-animal-care", id: a.id, care })
                          }
                        >
                          {C(
                            [
                              c("えさ", "Feed", "えさ"),
                              c("ブラシ", "Brush", "ぶらし"),
                              c("掃除", "Clean", "そうじ"),
                              c("受け取る", "Collect", "うけとる"),
                            ][i],
                          )}
                        </button>
                      ),
                    )}
                  </div>
                  <Rename
                    id={a.id}
                    name={a.name}
                    disabled={!available}
                    send={send}
                    languageMode={languageMode}
                  />
                </article>
              );
            })}
          </div>
          <h3>{L("家畜を迎える", "Welcome livestock", "かちくをむかえる")}</h3>
          <NameInput
            name={name}
            setName={setName}
            languageMode={languageMode}
          />
          <div className="farm-grid">
            {LIVESTOCK.map((k) => (
              <article className="farm-card" key={k.id}>
                <FarmSprite kind="animal" id={k.id} />
                <h3>{C(k.name)}</h3>
                <p>
                  {C(ingredientById(k.product)!.name)} · {k.days}
                  {L("日ごと", "-day cycle", "にちごと")}
                </p>
                <button
                  disabled={
                    !canTend ||
                    f.coins < k.price ||
                    f.animals.length >= animalLimit(f)
                  }
                  onClick={() =>
                    send({
                      type: "farm-animal-buy",
                      kind: k.id,
                      name: name.trim() || C(k.name),
                    })
                  }
                >
                  {L("迎える", "Welcome", "むかえる")} · {k.price}
                </button>
              </article>
            ))}
          </div>
        </>
      )}
      {tab === "pets" && (
        <>
          <p>
            {L(
              "6匹まで暮らせます。なでる・遊ぶ・しつけは毎日1回。連れ歩いて20歩で絆アップ。絆20・満腹40以上なら3分のおつかいへ。得意分野の種・薬草・コインを持ち帰ります。",
              "Live with up to 6 pets. Pat, play and train once daily. Walk 20 steps together for a bond boost. Bond 20 and hunger 40 unlock 3-minute errands for seeds, herbs or coins.",
              "6ひきまでくらせます。なでる・あそぶ・しつけはまいにち1かい。つれあるいて20ぽできずなあっぷ。きずな20・まんぷく40いじょうなら3ぷんのおつかいへ。とくいぶんやのたね・やくそう・こいんをもちかえります。",
            )}
          </p>
          <button
            disabled={!available || f.coins < 10}
            onClick={() => send({ type: "farm-feed-buy" })}
          >
            {L(
              "飼料10個を買う：10コイン",
              "Buy 10 feed: 10 coins",
              "しりょう10こをかう：10こいん",
            )}
          </button>
          <div className="farm-grid">
            {f.pets.map((pet) => (
              <article className="farm-card" key={pet.id}>
                <AnimalStage animal={pet} kind="pet" time={world.life.time}/><PetTricks world={world} selfId={selfId} pet={pet} send={send} languageMode={languageMode} available={available}/>
                <h3>{pet.name}</h3>
                <small>
                  {C(petById(pet.kind)!.name)} ·{" "}
                  {f.activePet === pet.id
                    ? L("一緒にお散歩", "Following you", "いっしょにおさんぽ")
                    : pet.awayUntil
                      ? `${L("おつかい中", "On an errand", "おつかいちゅう")} ${Math.max(0, Math.ceil(pet.awayUntil - world.life.time))}s`
                      : L(
                          "おうちで休憩",
                          "Resting at home",
                          "おうちできゅうけい",
                        )}
                </small>
                {meter(pet.bond, L("絆", "Bond", "きずな"))}
                {meter(pet.hunger, L("満腹", "Hunger", "まんぷく"))}
                {meter(pet.trained, L("しつけ", "Training", "しつけ"))}
                <div className="farm-actions">
                  {(["feed", "pat", "play", "train"] as const).map(
                    (care, i) => (
                      <button
                        key={care}
                        disabled={
                          !available ||
                          !!pet.awayUntil ||
                          pet.cares[care] === cal.day ||
                          (care === "feed" ? !f.feed : pet.hunger < 20)
                        }
                        onClick={() =>
                          send({ type: "farm-pet-care", id: pet.id, care })
                        }
                      >
                        {C(
                          [
                            c("えさ", "Feed", "えさ"),
                            c("なでる", "Pat", "なでる"),
                            c("遊ぶ", "Play", "あそぶ"),
                            c("しつけ", "Train", "しつけ"),
                          ][i],
                        )}
                      </button>
                    ),
                  )}
                  <button
                    disabled={!available || !!pet.awayUntil}
                    onClick={() =>
                      send({
                        type: "farm-pet-care",
                        id: pet.id,
                        care: f.activePet === pet.id ? "stay" : "follow",
                      })
                    }
                  >
                    {f.activePet === pet.id
                      ? L("休憩させる", "Let rest", "きゅうけいさせる")
                      : L("連れて歩く", "Walk together", "つれてあるく")}
                  </button>
                  <button
                    disabled={
                      !available ||
                      !!pet.awayUntil ||
                      pet.bond < 20 ||
                      pet.hunger < 40
                    }
                    onClick={() =>
                      send({ type: "farm-pet-care", id: pet.id, care: "trip" })
                    }
                  >
                    {L(
                      "おつかいを頼む",
                      "Send on an errand",
                      "おつかいをたのむ",
                    )}
                  </button>
                </div>
                <Rename
                  id={pet.id}
                  name={pet.name}
                  disabled={!available}
                  send={send}
                  languageMode={languageMode}
                />
              </article>
            ))}
          </div>
          {f.log.length > 0 && (
            <p aria-live="polite">
              {L(
                "おつかいから帰ってきたよ：",
                "Back from an errand: ",
                "おつかいからかえってきたよ：",
              )}
              {f.log.slice(-3).join(" · ")}
            </p>
          )}
          <h3>
            {L(
              "新しい家族を迎える",
              "Adopt a new friend",
              "あたらしいかぞくをむかえる",
            )}
          </h3>
          <NameInput
            name={name}
            setName={setName}
            languageMode={languageMode}
          />
          <div className="farm-grid">
            {PET_SPECIES.map((k) => (
              <article className="farm-card" key={k.id}>
                <FarmSprite kind="pet" id={k.id} />
                <h3>{C(k.name)}</h3>
                <p>
                  {L(
                    "おつかいの得意分野",
                    "Errand specialty",
                    "おつかいのとくいぶんや",
                  )}
                  ：
                  {k.talent === "herbs"
                    ? L("薬草", "Herbs", "やくそう")
                    : k.talent === "coins"
                      ? L("コイン", "Coins", "こいん")
                      : L("種", "Seeds", "たね")}
                  {k.id === "dragon" && " · Lv.5"}
                </p>
                <button
                  disabled={
                    !available ||
                    f.pets.length >= 6 ||
                    f.coins < k.price ||
                    (k.id === "dragon" && level < 5)
                  }
                  onClick={() =>
                    send({
                      type: "farm-pet-adopt",
                      kind: k.id,
                      name: name.trim() || C(k.name),
                    })
                  }
                >
                  {L("迎える", "Adopt", "むかえる")} · {k.price}
                </button>
              </article>
            ))}
          </div>
        </>
      )}
      {tab === "pantry" && (
        <>
          <h3>{L("食材庫", "Pantry", "しょくざいこ")}</h3>
          <p>
            {L(
              "収穫した食材を選ぶと、組み合わせに合う料理が表示されます。家の作業台・ストーブで調理。できた料理は住人や参加者にもごちそうできます。",
              "Select harvested ingredients to discover matching dishes. Cook at your home workbench or stove, then share meals with residents and players.",
              "しゅうかくしたしょくざいをえらぶと、くみあわせにあうりょうりがひょうじされます。いえのさぎょうだい・すとーぶでちょうり。できたりょうりはじゅうにんやさんかしゃにもごちそうできます。",
            )}
          </p>
          <div className="farm-grid">
            {pantry.map((i) => {
              const s = f.pantry[i.id];
              return (
                <article className="farm-card farm-ingredient" key={i.id}>
                  <button
                    aria-pressed={ingredients.includes(i.id)}
                    onClick={() =>
                      setIngredients((v) =>
                        v.includes(i.id)
                          ? v.filter((k) => k !== i.id)
                          : [...v, i.id],
                      )
                    }
                  >
                    <FarmSprite kind="ingredient" id={i.id} />
                    <b>{C(i.name)}</b>
                    <span>
                      {s.normal} · ★{s.quality}
                    </span>
                  </button>
                  <div className="farm-actions">
                    <button
                      disabled={!available || !s.normal}
                      onClick={() =>
                        send({
                          type: "farm-sell",
                          ingredient: i.id,
                          amount: Math.min(10, s.normal),
                          quality: false,
                        })
                      }
                    >
                      {L("出荷", "Sell", "しゅっか")} ×{Math.min(10, s.normal)}{" "}
                      · {i.value}
                    </button>
                    <button
                      disabled={!available || !s.quality}
                      onClick={() =>
                        send({
                          type: "farm-sell",
                          ingredient: i.id,
                          amount: Math.min(10, s.quality),
                          quality: true,
                        })
                      }
                    >
                      ★ {L("出荷", "Sell", "しゅっか")} · {i.value * 2}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {!pantry.length && (
            <p>
              {L(
                "畑の収穫や家畜のお世話で食材を集めよう。",
                "Harvest crops and tend livestock to fill your pantry.",
                "はたけのしゅうかくやかちくのおせわでしょくざいをあつめよう。",
              )}
            </p>
          )}
          <div className="farm-actions">
            <button onClick={() => setIngredients([])}>
              {L("選択を解除", "Clear selection", "せんたくをかいじょ")}
            </button>
            <button
              aria-pressed={readyOnly}
              onClick={() => setReadyOnly(!readyOnly)}
            >
              {L(
                "作れる料理だけ",
                "Only available recipes",
                "つくれるりょうりだけ",
              )}
            </button>
          </div>
          <h3>
            {L("農園の料理帳", "Farm cookbook", "のうえんのりょうりちょう")} ·
            48
          </h3>
          <div className="farm-grid">
            {FARM_DISHES.filter(
              (d) =>
                ingredients.every((k) => Object.hasOwn(d.farmCost!, k)) &&
                (!readyOnly || cookable(d)),
            ).map((d) => (
              <article className="farm-card" key={d.id}>
                <FarmSprite kind="food" id={d.index} />
                <h3>{C(d.name)}</h3>
                <small>
                  {L("満腹", "Nourishment", "まんぷく")} +{d.nourish}
                </small>
                <p className="farm-recipe-cost">
                  {Object.entries(d.farmCost!).map(([id, n]) => {
                    const s = f.pantry[id];
                    return (
                      <span
                        key={id}
                        className={
                          (s?.normal || 0) + (s?.quality || 0) >= n
                            ? "farm-enough"
                            : ""
                        }
                      >
                        {C(ingredientById(id)!.name)}{" "}
                        {(s?.normal || 0) + (s?.quality || 0)}/{n}
                      </span>
                    );
                  })}
                  {Object.entries(d.cost).map(([key, n]) => (
                    <span key={key}>
                      {trans(
                        MATERIAL_NAMES[key as keyof typeof MATERIAL_NAMES],
                        languageMode,
                      )}{" "}
                      {p.life?.bag[key as keyof typeof p.life.bag] || 0}/{n}
                    </span>
                  ))}
                </p>
                <small>
                  {L("料理の所持", "Prepared dishes", "りょうりのしょじ")}{" "}
                  {(person?.foods[d.id]?.normal || 0) +
                    (person?.foods[d.id]?.perfect || 0)}
                </small>
                <div className="farm-actions">
                  <button
                    disabled={!canCook || !cookable(d)}
                    onClick={() =>
                      send({ type: "town-cook-start", dish: d.id })
                    }
                  >
                    {L("料理する", "Cook", "りょうりする")}
                  </button>
                  <button
                    disabled={
                      !available ||
                      !person?.foods[d.id] ||
                      person.foods[d.id].normal + person.foods[d.id].perfect ===
                        0
                    }
                    onClick={() =>
                      send({ type: "town-meal", dish: d.id, target: selfId })
                    }
                  >
                    {L("食べる", "Eat", "たべる")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {tab === "shop" && (
        <>
          <div className="farm-actions">
            {SEASONS.map((s, i) => (
              <button
                key={i}
                aria-pressed={season === i}
                onClick={() => setSeason(i)}
              >
                {C(s)}
              </button>
            ))}
          </div>
          <div className="farm-grid">
            {CROPS.filter((c) => c.season === season).map((c) => (
              <article className="farm-card" key={c.id}>
                <FarmSprite kind="crop" id={c.id} />
                <h3>{C(c.name)}</h3>
                <p>
                  {c.days}
                  {L("日で育つ", " days to grow", "にちでそだつ")} ·{" "}
                  {L("種", "Seeds", "たね")} {f.seeds[c.id] || 0}
                </p>
                <p>
                  {L("出荷額", "Sale value", "しゅっかがく")} {c.value} ·{" "}
                  {L("収穫", "Yield", "しゅうかく")} {c.yield}{" "}
                  {c.regrow
                    ? L("・再収穫あり", " · regrows", "・さいしゅうかくあり")
                    : ""}
                </p>
                <div className="farm-actions">
                  {[1, 5].map((n) => (
                    <button
                      key={n}
                      disabled={!available || f.coins < c.price * n}
                      onClick={() =>
                        send({ type: "farm-seed", crop: c.id, amount: n })
                      }
                    >
                      {L("種を買う", "Buy seeds", "たねをかう")} ×{n} ·{" "}
                      {c.price * n}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <h3>{L("農園の設備", "Farm upgrades", "のうえんのせつび")}</h3>
          <div className="farm-grid">
            {FARM_UPGRADES.map((u, i) => (
              <article className="farm-card" key={u.id}>
                <h3>{C(upgradeNames[i])}</h3>
                <p>
                  {C(
                    [
                      c(
                        "毎朝すべての畑へ自動で水やり。",
                        "All plots are watered daily.",
                        "まいあさすべてのはたけへじどうでみずやり。",
                      ),
                      c(
                        "すべての季節の作物を育てられます。",
                        "Grow crops from every season.",
                        "すべてのきせつのさくもつをそだてられます。",
                      ),
                      c(
                        "家畜の上限が4匹から12匹になります。",
                        "Expand livestock capacity from 4 to 12.",
                        "かちくのじょうげんが4ひきから12ひきになります。",
                      ),
                    ][i],
                  )}
                </p>
                <p>
                  Lv.{u.level} · {u.coins} ·{" "}
                  {Object.entries(u.cost)
                    .map(
                      ([k, n]) =>
                        `${trans(MATERIAL_NAMES[k as keyof typeof MATERIAL_NAMES], languageMode)} ${p.life?.bag[k as keyof typeof p.life.bag] || 0}/${n}`,
                    )
                    .join(" · ")}
                </p>
                <button
                  disabled={
                    !canTend ||
                    f.upgrades.includes(u.id) ||
                    level < u.level ||
                    f.coins < u.coins ||
                    !canAfford(p.life?.bag || {}, u.cost)
                  }
                  onClick={() => send({ type: "farm-upgrade", upgrade: u.id })}
                >
                  {f.upgrades.includes(u.id)
                    ? L("導入済み", "Installed", "どうにゅうずみ")
                    : L("導入する", "Install", "どうにゅうする")}
                </button>
              </article>
            ))}
          </div>
          <div className="farm-actions">
            <button
              disabled={
                !available || !(p.life?.bag.herb! > 0) || f.compost >= 99
              }
              onClick={() => send({ type: "farm-compost" })}
            >
              {L(
                "薬草1個を堆肥3個にする",
                "Convert 1 herb to 3 compost",
                "やくそう1こをたいひ3こにする",
              )}
            </button>
            <button
              disabled={!available || f.coins < 10}
              onClick={() => send({ type: "farm-feed-buy" })}
            >
              {L(
                "飼料10個を買う：10コイン",
                "Buy 10 feed: 10 coins",
                "しりょう10こをかう：10こいん",
              )}
            </button>
          </div>
        </>
      )}
      {tab === "book" && (
        <>
          <h3>{L("農園の目標", "Farm goals", "のうえんのもくひょう")}</h3>
          <div className="farm-grid">
            {FARM_GOALS.map((g, i) => (
              <article className="farm-card" key={g.id}>
                <h3>{C(goalNames[i])}</h3>
                <p>
                  {g.coins} {L("コイン", "coins", "こいん")} · XP {g.xp}
                </p>
                <button
                  disabled={
                    !available ||
                    f.claimed.includes(g.id) ||
                    !g.done(f, world, selfId)
                  }
                  onClick={() => send({ type: "farm-reward", id: g.id })}
                >
                  {f.claimed.includes(g.id)
                    ? L("達成済み", "Claimed", "たっせいずみ")
                    : g.done(f, world, selfId)
                      ? L(
                          "報酬を受け取る",
                          "Claim reward",
                          "ほうしゅうをうけとる",
                        )
                      : L("挑戦中", "In progress", "ちょうせんちゅう")}
                </button>
              </article>
            ))}
          </div>
          <h3>
            {L(
              "作物と牧場の図鑑",
              "Crop & ranch collection",
              "さくもつとぼくじょうのずかん",
            )}{" "}
            · {Object.keys(f.book).length}/40
          </h3>
          <div className="farm-grid">
            {[...CROPS, ...PRODUCTS].map((i) => (
              <article
                key={i.id}
                className={
                  "farm-card " + (!f.book[i.id] ? "farm-undiscovered" : "")
                }
              >
                <FarmSprite kind="ingredient" id={i.id} />
                <h3>{C(i.name)}</h3>
                <p>
                  {L("累計", "Collected", "るいけい")}{" "}
                  {f.book[i.id]?.count || 0} ·{" "}
                  {L("最高品質", "Best quality", "さいこうひんしつ")}{" "}
                  {Math.round(f.book[i.id]?.best || 0)}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
      {showCooking && cooking && (
        <div
          className="town-cook-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={L(
            "調理のタイミング",
            "Cooking timing",
            "ちょうりのたいみんぐ",
          )}
        >
          <div className="town-cook-mini">
            <FarmSprite kind="food" id={dishById(cooking.dish)!.index} />
            <h3>{C(dishById(cooking.dish)!.name)}</h3>
            <p>
              {C(dishById(cooking.dish)!.steps[cooking.step])}{" "}
              {cooking.step + 1}/3
            </p>
            <div className="town-cook-meter">
              <i />
              <b
                style={{ left: `${((tick - cooking.started) % 1600) / 16}%` }}
              />
            </div>
            <p>
              {L(
                "光る範囲で画面のどこかをタップ！",
                "Tap anywhere when the marker is in the bright zone!",
                "ひかるはんいでがめんのどこかをたっぷ！",
              )}
            </p>
            <button
              data-cook-cancel
              onClick={() => send({ type: "town-cook-cancel" })}
            >
              {L("調理を中断", "Cancel cooking", "ちょうりをちゅうだん")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function NameInput({
  name,
  setName,
  languageMode,
}: {
  name: string;
  setName: (s: string) => void;
  languageMode: LanguageMode;
}) {
  return (
    <label className="farm-name">
      {label(
        "名前（空欄なら種類名）",
        "Name (leave blank for species name)",
        "なまえ（くうらんならしゅるいめい）",
        languageMode,
      )}
      <input
        maxLength={16}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </label>
  );
}
function Rename({
  id,
  name,
  disabled,
  send,
  languageMode,
}: {
  id: string;
  name: string;
  disabled: boolean;
  send: (a: Action) => void;
  languageMode: LanguageMode;
}) {
  const [value, setValue] = useState(name);
  return (
    <form
      className="farm-rename"
      onSubmit={(e) => {
        e.preventDefault();
        send({ type: "farm-name", id, name: value });
      }}
    >
      <input
        aria-label={label(
          "新しい名前",
          "New name",
          "あたらしいなまえ",
          languageMode,
        )}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={16}
      />
      <button disabled={disabled || !value.trim() || value === name}>
        {label("改名", "Rename", "かいめい", languageMode)}
      </button>
    </form>
  );
}
export default function FarmPanel({
  world,
  selfId,
  send,
  languageMode,
  onClose,
  onTrack,
}: {
  world: World;
  selfId: string;
  send: (a: Action) => void;
  languageMode: LanguageMode;
  onClose: () => void;
  onTrack?: (x: number, y: number) => void;
}) {
  const prefs = useRpgPreferences(),
    panel = useRef<HTMLElement>(null),
    close = useRef(onClose),
    locked = !!world.town?.cooking[selfId];
  close.current = onClose;
  const lock = useRef(locked);
  lock.current = locked;
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (!lock.current) close.current();
      }
      if (e.key === "Tab") {
        const nodes = Array.from(
            panel.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled),input:not(:disabled),select:not(:disabled)",
            ) || [],
          ),
          first = nodes[0] as HTMLElement | undefined,
          last = nodes.at(-1) as HTMLElement | undefined;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("keydown", key, true);
      before?.focus();
    };
  }, []);
  return (
    <div
      className="rpg-life-backdrop farm-backdrop"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <section
        ref={panel}
        className={`rpg-life farm-panel ${prefs.contrast ? "rpg-high-contrast" : ""} ${prefs.largeText ? "rpg-large-text" : ""} ${prefs.largeControls ? "rpg-large-controls" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={label(
          "農園・牧場・ペット",
          "Farm, ranch & pets",
          "のうえん・ぼくじょう・ぺっと",
          languageMode,
        )}
      >
        <header>
          <div>
            <small>FRONTIER FARM</small>
            <h2>
              {label(
                "農園・牧場・ペット",
                "Farm, ranch & pets",
                "のうえん・ぼくじょう・ぺっと",
                languageMode,
              )}
            </h2>
          </div>
          <button
            disabled={locked}
            onClick={onClose}
            aria-label={label("閉じる", "Close", "とじる", languageMode)}
          >
            ×
          </button>
        </header>
        <div className="farm-scroll">
          <FarmContent
            onTrack={onTrack}
            world={world}
            selfId={selfId}
            send={send}
            languageMode={languageMode}
          />
        </div>
        <footer role="status">
          {trans(world.players[selfId].message, languageMode)}
        </footer>
      </section>
    </div>
  );
}
