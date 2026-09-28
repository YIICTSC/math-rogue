import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Compass,
  Users,
  Map,
  Crown,
  Copy,
  Check,
} from "lucide-react";
import type { LanguageMode, Player } from "../types";
import TranslatedUiTree from "../components/TranslatedUiTree";
import WorldCanvas from "./WorldCanvas";
import {
  addPlayer,
  createWorld,
  distance,
  HEIGHT,
  WIDTH,
  siteUnavailable,
  type World,
  type Adventurer,
  type Site,
  type BonusRankingKind,
} from "./engine";
import { getRpgSiteDisplayName } from "./enemyNames";
import { RpgRoom } from "./network";
import { nativeProfile, type RpgSnapshot } from "./bridge";
import { buildRpgInviteUrl, getRpgRoomCodeFromUrl } from "./invite";
import type { RpgAdventureSetup } from "./setup";
import "./rpg.css";

function nextStep(w: World, x: number, y: number, tx: number, ty: number) {
  if (tx < 1 || ty < 1 || tx >= WIDTH - 1 || ty >= HEIGHT - 1) return null;
  const start = y * WIDTH + x,
    end = ty * WIDTH + tx,
    queue = [start],
    previous = new Map([[start, -1]]);
  for (let i = 0; i < queue.length; i++) {
    const n = queue[i];
    if (n === end) break;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = (n % WIDTH) + dx,
        ny = Math.floor(n / WIDTH) + dy,
        k = ny * WIDTH + nx;
      if (
        nx < 1 ||
        ny < 1 ||
        nx >= WIDTH - 1 ||
        ny >= HEIGHT - 1 ||
        previous.has(k) ||
        ["forest", "water"].includes(w.tiles[k])
      )
        continue;
      previous.set(k, n);
      queue.push(k);
    }
  }
  if (!previous.has(end) || start === end) return null;
  let n = end;
  while (previous.get(n) !== start) n = previous.get(n)!;
  return { dx: (n % WIDTH) - x, dy: Math.floor(n / WIDTH) - y };
}

const BONUS_RANKING_LABELS: Record<
  BonusRankingKind,
  { title: string; score: (player: Adventurer) => number }
> = {
  BATTLES: {
    title: "戦闘勝利数ランキング",
    score: (player) => player.completedBattles || 0,
  },
  TREASURES: {
    title: "宝箱開封数ランキング",
    score: (player) => player.claimed?.length || 0,
  },
  STEPS: {
    title: "探索歩数ランキング",
    score: (player) => player.moveCount || 0,
  },
  INTERACTIONS: {
    title: "施設利用回数ランキング",
    score: (player) => player.interactionCount || 0,
  },
};

