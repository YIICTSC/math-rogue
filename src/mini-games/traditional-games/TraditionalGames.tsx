import { SeatHandCount } from '../shared/SeatHandCount';
import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  CircleDot,
  Dice5,
  Link2,
  UsersRound,
  X,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import type { MiniGameComponentProps } from '../../components/MiniGameRouter';
import type { LanguageMode } from '../../types';
import type { CardClubVoiceEvent } from '../../data/cardClubVoices';
import { CARD_CLUB_VOICE_HEROES } from '../../data/cardClubVoices';
import { OFFLINE_DISTRIBUTABLE } from '../../config/runtime';
import { audioService } from '../../services/audioService';
import { trans } from '../../utils/textUtils';
import { ClubHeroes, ClubOnlineEntry, Face } from '../card-club/ClubSetup';
import '../card-club/cardClub.css';
import { copyInviteUrl } from '../shared/copyInviteUrl';
import { tableRoomCode, tableInviteUrl } from '../shared/tableInvite';
import { useTableVoice } from '../shared/useTableVoice';
import { TableBoard } from './Boards';
import { RulesText, Tutorial } from './Tutorial';
import { tableArt } from './Pieces';
import { TRADITIONAL_ROOM_PARAM, traditionalInviteCode } from './invite';
import { familyFor, say, TABLE_GAMES, type Copy, type TableFamily } from './catalog';
import {
  DOMINO_CATEGORIES,
  DOMINO_LEVELS,
  dominoListing,
  type DominoCategory,
} from './dominoCatalog';
import { DOMINO_GAMES, seatsFor, type TableGame } from './model';
import { TraditionalRoom, type TablePacket } from './session';
import type { TableView } from './engine';
import './traditionalGames.css';

const familyEntries: Array<{
  id: TableFamily;
  game: TableGame;
  name: Copy;
  surface: string;
  piece: string;
}> = [
  {
    id: 'domino',
    game: 'competitive',
    name: ['ドミノ', 'Dominoes', 'ドミノ'],
    surface: 'baize',
    piece: 'domino',
  },
  {
    id: 'peeper',
    game: 'peeper',
    name: ['ピーパー', 'Peeper', 'ピーパー'],
    surface: 'plum',
    piece: 'peeper',
  },
  {
    id: 'crokinole',
    game: 'crokinole',
    name: ['クロキノール', 'Crokinole', 'クロキノール'],
    surface: 'maple',
    piece: 'disc-red',
  },
  {
    id: 'goita',
    game: 'goita',
    name: ['ごいた', 'Goita', 'ごいた'],
    surface: 'tatami',
    piece: 'goita',
  },
];

const effects: Partial<Record<NonNullable<TableView['event']>['key'], CardClubVoiceEvent>> = {
  domino: 'domino',
  bomb: 'bomb',
  'five-shi': 'five-shi',
  twenty: 'twenty',
};
const eventCopy: Partial<Record<NonNullable<TableView['event']>['key'], Copy>> = {
  place: ['置いた', 'Placed', 'おいた'],
  pass: ['パス', 'Pass', 'パス'],
  draw: ['1枚引いた', 'Drew a tile', '1まい ひいた'],
  domino: ['ドミノ！', 'Domino!', 'ドミノ！'],
  blocked: ['全員パス', 'Blocked', 'ぜんいん パス'],
  score: ['得点', 'Scored', 'とくてん'],
  bomb: ['ボム！', 'Bomb!', 'ボム！'],
  mine: ['マイン！', 'Mine!', 'マイン！'],
  return: ['リターン！', 'Return!', 'リターン！'],
  'peeper-out': ['上がり', 'Went out', 'あがり'],
  attack: ['攻め', 'Attack', 'せめ'],
  'five-shi': ['五しです', 'Five pawns', 'ごしです'],
  'goita-out': ['上がり', 'Went out', 'あがり'],
  redeal: ['配り直し', 'Redeal', 'くばりなおし'],
  'hand-award': ['手役', 'Opening hand', 'てやく'],
  twenty: ['中央穴に入った！', 'Twenty!', 'ちゅうおうに はいった！'],
  foul: ['無効ショット', 'Invalid shot', 'むこう ショット'],
  shot: ['ショット', 'Shot', 'ショット'],
  bid: ['ビッド', 'Bid', 'ビッド'],
  trump: ['切り札', 'Trump', 'きりふだ'],
  trick: ['トリック獲得', 'Took the trick', 'トリック かくとく'],
  contract: ['契約の精算', 'Contract settled', 'けいやくの せいさん'],
};

