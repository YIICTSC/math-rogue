import ExpeditionPanel from '../../mini-games/gakuro-craft/ExpeditionPanel';
import {canStartExpedition} from '../../mini-games/gakuro-craft/gameExpedition';
import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  HomeGame,
  HomeGameWorld,
  GameCommand,
} from "../../mini-games/gakuro-craft/homeGames";
import { assetUrl } from "../../utils/assetPaths";
import { audioService } from "../../services/audioService";
import { stopConversationSpeech } from "../conversationSpeech";
import { RHYTHM_SONGS } from "./catalog.generated";
import {
  rhythmChart,
  rhythmSong,
  rhythmGrade,
  rhythmRank,
  chartUnits,
  chartDuration,
  type RhythmDifficulty,
  type RhythmLength,
} from "./chart";
import { newRhythmResult, awardRhythm, type RhythmResult } from "./game";
import { rhythmRecords, saveRhythmRecord, type RhythmRecord } from "./records";
import { songTitle, songTheme, songEdition } from "./songLabels";
import "./rhythm.css";
const colors = ["#45e7ef", "#ff65b1", "#ffd463", "#b688ff"],
  keys = ["D", "F", "J", "K"];
const readNumber = (
  key: string,
  fallback: number,
  min: number,
  max: number,
) => {
  try {
    const v = Number(localStorage.getItem(key));
    return localStorage.getItem(key) !== null && Number.isFinite(v)
      ? Math.max(min, Math.min(max, v))
      : fallback;
  } catch {
    return fallback;
  }
};
export default function RhythmPanel({
  world,
  g,
  selfId,
  t,
  send,
}: {
  world: HomeGameWorld;
  g: HomeGame;
  selfId: string;
  t: (s: string) => string;
  send: (c: GameCommand) => void;
}) {
  const r = g.rhythm!,
    seat = g.players.indexOf(selfId),
    leader = seat === 0,
    song = rhythmSong(r.song)!,
    notes = useMemo(
      () => rhythmChart(song, r.difficulty, r.length),
      [r.song, r.difficulty, r.length],
    );
  const [query, setQuery] = useState(""),
    [theme, setTheme] = useState("all"),
    [edition, setEdition] = useState("all"),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(false),
    [preview, setPreview] = useState(false),
    [retry, setRetry] = useState(0),
    [speed, setSpeed] = useState(() =>
      readNumber("rpg-rhythm-speed-v1", 3, 1, 6),
    ),
    [offset, setOffset] = useState(() =>
      readNumber("rpg-rhythm-offset-v1", 0, -200, 200),
    ),
    [scoresOpen, setScoresOpen] = useState(false),
    [hud, setHud] = useState({
      time: -4,
      score: 0,
      combo: 0,
      gauge: 100,
      label: "",
      delta: 0,
    }),
    [record, setRecord] = useState<RhythmRecord>();
  const stageArt = useRef<HTMLImageElement>();
  useEffect(() => {
    const image = new Image();
    image.src = assetUrl("sprites/rpg/rhythm/astral-stage.webp");
    image.onload = () => { stageArt.current = image; };
    return () => { image.onload = null; stageArt.current = undefined; };
  }, []);
  const artStyle = { "--rhythm-award": `url("${assetUrl("sprites/rpg/rhythm/astral-award.webp")}")`, "--rhythm-art": `url("${assetUrl("sprites/rpg/rhythm/astral-stage.webp")}")` } as React.CSSProperties;
  const live = useRef<HTMLElement>(null);
  const audio = useRef<HTMLAudioElement>(),
    canvas = useRef<HTMLCanvasElement>(null),
    clock = useRef({ time: world.time, at: performance.now() }),
    latest = useRef({ g, world, seat, send, speed, offset }),
    model = useRef<RhythmResult>(newRhythmResult(notes.length)),
    session = useRef(""),
    held = useRef(new Map<number, number>()),
    pressed = useRef(new Set<number>()),
    flashes = useRef([0, 0, 0, 0]),
    feedback = useRef({ text: "", at: 0, delta: 0 }),
    particles = useRef<
      Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        age: number;
        color: string;
      }>
    >([]),
    soundStarted = useRef(false),
    finished = useRef(""),
    previewUntil = useRef(0),
    previousFocus = useRef<HTMLElement | null>(null);
  latest.current = { g, world, seat, send, speed, offset };
  useEffect(() => {
    clock.current = { time: world.time, at: performance.now() };
  }, [world.time]);
  const songKey = `${r.song}:${r.difficulty}:${r.length}`;
  const ready = (value: boolean) =>
    latest.current.send({
      type: "game_rhythm_ready",
      key: g.key,
      ready: value,
      song: r.song,
      difficulty: r.difficulty,
      length: r.length,
    });
  useEffect(() => {
    setLoaded(false);
    setError(false);
    setPreview(false);
    setRecord(undefined);
    soundStarted.current = false;
    previewUntil.current = 0;
    const element = new Audio(assetUrl(song.path));
    element.preload = "auto";
    audio.current = element;
    const canplay = () => setLoaded(true),
      failed = () => {
        setError(true);
        setLoaded(false);
      };
    element.addEventListener("canplay", canplay);
    element.addEventListener("error", failed);
    element.load();
    return () => {
      element.pause();
      element.removeEventListener("canplay", canplay);
      element.removeEventListener("error", failed);
      element.removeAttribute("src");
      element.load();
      if (audio.current === element) audio.current = undefined;
      audioService.setBgmDuckMultiplier(1);
    };
  }, [songKey, retry]);
  useEffect(() => {
    return () => {
      latest.current.send({ type: "game_leave", key: g.key });
      audioService.setBgmDuckMultiplier(1);
    };
  }, [g.key]);
  useEffect(() => {
    if (g.phase !== "playing") return;
    previousFocus.current = document.activeElement as HTMLElement;
    canvas.current?.focus();
    stopConversationSpeech();
    return () => previousFocus.current?.focus?.();
  }, [g.phase]);
  const prime = async () => {
    audioService.init();
    const a = audio.current;
    if (!a) return false;
    a.volume = 0;
    try {
      await a.play();
      a.pause();
      a.currentTime = 0;
      setPreview(false);
      previewUntil.current = 0;
      audioService.setBgmDuckMultiplier(1);
      return true;
    } catch {
      setError(true);
      return false;
    }
  };
  const audioTime = () => audio.current?.currentTime || 0;
  const elapsed = () => {
    const v = latest.current;
    return (
      (v.g.rhythm!.pausedAt ??
        clock.current.time + (performance.now() - clock.current.at) / 1000) -
      v.g.rhythm!.start
    );
  };
  const judge = (index: number, edge: "down" | "up", at: number) => {
    const n = notes[index],
      result = model.current,
      grade = rhythmGrade(at - (edge === "up" ? n.end! : n.time));
    if (edge === "down") result.heads[index] = grade;
    else result.tails[index] = grade;
    awardRhythm(result, grade);
    feedback.current = {
      text: ["", "PERFECT", "GREAT", "GOOD", "MISS"][grade],
      at: performance.now(),
      delta: at - (edge === "up" ? n.end! : n.time),
    };
    flashes.current[n.lane] = performance.now();
    if (grade !== 4) {
      audioService.playRpgRhythmHit(n.lane, grade === 1);
      for (let i = 0; i < 8; i++)
        particles.current.push({
          x: n.lane * 100 + 50,
          y: (canvas.current?.height ?? 560) * 0.8,
          vx: (Math.random() - 0.5) * 180,
          vy: -50 - Math.random() * 130,
          age: 0,
          color: colors[n.lane],
        });
    }
    latest.current.send({
      type: "game_rhythm_hit",
      key: g.key,
      note: index,
      edge,
      at,
      run: latest.current.g.rhythm!.run,
    });
  };
  const down = (lane: number) => {
    const v = latest.current;
    if (
      v.g.phase !== "playing" ||
      v.g.rhythm!.pausedAt !== undefined ||
      v.world.paused ||
      elapsed() < 0 ||
      error ||
      pressed.current.has(lane)
    )
      return;
    pressed.current.add(lane);
    flashes.current[lane] = performance.now();
    const at = audioTime() + v.offset / 1000;
    let index = -1,
      distance = 0.171;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i],
        d = Math.abs(n.time - at);
      if (n.lane === lane && !model.current.heads[i] && d < distance) {
        distance = d;
        index = i;
      }
    }
    if (index < 0) {
      for (let i = 0; i < notes.length; i++) {
        const n = notes[i];
        if (
          n.lane === lane &&
          n.end !== undefined &&
          n.time <= at &&
          n.end >= at &&
          model.current.heads[i] > 0 &&
          model.current.heads[i] !== 4 &&
          !model.current.tails[i]
        ) {
          held.current.set(lane, i);
          break;
        }
      }
      return;
    }
    judge(index, "down", at);
    if (notes[index].end !== undefined) held.current.set(lane, index);
  };
  const up = (lane: number) => {
    pressed.current.delete(lane);
    const index = held.current.get(lane);
    held.current.delete(lane);
    if (index === undefined) return;
    const v = latest.current;
    if (
      v.g.phase === "playing" &&
      v.g.rhythm!.pausedAt === undefined &&
      !model.current.tails[index]
    )
      judge(index, "up", audioTime() + v.offset / 1000);
  };
  const controls = useRef({ down, up });
  controls.current = { down, up };
  useEffect(() => {
    const mapping: Record<string, number> = {
      d: 0,
      f: 1,
      j: 2,
      k: 3,
      arrowleft: 0,
      arrowdown: 1,
      arrowup: 2,
      arrowright: 3,
    };
    const kd = (e: KeyboardEvent) => {
      if (latest.current.g.phase === "playing" && e.key === "Tab") {
        const items = Array.from<HTMLElement>(
            live.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled),canvas[tabindex]",
            ) || [],
          ),
          first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
        return;
      }
      if (
        latest.current.g.phase !== "playing" ||
        (e.target as HTMLElement)?.closest?.(
          "input,select,textarea,[contenteditable=true]",
        )
      )
        return;
      const lane = mapping[e.key.toLowerCase()];
      if (lane === undefined) return;
      e.preventDefault();
      if (!e.repeat) controls.current.down(lane);
    };
    const ku = (e: KeyboardEvent) => {
      const lane = mapping[e.key.toLowerCase()];
      if (lane !== undefined) {
        e.preventDefault();
        controls.current.up(lane);
      }
    };
    const hidden = () => {
      if (document.hidden && latest.current.g.phase === "playing") {
        audio.current?.pause();
        latest.current.send({ type: "game_leave", key: g.key });
      }
    };
    const blur = () => {
      for (const lane of [...pressed.current]) controls.current.up(lane);
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [g.key]);
  useEffect(() => {
    let raf = 0,
      last = performance.now(),
      paintAt = 0;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const frame = (now: number) => {
      const reduceMotion = motionQuery.matches;
      const v = latest.current,
        rr = v.g.rhythm!,
        a = audio.current,
        dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const state = audioService.getRhythmAudioState();
      if (a) {
        a.volume = state.volume;
        // iOS can ignore HTMLAudioElement.volume; muted remains reliable.
        a.muted = state.volume === 0;
      }
      if (v.g.phase === "playing") {
        // Resuming shifts the server start time; it must preserve the existing score model.
        if (session.current !== g.key + ":" + rr.run) {
          session.current = g.key + ":" + rr.run;
          model.current = newRhythmResult(notes.length);
          held.current.clear();
          pressed.current.clear();
          particles.current = [];
          soundStarted.current = false;
        }
        const serverTime = elapsed();
        if (!state.active) {
          a?.pause();
          v.send({ type: "game_leave", key: g.key });
          return;
        }
        if (rr.pausedAt !== undefined || v.world.paused) {
          a?.pause();
          soundStarted.current = false;
          held.current.clear();
          pressed.current.clear();
        } else if (serverTime >= 0 && a && a.readyState >= 2) {
          if (!soundStarted.current) {
            a.currentTime = Math.min(
              song.duration - 0.01,
              Math.max(0, serverTime),
            );
            soundStarted.current = true;
            audioService.setBgmDuckMultiplier(0);
            void a.play().catch(() => {
              soundStarted.current = false;
              setError(true);
            });
          } else if (Math.abs(a.currentTime - serverTime) > 0.4 && !a.seeking)
            a.currentTime = Math.min(
              song.duration - 0.01,
              Math.max(0, serverTime),
            );
        }
        const time =
          serverTime < 0
            ? serverTime
            : rr.pausedAt !== undefined
              ? serverTime
              : audioTime() + v.offset / 1000;
        if (rr.pausedAt === undefined && !v.world.paused && serverTime >= 0) {
          const result = model.current;
          for (
            let i = 0;
            i < notes.length && notes[i].time < time - 0.17;
            i++
          ) {
            if (!result.heads[i]) {
              result.heads[i] = 4;
              awardRhythm(result, 4);
              feedback.current = { text: "MISS", at: now, delta: 0 };
            }
            if (
              notes[i].end !== undefined &&
              !result.tails[i] &&
              time > notes[i].end! + 0.17
            ) {
              result.tails[i] = 4;
              awardRhythm(result, 4);
              held.current.delete(notes[i].lane);
              feedback.current = { text: "MISS", at: now, delta: 0 };
            }
          }
        }
        const ctx = canvas.current?.getContext("2d");
        if (ctx) {
          const width = 400,
            height = Math.max(140, Math.min(1000, Math.round(width * canvas.current!.clientHeight / Math.max(1, canvas.current!.clientWidth)))),
            hit = height * 0.8,
            travel = 3.1 - v.speed * 0.35,
            beat = 60 / song.bpm,
            pulse = reduceMotion
              ? 0
              : (1 + Math.cos((time / beat) * Math.PI * 2)) / 2,
            result = model.current;
          if (canvas.current!.height !== height) canvas.current!.height = height;
          ctx.clearRect(0, 0, width, height);
          const bg = ctx.createLinearGradient(0, 0, 0, height);
          bg.addColorStop(0, result.combo >= 30 ? "#26183f" : "#0b182d");
          bg.addColorStop(1, "#122d3c");
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, width, height);
          if (stageArt.current) {
            const image = stageArt.current;
            const scale = Math.max(width / image.width, height / image.height);
            ctx.globalAlpha = 0.38;
            ctx.drawImage(image, (width-image.width*scale)/2, (height-image.height*scale)/2, image.width*scale, image.height*scale);
            ctx.globalAlpha = 1;
          }
          const veil = ctx.createLinearGradient(0,0,0,height);
          veil.addColorStop(0,"#080e2280"); veil.addColorStop(0.8,"#080e22c0"); veil.addColorStop(1,"#080e22");
          ctx.fillStyle = veil; ctx.fillRect(0,0,width,height);
          for (let lane = 0; lane < 4; lane++) {
            ctx.fillStyle = colors[lane];
            ctx.globalAlpha = pressed.current.has(lane)
              ? 0.18
              : 0.025 + pulse * 0.018;
            ctx.fillRect(lane * 100, 0, 100, height);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = "#ffffff19";
            ctx.beginPath();
            ctx.moveTo(lane * 100, 0);
            ctx.lineTo(lane * 100, height);
            ctx.stroke();
          }
          ctx.strokeStyle = "#ffffff14";
          for (let b = Math.ceil(time / beat); b * beat < time + travel; b++) {
            const y = hit - ((b * beat - time) / travel) * hit;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }
          for (let i = 0; i < notes.length; i++) {
            const n = notes[i];
            if (n.time > time + travel + 0.1) break;
            if ((n.end ?? n.time) < time - 0.25) continue;
            if (
              (n.end === undefined && result.heads[i]) ||
              (n.end !== undefined && result.tails[i])
            )
              continue;
            const x = n.lane * 100 + 15,
              y =
                result.heads[i] && n.end !== undefined
                  ? hit
                  : hit - ((n.time - time) / travel) * hit,
              tail =
                n.end !== undefined ? hit - ((n.end - time) / travel) * hit : y;
            if (n.end !== undefined) {
              ctx.fillStyle = colors[n.lane];
              ctx.globalAlpha = 0.4;
              ctx.fillRect(x + 15, tail, 40, Math.max(0, y - tail));
              ctx.globalAlpha = 1;
              ctx.fillRect(x + 10, tail, 50, 7);
            }
            ctx.shadowColor = colors[n.lane];
            ctx.shadowBlur = 12;
            ctx.fillStyle = colors[n.lane];
            ctx.beginPath(); ctx.roundRect(x, y - 7, 70, 14, 5); ctx.fill();
            ctx.strokeStyle = "#ffffffb0"; ctx.lineWidth = 1; ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#fff9";
            ctx.fillRect(x + 3, y - 5, 64, 3);
          }
          for (let lane = 0; lane < 4; lane++) {
            ctx.fillStyle = colors[lane];
            ctx.globalAlpha = Math.max(
              0.5,
              1 - (now - flashes.current[lane]) / 220,
            );
            ctx.fillRect(lane * 100 + 10, hit - 2, 80, 5);
            const age = (now - flashes.current[lane]) / 420;
            if (!reduceMotion && age >= 0 && age < 1) {
              ctx.globalAlpha = (1-age)*0.8;
              ctx.strokeStyle = colors[lane]; ctx.lineWidth = 2*(1-age)+1;
              ctx.beginPath(); ctx.ellipse(lane*100+50,hit,15+age*36,6+age*18,0,0,Math.PI*2); ctx.stroke();
              const glow=ctx.createRadialGradient(lane*100+50,hit,0,lane*100+50,hit,65);
              glow.addColorStop(0, colors[lane]+"90");glow.addColorStop(1,colors[lane]+"00");
              ctx.fillStyle=glow;ctx.fillRect(lane*100,hit-65,100,130);
            }
            ctx.globalAlpha = 1;
          }
          particles.current = reduceMotion ? [] : particles.current.filter((p) => p.age < 0.5);
          for (const p of reduceMotion ? [] : particles.current) {
            p.age += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 220 * dt;
            ctx.globalAlpha = 1 - p.age / 0.5;
            ctx.fillStyle = p.color;
            ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.age*3);
            ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(2,0);ctx.lineTo(0,5);ctx.lineTo(-2,0);ctx.closePath();ctx.fill();ctx.restore();
          }
          ctx.globalAlpha = 1;
          if (serverTime < 0) {
            ctx.fillStyle = "#fff";
            ctx.font = `bold ${Math.min(68,height*0.16)}px sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText(String(Math.ceil(-serverTime)), 200, height*0.45);
            ctx.font="600 12px sans-serif";ctx.fillStyle="#ffd463";ctx.fillText("GET READY",200,height*0.45+Math.min(32,height*0.12));
          }

        }
        if (now - paintAt > 50) {
          paintAt = now;
          const result = model.current;
          setHud({
            time,
            score: Math.round(
              (result.raw / Math.max(1, chartUnits(notes) * 1000)) * 1e6,
            ),
            combo: result.combo,
            gauge: result.gauge,
            label: now - feedback.current.at < 650 ? feedback.current.text : "",
            delta: feedback.current.delta,
          });
        }
      } else if (a && previewUntil.current && now > previewUntil.current) {
        a.pause();
        previewUntil.current = 0;
        setPreview(false);
        audioService.setBgmDuckMultiplier(1);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [songKey, g.key, song.duration]);
  useEffect(() => {
    if (g.phase === "finished") {
      audio.current?.pause();
      soundStarted.current = false;
      audioService.setBgmDuckMultiplier(1);
      const result = r.results[seat],
        marker = `${g.key}:${r.run}`;
      if (result && finished.current !== marker) {
        finished.current = marker;
        setRecord(
          saveRhythmRecord(
            r.song,
            r.difficulty,
            r.length,
            g.scores[seat],
            result.maxCombo,
            result.miss,
          ),
        );
      }
    } else if (g.phase === "lobby") {
      audio.current?.pause();
      soundStarted.current = false;
      session.current = "";
    }
  }, [g.phase, r.run]);
  const configure = (
    patch: Partial<{
      song: string;
      difficulty: RhythmDifficulty;
      length: RhythmLength;
    }>,
  ) =>
    send({
      type: "game_rhythm_select",
      key: g.key,
      song: r.song,
      difficulty: r.difficulty,
      length: r.length,
      ...patch,
    });
  const records = useMemo(rhythmRecords, [record]);
  const filtered = useMemo(
    () =>
      RHYTHM_SONGS.filter(
        (s) =>
          (theme === "all" || songTheme(s) === theme) &&
          (edition === "all" || songEdition(s) === edition) &&
          (!query ||
            songTitle(s, t).toLowerCase().includes(query.toLowerCase()) ||
            s.path.includes(query.toLowerCase())),
      ),
    [query, theme, edition, t],
  );
  const result = r.results[seat],
    best = record || records[`${r.song}|${r.difficulty}|${r.length}`],
    duration = chartDuration(song, r.length);
  const board = (
    <aside className={"rpg-rhythm-board" + (scoresOpen ? " is-open" : "")}>
      <h4>{t("スコア対戦")}</h4>
      {g.players.map((id, i) => (
        <article key={id}>
          <strong>
            {g.names[i]}
            {id === selfId ? " ★" : ""}
          </strong>
          <b>
            {(id === selfId && g.phase === "playing"
              ? hud.score
              : g.scores[i] || 0
            ).toLocaleString()}
          </b>
          <small>
            {g.phase === "playing"
              ? `${r.results[i]?.combo || 0} COMBO`
              : t(r.ready[i] ? "準備OK" : "準備待ち")}
          </small>
        </article>
      ))}
      <button onClick={() => setScoresOpen(false)}>{t("閉じる")}</button>
    </aside>
  );
  const exit = () => send({ type: "game_leave", key: g.key });
  if (g.phase === "playing")
    return (
      <section
        ref={live}
        className={`rpg-rhythm-live ${hud.combo >= 30 ? "is-fever" : ""}`}
        style={artStyle}
        role="dialog"
        aria-modal="true"
        aria-label={t("学ロリズム")}
      >
        <header>
          <div>
            <h3>{songTitle(song, t)}</h3>
            <small>
              {t(
                r.difficulty === "easy"
                  ? "かんたん"
                  : r.difficulty === "normal"
                    ? "ふつう"
                    : "むずかしい",
              )}{" "}
              · {Math.max(0, Math.floor(hud.time))}/{Math.ceil(duration)}s ·{" "}
              {hud.score.toLocaleString()}
            </small>
            <progress
              max={100}
              value={hud.gauge}
              aria-label={t("演奏ゲージ")}
            />
          </div>
          <div>
            <button onClick={() => setScoresOpen(!scoresOpen)}>
              {t("スコア")}
            </button>
            {leader && (
              <button
                onClick={() =>
                  send({
                    type: "game_rhythm_pause",
                    key: g.key,
                    paused: r.pausedAt === undefined,
                  })
                }
              >
                {t(r.pausedAt === undefined ? "一時停止" : "再開")}
              </button>
            )}
            <button onClick={exit}>{t("退出")}</button>
          </div>
        </header>
        <div className="rpg-rhythm-stage">
          <div className="rpg-rhythm-stage-aura" aria-hidden="true" />
          <div className="rpg-rhythm-fever" aria-hidden="true">{hud.combo >= 30 ? "✦ FEVER ✦" : "ASTRAL SYMPHONY"}</div>
          <canvas
            ref={canvas}
            width={400}
            height={560}
            tabIndex={0}
            aria-label={t("音ゲーの4レーン")}
          />
          <div className="rpg-rhythm-judgement" aria-hidden="true">
            <strong data-grade={hud.label}>{hud.label}</strong>
            {hud.label &&
              hud.label !== "MISS" &&
              Math.abs(hud.delta) > 0.045 && (
                <small>{hud.delta < 0 ? "FAST" : "LATE"}</small>
              )}
            <b key={Math.floor(hud.combo / 10)}>{hud.combo > 0 ? hud.combo : ""}</b>
            <span>{hud.combo > 0 ? "COMBO" : ""}</span>
          </div>
          {(r.pausedAt !== undefined || error) && (
            <div className="rpg-rhythm-paused">
              <h3>
                {t(
                  error
                    ? "楽曲を再生できませんでした。読み込み直して準備してください。"
                    : "一時停止中",
                )}
              </h3>
              {leader && r.pausedAt !== undefined && (
                <button
                  onClick={() =>
                    send({
                      type: "game_rhythm_pause",
                      key: g.key,
                      paused: false,
                    })
                  }
                >
                  {t("再開")}
                </button>
              )}
              <button onClick={exit}>{t("退出")}</button>
            </div>
          )}
        </div>
        {board}
        <div className="rpg-rhythm-pads">
          {keys.map((key, lane) => (
            <button
              key={key}
              style={{ "--lane": colors[lane] } as React.CSSProperties}
              aria-label={t("レーン") + " " + (lane + 1)}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                controls.current.down(lane);
              }}
              onPointerUp={() => controls.current.up(lane)}
              onPointerCancel={() => controls.current.up(lane)}
              onLostPointerCapture={() => controls.current.up(lane)}
              onClick={(e) => {
                if (e.detail === 0) {
                  controls.current.down(lane);
                  controls.current.up(lane);
                }
              }}
            >
              {key}
              <small>{["←", "↓", "↑", "→"][lane]}</small>
            </button>
          ))}
        </div>
      </section>
    );
  return (
    <section className="rpg-rhythm-lobby" style={artStyle}>
      <div className="rpg-rhythm-marquee"><span aria-hidden="true">✦ ASTRAL SYMPHONY ✦</span><h3>♫ {t("学ロリズム")}</h3><small>143 TRACKS · 4 LANES · 1–4 PLAYERS</small></div>
      <p>
        {t(
          "全曲で遊べる4レーン音ゲー。D・F・J・K、矢印キー、または画面下のボタンで演奏。長いノーツは終わりまで押して離します。",
        )}
      </p>
      {g.phase === "finished" && result && (
        <article className="rpg-rhythm-result" role="status">
          <div className="rpg-rhythm-award"><span aria-hidden="true">✦</span><strong>{rhythmRank(g.scores[seat])}</strong><span aria-hidden="true">✦</span></div>
          <h4>
            {t(
              result.gauge > 0 && g.scores[seat] >= 500000
                ? "クリア！"
                : "もう一度挑戦！",
            )}
          </h4>
          <b>{g.scores[seat].toLocaleString()} / 1,000,000</b>
          <p>
            {result.miss === 0
              ? result.great === 0 && result.good === 0
                ? "ALL PERFECT"
                : "FULL COMBO"
              : ""}
          </p>
          <p>
            PERFECT {result.perfect} · GREAT {result.great} · GOOD {result.good}{" "}
            · MISS {result.miss}
          </p>
          <p>
            {t("最大コンボ")} {result.maxCombo} · {t("達成率")}{" "}
            {(g.scores[seat] / 10000).toFixed(2)}%
          </p>
          <p>
            {t("自己ベスト")} {best?.score.toLocaleString() || 0} · {t("勝者")}{" "}
            {g.winner.map((i) => g.names[i]).join(" / ")}
          </p>
        </article>
      )}
      <ExpeditionPanel g={g} world={world} selfId={selfId} t={t} send={send}/><div className="rpg-rhythm-selected">
        <img src={assetUrl("sprites/rpg/furniture/rhythm.webp")} alt="" />
        <div>
          <h4>{songTitle(song, t)}</h4>
          <p>
            {Math.ceil(song.duration)}s · {song.bpm} BPM · {notes.length}{" "}
            {t("ノーツ")}
          </p>
          <p>
            {t(
              error
                ? "楽曲を再生できませんでした。読み込み直して準備してください。"
                : loaded
                  ? "楽曲読み込み完了"
                  : "楽曲を読み込み中",
            )}
          </p>
        </div>
      </div>
      <div className="rpg-rhythm-options">
        <label>
          {t("難易度")}
          <select
            disabled={!leader}
            value={r.difficulty}
            onChange={(e) =>
              configure({ difficulty: e.target.value as RhythmDifficulty })
            }
          >
            <option value="easy">{t("かんたん")}</option>
            <option value="normal">{t("ふつう")}</option>
            <option value="expert">{t("むずかしい")}</option>
          </select>
        </label>
        <label>
          {t("曲の長さ")}
          <select
            disabled={!leader}
            value={r.length}
            onChange={(e) =>
              configure({ length: e.target.value as RhythmLength })
            }
          >
            <option value="full">{t("フル演奏")}</option>
            <option value="short">{t("90秒モード")}</option>
          </select>
        </label>
        <label>
          {t("ノーツ速度")}
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={speed}
            onChange={(e) => {
              const n = Number(e.target.value);
              setSpeed(n);
              try {
                localStorage.setItem("rpg-rhythm-speed-v1", String(n));
              } catch {}
            }}
          />
          <span>{speed}</span>
        </label>
        <label>
          {t("タイミング調整")}
          <input
            type="range"
            min={-200}
            max={200}
            step={5}
            value={offset}
            onChange={(e) => {
              const n = Number(e.target.value);
              setOffset(n);
              try {
                localStorage.setItem("rpg-rhythm-offset-v1", String(n));
              } catch {}
            }}
          />
          <span>{offset}ms</span>
        </label>
      </div>
      <div className="rpg-rhythm-actions">
        <button
          disabled={!loaded}
          onClick={async () => {
            if (preview) {
              audio.current?.pause();
              setPreview(false);
              previewUntil.current = 0;
              audioService.setBgmDuckMultiplier(1);
              return;
            }
            const a = audio.current;
            if (!a) return;
            audioService.setBgmDuckMultiplier(0);
            a.volume = audioService.getRhythmAudioState().volume;
            a.currentTime = 0;
            try {
              await a.play();
              setPreview(true);
              previewUntil.current = performance.now() + 20000;
            } catch {
              setError(true);
              audioService.setBgmDuckMultiplier(1);
            }
          }}
        >
          {t(preview ? "試聴を止める" : "楽曲を試聴")}
        </button>
        <button
          className="primary"
          disabled={!loaded || error || r.ready[seat]}
          onClick={async () => {
            if (await prime()) ready(true);
          }}
        >
          {t(r.ready[seat] ? "準備OK" : "準備する")}
        </button>
        <button
          className="primary"
          disabled={
            !leader || !canStartExpedition(g) || world.paused || !g.players.every((_, i) => r.ready[i])
          }
          onClick={() => send({ type: "game_start", key: g.key })}
        >
          {t(g.expedition?.settled&&!g.expedition.complete?"次の階層へ":g.phase === "finished" ? "もう一度遊ぶ" : "演奏を開始")}
        </button>
        {error && (
          <button onClick={() => setRetry((n) => n + 1)}>
            {t("読み込み直す")}
          </button>
        )}
        <button onClick={exit}>{t("退出")}</button>
      </div>
      {board}
      <details open={g.phase === "lobby"}>
        <summary>
          {t("楽曲を選ぶ")} · {filtered.length}/{RHYTHM_SONGS.length}
        </summary>
        <div className="rpg-rhythm-filters">
          <label>
            {t("曲を検索")}
            <input value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label>
            {t("編を選ぶ")}
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="all">{t("すべて")}</option>
              {[...new Set(RHYTHM_SONGS.map(songTheme))].map((v) => (
                <option key={v} value={v}>
                  {t(v)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("BGMの種類")}
            <select
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
            >
              <option value="all">{t("すべて")}</option>
              {["新BGM", "旧BGM"].map((v) => (
                <option key={v} value={v}>
                  {t(v)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rpg-rhythm-songs">
          {filtered.map((s) => {
            const rec = records[`${s.id}|${r.difficulty}|${r.length}`];
            return (
              <button
                key={s.id}
                disabled={!leader}
                aria-pressed={s.id === r.song}
                onClick={() => configure({ song: s.id })}
              >
                <strong>{songTitle(s, t)}</strong>
                <small>
                  {Math.ceil(s.duration)}s · {s.bpm} BPM{" "}
                  {rec
                    ? `· ${rhythmRank(rec.score)} ${rec.score.toLocaleString()} ${rec.fullCombo ? "FC" : ""}`
                    : ""}
                </small>
              </button>
            );
          })}
        </div>
      </details>
    </section>
  );
}
