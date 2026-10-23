import { worldExtension } from './worldGames';
import { classicExtension } from './classics';
import { classicView } from './classicPrivacy';
import type { GameId } from './catalog';
import type { ClubState,ClubView } from './model';
import type { ExtensionState,RuleExtension } from './extensionModel';
import { EXTENDED_TRICKS,extendedTricks } from './extendedTricks';
import { sideRules } from './sideGames';
import { rummyRules } from './rummy';
import { sheddingRules } from './shedding';

export const extensionFor=(id:GameId):RuleExtension|undefined=>worldExtension(id)??classicExtension(id)??(EXTENDED_TRICKS.has(id)?extendedTricks:id==='rummy'?rummyRules:sideRules[id]||sheddingRules[id]);
export function publicExtension(s:ClubState,index=-1):ExtensionState{
  return {...s.extra,classic:classicView(s,index),board:s.extra.board.map((c,i)=>c===-2||s.extra.visible.includes(i)||s.phase==='result'?c:-1),selections:s.extra.selections.map(()=>[]),seen:[]};
}
export const extensionCPU=(v:ClubView)=>extensionFor(v.game)?.cpu?.(v);