function rankingRows(
  members: Adventurer[],
  score: (player: Adventurer) => number,
) {
  return members
    .map((player) => ({ player, score: Math.max(0, Math.floor(score(player))) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.player.name.localeCompare(b.player.name, "ja"),
    )
    .slice(0, 5);
}

export default function RpgOnline({
  player,
  active,
  languageMode,
  sceneError,
  adventureSetup,
  autoJoinInvite = false,
  onRoom,
  onSnapshot,
  onSetup,
  onClose,
}: {
  player: Player;
  active: boolean;
  languageMode: LanguageMode;
  sceneError?: string;
  adventureSetup?: RpgAdventureSetup;
  autoJoinInvite?: boolean;
  onRoom: (room: RpgRoom) => void;
  onSnapshot: (snapshot: RpgSnapshot) => void;
  onSetup: (setup: RpgAdventureSetup) => void;
  onClose: () => void;
}) {
  const [world, setWorld] = useState<World | null>(null);
  const inviteCode = useMemo(
    () =>
      typeof window === "undefined"
        ? ""
        : getRpgRoomCodeFromUrl(window.location.href),
    [],
  );
  const [name, setName] = useState(inviteCode ? "" : "冒険者"),
    [code, setCode] = useState(inviteCode),
    [inviteCopied, setInviteCopied] = useState(false);
  const [inviteTheme, setInviteTheme] = useState<RpgAdventureSetup["visualTheme"]>(
    adventureSetup?.visualTheme || "elementary",
  );
  const previewTheme = autoJoinInvite
    ? inviteTheme
    : adventureSetup?.visualTheme || "elementary";
  const displaySiteName = (site: Site) => getRpgSiteDisplayName(site, previewTheme);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [overview, setOverview] = useState(false);
  const room = useRef<RpgRoom | null>(null),
    latest = useRef({ world, active });
  const destination = useRef<{ x: number; y: number } | null>(null);
  latest.current = { world, active };
  const preview = useMemo(() => {
    const w = createWorld(9252026, {
      visualTheme: previewTheme,
      mode: "MULTIPLICATION",
      answerMode: "CHOICE",
      difficultyLevel: 1,
    });
    addPlayer(w, "preview", "あなた");
    return w;
  }, [previewTheme]);
  const selfId = room.current?.selfId || "",
    me = world?.players[selfId];
  const roomCode = room.current?.code || "";
  const inviteUrl = useMemo(
    () =>
      roomCode && typeof window !== "undefined"
        ? buildRpgInviteUrl(window.location.href, roomCode)
        : "",
    [roomCode],
  );
  const members: Adventurer[] = world ? Object.values(world.players) : [];
  const bonusRanking =
    BONUS_RANKING_LABELS[world?.bonusRankingKind || "BATTLES"];
  const rankingDefinitions = [
    {
      title: "総ダメージ数ランキング",
      score: (member: Adventurer) => member.totalDamage || 0,
    },
    {
      title: "総問題正解数ランキング",
      score: (member: Adventurer) => member.correctAnswers || 0,
    },
    bonusRanking,
  ];
  const near =
    world && me
      ? world.sites
          .filter((s) => distance(s, me) <= 2)
          .sort((a, b) => distance(a, me) - distance(b, me))[0]
      : undefined;
  useEffect(() => () => room.current?.close(), []);
  const profileJson = JSON.stringify(nativeProfile(player));
  useEffect(() => {
    if (
      active &&
      me &&
      !me.nativeScene &&
      JSON.stringify(me.profile) !== profileJson
    )
      room.current?.send({
        type: "native-profile",
        profile: JSON.parse(profileJson),
      });
  }, [active, selfId, !!me, !!me?.nativeScene, profileJson]);
  const start = async (mode: "practice" | "create" | "join" | "invite") => {
    setBusy(true);
    setError("");
    room.current?.close();
    const r = new RpgRoom((w) => {
      setWorld(w);
      if (w.setup) onSetup(w.setup);
      onSnapshot({ world: w, selfId: r.selfId });
    }, setError);
    room.current = r;
    onRoom(r);
    try {
      if (mode === "practice") r.practice(name, adventureSetup);
      else if (mode === "create") await r.create(name, adventureSetup);
      else if (mode === "invite")
        await r.prepareInviteJoin(code, name, (setup) =>
          onSetup({ ...setup, visualTheme: inviteTheme }),
        );
      else await r.join(code, name);
    } catch (e) {
      r.close();
      if (room.current === r) room.current = null;
      setWorld(null);
      setError(e instanceof Error ? e.message : "接続できませんでした。");
    } finally {
      setBusy(false);
    }
  };
  const copyInviteUrl = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const input = document.createElement("textarea");
        input.value = inviteUrl;
        input.setAttribute("readonly", "true");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        try {
          if (!document.execCommand("copy")) throw new Error("copy failed");
        } finally {
          input.remove();
        }
      }
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 2200);
    } catch {
      setError(
        "招待URLをコピーできませんでした。URLを選択してコピーしてください。",
      );
    }
  }, [inviteUrl]);
  const interact = useCallback(() => {
    const w = latest.current.world,
      p = w?.players[room.current?.selfId || ""];
    if (!w || !p || !latest.current.active || p.nativeScene) return;
    const site = w.sites
      .filter((s) => distance(s, p) <= 2)
      .sort((a, b) => distance(a, p) - distance(b, p))[0];
    if (site) {
      destination.current = null;
      room.current?.send({ type: "native-enter", siteId: site.id });
    }
  }, []);
  useEffect(() => {
    if (!active) destination.current = null;
    const key = (e: KeyboardEvent) => {
      if (
        !latest.current.active ||
        (e.target as HTMLElement).closest("input,textarea,select")
      )
        return;
      const dirs: Record<string, number[]> = {
        ArrowUp: [0, -1],
        w: [0, -1],
        ArrowDown: [0, 1],
        s: [0, 1],
        ArrowLeft: [-1, 0],
        a: [-1, 0],
        ArrowRight: [1, 0],
        d: [1, 0],
      };
      const dir = dirs[e.key];
      if (dir) {
        e.preventDefault();
        destination.current = null;
        room.current?.send({ type: "move", dx: dir[0], dy: dir[1] });
      }
      if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        interact();
      }
    };
    window.addEventListener("keydown", key);
    const timer = window.setInterval(() => {
      const w = latest.current.world,
        p = w?.players[room.current?.selfId || ""],
        target = destination.current;
      if (!latest.current.active || !w || !p || p.nativeScene || !target)
        return;
      const step = nextStep(w, p.x, p.y, target.x, target.y);
      if (step) room.current?.send({ type: "move", ...step });
      else destination.current = null;
    }, 160);
    return () => {
      window.removeEventListener("keydown", key);
      clearInterval(timer);
    };
  }, [active, interact]);
  const close = () => {
    room.current?.close();
    onClose();
  };
  return (
    <TranslatedUiTree mode={languageMode}>
      <main className="rpg-root" data-testid="rpg-native-map">
        <header className="rpg-header">
          <button className="rpg-brand" onClick={close}>
            <Compass />
            学習ローグ <em className="rpg-dev-badge">開発中</em>
            <b>RPG ONLINE</b>
          </button>
          <span>
            {world ? `${Object.keys(world.players).length} / 40` : ""}
          </span>
          <button className="rpg-subtle" onClick={close}>
            学習ローグへ
          </button>
        </header>
        {!world || !me ? (
          <div className="rpg-lobby">
            <div className="rpg-lobby-art">
              <WorldCanvas
                world={preview}
                selfId="preview"
                onTile={() => {}}
                overview
                languageMode={languageMode}
                visualTheme={previewTheme}
              />
            </div>
            <section className="rpg-lobby-form">
              <h1>{autoJoinInvite ? "招待に参加する" : "冒険をはじめる"}</h1>
              <p>
                {autoJoinInvite
                  ? "参加名を入力してから、主人公を選んで冒険に加わります。"
                  : "選択した主人公・問題・難易度で探索します。"}
              </p>
              <label>
                {autoJoinInvite ? "参加名" : "冒険者の名前"}
                <input
                  value={name}
                  maxLength={16}
                  autoComplete="nickname"
                  placeholder={autoJoinInvite ? "参加者名を入力" : undefined}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              {autoJoinInvite ? (
                <>
                  <label>
                    開始する編
                    <select
                      value={inviteTheme}
                      onChange={(e) =>
                        setInviteTheme(e.target.value as RpgAdventureSetup["visualTheme"])
                      }
                    >
                      <option value="elementary">小学生編</option>
                      <option value="high-school">高校編</option>
                      <option value="magic">マジック編</option>
                    </select>
                  </label>
                  <p className="rpg-invite-hint" role="status">
                    {busy
                      ? "招待された部屋へ接続しています…"
                      : "参加名を決めて主人公選択へ進んでください。"}
                  </p>
                  <button
                    className="rpg-join-button"
                    disabled={busy || !name.trim() || code.length !== 6}
                    onClick={() => start("invite")}
                  >
                    名前を決めて主人公選択へ
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="rpg-primary"
                    disabled={busy || !name.trim()}
                    onClick={() => start("create")}
                  >
                    部屋を作る
                  </button>
                  <label>
                    招待コード（6文字）
                    <input
                      value={code}
                      maxLength={6}
                      placeholder="ABC123"
                      autoComplete="off"
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                    />
                  </label>
                  {inviteCode && (
                    <p className="rpg-invite-hint" role="status">
                      招待URLからルームコードを読み込みました。
                    </p>
                  )}
                  {!code && (
                    <p className="rpg-join-hint">
                      6文字のコードを入力すると入室できます。
                    </p>
                  )}
                  <button
                    className="rpg-join-button"
                    disabled={busy || !name.trim() || code.length !== 6}
                    onClick={() => start("join")}
                  >
                    招待コードを入力して入室する
                  </button>
                  <button
                    className="rpg-practice"
                    disabled={busy || !name.trim()}
                    onClick={() => start("practice")}
                  >
                    まずはひとりで練習する
                  </button>
                </>
              )}
              <small>
                最大40人・チームは最大4人。オンラインでは部屋を作った人の画面を開いたままにしてください。
              </small>
            </section>
          </div>
        ) : (
          <>
            <div className="rpg-game-grid">
              <section className="rpg-exploration">
                <div className="rpg-map-title">
                  <h1>木漏れ日のフロンティア</h1>
                  <span>戦闘勝利 {me.completedBattles || 0}</span>
                </div>
                <div className="rpg-map-container">
                  {active && (
                    <WorldCanvas
                      world={world}
                      selfId={selfId}
                      overview={overview}
                      languageMode={languageMode}
                      visualTheme={previewTheme}
                      onTile={(x, y) => {
                        destination.current = { x, y };
                      }}
                    />
                  )}
                  <div className="rpg-map-tools">
                    <button onClick={() => setOverview(!overview)}>
                      <Map size={16} />
                      {overview ? "自分の近く" : "全体マップ"}
                    </button>
                    <span>SEED {world.seed.toString(16).toUpperCase()}</span>
                  </div>
                  <div className="rpg-map-bottom">
                    <div className="rpg-dpad">
                      <button
                        aria-label="上へ移動"
                        onClick={() =>
                          room.current?.send({ type: "move", dx: 0, dy: -1 })
                        }
                      >
                        <ArrowUp />
                      </button>
                      <div>
                        <button
                          aria-label="左へ移動"
                          onClick={() =>
                            room.current?.send({ type: "move", dx: -1, dy: 0 })
                          }
                        >
                          <ArrowLeft />
                        </button>
                        <button
                          aria-label="下へ移動"
                          onClick={() =>
                            room.current?.send({ type: "move", dx: 0, dy: 1 })
                          }
                        >
                          <ArrowDown />
                        </button>
                        <button
                          aria-label="右へ移動"
                          onClick={() =>
                            room.current?.send({ type: "move", dx: 1, dy: 0 })
                          }
                        >
                          <ArrowRight />
                        </button>
                      </div>
                    </div>
                    {near && (
                      <button className="rpg-interact" onClick={interact}>
                        <span>
                          {displaySiteName(near)}
                          <small>
                            {siteUnavailable(world, me, near) || "E 調べる"}
                          </small>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="rpg-map-caption">
                  WASD / 矢印キーで移動 · E 調べる · マップをタップして移動
                </div>
              </section>
              <aside className="rpg-sidebar">
                <section className="rpg-objective">
                  <h2>
                    <Crown />
                    校長の時計塔へ
                  </h2>
                  <p>3つの結界を解き、みんなで校長に挑もう。</p>
                  {world.sites
                    .filter((s) => s.kind === "guardian" || s.kind === "boss")
                    .map((s) => (
                      <p key={s.id}>
                        {s.name}：
                        {s.cleared
                          ? "討伐済み"
                          : s.nativeInitialized
                            ? `${s.hp} / ${s.maxHp}`
                            : "未挑戦"}
                      </p>
                    ))}
                </section>
                <section className="rpg-player-panel">
                  <h2>{me.name}</h2>
                  <p>
                    HP {player.currentHp} / {player.maxHp}
                  </p>
                  <p>
                    コイン {player.gold} · デッキ {player.deck.length}
                  </p>
                  <p>
                    町・休憩所・？イベントは、各場所で戦闘3勝につき1回利用できます。
                  </p>
                  <p>宝箱は各プレイヤーにつき1回です。</p>
                </section>
                <section className="rpg-player-panel">
                  <h2>
                    <Users />
                    チーム
                  </h2>
                  <button
                    className={`rpg-team-action ${
                      me.team
                        ? "rpg-team-action--leave"
                        : "rpg-team-action--publish"
                    }`}
                    onClick={() =>
                      room.current?.send({
                        type: "team",
                        target: me.team ? null : selfId,
                      })
                    }
                  >
                    {me.team ? "チームを離れる" : "チームを公開する"}
                  </button>
                  <p>近くのチームメンバー1人につき、戦闘開始時の攻撃力+2。</p>
                  <div className="rpg-team-member-list">
                    {members
                      .filter((p) => p.id !== selfId)
                      .map((p) => (
                        <div className="rpg-team-member-row" key={p.id}>
                          <span>
                            {p.name}
                            {p.nativeScene ? " · 探索中" : ""}
                          </span>
                          {p.team && p.team !== me.team && (
                            <button
                              className="rpg-team-join-button"
                              onClick={() =>
                                room.current?.send({ type: "team", target: p.id })
                              }
                            >
                              参加
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </section>
              </aside>
            </div>
            <footer className="rpg-footer">
              <p role="status">{me.message}</p>
              {roomCode ? (
                <div className="rpg-room-invite">
                  <span>ROOM {roomCode}</span>
                  <button
                    className="rpg-invite-button"
                    onClick={copyInviteUrl}
                    title="招待URLをコピー"
                  >
                    {inviteCopied ? <Check size={14} /> : <Copy size={14} />}
                    {inviteCopied ? "コピーしました" : "招待URLをコピー"}
                  </button>
                </div>
              ) : (
                <span>ひとり練習 · 通信なし</span>
              )}
            </footer>
            {world.won && !me.nativeScene && (
              <div className="rpg-overlay">
                <section className="rpg-dialog rpg-clear-dialog">
                  <h1>校長を倒しました！</h1>
                  <p>みんなの冒険は大成功！</p>
                  <div className="rpg-ranking-grid">
                    {rankingDefinitions.map((ranking) => (
                      <section className="rpg-ranking-card" key={ranking.title}>
                        <h2>{ranking.title}</h2>
                        <ol>
                          {rankingRows(members, ranking.score).map(
                            ({ player: rankedPlayer, score }, index) => (
                              <li key={rankedPlayer.id}>
                                <span className="rpg-ranking-rank">{index + 1}</span>
                                <span className="rpg-ranking-name">
                                  {rankedPlayer.name}
                                </span>
                                <strong>{score}</strong>
                              </li>
                            ),
                          )}
                        </ol>
                      </section>
                    ))}
                  </div>
                  <button onClick={close}>学習ローグへ</button>
                </section>
              </div>
            )}
          </>
        )}
        {(error || sceneError) && (
          <div className="rpg-connection-error" role="alert">
            {error || sceneError}
            <button onClick={close}>学習ローグへ</button>
          </div>
        )}
      </main>
    </TranslatedUiTree>
  );
}
