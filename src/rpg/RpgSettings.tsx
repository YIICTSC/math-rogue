import React, { useEffect, useRef } from "react";
import type { LanguageMode } from "../types";
import {
  useRpgPreferences,
  updateRpgPreferences,
  type RpgPreferences,
} from "./preferences";
import "./life.css";
import "./settings.css";
export default function RpgSettings({
  languageMode,
  onClose,
}: {
  languageMode: LanguageMode;
  onClose: () => void;
}) {
  const p = useRpgPreferences(),
    L = (ja: string, en: string, hi: string) =>
      languageMode === "ENGLISH" ? en : languageMode === "HIRAGANA" ? hi : ja,
    ref = useRef<HTMLElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close.current();
      }
      if (e.key === "Tab") {
        const list = Array.from(
            ref.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled),input:not(:disabled),select:not(:disabled)",
            ) || [],
          ) as HTMLElement[],
          first = list[0],
          last = list.at(-1);
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
  const toggles: [keyof RpgPreferences, string, string, string][] = [
    [
      "speech",
      "機械音声を再生",
      "Play machine speech",
      "きかいおんせいをさいせい",
    ],
    [
      "reducedMotion",
      "動き・点滅を減らす",
      "Reduce motion and flashing",
      "うごき・てんめつをへらす",
    ],
    ["contrast", "高コントラスト", "High contrast", "こうこんとらすと"],
    ["largeText", "文字を大きく", "Larger text", "もじをおおきく"],
    [
      "largeControls",
      "操作ボタンを大きく",
      "Larger controls",
      "そうさぼたんをおおきく",
    ],
    [
      "labels",
      "マップの名前を表示",
      "Show map names",
      "まっぷのなまえをひょうじ",
    ],
    [
      "tapMove",
      "マップをタップして移動",
      "Tap map to move",
      "まっぷをたっぷしていどう",
    ],
    [
      "twoD",
      "家具ゲームは2Dを優先",
      "Prefer 2D furniture games",
      "かぐげーむは2Dをゆうせん",
    ],
  ];
  return (
    <div
      className="rpg-life-backdrop rpg-settings-backdrop"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <section
        ref={ref}
        className={
          "rpg-life rpg-settings " +
          (p.contrast ? "rpg-high-contrast " : "") +
          (p.largeText ? "rpg-large-text " : "") +
          (p.largeControls ? "rpg-large-controls" : "")
        }
        role="dialog"
        aria-modal="true"
        aria-label={L("RPG設定", "RPG settings", "RPGせってい")}
      >
        <header>
          <h2>{L("RPG設定", "RPG settings", "RPGせってい")}</h2>
          <button onClick={onClose} aria-label={L("閉じる", "Close", "とじる")}>
            ×
          </button>
        </header>
        <div className="rpg-settings-content">
          <label>
            {L("移動操作", "Movement controls", "いどうそうさ")}
            <select
              value={p.control}
              onChange={(e) =>
                updateRpgPreferences({
                  control: e.target.value as RpgPreferences["control"],
                })
              }
            >
              <option value="dpad">
                {L("十字キー", "Directional pad", "じゅうじきー")}
              </option>
              <option value="stick">
                {L(
                  "バーチャルスティック",
                  "Virtual stick",
                  "ばーちゃるすてぃっく",
                )}
              </option>
            </select>
          </label>
          <label>
            {L("操作する手", "Control hand", "そうさするて")}
            <select
              value={p.hand}
              onChange={(e) =>
                updateRpgPreferences({
                  hand: e.target.value as "left" | "right",
                })
              }
            >
              <option value="left">{L("左手", "Left hand", "ひだりて")}</option>
              <option value="right">{L("右手", "Right hand", "みぎて")}</option>
            </select>
          </label>
          <label>
            {L("移動の繰り返し", "Movement repeat", "いどうのくりかえし")}
            <select
              value={p.repeat}
              onChange={(e) =>
                updateRpgPreferences({ repeat: Number(e.target.value) })
              }
            >
              {[120, 160, 240].map((n) => (
                <option key={n} value={n}>
                  {n} ms
                </option>
              ))}
            </select>
          </label>
          <label>
            {L("スティックの遊び", "Stick dead zone", "すてぃっくのあそび")}
            <select
              value={p.deadZone}
              onChange={(e) =>
                updateRpgPreferences({ deadZone: Number(e.target.value) })
              }
            >
              {[0.15, 0.22, 0.35].map((n) => (
                <option key={n} value={n}>
                  {Math.round(n * 100)}%
                </option>
              ))}
            </select>
          </label>
          <label>
            {L("マップ拡大率", "Map zoom", "まっぷかくだいりつ")}
            <select
              value={p.zoom}
              onChange={(e) =>
                updateRpgPreferences({ zoom: Number(e.target.value) })
              }
            >
              {[1, 1.25, 1.5].map((n) => (
                <option key={n} value={n}>
                  {n * 100}%
                </option>
              ))}
            </select>
          </label>
          {toggles.map(([key, ja, en, hi]) => (
            <label key={key} className="rpg-settings-toggle">
              <input
                type="checkbox"
                checked={Boolean(p[key])}
                onChange={(e) =>
                  updateRpgPreferences({ [key]: e.target.checked })
                }
              />
              {L(ja, en, hi)}
            </label>
          ))}
          <p>
            {L(
              "この端末のRPG専用設定として保存します。音声を切っても会話は文字で読めます。矢印キー・WASDにも対応します。",
              "Settings are saved for RPG on this device. Conversations remain readable when speech is off. Arrow keys and WASD also work.",
              "このたんまつのRPGせんようせっていとしてほぞんします。おんせいをきってもかいわはもじでよめます。やじるしきー・WASDにもたいおうします。",
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
