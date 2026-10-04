import {turnSeconds} from './gameExpedition';
import type {HomeGame,HomeGameWorld,GameKind} from './homeGames';

export const PARTY_KINDS=['reversi','connectfour','memory','race','bowling','reaction'] as const;
export type PartyKind=typeof PARTY_KINDS[number];
export const isPartyKind=(kind:string):kind is PartyKind=>(PARTY_KINDS as readonly string[]).includes(kind);
export const GAME_LABELS:Record<GameKind,string>={rhythm:'学ロリズム',darts:'ダーツ301',billiards:'8ボール',arcade:'コズミックブレイク',reversi:'チームリバーシ',connectfour:'チーム四目並べ',memory:'宝物の神経衰弱',race:'星のすごろく',bowling:'テンピンボウリング',reaction:'ライトリアクション'};
export const GAME_ICONS:Record<GameKind,string>={rhythm:'🎵',darts:'🎯',billiards:'🎱',arcade:'🕹',reversi:'⚫',connectfour:'🔴',memory:'🃏',race:'🎲',bowling:'🎳',reaction:'💡'};
export const GAME_RULES:Record<PartyKind,string>={
 reversi:'2人または4人。黒と白の2チームで交互に置き、挟んだ石を裏返します。置ける場所は光ります。置けない手番は自動パス。最後に石が多いチームの勝ち。',
 connectfour:'2人または4人。2チームで交互に列を選び、下から駒を積みます。縦・横・斜めに4個つながったチームの勝ち。',
 memory:'1〜4人。24枚から同じ宝物を2枚見つけましょう。ペアなら2点でもう一度、不一致なら次の人へ。12ペアで終了。',
 race:'1〜4人。サイコロで40マスの星の道を進みます。青は加速、赤は後退、金はもう一度。最初にゴールした人の勝ち。',
 bowling:'1〜4人。狙い・強さ・カーブを調整して10フレーム対戦。ストライクは次の2投、スペアは次の1投が加点。10フレーム目はボーナス投球あり。',
 reaction:'1〜4人。合図が出たら光ったボタンを押します。12ラウンドの合計点で勝負。早押しほど高得点、合図前や違うボタンは減点。'
};
export type PartyCommand={type:'game_board';key:string;cell:number;round:number}|{type:'game_roll';key:string;round:number;style?:'safe'|'bold'}|{type:'game_bowl';key:string;aim:number;power:number;spin:number;round:number}|{type:'game_react';key:string;target:number;round:number};
export interface BowlingLane {rolls:number[];frames:number[][];pins:boolean[]}
export interface PartyState {seed:number;streaks?:number[];board?:number[];last?:number[];cards?:number[];matched?:boolean[];open?:number[];revealUntil?:number;positions?:number[];die?:number;lanes?:BowlingLane[];shot?:{seat:number;start:number;aim:number;power:number;spin:number;pins:number[];result:number};signal?:{at:number;target:number;acted:boolean[];times:number[]}}
const choose=(s:PartyState,n:number)=>{s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return Math.floor(s.seed/4294967296*n);};
const done=(g:HomeGame,winners:number[],message:string)=>{g.phase='finished';g.winner=winners;g.message=message;g.revision++;};
const highest=(g:HomeGame)=>{const best=Math.max(...g.scores);done(g,g.scores.map((n,i)=>n===best?i:-1).filter(i=>i>=0),'ゲーム終了！');};
const advance=(w:HomeGameWorld,g:HomeGame)=>{g.turn=(g.turn+1)%g.players.length;g.round++;g.deadline=w.time+turnSeconds(g,45);g.revision++;};
export const teamGame=(kind:string)=>kind==='reversi'||kind==='connectfour';
export const boardColor=(g:HomeGame,seat:number)=>g.arranged?seat+1:seat%2+1;
export const canStartParty=(g:HomeGame)=>!teamGame(g.kind)||(g.arranged?g.players.length>=2:g.players.length===2||g.players.length===4);
export function startParty(w:HomeGameWorld,g:HomeGame){
 const s:PartyState={seed:(Math.round(w.time*1000)^g.homeTile^Math.imul(g.revision+1,2654435761))>>>0};g.party=s;if(g.arranged)s.streaks=g.players.map(()=>0);g.deadline=w.time+turnSeconds(g,45);
 if(g.kind==='reversi'){s.board=Array(64).fill(0);s.board[27]=s.board[36]=2;s.board[28]=s.board[35]=1;if(g.arranged&&g.players.length>2){s.board.fill(0);const cells=g.players.length===3?[19,20,27,28,35,36]:[26,27,28,29,34,35,36,37];cells.forEach((cell,i)=>s.board![cell]=i%g.players.length+1);}updateReversiScores(g);}
 if(g.kind==='connectfour')s.board=Array(42).fill(0);
 if(g.kind==='memory'){s.cards=Array.from({length:24},(_,i)=>Math.floor(i/2));for(let i=23;i>0;i--){const j=choose(s,i+1);[s.cards[i],s.cards[j]]=[s.cards[j],s.cards[i]];}s.matched=Array(24).fill(false);s.open=[];}
 if(g.kind==='race')s.positions=g.players.map(()=>0);
 if(g.kind==='bowling')s.lanes=g.players.map(()=>({rolls:[],frames:[[]],pins:Array(10).fill(true)}));
 if(g.kind==='reaction')newSignal(w,g);
}
export function reversiFlips(board:number[],cell:number,team:number){
 if(!Number.isInteger(cell)||cell<0||cell>=64||board[cell])return [];const flips:number[]=[],x=cell%8,y=Math.floor(cell/8);
 for(const [dx,dy]of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]){let xx=x+dx,yy=y+dy;const line:number[]=[];while(xx>=0&&xx<8&&yy>=0&&yy<8&&board[yy*8+xx]!==0&&board[yy*8+xx]!==team){line.push(yy*8+xx);xx+=dx;yy+=dy;}if(line.length&&xx>=0&&xx<8&&yy>=0&&yy<8&&board[yy*8+xx]===team)flips.push(...line);}return flips;
}
export const legalReversi=(board:number[],team:number)=>board.map((_,i)=>i).filter(i=>reversiFlips(board,i,team).length);
function updateReversiScores(g:HomeGame){g.scores=g.players.map((_,i)=>g.party!.board!.filter(v=>v===boardColor(g,i)).length);}
function teamWin(g:HomeGame,team:number,message:string){done(g,g.players.map((_,i)=>boardColor(g,i)===team?i:-1).filter(i=>i>=0),message);}
function endReversi(g:HomeGame){updateReversiScores(g);if(g.arranged){highest(g);return;}const black=g.scores[0],white=g.scores[1];if(black===white)done(g,g.players.map((_,i)=>i),'引き分け！');else teamWin(g,black>white?1:2,'ゲーム終了！');}
export function connectLine(board:number[],cell:number){const team=board[cell],x=cell%7,y=Math.floor(cell/7);if(!team)return [];for(const [dx,dy]of [[1,0],[0,1],[1,1],[1,-1]]){const line=[cell];for(const sign of [-1,1]){let xx=x+dx*sign,yy=y+dy*sign;while(xx>=0&&xx<7&&yy>=0&&yy<6&&board[yy*7+xx]===team){line.push(yy*7+xx);xx+=dx*sign;yy+=dy*sign;}}if(line.length>=4)return line;}return [];}
function newSignal(w:HomeGameWorld,g:HomeGame){const s=g.party!;s.signal={at:w.time+1.4+choose(s,1800)/1000,target:choose(s,4),acted:g.players.map(()=>false),times:g.players.map(()=>-1)};g.deadline=s.signal.at+(g.arranged?1.4:1.8);g.revision++;}
export const RACE_EFFECTS:Record<number,number>={4:3,9:-3,13:4,18:-4,23:3,29:-5,34:2};
export const RACE_EXTRA=[7,21,35];
export const PIN_POSITIONS=Array.from({length:10},(_,i)=>{const row=i===0?0:i<3?1:i<6?2:3,col=i-row*(row+1)/2;return {x:(col-row/2)*.2,y:row*.2};});
export function bowlingTotals(rolls:number[],frameCount=10){let cursor=0,total=0;const frames:Array<{score:number;total:number;complete:boolean}>=[];for(let f=0;f<frameCount;f++){const a=rolls[cursor];if(a===undefined)break;if(f===frameCount-1){const r=rolls.slice(cursor,cursor+3),needed=a===10||r[1]!==undefined&&a+r[1]===10?3:2;const score=r.reduce((a,b)=>a+b,0);total+=score;frames.push({score,total,complete:r.length>=needed});break;}const strike=a===10,b=rolls[cursor+1],spare=!strike&&b!==undefined&&a+b===10;let score=a+(strike?0:b||0),complete=b!==undefined;if(strike){score=10+(rolls[cursor+1]||0)+(rolls[cursor+2]||0);complete=rolls[cursor+2]!==undefined;}else if(spare){score=10+(rolls[cursor+2]||0);complete=rolls[cursor+2]!==undefined;}total+=score;frames.push({score,total,complete});cursor+=strike?1:2;}return {total,frames};}
function bowlResult(w:HomeGameWorld,g:HomeGame,knocked:number[]){const s=g.party!,lane=s.lanes![g.turn],frame=lane.frames.at(-1)!;for(const i of knocked)lane.pins[i]=false;const n=knocked.length;lane.rolls.push(n);frame.push(n);g.scores[g.turn]=bowlingTotals(lane.rolls,g.arranged?5:10).total;g.message=n===10?'ストライク！':!lane.pins.some(Boolean)?'スペア！':'投球完了！';const tenth=lane.frames.length===(g.arranged?5:10);let complete=false;
 if(!tenth)complete=n===10||frame.length===2;
 else{complete=frame.length===3||frame.length===2&&frame[0]+frame[1]<10;if(!complete&&(n===10||!lane.pins.some(Boolean)))lane.pins.fill(true);}
 if(complete){if(!tenth)lane.frames.push([]);lane.pins.fill(true);if(s.lanes!.every(l=>l.frames.length===(g.arranged?5:10)&&(l.frames.at(-1)!.length===3||l.frames.at(-1)!.length===2&&l.frames.at(-1)![0]+l.frames.at(-1)![1]<10))){highest(g);return;}advance(w,g);let attempts=0;while(attempts++<g.players.length){const l=s.lanes![g.turn],f=l.frames.at(-1)!;if(l.frames.length<(g.arranged?5:10)||f.length<2||f.length===2&&f[0]+f[1]>=10)break;g.turn=(g.turn+1)%g.players.length;}}
 else{g.round++;g.deadline=w.time+turnSeconds(g,45);g.revision++;}
}
export function partyCommand(w:HomeGameWorld,g:HomeGame,seat:number,c:PartyCommand){
 if(!g.party||!Number.isInteger(c.round)||c.round!==g.round)return false;const s=g.party;
 if(c.type==='game_react'){if(g.kind!=='reaction'||!Number.isInteger(c.target)||c.target<0||c.target>3)return false;const sig=s.signal!;if(sig.acted[seat]||w.time>g.deadline)return false;sig.acted[seat]=true;if(w.time<sig.at||sig.target!==c.target){g.scores[seat]=Math.max(0,g.scores[seat]-5);if(s.streaks)s.streaks[seat]=0;sig.times[seat]=-2;g.message='お手つき！';}else{const elapsed=w.time-sig.at;sig.times[seat]=Math.round(elapsed*1000);if(s.streaks)s.streaks[seat]++;g.scores[seat]+=Math.max(10,100-Math.round(elapsed*60))+(g.arranged?Math.min(30,(s.streaks![seat]-1)*5):0);g.message='ナイス反応！';}g.revision++;return true;}
 if(seat!==g.turn)return false;
 if(c.type==='game_board'){
  if(!Number.isInteger(c.cell))return false;
  if(g.kind==='reversi'){const team=boardColor(g,seat),flips=reversiFlips(s.board!,c.cell,team);if(!flips.length)return false;s.board![c.cell]=team;flips.forEach(i=>s.board![i]=team);s.last=[c.cell];updateReversiScores(g);g.message='石を置きました。';advance(w,g);let passes=0;while(g.phase==='playing'&&!legalReversi(s.board!,boardColor(g,g.turn)).length){if(++passes>=g.players.length){endReversi(g);break;}g.message='置ける場所がなく自動パス。';advance(w,g);}return true;}
  if(g.kind==='connectfour'){if(c.cell<0||c.cell>6)return false;let row=5;while(row>=0&&s.board![row*7+c.cell])row--;if(row<0)return false;const i=row*7+c.cell;s.board![i]=boardColor(g,seat);s.last=[i];g.scores[seat]++;const line=connectLine(s.board!,i);if(line.length){s.last=line;teamWin(g,boardColor(g,seat),'四目達成！');}else if(s.board!.every(Boolean))done(g,g.players.map((_,i)=>i),'引き分け！');else{g.message='駒を置きました。';advance(w,g);}return true;}
  if(g.kind==='memory'){if(c.cell<0||c.cell>=24||s.matched![c.cell]||s.open!.includes(c.cell)||s.revealUntil||s.open!.length>=2)return false;s.open!.push(c.cell);g.revision++;if(s.open!.length===2){const [a,b]=s.open!;if(s.cards![a]===s.cards![b]){s.matched![a]=s.matched![b]=true;g.scores[seat]+=2+(g.arranged?Math.min(3,++s.streaks![seat]-1):0);s.open=[];g.round++;g.deadline=w.time+turnSeconds(g,45);g.message='ペア発見！もう一度。';if(s.matched!.every(Boolean))highest(g);}else{if(s.streaks)s.streaks[seat]=0;s.revealUntil=w.time+1.3;g.message='覚えて、次の人へ。';}}return true;}
  return false;
 }
 if(c.type==='game_roll'){if(g.kind!=='race')return false;if(c.style!==undefined&&!['safe','bold'].includes(c.style))return false;const die=g.arranged?(c.style==='safe'?2+choose(s,3):1+choose(s,8)):1+choose(s,6);s.die=die;const landing=Math.min(40,s.positions![seat]+die),effect=RACE_EFFECTS[landing]||0;s.positions![seat]=Math.max(0,Math.min(40,landing+effect));g.scores=[...s.positions!];if(s.positions![seat]>=40){done(g,[seat],'ゴール！');return true;}if(RACE_EXTRA.includes(landing)){g.message='ラッキーマス！もう一度。';g.round++;g.deadline=w.time+turnSeconds(g,45);g.revision++;}else{g.message=effect>0?'加速マス！':effect<0?'後退マス！':'サイコロを振りました。';advance(w,g);}return true;}
 if(c.type==='game_bowl'){if(g.kind!=='bowling'||s.shot||![c.aim,c.power,c.spin].every(Number.isFinite)||Math.abs(c.aim)>1||Math.abs(c.spin)>1||c.power<.2||c.power>1)return false;const lane=s.lanes![seat],x=c.aim*.72+c.spin*.24,knocked:number[]=[],fallen=new Set<number>();if(Math.abs(x)<.94){for(const [i,pos]of PIN_POSITIONS.entries()){if(!lane.pins[i])continue;const dx=pos.x-x;if(Math.abs(dx)<.12+c.power*.1){fallen.add(i);}}for(let pass=0;pass<4;pass++)for(const [i,pos]of PIN_POSITIONS.entries()){if(!lane.pins[i]||fallen.has(i))continue;const collision=[...fallen].some(j=>{const q=PIN_POSITIONS[j];return pos.y>q.y&&pos.y-q.y<=.25&&Math.abs(pos.x-q.x-(x>0?-.04:.04))<.17+c.power*.055;});if(collision)fallen.add(i);}knocked.push(...fallen);}
 s.shot={seat,start:w.time,aim:c.aim,power:c.power,spin:c.spin,pins:knocked,result:knocked.length};g.deadline=w.time+50;g.revision++;return true;}
 return false;
}
export function tickParty(w:HomeGameWorld,g:HomeGame){const s=g.party;if(!s)return;
 if(g.kind==='memory'&&s.revealUntil&&w.time>=s.revealUntil){s.open=[];s.revealUntil=undefined;advance(w,g);}
 if(g.kind==='bowling'&&s.shot){if(w.time>=s.shot.start+1.7){const knocked=s.shot.pins;s.shot=undefined;bowlResult(w,g,knocked);}return;}
 if(g.kind==='reaction'){if(w.time>=g.deadline){if(g.round>=(g.arranged?16:12))highest(g);else{g.round++;newSignal(w,g);}}return;}
 if(w.time<g.deadline||g.phase!=='playing')return;
 g.message='時間切れ。次の手番です。';
 if(g.kind==='reversi'){const legal=legalReversi(s.board!,boardColor(g,g.turn));if(legal.length)partyCommand(w,g,g.turn,{type:'game_board',key:g.key,cell:legal[0],round:g.round});else advance(w,g);}
 else if(g.kind==='connectfour'){const column=s.board!.findIndex((v,i)=>i<7&&!v);if(column>=0)partyCommand(w,g,g.turn,{type:'game_board',key:g.key,cell:column,round:g.round});}
 else if(g.kind==='memory'){s.open=[];s.revealUntil=undefined;advance(w,g);}
 else if(g.kind==='race')partyCommand(w,g,g.turn,{type:'game_roll',key:g.key,round:g.round});
 else if(g.kind==='bowling')bowlResult(w,g,[]);
}
export const ARRANGED_RULES:Record<PartyKind,string>={
 reversi:'2〜4人の個人戦。各プレイヤーが自分の色で競います。リバーシは他の色を挟んで取り、四目並べは自分の色を4個つなげます。',
 connectfour:'2〜4人の個人戦。各プレイヤーが自分の色で競います。リバーシは他の色を挟んで取り、四目並べは自分の色を4個つなげます。',
 memory:'1〜4人の宝探し。ペアを連続で見つけると2〜5点に増加。外すと連続ボーナスがリセット。',
 race:'1〜4人の冒険レース。安全なサイコロは2〜4、大胆なサイコロは1〜8。加速と後退のマスを読み、40マス先のゴールを目指そう。',
 bowling:'1〜4人で5フレームの短期決戦。ストライクとスペアの加点は本格ルール。5フレーム目にボーナス投球あり。',
 reaction:'1〜4人で16ラウンド。合図から1.4秒の勝負。連続成功で最大30点の追加ボーナス。'
};
