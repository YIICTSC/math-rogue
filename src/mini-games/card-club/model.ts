import type { GameId } from './catalog';
import type { LadderState } from './ladder';
import type { ExtensionState } from './extensionModel';
export type PlayerInput={id:string;name:string;hero:string;cpu:boolean};
export type ClubPlayer=PlayerInput&{hand:number[];taken:number[];score:number;tricks:number;bid:number|null;bags:number;books:number[];lives:number;out:boolean;stake:number};
export type Action={type:'play'|'draw'|'pass'|'ask'|'pick'|'bid'|'challenge'|'accept'|'reveal'|'bust'|'hit'|'stand'|'double'|'next'|'trump'|'exchange'|'discard'|'meld'|'layoff'|'continue'|'move';cards?:number[];target?:number;value?:number;suit?:number;index?:number;form?:'set'|'run';revolution?:boolean;double?:boolean};
export type ClubEvent={key:string;player?:number;value?:number;card?:number};
export interface ClubState {
  version:1; game:GameId;seed:number;revision:number;phase:'bid'|'play'|'reaction'|'round'|'result';
  players:ClubPlayer[];turn:number;dealer:number;round:number;stock:number[];discard:number[];
  table:number[];trick:{player:number;card:number}[];lastTrick:{player:number;card:number}[];
  trump:number;activeSuit:number;broken:boolean;total:number;direction:number;pool:number;
  claim:number;pending:{player:number;cards:number[];rank:number;remaining:number[]}|null;
  capturesBy:number;winners:number[];log:ClubEvent[];resultReason:string;
  whistHonors:number[];whistWins:number[];whistPoints:number[];
  ladder:LadderState|null;
  extra:ExtensionState;
}
export type ClubView=Omit<ClubState,'players'|'stock'|'discard'|'pending'>&{
  players:(Omit<ClubPlayer,'hand'|'taken'>&{hand:number[];handCount:number;takenCount:number})[];
  stock:number;discard:number;pending:{player:number;count:number;rank:number}|null;
  self:number;actions:Action[];
};
export const actionKey=(action:Action)=>JSON.stringify(action);
