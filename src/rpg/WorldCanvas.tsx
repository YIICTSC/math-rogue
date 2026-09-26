import { trans } from "../utils/textUtils";
import type { LanguageMode } from "../types";
import React, { useEffect, useRef } from "react";
import {
  HEIGHT,
  WIDTH,
  type World,
  type Site,
  type Adventurer,
} from "./engine";

const T = 16,
  colors = ["#e6b74d", "#7ed6dd", "#c0a0ec", "#ef8a80", "#8ee0a5", "#e7a4cb"];
const characterImages = new Map<string, HTMLImageElement>();
function rect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}
function tree(c: CanvasRenderingContext2D, x: number, y: number) {
  rect(c, x + 2, y + 13, 14, 4, "#375b40");
  rect(c, x + 7, y + 8, 4, 10, "#584a36");
  rect(c, x + 7, y + 12, 1, 5, "#9d8050");
  rect(c, x + 4, y - 4, 8, 3, "#315b3c");
  rect(c, x + 1, y - 1, 14, 4, "#315b3c");
  rect(c, x - 1, y + 3, 18, 6, "#234c3a");
  rect(c, x + 1, y + 9, 14, 4, "#1b4036");
  rect(c, x + 3, y + 12, 10, 2, "#183930");
  rect(c, x + 4, y - 3, 7, 3, "#739454");
  rect(c, x + 1, y + 1, 9, 3, "#5b8048");
  rect(c, x + 6, y + 2, 8, 4, "#416c41");
  rect(c, x + 1, y + 6, 5, 3, "#456f43");
  rect(c, x + 9, y + 7, 5, 3, "#30583c");
  rect(c, x + 3, y + 2, 2, 1, "#89a45e");
  rect(c, x + 8, y - 2, 2, 1, "#9cb773");
}
function building(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  boss = false,
) {
  rect(c, x - 15, y - 14, 32, 29, boss ? "#828391" : "#d8c394");
  rect(c, x - 18, y - 17, 38, 7, boss ? "#45475f" : "#aa6452");
  rect(c, x - 13, y - 24, 28, 7, boss ? "#565b75" : "#bc7860");
  rect(c, x - 8, y - 29, 18, 5, boss ? "#8c91a1" : "#d6996c");
  rect(c, x - 12, y - 7, 7, 7, "#304a54");
  rect(c, x + 7, y - 7, 7, 7, "#304a54");
  rect(c, x - 2, y + 3, 7, 12, "#4e4140");
  rect(c, x - 12, y - 7, 5, 2, "#e6c96f");
  rect(c, x + 7, y - 7, 5, 2, "#e6c96f");
  rect(c, x - 16, y + 14, 34, 3, "#585443");
  // Roof shingles, timber framing, window panes and stone doorstep.
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5 - row; col++)
      rect(
        c,
        x - 15 + row * 3 + col * 6,
        y - 14 - row * 5,
        4,
        1,
        boss ? "#777d94" : "#dda075",
      );
  }
  rect(c, x - 14, y - 9, 2, 22, "#897352");
  rect(c, x + 14, y - 9, 2, 22, "#897352");
  rect(c, x - 14, y + 1, 29, 2, "#a18c61");
  rect(c, x - 10, y - 7, 1, 7, "#c9b880");
  rect(c, x + 9, y - 7, 1, 7, "#c9b880");
  rect(c, x - 4, y + 14, 12, 2, "#baae87");
  rect(c, x - 5, y + 16, 14, 2, "#8f9276");
  if (!boss) {
    rect(c, x + 9, y - 30, 4, 12, "#86735e");
    rect(c, x + 8, y - 31, 6, 2, "#b7aa83");
    rect(c, x - 15, y + 8, 10, 5, "#58764b");
    for (let i = 0; i < 3; i++)
      rect(c, x - 14 + i * 3, y + 7 + (i % 2), 2, 2, "#eac795");
    rect(c, x + 20, y + 2, 2, 15, "#897249");
    rect(c, x + 17, y + 2, 9, 7, "#3b6962");
    rect(c, x + 20, y + 3, 2, 4, "#e1d399");
  }
  if (boss) {
    rect(c, x - 5, y - 21, 12, 10, "#d6cfaf");
    rect(c, x, y - 20, 2, 6, "#44495a");
    rect(c, x, y - 15, 5, 2, "#44495a");
    rect(c, x - 18, y - 32, 5, 16, "#686f87");
    rect(c, x + 15, y - 32, 5, 16, "#686f87");
  }
}
function person(
  c: CanvasRenderingContext2D,
  p: Adventurer,
  self: boolean,
  time: number,
) {
  const x = p.x * T,
    y = p.y * T,
    coat = colors[p.color],
    bob = Math.sin(time / 350 + p.color) > 0.8 ? 1 : 0;
  rect(c, x + 3, y + 13, 11, 3, "#203b35");
  const source = p.profile?.image;
  if (source && !characterImages.has(source)) {
    const image = new Image();
    image.src = source;
    characterImages.set(source, image);
  }
  const sprite = source ? characterImages.get(source) : undefined;
  if (sprite?.complete && sprite.naturalWidth > 0) {
    const scale = Math.min(24 / sprite.naturalWidth, 28 / sprite.naturalHeight);
    const width = sprite.naturalWidth * scale,
      height = sprite.naturalHeight * scale;
    c.drawImage(
      sprite,
      x + 8 - width / 2,
      y + 15 - height + bob,
      width,
      height,
    );
  } else {
    rect(c, x + 5, y + 11, 3, 4, "#303345");
    rect(c, x + 10, y + 11, 3, 4, "#303345");
    rect(c, x + 4, y + 5 + bob, 10, 7, coat);
    rect(c, x + 5, y + bob, 8, 6, "#f1cc97");
    rect(c, x + 4, y - 2 + bob, 10, 4, "#624431");
    rect(c, x + 11, y + 2 + bob, 1, 2, "#2f343a");
    rect(c, x + 3, y + 7 + bob, 2, 4, "#f1cc97");
  }
  if (self) {
    rect(c, x + 6, y - 9, 6, 2, "#ffe299");
    rect(c, x + 8, y - 7, 2, 2, "#ffe299");
  }
  if (p.team) {
    c.strokeStyle = coat;
    c.strokeRect(x + 1, y + 12, 15, 5);
  }
}
function landmark(c: CanvasRenderingContext2D, s: Site, time: number) {
  const x = s.x * T + 8,
    y = s.y * T + 8;
  if (s.kind === "town" || s.kind === "boss")
    building(c, x, y, s.kind === "boss");
  else if (s.kind === "rest") {
    rect(c, x - 7, y + 2, 15, 4, "#684939");
    rect(c, x - 4, y - 5, 9, 9, "#e9a54d");
    rect(c, x - 1, y - 8 + (Math.floor(time / 300) % 2) * 2, 3, 10, "#ffe1a0");
  } else if (s.kind === "treasure") {
    rect(c, x - 6, y - 4, 13, 10, "#88613c");
    rect(c, x - 6, y - 5, 13, 3, "#e3b967");
    rect(c, x - 1, y - 1, 3, 4, "#fae1a0");
  } else if (s.kind === "event") {
    rect(c, x - 4, y - 9, 9, 16, "#929d87");
    rect(c, x - 2, y - 6, 5, 2, "#d8dfb0");
    rect(c, x - 2, y - 2, 5, 2, "#d8dfb0");
    c.fillStyle = "#ffedaa";
    c.font = "bold 12px monospace";
    c.textAlign = "center";
    c.fillText("?", x, y - 12);
  } else {
    const guard = s.kind === "guardian";
    rect(c, x - 7, y + 3, 15, 4, "#264940");
    rect(
      c,
      x - 6,
      y - 3,
      13,
      8,
      s.cleared ? "#627361" : guard ? "#947bba" : "#83b393",
    );
    rect(
      c,
      x - 3,
      y - 7,
      8,
      7,
      s.cleared ? "#627361" : guard ? "#b3a0d1" : "#a3cfaa",
    );
    rect(c, x - 3, y - 2, 2, 2, "#28383c");
    rect(c, x + 3, y - 2, 2, 2, "#28383c");
    if (guard && !s.cleared) rect(c, x - 4, y - 11, 9, 3, "#ecd185");
  }
}
export default function WorldCanvas({
  world,
  selfId,
  onTile,
  overview = false,
  languageMode = "JAPANESE",
}: {
  world: World;
  selfId: string;
  onTile: (x: number, y: number) => void;
  overview?: boolean;
  languageMode?: LanguageMode;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    camera = useRef({ x: 0, y: 0, scale: 1 }),
    latest = useRef(world);
  latest.current = world;
  useEffect(() => {
    const canvas = ref.current!;
    const c = canvas.getContext("2d")!;
    let frame = 0;
    const paint = (time: number) => {
      const w: World = latest.current,
        p = w.players[selfId];
      if (!p) return;
      const sw = canvas.clientWidth,
        sh = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(sw));
      canvas.height = Math.max(1, Math.round(sh));
      const scale = overview
        ? Math.min(sw / (WIDTH * T), sh / (HEIGHT * T))
        : sw < 600
          ? 2
          : 3;
      const cx = overview
        ? (WIDTH * T - sw / scale) / 2
        : Math.max(
            0,
            Math.min(WIDTH * T - sw / scale, p.x * T - sw / scale / 2),
          );
      const cy = overview
        ? (HEIGHT * T - sh / scale) / 2
        : Math.max(
            0,
            Math.min(HEIGHT * T - sh / scale, p.y * T - sh / scale / 2),
          );
      camera.current = { x: cx, y: cy, scale };
      c.imageSmoothingEnabled = false;
      c.fillStyle = "#101f24";
      c.fillRect(0, 0, sw, sh);
      c.save();
      c.scale(scale, scale);
      c.translate(-cx, -cy);
      for (let y = 0; y < HEIGHT; y++)
        for (let x = 0; x < WIDTH; x++) {
          const tile = w.tiles[y * WIDTH + x],
            hash = (x * 173 + y * 31 + w.seed) % 19,
            px = x * T,
            py = y * T;
          rect(
            c,
            px,
            py,
            T,
            T,
            tile === "water"
              ? "#376d79"
              : tile === "road"
                ? "#ae9c6c"
                : tile === "stone"
                  ? "#727c79"
                  : hash < 8
                    ? "#608455"
                    : "#66895a",
          );
          if (tile === "water") {
            rect(
              c,
              px + ((Math.floor(time / 650) + x) % 3) * 3,
              py + 5,
              7,
              1,
              "#669f9e",
            );
            rect(c, px + 3, py + 12, 5, 1, "#4b8790");
          } else if (tile === "road") {
            rect(c, px + (hash % 10), py + (hash % 11), 3, 1, "#8e825d");
            rect(c, px + 1, py + 14, 3, 1, "#c8b881");
          } else {
            rect(c, px + (hash % 12), py + 3, 1, 3, "#4b704b");
            if (hash === 4) {
              rect(c, px + 8, py + 8, 2, 2, "#e6cd9a");
              rect(c, px + 10, py + 11, 2, 2, "#b4bfc9");
            }
          }
          if (tile === "forest") tree(c, px, py - 2);
        }
      w.sites.forEach((s) => landmark(c, s, time));
      Object.values(w.players)
        .sort((a, b) => a.y - b.y)
        .forEach((q) => person(c, q, q.id === selfId, time));
      c.restore();
      if (!overview) {
        c.textAlign = "center";
        c.font = "bold 12px sans-serif";
        w.sites.forEach((s) => {
          const x = (s.x * T + 8 - cx) * scale,
            y = (s.y * T - 33 - cy) * scale;
          if (x < 0 || x > sw || y < 0 || y > sh) return;
          c.fillStyle = "#112526dc";
          const label = trans(s.name, languageMode);
          const tw = c.measureText(label).width;
          c.fillRect(x - tw / 2 - 7, y - 12, tw + 14, 20);
          c.fillStyle = s.cleared
            ? "#9db6a1"
            : s.kind === "boss"
              ? "#f1c6a6"
              : "#eee6c5";
          c.fillText(label, x, y + 2);
        });
        Object.values(w.players).forEach((q) => {
          const x = (q.x * T + 8 - cx) * scale,
            y = (q.y * T + 25 - cy) * scale;
          c.fillStyle = "#112526d9";
          c.fillRect(x - 35, y - 12, 70, 18);
          c.fillStyle = q.id === selfId ? "#ffe3a5" : "#fff";
          c.fillText(q.name, x, y);
        });
      }
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [selfId, overview, languageMode]);
  return (
    <canvas
      ref={ref}
      className="rpg-canvas"
      aria-label={trans(
        "探索マップ。矢印キーまたはWASDで移動し、Eキーで調べます。",
        languageMode,
      )}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect(),
          v = camera.current;
        onTile(
          Math.floor((e.clientX - r.left) / v.scale / 16 + v.x / 16),
          Math.floor((e.clientY - r.top) / v.scale / 16 + v.y / 16),
        );
      }}
    />
  );
}
