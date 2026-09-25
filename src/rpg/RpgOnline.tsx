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
  BookOpen,
  Check,
  Compass,
  Copy,
  Crown,
  Flame,
  Heart,
  HelpCircle,
  Map,
  Shield,
  Sparkles,
  Swords,
  Users,
  X,
  Coins,
  Wifi,
  Tent,
  Flag,
} from "lucide-react";
import {
  addPlayer,
  card,
  CARD_KEYS,
  createWorld,
  distance,
  WIDTH,
  HEIGHT,
  type Action,
  type Site,
  type World,
  type Adventurer,
} from "./engine";
import { RpgRoom } from "./network";
import WorldCanvas from "./WorldCanvas";
import { getCardIllustrationPaths } from '../utils/cardIllustration';
import { getEnemyIllustrationPaths } from '../utils/enemyIllustration';
import "./rpg.css";
import TranslatedUiTree from "../components/TranslatedUiTree";
import type { LanguageMode } from "../types";

const kindNames = {
  town: "町",
  rest: "休憩所",
  event: "イベント",
  treasure: "宝箱",
  enemy: "カード戦闘",
  guardian: "結界の試験官",
  boss: "みんなの最終目標",
};
// Local pathfinding only proposes single-step moves; the host still validates each step.
function nextStep(w: World, x: number, y: number, tx: number, ty: number) {
  if (tx < 1 || ty < 1 || tx >= WIDTH - 1 || ty >= HEIGHT - 1) return null;
  const start = y * WIDTH + x,
    end = ty * WIDTH + tx,
    queue = [start],
    prev = new Map<number, number>();
  prev.set(start, -1);
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
        prev.has(k) ||
        ["water", "forest"].includes(w.tiles[k])
      )
        continue;
      prev.set(k, n);
      queue.push(k);
    }
  }
  if (!prev.has(end) || start === end) return null;
  let n = end;
  while (prev.get(n) !== start) n = prev.get(n)!;
  return { dx: (n % WIDTH) - x, dy: Math.floor(n / WIDTH) - y };
}
export default function RpgOnline({
  onClose,
  languageMode = "JAPANESE",
}: {
  onClose: () => void;
  languageMode?: LanguageMode;
}) {
  const [world, setWorld] = useState<World | null>(null),
    [name, setName] = useState("冒険者"),
    [code, setCode] = useState(""),
    [subject, setSubject] = useState<World["subject"]>("math");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [panel, setPanel] = useState<"team" | "deck" | "help" | null>(null),
    [town, setTown] = useState<Site | null>(null),
    [overview, setOverview] = useState(false),
    [copied, setCopied] = useState(false);
  const room = useRef<RpgRoom | null>(null),
    state = useRef<World | null>(null),
    destination = useRef<{ x: number; y: number } | null>(null);
  state.current = world;
  const preview = useMemo(() => {
    const w = createWorld(9252026);
    addPlayer(w, "preview", "あなた");
    return w;
  }, []);
  const selfId = room.current?.selfId || "",
    me = world?.players[selfId],
    boss = world?.sites.find((s) => s.kind === "boss");
  const send = useCallback((a: Action) => room.current?.send(a), []);
  const exit = () => {
    room.current?.close();
    room.current = null;
    setWorld(null);
    setError("");
    setTown(null);
    setPanel(null);
    destination.current = null;
  };
  useEffect(() => () => room.current?.close(), []);
  const start = async (mode: "practice" | "create" | "join") => {
    setBusy(true);
    setError("");
    room.current?.close();
    const r = new RpgRoom(setWorld, setError);
    room.current = r;
    try {
      if (mode === "practice") r.practice(name, subject);
      else if (mode === "create") await r.create(name, subject);
      else await r.join(code, name);
    } catch (e) {
      r.close();
      setWorld(null);
      setError(e instanceof Error ? e.message : "接続できませんでした。");
    } finally {
      setBusy(false);
    }
  };
  const interact = useCallback(() => {
    const w = state.current,
      p = w?.players[room.current?.selfId || ""];
    if (!w || !p || p.battle) return;
    const near = w.sites
      .filter((s) => distance(s, p) <= 2)
      .sort((a, b) => distance(a, p) - distance(b, p))[0];
    if (!near) return;
    destination.current = null;
    if (near.kind === "town" || near.kind === "rest") setTown(near);
    else send({ type: "interact", siteId: near.id });
  }, [send]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest("input,select,textarea") ||
        !state.current ||
        panel ||
        town
      )
        return;
      const directions: Record<string, number[]> = {
        ArrowUp: [0, -1],
        w: [0, -1],
        ArrowDown: [0, 1],
        s: [0, 1],
        ArrowLeft: [-1, 0],
        a: [-1, 0],
        ArrowRight: [1, 0],
        d: [1, 0],
      };
      if (directions[e.key]) {
        e.preventDefault();
        destination.current = null;
        const [dx, dy] = directions[e.key];
        send({ type: "move", dx, dy });
      }
      if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        interact();
      }
    };
    window.addEventListener("keydown", key);
    const interval = setInterval(() => {
      const w = state.current,
        p = w?.players[room.current?.selfId || ""],
        target = destination.current;
      if (!w || !p || !target || p.battle || town || panel) return;
      const step = nextStep(w, p.x, p.y, target.x, target.y);
      if (step) send({ type: "move", ...step });
      else destination.current = null;
    }, 160);
    return () => {
      window.removeEventListener("keydown", key);
      clearInterval(interval);
    };
  }, [send, interact, panel, town]);
  const near =
    world && me
      ? world.sites
          .filter((s) => distance(s, me) <= 2)
          .sort((a, b) => distance(a, me) - distance(b, me))[0]
      : null;
  const battle = me?.battle,
    enemy = world?.sites.find((s) => s.id === battle?.siteId);
  const members: Adventurer[] = world ? Object.values(world.players) : [];
  const party = me?.team ? members.filter((p) => p.team === me.team) : [];
  const remaining =
    world?.sites.filter((s) => s.kind === "guardian" && !s.cleared).length || 0;
  const modal = (
    title: string,
    content: React.ReactNode,
    close: () => void,
  ) => (
    <TranslatedUiTree mode={languageMode}>
      <div className="rpg-overlay">
        <section
          className="rpg-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <header>
            <h2>{title}</h2>
            <button className="rpg-icon" aria-label="閉じる" onClick={close}>
              <X size={20} />
            </button>
          </header>
          {content}
        </section>
      </div>
    </TranslatedUiTree>
  );
  return (
    <TranslatedUiTree mode={languageMode}>
      <main className="rpg-root">
        <header className="rpg-header">
          <button
            className="rpg-brand"
            onClick={() => {
              room.current?.close();
              onClose();
            }}
            title="学習ローグへ戻る"
          >
            <span className="rpg-brand-icon">
              <Compass size={25} />
            </span>
            <span>
              学習ローグ <em className="rpg-dev-badge">開発中</em><b>RPG ONLINE</b>
            </span>
          </button>
          <div className="rpg-header-right">
            {world ? (
              <>
                <span className="rpg-live">
                  <i />
                  {room.current?.code ? "オンライン" : "ひとりで練習"}
                </span>
                <span className="rpg-count">
                  <Users size={15} />
                  {Object.keys(world.players).length} / 40
                </span>
                <button
                  className="rpg-icon"
                  onClick={() => setPanel("help")}
                  aria-label="遊び方"
                >
                  <HelpCircle size={19} />
                </button>
                <button
                  className="rpg-icon"
                  onClick={exit}
                  aria-label="部屋を退出"
                >
                  <X size={19} />
                </button>
              </>
            ) : (
              <button className="rpg-subtle" onClick={onClose}>
                <ArrowLeft size={15} />
                学習ローグへ
              </button>
            )}
          </div>
        </header>
        {!world || !me ? (
          <div className="rpg-lobby">
            <div className="rpg-lobby-art">
              <WorldCanvas
                languageMode={languageMode}
                world={preview}
                selfId="preview"
                onTile={() => {}}
                overview
              />
              <div className="rpg-lobby-shade" />
              <div className="rpg-lobby-story">
                <span className="rpg-eyebrow">ひとつの世界、40人の冒険。</span>
                <h1>
                  学びを力に。
                  <br />
                  仲間と、まだ見ぬ先へ。
                </h1>
                <p>
                  木漏れ日の町から、校長の時計塔へ。
                  <br />
                  自分のペースで探索し、ときには仲間と肩を並べよう。
                </p>
                <div className="rpg-feature-row">
                  <span>
                    <Map size={16} />
                    毎回変わる世界
                  </span>
                  <span>
                    <BookOpen size={16} />
                    学び × カード
                  </span>
                  <span>
                    <Users size={16} />
                    自由なチーム編成
                  </span>
                </div>
              </div>
            </div>
            <section className="rpg-lobby-form">
              <span className="rpg-eyebrow">NEW ADVENTURE</span>
              <h2>冒険の支度</h2>
              <p>名前を決めて、同じ世界に集まろう。</p>
              <label>
                冒険者の名前
                <input
                  maxLength={16}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ニックネーム"
                />
              </label>
              <label>
                学習テーマ（部屋を作る人が選択）
                <select
                  value={subject}
                  onChange={(e) =>
                    setSubject(e.target.value as World["subject"])
                  }
                >
                  <option value="math">算数 · たし算とかけ算</option>
                  <option value="science">理科 · 小学5年生</option>
                </select>
              </label>
              <button
                className="rpg-primary"
                disabled={busy || !name.trim()}
                onClick={() => start("create")}
              >
                <Flag size={17} />
                {busy ? "接続中…" : "オンラインの部屋を作る"}
                <ArrowRight size={17} />
              </button>
              <div className="rpg-divider">招待コードを持っている</div>
              <div className="rpg-join">
                <input
                  aria-label="ルームコード"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="6文字のコード"
                />
                <button
                  disabled={busy || code.length !== 6 || !name.trim()}
                  onClick={() => start("join")}
                >
                  参加
                </button>
              </div>
              <button
                className="rpg-practice"
                disabled={busy || !name.trim()}
                onClick={() => start("practice")}
              >
                まずはひとりで練習する <ArrowRight size={15} />
              </button>
              {error && (
                <p className="rpg-error" role="alert">
                  {error}
                </p>
              )}
              <small>
                最大40人・チームは最大4人。
                <br />
                オンラインでは部屋を作った人の画面を開いたままにしてください。
              </small>
            </section>
          </div>
        ) : (
          <>
            <div className="rpg-game-grid">
              <section className="rpg-exploration">
                <div className="rpg-map-title">
                  <div>
                    <span className="rpg-eyebrow">THE VERDANT FRONTIER</span>
                    <h1>
                      {near?.kind === "town"
                        ? near.name
                        : "木漏れ日のフロンティア"}
                    </h1>
                  </div>
                  <span className="rpg-map-tag">
                    探索 {me.claimed.length} か所
                  </span>
                </div>
                <div className="rpg-map-container">
                  <WorldCanvas
                    languageMode={languageMode}
                    world={world}
                    selfId={selfId}
                    overview={overview}
                    onTile={(x, y) => {
                      destination.current = { x, y };
                    }}
                  />
                  <div className="rpg-map-tools">
                    <button onClick={() => setOverview(!overview)}>
                      <Map size={16} />
                      {overview ? "自分の近く" : "全体マップ"}
                    </button>
                    <span>SEED {world.seed.toString(16).toUpperCase()}</span>
                  </div>
                  <div className="rpg-area-card">
                    <span className="rpg-live">
                      <i /> {me.battle ? "戦闘中" : "自由探索"}
                    </span>
                    <small>道をたどって、新しい場所へ。</small>
                  </div>
                  <div className="rpg-map-bottom">
                    <div className="rpg-dpad">
                      <button
                        aria-label="上へ移動"
                        onClick={() => send({ type: "move", dx: 0, dy: -1 })}
                      >
                        <ArrowUp size={18} />
                      </button>
                      <div>
                        <button
                          aria-label="左へ移動"
                          onClick={() => send({ type: "move", dx: -1, dy: 0 })}
                        >
                          <ArrowLeft size={18} />
                        </button>
                        <button
                          aria-label="下へ移動"
                          onClick={() => send({ type: "move", dx: 0, dy: 1 })}
                        >
                          <ArrowDown size={18} />
                        </button>
                        <button
                          aria-label="右へ移動"
                          onClick={() => send({ type: "move", dx: 1, dy: 0 })}
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                    {near && !battle && (
                      <button className="rpg-interact" onClick={interact}>
                        <span>
                          <small>{kindNames[near.kind]}</small>
                          {near.name}
                          {near.cleared ? " · 討伐済み" : ""}
                        </span>
                        <b>E 調べる</b>
                      </button>
                    )}
                  </div>
                </div>
                <div className="rpg-map-caption">
                  <span>
                    <kbd>W A S D</kbd> / 矢印キーで移動
                  </span>
                  <span>
                    <kbd>E</kbd> 調べる
                  </span>
                  <span>マップをタップして移動</span>
                </div>
              </section>
              <aside className="rpg-sidebar">
                <section className="rpg-objective">
                  <span className="rpg-eyebrow">
                    <Crown size={14} /> WORLD QUEST
                  </span>
                  <h2>校長の時計塔へ</h2>
                  <p>3つの結界を解き、みんなで校長に挑もう。</p>
                  <div className="rpg-seals">
                    {world.sites
                      .filter((s) => s.kind === "guardian")
                      .map((s, i) => (
                        <span
                          key={s.id}
                          className={s.cleared ? "done" : ""}
                          title={s.name}
                        >
                          {s.cleared ? (
                            <Check size={16} />
                          ) : (
                            <Shield size={16} />
                          )}
                          第{i + 1}結界
                        </span>
                      ))}
                  </div>
                  <div className="rpg-meter-label">
                    <span>
                      {remaining
                        ? `あと${remaining}つの結界`
                        : "結界解除 · 校長に挑める！"}
                    </span>
                    <b>
                      {boss?.hp} / {boss?.maxHp}
                    </b>
                  </div>
                  <div className="rpg-meter boss">
                    <i
                      style={{
                        width: `${(100 * (boss?.hp || 0)) / (boss?.maxHp || 1)}%`,
                      }}
                    />
                  </div>
                </section>
                <section className="rpg-player-panel">
                  <div className="rpg-player-heading">
                    <div className={`rpg-avatar color-${me.color}`}>✦</div>
                    <div>
                      <small>YOUR ADVENTURER</small>
                      <h2>{me.name}</h2>
                    </div>
                    <b>Lv.{me.level}</b>
                  </div>
                  <div className="rpg-meter-label">
                    <span>
                      <Heart size={13} /> HP
                    </span>
                    <b>
                      {me.hp} / {me.maxHp}
                    </b>
                  </div>
                  <div className="rpg-meter">
                    <i style={{ width: `${(100 * me.hp) / me.maxHp}%` }} />
                  </div>
                  <div className="rpg-stat-row">
                    <span>
                      <Coins size={15} />
                      {me.gold}
                      <small>コイン</small>
                    </span>
                    <span>
                      <BookOpen size={15} />
                      {me.correct}
                      <small>正解</small>
                    </span>
                  </div>
                  <button
                    className="rpg-outline"
                    onClick={() => setPanel("deck")}
                  >
                    <BookOpen size={16} />
                    デッキを見る <span>{me.deck.length}枚</span>
                  </button>
                </section>
                <section className="rpg-party">
                  <div className="rpg-section-heading">
                    <h2>
                      <Users size={17} />
                      チーム
                    </h2>
                    <button onClick={() => setPanel("team")}>
                      編成する <ArrowRight size={13} />
                    </button>
                  </div>
                  {party.length ? (
                    <>
                      <div className="rpg-party-names">
                        {party.map((p) => (
                          <span key={p.id}>
                            <i className={`rpg-dot color-${p.color}`} />
                            {p.name}
                            <small>
                              {p.hp}/{p.maxHp}
                            </small>
                          </span>
                        ))}
                      </div>
                      <button
                        className="rpg-outline"
                        disabled={!!battle || me.gold < 10}
                        onClick={() => send({ type: "support" })}
                      >
                        <Heart size={15} />
                        近くの仲間を回復 · 10コイン
                      </button>
                    </>
                  ) : (
                    <p>
                      今はひとり旅。
                      <br />
                      仲間を見つけたら、自由にチームを組もう。
                    </p>
                  )}
                  <small>同じ敵と戦う近くの仲間1人につき攻撃＋2</small>
                </section>
                <section className="rpg-journal">
                  <h2>
                    <Compass size={16} />
                    冒険の便り
                  </h2>
                  {world.logs.slice(0, 4).map((l, i) => (
                    <p key={`${i}-${l}`}>
                      <i />
                      {l}
                    </p>
                  ))}
                </section>
              </aside>
            </div>
            <footer className="rpg-footer">
              <div className="rpg-message" role="status">
                <Sparkles size={17} />
                {me.message}
              </div>
              <button
                className="rpg-room-code"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      room.current?.code || "",
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  } catch {
                    setError(
                      "コピーできませんでした。表示されているコードを共有してください。",
                    );
                  }
                }}
                disabled={!room.current?.code}
              >
                {room.current?.code ? (
                  <>
                    <Wifi size={14} />
                    ROOM <b>{room.current.code}</b>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </>
                ) : (
                  "ひとり練習 · 通信なし"
                )}
              </button>
            </footer>
            {error && (
              <div className="rpg-connection-error" role="alert">
                {error}
                <button onClick={exit}>部屋選択へ戻る</button>
              </div>
            )}
            {town &&
              !battle &&
              modal(
                town.name,
                <>
                  <p>ほっと一息。次の冒険に向けて準備を整えよう。</p>
                  <button
                    className="rpg-town-rest"
                    onClick={() => send({ type: "town", choice: "rest" })}
                  >
                    <Flame />
                    休憩してHPを全回復 <b>無料</b>
                  </button>
                  <h3>
                    カード工房 <small>強化30コイン / 購入25コイン</small>
                  </h3>
                  <div className="rpg-shop">
                    {CARD_KEYS.map((k) => (
                      <div key={k}>
                        <span>
                          {card(k).name}
                          {me.upgrades.includes(k) ? " ＋" : ""}
                        </span>
                        <button
                          disabled={
                            me.gold < 30 ||
                            me.upgrades.includes(k) ||
                            !me.deck.includes(k)
                          }
                          onClick={() =>
                            send({ type: "town", choice: "upgrade", card: k })
                          }
                        >
                          強化
                        </button>
                        <button
                          disabled={me.gold < 25}
                          onClick={() =>
                            send({ type: "town", choice: "buy", card: k })
                          }
                        >
                          購入
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="rpg-dialog-message" role="status">
                    {me.message}
                  </p>
                  <small>
                    強化すると同名カードすべてのダメージ・ブロックが3増えます。
                  </small>
                </>,
                () => setTown(null),
              )}
            {panel === "team" &&
              modal(
                "冒険者とチーム",
                <>
                  <p>
                    {Object.keys(world.players).length}
                    人がこの世界を探索中。公開チームへ自由に参加できます。
                  </p>
                  <div className="rpg-dialog-actions">
                    <button
                      disabled={!!battle || !!me.team}
                      onClick={() => send({ type: "team", target: selfId })}
                    >
                      チームを公開
                    </button>
                    <button
                      disabled={!!battle || !me.team}
                      onClick={() => send({ type: "team", target: null })}
                    >
                      チームを離れる
                    </button>
                  </div>
                  <div className="rpg-roster">
                    {members.map((p) => (
                      <div key={p.id}>
                        <i className={`rpg-dot color-${p.color}`} />
                        <span>
                          {p.name}
                          <small>
                            Lv.{p.level} · {p.battle ? "戦闘中" : "探索中"}
                          </small>
                        </span>
                        {p.team ? (
                          <button
                            disabled={
                              !!battle ||
                              p.team === me.team ||
                              members.filter((q) => q.team === p.team).length >=
                                4
                            }
                            onClick={() => send({ type: "team", target: p.id })}
                          >
                            {p.team === me.team ? "同じチーム" : "チームに参加"}
                          </button>
                        ) : (
                          <small>ひとり旅</small>
                        )}
                      </div>
                    ))}
                  </div>
                  <p>{me.message}</p>
                </>,
                () => setPanel(null),
              )}
            {panel === "deck" &&
              modal(
                "あなたのデッキ",
                <>
                  <p>
                    戦闘では毎ターン5枚を引きます。使い終わったカードは山札に戻ります。
                  </p>
                  <div className="rpg-deck-list">
                    {CARD_KEYS.filter((k) => me.deck.includes(k)).map((k) => (
                      <article key={k}>
                        <strong>
                          {card(k).name}
                          {me.upgrades.includes(k) ? " ＋" : ""}
                          <span>×{me.deck.filter((c) => c === k).length}</span>
                        </strong>
                        <p>{card(k).description}</p>
                        <small>
                          コスト {card(k).cost}
                          {me.upgrades.includes(k)
                            ? " · ダメージ／ブロック＋3"
                            : ""}
                        </small>
                      </article>
                    ))}
                  </div>
                </>,
                () => setPanel(null),
              )}
            {panel === "help" &&
              modal(
                "冒険の手引き",
                <ol className="rpg-help">
                  <li>
                    矢印キー・WASD・画面の方向ボタンで移動。マップをタップすると道を探して歩きます。
                  </li>
                  <li>
                    建物や敵の2マス以内で「調べる」。町では無料回復・カード購入・強化ができます。
                  </li>
                  <li>
                    学習問題に正解するとエナジー3、不正解でも1。カードを使い、ターン終了で敵が攻撃します。
                  </li>
                  <li>
                    宝箱・イベント・通常戦闘の報酬は各自で獲得。試験官と校長のHPは全員で共有します。
                  </li>
                  <li>
                    公開されたチームには任意で参加（最大4人）。5マス以内で同じ敵と戦う仲間がいると攻撃力が上がります。
                  </li>
                  <li>
                    3体の試験官を倒して結界を解除し、北東の時計塔で校長を倒せば全員の勝利！
                  </li>
                  <li>
                    ホストの退出で部屋は終了。再接続や途中保存は未対応です。安定した回線で、ホストの画面を開いたまま遊んでください。
                  </li>
                </ol>,
                () => setPanel(null),
              )}
            {battle && enemy && (
              <div className="rpg-overlay rpg-battle-overlay">
                <section
                  className="rpg-battle"
                  role="dialog"
                  aria-modal="true"
                  aria-label="カード戦闘"
                >
                  <header>
                    <span>
                      <Swords size={16} /> CARD BATTLE · TURN {battle.turn}
                    </span>
                    <button
                      className="rpg-subtle"
                      onClick={() => send({ type: "flee" })}
                    >
                      離脱（HP −5）
                    </button>
                  </header>
                  <div className="rpg-enemy-scene">
                    <div className="rpg-enemy-sprite">
                      <img src={getEnemyIllustrationPaths(enemy.kind === 'boss' ? '校長先生' : enemy.kind === 'guardian' ? '教頭先生' : enemy.name)[0]} alt="" onError={e => { e.currentTarget.style.display='none'; }} />
                      {enemy.kind === "boss" ? (
                        <Crown size={70} />
                      ) : enemy.kind === "guardian" ? (
                        <Shield size={64} />
                      ) : (
                        <Swords size={55} />
                      )}
                    </div>
                    <h2>{enemy.name}</h2>
                    <div className="rpg-enemy-hp">
                      <div className="rpg-meter boss">
                        <i
                          style={{
                            width: `${(100 * battle.hp) / battle.maxHp}%`,
                          }}
                        />
                      </div>
                      <b>
                        {battle.hp} / {battle.maxHp}
                      </b>
                    </div>
                    <small>
                      次の行動：
                      {enemy.kind === "boss"
                        ? 18
                        : enemy.kind === "guardian"
                          ? 12
                          : 8}
                      ダメージの攻撃{" "}
                      {enemy.kind !== "enemy" ? " · HPは全員で共有" : ""}
                    </small>
                  </div>
                  <div className="rpg-battle-status">
                    <span>
                      <Heart size={15} />
                      {me.hp}/{me.maxHp}
                    </span>
                    <span>
                      <Shield size={15} />
                      ブロック {battle.block}
                    </span>
                    <span>
                      <Sparkles size={15} />
                      エナジー {battle.energy}
                    </span>
                  </div>
                  <p className="rpg-battle-message" role="status">
                    {me.message}
                  </p>
                  {battle.phase === "quiz" ? (
                    <div className="rpg-quiz">
                      <span className="rpg-eyebrow">
                        学びが、あなたの力になる
                      </span>
                      <h3>{battle.quiz.question}</h3>
                      <div>
                        {battle.quiz.options.map((o, i) => (
                          <button
                            key={i}
                            onClick={() => send({ type: "answer", index: i })}
                          >
                            <b>{i + 1}</b>
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="rpg-hand">
                        {battle.hand.map((k, i) => {
                          const c = card(k);
                          return (
                            <button
                              key={`${battle.turn}-${i}-${k}`}
                              className={`rpg-card ${c.damage ? "attack" : "defend"}`}
                              disabled={battle.energy < c.cost}
                              onClick={() => send({ type: "card", index: i })}
                            >
                              <span className="rpg-card-cost">{c.cost}</span>
                              <div className="rpg-card-art">
                                <img src={getCardIllustrationPaths(k, c.name)[0]} alt="" onError={e => {e.currentTarget.style.display='none';}} />
                                {c.damage ? (
                                  <Swords size={34} />
                                ) : (
                                  <Shield size={34} />
                                )}
                              </div>
                              <strong>
                                {c.name}
                                {me.upgrades.includes(k) ? "＋" : ""}
                              </strong>
                              <p>{c.description}</p>
                              {me.upgrades.includes(k) && (
                                <small>ダメージ／ブロック＋3</small>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="rpg-battle-actions">
                        <small>
                          山札 {battle.draw.length} · 捨て札{" "}
                          {battle.discard.length}
                        </small>
                        <button
                          className="rpg-primary"
                          onClick={() => send({ type: "end" })}
                        >
                          ターン終了 <ArrowRight size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </section>
              </div>
            )}
            {world.won &&
              modal(
                "みんなの力で、校長を撃破！",
                <div className="rpg-victory">
                  <Crown size={65} />
                  <h2>冒険は、学びの先へ。</h2>
                  <p>
                    この世界の冒険者 {Object.keys(world.players).length}{" "}
                    人で勝利しました。
                  </p>
                  <p>
                    あなたの正解数 <b>{me.correct}</b> ／ 回答数 {me.answers}
                    <br />
                    到達レベル <b>{me.level}</b> · 探索 {me.claimed.length} か所
                  </p>
                  <button className="rpg-primary" onClick={exit}>
                    新しい冒険へ
                  </button>
                </div>,
                exit,
              )}
          </>
        )}
      </main>
    </TranslatedUiTree>
  );
}
