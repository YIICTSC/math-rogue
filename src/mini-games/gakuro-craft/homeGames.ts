import type {Reply} from './engine';
import type {Home} from './progression';
import type {HomeDirectory} from './homeSocial';
export interface HomeGamePlayer {id:string;name:string;indoors:boolean;homeTile?:number;progress:{home:Home}}
export interface HomeGameWorld extends HomeDirectory {time:number;paused:boolean;games:Record<string,HomeGame>;players:Record<string,HomeGamePlayer>}
type World=HomeGameWorld;
type Player=HomeGamePlayer;
import {homeAt,roomTile} from './homeSocial';
export type GameKind='darts'|'billiards'|'arcade';
export type GameCommand={type:'game_join';slot:number}|{type:'game_leave'|'game_start';key:string}|{type:'game_dart';key:string;x:number;y:number}|{type:'game_shot';key:string;angle:number;power:number}|{type:'game_cue';key:string;x:number;y:number}|{type:'game_paddle';key:string;x:number};
export type Ball={id:number;x:number;y:number;vx:number;vy:number;potted:boolean};
export type BreakCourt={x:number;target:number;ball:{x:number;y:number;vx:number;vy:number};bricks:number[];lives:number;score:number;hits:number};
export type HomeGame={key:string;homeTile:number;slot:number;kind:GameKind;phase:'lobby'|'playing'|'finished';players:string[];names:string[];scores:number[];turn:number;round:number;deadline:number;winner:number[];message:string;revision:number;lastInput:number;darts?:{left:number;start:number;throws:{x:number;y:number;score:number}[]};pool?:{balls:Ball[];moving:boolean;groups:[number,number];firstHit:number;shotTeam:number;shotPots:number[];scratch:boolean;ballInHand:boolean;lastShot:number;eightAllowed:boolean;rail:boolean};courts?:BreakCourt[]};
const reply=(text:string,cue='ui'):Reply=>({type:'notice',text,cue});
const gameKind=(item:string):item is GameKind=>['darts','billiards','arcade'].includes(item);
const present=(w:World,g:HomeGame,id:string)=>{const p=w.players[id];return !!p&&p.indoors&&roomTile(p)===g.homeTile;};
export const gameOf=(w:World,id:string)=>Object.values(w.games||{}).find(g=>g.players.includes(id));
const next=(w:World,g:HomeGame)=>{g.turn=(g.turn+1)%g.players.length;g.deadline=w.time+60;g.round++;if(g.darts){g.darts.left=3;g.darts.start=g.scores[g.turn];}};
function finish(g:HomeGame,winners:number[],message:string){g.phase='finished';g.winner=winners;g.message=message;g.revision++;}
function rack():Ball[]{const b:Ball[]=[{id:0,x:.25,y:.5,vx:0,vy:0,potted:false}];const order=[1,9,2,10,8,3,11,4,12,5,13,6,14,7,15];let k=0;for(let row=0;row<5;row++)for(let j=0;j<=row;j++)b.push({id:order[k++],x:.69+row*.028,y:.5+(j-row/2)*.036,vx:0,vy:0,potted:false});return b;}
function start(w:World,g:HomeGame){g.phase='playing';g.turn=0;g.round=1;g.deadline=w.time+(g.kind==='arcade'?75:60);g.winner=[];g.message='対戦開始！';g.revision++;g.scores=g.players.map(()=>g.kind==='darts'?301:0);g.names=g.players.map(id=>w.players[id]?.name||'Guest');if(g.kind==='darts')g.darts={left:3,start:301,throws:[]};if(g.kind==='billiards')g.pool={balls:rack(),moving:false,groups:[0,0],firstHit:-1,shotTeam:0,shotPots:[],scratch:false,ballInHand:false,lastShot:w.time,eightAllowed:false,rail:false};if(g.kind==='arcade')g.courts=g.players.map((_,i)=>({x:.5,target:.5,ball:{x:.5,y:.8,vx:(i%2?-.22:.22),vy:-.44},bricks:Array(32).fill(1),lives:3,score:0,hits:0}));}
export function dartScore(x:number,y:number){const r=Math.hypot(x,y);if(r>1)return {score:0,double:false};if(r<.035)return {score:50,double:true};if(r<.09)return {score:25,double:false};const order=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5],a=(Math.atan2(x,-y)+Math.PI*2+Math.PI/20)%(Math.PI*2),n=order[Math.floor(a/(Math.PI/10))],double=r>.92;return {score:n*(double?2:r>.56&&r<.64?3:1),double};}
export function gameCommand(w:World,p:Player,c:GameCommand):Reply|undefined{
 w.games??={};if(!p.indoors)return reply('家の中で趣味家具を選びましょう。','error');
 if(c.type==='game_join'){
  const home=homeAt(w,roomTile(p)),f=home?.furniture.find(f=>f.slot===c.slot);if(!f||!gameKind(f.item))return;const key=home!.tile+':'+f.slot;let g=w.games[key];const old=gameOf(w,p.id);if(old&&old.key!==key)return reply('参加中の対戦から退出してください。','error');
  if(!g)g=w.games[key]={key,homeTile:home!.tile,slot:f.slot,kind:f.item,phase:'lobby',players:[],names:[],scores:[],turn:0,round:0,deadline:0,winner:[],message:'友達を待っています。',revision:0,lastInput:-1};
  if(g.players.includes(p.id))return;if(g.phase==='playing'||g.players.length>=4)return reply('対戦中か、4人そろっています。','error');g.players.push(p.id);g.names.push(p.name);g.scores.push(0);if(g.phase==='finished'){g.phase='lobby';g.winner=[];}g.revision++;return reply('対戦に参加しました！');
 }
 if(typeof c.key!=='string'||!Object.hasOwn(w.games,c.key))return;const g=w.games[c.key];if(!g||!g.players.includes(p.id)||!present(w,g,p.id))return;
 if(c.type==='game_leave'){removePlayer(w,g,p.id);return reply('対戦から退出しました。');}
 if(c.type==='game_start'){if(!homeAt(w,g.homeTile)?.furniture.some(f=>f.slot===g.slot&&f.item===g.kind))return;if(g.phase==='playing'||g.players[0]!==p.id)return;start(w,g);return reply('対戦開始！');}
 if(g.phase!=='playing'||w.paused)return;
 const seat=g.players.indexOf(p.id);
 if(c.type==='game_paddle'){if(g.kind!=='arcade'||!Number.isFinite(c.x))return;g.courts![seat].target=Math.max(.1,Math.min(.9,c.x));return;}
 if(seat!==g.turn)return;
 if(c.type==='game_dart'){
  if(g.kind!=='darts'||![c.x,c.y].every(Number.isFinite)||Math.abs(c.x)>1.3||Math.abs(c.y)>1.3||w.time-g.lastInput<.5)return;g.lastInput=w.time;const d=g.darts!,hit=dartScore(c.x,c.y),score=g.scores[seat]-hit.score;d.throws.push({x:c.x,y:c.y,score:hit.score});if(d.throws.length>12)d.throws.shift();d.left--;g.revision++;
  if(score===0&&hit.double){g.scores[seat]=0;finish(g,[seat],'ダブルでフィニッシュ！');return reply('ダブルでフィニッシュ！','donate');}
  if(score<2){g.scores[seat]=d.start;g.message='バースト！この手番の得点は無効です。';next(w,g);}else{g.scores[seat]=score;g.message='ダーツを投げました。';if(!d.left)next(w,g);}
  if(g.round>80&&g.phase==='playing'){const low=Math.min(...g.scores);finish(g,g.scores.map((v,i)=>v===low?i:-1).filter(i=>i>=0),'残り得点で決着しました。');}return reply(g.message,'build');
 }
 if(c.type==='game_cue'){const pool=g.pool;if(g.kind!=='billiards'||!pool||pool.moving||!pool.ballInHand||![c.x,c.y].every(Number.isFinite)||c.x<.04||c.x>.96||c.y<.07||c.y>.93)return;const cue=pool.balls[0];if(pool.balls.some(b=>b.id&&!b.potted&&Math.hypot((b.x-c.x)*2,b.y-c.y)<.07))return;cue.x=c.x;cue.y=c.y;cue.potted=false;return;}
 if(c.type==='game_shot'){
  const pool=g.pool;if(g.kind!=='billiards'||!pool||pool.moving||![c.angle,c.power].every(Number.isFinite)||c.power<.1||c.power>1||w.time-g.lastInput<.5)return;g.lastInput=w.time;const cue=pool.balls[0];cue.potted=false;cue.vx=Math.cos(c.angle)*c.power*3;cue.vy=Math.sin(c.angle)*c.power*3;pool.moving=true;pool.ballInHand=false;pool.firstHit=-1;pool.shotTeam=seat%2;pool.shotPots=[];pool.scratch=false;pool.lastShot=w.time;pool.rail=false;const group=pool.groups[seat%2];pool.eightAllowed=!!group&&!pool.balls.some(b=>b.id&&b.id!==8&&!b.potted&&(group===1?b.id<8:b.id>8));g.deadline=w.time+75;g.revision++;return reply('ショット！','build');
 }
}
function removePlayer(w:World,g:HomeGame,id:string){const i=g.players.indexOf(id);if(i<0)return;const wasPlaying=g.phase==='playing';g.players.splice(i,1);g.names.splice(i,1);g.scores.splice(i,1);g.courts?.splice(i,1);if(!g.players.length){delete w.games[g.key];return;}g.turn=Math.min(g.turn,g.players.length-1);if(wasPlaying||g.phase==='finished'){g.phase='lobby';g.message='参加者が退出しました。もう一度開始できます。';g.winner=[];}g.revision++;}
const radius=.018,pockets=[[0,0],[1,0],[0,1],[1,1],[.5,0],[.5,1]];
function settlePool(w:World,g:HomeGame){const p=g.pool!,solo=g.players.length===1,team=p.shotTeam,group=p.groups[team],target=(id:number)=>!group?id!==8:(group===1?id<8:id>8),first=p.balls.find(b=>b.id===p.firstHit),remaining=p.balls.filter(b=>b.id&&!b.potted&&target(b.id));let foul=p.scratch||p.firstHit<1||(!p.rail&&!p.shotPots.length);
 if(group&&first&&!(target(first.id)||(first.id===8&&p.eightAllowed)))foul=true;
 if(p.shotPots.includes(8)){const legal=!foul&&p.eightAllowed&&remaining.length===0;const winners=solo?(legal?[0]:[]):g.players.map((_,i)=>(legal?i%2===team:i%2!==team)?i:-1).filter(i=>i>=0);finish(g,winners,legal?'8ボールを沈めて勝利！':'8ボールのファウルです。');return;}
 if(!group&&!foul){const id=p.shotPots.find(id=>id>0&&id!==8);if(id){p.groups[team]=id<8?1:2;p.groups[1-team]=id<8?2:1;}}
 const ownPots=p.shotPots.filter(id=>id&&id!==8&&(!p.groups[team]||(p.groups[team]===1?id<8:id>8))).length;g.scores[g.turn]+=ownPots;
 if(foul){const cue=p.balls[0];cue.potted=false;cue.x=.25;cue.y=.5;cue.vx=cue.vy=0;p.ballInHand=true;g.message='ファウル。次の人は手玉を置けます。';next(w,g);}else if(ownPots){g.message='ポケット成功！続けてショット。';g.deadline=w.time+60;}else{g.message='次のプレイヤーの手番です。';next(w,g);}p.moving=false;g.revision++;
}
function poolStep(w:World,g:HomeGame,dt:number){const p=g.pool!;if(!p.moving)return;const bs=p.balls,sub=Math.max(4,Math.ceil(Math.max(...p.balls.map(b=>Math.hypot(b.vx,b.vy)))*dt/.012));
 for(let step=0;step<sub;step++){
  for(const b of bs){if(b.potted)continue;b.x+=b.vx*dt/sub/2;b.y+=b.vy*dt/sub;const drag=Math.exp(-1.6*dt/sub);b.vx*=drag;b.vy*=drag;
   if(pockets.some(([x,y])=>Math.hypot((b.x-x)*2,b.y-y)<.065)){b.potted=true;b.vx=b.vy=0;p.shotPots.push(b.id);if(!b.id)p.scratch=true;continue;}
   if(b.x<radius/2||b.x>1-radius/2){b.x=Math.max(radius/2,Math.min(1-radius/2,b.x));b.vx*=-.86;if(p.firstHit>0)p.rail=true;}if(b.y<radius||b.y>1-radius){b.y=Math.max(radius,Math.min(1-radius,b.y));b.vy*=-.86;if(p.firstHit>0)p.rail=true;}
  }
  for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const a=bs[i],b=bs[j];if(a.potted||b.potted)continue;const dx=(b.x-a.x)*2,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=radius*2||!d)continue;const nx=dx/d,ny=dy/d,over=(radius*2-d)/2;a.x-=nx*over/2;a.y-=ny*over;b.x+=nx*over/2;b.y+=ny*over;const v=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(v>0){a.vx-=v*nx;a.vy-=v*ny;b.vx+=v*nx;b.vy+=v*ny;if(a.id===0&&p.firstHit<0)p.firstHit=b.id;}}
 }
 if(bs.every(b=>b.potted||Math.hypot(b.vx,b.vy)<.012)||w.time-p.lastShot>20){for(const b of bs)b.vx=b.vy=0;settlePool(w,g);}
}
function breakStep(g:HomeGame,dt:number){g.courts!.forEach((c,index)=>{if(c.lives<=0)return;c.x+=(c.target-c.x)*Math.min(1,dt*18);const b=c.ball;for(let s=0;s<3;s++){const d=dt/3;b.x+=b.vx*d;b.y+=b.vy*d;if(b.x<.025||b.x>.975){b.x=Math.max(.025,Math.min(.975,b.x));b.vx*=-1;}if(b.y<.03){b.y=.03;b.vy=Math.abs(b.vy);}if(b.vy>0&&b.y>=.9&&b.y<=.94&&Math.abs(b.x-c.x)<.13){b.y=.9;b.vy=-Math.min(.85,.45+c.hits*.006);b.vx=(b.x-c.x)*3;c.hits++;}if(b.y>1){c.lives--;b.x=c.x;b.y=.8;b.vx=.22;b.vy=-.44;}
 for(let i=0;i<c.bricks.length;i++){if(!c.bricks[i])continue;const x=.04+(i%8)*.115,y=.12+Math.floor(i/8)*.065;if(b.x>x-.02&&b.x<x+.105&&b.y>y-.02&&b.y<y+.055){c.bricks[i]=0;c.score+=10;b.vy*=-1;break;}}
 }if(c.bricks.every(v=>!v)){c.bricks.fill(1);c.score+=100;}g.scores[index]=c.score;});}
export function tickGames(w:World,dt:number){w.games??={};for(const g of Object.values(w.games)){if(!homeAt(w,g.homeTile)?.furniture.some(f=>f.slot===g.slot&&f.item===g.kind)){delete w.games[g.key];continue;}for(const id of [...g.players])if(!present(w,g,id))removePlayer(w,g,id);if(!w.games[g.key]||g.phase!=='playing')continue;if(g.kind==='billiards')poolStep(w,g,dt);if(g.kind==='arcade')breakStep(g,dt);if(w.time>=g.deadline){if(g.kind==='arcade'){const best=Math.max(...g.scores);finish(g,g.scores.map((v,i)=>v===best?i:-1).filter(i=>i>=0),'タイムアップ！');}else{g.message='時間切れ。次の手番です。';if(g.darts)g.scores[g.turn]=g.darts.start;if(g.pool?.moving)continue;next(w,g);g.revision++;}}if(g.kind==='arcade'&&g.courts!.every(c=>c.lives<=0)){const best=Math.max(...g.scores);finish(g,g.scores.map((v,i)=>v===best?i:-1).filter(i=>i>=0),'ゲーム終了！');}}}
