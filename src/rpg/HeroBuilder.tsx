import { encodeHeroImage } from "./heroImage";
import { flushSync } from "react-dom";
import TranslatedUiTree from "../components/TranslatedUiTree";
import type { LanguageMode } from "../types";
import React, { useEffect, useRef, useState } from "react";
import {
  HERO_ACTIONS,
  HERO_LIMIT,
  validHero,
  type CustomHero,
  type HeroAction,
} from "./customHero";
import { PROTAGONIST_VOICE_AUDITIONS } from "../data/protagonistVoiceAudition";
import { audioService } from "../services/audioService";
export const HERO_LABELS: Record<HeroAction, string> = {
  idle: "待機",
  "idle-special": "特殊待機",
  attack: "攻撃",
  skill: "スキル",
  hit: "被弾",
  "low-hp": "瀕死",
};
export default function HeroBuilder({
  initial,
  onSave,
  onClose,
  languageMode = "JAPANESE",
}: {
  languageMode?: LanguageMode;
  initial: CustomHero | null;
  onSave: (hero: CustomHero | null) => void;
  onClose: () => void;
}) {
  const [hero, setHero] = useState<CustomHero>(
      () =>
        initial || {
          version: 1,
          name: "オリジナル主人公",
          portrait: "",
          frames: {
            idle: [],
            "idle-special": [],
            attack: [],
            skill: [],
            hit: [],
            "low-hp": [],
          },
          voice: { theme: "high-school", heroId: "WARRIOR" },
        },
    ),
    [action, setAction] = useState<HeroAction>("idle"),
    [slot, setSlot] = useState(0),
    [error, setError] = useState(""),
    [editing, setEditing] = useState(false),
    [mode, setMode] = useState<"crop" | "erase" | "restore">("crop"),
    [brush, setBrush] = useState(20),
    [tolerance, setTolerance] = useState(35),
    [tick, setTick] = useState(0),
    [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null),
    original = useRef<ImageData>(),
    history = useRef<ImageData[]>([]),
    start = useRef<{ x: number; y: number }>(),
    drag = useRef(false),
    target = useRef<{ action: HeroAction; slot: number; portrait: boolean }>(),
    ref = useRef<HTMLElement>(null),
    reader = useRef(0);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const timer = setInterval(() => setTick((t) => t + 1), 155);
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      clearInterval(timer);
      reader.current++;
      audioService.stopProtagonistVoiceAuditions();
      if (before?.isConnected) before.focus();
    };
  }, []);
  const context = () =>
    canvas.current!.getContext("2d", { willReadFrequently: true })!;
  const remember = () => {
    const c = canvas.current!;
    history.current.push(context().getImageData(0, 0, c.width, c.height));
    if (history.current.length > 12) history.current.shift();
  };
  const load = async (file: File, portrait = false) => {
    setError("");
    if (file.size > 16 * 1024 * 1024) {
      setError("画像は16MB以下にしてください。");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選んでください。");
      return;
    }
    const seq = ++reader.current;
    setBusy(true);
    try {
      const image = await createImageBitmap(file);
      if (seq !== reader.current) {
        image.close();
        return;
      }
      flushSync(() => setEditing(true));
      target.current = { action, slot, portrait };
      requestAnimationFrame(() => {
        const c = canvas.current;
        if (!c) {
          image.close();
          setBusy(false);
          return;
        }
        const scale = Math.min(1, 768 / Math.max(image.width, image.height));
        c.width = Math.round(image.width * scale);
        c.height = Math.round(image.height * scale);
        const ctx = context();
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(image, 0, 0, c.width, c.height);
        original.current = ctx.getImageData(0, 0, c.width, c.height);
        history.current = [];
        image.close();
        setBusy(false);
      });
    } catch {
      setBusy(false);
      setError("画像を読み込めませんでした。");
    }
  };
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * e.currentTarget.width,
      y: ((e.clientY - r.top) / r.height) * e.currentTarget.height,
    };
  };
  const draw = (x: number, y: number) => {
    const ctx = context(),
      c = canvas.current!;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, brush, 0, Math.PI * 2);
    ctx.clip();
    if (mode === "restore" && original.current) {
      const source = document.createElement("canvas");
      source.width = c.width;
      source.height = c.height;
      source.getContext("2d")!.putImageData(original.current, 0, 0);
      ctx.drawImage(source, 0, 0);
    } else ctx.clearRect(x - brush, y - brush, brush * 2, brush * 2);
    ctx.restore();
  };
  const eraseBackground = () => {
    const c = canvas.current!,
      ctx = context();
    remember();
    const data = ctx.getImageData(0, 0, c.width, c.height),
      pixels = data.data,
      seen = new Uint8Array(c.width * c.height),
      queue: number[] = [];
    for (let x = 0; x < c.width; x++)
      queue.push(x, (c.height - 1) * c.width + x);
    for (let y = 0; y < c.height; y++)
      queue.push(y * c.width, y * c.width + c.width - 1);
    const colors = [
      0,
      c.width - 1,
      (c.height - 1) * c.width,
      c.width * c.height - 1,
    ].map((i) => [pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2]]);
    for (let i = 0; i < queue.length; i++) {
      const n = queue[i];
      if (n < 0 || n >= seen.length || seen[n]) continue;
      seen[n] = 1;
      const o = n * 4;
      if (
        pixels[o + 3] &&
        !colors.some(
          (rgb) =>
            Math.hypot(
              pixels[o] - rgb[0],
              pixels[o + 1] - rgb[1],
              pixels[o + 2] - rgb[2],
            ) <= tolerance,
        )
      )
        continue;
      pixels[o + 3] = 0;
      if (n % c.width > 0) queue.push(n - 1);
      if (n % c.width < c.width - 1) queue.push(n + 1);
      queue.push(n - c.width, n + c.width);
    }
    ctx.putImageData(data, 0, 0);
  };
  const register = () => {
    const c = canvas.current!,
      data = context().getImageData(0, 0, c.width, c.height);
    let left = c.width,
      right = 0,
      top = c.height,
      bottom = 0;
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++)
        if (data.data[(y * c.width + x) * 4 + 3] > 8) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
    if (left > right) {
      setError("画像が空です。");
      return;
    }
    const out = document.createElement("canvas");
    out.width = 160;
    out.height = 192;
    const ctx = out.getContext("2d")!,
      w = right - left + 1,
      h = bottom - top + 1,
      scale = Math.min(136 / w, 168 / h);
    ctx.drawImage(
      c,
      left,
      top,
      w,
      h,
      80 - (w * scale) / 2,
      180 - h * scale,
      w * scale,
      h * scale,
    );
    const image = encodeHeroImage(out);
    if (image.length > 11000) {
      setError("画像の容量を減らしてください。");
      return;
    }
    const dest = target.current!;
    setHero((old) => {
      const frames = {
        ...old.frames,
        [dest.action]: [...old.frames[dest.action]],
      };
      if (!dest.portrait)
        frames[dest.action][Math.min(dest.slot, frames[dest.action].length)] =
          image;
      return {
        ...old,
        frames,
        portrait: dest.portrait || !old.portrait ? image : old.portrait,
      };
    });
    setEditing(false);
    setError("");
  };
  const save = () => {
    const base = hero.frames.idle[0] || hero.portrait;
    if (!base) {
      setError("待機の画像を1枚以上登録してください。");
      return;
    }
    const complete = {
      ...hero,
      name: hero.name.trim(),
      portrait: hero.portrait || base,
      frames: Object.fromEntries(
        HERO_ACTIONS.map((a) => [
          a,
          hero.frames[a].length ? hero.frames[a] : [base],
        ]),
      ) as CustomHero["frames"],
    };
    if (JSON.stringify(complete).length > HERO_LIMIT) {
      setError("画像の容量を減らしてください。");
      return;
    }
    if (!validHero(complete)) {
      setError("名前と画像を確認してください。");
      return;
    }
    try {
      onSave(complete);
      onClose();
    } catch {
      setError("保存できませんでした。端末の空き容量を確認してください。");
    }
  };
  return (
    <TranslatedUiTree mode={languageMode}>
      <div className="rpg-life-backdrop rpg-social-backdrop">
        <section
          ref={ref}
          className="rpg-life rpg-hero-builder"
          role="dialog"
          aria-modal="true"
          aria-label="オリジナル主人公ビルダー"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (editing) setEditing(false);
              else onClose();
            }
            if (e.key === "Tab") {
              const nodes = [
                  ...ref.current!.querySelectorAll<HTMLElement>(
                    'button:not(:disabled),input,select,[tabindex="0"]',
                  ),
                ].filter((n) => n.getClientRects().length),
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
          }}
        >
          <header>
            <h2>オリジナル主人公ビルダー</h2>
            <button onClick={onClose}>閉じる</button>
          </header>
          <div className="rpg-life-content">
            <label>
              主人公の名前
              <input
                value={hero.name}
                maxLength={24}
                onChange={(e) => setHero({ ...hero, name: e.target.value })}
              />
            </label>
            <p>
              写真・イラストを切り抜き、6動作に各4枚まで登録できます。未登録の動作は待機画像を使います。
            </p>
            <div className="rpg-hero-preview">
              {(hero.frames[action][
                tick % Math.max(1, hero.frames[action].length)
              ] ||
                hero.portrait) && (
                <img
                  alt=""
                  src={
                    hero.frames[action][
                      tick % Math.max(1, hero.frames[action].length)
                    ] || hero.portrait
                  }
                />
              )}
              <strong>{hero.name}</strong>
            </div>
            <nav>
              {HERO_ACTIONS.map((a) => (
                <button
                  key={a}
                  aria-pressed={action === a}
                  onClick={() => {
                    setAction(a);
                    setSlot(0);
                  }}
                >
                  {HERO_LABELS[a]} {hero.frames[a].length}/4
                </button>
              ))}
            </nav>
            <div className="rpg-hero-frames">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  aria-pressed={slot === i}
                  onClick={() => setSlot(i)}
                >
                  <span>{i + 1}</span>
                  {hero.frames[action][i] && (
                    <img alt="" src={hero.frames[action][i]} />
                  )}
                </button>
              ))}
            </div>
            <label>
              フレーム画像を選ぶ
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void load(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              disabled={!hero.frames[action][slot]}
              onClick={() =>
                setHero({
                  ...hero,
                  frames: {
                    ...hero.frames,
                    [action]: hero.frames[action].filter((_, i) => i !== slot),
                  },
                })
              }
            >
              このフレームを削除
            </button>
            <label>
              立ち絵を選ぶ
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void load(f, true);
                  e.target.value = "";
                }}
              />
            </label>
            {editing && (
              <section className="rpg-cutout-editor">
                <h3>画像の切り抜き</h3>
                <nav>
                  {[
                    ["crop", "範囲を切り抜く"],
                    ["erase", "消しゴム"],
                    ["restore", "元画像で修復"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      aria-pressed={mode === id}
                      onClick={() => setMode(id as typeof mode)}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
                <p>
                  範囲をドラッグして切り抜き。消しゴムは指でなぞって調整できます。
                </p>
                <canvas
                  ref={canvas}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    remember();
                    start.current = point(e);
                    drag.current = true;
                    if (mode !== "crop") draw(start.current.x, start.current.y);
                  }}
                  onPointerMove={(e) => {
                    if (drag.current) {
                      const p = point(e);
                      if (mode !== "crop") draw(p.x, p.y);
                      else if (start.current) {
                        const ctx = context(),
                          base = history.current.at(-1);
                        if (base) ctx.putImageData(base, 0, 0);
                        ctx.strokeStyle = "#ffe28d";
                        ctx.lineWidth = 2;
                        ctx.setLineDash([6, 4]);
                        ctx.strokeRect(
                          start.current.x,
                          start.current.y,
                          p.x - start.current.x,
                          p.y - start.current.y,
                        );
                        ctx.setLineDash([]);
                      }
                    }
                  }}
                  onPointerUp={(e) => {
                    if (!drag.current) return;
                    drag.current = false;
                    if (mode === "crop" && start.current) {
                      const base = history.current.at(-1);
                      if (base) context().putImageData(base, 0, 0);
                      const p = point(e),
                        s = start.current,
                        c = canvas.current!,
                        ctx = context(),
                        x = Math.max(0, Math.floor(Math.min(p.x, s.x))),
                        y = Math.max(0, Math.floor(Math.min(p.y, s.y))),
                        w = Math.min(
                          c.width - x,
                          Math.round(Math.abs(p.x - s.x)),
                        ),
                        h = Math.min(
                          c.height - y,
                          Math.round(Math.abs(p.y - s.y)),
                        );
                      if (w > 4 && h > 4) {
                        ctx.clearRect(0, 0, c.width, y);
                        ctx.clearRect(0, y + h, c.width, c.height - y - h);
                        ctx.clearRect(0, y, x, h);
                        ctx.clearRect(x + w, y, c.width - x - w, h);
                      }
                    }
                  }}
                  onPointerCancel={() => {
                    drag.current = false;
                    if (mode === "crop") {
                      const base = history.current.at(-1);
                      if (base) context().putImageData(base, 0, 0);
                    }
                  }}
                />
                <label>
                  ブラシの大きさ
                  <input
                    type="range"
                    min={3}
                    max={60}
                    value={brush}
                    onChange={(e) => setBrush(Number(e.target.value))}
                  />
                </label>
                <label>
                  背景除去の許容値
                  <input
                    type="range"
                    min={5}
                    max={140}
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                  />
                </label>
                <div>
                  <button onClick={eraseBackground}>四隅の背景色を除去</button>
                  <button
                    onClick={() => {
                      const data = history.current.pop();
                      if (data) context().putImageData(data, 0, 0);
                    }}
                  >
                    ひとつ戻す
                  </button>
                  <button onClick={register}>この画像を登録</button>
                  <button onClick={() => setEditing(false)}>
                    編集をやめる
                  </button>
                </div>
              </section>
            )}
            <label>
              主人公のボイス
              <select
                value={`${hero.voice.theme}:${hero.voice.heroId}`}
                onChange={(e) => {
                  const entry = PROTAGONIST_VOICE_AUDITIONS.find(
                    (v) => `${v.theme}:${v.heroId}` === e.target.value,
                  )!;
                  setHero({
                    ...hero,
                    voice: { theme: entry.theme, heroId: entry.heroId },
                  });
                }}
              >
                {PROTAGONIST_VOICE_AUDITIONS.map((v) => (
                  <option key={v.id} value={`${v.theme}:${v.heroId}`}>
                    {v.theme === "magic" ? "マジック編" : "高校編"} · {v.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() =>
                void audioService.playProtagonistVoiceAudition(
                  hero.voice.theme,
                  hero.voice.heroId,
                  "01-base",
                )
              }
            >
              ボイスを試聴
            </button>
            <p>
              画像と主人公はこの端末に保存され、参加した部屋へ共有されます。
            </p>
            <p role="alert">{error}</p>
            <button
              className="rpg-social-primary"
              disabled={busy || editing}
              onClick={save}
            >
              保存してこの主人公を使う
            </button>
            {initial && (
              <button
                onClick={() => {
                  try {
                    onSave(null);
                    onClose();
                  } catch {
                    setError(
                      "保存できませんでした。端末の空き容量を確認してください。",
                    );
                  }
                }}
              >
                元の主人公に戻す
              </button>
            )}
          </div>
        </section>
      </div>
    </TranslatedUiTree>
  );
}
