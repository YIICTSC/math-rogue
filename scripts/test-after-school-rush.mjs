import assert from'node:assert/strict';import{build}from'esbuild';
const bundle=await build({stdin:{contents:"export * from './src/mini-games/after-school-rush/engine';export * from './src/mini-games/after-school-rush/catalog';export * from './src/mini-games/after-school-rush/discovery';export * from './src/mini-games/after-school-rush/action/physics';export * from './scripts/fixtures/rush-action-driver';",resolveDir:process.cwd()},write:false,bundle:true,platform:'node',format:'esm'});
const E=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
assert.equal(E.CATALOG.length,240);assert.equal(new Set(E.CATALOG.map(e=>e.key)).size,240);assert.equal(E.RUSH_ENTRIES.length,230);assert(E.CATALOG.every(e=>e.game.action&&e.game.mechanic.control));assert.equal(new Set(E.CATALOG.map(e=>e.game.action.family)).size,28);
function start(entry,seed=1,level=0){let s=E.start({kind:'practice',entry},0,seed);s=E.step(s,E.readyDuration(s));s.round.state=entry.game.mechanic.initialFor(seed,level);s.round.duration=entry.game.seconds*1000;s.round.speed=entry.game.boss?1:1+level*.1;return s;}
const fails=[];
for(const entry of E.CATALOG)for(const seed of[1,22,87])for(const level of[0,2,4]){
 let s=start(entry,seed,level),loops=0;
 while(s.tag==='play'&&loops++<1200){const d=E.actionDriver(s);s=E.steer(s,s.now,d.x,d.y);if(d.a)s=E.control(s,s.now,'a');if(d.b)s=E.control(s,s.now,'b');s=E.step(s,s.now+16/s.round.speed);}
 if(s.outcome!=='clear')fails.push({key:entry.key,family:entry.game.action.family,variant:entry.game.action.variant,seed,level,outcome:s.outcome,t:s.round.state[E.S.T],hp:s.round.state[E.S.HP],score:s.round.state[E.S.SCORE],x:s.round.state[E.S.X],y:s.round.state[E.S.Y],ball:[s.round.state[E.S.BALL_X],s.round.state[E.S.BALL_Y]]});
 else{const score=s.run.score;assert.equal(E.control(s,s.now+1,'a').run.score,score);}
}
if(fails.length){console.log('AUTOPLAY FAILURES',JSON.stringify(fails.slice(0,45),null,2));console.log('FAIL COUNT',fails.length);process.exitCode=1;}else console.log('PASS all 240 action games × 3 seeds × 3 difficulties, using stick + A/B, with exactly-once scoring');
for(const entry of E.CATALOG){let s=start(entry);while(s.tag==='play')s=E.step(s,s.now+100);assert.notEqual(s.outcome,'clear',entry.key+' must require player input');}
const run=E.CATALOG.find(e=>e.game.action.family==='run');let p=start(run);p=E.steer(p,p.now,1,0);p=E.step(p,p.now+200);assert(p.round.state[E.S.X]>120);p=E.steer(p,p.now,0,0);const stopped=p.round.state[E.S.X];p=E.step(p,p.now+300);assert.equal(p.round.state[E.S.X],stopped,'Releasing stops horizontal movement');p=E.steer(p,p.now,1,0);p=E.pause(p,p.now);assert.equal(p.round.state[E.S.AX],0,'Pause clears held input');const time=p.since;assert.strictEqual(E.step(p,p.now+10000),p);p=E.pause(p,p.now+10000);assert.equal(p.since,time+10000);
for(let seed=0;seed<40;seed++){const r=E.start({kind:'rush'},0,seed);assert.equal(r.round.entry.game.action.family,'run');}
for(let chapter=0;chapter<10;chapter++){const r=E.start({kind:'story',chapter},0,12);assert.equal(r.run.deck.length,7);assert(r.run.deck.at(-1).game.boss);}
let r=E.start({kind:'rush'},0,33);r={...r,tag:'feedback',outcome:'clear',run:{...r.run,number:7,misses:2,score:500,wins:6}};r=E.step(r,r.now+E.feedbackDuration(r));assert(r.round.entry.game.boss);r=E.step(r,r.since+E.readyDuration(r));r={...r,round:{...r.round,state:[...r.round.state]}};r.round.state[E.S.RESULT]=1;r=E.step(r,r.now+1);assert.equal(r.run.misses,1);assert(r.recovered);const score=r.run.score;r=E.step(r,r.now+E.feedbackDuration(r));assert.equal(r.tag,'study');assert.strictEqual(E.step(r,999999),r);r=E.resumeAfterStudy(r,1000000);assert.equal(r.run.number,9);assert.equal(r.run.score,score);assert.equal(r.run.misses,1);assert(r.round.speed>1);console.log('PASS idle failures, release, pause, beginner opening, all chapter bosses, recovery and learning continuity');

