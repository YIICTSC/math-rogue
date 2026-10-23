import { classicHideOwnHand,classicHideTable } from './classicPrivacy';
import { definition, type GameId } from './catalog';
import { blackjackValue, high, pack, rank, scopaValue, shuffled, sorted, suit } from './cards';
import { actionKey, type Action, type ClubState, type ClubView, type PlayerInput } from './model';
import { ladderActions, playLadder } from './ladder';
import { emptyExtension } from './extensionModel';
import { extensionFor,extensionCPU,publicExtension } from './extensions';

export const event=(s:ClubState,key:string,player?:number,value?:number,card?:number)=>{s.log.push({key,player,value,card});s.log=s.log.slice(-24);};
const trickGames=new Set<GameId>(['whist','spades','ohhell']);
const captureGames=new Set<GameId>(['scopa','scopone']);
function next(s:ClubState,from=s.turn,direction=s.direction){for(let k=1;k<=s.players.length;k++){const i=(from+k*direction+s.players.length*2)%s.players.length;if(!s.players[i].out)return i;}return from;}
function end(s:ClubState,winners:number[],reason='score'){s.phase='result';s.winners=winners;s.resultReason=reason;event(s,'finish');}
function highest(s:ClubState){const best=Math.max(...s.players.map(p=>p.score));return s.players.flatMap((p,i)=>p.score===best?[i]:[]);}
function take(s:ClubState,player:number,cards:number[]){const p=s.players[player];p.hand=p.hand.filter(c=>!cards.includes(c));}
function deal(s:ClubState,count:number){for(let n=0;n<count;n++)for(let k=1;k<=s.players.length;k++){const p=s.players[(s.dealer+k)%s.players.length];if(!p.out&&s.stock.length)p.hand.push(s.stock.pop()!);}}
function pairs(s:ClubState,index:number){const p=s.players[index];for(let r=1;r<=13;r++){const cards=p.hand.filter(c=>rank(c)===r);for(let k=0;k+1<cards.length;k+=2){take(s,index,cards.slice(k,k+2));s.discard.push(...cards.slice(k,k+2));}}p.hand=shuffled(p.hand,s.seed+s.revision+index);if(!p.hand.length)p.out=true;}
function books(s:ClubState,index:number){const p=s.players[index];for(let r=1;r<=13;r++){const cards=p.hand.filter(c=>rank(c)===r);if(cards.length===4){take(s,index,cards);s.discard.push(...cards);p.books.push(r);p.score++;event(s,'book',index,r);}}}
function replenish(s:ClubState){if(!s.stock.length&&s.discard.length){s.stock=shuffled(s.discard,s.seed+s.revision);s.discard=[];}}
function startRound(s:ClubState,nextStock?:number[]){
  if(s.game==='whist'&&s.players.some(p=>p.score>=5))s.players.forEach(p=>p.score=0);
  s.stock=nextStock??shuffled(pack(),s.seed+s.round*1009);s.discard=[];s.table=[];s.trick=[];s.lastTrick=[];s.trump=-1;s.activeSuit=-1;s.broken=false;s.total=0;s.direction=1;s.pool=0;s.claim=1;s.pending=null;s.capturesBy=-1;s.phase='play';s.ladder=null;
  s.players.forEach(p=>{p.hand=[];p.taken=[];p.tricks=0;p.bid=null;p.books=[];p.stake=1;p.out=s.game==='99add'&&p.lives<=0;});
  const n=s.players.length;s.extra=emptyExtension(n);
  if(extensionFor(s.game))extensionFor(s.game)!.start(s);
  else if(trickGames.has(s.game)){
    const count=s.game==='ohhell'?Math.floor(52/n)-s.round:13;deal(s,count);
    s.trump=s.game==='spades'?3:s.game==='whist'?suit(s.players[s.dealer].hand.at(-1)!):s.stock.length?suit(s.stock.at(-1)!):-1;
    if(s.game==='whist')s.whistHonors=[0,1].map(team=>s.players.flatMap((p,i)=>i%2===team?p.hand:[]).filter(c=>suit(c)===s.trump&&[1,11,12,13].includes(rank(c))).length);
    if(s.game!=='whist')s.phase='bid';
  } else if(s.game==='daihinmin'){
    s.stock=shuffled([...pack(),52],s.seed+s.round*1009);while(s.stock.length)deal(s,1);s.ladder={count:0,form:'set',rank:0,last:s.dealer,passes:0,reversed:false,order:[]};
  } else if(s.game==='oldmaid'){
    s.stock=s.stock.filter(c=>c!==11);while(s.stock.length)deal(s,1);s.players.forEach((_,i)=>pairs(s,i));
    if(s.players.filter(p=>!p.out).length<=1){s.players.forEach(p=>{if(p.out)p.score++;});end(s,s.players.flatMap((p,i)=>p.out?[i]:[]),'oldmaid');}
  } else if(s.game==='fantan'||s.game==='authors'||s.game==='doubt'||s.game==='war'){
    while(s.stock.length)deal(s,1);if(s.game==='authors')s.players.forEach((_,i)=>books(s,i));
  } else if(s.game==='crazyeight'||s.game==='gofish')deal(s,n===2?7:5);
  else if(s.game==='99add')deal(s,3);
  else if(captureGames.has(s.game)){
    s.stock=s.stock.filter(c=>![8,9,10].includes(rank(c)));s.direction=-1;
    // In the rare opening with three kings, redeal (a valid initial capture table).
    let attempts=0;
    do {s.stock=shuffled(pack().filter(c=>![8,9,10].includes(rank(c))),s.seed+s.round*1009+attempts++);s.players.forEach(p=>p.hand=[]);deal(s,s.game==='scopone'?9:3);s.table=s.stock.splice(0,4);} while(s.table.filter(c=>rank(c)===13).length>=3&&attempts<100);
  } else if(s.game==='blackjack'){
    deal(s,2);s.players.forEach(p=>p.out=blackjackValue(p.hand)===21);
  }
  if(s.game==='gofish')s.players.forEach((_,i)=>books(s,i));
  s.players.forEach(p=>{if(!['oldmaid','war','beggar'].includes(s.game))p.hand=sorted(p.hand);});
  if(!extensionFor(s.game))s.turn=next(s,s.dealer);event(s,'deal',undefined,s.round+1);
  if(s.game==='daihinmin')s.turn=s.dealer;
  if(s.game==='blackjack'&&s.turn===s.dealer)settleBlackjack(s);
}
export function createClubGame(game:GameId,players:PlayerInput[],seed:number):ClubState {
  const d=definition(game);if(!d||!d.players.includes(players.length))throw Error('Unsupported player count');
  if(new Set(players.map(p=>p.id)).size!==players.length)throw Error('Duplicate player');
  const s:ClubState={version:1,game,seed,revision:0,phase:'play',players:players.map(p=>({...p,name:p.name.slice(0,32),hand:[],taken:[],score:0,tricks:0,bid:null,bags:0,books:[],lives:5,out:false,stake:1})),turn:0,dealer:0,round:0,stock:[],discard:[],table:[],trick:[],lastTrick:[],trump:-1,activeSuit:-1,broken:false,total:0,direction:1,pool:0,claim:1,pending:null,capturesBy:-1,winners:[],log:[],resultReason:'',whistHonors:[0,0],whistWins:[0,0],whistPoints:[0,0],ladder:null,extra:emptyExtension(players.length)};
  startRound(s);return s;
}
function trickCards(s:ClubState){
  const hand=s.players[s.turn].hand,lead=s.trick[0];
  if(lead){const follow=hand.filter(c=>suit(c)===suit(lead.card));if(follow.length)return follow;
    if(s.game==='ohhell'){const trumps=hand.filter(c=>suit(c)===s.trump);if(trumps.length)return trumps;}
    return hand;
  }
  if(s.game==='spades'&&!s.broken&&hand.some(c=>suit(c)!==3))return hand.filter(c=>suit(c)!==3);return hand;
}
function captureOptions(s:ClubState,card:number){
  const exact=s.table.filter(c=>scopaValue(c)===scopaValue(card));if(exact.length)return exact.map(c=>[c]);
  const options:number[][]=[];
  function search(at:number,sum:number,cards:number[]){if(sum===scopaValue(card)){options.push(cards);return;}if(sum>scopaValue(card))return;for(let i=at;i<s.table.length;i++)search(i+1,sum+scopaValue(s.table[i]),[...cards,s.table[i]]);}
  search(0,0,[]);return options.length?options:[[]];
}
function totalOptions(s:ClubState,c:number){const r=rank(c);return r===1?[s.total+1,s.total+11]:r===4||r===9?[s.total]:r===10?[s.total+10,s.total-10]:r===13?[99]:[s.total+Math.min(r,10)];}
export function legalActions(s:ClubState,player=s.turn):Action[]{
  if(s.phase==='result'||player!==s.turn)return [];
  if(s.phase==='round')return [{type:'next'}];
  const extension=extensionFor(s.game);if(extension)return extension.actions(s);
  const p=s.players[player];
  if(s.phase==='reaction')return [{type:'challenge'},{type:'accept'}];
  if(s.phase==='bid')return Array.from({length:p.hand.length+1},(_,value)=>({type:'bid' as const,value})).filter(a=>s.game!=='ohhell'||player!==s.dealer||s.players.reduce((v,p)=>v+(p.bid||0),0)+a.value!==p.hand.length);
  if(s.game==='daihinmin')return ladderActions(s);
  if(trickGames.has(s.game))return trickCards(s).map(c=>({type:'play',cards:[c]}));
  if(captureGames.has(s.game))return p.hand.flatMap(c=>captureOptions(s,c).map(cs=>({type:'play' as const,cards:[c,...cs]})));
  if(s.game==='oldmaid'){const from=next(s,player,-1);return s.players[from].hand.map((_,index)=>({type:'pick',target:from,index}));}
  if(s.game==='war')return [{type:'reveal'}];
  if(s.game==='fantan'){
    const cards=p.hand.filter(c=>{const row=s.table.filter(t=>suit(t)===suit(c)).map(rank);return rank(c)===7||row.length>0&&(rank(c)===Math.min(...row)-1||rank(c)===Math.max(...row)+1);});
    return cards.length?cards.map(c=>({type:'play',cards:[c]})):[{type:'pass'}];
  }
  if(s.game==='crazyeight'){
    const top=s.table.at(-1),play=p.hand.filter(c=>top===undefined||rank(c)===8||suit(c)===s.activeSuit||rank(c)===rank(top)).flatMap(c=>rank(c)===8?[0,1,2,3].map(suit=>({type:'play' as const,cards:[c],suit})):[{type:'play' as const,cards:[c]}]);
    return [...play,...s.stock.length?[{type:'draw' as const}]:play.length?[]:[{type:'pass' as const}]];
  }
  if(s.game==='gofish'||s.game==='authors'){
    if(!p.hand.length)return s.stock.length?[{type:'draw'}]:[{type:'pass'}];
    const ranks=[...new Set(p.hand.map(rank))];return s.players.flatMap((op,target)=>target===player||!op.hand.length?[]:ranks.flatMap(value=>s.game==='gofish'?[{type:'ask' as const,target,value}]:[0,1,2,3].filter(st=>!p.hand.includes(st*13+value-1)).map(suit=>({type:'ask' as const,target,value,suit}))));
  }
  if(s.game==='doubt')return [...p.hand.map(c=>({type:'play' as const,cards:[c]})),...[...new Set(p.hand.map(rank))].map(r=>({type:'play' as const,cards:p.hand.filter(c=>rank(c)===r)}))];
  if(s.game==='99add'){
    const actions=p.hand.flatMap(c=>totalOptions(s,c).filter(value=>value<=99).map(value=>({type:'play' as const,cards:[c],value})));return actions.length?actions:[{type:'bust'}];
  }
  if(s.game==='blackjack')return [{type:'stand'},...s.stock.length?[{type:'hit' as const},...p.hand.length===2?[{type:'double' as const}]:[]]:[]];
  return [];
}
function finishTrickRound(s:ClubState){
  if(s.game==='whist'){
    const before=[s.players[0].score,s.players[1].score],t=s.players[0].tricks+s.players[2].tricks;
    [0,1].forEach(team=>{const pts=Math.max(0,(team===0?t:13-t)-6);s.players.forEach((p,i)=>{if(i%2===team)p.score+=pts;});});
    // A game reached by tricks is counted before the opponents' honours.
    if(!s.players.some(p=>p.score>=5))for(let team=0;team<2;team++){
      const honor=before[team]===4?0:s.whistHonors[team]===4?4:s.whistHonors[team]===3?2:0;
      s.players.forEach((p,i)=>{if(i%2===team)p.score+=honor;});
    }
    const winner=s.players[0].score>=5?0:s.players[1].score>=5?1:-1;
    if(winner>=0){
      const other=s.players[1-winner].score;s.whistPoints[winner]+=other>=3?1:other>=1?2:3;s.whistWins[winner]++;
      if(s.whistWins[winner]>=2){s.whistPoints[winner]+=2;s.players.forEach((p,i)=>p.score=s.whistPoints[i%2]);end(s,s.players.flatMap((_,i)=>i%2===winner?[i]:[]));return;}
    }
  } else if(s.game==='spades'){
    for(let team=0;team<2;team++){
      const partners=s.players.filter((_,i)=>i%2===team),bid=partners.reduce((v,p)=>v+(p.bid||0),0),tricks=partners.filter(p=>p.bid!==0).reduce((v,p)=>v+p.tricks,0),bag=Math.max(0,tricks-bid);
      let score=tricks>=bid?bid*10+bag:-bid*10;for(const p of partners)if(p.bid===0)score+=p.tricks===0?100:-100;
      const bags=partners[0].bags+bag;score-=Math.floor(bags/10)*100;partners.forEach(p=>{p.score+=score;p.bags=bags%10;});
    }
    const a=s.players[0].score,b=s.players[1].score;if((Math.max(a,b)>=500||Math.min(a,b)<=-200)&&a!==b){end(s,highest(s));return;}
  } else {
    s.players.forEach(p=>{p.score+=p.tricks+(p.bid===p.tricks?10:0);});if(s.round===Math.floor(52/s.players.length)-1){end(s,highest(s));return;}
  }
  s.phase='round';s.turn=0;event(s,'roundEnd');
}
function finishCaptureRound(s:ClubState){
  if(s.capturesBy>=0){s.players[s.capturesBy].taken.push(...s.table);s.table=[];}
  const teams=s.players.length===4?2:s.players.length;
  const piles=Array.from({length:teams},(_,team)=>s.players.flatMap((p,i)=>i%teams===team?p.taken:[]));
  const add=(team:number,points:number)=>s.players.forEach((p,i)=>{if(i%teams===team)p.score+=points;});
  for(const metric of [(p:number[])=>p.length,(p:number[])=>p.filter(c=>suit(c)===1).length,(p:number[])=>{
    const values=[0,16,12,13,14,15,18,21,0,0,0,10,10,10];const best=[0,1,2,3].map(st=>Math.max(0,...p.filter(c=>suit(c)===st).map(c=>values[rank(c)])));return best.every(Boolean)?best.reduce((a,b)=>a+b,0):0;
  }]){
    const points=piles.map(metric),best=Math.max(...points);if(points.filter(v=>v===best).length===1)add(points.indexOf(best),1);
  }
  piles.forEach((p,i)=>{if(p.includes(19))add(i,1);});
  const highScore=Math.max(...s.players.map(p=>p.score));if(highScore>=11&&s.players.slice(0,teams).filter(p=>p.score===highScore).length===1){end(s,highest(s));return;}
  s.phase='round';s.turn=0;event(s,'roundEnd');
}
function settleBlackjack(s:ClubState){
  const dealer=s.players[s.dealer];while(blackjackValue(dealer.hand)<17&&s.stock.length)dealer.hand.push(s.stock.pop()!);
  const dv=blackjackValue(dealer.hand),dn=dv===21&&dealer.hand.length===2;
  s.players.forEach((p,i)=>{if(i===s.dealer)return;const v=blackjackValue(p.hand),natural=v===21&&p.hand.length===2;const result=v>21?-1:dn?(natural?0:-1):natural?1.5:dv>21||v>dv?1:v===dv?0:-1;p.score+=result*p.stake;dealer.score-=result*p.stake;});
  if(s.round+1>=s.players.length*5){end(s,highest(s));return;}
  s.phase='round';s.turn=0;event(s,'roundEnd');
}
function finishEmpty(s:ClubState,index:number){if(!s.players[index].hand.length){s.players[index].score++;end(s,[index],'empty');return true;}return false;}
function finishDoubt(s:ClubState){const played=s.pending!.player;if(!s.players[played].hand.length){finishEmpty(s,played);s.pending=null;return;}s.turn=(played+1)%s.players.length;s.phase='play';s.claim=s.claim%13+1;s.pending=null;}
export function applyAction(s:ClubState,player:number,action:Action):boolean {
  const bluffSelection=s.game==='doubt'&&s.phase==='play'&&player===s.turn&&action.type==='play'&&Array.isArray(action.cards)&&action.cards.length>=1&&action.cards.length<=4&&new Set(action.cards).size===action.cards.length&&action.cards.every(c=>s.players[player].hand.includes(c))&&Object.keys(action).every(k=>k==='type'||k==='cards');
  const customSelection=player===s.turn&&s.phase==='play'&&!!extensionFor(s.game)?.validate?.(s,action);
  if(!bluffSelection&&!customSelection&&!legalActions(s,player).some(a=>actionKey(a)===actionKey(action)))return false;
  s.revision++;
  const p=s.players[player];
  if(action.type==='next'){
    const nextStock=extensionFor(s.game)?.nextStock?.(s);
    s.round++;s.dealer=extensionFor(s.game)?.nextDealer?.(s)??(s.game==='blackjack'?Math.floor(s.round/5)%s.players.length:s.game==='99add'?next(s,s.dealer,1):(s.dealer+1)%s.players.length);startRound(s,nextStock);return true;
  }
  const extension=extensionFor(s.game);if(extension){extension.apply(s,action);return true;}
  if(action.type==='bid'){
    p.bid=action.value!;event(s,'bid',player,p.bid);s.turn=next(s);if(s.players.every(p=>p.bid!==null)){s.phase='play';s.turn=next(s,s.dealer);}return true;
  }
  if(s.game==='daihinmin'){playLadder(s,action);event(s,action.type==='pass'?'pass':'play',player,action.cards?.length);return true;}
  if(s.phase==='reaction'){
    const pending=s.pending!;
    if(action.type==='challenge'){
      const truthful=pending.cards.every(c=>rank(c)===pending.rank),loser=truthful?player:pending.player;s.players[loser].hand=sorted([...s.players[loser].hand,...s.table]);s.table=[];event(s,truthful?'honest':'bluff',loser);finishDoubt(s);
    }else {pending.remaining.shift();if(!pending.remaining.length)finishDoubt(s);else s.turn=pending.remaining[0];}
    return true;
  }
  if(trickGames.has(s.game)){
    const c=action.cards![0];take(s,player,[c]);s.trick.push({player,card:c});if(suit(c)===3)s.broken=true;event(s,'play',player,undefined,c);
    if(s.trick.length===s.players.length){
      const lead=suit(s.trick[0].card);const weight=(c:number)=>(suit(c)===s.trump?100:suit(c)===lead?50:0)+high(c);
      const winner=s.trick.reduce((best,t)=>weight(t.card)>weight(best.card)?t:best).player;s.players[winner].tricks++;s.players[winner].taken.push(...s.trick.map(t=>t.card));s.lastTrick=s.trick;s.trick=[];s.turn=winner;event(s,'trick',winner);
      if(s.players.every(p=>!p.hand.length))finishTrickRound(s);
    }else s.turn=next(s);return true;
  }
  if(captureGames.has(s.game)){
    const [c,...captured]=action.cards!;take(s,player,[c]);
    if(captured.length){s.table=s.table.filter(t=>!captured.includes(t));p.taken.push(c,...captured);s.capturesBy=player;
      if(!s.table.length&&(s.stock.length||s.players.some(p=>p.hand.length))){s.players.forEach((partner,i)=>{if(i===player||s.players.length===4&&i%2===player%2)partner.score++;});event(s,'sweep',player);}
    }else s.table.push(c);
    s.lastTrick=[{player,card:c}];event(s,'capture',player,captured.length,c);s.turn=next(s);
    if(s.players.every(p=>!p.hand.length)){if(s.stock.length)deal(s,3);else finishCaptureRound(s);}return true;
  }
  if(s.game==='oldmaid'){
    const from=s.players[action.target!],c=from.hand.splice(action.index!,1)[0];p.hand.push(c);if(!from.hand.length)from.out=true;pairs(s,player);event(s,'pick',player);
    const alive=s.players.flatMap((p,i)=>!p.out?[i]:[]);if(alive.length<=1){s.players.forEach(p=>{if(p.out)p.score++;});end(s,s.players.flatMap((p,i)=>p.out?[i]:[]),'oldmaid');}else s.turn=next(s);return true;
  }
  if(s.game==='war'){
    const c=p.hand.shift()!;s.trick.push({player,card:c});s.turn=next(s);
    if(s.trick.length===s.players.filter(p=>!p.out).length){
      const max=Math.max(...s.trick.map(t=>high(t.card))),w=s.trick.filter(t=>high(t.card)===max);s.table.push(...s.trick.map(t=>t.card));s.lastTrick=s.trick;s.trick=[];s.total++;
      if(w.length===1){s.players[w[0].player].hand.push(...s.table);s.table=[];event(s,'trick',w[0].player);}else event(s,'tie');
      s.players.forEach(p=>p.out=!p.hand.length);const alive=s.players.flatMap((p,i)=>!p.out?[i]:[]);
      if(alive.length<=1){end(s,alive.length?alive:s.players.map((_,i)=>i),'war');return true;}
      if(s.total>=300){s.players.forEach(p=>p.score=p.hand.length);end(s,highest(s),'limit');return true;}s.turn=next(s,s.dealer);
    }return true;
  }
  if(s.game==='fantan'){
    if(action.type==='pass'){p.score--;s.pool++;event(s,'pass',player);}else{const c=action.cards![0];take(s,player,[c]);s.table.push(c);event(s,'play',player,undefined,c);
      if(!p.hand.length){let total=s.pool;s.players.forEach((q,i)=>{if(i!==player){q.score-=q.hand.length;total+=q.hand.length;}});p.score+=total;end(s,[player],'empty');return true;}}
    s.turn=next(s);return true;
  }
  if(s.game==='crazyeight'){
    if(action.type==='draw'){p.hand=sorted([...p.hand,s.stock.pop()!]);event(s,'draw',player);return true;}
    if(action.type==='pass'){event(s,'pass',player);s.pool++;if(s.pool>=s.players.length){s.players.forEach(p=>p.score=-p.hand.reduce((v,c)=>v+(rank(c)===8?50:Math.min(rank(c),10)),0));end(s,highest(s),'blocked');return true;}}
    else {const c=action.cards![0];take(s,player,[c]);s.table.push(c);s.activeSuit=action.suit??suit(c);s.pool=0;event(s,'play',player,undefined,c);if(!p.hand.length){let total=0;s.players.forEach((q,i)=>{if(i!==player){const debt=q.hand.reduce((v,c)=>v+(rank(c)===8?50:Math.min(rank(c),10)),0);q.score-=debt;total+=debt;}});p.score+=total;end(s,[player],'empty');return true;}}
    s.turn=next(s);return true;
  }
  if(s.game==='gofish'||s.game==='authors'){
    if(action.type==='draw'){p.hand.push(s.stock.pop()!);books(s,player);}else if(action.type==='ask'){
      const other=s.players[action.target!],cards=other.hand.filter(c=>rank(c)===action.value&&(action.suit===undefined||suit(c)===action.suit));other.hand=other.hand.filter(c=>!cards.includes(c));p.hand.push(...cards);event(s,'ask',player,action.value);
      let again=cards.length>0;if(!again&&s.game==='gofish'&&s.stock.length){const c=s.stock.pop()!;p.hand.push(c);again=rank(c)===action.value;event(s,'draw',player);}books(s,player);
      if(!p.hand.length&&s.game==='gofish'&&s.stock.length)p.hand.push(s.stock.pop()!);if(!again)s.turn=next(s);
    }else s.turn=next(s);
    if(s.players.reduce((v,p)=>v+p.books.length,0)===13){end(s,highest(s));return true;}
    s.players.forEach(p=>{p.hand=sorted(p.hand);p.out=!p.hand.length&&!s.stock.length;});if(s.players[s.turn].out)s.turn=next(s);return true;
  }
  if(s.game==='doubt'){
    const cards=action.cards!;take(s,player,cards);s.table.push(...cards);const remaining=Array.from({length:s.players.length-1},(_,k)=>(player+k+1)%s.players.length);s.pending={player,cards,rank:s.claim,remaining};s.phase='reaction';s.turn=remaining[0];event(s,'claim',player,cards.length);return true;
  }
  if(s.game==='99add'){
    if(action.type==='bust'){
      p.lives--;p.out=p.lives<=0;event(s,'life',player,p.lives);if(s.players.filter(p=>!p.out).length===1){end(s,s.players.flatMap((p,i)=>!p.out?[i]:[]),'survivor');return true;}s.phase='round';s.turn=0;return true;
    }
    const c=action.cards![0];take(s,player,[c]);s.discard.push(c);s.total=action.value!;if(rank(c)===4)s.direction*=-1;replenish(s);if(s.stock.length)p.hand=sorted([...p.hand,s.stock.pop()!]);s.lastTrick=[{player,card:c}];event(s,'total',player,s.total,c);s.turn=next(s);return true;
  }
  if(s.game==='blackjack'){
    if(action.type==='hit'||action.type==='double'){if(action.type==='double')p.stake=2;p.hand.push(s.stock.pop()!);}
    if(action.type!=='hit'||blackjackValue(p.hand)>=21)p.out=true;
    if(p.out){s.turn=next(s);if(s.turn===s.dealer||s.players.every((p,i)=>i===s.dealer||p.out))settleBlackjack(s);}return true;
  }
  return false;
}

