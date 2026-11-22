import { definition, type GameId } from './catalog';
import type { ClubView, PublicPilePlay } from './model';

const pileGames = new Set<GameId>(['daihinmin', 'crazyeight', 'pitypat', 'snipsnupsnorem', 'yaniv', 'shithead2']);
const sharedBoards = new Set<GameId>(['fantan', 'durak2', 'perevodnoy']);

export function usesSeatedTable(game: GameId) {
  const { family } = definition(game);
  return family === 'TRICK' || family === 'SHED' || game === 'war' || game === '99add';
}

export function seatPosition(seat: number, self: number, playerCount: number) {
  const offset = (seat - self + playerCount) % playerCount;
  const angle = offset * 360 / playerCount;
  const radians = angle * Math.PI / 180;
  // Seat numbers increase clockwise looking down at the table, starting at the near edge.
  return { x: -Math.sin(radians), y: Math.cos(radians), angle };
}

type TablePlays = {
  kind: 'trick' | 'previous-trick' | 'pile' | 'cleared-pile' | 'shared';
  plays: PublicPilePlay[];
  centerCards?: number[];
  activeSeat?: number;
};

/** Arrange only cards that the recipient's public view already shows. */
export function seatedTablePlays(view: ClubView): TablePlays {
  if (sharedBoards.has(view.game)) return { kind: 'shared', plays: [] };

  if (pileGames.has(view.game)) {
    let plays = view.pilePlays ?? [];
    const table = view.table;
    const open = table.length > 0 && (view.game !== 'snipsnupsnorem' || view.extra.obligation > 0);
    // Older hosts send the active ladder set with its last player, without play history.
    if (open && !plays.length && view.ladder) {
      plays = [{ seat: view.ladder.last, cards: table }];
    }
    const last = plays.at(-1);
    const active = open && last && last.cards.every((card, index) =>
      card === table[table.length - last.cards.length + index]
    );
    // Unattributed cards include the opening upcard and plays from older hosts.
    const centerCount = view.game === 'yaniv' ? table.length : view.game === 'shithead2' ? 4 : 1;
    return {
      kind: !open && last ? 'cleared-pile' : 'pile',
      plays,
      centerCards: open && !active ? table.slice(-centerCount) : undefined,
      activeSeat: active ? last.seat : undefined,
    };
  }

  const played = view.trick.length ? view.trick : view.lastTrick;
  return {
    kind: !view.trick.length && played.length && view.game !== '99add' ? 'previous-trick' : 'trick',
    plays: played.map(({ player, card }) => ({ seat: player, cards: [card] })),
  };
}
