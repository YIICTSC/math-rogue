import React, { useEffect, useId, useState } from 'react';
import type { LanguageMode } from '../../types';
import { say } from './catalog';
import { dominoFaces } from './domino';
import { gridCells, type GridMove } from './dominoGrid';
import {
  keepLeftLayout,
  LANE_BLOCK,
  LANE_BUYBACK,
  LANE_CHALLENGE,
  LANE_DECLARE,
  NOS_CONTRACTS,
  NOS_ENGLISH,
} from './dominoLanes';
import { isMeld, orientedChain } from './dominoSets';
import { BINGO_CLAIM, BINGO_CLOSE } from './dominoTricks';
import { DominoTable } from './DominoTable';
import type { TableView } from './engine';
import type { TableAction } from './model';
import { Piece, pipPositions } from './Pieces';

type Kind = 'domino-lanes' | 'domino-grid' | 'domino-tricks' | 'domino-sets';
type Props<K extends Kind> = {
  view: Extract<TableView, { kind: K }>;
  language: LanguageMode;
  send: (action: TableAction) => void;
  disabled?: boolean;
};
type Labels = (ja: string, en: string, kana?: string) => string;
const labels =
  (language: LanguageMode): Labels =>
  (ja, en, kana) =>
    say(language, [ja, en, kana]);
const face = (tile: number) => dominoFaces(tile).join('–');
const match = (tile: number, other: number) =>
  face(tile) === face(other) || dominoFaces(tile).reverse().join('–') === face(other);
function Tile({
  tile,
  onClick,
  selected,
  enabled = true,
}: {
  tile: number;
  onClick: () => void;
  selected?: boolean;
  enabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="tt-tile-button"
      aria-label={face(tile)}
      aria-pressed={!!selected}
      disabled={!enabled}
      data-playable={enabled || undefined}
      onClick={onClick}
    >
      <Piece tile={tile} family="domino" />
    </button>
  );
}
function Hand({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="tt-hand" aria-label={label}>
      {children}
    </section>
  );
}
const active = (v: TableView, disabled?: boolean) =>
  !disabled && v.phase === 'play' && v.turn === v.self;
const handLabel = (l: Labels) => l('手牌', 'Your tiles', 'てはい');
const passLabel = (l: Labels) => l('パス', 'Pass', 'パス');
const drawLabel = (l: Labels, stock: number) =>
  l('山から引く', 'Draw from stock', 'やまから ひく') + ' · ' + stock;
const endLabel = (l: Labels, n: number, count: number) =>
  n < 0
    ? l('中央に置く', 'Play in the center', 'ちゅうおうに おく')
    : count === 2
      ? n === 0
        ? l('左端', 'Left end', 'ひだりはし')
        : l('右端', 'Right end', 'みぎはし')
      : l('列', 'Arm', 'れつ') + ' ' + (n + 1);

function optionLabel(v: Props<'domino-lanes'>['view'], value: number, l: Labels) {
  if (v.stage === 'contract') return l(NOS_CONTRACTS[value], NOS_ENGLISH[value]);
  if (v.stage === 'condition') {
    if (v.contract !== 10)
      return value === 0
        ? l('横はノーマル', 'Horizontal is ordinary')
        : l('横はロシア', 'Horizontal is Russian');
    const switching = Math.floor(value / 10);
    const side = Math.floor(value / 5) % 2 ? l('右から', 'Right first') : l('左から', 'Left first');
    const count = value % 5 ? ' · ' + (value % 5) : l(' · 両端を順に', ' · alternate ends');
    return (
      side +
      count +
      ' · ' +
      [
        l('ノーマル', 'Ordinary'),
        l('ロシア', 'Russian'),
        l('途中からロシア', 'Switch to Russian'),
        l('途中からノーマル', 'Switch to ordinary'),
      ][switching]
    );
  }
  if (value === LANE_CHALLENGE) return l('ブラフを指摘', 'Challenge bluff');
  if (value === LANE_BLOCK) return l('ブロックを宣言', 'Call a block');
  if (value === LANE_BUYBACK) return l('罰点を買い戻す · 1チップ', 'Buy back penalties · 1 chip');
  if (value === LANE_DECLARE) return l('ダブルを公開', 'Declare doubles');
  if (v.game === 'buki') return l('チップを賭ける', 'Stake chips') + ' ' + value;
  return (
    (v.game === 'billitonnen'
      ? l('めくって試す', 'Reveal and try')
      : l('端の牌を取る', 'Take end tile')) +
    ' · ' +
    endLabel(l, value, v.lines.length)
  );
}

