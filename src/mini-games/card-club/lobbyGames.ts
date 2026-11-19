import {definition, type GameId} from './catalog';

export const CARD_CLUB_ROOM_CAPACITY = 8;

const recommendations: Readonly<Record<number, readonly GameId[]>> = {
  1: ['memory', 'oldmaid', 'royalcassino', 'daihinmin'],
  2: ['memory', 'royalcassino', 'ginrummy', 'trumpcrew'],
  3: ['oldmaid', 'yaniv', 'fantan', 'daihinmin'],
  4: ['daihinmin', 'heart2', 'trumpcrew', 'mitch'],
  5: ['daihinmin', 'trumpcrew', 'yaniv', 'pokerbull'],
  6: ['trumpcrew', 'yaniv', 'daihinmin', 'pokerbull'],
  7: ['pokerbull', 'trumpcrew', 'yaniv', 'memory'],
  8: ['trumpcrew', 'pokerbull', 'yaniv', 'memory'],
};

export function recommendedClubGames(people: number): readonly GameId[] {
  return (recommendations[people] ?? []).filter(id => people === 1 || definition(id).players.includes(people));
}

/** Seats are filled by people first, then by the minimum number of CPU players. */
export function clubSeatsFor(game: GameId, people: number): number | undefined {
  return definition(game).players.filter(n => n >= people).reduce<number | undefined>(
    (fewest, seats) => Math.min(fewest ?? seats, seats), undefined,
  );
}
