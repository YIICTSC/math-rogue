import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {build} from 'esbuild';
await fs.mkdir('tmp/academy-broadcast',{recursive:true});
await build({stdin:{contents:"export * from './src/mini-games/academy-sports/broadcast'; export {createVolleyball,volleyballPoint} from './src/mini-games/academy-sports/volleyball'; export {defaultConfig} from './src/mini-games/academy-sports/core';",resolveDir:process.cwd(),sourcefile:'commentary-test.ts'},outfile:'tmp/academy-broadcast/test.mjs',bundle:true,format:'esm',platform:'node'});
const {broadcastFact,AcademyBroadcastQueue,AcademyBroadcastPlanner,createVolleyball,volleyballPoint,defaultConfig}=await import('../tmp/academy-broadcast/test.mjs?test='+Date.now());
const plan=JSON.parse(await fs.readFile('src/mini-games/academy-sports/broadcastPlan.json','utf8')),ids=new Set(plan.lines.map(l=>l.id));
assert.equal(ids.size,plan.lines.length);for(const clips of Object.values(plan.exchanges)){assert.equal(clips.length,2);assert(clips[0].startsWith('announcer/'));assert(clips[1].startsWith('analyst/'));for(const id of clips)assert(ids.has(id));}
const event=(text,kind='whistle',id=1)=>({id,at:id/60,text,kind,actor:0});
const cases=[['baseball','ストライク','baseball.strike'],['baseball','三振！','baseball.out'],['baseball','フォースアウト！','baseball.out'],['baseball','セーフ！','baseball.safe'],['baseball','スリーアウト・チェンジ','baseball.change'],['soccer','オフサイド','soccer.offside'],['soccer','コーナーキック','soccer.corner'],['soccer','ペナルティーキック','soccer.penalty'],['volleyball','アウト！','volleyball.out'],['volleyball','ダブルコンタクト','volleyball.double'],['volleyball','フォーヒット','volleyball.four'],['volleyball','リベロのアタック反則','volleyball.libero'],['volleyball','サーブミス','volleyball.serveFault']];
for(const [sport,text,call]of cases){const fact=broadcastFact({sport,outs:0},event(text));assert.equal(fact.call,call);assert(ids.has('referee/'+fact.call));if(fact.exchange)assert(plan.exchanges[fact.exchange]);}
for(const sport of ['baseball','soccer','volleyball']){assert.equal(broadcastFact({sport},event('必殺球を準備！')),null);assert.equal(broadcastFact({sport},event('通常サーブ')),null);const fact=broadcastFact({sport},event('TEAM 1 の勝利！','cheer'));assert(ids.has('referee/'+fact.call));}
assert.equal(broadcastFact({sport:'festival'},event('ストライク')),null);
const planner=new AcademyBroadcastPlanner(),match={sport:'baseball',outs:0};
assert.equal(new AcademyBroadcastPlanner().opening('baseball',0).clips[0],'broadcast/referee/baseball.start');
assert.equal(new AcademyBroadcastPlanner().opening('festival',0),null);
let sequences=planner.sequences(match,[event('ストライク'),event('ストライク')],0);assert.equal(sequences.filter(s=>s.priority===3).length,1,'same-tick duplicate calls collapsed');assert.equal(sequences.filter(s=>s.priority===1).length,1);
sequences=planner.sequences(match,[event('ボール')],1000);assert.equal(sequences.length,1,'routine banter has a cooldown, judgments do not');
const finalPoint=createVolleyball(defaultConfig('volleyball'));finalPoint.points=[14,0];volleyballPoint(finalPoint,0,'フォーヒット');assert.equal(finalPoint.phase,'finished');assert(finalPoint.events.some(e=>e.text==='フォーヒット'),'Winning fault reason survives match completion');assert(new AcademyBroadcastPlanner().sequences(finalPoint,finalPoint.events,0).some(s=>s.key==='volleyball.four'),'Actual winning-point fault triggers its judge call');
const played=[],resolvers=[],queue=new AcademyBroadcastQueue(id=>{played.push(id);return new Promise(resolve=>resolvers.push(resolve));},()=>{while(resolvers.length)resolvers.shift()(true);},()=>0,async()=>{});
queue.enqueue({key:'pair',clips:['announcer','analyst'],priority:1,expiresAt:5000});assert.deepEqual(played,['announcer']);
queue.enqueue({key:'call',clips:['referee'],priority:3,expiresAt:5000});assert.deepEqual(played,['announcer','referee']);
resolvers.splice(0).forEach(r=>r(true));await new Promise(r=>setTimeout(r,0));assert(!played.includes('analyst'),'interrupted commentary must not resume after a judgment');
queue.enqueue({key:'fresh',clips:['new-announcer','new-analyst'],priority:2,expiresAt:5000});resolvers.splice(0).forEach(r=>r(true));await new Promise(r=>setTimeout(r,0));assert(played.includes('new-analyst'));queue.cancel();
queue.enqueue({key:'expired',clips:['stale'],priority:1,expiresAt:-1});await new Promise(r=>setTimeout(r,0));assert(!played.includes('stale'));
const speech=await fs.readFile('src/mini-games/academy-sports/AcademyPresentation.tsx','utf8');assert(speech.includes('queue.current?.cancel()'));assert(speech.includes('visibilitychange'));assert(speech.includes('sports-voice-muted'));assert(speech.includes('serial:match.serial'),'late join initializes at the current serial');
console.log(`PASS ${plan.lines.length} lines, ${Object.keys(plan.exchanges).length} paired exchanges, real judgment mapping, duplicate suppression, commentary cooldown, referee interruption, pair order, expiry and lifecycle wiring.`);