function LaneBoard({ view: v, language, send, disabled }: Props<'domino-lanes'>) {
  const l = labels(language),
    ready = active(v, disabled);
  const [tile, setTile] = useState<number | null>(null);
  const [claimEnd, setClaimEnd] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setTile(null);
    setClaimEnd(null);
  }, [v.revision]);
  useEffect(() => {
    if (!v.deadline) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [v.deadline]);
  const moves = v.actions.filter((a) => a.type === 'place');
  const claims = v.actions.filter((a) => a.type === 'claim');
  const pairs = v.actions.filter((a) => a.type === 'pair');
  const selected = moves.filter((a) => a.tile === tile || v.game === 'billitonnen');
  const selectedClaims = claims.filter((a) => a.tile === tile);
  const chosenPairs = pairs.filter((a) => a.tile === tile || a.other === tile);
  const ends = [
    ...new Set([...selected.map((a) => a.end % 8), ...selectedClaims.map((a) => a.end)]),
  ];
  const chooseEnd = (end: number) => {
    if (!ready) return;
    if (selectedClaims.length) {
      setClaimEnd(end);
      return;
    }
    const choices = selected.filter((a) => a.end % 8 === end);
    if (choices.length === 1) send(choices[0]);
  };
  const shown = v.declared.flatMap((tiles, i) =>
    [...tiles, ...v.shown[i]].map((tile) => ({ tile, i })),
  );
  const status =
    v.stage === 'contract'
      ? l('親がつなぎ方を宣言', 'Dealer declares the contract')
      : v.stage === 'condition'
        ? l('つなぐ順番とルールを指定', 'Set the order and matching rules')
        : v.stage === 'declare'
          ? l('ダブルの手役を宣言できます', 'Declare your doubles')
          : v.stage === 'early-double'
            ? l('先にダブルをつなぐかパス', 'Play an early double or pass')
            : v.game === 'bluffing'
              ? v.stage === 'react'
                ? l('伏せた牌の宣言を確認', 'Challenge or accept the face-down play')
                : l('場の目は宣言された値', 'Board shows the claimed pips')
              : v.game === 'buki'
                ? l('バンカー', 'Banker') +
                  ' · ' +
                  v.players[v.dealer].name +
                  ' · ' +
                  v.players.map((p, i) => p.name + ' ' + v.bets[i]).join(' / ')
                : v.game === 'nos' && v.hub !== null
                  ? l(NOS_CONTRACTS[v.contract], NOS_ENGLISH[v.contract])
                  : v.game === 'pulle'
                    ? l('プール', 'Pot') +
                      ' ' +
                      v.pool +
                      ' · ' +
                      l('チップ', 'Your chips') +
                      ' ' +
                      v.chips[v.self]
                    : '';
  return (
    <>
      <section className="tt-playfield tt-domino-field tt-extra-lanes">
        {(status || v.dice.length > 0 || v.deadline) && (
          <div className="tt-extra-status">
            {status}
            {v.dice.length > 0 && (
              <>
                <b>
                  {l('花', 'Flower')} {v.dice.slice(0, 2).join(' · ')}
                </b>
                <b>
                  {l('サソリ', 'Scorpion')} {v.dice.slice(2).join(' · ')}
                </b>
              </>
            )}
            {v.deadline && (
              <b aria-label={l('残り秒数', 'Seconds remaining')}>
                {Math.max(0, Math.ceil((v.deadline - now) / 1000))} s · {v.played}/3
              </b>
            )}
          </div>
        )}
        <DominoTable
          view={v}
          language={language}
          label={(i) => endLabel(l, i, v.lines.length)}
          targets={ready ? ends.filter((i) => i >= 0) : []}
          place={chooseEnd}
          fixedLayout={v.game === 'keep-left' ? keepLeftLayout(v) : undefined}
        />
      </section>
      <div className="tt-play-actions">
        {v.revealed !== null && (
          <small>
            {l('公開した牌', 'Revealed tile')} {face(v.revealed)}
          </small>
        )}
        {shown.length > 0 && (
          <small>
            {shown.map(({ tile, i }) => v.players[i].name + ' ' + face(tile)).join(' / ')}
          </small>
        )}
        {ready && (
          <>
            {(v.stage === 'contract' || v.stage === 'condition') && (
              <label className="tt-extra-select">
                {l('親の宣言', 'Dealer declaration')}
                <select
                  value=""
                  onChange={(event) => send({ type: 'option', value: Number(event.target.value) })}
                >
                  <option value="" disabled>
                    {l('つなぎ方を選ぶ', 'Choose the matching rules')}
                  </option>
                  {v.actions
                    .filter((a) => a.type === 'option')
                    .map((a) => (
                      <option value={a.value} key={a.value}>
                        {optionLabel(v, a.value, l)}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {v.actions
              .filter(
                (a) =>
                  (a.type === 'option' && v.stage !== 'contract' && v.stage !== 'condition') ||
                  a.type === 'draw' ||
                  a.type === 'pass',
              )
              .map((a) => (
                <button
                  type="button"
                  key={a.type === 'option' ? a.value : a.type}
                  onClick={() => send(a)}
                >
                  {a.type === 'option'
                    ? optionLabel(v, a.value, l)
                    : a.type === 'draw'
                      ? drawLabel(l, v.stock)
                      : v.stage === 'react'
                        ? l('宣言を受け入れる', 'Accept claim')
                        : passLabel(l)}
                </button>
              ))}
            {ends.includes(-1) && selectedClaims.length > 0 && claimEnd === null && (
              <button type="button" onClick={() => chooseEnd(-1)}>
                {endLabel(l, -1, v.lines.length)}
              </button>
            )}
            {selected.map((a) => (
              <button type="button" key={a.end} onClick={() => send(a)}>
                {endLabel(l, a.end % 8, v.lines.length)}
                {a.end >= 8
                  ? ' · ' + dominoFaces(a.tile).reverse().join('–')
                  : ' · ' + face(a.tile)}
              </button>
            ))}
            {selectedClaims.length > 0 && (
              <label className="tt-extra-select">
                {l('宣言する目', 'Claimed face')}
                <select
                  aria-label={l('宣言する目', 'Claimed face')}
                  value=""
                  onChange={(event) => {
                    const a = selectedClaims[Number(event.target.value)];
                    if (a) send(a);
                  }}
                >
                  <option value="">{l('つなぐ側と目を選ぶ', 'Choose an end and pips')}</option>
                  {selectedClaims.map(
                    (a, i) =>
                      (claimEnd === null || a.end === claimEnd) && (
                        <option key={i} value={i}>
                          {endLabel(l, a.end, v.lines.length)} · {face(a.face)}
                          {match(a.tile, a.face) ? ' ✓' : ''}
                        </option>
                      ),
                  )}
                </select>
              </label>
            )}
            {chosenPairs.map((a) => (
              <button type="button" key={a.tile + '/' + a.other} onClick={() => send(a)}>
                {endLabel(l, 0, 2)} {face(a.tile)} · {endLabel(l, 1, 2)} {face(a.other)}
              </button>
            ))}
          </>
        )}
      </div>
      <Hand label={handLabel(l)}>
        {v.game === 'billitonnen' &&
          Array.from({ length: v.counts[v.self] }, (_, i) => (
            <span key={i} className="tt-blind-domino" aria-hidden="true">
              ◆
            </span>
          ))}
        {v.hand.map((t) => (
          <Tile
            key={t}
            tile={t}
            selected={tile === t}
            enabled={
              ready &&
              (moves.some((a) => a.tile === t) ||
                pairs.some((a) => a.tile === t || a.other === t) ||
                claims.some((a) => a.tile === t))
            }
            onClick={() => {
              setClaimEnd(null);
              const legal = moves.filter((a) => a.tile === t);
              if (legal.length === 1 && !pairs.some((a) => a.tile === t || a.other === t))
                send(legal[0]);
              else setTile(tile === t ? null : t);
            }}
          />
        ))}
      </Hand>
    </>
  );
}
function GridBoard({ view: v, language, send, disabled }: Props<'domino-grid'>) {
  const l = labels(language),
    ready = active(v, disabled),
    sky = v.game === 'skyscraper';
  const [tile, setTile] = useState<number | null>(null);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [flip, setFlip] = useState(false);
  useEffect(() => {
    setTile(null);
    setOrientation('horizontal');
    setFlip(false);
  }, [v.revision]);
  const glow = useId();
  const moves = v.actions.filter((a) => a.type === 'grid');
  const candidates = moves.filter((a) => a.tile === tile);
  const both = candidates.some((a) => a.flip) && candidates.some((a) => !a.flip);
  const sides = new Set(candidates.map((a) => a.vertical));
  const oriented = candidates.filter(
    (a) => sides.size < 2 || a.vertical === (orientation === 'vertical'),
  );
  const chosen = oriented.filter((a) => !both || a.flip === flip);
  const positions = [
    ...v.cells,
    ...chosen.flatMap((m) => gridCells(m)),
    { x: 0, y: 0 },
    { x: sky ? 3 : 1, y: sky ? 3 : 1 },
  ];
  const minX = Math.min(...positions.map((c) => c.x)),
    maxX = Math.max(...positions.map((c) => c.x));
  const minY = Math.min(...positions.map((c) => c.y)),
    maxY = Math.max(...positions.map((c) => c.y));
  const tileClick = (move: GridMove) => {
    if (ready) send(move);
  };
  return (
    <>
      <section className="tt-playfield tt-grid-field">
        <div className="tt-extra-status">
          {sky
            ? v.cells.length < 16
              ? l('4×4の土台を作る', 'Build the 4×4 base')
              : l('同じ高さに重ねる', 'Stack on matching heights')
            : v.game === 'broadway'
              ? v.turn % 2
                ? l('縦置きの手番', 'Vertical placement')
                : l('横置きの手番', 'Horizontal placement')
              : l('繰り返しの形を作る', 'Extend a repeating pattern')}
        </div>
        <svg
          className="tt-grid-svg"
          role="group"
          aria-label={l('ドミノの盤面', 'Domino table')}
          viewBox={`${minX * 32 - 6} ${minY * 32 - 6} ${(maxX - minX + 1) * 32 + 12} ${(maxY - minY + 1) * 32 + 12}`}
        >
          <defs>
            <linearGradient id={glow} x2="1" y2="1">
              <stop stopColor="#fffbed" />
              <stop offset="1" stopColor="#cdbc9d" />
            </linearGradient>
          </defs>
          {sky &&
            Array.from({ length: 16 }, (_, i) => (
              <rect
                key={i}
                x={(i % 4) * 32}
                y={Math.floor(i / 4) * 32}
                width="31"
                height="31"
                rx="3"
                fill="#3b3227"
              />
            ))}
          {v.cells.map((c) => (
            <g key={c.x + ',' + c.y} transform={`translate(${c.x * 32} ${c.y * 32})`}>
              <rect
                width="31.7"
                height="31.7"
                rx="2"
                fill={`url(#${glow})`}
                stroke={c.height % 2 ? '#7f6f56' : '#2b7570'}
                strokeWidth={c.height > 1 ? 1.7 : 0.65}
              />
              {pipPositions(c.pip).map((i) => (
                <circle
                  key={i}
                  cx={8 + (i % 3) * 8}
                  cy={8 + Math.floor(i / 3) * 8}
                  r="2.25"
                  fill="#2f2723"
                />
              ))}
              {sky && c.height > 1 && (
                <text x="28" y="29" textAnchor="end">
                  {c.height}
                </text>
              )}
            </g>
          ))}
          {chosen.map((move, i) => {
            const title =
              l('ここに置く', 'Place here') +
              ` ${move.x + 1}, ${move.y + 1} · ${move.vertical ? '↕' : '↔'}`;
            return (
              <g
                key={i}
                role="button"
                tabIndex={ready ? 0 : -1}
                aria-label={title}
                onClick={() => tileClick(move)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    tileClick(move);
                  }
                }}
                className="tt-grid-target"
              >
                <title>{title}</title>
                <rect
                  x={move.x * 32 + 1}
                  y={move.y * 32 + 1}
                  width={move.vertical ? 28 : 60}
                  height={move.vertical ? 60 : 28}
                  rx="5"
                  pointerEvents="none"
                />
                <rect
                  className="tt-grid-hit"
                  x={move.x * 32 + 1}
                  y={move.y * 32 + 1}
                  width="29"
                  height="29"
                  rx="5"
                />
                <text x={move.x * 32 + 15} y={move.y * 32 + 20} textAnchor="middle">
                  {move.vertical ? '↕' : '↔'}
                </text>
              </g>
            );
          })}
        </svg>
      </section>
      <div className="tt-play-actions">
        {ready && v.actions.some((a) => a.type === 'pass') && (
          <button type="button" onClick={() => send({ type: 'pass' })}>
            {passLabel(l)}
          </button>
        )}
        {ready && candidates.some((a) => a.vertical) && candidates.some((a) => !a.vertical) && (
          <button
            type="button"
            onClick={() => setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal')}
          >
            {orientation === 'horizontal'
              ? l('縦置きに切替', 'Switch to vertical')
              : l('横置きに切替', 'Switch to horizontal')}
          </button>
        )}
        {ready && both && (
          <button type="button" onClick={() => setFlip(!flip)}>
            {l('目の向きを反転', 'Flip tile')}
          </button>
        )}
      </div>
      <Hand label={handLabel(l)}>
        {v.hand.map((t) => (
          <Tile
            key={t}
            tile={t}
            enabled={ready && moves.some((a) => a.tile === t)}
            selected={tile === t}
            onClick={() => {
              setTile(tile === t ? null : t);
              setOrientation('horizontal');
              setFlip(false);
            }}
          />
        ))}
      </Hand>
    </>
  );
}

function TrickBoard({ view: v, language, send, disabled }: Props<'domino-tricks'>) {
  const l = labels(language),
    ready = active(v, disabled),
    bingo = v.game === 'bingo';
  const [pick, setPick] = useState<number[]>([]);
  const [lead, setLead] = useState<number | null>(null);
  useEffect(() => {
    setPick([]);
    setLead(null);
  }, [v.revision]);
  const moves = v.actions.filter((a) => a.type === 'place');
  const declaration = v.actions.find((a) => a.type === 'tiles');
  const playable = (tile: number) =>
    moves.some((a) => a.tile === tile) ||
    (!!declaration && (!bingo || declaration.tiles.includes(tile)));
  const spot = (trick: typeof v.trick) =>
    trick.map(({ seat, tile }) => (
      <div key={seat} className="tt-trick-tile">
        <small>{v.players[seat].name}</small>
        <Piece family="domino" tile={tile} />
      </div>
    ));
  return (
    <>
      <section className="tt-playfield tt-extra-scroll">
        <div className="tt-extra-status">
          {v.stage === 'exchange' ? (
            l('左隣へ渡す牌を3枚選択', 'Choose three tiles to pass left')
          ) : (
            <>
              {v.suit !== null && (
                <b>
                  {l('リード', 'Led suit')} {v.suit === 7 ? l('ダブル', 'Doubles') : v.suit}
                </b>
              )}
              {bingo && (
                <b>
                  {l('切札', 'Trump')} {v.trump} ·{' '}
                  {v.closer === null && v.stock
                    ? l('補充あり', 'Open stock')
                    : l('フォロー必須', 'Must follow')}
                </b>
              )}
            </>
          )}
          {v.indicator !== null && <Piece family="domino" tile={v.indicator} />}
        </div>
        <div className="tt-trick-tiles">
          {v.trick.length ? (
            spot(v.trick)
          ) : v.lastTrick.length ? (
            <>
              <small>{l('直前のトリック', 'Last trick')}</small>
              {spot(v.lastTrick)}
            </>
          ) : null}
        </div>
        <div className="tt-extra-status">
          {v.trickCounts.map((n, i) => (
            <span key={i}>
              {v.players[i].name} · {n} {l('トリック', 'tricks')}
            </span>
          ))}
        </div>
      </section>
      <div className="tt-play-actions">
        {ready && (
          <>
            {bingo && declaration && (
              <button
                type="button"
                onClick={() => {
                  if (pick.length >= 2) send({ type: 'tiles', tiles: pick });
                  else setPick(declaration.tiles);
                }}
              >
                {pick.length >= 2
                  ? l('選んだダブルを宣言', 'Declare selected doubles')
                  : l('ダブルを選ぶ', 'Select doubles')}
              </button>
            )}
            {v.stage === 'exchange' && (
              <button
                type="button"
                disabled={pick.length !== 3}
                onClick={() => send({ type: 'tiles', tiles: pick })}
              >
                {l('3枚を左隣に渡す', 'Pass three tiles left')} · {pick.length}
                /3
              </button>
            )}
            {moves
              .filter((a) => a.tile === lead)
              .map((a) => (
                <button key={a.end} type="button" onClick={() => send(a)}>
                  {l('リード', 'Lead')} · {a.end === 7 ? l('ダブル', 'Doubles') : a.end}
                </button>
              ))}
            {v.actions
              .filter((a) => a.type === 'option' || a.type === 'pass')
              .map((a) => (
                <button
                  key={a.type === 'option' ? a.value : 'pass'}
                  type="button"
                  onClick={() => send(a)}
                >
                  {a.type === 'option'
                    ? a.value === BINGO_CLAIM
                      ? l('70点を宣言', 'Claim 70')
                      : a.value === BINGO_CLOSE
                        ? l('クローズ', 'Close stock')
                        : l('リードを譲る', 'Yield the lead')
                    : passLabel(l)}
                </button>
              ))}
          </>
        )}
      </div>
      <Hand label={handLabel(l)}>
        {v.hand.map((tile) => (
          <Tile
            key={tile}
            tile={tile}
            selected={pick.includes(tile) || lead === tile}
            enabled={ready && playable(tile)}
            onClick={() => {
              if (v.stage === 'exchange' || (bingo && declaration && pick.length)) {
                if (v.stage === 'exchange' || declaration?.tiles.includes(tile)) {
                  setPick(
                    pick.includes(tile)
                      ? pick.filter((t) => tile !== t)
                      : [...pick, tile].slice(0, bingo ? 7 : 3),
                  );
                  return;
                }
              }
              const choices = moves.filter((a) => a.tile === tile);
              if (choices.length === 1) send(choices[0]);
              else setLead(lead === tile ? null : tile);
            }}
          />
        ))}
      </Hand>
    </>
  );
}

function SetsBoard({ view: v, language, send, disabled }: Props<'domino-sets'>) {
  const l = labels(language),
    shanghai = v.game === 'shanghai',
    ready = active(v, disabled);
  const [picked, setPicked] = useState<number[]>([]);
  const [draft, setDraft] = useState<number[][] | null>(null);
  const [group, setGroup] = useState(0);
  useEffect(() => {
    setPicked([]);
    setDraft(null);
    setGroup(0);
  }, [v.revision]);
  const sample = v.actions.find((a) => a.type === 'tiles' || a.type === 'meld');
  const groups = draft ?? v.groups;
  const opened = v.opened[v.self];
  const draftValid = draft
    ? draft.filter((g) => g.length).every(isMeld) &&
      draft.flat().some((tile) => v.hand.includes(tile))
    : false;
  const valid = opened ? draftValid : picked.length === 3 && isMeld(picked);
  const chain = shanghai && picked.length ? orientedChain(picked, v.dice) : undefined;
  return (
    <>
      <section className="tt-playfield tt-extra-scroll">
        <div className="tt-extra-status">
          {shanghai ? (
            <>
              <b>
                {l('サイコロ', 'Dice')} {v.dice.join(' → ')}
              </b>
              <span>
                {l('成功した列', 'Chains this turn')} {v.chains}
              </span>
            </>
          ) : (
            <b>
              {opened
                ? l('組を組み替えて手牌を足す', 'Rearrange the groups and add a tile')
                : l('初回は手牌だけで3枚組を作る', 'Build your first group with three tiles')}
            </b>
          )}
        </div>
        {shanghai && picked.length > 0 && (
          <div className="tt-set-row">
            <b>{l('選択中', 'Your chain')}</b>
            {picked.map((t) => (
              <Tile
                key={t}
                tile={t}
                onClick={() => setPicked(picked.filter((tile) => tile !== t))}
              />
            ))}
          </div>
        )}
        {groups.map((tiles, index) => (
          <div
            className="tt-set-row"
            key={index}
            data-selected={draft && group === index ? true : undefined}
          >
            {draft && (
              <button type="button" aria-pressed={group === index} onClick={() => setGroup(index)}>
                {l('組', 'Group')} {index + 1}
              </button>
            )}
            {tiles.map((tile, i) =>
              draft && ready ? (
                <Tile
                  key={tile}
                  tile={tile}
                  onClick={() => {
                    if (group !== index)
                      setDraft(
                        draft.map((g, j) =>
                          j === index
                            ? g.filter((t) => t !== tile)
                            : j === group
                              ? [...g, tile]
                              : g,
                        ),
                      );
                    else if (v.hand.includes(tile))
                      setDraft(
                        draft.map((g, j) => (j === index ? g.filter((t) => t !== tile) : g)),
                      );
                  }}
                />
              ) : (
                <Piece key={i} tile={tile} family="domino" />
              ),
            )}
          </div>
        ))}
        {!groups.length && !shanghai && (
          <p>{l('まだ場に組がありません', 'No groups on the table yet')}</p>
        )}
      </section>
      <div className="tt-play-actions">
        {ready && (
          <>
            {shanghai && (
              <button
                disabled={!chain}
                type="button"
                onClick={() => send({ type: 'tiles', tiles: picked })}
              >
                {l('この順番でつなぐ', 'Play this chain')}
              </button>
            )}
            {!shanghai && !opened && (
              <button
                disabled={!valid}
                type="button"
                onClick={() => send({ type: 'meld', groups: [...v.groups, picked] })}
              >
                {l('最初の組を出す', 'Play starting group')}
              </button>
            )}
            {!shanghai &&
              opened &&
              (draft ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft([...draft, []]);
                      setGroup(draft.length);
                    }}
                  >
                    {l('新しい組', 'New group')}
                  </button>
                  <button
                    type="button"
                    disabled={!valid}
                    onClick={() =>
                      send({
                        type: 'meld',
                        groups: draft.filter((g) => g.length),
                      })
                    }
                  >
                    {l('組み替えを確定', 'Confirm groups')}
                  </button>
                  <button type="button" onClick={() => setDraft(null)}>
                    {l('取り消す', 'Cancel')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setGroup(0);
                    setDraft(v.groups.map((g) => [...g]));
                  }}
                >
                  {l('組を編集', 'Edit groups')}
                </button>
              ))}
            {sample && !draft && (
              <button
                type="button"
                onClick={() => {
                  if (sample.type === 'tiles') setPicked(sample.tiles);
                  else if (opened) {
                    setDraft(sample.groups);
                    setGroup(sample.groups.length - 1);
                  } else setPicked(sample.groups.at(-1)!);
                }}
              >
                {l('置き方の例', 'Show one option')}
              </button>
            )}
            {v.actions.some((a) => a.type === 'draw') && (
              <button type="button" onClick={() => send({ type: 'draw' })}>
                {drawLabel(l, v.stock)}
              </button>
            )}
            {v.actions.some((a) => a.type === 'pass') && (
              <button type="button" onClick={() => send({ type: 'pass' })}>
                {passLabel(l)}
              </button>
            )}
          </>
        )}
      </div>
      <Hand label={handLabel(l)}>
        {v.hand
          .filter((tile) => !draft?.flat().includes(tile))
          .map((tile) => (
            <Tile
              key={tile}
              tile={tile}
              enabled={ready && (shanghai || !opened || draft !== null)}
              selected={picked.includes(tile)}
              onClick={() => {
                if (draft) setDraft(draft.map((g, i) => (i === group ? [...g, tile] : g)));
                else
                  setPicked(
                    picked.includes(tile)
                      ? picked.filter((t) => t !== tile)
                      : [...picked, tile].slice(0, shanghai ? 56 : 3),
                  );
              }}
            />
          ))}
      </Hand>
    </>
  );
}

export function ExtraDominoBoard(props: {
  view: Extract<TableView, { kind: Kind }>;
  language: LanguageMode;
  send: (action: TableAction) => void;
  disabled?: boolean;
}) {
  const { view, ...rest } = props;
  switch (view.kind) {
    case 'domino-lanes':
      return <LaneBoard view={view} {...rest} />;
    case 'domino-grid':
      return <GridBoard view={view} {...rest} />;
    case 'domino-tricks':
      return <TrickBoard view={view} {...rest} />;
    case 'domino-sets':
      return <SetsBoard view={view} {...rest} />;
  }
}
