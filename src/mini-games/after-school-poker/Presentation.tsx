import ResponsiveTitleArt from '../shared/ResponsiveTitleArt';
import React, { useState } from "react";
import type { LanguageMode } from "../../types";
import { assetUrl } from "../../utils/assetPaths";
import {
  isProtagonistUnlocked,
  protagonistUnlockRequirement,
} from "../../utils/protagonistUnlocks";
import { trans } from "../../utils/textUtils";
import {
  DEFAULT_POKER_HERO,
  POKER_HEROES,
  POKER_SIGNATURE_SUPPORTERS,
  keepsakeEnglish,
  signatureSupporter,
} from "./heroes";
import "./poker.css";

export type PokerExpression =
  | "neutral"
  | "focus"
  | "confident"
  | "joy"
  | "worry"
  | "defeat";
const expressions: PokerExpression[] = [
  "neutral",
  "focus",
  "confident",
  "joy",
  "worry",
  "defeat",
];
export function PokerPortrait({
  hero,
  expression = "neutral",
  className = "",
}: {
  hero: string;
  expression?: PokerExpression;
  className?: string;
}) {
  return (
    <span
      className={`poker-hero-portrait ${className}`}
      data-hero={hero}
      data-expression={expression}
      aria-hidden
      style={{
        backgroundImage: `url("${assetUrl(`sprites/after-school-poker/portraits/${hero}.webp`)}")`,
        backgroundPosition: `${expressions.indexOf(expression) * 20}% 50%`,
      }}
    />
  );
}
export function PokerClubArt({
  index,
  className = "",
}: {
  index: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`poker-signature-icon ${className}`}
      style={{
        backgroundImage: `url("${assetUrl("sprites/after-school-poker/supporters.webp")}")`,
        backgroundPosition: `${(index % 6) * 20}% ${Math.floor(index / 6) * 25}%`,
      }}
    />
  );
}
export function PokerSignatureIcon({
  hero,
  className = "",
}: {
  hero: string;
  className?: string;
}) {
  return (
    <PokerClubArt
      index={Math.max(
        0,
        POKER_SIGNATURE_SUPPORTERS.findIndex(
          (s) => s.id === `SIGNATURE_${hero}`,
        ),
      )}
      className={className}
    />
  );
}
export function PokerLobby({
  languageMode,
  canContinue,
  onContinue,
  onStart,
  onBack,
}: {
  languageMode: LanguageMode;
  canContinue: boolean;
  onContinue: () => void;
  onStart: (hero: string) => void;
  onBack: () => void;
}) {
  const [select, setSelect] = useState(false),
    [chapter, setChapter] = useState("high-school"),
    [hero, setHero] = useState(DEFAULT_POKER_HERO);
  const l = (ja: string, en: string, hi = ja) =>
    languageMode === "ENGLISH" ? en : languageMode === "HIRAGANA" ? hi : ja;
  const supporter = signatureSupporter(hero),
    english = keepsakeEnglish(hero);
  return (
    <main
      className={`poker-lobby ${select ? "poker-select" : ""}`}
      data-gamepad-initial-scope={
        select ? "poker-hero-selection" : "poker-title"
      }
    >
      <ResponsiveTitleArt game="poker" className="poker-title-art"/>
      <button
        className="poker-lobby-back"
        onClick={select ? () => setSelect(false) : onBack}
      >
        ← {l("戻る", "Back", "もどる")}
      </button>
      {!select ? (
        <section className="poker-title-copy">
          <p className="poker-eyebrow">LEARNING ROGUE · CARD CLUB</p>
          <h1>
            {l("放課後", "AFTER SCHOOL", "ほうかご")}
            <br />
            <em>{l("ポーカー", "POKER")}</em>
          </h1>
          <p>
            {l(
              "その一手で、放課後が輝き出す。",
              "Make your next hand unforgettable.",
              "その いってで、ほうかごが かがやきだす。",
            )}
          </p>
          <div className="poker-title-buttons">
            {canContinue && (
              <button
                data-gamepad-initial-choice
                className="poker-gold-button"
                onClick={onContinue}
              >
                ▶ {l("続きから", "Continue", "つづきから")}
              </button>
            )}
            <button
              data-gamepad-initial-choice={!canContinue || undefined}
              className={canContinue ? "" : "poker-gold-button"}
              onClick={() => setSelect(true)}
            >
              ♠ {l("新しい放課後", "New run", "あたらしい ほうかご")}
            </button>
          </div>
          <small>
            {l(
              "主人公 × 専用サポーター × あなただけのデッキ",
              "YOUR HERO · YOUR COMPANION · YOUR DECK",
              "しゅじんこう × せんようサポーター × あなただけのデッキ",
            )}
          </small>
        </section>
      ) : (
        <section className="poker-selection-panel">
          <header>
            <p className="poker-eyebrow">CHOOSE YOUR CARD CLUB DUO</p>
            <h2>
              {l(
                "主人公と相棒を選ぶ",
                "Choose your hero & companion",
                "しゅじんこうと あいぼうを えらぶ",
              )}
            </h2>
            <p>
              {l(
                "本編で解放した主人公が参戦。相棒を1人連れてスタート。",
                "Heroes unlock with your main-game progress. Start with a personal supporter.",
                "ほんぺんで かいほうした しゅじんこうが さんせん。あいぼうと スタート。",
              )}
            </p>
          </header>
          <nav>
            {["high-school", "magic"].map((id) => (
              <button
                key={id}
                aria-pressed={chapter === id}
                onClick={() => {
                  setChapter(id);
                  setHero(id === "magic" ? "magic-akari" : DEFAULT_POKER_HERO);
                }}
              >
                {id === "magic"
                  ? l("マジック編", "Magic", "マジックへん")
                  : l("高校編", "High school", "こうこうへん")}
              </button>
            ))}
          </nav>
          <div className="poker-selection-body">
            <div className="poker-hero-grid">
              {POKER_HEROES.filter((h) => h.id.startsWith(chapter + "-")).map(
                (h) => {
                  const locked = !isProtagonistUnlocked(h.id);
                  const n = protagonistUnlockRequirement(h.id)?.clears;
                  return (
                    <button
                      key={h.id}
                      data-hero-choice={h.id}
                      disabled={locked}
                      aria-pressed={hero === h.id}
                      onClick={() => setHero(h.id)}
                    >
                      <PokerPortrait
                        hero={h.id}
                        expression={hero === h.id ? "confident" : "neutral"}
                      />
                      <strong>
                        {locked && "🔒 "}
                        {trans(h.name, languageMode)}
                      </strong>
                      {locked && (
                        <small>
                          {l(
                            `本編 ${n}回クリア`,
                            `${n} main-story clears`,
                            `ほんぺん ${n}かい クリア`,
                          )}
                        </small>
                      )}
                    </button>
                  );
                },
              )}
            </div>
            <aside className="poker-duo-preview">
              <PokerPortrait hero={hero} expression="confident" />
              <h3>
                {trans(
                  POKER_HEROES.find((h) => h.id === hero)!.name,
                  languageMode,
                )}
              </h3>
              <span className="poker-eyebrow">SIGNATURE SUPPORTER</span>
              <div className="poker-companion-detail">
                <PokerSignatureIcon hero={hero} />
                <div>
                  <h4>
                    ✦{" "}
                    {languageMode === "ENGLISH"
                      ? english.name
                      : trans(supporter.name, languageMode)}
                  </h4>
                  <p>
                    {languageMode === "ENGLISH"
                      ? english.description
                      : trans(supporter.description, languageMode)}
                  </p>
                </div>
              </div>
              <button
                data-gamepad-initial-choice
                className="poker-gold-button"
                disabled={!isProtagonistUnlocked(hero)}
                onClick={() => {
                  if (isProtagonistUnlocked(hero)) onStart(hero);
                }}
              >
                {l("相棒と参戦", "Take your seat", "あいぼうと さんせん")} →
              </button>
              <small>
                {l(
                  "相棒はサポーター枠を1つ使用します。",
                  "Your companion uses one supporter slot.",
                  "あいぼうは サポーターわくを 1つ しようします。",
                )}
              </small>
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}

export function PokerUseEffect({
  name,
  kind,
  onDone,
}: {
  name: string;
  kind: string;
  onDone: () => void;
}) {
  const done = React.useRef(onDone);
  done.current = onDone;
  React.useEffect(() => {
    const timer = setTimeout(() => done.current(), 1000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div
      className={`poker-use-effect poker-use-${kind.toLowerCase()}`}
      aria-live="polite"
    >
      <div className="poker-use-orbit" />
      <strong>✦ {name} ✦</strong>
      {Array.from({ length: 14 }, (_, i) => (
        <i key={i} style={{ "--i": i } as React.CSSProperties}>
          ✧
        </i>
      ))}
    </div>
  );
}
