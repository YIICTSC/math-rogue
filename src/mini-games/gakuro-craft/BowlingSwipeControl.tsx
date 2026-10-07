import React, { useEffect, useRef, useState } from "react";
import { bowlingSwipe, type SwipePoint } from "./bowlingSwipe";
import type { HomeGame, GameCommand } from "./homeGames";
export default function BowlingSwipe({
  g,
  mine,
  paused,
  t,
  send,
  onPreview,
  children,
}: {
  g: HomeGame;
  mine: boolean;
  paused: boolean;
  t: (s: string) => string;
  send: (c: GameCommand) => void;
  onPreview: (aim: number, power: number, spin: number) => void;
  children: React.ReactNode;
}) {
  const gesture = useRef<{
      id: number;
      start: number;
      points: SwipePoint[];
      rect: DOMRect;
    } | null>(null),
    [trail, setTrail] = useState<SwipePoint[]>([]),
    [aim, setAim] = useState(0),
    latest = useRef({ g, mine, paused });
  latest.current = { g, mine, paused };
  const cancel = () => {
    gesture.current = null;
    setTrail([]);
  };
  useEffect(cancel, [g.key, g.round, mine, paused]);
  useEffect(() => {
    window.addEventListener("blur", cancel);
    return () => window.removeEventListener("blur", cancel);
  }, []);
  const add = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = gesture.current;
    if (!p || p.id !== e.pointerId) return;
    const point = {
      x: (e.clientX - p.rect.left) / p.rect.width,
      y: (e.clientY - p.rect.top) / p.rect.height,
    };
    p.points.push(point);
    if (p.points.length > 100) p.points.splice(1, 1);
    setTrail([...p.points]);
    const shot = bowlingSwipe(p.points, performance.now() - p.start);
    if (shot) onPreview(shot.aim, shot.power, shot.spin);
  };
  const release = (e: React.PointerEvent<HTMLDivElement>) => {
    add(e);
    const p = gesture.current,
      v = latest.current;
    if (!p) return;
    const shot = bowlingSwipe(p.points, performance.now() - p.start);
    cancel();
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    if (shot && v.mine && !v.paused && !v.g.party?.shot)
      send({ type: "game_bowl", key: v.g.key, round: v.g.round, ...shot });
  };
  return (
    <div className="gc-bowling-swipe">
      <p>
        {t(
          "ボール付近から上へスワイプして投球。速さで強さ、曲げ方でカーブが変わります。",
        )}
      </p>
      <div
        className="gc-bowling-gesture"
        role="group"
        tabIndex={0}
        aria-label={t("スワイプでボウリング投球")}
        onPointerDown={(e) => {
          if (
            !mine ||
            paused ||
            g.party?.shot ||
            !e.isPrimary ||
            e.button !== 0 ||
            (e.target as HTMLElement).closest("button")
          )
            return;
          const lane = e.currentTarget.querySelector("canvas,svg");
          if (!lane) return;
          e.preventDefault();
          const rect = lane.getBoundingClientRect();
          gesture.current = {
            id: e.pointerId,
            start: performance.now(),
            points: [
              {
                x: (e.clientX - rect.left) / rect.width,
                y: (e.clientY - rect.top) / rect.height,
              },
            ],
            rect,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={add}
        onPointerUp={release}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onKeyDown={(e) => {
          if (!mine || paused || g.party?.shot) return;
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            const next = Math.max(
              -1,
              Math.min(1, aim + (e.key === "ArrowLeft" ? -0.15 : 0.15)),
            );
            setAim(next);
            onPreview(next, 0.8, 0);
          }
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            send({
              type: "game_bowl",
              key: g.key,
              round: g.round,
              aim,
              power: 0.8,
              spin: 0,
            });
          }
        }}
      >
        {children}
        {trail.length > 1 && (
          <svg
            className="gc-swipe-trail"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              points={trail.map((p) => p.x * 100 + "," + p.y * 100).join(" ")}
              fill="none"
              stroke="#fff3a5"
              strokeWidth={1.5}
            />
          </svg>
        )}
      </div>
      <div className="gc-row">
        <button
          disabled={!mine || paused || !!g.party?.shot}
          onClick={() => {
            const n = Math.max(-1, aim - 0.15);
            setAim(n);
            onPreview(n, 0.8, 0);
          }}
          aria-label={t("左を狙う")}
        >
          ←
        </button>
        <button
          disabled={!mine || paused || !!g.party?.shot}
          onClick={() =>
            send({
              type: "game_bowl",
              key: g.key,
              round: g.round,
              aim,
              power: 0.8,
              spin: 0,
            })
          }
        >
          {t("ボタンで投球")}
        </button>
        <button
          disabled={!mine || paused || !!g.party?.shot}
          onClick={() => {
            const n = Math.min(1, aim + 0.15);
            setAim(n);
            onPreview(n, 0.8, 0);
          }}
          aria-label={t("右を狙う")}
        >
          →
        </button>
      </div>
      <small>{t("キーボードでは左右キーで狙い、Enterで投球できます。")}</small>
    </div>
  );
}
