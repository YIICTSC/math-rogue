import { declare, spokenNumber, spokenRank, spokenSuit } from '../shared/tableDeclarations';
import { rank, suit } from './cards';
import type { Action, ClubState } from './model';

export function recordCardDeclaration(state: ClubState, seat: number, action: Action) {
  const { game, claim } = state;
  const { type, value, cards } = action;
  const card = cards?.[0];
  if (type === 'trump' || type === 'order') {
    declare(state, seat, ...spokenSuit(action.suit), ...(action.alone ? ['alone' as const] : []));
    return;
  }
  if (type === 'bid') {
    if (game === 'minnesotawhist' || game === 'pokerbull') return;
    if (game === 'put') declare(state, seat, 'put');
    else if (game === 'truc') {
      if (value === -1) declare(state, seat, 'all-in');
      else declare(state, seat, 'truc', ...spokenNumber(value));
    } else if (game === 'nap') {
      if (value === 3) declare(state, seat, 'misere');
      else if (value === 5) declare(state, seat, 'nap');
      else if (value === 6) declare(state, seat, 'wellington');
      else declare(state, seat, ...spokenNumber(value === 1 ? 2 : value === 2 ? 3 : value));
    } else if (game === 'spades' && value === 0) declare(state, seat, 'nil');
    else if (game === 'napoleon') declare(state, seat, ...spokenSuit(action.suit), ...spokenNumber(value));
    else declare(state, seat, ...spokenNumber(value));
    return;
  }
  if (type === 'name') {
    if (game === 'trumpcrew')
      declare(state, seat, value === 2 ? 'strong' : value === 1 ? 'medium' : 'weak');
    else if (game === 'napoleon' && card !== undefined)
      declare(
        state,
        seat,
        ...(card === 52 ? ['joker' as const] : [...spokenSuit(suit(card)), ...spokenRank(rank(card))]),
      );
    else if (game === 'guessit' && value !== undefined)
      declare(state, seat, ...spokenRank(value), 'guess');
    return;
  }
  if (type === 'play' && card !== undefined) {
    if (game === 'doubt')
      declare(state, seat, ...spokenRank(claim), ...spokenNumber(cards?.length), 'cards');
    else if (game === '99add') declare(state, seat, ...spokenNumber(value));
    else if (game === 'crazyeight' && rank(card) === 8)
      declare(state, seat, ...spokenSuit(action.suit));
    else if (
      game === 'pitch' && !state.trick.length && state.extra.classic?.trickNo === 0
    ) declare(state, seat, ...spokenSuit(suit(card)));
    else if (game === 'trumpcrew' && card === 52 && !state.trick.length)
      declare(state, seat, ...(action.suit === -1 ? ['no-suit' as const] : spokenSuit(action.suit)));
    else if (action.revolution) declare(state, seat, 'revolution');
    else if (action.double)
      declare(state, seat, game === '66' || game === 'schnapsen' ? 'marriage' : 'double');
    return;
  }
  if (type === 'challenge' && game === 'doubt') declare(state, seat, 'doubt');
  else if (type === 'challenge' && game === 'pokerbull') declare(state, seat, 'bull');
  else if (type === 'reveal' && game === 'ecarte') declare(state, seat, 'king');
  else if (type === 'accept' && game === 'ecarte' && state.extra.step === 'ecarteOffer')
    declare(state, seat, 'exchange-request');
  else if (type === 'draw' && game === 'truc' && state.extra.step === 'trucRedealOffer')
    declare(state, seat, 'redeal');
  else if (type === 'close') declare(state, seat, game === 'empatsatu' ? 'stop' : 'close');
  else if (type === 'stand' && game === 'pontoon') declare(state, seat, 'stick');
  else if (type === 'hit' && game === 'pontoon') declare(state, seat, 'twist');
  else if (type === 'buy' && game === 'pontoon') declare(state, seat, 'buy');
  else if (type === 'stand' && (game === 'blackjack' || game === 'allfour'))
    declare(state, seat, 'stand');
  else if (type === 'hit' && game === 'blackjack') declare(state, seat, 'hit');
  else if (type === 'double') declare(state, seat, 'double');
  else if (type === 'pass' && game === 'allfour' && state.extra.step !== 'allFourReply')
    declare(state, seat, 'beg');
  else if (type === 'build') declare(state, seat, 'build', ...spokenNumber(value));
  else if (type === 'ask' && value !== undefined) {
    if (game === 'gofish' || game === 'authors') {
      declare(state, seat, ...spokenSuit(action.suit), ...spokenRank(value), 'please');
    } else if (game === 'guessit') {
      declare(state, seat, ...spokenRank(value), 'question');
    }
  }
}
