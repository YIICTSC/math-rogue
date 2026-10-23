import { pack,rank,shuffled } from './cards';
import type { ClubState } from './model';
import { emptyClassic } from './classicModel';
import { finish,record,roundOver } from './ruleHelpers';
export function initClassic(s:ClubState){return s.extra.classic=emptyClassic(s.players.length);}
export function classicDeck(game:string,n:number){
 if(game==='euchre2'||game==='euchre-uk')return [...pack().filter(c=>rank(c)===1||rank(c)>=9),...(game==='euchre-uk'?[52]:[])];
 if(game==='durak2'||game==='perevodnoy')return pack().filter(c=>rank(c)===1||rank(c)>=6);
 if(game==='schwimmen')return pack().filter(c=>rank(c)===1||rank(c)>=7);
 if(game==='napoleon')return [...pack(),52];
 if(game==='chinesewhist'&&n===3)return pack().filter(c=>c!==1);
 return pack();
}
export function resetClassicDeck(s:ClubState){s.stock=shuffled(classicDeck(s.game,s.players.length),s.seed+s.round*1009);}
export function fixedDeals(s:ClubState,times:number){if(s.round+1>=s.players.length*times)finish(s);else roundOver(s);}
export function award(s:ClubState,player:number,points:number,label:string){s.players[player].score+=points;s.extra.classic!.notes.push({player,points,label});record(s,'points',player,points);}
export function recycleStock(s:ClubState){if(!s.stock.length&&s.discard.length>1){const top=s.discard.pop()!;s.stock=shuffled(s.discard,s.seed+s.revision);s.discard=[top];}}
