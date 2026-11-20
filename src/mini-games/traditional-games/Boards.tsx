import { DominoTable } from './DominoTable';
import React, { useEffect, useRef, useState } from 'react';
import type { LanguageMode } from '../../types';
import {
  aimAt,
  PEGS,
  pullShot,
  resolveShot,
  shotOrigin,
  shotVector,
  type Disc,
  type Shot,
} from './crokinole';
import { openPips } from './domino';
import type { TableView } from './engine';
import type { TableAction } from './model';
import { peeperSelection } from './peeper';
import { say } from './catalog';
import { Piece, pieceLabel } from './Pieces';
import { Face } from '../card-club/ClubSetup';

type Send = (action: TableAction) => void;
type Props<T extends TableView['kind']> = {
  view: Extract<TableView, { kind: T }>;
  language: LanguageMode;
  send: Send;
  disabled?: boolean;
};
type TileProps = {
  tile: number;
  family: 'domino' | 'peeper' | 'goita';
  language: LanguageMode;
  selected?: boolean;
  playable?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function TileButton({ tile, family, language, selected, playable, disabled, onClick }: TileProps) {
  return (
    <button
      className="tt-tile-button"
      type="button"
      aria-label={pieceLabel(tile, family, language)}
      aria-pressed={selected}
      data-playable={playable || undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <Piece tile={tile} family={family} />
    </button>
  );
}
function Hand({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section className="tt-hand" aria-label={label}>
      {children}
    </section>
  );
}
export function DominoBoard({ view: v, language, send, disabled }: Props<'domino'>) {
  const [tile, pick] = useState<number | null>(null);
  const l = (ja: string, en: string, kana?: string) => say(language, [ja, en, kana]);
  const moves = v.actions.filter((a) => a.type === 'place');
  const chosen = moves.filter((a) => a.tile === tile);
  const available = !disabled && v.phase === 'play' && v.turn === v.self;
  const label = (i: number) => {
    if (v.game === 'mexican') {
      if (i === v.players.length) return l('共有列', 'Shared train', 'きょうゆうれつ');
      return v.players[i].name + (v.lines[i].public ? ' · ' + l('開放', 'Open', 'かいほう') : '');
    }
    if (i === 0 && v.lines.length === 2) return l('左端', 'Left end', 'ひだりはし');
    if (i === 1 && v.lines.length === 2) return l('右端', 'Right end', 'みぎはし');
    return l('列', 'Arm', 'れつ') + ' ' + (i + 1);
  };
  return (
    <>
      <section className="tt-playfield tt-domino-field">
        {['five-up', 'sniff', 'seven-rocks', 'bergen', 'fives-threes'].includes(v.game) &&
          v.hub !== null && (
            <div className="tt-domino-total">
              {l('端の合計', 'Exposed total', 'はしの ごうけい')} <b>{openPips(v)}</b>
            </div>
          )}
        <DominoTable
          view={v}
          language={language}
          label={label}
          targets={available ? chosen.map((a) => a.end) : []}
          place={(end) => {
            const target = chosen.find((a) => a.end === end);
            if (available && target) send(target);
          }}
        />
      </section>
      <div className="tt-play-actions">
        {v.actions.some((a) => a.type === 'draw') && (
          <button type="button" disabled={disabled} onClick={() => send({ type: 'draw' })}>
            {l('山から1枚引く', 'Draw a tile', 'やまから 1まい ひく')} · {v.stock}
          </button>
        )}
        {v.actions.some((a) => a.type === 'pass') && (
          <button type="button" disabled={disabled} onClick={() => send({ type: 'pass' })}>
            {v.game === 'mexican' && v.trainOpening[v.self]
              ? l('最初の手番を終える', 'Finish opening turn', 'さいしょの てばんを おえる')
              : l('パス', 'Pass', 'パス')}
          </button>
        )}
        {chosen.length > 1 && (
          <small>
            {l(
              '光っている列端を選択',
              'Choose a highlighted end',
              'ひかっている れつはしを えらぶ',
            )}
          </small>
        )}
      </div>
      <small className="tt-playable-help">
        {l(
          '光っている牌を出せます',
          'Highlighted tiles can be played',
          'ひかっている はいを だせます',
        )}
      </small>
      <Hand label={l('手牌', 'Your tiles', 'てはい')}>
        {v.hand.map((id) => {
          const options = moves.filter((a) => a.tile === id);
          return (
            <TileButton
              key={id}
              family="domino"
              language={language}
              tile={id}
              selected={id === tile}
              playable={available && options.length > 0}
              disabled={!available || !options.length}
              onClick={() =>
                options.length === 1 ? send(options[0]) : pick(id === tile ? null : id)
              }
            />
          );
        })}
      </Hand>
    </>
  );
}

export function FortyTwoBoard({ view: v, language, send, disabled }: Props<'forty-two'>) {
  const l = (ja: string, en: string, kana?: string) => say(language, [ja, en, kana]);
  const tiles = v.trick.length ? v.trick : v.lastTrick;
  return (
    <>
      <section className="tt-playfield tt-trick-field">
        <div className="tt-trick-heading">
          <span>
            {l('契約', 'Contract', 'けいやく')} <b>{v.bid || '—'}</b>{' '}
            {v.bid > 0 && v.players[v.bidder].name}
          </span>
          <span>
            {l('切り札', 'Trump', 'きりふだ')} <b>{v.trump ?? '—'}</b>
          </span>
          <span>
            {l('組の得点', 'Team points', 'くみの とくてん')} <b>{v.won.join(' : ')}</b>
          </span>
        </div>
        {!tiles.length && (
          <div className="tt-empty">
            {v.stage === 'bid'
              ? l('30点からビッド', 'Bid from 30', '30てんから ビッド')
              : v.stage === 'trump'
                ? l(
                    '契約を取った人が切り札を決めます',
                    'The declarer names trump',
                    'きりふだを きめます',
                  )
                : l(
                    '同じ目でフォローし、トリックを競います',
                    'Follow the lead and take the trick',
                    'おなじ めで フォロー',
                  )}
          </div>
        )}
        <div className="tt-trick-tiles">
          {tiles.map((t) => (
            <div key={t.seat}>
              <small>{v.players[t.seat].name}</small>
              <Piece tile={t.tile} family="domino" />
            </div>
          ))}
        </div>
      </section>
      <div className="tt-play-actions">
        {v.actions
          .filter((a) => a.type !== 'place')
          .map((a) => {
            const value = 'value' in a ? a.value : undefined;
            const label =
              a.type === 'pass'
                ? l('パス', 'Pass', 'パス')
                : a.type === 'bid' && (value ?? 0) > 42
                  ? `${value! / 42} ${l('マーク', 'marks', 'マーク')}`
                  : String(value);
            return (
              <button
                type="button"
                key={a.type + value}
                disabled={disabled}
                onClick={() => send(a)}
              >
                {label}
              </button>
            );
          })}
      </div>
      <Hand label={l('手牌', 'Your tiles', 'てはい')}>
        {v.hand.map((id) => {
          const action = v.actions.find((a) => a.type === 'place' && a.tile === id);
          return (
            <TileButton
              key={id}
              tile={id}
              family="domino"
              language={language}
              disabled={disabled || !action}
              playable={!disabled && !!action}
              onClick={() => action && send(action)}
            />
          );
        })}
      </Hand>
    </>
  );
}

const patterns = {
  single: ['1枚', 'Single', '1まい'],
  pair: ['ペア', 'Pair', 'ペア'],
  run: ['階段', 'Run', 'かいだん'],
  'pair-run': ['ペア階段', 'Pair run', 'ペアかいだん'],
  'bomb-one': ['ボム 1', 'Bomb 1', 'ボム 1'],
  'bomb-two': ['ボム 2', 'Bomb 2', 'ボム 2'],
  mine: ['マイン', 'Mine', 'マイン'],
  return: ['リターン', 'Return', 'リターン'],
} satisfies Record<string, [string, string, string]>;

export function PeeperBoard({ view: v, language, send, disabled }: Props<'peeper'>) {
  const [picked, setPicked] = useState<number[]>([]);
  const l = (ja: string, en: string, kana?: string) => say(language, [ja, en, kana]);
  const play = peeperSelection(picked, v.pile);
  const myTurn = !disabled && v.phase === 'play' && v.turn === v.self;
  const hint = v.actions.find((a) => a.type === 'tiles');
  return (
    <>
      <section className="tt-playfield tt-peeper-field">
        {v.pile ? (
          <>
            <div className="tt-peeper-combo">
              {v.players[v.pile.seat].name} · <b>{say(language, patterns[v.pile.kind])}</b>
            </div>
            <div className="tt-trick-tiles">
              {v.pile.tiles.map((id) => (
                <Piece key={id} tile={id} family="peeper" />
              ))}
            </div>
          </>
        ) : (
          <div className="tt-empty">
            {l('好きな役を出して場を始める', 'Lead with any pattern', 'すきな やくで はじめる')}
          </div>
        )}
        {!!v.discard && (
          <small>
            {l('場を離れた牌', 'Played tiles', 'でた はい')} {v.discard}
          </small>
        )}
      </section>
      <div className="tt-play-actions">
        {v.actions
          .filter((a) => a.type === 'mine' || a.type === 'return' || a.type === 'pass')
          .map((a) => (
            <button
              type="button"
              className={a.type !== 'pass' ? 'tt-primary' : undefined}
              key={a.type}
              disabled={disabled}
              onClick={() => send(a)}
            >
              {a.type === 'pass'
                ? l('パス', 'Pass', 'パス')
                : say(language, patterns[a.type as 'mine' | 'return'])}
            </button>
          ))}
        {myTurn && (
          <>
            <button
              type="button"
              disabled={!hint}
              onClick={() => {
                if (hint?.type === 'tiles') setPicked(hint.tiles);
              }}
            >
              {l('出せる役を選ぶ', 'Suggest a play', 'だせる やくを えらぶ')}
            </button>
            <button
              type="button"
              className="tt-primary"
              disabled={!play}
              onClick={() => play && send({ type: 'tiles', tiles: play.tiles, rank: play.rank })}
            >
              {play
                ? say(language, patterns[play.kind]) + ' · ' + l('出す', 'Play', 'だす')
                : l('選んだ牌を出す', 'Play selected tiles', 'えらんだ はいを だす')}
            </button>
          </>
        )}
      </div>
      <Hand label={l('手牌', 'Your tiles', 'てはい')}>
        {v.hand.map((id) => (
          <TileButton
            key={id}
            tile={id}
            family="peeper"
            language={language}
            selected={picked.includes(id)}
            disabled={!myTurn}
            onClick={() =>
              setPicked((old) =>
                old.includes(id) ? old.filter((tile) => tile !== id) : [...old, id],
              )
            }
          />
        ))}
      </Hand>
    </>
  );
}

export function GoitaBoard({ view: v, language, send, disabled }: Props<'goita'>) {
  const [cover, setCover] = useState<number | null>(null);
  const l = (ja: string, en: string, kana?: string) => say(language, [ja, en, kana]);
  const attacks = v.actions.filter((a) => a.type === 'goita');
  const mustCover = !!v.attack && v.attack.seat !== v.self;
  return (
    <>
      <section className="tt-playfield tt-goita-field">
        {v.award && (
          <div className="tt-goita-award">
            <b>
              {v.players[v.award.seat].name} ·{' '}
              {l('配牌の手役', 'Opening hand award', 'はいぱいの てやく')}
            </b>
            <div>
              {v.award.tiles.map((tile) => (
                <Piece key={tile} tile={tile} family="goita" />
              ))}
            </div>
          </div>
        )}
        {!!v.five.length && (
          <div className="tt-goita-five">
            {v.five.map((seat) => v.players[seat].name).join(' · ')} ·{' '}
            {l('五しです', 'Five pawns', 'ごしです')}
          </div>
        )}
        <div className="tt-goita-team-scores">
          <div data-team="ally">
            <span>{l('自分のペア', 'Your pair', 'じぶんの ペア')}</span>
            <strong>{v.scores[v.self]} / 150</strong>
          </div>
          <div data-team="opponent">
            <span>{l('相手のペア', 'Opposing pair', 'あいての ペア')}</span>
            <strong>{v.scores[(v.self + 1) % 4]} / 150</strong>
          </div>
        </div>
        <div className="tt-goita-table">
          <div
            className="tt-goita-partners"
            aria-label={l(
              '向かいの人が味方',
              'Your partner sits opposite you',
              'むかいの ひとが みかた',
            )}
          >
            {v.players.map((player, seat) => {
              const position = ['bottom', 'right', 'top', 'left'][(seat - v.self + 4) % 4];
              return (
                <div
                  key={player.id}
                  className="tt-goita-player"
                  data-position={position}
                  data-team={seat % 2 === v.self % 2 ? 'ally' : 'opponent'}
                  data-active={v.phase === 'play' && v.turn === seat}
                >
                  <Face hero={player.hero} />
                </div>
              );
            })}
          </div>
          {v.rows.map((row, seat) => {
            const relative = (seat - v.self + 4) % 4;
            const role =
              relative === 0
                ? l('あなた', 'You', 'あなた')
                : relative === 2
                  ? l('味方', 'Partner', 'みかた')
                  : l('相手', 'Opponent', 'あいて');
            return (
              <div
                className="tt-goita-row"
                key={seat}
                data-position={['bottom', 'right', 'top', 'left'][relative]}
                data-seat={seat}
                data-team={seat % 2 === v.self % 2 ? 'ally' : 'opponent'}
                data-active={v.phase === 'play' && v.turn === seat}
              >
                <small title={v.players[seat].name}>{v.players[seat].name}</small>
                <span className="tt-goita-role">{role}</span>
                <div className="tt-goita-columns">
                  {Array.from({ length: 4 }, (_, i) => {
                    const pair = row[i];
                    return (
                      <div className="tt-goita-column" key={i}>
                        {pair ? (
                          <>
                            <Piece family="goita" tile={pair.cover} />
                            <Piece family="goita" tile={pair.attack} />
                          </>
                        ) : (
                          <>
                            <i />
                            <i />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <div className="tt-play-actions">
        {v.actions
          .filter((a) => a.type === 'five')
          .map((a) => (
            <button key={String(a.accept)} disabled={disabled} onClick={() => send(a)}>
              {a.accept
                ? l('この手で続行', 'Play this deal', 'この てで つづける')
                : l('配り直し', 'Redeal', 'くばりなおし')}
            </button>
          ))}
        {v.actions.some((a) => a.type === 'pass') && (
          <button disabled={disabled} onClick={() => send({ type: 'pass' })}>
            {l('なし', 'Pass', 'なし')}
          </button>
        )}
        {attacks.length > 0 && (
          <small>
            {cover !== null
              ? l('攻める駒を選択', 'Pick your attack', 'せめる こまを えらぶ')
              : mustCover
                ? l('受けの駒を選択', 'Pick a cover', 'うけの こまを えらぶ')
                : l('伏せる駒を選択', 'Pick a hidden cover', 'ふせる こまを えらぶ')}
          </small>
        )}
        {cover !== null && (
          <button onClick={() => setCover(null)}>
            {l('受けを選び直す', 'Change cover', 'うけを えらびなおす')}
          </button>
        )}
      </div>
      <Hand label={l('持ち駒', 'Your pieces', 'もちごま')}>
        {v.hand.map((id) => {
          const move = attacks.find((a) =>
            cover === null ? a.cover === id : a.cover === cover && a.attack === id,
          );
          return (
            <TileButton
              key={id}
              family="goita"
              tile={id}
              language={language}
              selected={id === cover}
              disabled={disabled || !move}
              onClick={() => {
                if (move) cover === null ? setCover(id) : send(move);
              }}
            />
          );
        })}
      </Hand>
    </>
  );
}

const coordinate = (v: number) => 50 + v * 42 + '%';
export function CrokinoleBoard({ view: v, language, send, disabled }: Props<'crokinole'>) {
  const [angle, setAngle] = useState(0),
    [aim, setAim] = useState(0),
    [power, setPower] = useState(0.56);
  const [replay, setReplay] = useState<Disc[] | null>(null);
  const [busy, setBusy] = useState(false);
  const pull = useRef<{
    id: number;
    x: number;
    y: number;
    scale: number;
    angle: number;
    control: HTMLElement;
  } | null>(null);
  const [draw, setDraw] = useState<{ x: number; y: number } | null>(null);
  const l = (ja: string, en: string, kana?: string) => say(language, [ja, en, kana]);
  const last = v.lastShot;
  useEffect(() => {
    if (!last) {
      setReplay(null);
      setBusy(false);
      return;
    }
    const p = resolveShot(last.before, last.seat, v.players.length, last.shot, last.discId, true);
    let id = 0;
    setReplay(p.frames[0]);
    setBusy(true);
    const start = performance.now();
    const tick = (now: number) => {
      const frame = Math.floor(((now - start) * p.frames.length) / 1350);
      if (frame >= p.frames.length) {
        setReplay(null);
        setBusy(false);
        return;
      }
      setReplay(p.frames[frame]);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [last?.discId, v.round, v.players.length]);
  const active = !disabled && !busy && v.phase === 'play' && v.turn === v.self;
  const cancelPull = () => {
    const held = pull.current;
    pull.current = null;
    setDraw(null);
    if (held?.control.hasPointerCapture(held.id)) held.control.releasePointerCapture(held.id);
  };
  useEffect(() => cancelPull(), [v.revision, disabled]);
  useEffect(
    () => () => {
      const held = pull.current;
      if (held?.control.hasPointerCapture(held.id)) held.control.releasePointerCapture(held.id);
      pull.current = null;
    },
    [],
  );
  const shot: Shot = { type: 'shot', angle, aim, power };
  const start = shotOrigin(v.self, v.players.length, angle);
  const velocity = shotVector(v.self, v.players.length, shot);
  const position = (x: number, y: number) => ({ left: coordinate(x), top: coordinate(y) });
  return (
    <>
      <div className="tt-croki-layout">
        <section
          className="tt-croki-board"
          aria-label={l('クロキノール盤', 'Crokinole board', 'クロキノールばん')}
          onPointerDown={(event) => {
            if (!active || pull.current || event.button !== 0) return;
            const box = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - box.left) / box.width - 0.5) / 0.42;
            const y = ((event.clientY - box.top) / box.height - 0.5) / 0.42;
            if (Math.hypot(x - start.x, y - start.y) * box.width * 0.42 <= 28) {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              pull.current = {
                id: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                scale: box.width * 0.42,
                angle,
                control: event.currentTarget,
              };
              setDraw({ x: 0, y: 0 });
              return;
            }
            setAim(
              aimAt(
                v.self,
                v.players.length,
                angle,
                ((event.clientX - box.left) / box.width - 0.5) / 0.42,
                ((event.clientY - box.top) / box.height - 0.5) / 0.42,
              ),
            );
          }}
          onPointerMove={(event) => {
            const held = pull.current;
            if (!held || held.id !== event.pointerId) return;
            const dx = (event.clientX - held.x) / held.scale;
            const dy = (event.clientY - held.y) / held.scale;
            const next = pullShot(v.self, v.players.length, held.angle, dx, dy);
            setAim(next.aim);
            setPower(next.power);
            const limit = Math.max(1, Math.hypot(dx, dy) / 0.19);
            setDraw({ x: dx / limit, y: dy / limit });
          }}
          onPointerUp={(event) => {
            const held = pull.current;
            if (!held || held.id !== event.pointerId) return;
            const dx = (event.clientX - held.x) / held.scale;
            const dy = (event.clientY - held.y) / held.scale;
            const origin = shotOrigin(v.self, v.players.length, held.angle);
            cancelPull();
            if (active && Math.hypot(dx, dy) * held.scale >= 9 && dx * origin.x + dy * origin.y > 0)
              send(pullShot(v.self, v.players.length, held.angle, dx, dy));
          }}
          onPointerCancel={(event) => {
            if (pull.current?.id === event.pointerId) cancelPull();
          }}
          onLostPointerCapture={(event) => {
            if (pull.current?.id === event.pointerId) cancelPull();
          }}
        >
          <div className="tt-outer-ring" />
          <div className="tt-ten-ring" />
          <div className="tt-fifteen-ring" />
          <div className="tt-quarters" />
          <div className="tt-hole" />
          {PEGS.map((p, i) => (
            <div key={i} className="tt-peg" style={position(p.x, p.y)} />
          ))}
          {(replay ?? v.discs).map((d) => (
            <span
              key={d.id}
              className={`tt-disc tt-disc-${d.seat % 2}`}
              style={position(d.x, d.y)}
            />
          ))}
          {active && (
            <>
              <span
                className="tt-aim-line"
                style={{
                  ...position(start.x, start.y),
                  width: `${12 + power * 30}%`,
                  transform: `rotate(${Math.atan2(velocity.vy, velocity.vx)}rad)`,
                }}
              />
              <span
                className={`tt-disc tt-disc-${v.self % 2} tt-preview-disc`}
                style={position(start.x + (draw?.x ?? 0), start.y + (draw?.y ?? 0))}
              />
            </>
          )}
        </section>
        <div className="tt-shot-controls">
          <p className="tt-pull-help">
            {l(
              '自分の円盤を引いて、指を離すと発射。大きく引くほど強く弾けます。',
              'Pull your disc back and release to shoot. Pull farther for more power.',
              'じぶんの えんばんを ひいて、はなすと はっしゃ。おおきく ひくほど つよく はじけます。',
            )}
          </p>
          <div className="tt-croki-points">
            {v.boardPoints.map((n, i) => (
              <small key={i}>
                {v.players[i].name} <b>{n}</b> · {l('残り', 'Left', 'のこり')} {v.remaining[i]}
              </small>
            ))}
          </div>
          <label>
            {l('発射位置', 'Launch position', 'はっしゃいち')}
            <input
              type="range"
              min="-1"
              max="1"
              step=".01"
              value={angle}
              disabled={!active}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
          </label>
          <label>
            {l('照準', 'Aim', 'しょうじゅん')}
            <input
              type="range"
              min="-1"
              max="1"
              step=".005"
              value={aim}
              disabled={!active}
              onChange={(e) => setAim(Number(e.target.value))}
            />
          </label>
          <label>
            {l('強さ', 'Power', 'つよさ')} <output>{Math.round(power * 100)}%</output>
            <input
              type="range"
              min=".05"
              max="1"
              step=".005"
              value={power}
              disabled={!active}
              onChange={(e) => setPower(Number(e.target.value))}
            />
          </label>
          <button
            className="tt-primary"
            type="button"
            disabled={!active}
            onClick={() => send(shot)}
          >
            {l('弾く', 'Flick', 'はじく')}
          </button>
        </div>
      </div>
    </>
  );
}

export function TableBoard({
  view,
  language,
  send,
  disabled,
}: {
  view: TableView;
  language: LanguageMode;
  send: Send;
  disabled?: boolean;
}) {
  const props = { language, send, disabled };
  const phaseKey = view.game + '-' + view.revision;
  switch (view.kind) {
    case 'domino':
      return <DominoBoard key={phaseKey} view={view} {...props} />;
    case 'forty-two':
      return <FortyTwoBoard view={view} {...props} />;
    case 'peeper':
      return <PeeperBoard key={phaseKey} view={view} {...props} />;
    case 'goita':
      return <GoitaBoard key={phaseKey} view={view} {...props} />;
    case 'crokinole':
      return <CrokinoleBoard view={view} {...props} />;
  }
}
