import type { ClubState } from './model';
export const record=(s:ClubState,key:string,player?:number,value?:number,card?:number)=>{s.log.push({key,player,value,card});s.log=s.log.slice(-24);};
export function finish(s:ClubState,winners?:number[],reason='score'){
  const best=Math.max(...s.players.map(p=>p.score));s.phase='result';s.winners=winners||s.players.flatMap((p,i)=>p.score===best?[i]:[]);s.resultReason=reason;record(s,'finish');
}
export function roundOver(s:ClubState){s.phase='round';s.turn=0;record(s,'roundEnd');}
export function nextSeat(s:ClubState,from=s.turn,dir=s.direction){for(let k=1;k<=s.players.length;k++){const i=(from+k*dir+s.players.length*2)%s.players.length;if(!s.players[i].out)return i;}return from;}
export function dealCards(s:ClubState,count:number){for(let k=0;k<count;k++)for(let j=1;j<=s.players.length;j++){const i=(s.dealer+j*s.direction+s.players.length*2)%s.players.length;if(!s.players[i].out&&s.stock.length)s.players[i].hand.push(s.stock.pop()!);}}
export function removeCards(s:ClubState,i:number,cards:number[]){s.players[i].hand=s.players[i].hand.filter(c=>!cards.includes(c));}
export function addTeam(s:ClubState,team:number,amount:number,teams=2){s.players.forEach((p,i)=>{if(i%teams===team)p.score+=amount;});}
