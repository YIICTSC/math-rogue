import plan from './broadcastPlan.json';
import type {Match} from './engine';
import type {Event, SportId} from './core';
export interface BroadcastFact {call?:string;exchange?:string;importance:number}
/** Whitelisted simulation judgments only: a whistle can also mean a menu action. */
export function broadcastFact(match:Match,event:Event):BroadcastFact|null {
 const t=event.text,sport=match.sport;
 if(sport==='festival')return null;
 if(t==='引き分け'||/^TEAM \d+ の勝利！$/.test(t))return {call:`${sport}.finish`,exchange:'common.finish',importance:5};
 if(sport==='baseball'){
  if(t==='ストライク')return {call:'baseball.strike',exchange:'baseball.strike',importance:1};
  if(t==='ボール')return {call:'baseball.ball',exchange:'baseball.ball',importance:1};
  if(t==='ファウル')return {call:'baseball.foul',exchange:'baseball.foul',importance:1};
  if(t==='フォアボール')return {call:'baseball.walk',exchange:'baseball.walk',importance:3};
  if(t==='三振！'||/^(フォースアウト！|タッチアウト！|タッチアップ前の帰塁アウト！|フライ捕球！)/.test(t)||t==='盗塁阻止！')return {call:'baseball.out',exchange:'baseball.out',importance:3};
  if(t==='スリーアウト・チェンジ')return {call:'baseball.change',importance:4};
  if(t==='ダブルプレー！')return {call:match.outs>=3?'baseball.change':undefined,exchange:'baseball.out',importance:4};
  if(t==='セーフ！')return {call:'baseball.safe',importance:2};
  if(t==='ホームラン！')return {exchange:'baseball.homerun',importance:4};
  if(t==='盗塁スタート！')return {exchange:'baseball.steal',importance:2};
  if(['真芯でとらえた！','バント！','打球が伸びる！'].includes(t))return {exchange:'baseball.hit',importance:2};
 }
 if(sport==='soccer'){
  const restarts:Record<string,string>={'オフサイド':'offside','フリーキック':'freeKick','ペナルティーキック':'penalty','コーナーキック':'corner','スローイン':'throwIn','ゴールキック':'goalKick','ハーフタイム':'half'};
  if(restarts[t])return {call:'soccer.'+restarts[t],exchange:t==='オフサイド'?'soccer.offside':'soccer.restart',importance:t==='オフサイド'?3:2};
  if(t==='ゴール！')return {exchange:'soccer.goal',importance:4};
  if(t==='ゴールキーパー・セーブ！'||t==='パンチング！'||t==='星盾セーブ！')return {exchange:'soccer.save',importance:3};
  if(t==='ポストに当たった！')return {exchange:'soccer.post',importance:3};
  if(t==='ボール奪取！'||t==='インターセプト！')return {exchange:'soccer.steal',importance:2};
  if(t==='パスがつながった！')return {exchange:'soccer.pass',importance:1};
  if(['シュート！','パワーシュート！','ヘディング！'].includes(t))return {exchange:'soccer.shot',importance:2};
 }
 if(sport==='volleyball'){
  const faults:Record<string,[string,string]>={'アウト！':['out','out'],'サーブミス':['serveFault','serveFault'],'ダブルコンタクト':['double','double'],'フォーヒット':['four','four'],'リベロのアタック反則':['libero','point']};
  if(faults[t]){const [call,exchange]=faults[t];return {call:'volleyball.'+call,exchange:'volleyball.'+exchange,importance:3};}
  if(t==='ボールがコートに落ちた！')return {call:'volleyball.in',exchange:'volleyball.point',importance:3};
  if(t==='ブロック成功！')return {exchange:'volleyball.block',importance:2};
  if(t==='ナイスレシーブ！'||t==='レシーブ！')return {exchange:'volleyball.receive',importance:1};
  if(event.kind==='hit'&&t.endsWith('スパイク！'))return {exchange:'volleyball.spike',importance:2};
 }
 if(event.kind==='special'&&event.move)return {exchange:'common.special',importance:3};
 return null;
}
export type BroadcastPriority=0|1|2|3;
export interface BroadcastSequence {key:string;clips:string[];priority:BroadcastPriority;expiresAt:number}
/** One shared dry speech channel for athlete shouts, referees and the two presenters. */
export class AcademyBroadcastQueue {
 private pending:BroadcastSequence[]=[];private busy=false;private generation=0;private activePriority=0;
 constructor(private play:(id:string)=>Promise<unknown>,private stop:()=>void,private now:()=>number=()=>performance.now(),private gap:()=>Promise<void>=()=>new Promise(resolve=>setTimeout(resolve,180))){}
 enqueue(sequence:BroadcastSequence){
  if(sequence.priority===0&&(this.busy||this.pending.length))return;
  if(sequence.priority>=2&&this.busy&&this.activePriority<sequence.priority){this.generation++;this.stop();this.busy=false;this.pending=this.pending.filter(s=>s.priority>=2);}
  if(sequence.priority===1)this.pending=this.pending.filter(s=>s.priority!==1);
  this.pending.push(sequence);this.pending.sort((a,b)=>b.priority-a.priority);this.pending=this.pending.slice(0,4);void this.drain();
 }
 cancel(){this.generation++;this.pending=[];this.busy=false;this.stop();}
 private async drain(){
  if(this.busy)return;this.busy=true;const generation=this.generation;
  while(this.pending.length&&generation===this.generation){const sequence=this.pending.shift()!;if(sequence.expiresAt<this.now())continue;this.activePriority=sequence.priority;
   for(let i=0;i<sequence.clips.length;i++){if(generation!==this.generation)break;try{await this.play(sequence.clips[i]);}catch{/* Audio cannot interrupt gameplay. */}if(i+1<sequence.clips.length&&generation===this.generation)await this.gap();}
  }
  if(generation===this.generation)this.busy=false;
 }
}
export class AcademyBroadcastPlanner {
 private lastExchange=-Infinity;private lastKey='';private calls=new Map<string,number>();
 reset(){this.lastExchange=-Infinity;this.lastKey='';this.calls.clear();}
 opening(sport:SportId,now:number):BroadcastSequence|null {if(sport==='festival')return null;this.lastExchange=now;return {key:'opening',clips:[...(sport==='baseball'?['broadcast/referee/baseball.start']:[]),...plan.exchanges['common.start'].map(id=>'broadcast/'+id)],priority:1,expiresAt:now+5000};}
 sequences(match:Match,events:Event[],now:number):BroadcastSequence[]{
  const facts=events.map(event=>broadcastFact(match,event)).filter((v):v is BroadcastFact=>!!v),result:BroadcastSequence[]=[];
  for(const fact of facts)if(fact.call&&now-(this.calls.get(fact.call)??-Infinity)>500){this.calls.set(fact.call,now);result.push({key:fact.call,clips:['broadcast/referee/'+fact.call],priority:3,expiresAt:now+4000});}
  const exchange=facts.filter(f=>f.exchange).sort((a,b)=>b.importance-a.importance)[0];
  if(exchange?.exchange&&(exchange.importance>=4||now-this.lastExchange>=11000)&&!(exchange.exchange===this.lastKey&&now-this.lastExchange<(exchange.importance>=4?1500:15000))){
   this.lastExchange=now;this.lastKey=exchange.exchange;const clips=(plan.exchanges as Record<string,string[]>)[exchange.exchange];
   if(clips)result.push({key:exchange.exchange,clips:clips.map(id=>'broadcast/'+id),priority:exchange.importance>=4?2:1,expiresAt:now+4500});
  }
  return result;
 }
}
