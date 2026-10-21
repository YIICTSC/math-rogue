import { isProtagonistUnlocked, protagonistUnlockRequirement } from '../../utils/protagonistUnlocks';
import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Heart,
  Swords,
  Sparkles,
} from "lucide-react";
import { assetUrl } from "../../utils/assetPaths";
import { trans } from "../../utils/textUtils";
import type { LanguageMode } from "../../types";
import {
  FIELDS,
  HEROES,
  localize,
  type SurvivorHero,
  type Field,
} from "./world";
export function HeroPortrait({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`sy-hero-sprite ${className}`}
      style={{
        backgroundImage: `url("${assetUrl(`sprites/wandering-student/${id}.webp`)}")`,
      }}
    />
  );
}
export default function SurvivorLobby({
  languageMode,
  weaponName,
  onStart,
  onBack,
}: {
  languageMode: LanguageMode;
  weaponName: (id: string) => string;
  onStart: (hero: SurvivorHero, field: Field) => void;
  onBack: () => void;
}) {
  const [select, setSelect] = useState(false),
    [chapter, setChapter] = useState(0),
    [hero, setHero] = useState(HEROES[0]),
    [field, setField] = useState<Field>(FIELDS[0]);
  const l = (ja: string, en: string, hira?: string) =>
    localize(languageMode, ja, en, hira);
  return (
    <div
      className={`sy-lobby ${select ? "sy-select" : ""}`}
      data-gamepad-modal
      data-gamepad-initial-scope={select ? "survivor-select" : "survivor-title"}
    >
      <img
        className="sy-keyvisual"
        src={assetUrl("sprites/schoolyard-survivor/title.webp")}
        alt=""
      />
      <div className="sy-lobby-shade" />
      <button
        className="sy-back"
        onClick={select ? () => setSelect(false) : onBack}
      >
        <ArrowLeft size={18} />
        {l("戻る", "Back", "もどる")}
      </button>
      {!select ? (
        <div className="sy-title-copy">
          <p className="sy-eyebrow">AFTER SCHOOL • SURVIVAL ACTION</p>
          <h1>
            {l("校庭", "SCHOOLYARD", "こうてい")}
            <br />
            <span>{l("サバイバー", "SURVIVOR")}</span>
          </h1>
          <p className="sy-title-lead">
            {l(
              "放課後、文房具が最強の武器になる。",
              "When the bell rings, school supplies become legendary.",
              "ほうかご、ぶんぼうぐが さいきょうの ぶきになる。",
            )}
          </p>
          <div className="sy-title-tags">
            <span>
              {l(
                `${HEROES.length}人の主人公`,
                `${HEROES.length} heroes`,
                `${HEROES.length}にんの しゅじんこう`,
              )}
            </span>
            <span>{l("4つの戦場", "4 battlefields", "4つの せんじょう")}</span>
            <span>{l("40種の武器", "40 weapons", "40しゅの ぶき")}</span>
          </div>
          <button
            data-gamepad-initial-choice
            className="sy-primary"
            onClick={() => setSelect(true)}
          >
            <Play size={20} fill="currentColor" />
            {l("出撃準備", "Choose your hero", "しゅつげき じゅんび")}
            <ArrowRight size={20} />
          </button>
          <p className="sy-control-hint">
            {l(
              "移動と回避で生き残れ。攻撃はオート。",
              "Move. Dodge. Survive. Your weapons fire automatically.",
              "いどうと かいひで いきのこれ。こうげきは オート。",
            )}
          </p>
        </div>
      ) : (
        <div className="sy-selection-content">
          <header>
            <p className="sy-eyebrow">BUILD YOUR SURVIVOR</p>
            <h2>
              {l(
                "主人公と戦場を選択",
                "Choose hero & battlefield",
                "しゅじんこうと せんじょうを えらぶ",
              )}
            </h2>
          </header>
          <div className="sy-selection-columns">
            <section className="sy-roster">
              <div
                className="sy-tabs"
                role="tablist"
                aria-label={l("編", "Chapter", "へん")}
              >
                {[
                  ["小学生編", "Elementary", "しょうがくせいへん"],
                  ["高校生編", "High school", "こうこうせいへん"],
                  ["魔法学園編", "Magic academy", "まほうがくえんへん"],
                ].map((names, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={chapter === i}
                    onClick={() => {
                      setChapter(i);
                      setHero(HEROES.find((h) => h.chapter === i)!);
                    }}
                  >
                    {l(...(names as [string, string, string]))}
                  </button>
                ))}
              </div>
              <p className="sy-unlock-hint">{l("主人公は本編のクリア回数に応じて解放されます。", "Heroes unlock with main-game clears in each chapter.", "しゅじんこうは ほんぺんの クリアかいすうに おうじて かいほうされます。")}</p>
              <div className="sy-hero-grid">
                {HEROES.filter((h) => h.chapter === chapter).map((h) => (
                  <button
                    key={h.id}
                    aria-pressed={hero.id === h.id}
                    className="sy-hero-card"
                    disabled={!isProtagonistUnlocked(h.id)}
                    title={isProtagonistUnlocked(h.id) ? h.name : l(`本編クリア ${protagonistUnlockRequirement(h.id)?.clears}回で解放`, `Unlock after ${protagonistUnlockRequirement(h.id)?.clears} main-story clears`, `ほんぺんクリア ${protagonistUnlockRequirement(h.id)?.clears}かいで かいほう`)}
                    onClick={() => setHero(h)}
                  >
                    <HeroPortrait id={h.id} />
                    <span>{!isProtagonistUnlocked(h.id) && "🔒 "}{trans(h.name, languageMode)}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="sy-loadout">
              <div className="sy-hero-detail">
                <HeroPortrait id={hero.id} />
                <div>
                  <h3>{trans(hero.name, languageMode)}</h3>
                  <p>
                    <Swords size={14} />
                    {weaponName(hero.starter)}
                  </p>
                  <p>
                    <Heart size={14} />
                    HP {hero.hp} <Sparkles size={14} />
                    {hero.chapter === 1
                      ? l("威力 +18%", "Damage +18%", "いりょく +18%")
                      : hero.chapter === 2
                        ? l("範囲 +20%", "Area +20%", "はんい +20%")
                        : l("バランス型", "Balanced", "バランスがた")}
                  </p>
                </div>
              </div>
              <div className="sy-fields">
                {FIELDS.map((f, i) => (
                  <button
                    key={f.id}
                    aria-pressed={field.id === f.id}
                    onClick={() => setField(f)}
                    style={
                      { "--field-accent": f.accent } as React.CSSProperties
                    }
                  >
                    <span className="sy-field-number">0{i + 1}</span>
                    <span>
                      <strong>{l(f.name[0], f.name[1], f.name[2])}</strong>
                      <small>{l(f.desc[0], f.desc[1], f.desc[2])}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
          <footer>
            <p>
              {l(
                "5分間の猛攻を生き抜き、終業の鐘を打ち破れ。",
                "Survive five minutes. Defeat the final bell.",
                "5ふんかん いきぬき、さいごの かねを うちやぶれ。",
              )}
              <small>
                {l(
                  "移動：WASD / 矢印 / スワイプ　回避：Shift　バースト：Space",
                  "Move: WASD / arrows / drag · Dash: Shift · Burst: Space",
                  "いどう：WASD / やじるし / スワイプ　かいひ：Shift　バースト：Space",
                )}
              </small>
            </p>
            <button
              data-gamepad-initial-choice
              className="sy-primary"
              disabled={!isProtagonistUnlocked(hero.id)}
              onClick={() => { if (isProtagonistUnlocked(hero.id)) onStart(hero, field); }}
            >
              <Play size={18} fill="currentColor" />
              {l("出撃する", "Start run", "しゅつげきする")}
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