// End a game through its real deadline, then keep advancing the same clock.
// This catches results/feedback loops which only appear after a missed input.
for (const entry of E.CATALOG) {
  let s=start(entry), time=s.now;
  s=E.step(s,time+s.round.duration/s.round.speed+1);
  assert.equal(s.tag,'feedback',entry.key+' resolves a missed deadline');
  const resolvedScore=s.run.score;
  s=E.step(s,s.now+E.feedbackDuration(s)+1);
  assert.equal(s.tag,'results',entry.key+' exits failure feedback');
  assert.equal(s.run.score,resolvedScore);
}
// A complete story must traverse all eight games, including its boss, without
// a state injection to skip the play/feedback transition.
for (let chapter=0;chapter<10;chapter++) {
  let s=E.start({kind:'story',chapter},100,23), cleared=0, guard=0;
  while(s.tag!=='results'&&guard++<12000) {
    if(s.tag==='ready') {s=E.step(s,s.since+E.readyDuration(s)+1);continue;}
    if(s.tag==='feedback') {assert.equal(s.outcome,'clear','story chapter '+chapter+' round '+s.run.number);cleared++;s=E.step(s,s.since+E.feedbackDuration(s)+1);continue;}
    assert.equal(s.tag,'play');
    const d=E.actionDriver(s);s=E.steer(s,s.now,d.x,d.y);if(d.a)s=E.control(s,s.now,'a');if(d.b)s=E.control(s,s.now,'b');s=E.step(s,s.now+16/s.round.speed);
  }
  assert.equal(s.tag,'results','chapter '+chapter+' finishes');assert.equal(cleared,8);assert(s.run.completed,'chapter boss completed');
}
console.log('PASS every missed deadline exits feedback and 10 complete eight-game stories reach results');

const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))};
const discoveredEntry=E.CATALOG[0];
assert.deepEqual(E.readDiscovery(),[]);
for(const mode of [{kind:'rush'},{kind:'practice',entry:discoveredEntry},{kind:'story',chapter:1}])assert.deepEqual(E.recordEncounter(mode,discoveredEntry,[]),[],'Only the matching story mode records an encounter');
const first=E.recordEncounter({kind:'story',chapter:0},discoveredEntry,Object.freeze([]));assert.deepEqual(first,[discoveredEntry.key]);assert.deepEqual(E.readDiscovery(),first);
assert.deepEqual(E.recordEncounter({kind:'story',chapter:0},discoveredEntry,first),first,'A replay does not duplicate the encounter');
storage.set(E.DISCOVERY_KEY,JSON.stringify([discoveredEntry.key,discoveredEntry.key,'missing/game',false,1]));assert.deepEqual(E.readDiscovery(),first);
storage.set(E.DISCOVERY_KEY,'{bad json');assert.deepEqual(E.readDiscovery(),[]);
globalThis.localStorage={getItem:()=>{throw Error('unavailable')},setItem:()=>{throw Error('unavailable')}};assert.deepEqual(E.readDiscovery(),[]);assert.deepEqual(E.recordEncounter({kind:'story',chapter:0},discoveredEntry,[]),first,'A blocked storage backend preserves the session encounter');
console.log('PASS story-only discovery, replay/corruption filtering and blocked-storage fallback');

let buffered=E.start({kind:'practice',entry:run},0,7),go=E.readyDuration(buffered);
buffered=E.control(buffered,go-150,'a');buffered=E.step(buffered,go);buffered=E.step(buffered,go+24);assert(buffered.round.state[E.S.Y]<E.FLOOR,'A near the end of READY jumps at GO');
let stale=E.start({kind:'practice',entry:run},0,7);stale=E.control(stale,100,'a');stale=E.step(stale,go);stale=E.step(stale,go+24);assert.equal(stale.round.state[E.S.Y],E.FLOOR,'An old READY button is not a delayed jump');
let thumb=E.start({kind:'practice',entry:run},0,7);thumb=E.steer(thumb,go-150,1,0);assert.equal(thumb.round.state[E.S.X],120,'READY does not move the scene');thumb=E.step(thumb,go);thumb=E.step(thumb,go+24);assert(thumb.round.state[E.S.X]>120,'A held stick steers immediately at GO');
let pending=E.start({kind:'practice',entry:run},0,7);pending=E.control(pending,go-150,'a');pending=E.pause(pending,go-100);assert.equal(pending.round.queuedButtons,undefined,'Pause discards a queued action');
console.log('PASS fresh READY action buffer, stale-edge expiry, held-stick handoff and pause reset');

let spike=start(E.CATALOG.find(e=>e.game.action.family==='volley'));let spikeGuard=0;
while(spike.tag==='play'&&spike.round.state[E.S.SCORE]<spike.round.entry.game.action.goal&&spikeGuard++<800){const d=E.actionDriver(spike);spike=E.steer(spike,spike.now,d.x,d.y);if(d.a)spike=E.control(spike,spike.now,'a');if(d.b)spike=E.control(spike,spike.now,'b');spike=E.step(spike,spike.now+16);}
assert.equal(spike.tag,'play','A final spike remains visible before the verdict');const flightTime=spike.now;spike=E.step(spike,flightTime+200);assert.equal(spike.tag,'play');spike=E.step(spike,flightTime+400);assert.equal(spike.outcome,'clear');
console.log('PASS final volleyball spike travels visibly before clear feedback');
