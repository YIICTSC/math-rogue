import assert from 'node:assert/strict';
import {build} from 'esbuild';
const built=await build({stdin:{contents:"export * from './src/mini-games/academy-sports/core';export * from './src/mini-games/academy-sports/engine';export * from './src/mini-games/academy-sports/modes';export * from './src/mini-games/academy-sports/records';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const E=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const step=(s,n=1,input=E.neutral())=>{for(let i=0;i<n;i++)E.stepMatch(s,input,1/60);};
const act=(s,a,input=E.neutral())=>E.matchAction(s,a,input);
function attempt(s){
 while(s.practice.result&&s.phase!=='finished')step(s);while(s.phase==='ready')step(s);const id=s.practice.id,t=s.config.team,sign=t===0?1:-1;
 if(id==='soccer-shot'){act(s,'primary');step(s,35,{...E.neutral(),primary:true});act(s,'release');}
 if(id==='soccer-special')act(s,'special');
 if(id==='soccer-pass'||id==='soccer-lob')act(s,id==='soccer-pass'?'pass':'lob');
 if(id==='soccer-tackle'||id==='soccer-dribble')act(s,'defend');
 if(id==='soccer-switch')act(s,'switch');
 if(id==='volley-serve'||id==='volley-special'){if(id==='volley-special')act(s,'special');act(s,'primary');step(s,28);act(s,'primary');}
 if(id==='volley-receive'){step(s,25);act(s,'primary');}
 if(id==='volley-set'){step(s,17);act(s,'primary');}
 if(id==='volley-spike'){act(s,'jump');step(s,7);act(s,'primary');}
 if(id==='volley-block')act(s,'defend');
 if(id==='volley-dive'){act(s,'defend',{...E.neutral(),x:1});act(s,'primary');}
 for(let frame=0;frame<720&&!s.practice.result;frame++){
  let input=E.neutral();
  if(id==='soccer-move'||id==='volley-move'){const p=s.players.find(p=>p.id===s.selected);const target=s.practice.target,d=Math.hypot(target.x-p.p.x,target.z-p.p.z)||1;input={...input,x:(target.x-p.p.x)/Math.max(1,d),z:(target.z-p.p.z)/Math.max(1,d),dash:true};if(id==='volley-move'&&d<1.2)act(s,'jump');}
  step(s,1,input);
 }
}
const failures=[];
for(const sport of ['soccer','volleyball'])for(const mode of E.PRACTICE_MODES[sport])for(const team of[0,1]){
 const c={...E.defaultConfig(sport),mode:'practice',drill:mode.drill,team},s=E.createMatch(c);
 assert.equal(s.players.find(p=>p.id===s.selected).hero,c.hero,mode.id+' uses the chosen captain');attempt(s);const ok=s.practice.result==='success';console.log(ok?'PASS':'FAIL',mode.id,'team',team,JSON.stringify({result:s.practice.result,time:s.practice.time,stats:s.stats[team],stage:s.stage,ball:s.ball,selected:s.selected}));if(!ok)failures.push(mode.id+' team '+team);E.assertFinite(s);
}
assert.deepEqual(failures,[],'Every drill must be completable with the real action/physics');
for(const sport of ['soccer','volleyball'])for(const mode of E.PRACTICE_MODES[sport]){
 const s=E.createMatch({...E.defaultConfig(sport),mode:'practice',drill:mode.drill});step(s,60*75);assert.equal(s.phase,'finished',mode.id+' ends after five attempts');assert.equal(s.practice.successes,0,mode.id+' cannot award idle CPU activity');assert.equal(s.practice.attempt,5);E.assertFinite(s);const cleared=E.createMatch({...E.defaultConfig(sport),mode:'practice',drill:mode.drill});for(let i=0;i<5;i++){attempt(cleared);assert.equal(cleared.practice.result,'success',mode.id+' repeated attempt '+i);assert.equal(cleared.practice.successes,i+1);}step(cleared,100);assert.equal(cleared.phase,'finished');assert.equal(cleared.practice.successes,5);let saved='';const storage={getItem:()=>saved,setItem:(_key,value)=>{saved=value;}};assert(E.recordMatch(cleared,storage));assert.deepEqual(E.readRecords(storage)[0].practice,{id:mode.drill,successes:5,attempts:5});assert(E.recordMatch(cleared,storage));assert.equal(E.readRecords(storage).length,1,'A result must be saved only once');
}
for(const sport of ['soccer','volleyball'])for(const mode of E.PRACTICE_MODES[sport])for(const team of[0,1]){const s=E.createMatch({...E.defaultConfig(sport),mode:'practice',drill:mode.drill,team,rules:'standard',assist:false,difficulty:3,hero:'magic-akari'});assert.equal(s.players.find(p=>p.id===s.selected).hero,'magic-akari');attempt(s);assert.equal(s.practice.result,'success',mode.id+' standard rules without assists team '+team);}
for(const sport of ['baseball','soccer','volleyball','festival']){const s=E.createMatch(E.defaultConfig(sport));assert.equal(s.practice,undefined,'Normal matches must not become drills');}
console.log('PASS all 16 action drills on both teams; bounded five-attempt sessions, idle misses and normal-mode isolation');