const profileKey = 'traditional-table-hero';

function RoomInvite({ code, language }: { code: string; language: LanguageMode }) {
  const [copied, setCopied] = useState(false);
  const l = (ja: string, en: string, kana?: string) => say(language, [ja, en, kana]);
  const invite = tableInviteUrl(
    location.href,
    code,
    TRADITIONAL_ROOM_PARAM,
    Capacitor.isNativePlatform(),
  );
  return (
    <div className="tt-invite">
      <b>
        {l('招待コード', 'Room code', 'しょうたいコード')} <output>{code}</output>
      </b>
      <input
        readOnly
        value={invite}
        onFocus={(e) => e.currentTarget.select()}
        aria-label={l('招待URL', 'Invite URL', 'しょうたいURL')}
      />
      <button onClick={async () => setCopied(await copyInviteUrl(invite))}>
        <Link2 size={16} />
        {copied
          ? l('コピー済み', 'Copied', 'コピーずみ')
          : l('招待URLをコピー', 'Copy invite URL', 'しょうたいURLを コピー')}
      </button>
    </div>
  );
}

function Seats({ view: v, language }: { view: TableView; language: LanguageMode }) {
  const l = (ja: string, en: string, kana?: string) => say(language, [ja, en, kana]);
  return (
    <div className="tt-seats">
      {v.players.map((p, seat) => (
        <div
          key={p.id}
          className="tt-seat"
          title={p.name}
          data-turn={v.phase === 'play' && v.turn === seat}
          data-team={
            v.game === 'goita' ? Number(seat % 2 !== v.self % 2) : v.teams ? seat % 2 : undefined
          }
        >
          <Face hero={p.hero} />
          <div>
            <strong>{p.name}</strong>
            <small>
              {seat === v.self
                ? l('あなた', 'You', 'あなた')
                : v.game === 'goita'
                  ? seat % 2 === v.self % 2
                    ? l('味方', 'Partner', 'みかた')
                    : l('相手', 'Opponent', 'あいて')
                  : v.teams
                    ? l('組', 'Team', 'くみ') + ' ' + ((seat % 2) + 1)
                    : p.cpu
                      ? 'CPU'
                      : ''}
            </small>
          </div>
          <SeatHandCount
            count={v.kind === 'crokinole' ? v.remaining[seat] : v.counts[seat]}
            label={
              v.kind === 'crokinole'
                ? l('残りの駒', 'Discs left', 'のこりのこま')
                : l('手駒', 'Tiles', 'てごま')
            }
            unit={
              language === 'ENGLISH' ? '' : v.kind === 'crokinole' ? l('個', '', 'こ') : l('枚', '', 'まい')
            }
          />
          <b>{v.scores[seat]}</b>
        </div>
      ))}
    </div>
  );
}

