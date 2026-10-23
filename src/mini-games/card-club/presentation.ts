import type { ClubEvent, ClubView } from './model';

export type CardClubCue='shuffle'|'deal'|'play'|'flip'|'draw'|'collect'|'select';
export type PresentationState=Pick<ClubView,'game'|'round'|'revision'|'stock'|'turn'|'dealer'|'self'>&{
  log:ClubEvent[];board:number[];publicCards:number[];rows:number[][];players:{handCount:number;takenCount:number}[];
};
/** Local sessions can mutate arrays after publication. Preserve an independent baseline. */
export function presentationSnapshot(v:ClubView):PresentationState{
  return {game:v.game,round:v.round,revision:v.revision,stock:v.stock,turn:v.turn,dealer:v.dealer,self:v.self,
    log:v.log.map(e=>({...e})),board:[...v.extra.board],publicCards:[...v.table,...v.trick.map(t=>t.card),...v.lastTrick.map(t=>t.card)],rows:v.extra.classic?.rows.map(row=>[...row])??[],
    players:v.players.map(p=>({handCount:p.handCount,takenCount:p.takenCount}))};
}
/** Only recipient-visible state is accepted. No hidden hand or stock is consulted. */
export function presentationDelta(previous:PresentationState|null,current:ClubView){
  const deal=!previous||previous.game!==current.game||previous.round!==current.round||current.revision<previous.revision;
  if(deal)return {deal:true,events:[] as ClubEvent[],cue:'shuffle' as CardClubCue};
  if(previous.revision===current.revision)return {deal:false,events:[] as ClubEvent[],cue:null};
  let overlap=Math.min(previous.log.length,current.log.length);
  while(overlap>0&&JSON.stringify(previous.log.slice(-overlap))!==JSON.stringify(current.log.slice(0,overlap)))overlap--;
  const events=current.log.slice(overlap),keys=events.map(e=>e.key);
  const revealed=current.game==='war'&&[...current.table,...current.trick.map(t=>t.card),...current.lastTrick.map(t=>t.card)].some(card=>card>=0&&!previous.publicCards.includes(card))
    ||current.extra.board.some((card,i)=>card>=0&&(previous.board[i]??-1)<0)
    ||current.extra.classic?.rows.some((row,i)=>row.some((card,j)=>card>=0&&(previous.rows[i]?.[j]??-1)<0));
  const gained=current.players.some((p,i)=>p.takenCount>(previous.players[i]?.takenCount??0));
  let cue:CardClubCue|null=null;
  if(revealed||keys.some(k=>['flip','reveal'].includes(k)))cue='flip';
  else if(keys.some(k=>['play','defend','transfer','discard','meld','layoff','build'].includes(k)))cue='play';
  else if(gained||keys.some(k=>['capture','take','trick','sweep','pair','book','burn'].includes(k)))cue='collect';
  else if(keys.some(k=>['pick','draw'].includes(k))||current.stock<previous.stock||current.players.some((p,i)=>p.handCount>(previous.players[i]?.handCount??0)))cue='draw';
  else if(keys.some(k=>['swap','exchange'].includes(k)))cue='deal';
  return {deal:false,events,cue};
}
