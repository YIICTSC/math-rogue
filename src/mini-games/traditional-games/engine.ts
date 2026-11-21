import { gridApply, gridCpu, gridDeal, gridMoves, isGridGame, type GridState } from './dominoGrid';
import {
  isLaneGame,
  laneApply,
  laneCpu,
  laneDeal,
  laneMoves,
  laneTick,
  type LaneState,
} from './dominoLanes';
import { setApply, setDeal, setMoves, type SetState } from './dominoSets';
import {
  isTrickGame,
  trickApply,
  trickCpu,
  trickDeal,
  trickMoves,
  type TrickState,
} from './dominoTricks';
import { applyCrokinole, crokinoleCpu, newCrokinoleRound, type CrokinoleState } from './crokinole';
import { applyDomino, dominoCpu, dominoMoves, newDominoDeal, type DominoState } from './domino';
import {
  applyFortyTwo,
  fortyTwoCpu,
  fortyTwoMoves,
  newFortyTwoDeal,
  type FortyTwoState,
} from './fortyTwo';
import { applyGoita, goitaCpu, goitaMoves, newGoitaDeal, type GoitaState } from './goita';
import {
  baseFor,
  isExtraDomino,
  nextSeat,
  random,
  seatsFor,
  type TableAction,
  type TableGame,
  type TableMember,
} from './model';
import { applyPeeper, newPeeperDeal, peeperCpu, peeperMoves, type PeeperState } from './peeper';

export type TableState =
  | DominoState
  | FortyTwoState
  | GoitaState
  | PeeperState
  | CrokinoleState
  | GridState
  | LaneState
  | SetState
  | TrickState;
type TablePrivate =
  | 'hands'
  | 'rng'
  | 'opening'
  | 'spinners'
  | 'votes'
  | 'stock'
  | 'drawn'
  | 'history'
  | 'seen'
  | 'opener'
  | 'exchange'
  | 'captured'
  | 'bonuses'
  | 'closePoints'
  | 'closeTricks'
  | 'openedBlind';
type PublicState<S extends TableState> = S extends TableState
  ? Omit<S, TablePrivate> & {
      self: number;
      hand: number[];
      counts: number[];
      actions: TableAction[];
      stock: number;
    }
  : never;
export type TableView = PublicState<TableState>;

function dealRound(state: TableState) {
  switch (state.kind) {
    case 'domino-lanes':
      return laneDeal(state);
    case 'domino-grid':
      return gridDeal(state);
    case 'domino-sets':
      return setDeal(state);
    case 'domino-tricks':
      return trickDeal(state);
    case 'domino':
      return newDominoDeal(state);
    case 'forty-two':
      return newFortyTwoDeal(state);
    case 'peeper':
      return newPeeperDeal(state);
    case 'goita':
      return newGoitaDeal(state);
    case 'crokinole':
      return newCrokinoleRound(state);
  }
}

export function createTable(game: TableGame, players: TableMember[], seed: number): TableState {
  if (!seatsFor(game).includes(players.length)) throw new Error('UNSUPPORTED_SEATS');
  const base = baseFor(game, players, seed);
  base.dealer = Math.floor(random(base) * players.length);
  let state: TableState;
  if (isExtraDomino(game)) {
    if (isGridGame(game)) {
      state = {
        ...base,
        kind: 'domino-grid',
        game,
        stock: [],
        cells: [],
        eliminated: [],
        passes: 0,
        finalTurns: null,
      };
    } else if (isTrickGame(game)) {
      state = {
        ...base,
        kind: 'domino-tricks',
        game,
        stock: [],
        exchange: [],
        stage: 'exchange',
        trump: null,
        indicator: null,
        suit: null,
        trick: [],
        lastTrick: [],
        captured: [],
        bonuses: [],
        trickCounts: [],
        announced: [],
        requiredDoubles: [],
        closer: null,
        closePoints: 0,
        closeTricks: 0,
        nextLeader: null,
        yieldLead: false,
      };
    } else if (isLaneGame(game)) {
      state = {
        ...base,
        kind: 'domino-lanes',
        game,
        stock: [],
        hub: null,
        lines: [],
        forced: [],
        history: [],
        passes: 0,
        drawn: 0,
        played: 0,
        opener: null,
        previousWinner: null,
        anchorSeat: null,
        stage: 'play',
        contract: 0,
        condition: 0,
        declared: [],
        skip: [],
        block: null,
        dice: [],
        bets: base.players.map(() => 0),
        mustBet: null,
        lastBetRound: base.players.map(() => 0),
        turnCounts: [],
        eliminated: [],
        exits: [],
        seen: [],
        deadline: null,
        revealed: null,
        shown: [],
        openedBlind: null,
        lastPlaced: null,
        chips: [],
        pool: 0,
      };
    } else {
      state = {
        ...base,
        kind: 'domino-sets',
        game,
        stock: [],
        groups: [],
        opened: [],
        dice: [],
        chains: 0,
        played: [],
        passes: 0,
      };
    }
    dealRound(state);
    return state;
  }
  switch (game) {
    case 'crokinole':
      state = {
        ...base,
        kind: game,
        game,
        discs: [],
        sunk: [],
        remaining: [],
        boardPoints: [],
        lastShot: null,
      };
      break;
    case 'forty-two':
      state = {
        ...base,
        kind: game,
        game,
        stage: 'bid',
        bid: 0,
        bidder: 0,
        offered: 0,
        trump: null,
        trick: [],
        lastTrick: [],
        won: [0, 0],
      };
      break;
    case 'peeper':
      state = { ...base, kind: game, game, pile: null, discard: 0, passed: 0 };
      break;
    case 'goita':
      state = {
        ...base,
        kind: game,
        game,
        rows: [],
        attack: null,
        five: [],
        votes: [],
        award: null,
      };
      break;
    default:
      state = {
        ...base,
        kind: 'domino',
        game,
        stock: [],
        hub: null,
        lines: [],
        spinners: [],
        forced: [],
        opening: null,
        passes: 0,
        drawn: 0,
        trainOpening: [],
        trainBonus: false,
        limit: 0,
      };
  }
  dealRound(state);
  return state;
}

