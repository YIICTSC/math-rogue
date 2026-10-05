import React, { useEffect, useRef, useState } from "react";
import type { LanguageMode } from "../../types";
import TranslatedUiTree from "../../components/TranslatedUiTree";
import { trans } from "../../utils/textUtils";
import {
  COURSES,
  LOCKED_POINTS,
  getTrack,
  sampleTrack,
  makeCustomCourse,
  customCourseError,
  validCustomCourse,
  type CustomCourse,
  type TrackFeature,
} from "./track";
import { loadCourses, saveCourse, deleteCourse } from "./courseStorage";
import "./courseEditor.css";
export default function CourseEditor({
  initial,
  onUse,
  onClose,
  languageMode,
}: {
  initial?: CustomCourse;
  onUse: (c: CustomCourse) => void;
  onClose: () => void;
  languageMode: LanguageMode;
}) {
  const [draft, setDraft] = useState<CustomCourse>(() =>
    structuredClone(initial ?? makeCustomCourse()),
  );
  const [saved, setSaved] = useState(loadCourses),
    [selected, setSelected] = useState(4),
    [feature, setFeature] = useState<number | null>(null),
    [tool, setTool] = useState<"move" | TrackFeature["type"]>("move"),
    [notice, setNotice] = useState("");
  const [past, setPast] = useState<CustomCourse[]>([]),
    [future, setFuture] = useState<CustomCourse[]>([]);
  const [zoom, setZoom] = useState(1),
    [center, setCenter] = useState({ x: 350, z: 300 });
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      if (before?.isConnected) before.focus();
    };
  }, []);
  const svg = useRef<SVGSVGElement>(null),
    drag = useRef<{
      point?: number;
      feature?: number;
      before: CustomCourse;
    } | null>(null),
    upload = useRef<HTMLInputElement>(null);
  const t = (s: string) => trans(s, languageMode),
    track = getTrack(draft.theme, draft),
    error = customCourseError(draft);
  const change = (next: CustomCourse) => {
    setPast((p) => [...p, draft].slice(-50));
    setFuture([]);
    setDraft(next);
    setNotice("");
  };
  const nearest = (x: number, z: number) => {
    let best = Infinity,
      index = 0;
    track.points.forEach((p, i) => {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < best) {
        best = d;
        index = i;
      }
    });
    return Math.max(490 / track.length, index / track.points.length);
  };
  const location = (e: React.PointerEvent) => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      svg.current!.getScreenCTM()!.inverse(),
    );
    return {
      x: Math.round(Math.max(-800, Math.min(1600, p.x)) / 10) * 10,
      z: Math.round(Math.max(-1000, Math.min(1600, -p.y)) / 10) * 10,
    };
  };
  const updatePoint = (axis: number, value: number) => {
    const next = structuredClone(draft);
    next.points[selected][axis] = value;
    change(next);
  };
  const add = (
    type: TrackFeature["type"],
    at = Math.max(0.5, 490 / track.length),
  ) => {
    if (draft.features.length >= 48) return;
    const next = structuredClone(draft);
    next.features.push({ at, lane: 0, type });
    change(next);
    setFeature(next.features.length - 1);
  };
  const begin = (e: React.PointerEvent, point?: number, f?: number) => {
    if (point !== undefined && LOCKED_POINTS.includes(point)) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { point, feature: f, before: structuredClone(draft) };
    if (point !== undefined) {
      setSelected(point);
      setFeature(null);
    } else setFeature(f!);
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const pos = location(e);
    setDraft((current) => {
      const next = structuredClone(current);
      if (d.point !== undefined) {
        next.points[d.point][0] = pos.x;
        next.points[d.point][2] = pos.z;
      } else if (d.feature !== undefined)
        next.features[d.feature].at = nearest(pos.x, pos.z);
      return next;
    });
  };
  const end = () => {
    const d = drag.current;
    if (!d) return;
    setPast((p) => [...p, d.before].slice(-50));
    setFuture([]);
    drag.current = null;
  };
  const choose = (c: CustomCourse) => {
    change(structuredClone(c));
    setFeature(null);
    setSelected(4);
  };
  const save = () => {
    if (saveCourse(draft)) {
      setSaved(loadCourses());
      setNotice("コースを保存しました。");
    } else setNotice("保存できませんでした。");
  };
  const path =
    track.points
      .filter((_, i) => i % 4 === 0)
      .map((p, i) => `${i ? "L" : "M"}${p.x},${-p.z}`)
      .join(" ") + " Z";
  const f = feature === null ? undefined : draft.features[feature];
  return (
    <TranslatedUiTree mode={languageMode}>
      <section
        ref={panel}
        className="gk-course-editor"
        role="dialog"
        aria-modal="true"
        aria-label="オリジナルコース作成"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
          if (e.key === "Tab") {
            const nodes = Array.from(
              e.currentTarget.querySelectorAll<HTMLElement>(
                'button:not(:disabled),input:not([hidden]),select,[tabindex="0"]',
              ),
            ).filter((n) => n.getClientRects().length);
            const first = nodes[0],
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
          <div>
            <h1>オリジナルコース作成</h1>
            <small>
              問題のストレートは固定。点を動かして、その先のコースを作ろう。
            </small>
          </div>
          <button onClick={onClose}>戻る</button>
        </header>
        <div className="gk-editor-body">
          <div className="gk-editor-map">
            <nav>
              {(["move", "boost", "jump", "box"] as const).map((type) => (
                <button
                  key={type}
                  aria-pressed={tool === type}
                  onClick={() => setTool(type)}
                >
                  {t(
                    {
                      move: "コースを動かす",
                      boost: "ブースト板",
                      jump: "ジャンプ台",
                      box: "アイテム箱",
                    }[type],
                  )}
                </button>
              ))}
              <button
                disabled={!past.length}
                onClick={() => {
                  setFuture((f) => [draft, ...f]);
                  setDraft(past.at(-1)!);
                  setPast((p) => p.slice(0, -1));
                }}
              >
                元に戻す
              </button>
              <button
                disabled={!future.length}
                onClick={() => {
                  setPast((p) => [...p, draft]);
                  setDraft(future[0]);
                  setFuture((f) => f.slice(1));
                }}
              >
                やり直す
              </button>
              <button
                onClick={() => {
                  setZoom((z) => (z === 1 ? 2 : z === 2 ? 4 : 1));
                  setCenter({
                    x: draft.points[selected][0],
                    z: draft.points[selected][2],
                  });
                }}
              >
                拡大・縮小
              </button>
            </nav>
            <svg
              ref={svg}
              viewBox={
                String(center.x - 1000 / zoom) +
                " " +
                String(-center.z - 1300 / zoom) +
                " " +
                String(2000 / zoom) +
                " " +
                String(2600 / zoom)
              }
              aria-label="コース編集マップ"
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              onLostPointerCapture={end}
              onPointerDown={(e) => {
                if (tool !== "move") {
                  const p = location(e);
                  add(tool, nearest(p.x, p.z));
                }
              }}
            >
              <path d={path} className="gk-editor-road" />
              <path d={path} className="gk-editor-line" />
              <path
                d={Array.from({ length: 46 }, (_, i) =>
                  sampleTrack(i * 10, draft.theme, 0, draft),
                )
                  .map((p, i) => `${i ? "L" : "M"}${p.x},${-p.z}`)
                  .join(" ")}
                className="gk-editor-quiz"
              />
              {draft.points.map((p, i) => (
                <g
                  key={i}
                  tabIndex={LOCKED_POINTS.includes(i) ? -1 : 0}
                  role="button"
                  aria-label={`${t("コースの点")} ${i}`}
                  onPointerDown={(e) => begin(e, i)}
                  onKeyDown={(e) => {
                    if (LOCKED_POINTS.includes(i)) return;
                    if (
                      [
                        "ArrowLeft",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowDown",
                      ].includes(e.key)
                    ) {
                      e.preventDefault();
                      setSelected(i);
                      setFeature(null);
                      const next = structuredClone(draft);
                      next.points[i][
                        e.key === "ArrowLeft" || e.key === "ArrowRight" ? 0 : 2
                      ] +=
                        e.key === "ArrowLeft" || e.key === "ArrowDown"
                          ? -10
                          : 10;
                      change(next);
                    }
                    if (e.key === "Enter") {
                      setSelected(i);
                      setFeature(null);
                    }
                  }}
                >
                  <circle
                    className="gk-editor-hit"
                    cx={p[0]}
                    cy={-p[2]}
                    r="90"
                    fill="transparent"
                  />
                  <circle
                    cx={p[0]}
                    cy={-p[2]}
                    r={LOCKED_POINTS.includes(i) ? 15 : 27}
                    fill={
                      LOCKED_POINTS.includes(i)
                        ? "#ffd678"
                        : selected === i && feature === null
                          ? "#ff83cc"
                          : "#61e6e0"
                    }
                  />
                  <text x={p[0]} y={-p[2] + 8}>
                    {i}
                  </text>
                </g>
              ))}
              {draft.features.map((f, i) => {
                const p = sampleTrack(
                  f.at * track.length,
                  draft.theme,
                  f.lane,
                  draft,
                );
                return (
                  <g
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-label={`${t({ boost: "ブースト板", jump: "ジャンプ台", box: "アイテム箱" }[f.type])} ${i + 1}`}
                    onPointerDown={(e) => begin(e, undefined, i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setFeature(i);
                      }
                    }}
                  >
                    <rect
                      x={p.x - 20}
                      y={-p.z - 20}
                      width="40"
                      height="40"
                      rx="8"
                      fill={
                        f.type === "boost"
                          ? "#ffcf54"
                          : f.type === "jump"
                            ? "#ac8aff"
                            : "#75ff9b"
                      }
                      stroke={i === feature ? "white" : "#15252f"}
                      strokeWidth="5"
                    />
                    <text x={p.x} y={-p.z + 9}>
                      {f.type === "boost" ? "»" : f.type === "jump" ? "↑" : "◇"}
                    </text>
                  </g>
                );
              })}
            </svg>
            <p>
              水色の点をドラッグ。配置ツールを選んで道をタッチ。金色は変更できない区間です。
            </p>
          </div>
          <aside>
            <label>
              編集する点
              <select
                aria-label="編集する点"
                value={selected}
                onChange={(e) => {
                  const i = Number(e.target.value);
                  setSelected(i);
                  setFeature(null);
                  if (zoom > 1)
                    setCenter({ x: draft.points[i][0], z: draft.points[i][2] });
                }}
              >
                {draft.points.map(
                  (_, i) =>
                    !LOCKED_POINTS.includes(i) && (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ),
                )}
              </select>
            </label>
            <label>
              配置物を選ぶ
              <select
                aria-label="配置物を選ぶ"
                value={feature ?? ""}
                onChange={(e) =>
                  setFeature(
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              >
                <option value="">コースの点</option>
                {draft.features.map((f, i) => (
                  <option key={i} value={i}>
                    {i + 1} ·{" "}
                    {t(
                      {
                        boost: "ブースト板",
                        jump: "ジャンプ台",
                        box: "アイテム箱",
                      }[f.type],
                    )}
                  </option>
                ))}
              </select>
            </label>
            <label>
              コース名
              <input
                maxLength={32}
                value={draft.name}
                onChange={(e) => change({ ...draft, name: e.target.value })}
              />
            </label>
            <label>
              背景テーマ
              <select
                aria-label="背景テーマ"
                value={draft.theme}
                onChange={(e) => {
                  const theme = Number(e.target.value),
                    next = structuredClone(draft);
                  next.theme = theme;
                  const base = makeCustomCourse(theme);
                  for (const i of LOCKED_POINTS)
                    next.points[i] = base.points[i];
                  change(next);
                }}
              >
                {COURSES.map((c, i) => (
                  <option key={i} value={i}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {f ? (
              <>
                <h2>
                  {t(
                    {
                      boost: "ブースト板",
                      jump: "ジャンプ台",
                      box: "アイテム箱",
                    }[f.type],
                  )}
                </h2>
                <label>
                  コース上の位置
                  <input
                    type="range"
                    min={Math.ceil((490 / track.length) * 1000)}
                    max="990"
                    value={Math.round(f.at * 1000)}
                    onChange={(e) => {
                      const next = structuredClone(draft);
                      next.features[feature!].at =
                        Number(e.target.value) / 1000;
                      change(next);
                    }}
                  />
                </label>
                <label>
                  左右の位置
                  <input
                    type="range"
                    min="-9"
                    max="9"
                    step="1"
                    value={f.lane}
                    onChange={(e) => {
                      const next = structuredClone(draft);
                      next.features[feature!].lane = Number(e.target.value);
                      change(next);
                    }}
                  />
                </label>
                <button
                  onClick={() => {
                    change({
                      ...draft,
                      features: draft.features.filter((_, i) => i !== feature),
                    });
                    setFeature(null);
                  }}
                >
                  配置物を削除
                </button>
              </>
            ) : (
              <>
                <h2>{t('コースの点')} · {selected}</h2>
                {[
                  ["横位置", 0, -800, 1600],
                  ["高さ", 1, -20, 100],
                  ["縦位置", 2, -1000, 1600],
                ].map(([label, axis, min, max]) => (
                  <label key={label}>
                    {t(String(label))}
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={axis === 1 ? 1 : 10}
                      value={draft.points[selected][Number(axis)]}
                      onChange={(e) =>
                        updatePoint(Number(axis), Number(e.target.value))
                      }
                    />
                  </label>
                ))}
              </>
            )}
            <div className="gk-editor-add">
              {(["boost", "jump", "box"] as const).map((type) => (
                <button
                  disabled={draft.features.length >= 48}
                  key={type}
                  onClick={() => add(type)}
                >
                  {t(
                    {
                      boost: "ブースト板",
                      jump: "ジャンプ台",
                      box: "アイテム箱",
                    }[type],
                  )}{" "}
                  ＋
                </button>
              ))}
            </div>
            <p>
              {Math.round(track.length)} m · {draft.features.length}/48
            </p>
            <p role="status">{error || notice}</p>
            <h2>保存したコース</h2>
            <select
              aria-label="保存したコース"
              value=""
              onChange={(e) => {
                const c = saved.find((c) => c.name === e.target.value);
                if (c) choose(c);
              }}
            >
              <option value="">コースを選ぶ</option>
              {saved.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              disabled={!saved.some((c) => c.name === draft.name)}
              onClick={() => {
                deleteCourse(draft.name);
                setSaved(loadCourses());
              }}
            >
              保存コースを削除
            </button>
            <button onClick={() => choose(makeCustomCourse(draft.theme))}>
              基本形に戻す
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(draft, null, 2)], {
                    type: "application/json",
                  }),
                  url = URL.createObjectURL(blob),
                  a = document.createElement("a");
                a.href = url;
                a.download = "gakuro-gp-course.json";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              ファイルに書き出す
            </button>
            <button onClick={() => upload.current?.click()}>
              ファイルを読み込む
            </button>
            <input
              hidden
              ref={upload}
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  if (file.size > 16000) throw Error();
                  const c = JSON.parse(await file.text());
                  if (!validCustomCourse(c)) throw Error();
                  choose(c);
                } catch {
                  setNotice("コースファイルが不正です。");
                }
              }}
            />
          </aside>
        </div>
        <footer>
          <button onClick={save} disabled={!!error}>
            この端末に保存
          </button>
          <button
            className="gk-primary"
            disabled={!!error}
            onClick={() => {
              if (saveCourse(draft)) {
                onUse(structuredClone(draft));
              } else setNotice("保存できませんでした。");
            }}
          >
            このコースで遊ぶ
          </button>
        </footer>
      </section>
    </TranslatedUiTree>
  );
}
