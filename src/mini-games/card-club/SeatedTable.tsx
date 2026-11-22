import React, { type CSSProperties } from 'react';
import { SeatHandCount } from '../shared/SeatHandCount';
import { CardFace } from './CardFace';
import { Face } from './ClubSetup';
import { TableStock } from './TableStock';
import { cardLabel, rank, SUITS, suit } from './cards';
import { definition } from './catalog';
import type { ClubView } from './model';
import { seatPosition, seatedTablePlays } from './seatedTable';

type TableProps = {
  view: ClubView;
  l: (jp: string, en: string) => string;
};
type SeatsProps = TableProps & { unit: string; seated?: boolean };

function seatStyle(seat: number, view: ClubView): CSSProperties {
  const { x, y, angle } = seatPosition(seat, view.self, view.players.length);
  return { '--cc-x': x, '--cc-y': y, '--cc-diagonal': Math.abs(2 * x * y), '--cc-angle': `${angle}deg` } as CSSProperties;
}

export function ClubSeats({ view, l, unit, seated = false }: SeatsProps) {
  const isTrick = definition(view.game).family === 'TRICK';
  const inPlay = view.phase !== 'round' && view.phase !== 'result';
  return (
    <div className="cc-player-ring">
      {view.players.map((player, seat) => {
        const own = seat === view.self;
        const turn = inPlay && seat === view.turn;
        const winner = view.winners.includes(seat);
        const name = own ? `${player.name} ★` : player.name;
        return (
          <article key={player.id} data-club-seat={seat} data-own-seat={own ? '' : undefined}
            title={own ? `${player.name} · ${l('あなた', 'You')}` : player.name}
            aria-current={turn || undefined} style={seated ? seatStyle(seat, view) : undefined}
            className={`${turn ? 'cc-turn' : ''} ${winner ? 'cc-winner' : ''}`}>
            <Face hero={player.hero} />
            <div>
              <strong>{name}</strong>
              {view.game === 'trumpcrew' ? (
                <span className="cc-crew-bid">
                  {player.bid === null ? l('未宣言', 'No bid yet') : `${l('宣言', 'Bid')} ${player.bid}`}
                  {' · '}{l('獲得', 'Won')} {player.tricks}
                </span>
              ) : (
                <span>
                  {l('得点', 'Score')} {view.game === 'golf' ? -player.score : player.score}
                  {['99add', 'schwimmen', 'rantergo', 'petrangola'].includes(view.game) && ` · ♥${player.lives}`}
                  {isTrick && ` · ${player.tricks}/${player.bid ?? '—'}`}
                </span>
              )}
            </div>
            <SeatHandCount count={player.handCount} label={l('手札', 'Cards')} unit={unit} />
          </article>
        );
      })}
    </div>
  );
}

