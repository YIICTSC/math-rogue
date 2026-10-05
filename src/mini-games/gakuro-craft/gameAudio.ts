import type {GameKind,HomeGame} from './homeGames';
export const HOBBY_SOUNDS={start:1000,win:1800,lose:750,relic:900,'dart-hit':300,'dart-bull':700,'pool-cue':250,'pool-hit':220,'pool-rail':220,'pool-pocket':450,'bowl-roll':1500,'bowl-pin':700,'bowl-strike':1200,'board-place':220,'board-flip':450,'coin-drop':250,'card-flip':250,'card-match':600,dice:700,'race-move':300,'brick-hit':180,bounce:140,signal:220,'react-good':350,miss:300,'note-0':220,'note-1':200,'note-2':140,'note-3':260} as const;
export type HobbySound=keyof typeof HOBBY_SOUNDS;
export const GAME_SOUND_BANK:Record<GameKind,HobbySound[]>={darts:['dart-hit','dart-bull'],billiards:['pool-cue','pool-hit','pool-rail','pool-pocket','miss'],bowling:['bowl-roll','bowl-pin','bowl-strike'],reversi:['board-place','board-flip'],connectfour:['coin-drop'],memory:['card-flip','card-match','miss'],race:['dice','race-move'],arcade:['brick-hit','bounce','miss'],reaction:['signal','react-good','miss'],rhythm:['note-0','note-1','note-2','note-3','relic','miss']};
export function gameAudioSnapshot(g:HomeGame,selfId:string){const i=g.players.indexOf(selfId),p=g.pool,s=g.party,c=g.courts?.[i];return {key:g.key,kind:g.kind,phase:g.phase,won:g.winner.includes(i),input:g.lastInput,round:g.round,board:s?.board?.join(),open:s?.open?.join(),matches:s?.matched?.filter(Boolean).length||0,die:s?.die,positions:s?.positions?.join(),shot:s?.shot?{start:s.shot.start,result:s.shot.result}:undefined,signal:s?.signal?.at,acted:s?.signal?.acted[i],reaction:s?.signal?.times[i],moving:p?.moving,firstHit:p?.firstHit,balls:p?.balls.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,potted:b.potted})),dart:g.darts?.throws.at(-1)?.score,bricks:c?.bricks.join(),hits:c?.hits,lives:c?.lives,picked:g.expedition?.picked.includes(selfId)};}
export type GameAudioSnapshot=ReturnType<typeof gameAudioSnapshot>;
export function gameAudioEvents(before:GameAudioSnapshot|undefined,now:GameAudioSnapshot):HobbySound[]{
 if(!before||before.key!==now.key)return [];
 const cues=new Set<HobbySound>();if(!before.picked&&now.picked)cues.add('relic');
 if(before.phase!=='playing'&&now.phase==='playing'){cues.add('start');return [...cues];}
 if(before.phase==='playing'&&now.phase==='finished')cues.add(now.won?'win':'lose');
 if(before.phase!=='playing')return [...cues];
 switch(now.kind){
 case'darts':if(now.input!==before.input)cues.add((now.dart||0)>=50?'dart-bull':'dart-hit');break;
 case'billiards':{
  if(!before.moving&&now.moving)cues.add('pool-cue');
  if(before.balls&&now.balls){for(let i=0;i<now.balls.length;i++){const a=before.balls[i],b=now.balls[i];if(!a||!b)continue;if(!a.potted&&b.potted)cues.add(i===0?'miss':'pool-pocket');const speed=Math.hypot(a.vx,a.vy),next=Math.hypot(b.vx,b.vy);if(before.moving&&now.moving&&!b.potted&&speed>.12&&next>.1&&(a.vx*b.vx+a.vy*b.vy)/(speed*next)<.7)cues.add(b.x<.035||b.x>.965||b.y<.05||b.y>.95?'pool-rail':'pool-hit');}}
  if(before.firstHit===-1&&(now.firstHit||0)>0)cues.add('pool-hit');break;
 }
 case'bowling':if(now.shot?.start!==before.shot?.start&&now.shot)cues.add('bowl-roll');if(before.shot&&!now.shot)cues.add(before.shot.result===10?'bowl-strike':before.shot.result>0?'bowl-pin':'miss');break;
 case'reversi':if(now.board!==before.board){cues.add('board-place');cues.add('board-flip');}break;
 case'connectfour':if(now.board!==before.board)cues.add('coin-drop');break;
 case'memory':if(now.matches>before.matches)cues.add('card-match');else if(now.open!==before.open&&now.open){cues.add('card-flip');if(now.open.split(',').length===2)cues.add('miss');}break;
 case'race':if(now.positions!==before.positions||now.round!==before.round){cues.add('dice');cues.add('race-move');}break;
 case'arcade':if(now.bricks!==before.bricks)cues.add('brick-hit');if((now.hits||0)>(before.hits||0))cues.add('bounce');if((now.lives||0)<(before.lives||0))cues.add('miss');break;
 case'reaction':if(!before.acted&&now.acted)cues.add((now.reaction||0)>=0?'react-good':'miss');break;
 }
 return [...cues];
}