export default function TraditionalGames({
  onBack,
  languageMode = 'JAPANESE',
}: MiniGameComponentProps) {
  const l = (ja: string, en: string, kana?: string) => say(languageMode, [ja, en, kana]);
  const [inviteCode] = useState(() =>
    OFFLINE_DISTRIBUTABLE ? '' : traditionalInviteCode(location.href),
  );
  const [page, setPage] = useState<'title' | 'select' | 'host' | 'join' | 'tutorial'>(
    inviteCode ? 'join' : 'title',
  );
  const [game, setGame] = useState<TableGame | null>(null);
  const [dominoPickerOpen, setDominoPickerOpen] = useState(false);
  const dominoPickerHeading = useRef<HTMLHeadingElement>(null);
  const [hero, setHero] = useState(() => {
    try {
      const selected = localStorage.getItem(profileKey) ?? localStorage.getItem('card-club-hero');
      if (CARD_CLUB_VOICE_HEROES.some((h) => h === selected)) return selected!;
    } catch {}
    return CARD_CLUB_VOICE_HEROES[0];
  });
  const [name, setName] = useState(() => l('プレイヤー', 'Player', 'プレイヤー'));
  const [code, setCode] = useState(inviteCode);
  const [count, setCount] = useState(4);
  const [dominoCategory, setDominoCategory] = useState<DominoCategory | 'all'>('all');
  const [beginnerOnly, setBeginnerOnly] = useState(false);
  const [dominoSort, setDominoSort] = useState<'level' | 'category' | 'name'>('level');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showHero, setShowHero] = useState(false);
  const [rules, setRules] = useState(false);
  const [packet, setPacket] = useState<TablePacket | null>(null);
  const room = useRef<TraditionalRoom | null>(null);
  const current = packet?.phase === 'game' ? packet.view : null;
  const host = !!packet && packet.hostId === packet.selfId;
  const activeGame =
    packet?.phase === 'lobby' ? packet.game : (current?.game ?? game ?? 'competitive');
  const family = familyEntries.find((entry) => entry.id === familyFor(activeGame))!;
  const entry = TABLE_GAMES[activeGame];
  const event = current?.event;
  const cue = event && effects[event.key];
  useTableVoice(
    current
      ? {
          ...current,
          hero: current.players[current.self].hero,
          start: 'table-start',
          silentResult: current.winners.length > (current.teams ? 2 : 1),
        }
      : null,
    current && event && cue ? { hero: current.players[event.seat].hero, event: cue } : undefined,
  );

  useEffect(() => () => room.current?.close(), []);
  useEffect(() => {
    if (dominoPickerOpen) dominoPickerHeading.current?.focus();
  }, [dominoPickerOpen]);
  useEffect(
    () => audioService.acquireBgmScene(current ? 'poker_play' : 'poker_shop', undefined, 24),
    [!!current],
  );

  function chooseHero(id: string) {
    setHero(id);
    setShowHero(false);
    try {
      localStorage.setItem(profileKey, id);
    } catch {}
  }
  function chooseGame(id: TableGame) {
    const players = packet?.phase === 'lobby' ? packet.members.length : 1;
    const allowed = seatsFor(id).filter((n) => n >= players);
    if (!allowed.length) return;
    const seats = allowed.includes(count) ? count : allowed[0];
    setGame(id);
    setCount(seats);
    room.current?.configure(id, seats);
    setDominoPickerOpen(false);
  }
  function audioGesture() {
    audioService.init();
    void audioService.unlockAudio();
    audioService.resumeBGM();
    void audioService.preloadTraditionalSounds();
  }
  function createRoom() {
    const active = new TraditionalRoom(
      (p) => {
        if (room.current === active) setPacket(p);
      },
      (status) => {
        if (room.current === active) setError(status);
      },
    );
    room.current?.close();
    room.current = active;
    return active;
  }
  function playSolo() {
    if (!game) return;
    audioGesture();
    const active = createRoom();
    active.practice({ name: name.trim() || l('プレイヤー', 'Player', 'プレイヤー'), hero });
    active.configure(game, count);
    active.start();
    setPage('select');
  }
  async function connect(mode: 'host' | 'join') {
    if (busy || !name.trim() || (mode === 'join' && !tableRoomCode(code))) return;
    audioGesture();
    setBusy(true);
    setError('');
    const active = createRoom();
    try {
      if (mode === 'host') {
        await active.create({ name: name.trim(), hero });
        if (game) active.configure(game, count);
      } else await active.join({ name: name.trim(), hero }, code);
    } catch (e) {
      if (room.current === active) {
        active.close();
        room.current = null;
        setPacket(null);
        setError(
          String(e).includes('ROOM_FULL_OR_STARTED') ? 'ROOM_FULL_OR_STARTED' : 'CONNECT_FAILED',
        );
      }
    } finally {
      if (!room.current || room.current === active) setBusy(false);
    }
  }
  function leave() {
    room.current?.close();
    room.current = null;
    setBusy(false);
    setPacket(null);
    setError('');
    setRules(false);
    setDominoPickerOpen(false);
    if (inviteCode) onBack();
    else setPage('title');
  }
  function back() {
    if (dominoPickerOpen) {
      setDominoPickerOpen(false);
      return;
    }
    if (packet || busy) {
      leave();
      return;
    }
    if (page === 'title' || inviteCode) {
      onBack();
      return;
    }
    setError('');
    setPage(page === 'tutorial' ? 'select' : 'title');
  }

  const selectFamily = (
    <div
      className="tt-families"
      role="group"
      aria-label={l('ゲームの種類', 'Game families', 'ゲームの しゅるい')}
    >
      {familyEntries.map((f) => (
        <button
          key={f.id}
          aria-pressed={game !== null && f.id === family.id}
          disabled={
            packet?.phase === 'lobby' &&
            !seatsFor(f.game).some((n) => n >= packet.members.length) &&
            f.id !== 'domino'
          }
          onClick={() => {
            if (f.id === 'domino') setDominoPickerOpen(true);
            else chooseGame(f.game);
          }}
          style={{
            backgroundImage: `linear-gradient(0deg,#151015bd,transparent 67%),url("${tableArt(f.surface)}")`,
          }}
        >
          <img src={tableArt(f.piece)} alt="" />
          <strong>{say(languageMode, f.name)}</strong>
        </button>
      ))}
    </div>
  );

  const dominoVariants = (dominoPickerOpen ? DOMINO_GAMES : []).filter((id) => {
    const { category, level } = dominoListing(id);
    return (
      (dominoCategory === 'all' || category === dominoCategory) && (!beginnerOnly || level === 0)
    );
  }).sort((a, b) => {
    const first = dominoListing(a),
      second = dominoListing(b);
    const locale = languageMode === 'ENGLISH' ? 'en' : 'ja';
    const byName = () =>
      say(languageMode, TABLE_GAMES[a].title).localeCompare(
        say(languageMode, TABLE_GAMES[b].title),
        locale,
      );
    if (dominoSort === 'name') return byName();
    if (dominoSort === 'category') {
      return (
        say(languageMode, DOMINO_CATEGORIES[first.category]).localeCompare(
          say(languageMode, DOMINO_CATEGORIES[second.category]),
          locale,
        ) ||
        first.level - second.level ||
        byName()
      );
    }
    return first.level - second.level || DOMINO_GAMES.indexOf(a) - DOMINO_GAMES.indexOf(b);
  });
  const dominoList = dominoPickerOpen && (
    <section className="tt-domino-picker">
      <div className="tt-domino-filters">
        <label>
          {l('種類', 'Type', 'しゅるい')}
          <select
            value={dominoCategory}
            onChange={(e) => setDominoCategory(e.target.value as typeof dominoCategory)}
          >
            <option value="all">{l('すべて', 'All types', 'すべて')}</option>
            {Object.entries(DOMINO_CATEGORIES).map(([id, name]) => (
              <option key={id} value={id}>
                {say(languageMode, name)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {l('並び順', 'Sort', 'ならびじゅん')}
          <select
            value={dominoSort}
            onChange={(e) => setDominoSort(e.target.value as typeof dominoSort)}
          >
            <option value="level">{l('難易度順', 'Difficulty', 'なんいどじゅん')}</option>
            <option value="category">{l('種類順', 'Type', 'しゅるいじゅん')}</option>
            <option value="name">{l('名前順', 'Name', 'なまえじゅん')}</option>
          </select>
        </label>
        <label className="tt-domino-beginner">
          <input
            type="checkbox"
            checked={beginnerOnly}
            onChange={(e) => setBeginnerOnly(e.target.checked)}
          />
          {say(languageMode, DOMINO_LEVELS[0])}
        </label>
      </div>
      <div
        className="tt-variants"
        role="group"
        aria-label={l('ドミノのルール', 'Domino rulesets', 'ドミノの ルール')}
      >
        {dominoVariants.map((id) => {
          const { category, level } = dominoListing(id);
          const title = say(languageMode, TABLE_GAMES[id].title);
          const seats = seatsFor(id);
          const last = seats[seats.length - 1];
          const seatLabel = seats.length > 2 && last - seats[0] === seats.length - 1
            ? `${seats[0]}–${last}`
            : seats.join(' / ');
          return (
            <button
              type="button"
              key={id}
              aria-label={title}
              aria-pressed={id === game}
              disabled={
                packet?.phase === 'lobby' && !seatsFor(id).some((n) => n >= packet.members.length)
              }
              onClick={() => chooseGame(id)}
            >
              <strong>{title}</strong>
              <small>
                {say(languageMode, DOMINO_CATEGORIES[category])} ·{' '}
                {say(languageMode, DOMINO_LEVELS[level])} · {seatLabel}
                {l('人', ' players', 'にん')}
              </small>
            </button>
          );
        })}
        {!dominoVariants.length && (
          <p role="status">
            {l(
              '条件に合う種目はありません。',
              'No rulesets match these filters.',
              'この じょうけんに あう ゲームは ありません。',
            )}
          </p>
        )}
      </div>
    </section>
  );

  const personPicker = (
    <div className="tt-profile">
      <Face hero={hero} />
      <label>
        {l('名前', 'Name', 'なまえ')}
        <input
          value={name}
          autoComplete="nickname"
          maxLength={32}
          disabled={busy || !!packet}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={busy || !!packet}
        aria-expanded={showHero}
        onClick={() => setShowHero((v) => !v)}
      >
        {l('キャラを選ぶ', 'Choose character', 'キャラを えらぶ')}
      </button>
      {showHero && (
        <div className="tt-hero-picker">
          <ClubHeroes
            hero={hero}
            onHero={chooseHero}
            l={(ja, en) => (languageMode === 'ENGLISH' ? en : trans(ja, languageMode))}
          />
        </div>
      )}
    </div>
  );

  if (page === 'title' && !packet)
    return (
      <main className="traditional-tables tt-title">
        <picture className="tt-title-art">
          <source media="(orientation: portrait)" srcSet={tableArt('title-portrait')} />
          <img src={tableArt('title-landscape')} alt="" />
        </picture>
        <button className="tt-title-back" onClick={onBack}>
          <ArrowLeft size={18} />
          {l('ゲーム一覧へ', 'Back to games', 'ゲームいちらんへ')}
        </button>
        <h1>
          {l(
            '世界の伝統ゲーム集',
            'Traditional Games of the World',
            'せかいの でんとうゲームしゅう',
          )}
        </h1>
        <nav
          className="tt-title-menu"
          aria-label={l('遊び方を選ぶ', 'Choose how to play', 'あそびかたを えらぶ')}
        >
          <button
            onClick={() => {
              audioGesture();
              setPage('select');
            }}
          >
            {l('ひとりで遊ぶ', 'Play solo', 'ひとりで あそぶ')}
          </button>
          {!OFFLINE_DISTRIBUTABLE && (
            <>
              <button
                onClick={() => {
                  audioGesture();
                  setPage('host');
                }}
              >
                {l('オンラインの部屋を作る', 'Create online room', 'オンラインの へやを つくる')}
              </button>
              <button
                onClick={() => {
                  audioGesture();
                  setPage('join');
                }}
              >
                {l('招待に参加する', 'Join invitation', 'しょうたいに さんかする')}
              </button>
            </>
          )}
        </nav>
      </main>
    );

  return (
    <main
      className={`traditional-tables tt-theme-${dominoPickerOpen ? 'domino' : family.id}${current ? ' tt-playing' : dominoPickerOpen ? ' tt-browse-dominoes' : ''}`}
      data-table-kind={current?.kind}
      data-gamepad-navigation-root
      data-table-game={activeGame}
      style={
        {
          '--tt-surface': `url("${tableArt(family.surface)}")`,
          ...Object.fromEntries(
            ['domino', 'peeper', 'goita', 'goita-back', 'disc-red', 'disc-blue', 'maple'].map(
              (k) => [`--tt-${k}-art`, `url("${tableArt(k)}")`],
            ),
          ),
        } as React.CSSProperties
      }
    >
      {page === 'tutorial' && game && !packet ? (
        <Tutorial game={game} hero={hero} language={languageMode} back={back} play={playSolo} />
      ) : (
        <>
          <header className="tt-nav">
            <button onClick={back}>
              <ArrowLeft size={18} />
              {l('戻る', 'Back', 'もどる')}
            </button>
            {dominoPickerOpen ? (
              <h1 ref={dominoPickerHeading} tabIndex={-1}>
                {l('ドミノのルールを選ぶ', 'Choose domino rules', 'ドミノの ルールを えらぶ')}
              </h1>
            ) : (
              <strong>
                {current
                  ? say(languageMode, entry.title)
                  : l(
                      '世界の伝統ゲーム集',
                      'Traditional Games of the World',
                      'せかいの でんとうゲームしゅう',
                    )}
              </strong>
            )}
            {current && (
              <button onClick={() => setRules(true)}>
                <BookOpen size={18} />
                {l('ルール', 'Rules', 'ルール')}
              </button>
            )}
          </header>
          {error && (
            <p className="tt-error" role="alert">
              {error === 'ROOM_FULL_OR_STARTED'
                ? l(
                    '席が埋まっているか、対局が始まっています。',
                    'The room is full or has already started.',
                    'せきが うまったか、たいきょくちゅうです。',
                  )
                : error === 'HOST_DISCONNECTED'
                  ? l(
                      'ホストとの接続が切れました。',
                      'Connection to the host was lost.',
                      'ホストとの せつぞくが きれました。',
                    )
                  : l(
                      '接続できませんでした。コードと通信環境を確認してください。',
                      'Could not connect. Check the code and your connection.',
                      'コードと つうしんを かくにんしてください。',
                    )}
            </p>
          )}
          {current ? (
            <section className="tt-match">
              <Seats view={current} language={languageMode} />
              <div className="tt-match-bar">
                <span>
                  {l('第', 'Round ', 'だい')}
                  {current.round}
                  {l('局', '', 'きょく')}
                </span>
                <strong aria-live="polite">
                  {current.phase === 'play'
                    ? current.turn === current.self
                      ? l('あなたの手番', 'Your turn', 'あなたの てばん')
                      : current.players[current.turn].name + ' · ' + l('手番', 'Turn', 'てばん')
                    : current.phase === 'round'
                      ? l('この局が終了', 'Round complete', 'この きょくが しゅうりょう')
                      : l('対局終了', 'Match complete', 'たいきょく しゅうりょう')}
                </strong>
                {current.kind === 'domino' && (
                  <span>
                    {l('山', 'Stock', 'やま')} {current.stock}
                  </span>
                )}
              </div>
              <div className="tt-table-area">
                <TableBoard
                  view={current}
                  language={languageMode}
                  send={(action) => room.current?.command(action)}
                  disabled={error === 'HOST_DISCONNECTED'}
                />
              </div>
              {event && eventCopy[event.key] && (
                <div className="tt-last-play" data-event={event.key} role="status">
                  <b>{current.players[event.seat]?.name}</b> ·{' '}
                  {say(languageMode, eventCopy[event.key]!)}
                  {event.amount !== undefined && event.amount > 0 && (
                    <strong> +{event.amount}</strong>
                  )}
                </div>
              )}
              {current.phase !== 'play' && (
                <div className="tt-round-summary">
                  <strong>
                    {current.phase === 'result' &&
                      ((current.teams ? current.winners.length > 2 : current.winners.length > 1)
                        ? l('引き分け', 'Draw', 'ひきわけ')
                        : current.winners.includes(current.self)
                          ? l('勝利', 'Victory', 'しょうり')
                          : l('対局結果', 'Final result', 'たいきょく けっか'))}
                  </strong>
                  {current.players.map((p, i) => (
                    <span key={p.id}>
                      {p.name} {current.scores[i]} (
                      {current.scores[i] - current.roundStartScores[i] >= 0 ? '+' : ''}
                      {current.scores[i] - current.roundStartScores[i]})
                    </span>
                  ))}
                  {host && (
                    <button
                      className="tt-primary"
                      onClick={() =>
                        current.phase === 'round'
                          ? room.current?.command({ type: 'next' })
                          : room.current?.rematch()
                      }
                    >
                      {current.phase === 'round'
                        ? l('次の局へ', 'Next round', 'つぎの きょくへ')
                        : l('もう一度遊ぶ', 'Play again', 'もういちど あそぶ')}
                    </button>
                  )}
                </div>
              )}
            </section>
          ) : dominoPickerOpen ? (
            dominoList
          ) : packet?.phase === 'lobby' ? (
            <section className="tt-setup cc-panel cc-lobby">
              <div className="cc-lobby-heading">
                <h1>{l('オンラインルーム', 'Online room', 'オンラインルーム')}</h1>
                <span>
                  {packet.members.length} / {packet.count}{' '}
                  {l('人が参加中', 'joined', 'にんが さんかちゅう')}
                </span>
              </div>
              {!!packet.code && <RoomInvite code={packet.code} language={languageMode} />}
              <ul className="cc-seat-list" aria-label={l('参加者', 'Participants', 'さんかしゃ')}>
                {packet.members.map((player) => (
                  <li key={player.id}>
                    <Face hero={player.hero} />
                    <div>
                      <strong>{player.name}</strong>
                      <small>
                        {player.id === packet.hostId
                          ? l('ホスト', 'Host', 'ホスト')
                          : l('参加済み', 'Joined', 'さんかずみ')}
                        {player.id === packet.selfId ? ' · ' + l('あなた', 'You', 'あなた') : ''}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="cc-seat-summary">
                {packet.members.length} {l('人が参加', 'human players', 'にんが さんか')} ＋ CPU{' '}
                {packet.count - packet.members.length}
              </p>
              {host && selectFamily}
              {(!host || game) && (
                <div className="tt-detail">
                  <h1>{say(languageMode, entry.title)}</h1>
                  <p>{say(languageMode, entry.tagline)}</p>
                  {host ? (
                    <label>
                      {l('席数', 'Seats', 'せきすう')}
                      <select
                        value={packet.count}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setCount(n);
                          room.current?.configure(packet.game, n);
                        }}
                      >
                        {seatsFor(packet.game)
                          .filter((n) => n >= packet.members.length)
                          .map((n) => (
                            <option key={n}>{n}</option>
                          ))}
                      </select>
                    </label>
                  ) : (
                    <small>
                      {packet.count} {l('人卓', 'seats', 'にんたく')}
                    </small>
                  )}
                </div>
              )}
              {host ? (
                <button
                  className="tt-primary"
                  disabled={!game}
                  onClick={() => {
                    audioGesture();
                    room.current?.start();
                  }}
                >
                  {l('このメンバーで開始', 'Start match', 'この メンバーで かいし')}
                </button>
              ) : (
                <p role="status">
                  {l(
                    'ホストが対局を始めるのを待っています。',
                    'Waiting for the host to start.',
                    'ホストの かいしを まっています。',
                  )}
                </p>
              )}
            </section>
          ) : page === 'host' || page === 'join' ? (
            <ClubOnlineEntry
              mode={page}
              name={name}
              onName={setName}
              hero={hero}
              onHero={chooseHero}
              code={code}
              onCode={setCode}
              busy={busy}
              l={l}
              parseInviteCode={traditionalInviteCode}
              onSubmit={() => void connect(page)}
            />
          ) : (
            <section className="tt-setup">
              {selectFamily}
              {game && (
                <>
                  <div className="tt-detail">
                    <h1>{say(languageMode, entry.title)}</h1>
                    <p>{say(languageMode, entry.tagline)}</p>
                    <label>
                      {l('席数', 'Seats', 'せきすう')}
                      <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                        {seatsFor(game).map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {personPicker}
                  <div className="tt-menu-actions">
                    <button type="button" className="tt-primary" onClick={playSolo}>
                      <Dice5 size={18} />
                      {l('CPUと対戦', 'Play against CPU', 'CPUと たいせん')}
                    </button>
                    <button type="button" onClick={() => setPage('tutorial')}>
                      <BookOpen size={18} />
                      {l('チュートリアル', 'Tutorial', 'チュートリアル')}
                    </button>
                    {!OFFLINE_DISTRIBUTABLE && (
                      <>
                        <button type="button" onClick={() => setPage('host')}>
                          <UsersRound size={18} />
                          {l('部屋を作る', 'Create room', 'へやを つくる')}
                        </button>
                        <button type="button" onClick={() => setPage('join')}>
                          <ChevronRight size={18} />
                          {l('招待に参加', 'Join room', 'しょうたいに さんか')}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}
      {rules && (
        <div className="tt-modal">
          <section role="dialog" aria-modal="true" aria-label={l('ルール', 'Rules', 'ルール')}>
            <header>
              <h2>
                <CircleDot size={20} />
                {say(languageMode, entry.title)}
              </h2>
              <button onClick={() => setRules(false)} aria-label={l('閉じる', 'Close', 'とじる')}>
                <X size={19} />
              </button>
            </header>
            <RulesText game={activeGame} language={languageMode} />
          </section>
        </div>
      )}
    </main>
  );
}