export function legalMoves(s: TableState, seat: number): TableAction[] {
  if (s.phase !== 'play') return [];
  switch (s.kind) {
    case 'domino-lanes':
      return laneMoves(s, seat);
    case 'domino-grid':
      return gridMoves(s, seat);
    case 'domino-sets':
      return setMoves(s, seat);
    case 'domino-tricks':
      return trickMoves(s, seat);
    case 'domino':
      return dominoMoves(s, seat);
    case 'forty-two':
      return fortyTwoMoves(s, seat);
    case 'peeper':
      return peeperMoves(s, seat);
    case 'goita':
      return goitaMoves(s, seat);
    case 'crokinole':
      return [];
  }
}

export function tableViewFor(s: TableState, self: number): TableView {
  const privacy = {
    self,
    hand: [...s.hands[self]].sort((a, b) => a - b),
    counts: s.hands.map((hand) => hand.length),
    actions: legalMoves(s, self),
  };
  switch (s.kind) {
    case 'domino-lanes': {
      const { hands, rng, stock, drawn, history, seen, opener, openedBlind, ...publicState } = s;
      return structuredClone({
        ...publicState,
        ...privacy,
        hand: s.game === 'billitonnen' ? [] : privacy.hand,
        stock: stock.length,
      });
    }
    case 'domino-grid':
    case 'domino-sets': {
      const { hands, rng, stock, ...publicState } = s;
      return structuredClone({
        ...publicState,
        ...privacy,
        stock: stock.length,
      });
    }
    case 'domino-tricks': {
      const {
        hands,
        rng,
        stock,
        exchange,
        captured,
        bonuses,
        closePoints,
        closeTricks,
        ...publicState
      } = s;
      return structuredClone({
        ...publicState,
        ...privacy,
        indicator: s.closer === null ? s.indicator : null,
        stock: stock.length,
      });
    }
    case 'domino': {
      const { hands, rng, stock, opening, spinners, drawn, ...publicState } = s;
      return structuredClone({
        ...publicState,
        ...privacy,
        stock: stock.length,
      });
    }
    case 'goita': {
      const { hands, rng, votes, ...publicState } = s;
      return structuredClone({ ...publicState, ...privacy, stock: 0 });
    }
    default: {
      const { hands, rng, ...publicState } = s;
      return structuredClone({ ...publicState, ...privacy, stock: 0 });
    }
  }
}

export function applyTableAction(s: TableState, seat: number, action: TableAction) {
  if (s.phase !== 'play' || !s.players[seat] || !action || typeof action.type !== 'string')
    return false;
  let ok = false;
  switch (s.kind) {
    case 'domino-lanes':
      ok = laneApply(s, seat, action);
      break;
    case 'domino-grid':
      ok = gridApply(s, seat, action);
      break;
    case 'domino-sets':
      ok = setApply(s, seat, action);
      break;
    case 'domino-tricks':
      ok = trickApply(s, seat, action);
      break;
    case 'domino':
      ok = applyDomino(s, seat, action);
      break;
    case 'forty-two':
      ok = applyFortyTwo(s, seat, action);
      break;
    case 'peeper':
      ok = applyPeeper(s, seat, action);
      break;
    case 'goita':
      ok = applyGoita(s, seat, action);
      break;
    case 'crokinole':
      ok = applyCrokinole(s, seat, action);
      break;
  }
  if (ok) s.revision++;
  return ok;
}

export function nextTableRound(s: TableState) {
  if (s.phase !== 'round') return false;
  if (s.game === 'competitive') s.dealer = (s.dealer + s.players.length - 1) % s.players.length;
  else if (s.game !== 'goita' && s.game !== 'buki') s.dealer = nextSeat(s, s.dealer);
  s.round++;
  s.phase = 'play';
  s.event = null;
  s.winners = [];
  s.roundStartScores = [...s.scores];
  s.revision++;
  dealRound(s);
  return true;
}

export function playTableCpu(s: TableState) {
  if (s.phase !== 'play') return false;
  if (s.kind === 'domino-lanes' && laneTick(s, Date.now())) {
    s.revision++;
    return true;
  }
  if (s.kind === 'peeper' && s.pile) {
    for (const [seat, p] of s.players.entries()) {
      if (!p.cpu) continue;
      const a = peeperMoves(s, seat).find((move) => move.type === 'mine' || move.type === 'return');
      if (a) return applyTableAction(s, seat, a);
    }
  }
  const seat = s.turn;
  if (!s.players[seat].cpu) return false;
  let move: TableAction | undefined;
  switch (s.kind) {
    case 'domino-lanes':
      move = laneCpu(s, seat);
      break;
    case 'domino-grid':
      move = gridCpu(s, seat);
      break;
    case 'domino-sets':
      move = setMoves(s, seat)[0];
      break;
    case 'domino-tricks':
      move = trickCpu(s, seat);
      break;
    case 'domino':
      move = dominoCpu(s, seat);
      break;
    case 'forty-two':
      move = fortyTwoCpu(s, seat);
      break;
    case 'goita':
      move = goitaCpu(s, seat);
      break;
    case 'peeper':
      move = peeperCpu(s, seat);
      break;
    case 'crokinole':
      move = crokinoleCpu(s, seat);
      break;
  }
  return !!move && applyTableAction(s, seat, move);
}
