import { gameCommand, gameOf, type HomeGame, type HomeGamePlayer, type HomeGameWorld } from '../gakuro-craft/homeGames';
import { connectLine } from '../gakuro-craft/partyGames';
import type { LocalMatchResult } from '../shared/localTableMatch';
import type { HouseGame } from './interiors';

export function startHouseBoard(kind: Extract<HouseGame, {family:'furniture'}>['game'], name: string) {
  const player: HomeGamePlayer = {
    id: 'traveler', name, indoors: true, homeTile: 0,
    progress: {home: {tile: 0, level: 1, furniture: [{slot: 0, item: kind}]}},
  };
  const world: HomeGameWorld = {tiles: [{homeOwner: player.id}], players: {[player.id]: player}, time: 0, paused: false, games: {}};
  gameCommand(world, player, {type: 'game_join', slot: 0});
  const game = gameOf(world, player.id);
  if (game) {
    game.arranged = false;
    gameCommand(world, player, {type: 'game_start', key: game.key});
  }
  return {world, player, game};
}

export function houseBoardResult(game: HomeGame): LocalMatchResult | undefined {
  if (game.phase !== 'finished') return;
  const board=game.party?.board;
  if (game.kind==='reversi' && game.scores[0]===game.party?.cpuScore) return 'draw';
  if (game.kind==='connectfour' && board && !board.some((_,cell)=>connectLine(board,cell).length)) return 'draw';
  return game.winner.includes(0) ? 'win' : 'loss';
}
