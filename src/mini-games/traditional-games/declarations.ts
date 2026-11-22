import {
  declare,
  spokenNumber,
  type DeclarationLine,
} from '../shared/tableDeclarations';
import type { TableState } from './engine';
import type { TableAction, TableEvent } from './model';
import { dominoFaces } from './domino';
import { BINGO_CLAIM, BINGO_CLOSE } from './dominoTricks';
import { goitaKind, partner } from './goita';

export function tableActionLines(state: TableState, action: TableAction): DeclarationLine[] {
  if (action.type === 'bid' || action.type === 'trump') return spokenNumber(action.value);
  if (action.type === 'claim') {
    const faces = dominoFaces(action.face);
    return faces.flatMap(spokenNumber);
  }
  if (state.kind === 'domino-tricks' && state.game === 'bingo') {
    if (action.type === 'tiles') return ['doubles'];
    if (action.type === 'option' && action.value === BINGO_CLAIM) return ['bingo'];
    if (action.type === 'option' && action.value === BINGO_CLOSE) return ['close'];
  }
  if (state.kind === 'domino-lanes' && action.type === 'option') {
    if (state.stage === 'react') return ['doubt'];
    if (state.stage === 'declare') return ['doubles'];
    if (state.stage === 'block') return ['block'];
    if (state.stage === 'contract' || state.stage === 'condition') return ['rule'];
    if (state.game === 'buki' && state.stage === 'play') return spokenNumber(action.value);
  }
  return [];
}

export function classicTableCall(event: TableEvent | null | undefined): DeclarationLine | undefined {
  const key = event?.key;
  if (key === 'domino' || key === 'mine' || key === 'return' ||
      key === 'bomb' || key === 'twenty' || key === 'five-shi') return key;
}

export function recordTableEvent(
  state: TableState,
  previousEvent: TableEvent | null,
  previousForced = 0,
) {
  const event = state.event;
  if (!event || event === previousEvent) return;
  const { key, seat } = event;
  const line = classicTableCall(event);
  if (line) declare(state, seat, line);
  if (key === 'five-shi') {
    if (state.kind === 'goita' && event.amount === 150) {
      const teammate = partner(seat);
      if (state.five.includes(teammate)) declare(state, teammate, key);
    }
  } else if (key === 'hand-award' && state.kind === 'goita' && state.award) {
    const count = state.award.tiles.filter((tile) => goitaKind(tile) === 0).length;
    if (count === 6 || count === 7 || count === 8)
      declare(state, seat, count === 6 ? 'six-shi' : count === 7 ? 'seven-shi' : 'eight-shi');
  } else if (key === 'redeal' && state.game === 'goita') {
    declare(state, seat, 'redeal');
  } else if (state.kind === 'domino' && state.game === 'chicken' && key === 'place') {
    if (!previousForced && state.forced.length) declare(state, seat, 'chicken-foot');
  }
}
