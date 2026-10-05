import {useRpgMusic} from './music';
import React, { useEffect, useRef, useState } from "react";
import HobbyGamesPanel from "../mini-games/gakuro-craft/HobbyGamesPanel";
import {
  gameCommand,
  tickGames,
  gameOf,
  type HomeGameWorld,
  type GameCommand,
} from "../mini-games/gakuro-craft/homeGames";
import { GAME_LABELS } from "../mini-games/gakuro-craft/partyGames";
import { trans } from "../utils/textUtils";
import type { LanguageMode } from "../types";
import { useRpgPreferences } from "./preferences";
import "./miniLab.css";
export function createMiniLabWorld(): HomeGameWorld {
  const home = {
    tile: 0,
    level: 3,
    furniture: Object.keys(GAME_LABELS).map((item, slot) => ({ slot, item })),
  } as HomeGameWorld["players"][string]["progress"]["home"];
  return {
    tiles: [{ homeOwner: "practice" }],
    time: 0,
    paused: false,
    games: {},
    players: {
      practice: {
        id: "practice",
        name: "Player",
        indoors: true,
        homeTile: 0,
        progress: { home },
      },
    },
  };
}
export default function MiniGameLab({
  languageMode,
  onClose,
}: {
  languageMode: LanguageMode;
  onClose: () => void;
}) {
  useRpgMusic('games',20,'games');
  const world = useRef(createMiniLabWorld()),
    [, update] = useState(0),
    [records, setRecords] = useState<Record<string, number>>(() => {
      try {
        return JSON.parse(localStorage.getItem("rpg-mini-records-v1") || "{}");
      } catch {
        return {};
      }
    }),
    prefs = useRpgPreferences();
  const recorded = useRef(""),
    t = (s: string) => trans(s, languageMode),
    L = (ja: string, en: string, hi: string) =>
      languageMode === "ENGLISH" ? en : languageMode === "HIRAGANA" ? hi : ja;
  useEffect(() => {
    world.current.paused = false;
    let last = performance.now(),
      alive = true;
    const timer = setInterval(() => {
      const now = performance.now(),
        dt = Math.min(0.2, (now - last) / 1000);
      last = now;
      const w = world.current;
      if (document.hidden) return;
      for (let left = dt; left > 0; left -= 0.025) {
        const step = Math.min(0.025, left);
        w.time += step;
        tickGames(w, step);
      }
      const game = gameOf(w, "practice");
      if (
        game?.phase === "finished" &&
        recorded.current !== game.key + ":" + game.revision
      ) {
        recorded.current = game.key + ":" + game.revision;
        setRecords((old) => {
          const next = {
            ...old,
            [game.kind]: Math.max(old[game.kind] || 0, game.scores[0] || 0),
          };
          try {
            localStorage.setItem("rpg-mini-records-v1", JSON.stringify(next));
          } catch {}
          return next;
        });
      }
      if (alive) update((v) => v + 1);
    }, 50);
    return () => {
      alive = false;
      clearInterval(timer);
      world.current.paused = true;
    };
  }, []);
  const send = (c: GameCommand) => {
    gameCommand(world.current, world.current.players.practice, c);
    update((v) => v + 1);
  };
  return (
    <div
      className={
        "rpg-mini-lab " +
        (prefs.contrast ? "rpg-high-contrast " : "") +
        (prefs.largeText ? "rpg-large-text " : "") +
        (prefs.reducedMotion ? "rpg-reduced-motion" : "")
      }
    >
      <header>
        <div>
          <small>DEBUG · FURNITURE GAME LAB</small>
          <h1>
            {L(
              "ゲーム家具の練習室",
              "Furniture game practice",
              "げーむかぐのれんしゅうしつ",
            )}
          </h1>
        </div>
        <button onClick={onClose}>
          {L("RPGタイトルへ", "RPG title", "RPGたいとるへ")}
        </button>
      </header>
      <p>
        {L(
          "全10ゲームを材料なしで試せます。リバーシと四目並べはCPUと対戦。ほかはひとりで記録に挑戦できます。",
          "Try all 10 games without materials. Reversi and Connect Four include a CPU opponent; other games support solo score challenges.",
          "ぜん10げーむをざいりょうなしでためせます。りばーしとよんもくならべはCPUとたいせん。ほかはひとりできろくにちょうせんできます。",
        )}
      </p>
      <details>
        <summary>{L("自己ベスト", "Personal bests", "じこべすと")}</summary>
        {Object.entries(records).map(([kind, score]) => (
          <p key={kind}>
            {t(GAME_LABELS[kind as keyof typeof GAME_LABELS])} · {score}
          </p>
        ))}
      </details>
      <HobbyGamesPanel rpgMusic
        world={world.current}
        me={world.current.players.practice}
        home={world.current.players.practice.progress.home}
        t={t}
        send={send}
      />
    </div>
  );
}
