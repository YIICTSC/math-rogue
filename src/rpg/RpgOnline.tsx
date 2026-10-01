import { findWalkingRoute } from "./walking";
import ActivitiesPanel from "./ActivitiesPanel";
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
import type { GameMode } from "../types";
import TranslatedUiTree from "../components/TranslatedUiTree";
import GoHomeDash from "../components/GoHomeDash";
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
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
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
  const [gameMode,setGameMode]=useState<World["gameMode"]>("COOP");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [clockNow, setClockNow] = useState(() => Date.now());
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
  const walkingRoute = useRef<Array<{x:number;y:number}>>([]);
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
  const remainingSeconds = world
    ? Math.max(0, Math.ceil((world.deadlineAt - clockNow) / 1000))
    : null;
  const bonusRanking =
    BONUS_RANKING_LABELS[world?.bonusRankingKind || "BATTLES"];
  const rankingDefinitions = [
    {
      title: world?.gameMode === "BATTLE_ROYALE" ? "倒した数ランキング" : "総ダメージ数ランキング",
      score: (member: Adventurer) => world?.gameMode === "BATTLE_ROYALE" ? member.rivalKills || 0 : member.totalDamage || 0,
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
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const profileJson = JSON.stringify({...nativeProfile(player),visualTheme:previewTheme});
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
      if (mode === "practice") r.practice(name, adventureSetup, timeLimitMinutes,gameMode);
      else if (mode === "create") await r.create(name, adventureSetup, timeLimitMinutes,gameMode);
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
      room.current?.send(site.kind === "dungeon" ? { type: "dungeon-join", siteId: site.id } : ["fragment", "secret", "seal"].includes(site.kind) ? { type: "secret-search", siteId: site.id } : { type: "native-enter", siteId: site.id });
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
      while(walkingRoute.current[0]?.x===p.x && walkingRoute.current[0]?.y===p.y)walkingRoute.current.shift();
      const step=walkingRoute.current[0];
      if(step && distance(p,step)===1)room.current?.send({type:"move",dx:step.x-p.x,dy:step.y-p.y});
      else destination.current=null;
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
                  <label>ゲームモード<select value={gameMode} onChange={e=>setGameMode(e.target.value as World["gameMode"])}><option value="COOP">協力</option><option value="BATTLE_ROYALE">バトルロイヤル</option></select></label>
                  <label>
                    制限時間
                    <input
                      type="number"
                      min={1}
                      max={180}
                      step={1}
                      value={timeLimitMinutes}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setTimeLimitMinutes(Number.isFinite(next) ? Math.max(1, Math.min(180, Math.floor(next))) : 30);
                      }}
                    />
                  </label>
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
        ) : !world.started ? (
          <main className="rpg-waiting-lobby">
            <section className="rpg-waiting-panel">
              <div className="rpg-waiting-heading">
                <div>
                  <h1>冒険者集合中</h1>
                  <p>ホストが開始すると、全員でワールドへ移動します。</p>
                </div>
                <strong>{members.length} / 40</strong>
              </div>
              <div className="rpg-waiting-roster" aria-label="部屋の参加者">
                <h2>参加者</h2>
                <ul>
                  {members.map((member) => (
                    <li key={member.id}>
                      <span className="rpg-waiting-dot" style={{ background: `hsl(${member.color * 60}, 58%, 63%)` }} />
                      <span>{member.name}</span>
                      {member.id === Object.keys(world.players)[0] && <small>ホスト</small>}
                      {member.id === selfId && <small>あなた</small>}
                    </li>
                  ))}
                  {members.length < 2 && <li className="rpg-waiting-empty">仲間が参加するのを待っています…</li>}
                </ul>
              </div>
              {roomCode && (
                <div className="rpg-waiting-invite">
                  <span>ROOM {roomCode}</span>
                  <button className="rpg-invite-button" onClick={copyInviteUrl}>
                    {inviteCopied ? <Check size={14} /> : <Copy size={14} />}
                    {inviteCopied ? "コピーしました" : "招待URLをコピー"}
                  </button>
                </div>
              )}
              {room.current?.host ? (
                <div className="rpg-waiting-start-area">
                  <button
                    className="rpg-primary rpg-start-adventure"
                    disabled={busy || members.length < 2}
                    onClick={() => room.current?.send({ type: "rpg-start" })}
                  >
                    ゲーム開始
                  </button>
                  <p>{members.length < 2 ? "参加者が2人以上集まると開始できます。" : "全員の準備ができたら開始してください。"}</p>
                </div>
              ) : (
                <p className="rpg-waiting-host-message">ホストの開始を待っています。</p>
              )}
            </section>
            <section className="rpg-waiting-mini-game">
              <div className="rpg-waiting-mini-heading">
                <div>
                  <h2>待っている間に遊ぼう</h2>
                  <p>帰宅ダッシュ一発アウト · HP 1</p>
                </div>
                <span>開始前は何度でもリトライできます</span>
              </div>
              <div className="rpg-waiting-mini-frame">
                <GoHomeDash
                  onBack={() => {}}
                  problemMode={(adventureSetup?.mode || "MIXED") as GameMode}
                  problemModePool={adventureSetup?.modePool}
                  answerMode={adventureSetup?.answerMode}
                  assignment={adventureSetup?.assignment}
                  languageMode={languageMode}
                  initialHp={1}
                  initialMaxHp={1}
                  compact
                  exitEnabled={false}
                />
              </div>
            </section>
          </main>
        ) : (
          <>
            <div className="rpg-game-grid">
              <section className="rpg-exploration">
                <div className="rpg-map-title">
                  <h1>木漏れ日のフロンティア</h1><span>{world.gameMode === "BATTLE_ROYALE" ? "バトルロイヤル" : "協力"}</span>
                  <span>
                    戦闘勝利 {me.completedBattles || 0}
                    {remainingSeconds !== null && (
                      <strong className="rpg-time-limit" aria-label="制限時間">
                        {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}
                      </strong>
                    )}
                  </span>
                </div>
                <div className="rpg-map-container">
                  {active && (
                    <WorldCanvas
                      world={world}
                      selfId={selfId}
                      overview={overview}
                      languageMode={languageMode}
                      visualTheme={previewTheme}
                      onPlayer={setSelectedPeer}
                      onTile={(x, y) => {
                        const route=findWalkingRoute(world,me.x,me.y,x,y);
                        walkingRoute.current=route;
                        destination.current=route.at(-1)||null;
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
                          (destination.current = null, room.current?.send({ type: "move", dx: 0, dy: -1 }))
                        }
                      >
                        <ArrowUp />
                      </button>
                      <div>
                        <button
                          aria-label="左へ移動"
                          onClick={() =>
                            (destination.current = null, room.current?.send({ type: "move", dx: -1, dy: 0 }))
                          }
                        >
                          <ArrowLeft />
                        </button>
                        <button
                          aria-label="下へ移動"
                          onClick={() =>
                            (destination.current = null, room.current?.send({ type: "move", dx: 0, dy: 1 }))
                          }
                        >
                          <ArrowDown />
                        </button>
                        <button
                          aria-label="右へ移動"
                          onClick={() =>
                            (destination.current = null, room.current?.send({ type: "move", dx: 1, dy: 0 }))
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
                <ActivitiesPanel languageMode={languageMode} world={world} selfId={selfId} selectedPeer={selectedPeer} send={action => { destination.current = null; room.current?.send(action); }} />
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
            {world.ended && !me.nativeScene && (
              <div className="rpg-overlay">
                <section className="rpg-dialog rpg-clear-dialog">
                  <h1>{world.endReason === "timeout" ? "時間切れ！" : "校長を倒しました！"}</h1>
                  <p>{world.endReason === "timeout" ? "制限時間が終了しました。" : "みんなの冒険は大成功！"}</p>
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
