import type {HomeGame,HomeGameWorld} from '../homeGames';
import {COIN_RELICS,COIN_EVENTS,type CoinRelicId} from './catalog';
export type CoinKind='coin'|'gold'|'gem'|'refill'|'curse'|'crown';
export interface DozerCoin {id:number;x:number;y:number;h:number;vh:number;vx:number;vy:number;kind:CoinKind}
export interface CoinRun {seed:number;stage:number;phase:'playing'|'choice'|'route'|'shop'|'event'|'cleared'|'failed';stock:number;vault:number;score:number;goal:number;stageScore:number;coins:DozerCoin[];relics:CoinRelicId[];choices:CoinRelicId[];route:'garden'|'vault'|'storm';combo:number;comboAt:number;lastDrop:number;drops:number;pulses:number;guards:number;revives:number;clock:number;emptyAt?:number;nextId:number;event:number;lost:number;lastWin:number}
export interface CoinState {runs:CoinRun[];time:number}
export type CoinCommand={type:'game_coin_drop'|'game_coin_pulse';key:string;stage:number;x:number}|{type:'game_coin_choice';key:string;stage:number;relic:string}|{type:'game_coin_route';key:string;stage:number;route:string}|{type:'game_coin_buy';key:string;stage:number;relic:string}|{type:'game_coin_event';key:string;stage:number;choice:0|1};
const level=(r:CoinRun,id:CoinRelicId)=>r.relics.filter(x=>x===id).length;
const random=(r:CoinRun)=>{r.seed=(Math.imul(r.seed,1664525)+1013904223)>>>0;return r.seed/4294967296;};
const radius=(c:DozerCoin)=>c.kind==='crown'?.2:.145;
function spawn(r:CoinRun,x:number,y:number,kind:CoinKind,h=0){if(r.coins.length>=150)return;r.coins.push({id:r.nextId++,x,y,h,vh:0,vx:0,vy:0,kind});}
function kind(r:CoinRun):CoinKind {const n=random(r),risk=.025+level(r,'risk')*.08;return n<risk?'curse':n<risk+.04?'refill':n<risk+.08+level(r,'gem')*.08+(r.route==='vault'?.08:0)?'gem':random(r)<.18+level(r,'alchemist')*.2?'gold':'coin';}
function offers(r:CoinRun){const options=COIN_RELICS.map(v=>v[0]).filter(id=>level(r,id)<(id==='ward'||id==='life'?1:3)),picks:CoinRelicId[]=[];while(picks.length<3&&options.length)picks.push(options.splice(Math.floor(random(r)*options.length),1)[0]);return picks;}
function prepare(r:CoinRun){r.phase='playing';r.goal=[28,42,56,72,100][r.stage-1]+(r.route==='vault'?4:0);r.stageScore=0;r.combo=0;r.emptyAt=undefined;r.pulses=2+level(r,'wave');r.guards=level(r,'guard')*3;r.coins=[];
 for(let row=0;row<10;row++)for(let col=0;col<11;col++)spawn(r,-1.45+col*.29,1.42+row*.29,random(r)<.1?'gold':'coin');
 for(let i=0;i<3;i++)spawn(r,(i-1)*.9,3.94,i===1?'refill':'gem');
 if(r.stage===5)spawn(r,0,4,'crown');
}
export function startCoinDozer(w:HomeGameWorld,g:HomeGame){g.expedition=undefined;g.dozer={time:w.time,runs:g.players.map((id,i)=>{const r:CoinRun={seed:(Math.round(w.time*1000)^Math.imul(i+1,2654435761)^g.revision)>>>0,stage:1,phase:'playing',stock:40,vault:0,score:0,goal:28,stageScore:0,coins:[],relics:[],choices:[],route:'garden',combo:0,comboAt:-100,lastDrop:-100,drops:0,pulses:2,guards:0,revives:0,clock:0,nextId:1,event:0,lost:0,lastWin:0};prepare(r);return r;})};g.deadline=w.time+900;g.message='コインの冒険が始まりました。';}
function reward(r:CoinRun,c:DozerCoin,time:number){
 if(c.kind==='curse'&&!level(r,'ward')){r.stock=Math.max(0,r.stock-2);r.combo=0;r.lost++;return;}
 if(c.kind==='refill')r.stock=Math.min(99,r.stock+4+level(r,'refill')*2);
 let value=c.kind==='gold'?2:c.kind==='gem'?4+level(r,'prism')*2:c.kind==='crown'?12+level(r,'boss')*6:1;
 if(Math.abs(c.x)<.55)value+=level(r,'center');
 r.combo=time-r.comboAt<1.6+level(r,'chain')?Math.min(25,r.combo+1):1;r.comboAt=time;
 r.score+=Math.round(value*10*(1+Math.min(10,r.combo)*(.06+level(r,'combo')*.025)+level(r,'fortune')*.15+level(r,'risk')*.35+(r.route==='storm'?.3:0)));
 r.vault+=value;r.stageScore+=value;r.lastWin=time;
 if(random(r)<Math.min(.95,.65+level(r,'rebate')*.15))r.stock=Math.min(99,r.stock+1);
}
function stageComplete(r:CoinRun){r.vault+=level(r,'treasury')*4;if(r.stage===5){r.phase='cleared';r.score+=1000+r.stock*5;return;}r.phase='choice';r.choices=offers(r);}
function afterRelic(r:CoinRun){if(r.stage===2||r.stage===4){r.phase='event';r.event=Math.floor(random(r)*COIN_EVENTS.length);}else if(r.stage===3){r.phase='shop';r.choices=offers(r);}else r.phase='route';}
export function coinCommand(w:HomeGameWorld,g:HomeGame,seat:number,c:CoinCommand){const r=g.dozer?.runs[seat];if(!r||c.stage!==r.stage||g.phase!=='playing'||w.paused)return false;
 if(c.type==='game_coin_drop'||c.type==='game_coin_pulse'){
  if(r.phase!=='playing'||!Number.isFinite(c.x)||Math.abs(c.x)>1.5)return false;
  if(c.type==='game_coin_drop'){if(r.stock<1||w.time-r.lastDrop<.16||r.coins.length>145)return false;r.stock--;r.lastDrop=w.time;r.drops++;r.emptyAt=undefined;spawn(r,c.x,1.03,kind(r),1.8);if(random(r)<Math.min(.75,level(r,'twin')*.25))spawn(r,Math.max(-1.48,Math.min(1.48,c.x+.22)),1.03,kind(r),1.95);if(r.drops%6===0){r.stock=Math.min(99,r.stock+1+level(r,'supply')*3);for(let i=0;i<3;i++)spawn(r,Math.max(-1.45,Math.min(1.45,c.x+(i-1)*.3)),1.2,'gold',1.2+i*.12);}}
  else {if(!r.pulses)return false;r.pulses--;for(const coin of r.coins)if(Math.abs(coin.x-c.x)<.7)coin.vy+=3.2*(1+level(r,'force')*.3);}
 }else if(c.type==='game_coin_choice'){
  if(r.phase!=='choice'||!r.choices.includes(c.relic as CoinRelicId))return false;r.relics.push(c.relic as CoinRelicId);afterRelic(r);
 }else if(c.type==='game_coin_route'){
  if(r.phase!=='route'||!['garden','vault','storm'].includes(c.route))return false;r.route=c.route as CoinRun['route'];r.stage++;r.stock=Math.min(99,r.stock+12+level(r,'mint')*5+(r.route==='garden'?3:0));prepare(r);
 }else if(c.type==='game_coin_buy'){
  if(r.phase!=='shop')return false;if(c.relic!=='skip'){const cost=Math.max(2,(c.relic==='supply-coins'?4:8)-level(r,'coupon')*2);if(r.vault<cost||c.relic!=='supply-coins'&&!r.choices.includes(c.relic as CoinRelicId))return false;r.vault-=cost;if(c.relic==='supply-coins')r.stock=Math.min(99,r.stock+10);else r.relics.push(c.relic as CoinRelicId);}r.phase='route';
 }else if(c.type==='game_coin_event'){
  if(r.phase!=='event'||![0,1].includes(c.choice))return false;
  if(c.choice===0)r.stock=Math.min(99,r.stock+6+(r.event===4?3:0));
  else {const choices=offers(r);if(r.stock<4||!choices.length)return false;r.stock-=4;r.relics.push(choices[0]);r.vault+=r.event===3?6:2;}r.phase='route';
 }else return false;
 g.scores[seat]=r.score;g.revision++;return true;
}
function step(r:CoinRun,dt:number,time:number){r.clock+=dt;const reach=.95*(1+level(r,'reach')*.12),period=2.2*Math.pow(.85,level(r,'turbo')),push=.65+reach*(1-Math.cos(r.clock/period*Math.PI*2))/2;
 for(const c of r.coins){if(c.h>0){c.vh-=6*dt;c.h=Math.max(0,c.h+c.vh*dt);if(c.h===0){c.vh=0;c.vy+=.65;for(const near of r.coins)if(near!==c&&!near.h&&Math.abs(near.x-c.x)<.48&&near.y>c.y&&near.y-c.y<1.3)near.vy+=.38;}continue;}if(r.route==='storm')c.vx+=Math.sin(r.clock*1.7)*.14*dt*Math.pow(.5,level(r,'drift'));c.x+=c.vx*dt;c.y+=c.vy*dt;c.vx*=Math.exp(-2.2*dt);c.vy*=Math.exp(-2.2*dt);const min=push+radius(c);if(c.y<min){c.y=min;c.vy=Math.max(c.vy,.18);}}
 // Planar disk contacts on the cabinet surface, plus vertical gravity on insertion.
 for(let pass=0;pass<6;pass++)for(let i=0;i<r.coins.length;i++)for(let j=i+1;j<r.coins.length;j++){const a=r.coins[i],b=r.coins[j];if(a.h||b.h)continue;const dx=b.x-a.x,dy=b.y-a.y,min=radius(a)+radius(b),d2=dx*dx+dy*dy;if(d2>=min*min)continue;const d=Math.sqrt(d2)||.0001,nx=d2?dx/d:0,ny=d2?dy/d:1,over=(min-d)*.51;a.x-=nx*over;a.y-=ny*over;b.x+=nx*over;b.y+=ny*over;if(a.y<push+radius(a))a.y=push+radius(a);if(b.y<push+radius(b))b.y=push+radius(b);}
 const countBefore=r.coins.length,scoreBefore=r.stageScore;
 r.coins=r.coins.filter(c=>{if(c.h)return true;if(c.y>4.2){reward(r,c,time);return false;}if(Math.abs(c.x)>1.66){if(r.guards>0){r.guards--;reward(r,c,time);}else r.lost++;return false;}return true;});
 // A genuine multi-coin payout feeds a visible bonus shower back onto the board.
 if(countBefore-r.coins.length>=3&&r.stageScore>scoreBefore){for(let i=0;i<5;i++)spawn(r,-1.16+i*.58,1.4,i===2?'gold':'coin',1.5+i*.1);}
}
export function tickCoinDozer(w:HomeGameWorld,g:HomeGame,dt:number){const state=g.dozer;if(!state)return;state.time=w.time;const delta=Math.min(.25,Math.max(0,dt)),steps=Math.max(1,Math.ceil(delta/(1/30)));
 state.runs.forEach((r,i)=>{if(r.phase!=='playing')return;for(let s=0;s<steps;s++)step(r,delta/steps,w.time);if(r.stageScore>=r.goal&&r.drops>=3)stageComplete(r);
  else if(r.stock===0){r.emptyAt??=w.time;if(w.time-r.emptyAt>10){if(level(r,'life')>r.revives){r.revives++;r.stock=10;r.emptyAt=undefined;}else r.phase='failed';}}else r.emptyAt=undefined;
  for(const c of r.coins)for(const key of ['x','y','h','vh','vx','vy'] as const)c[key]=Math.round(c[key]*10000)/10000;
  g.scores[i]=r.score;
 });
 if(w.time>=g.deadline)for(const r of state.runs)if(r.phase!=='cleared')r.phase='failed';
 if(state.runs.every(r=>r.phase==='cleared'||r.phase==='failed')){g.phase='finished';const best=Math.max(...g.scores);g.winner=g.scores.map((score,i)=>score===best?i:-1).filter(i=>i>=0);g.message=state.runs.some(r=>r.phase==='cleared')?'黄金竜の宝庫を攻略しました！':'今回の冒険はここまで。';}
 g.revision++;
}