export function viewFor(s:ClubState,index:number):ClubView{
  const reveal=s.phase==='round'||s.phase==='result';
  return {...s,players:s.players.map((p,i)=>{const {taken,hand,...publicPlayer}=p;return {...publicPlayer,hand:reveal||i===index&&!classicHideOwnHand(s,i)&&!['war','beggar'].includes(s.game)?hand:s.game==='blackjack'&&i===s.dealer?hand.slice(0,1):[],handCount:hand.length,takenCount:taken.length};}),
    seed:0,whistHonors:reveal?s.whistHonors:[0,0],stock:s.stock.length,discard:s.discard.length,pending:s.pending?{player:s.pending.player,count:s.pending.cards.length,rank:s.pending.rank}:null,
    extra:publicExtension(s),table:classicHideTable(s)?s.table.map(()=>-1):s.game==='doubt'?s.table.map(()=>-1):s.game==='pishti'?s.table.map((c,i)=>i<s.extra.opening?-1:c):s.table,self:index,actions:legalActions(s,index),
  };
}

/** CPU policy consumes the same filtered view as a remote player. */
export function cpuAction(view:ClubView):Action|undefined{
  const actions=view.actions,p=view.players[view.self];if(!actions.length)return;
  if(view.phase==='round')return actions[0];
  const extensionAction=extensionCPU(view);if(extensionAction)return extensionAction;
  if(view.phase==='bid'){
    const estimate=p.hand.reduce((n,c)=>n+(high(c)>=12?.6:0)+(suit(c)===view.trump?.18:0),0);return actions.reduce((best,a)=>Math.abs((a.value||0)-estimate)<Math.abs((best.value||0)-estimate)?a:best);
  }
  if(view.phase==='reaction'){
    const known=p.hand.filter(c=>rank(c)===view.pending!.rank).length;
    return actions[known+view.pending!.count>4?0:1];
  }
  if(view.game==='blackjack')return actions.find(a=>a.type===(blackjackValue(p.hand)<16?'hit':'stand'))||actions[0];
  if(view.game==='doubt'){
    const truthful=p.hand.filter(c=>rank(c)===view.claim).slice(0,4);
    return actions.find(a=>actionKey(a)===actionKey({type:'play',cards:truthful.length?truthful:[p.hand[0]]}))||actions[0];
  }
  if(view.game==='oldmaid')return actions[(view.seed+view.revision*37)%actions.length];
  if(view.game==='daihinmin'){const plays=actions.filter(a=>a.type==='play');return plays.length?plays.reduce((best,a)=>(a.cards?.length||0)>(best.cards?.length||0)?a:best):actions[0];}
  if(captureGames.has(view.game))return actions.reduce((best,a)=>(a.cards?.length||0)>(best.cards?.length||0)?a:best);
  if(view.game==='99add')return actions.reduce((best,a)=>(a.value??Infinity)<(best.value??Infinity)?a:best);
  if(view.game==='crazyeight')return actions.find(a=>a.type==='play'&&rank(a.cards![0])!==8)||actions[0];
  if(trickGames.has(view.game)){
    const target=p.bid??99,want=p.tricks<target;
    return actions.reduce((best,a)=>want?high(a.cards![0])>high(best.cards![0])?a:best:high(a.cards![0])<high(best.cards![0])?a:best);
  }
  return actions[(view.seed+view.revision*17)%actions.length];
}