function SharedCards({ view, l }: TableProps) {
  if (view.game === 'fantan') {
    return (
      <div className="cc-fantan-table cc-table-cards">
        {SUITS.map((symbol, color) => (
          <div className="cc-fantan-row" key={symbol}>
            <b className={color === 1 || color === 2 ? 'cc-suit-red' : ''}>{symbol}</b>
            {view.table.filter((card) => suit(card) === color).map((card) => (
              <div className="cc-fantan-slot" key={card} style={{ '--cc-rank-slot': rank(card) + 1 } as CSSProperties}>
                <CardFace card={card} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const classic = view.extra.classic!;
  return (
    <>
      <span className="cc-attack-label">
        {l('攻撃', 'Attack')} {view.players[classic.attacker]?.name}
        {' → '}{l('防御', 'Defense')} {view.players[classic.defender]?.name}
        {' · '}{classic.rows[0].length}/{classic.limit}
      </span>
      <div className="cc-attack-pairs cc-durak-table">
        {classic.rows[0].map((card, index) => {
          const defense = classic.rows[1][index];
          return (
            <div className="cc-attack-pair" key={card}>
              <CardFace card={card} label={`${l('攻撃', 'Attack')} · ${cardLabel(card)}`} />
              {defense === undefined ? <span className="cc-defense-slot" aria-label={l('防御待ち', 'Awaiting defense')} /> :
                <CardFace card={defense} label={`${l('防御', 'Defense')} · ${cardLabel(defense)}`} />}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function SeatedTable({ view, l, unit }: SeatsProps) {
  const { kind, plays, centerCards, activeSeat } = seatedTablePlays(view);
  const shared = kind === 'shared';
  const livePile = kind === 'pile';
  const previous = kind === 'previous-trick';
  const isFinished = view.phase === 'round' || view.phase === 'result';
  const trickResult = previous ? view.log.filter((event) =>
    ['trick', 'play', 'take', 'tie'].includes(event.key)
  ).at(-1) : undefined;
  const trickWinner = trickResult?.key === 'trick' ? trickResult.player : undefined;
  const winnerName = trickWinner === undefined ? '' : view.players[trickWinner]?.name;
  const lead = view.game === 'war' ? undefined : view.trick[0];
  const activeSuit = view.game === 'crazyeight' && view.activeSuit >= 0 ? SUITS[view.activeSuit] : '';
  const showStock = view.stock > 0 || ['sergent', 'crazyeight', 'yaniv', 'pitypat', 'shithead2', '66', 'schnapsen', 'cangkul'].includes(view.game);

  return (
    <div className={`cc-seat-table${shared ? ' cc-shared-board' : ''}`}
      data-seat-count={view.players.length} data-table-play={kind}>
      <div className="cc-felt-surface" aria-hidden="true" />
      <ClubSeats view={view} l={l} unit={unit} seated />
      {!shared && view.players.map((player, seat) => {
        const play = plays.find((entry) => entry.seat === seat);
        const active = seat === activeSeat;
        return (
          <div key={player.id} style={seatStyle(seat, view)} className="cc-play-position">
            {play ? (
              <div className={`cc-play-group${active ? ' cc-active-pile' : ''}${seat === trickWinner ? ' cc-winning-trick' : ''}`}
                data-club-play-seat={seat} data-card-angle={seatPosition(seat, view.self, view.players.length).angle}
                style={{ '--cc-group-size': play.cards.length } as CSSProperties}
                role="group" aria-label={`${player.name} · ${active ? l('場札', 'Active cards') : l('出した札', 'Cards played')}`}>
                {play.cards.map((card) => <CardFace key={card} card={card} showRank />)}
              </div>
            ) : <span className="cc-play-slot" aria-hidden="true" />}
          </div>
        );
      })}
      <div className="cc-seat-center">
        {shared && <SharedCards view={view} l={l} />}
        {centerCards && <div className="cc-center-pile">
          {centerCards.map((card) => <CardFace card={card} key={card} showRank />)}
        </div>}
        {previous && <span className="cc-table-state">
          {l('前のトリック', 'Last trick')}{winnerName && <> · <strong>{winnerName}</strong></>}
        </span>}
        {lead && <span className="cc-table-state">
          {l('リード', 'Lead')} <strong>{cardLabel(lead.card)}
            {lead.card >= 52 && view.activeSuit >= 0 && ` · ${SUITS[view.activeSuit]}`}
          </strong>
        </span>}
        {kind === 'cleared-pile' && !isFinished && <span className="cc-table-state">{l('場が流れました', 'New lead')}</span>}
        {activeSeat !== undefined && !activeSuit && <span className="cc-table-state">
          {l('場札', 'Active cards')} · <strong>{view.players[activeSeat].name}</strong>
        </span>}
        {livePile && activeSuit && <span className="cc-table-state">{l('指定スート', 'Active suit')} <strong>{activeSuit}</strong></span>}
        {view.game === '99add' && <strong className="cc-total">{view.total} / 99</strong>}
        {showStock && <TableStock count={view.stock} discard={view.discard} pile={view.game === 'shithead2' ? view.table.length : undefined} l={l} />}
      </div>
    </div>
  );
}
