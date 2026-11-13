import assert from 'node:assert/strict';
import {build} from 'esbuild';
const built=await build({stdin:{contents:"export * from './src/mini-games/academy-sports/core';export * from './src/mini-games/academy-sports/baseball';export * from './src/mini-games/academy-sports/soccer';export * from './src/mini-games/academy-sports/volleyball';export * from './src/mini-games/academy-sports/copy';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const E=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const cfg=(sport,extra={})=>({...E.defaultConfig(sport),...extra});
const summaries=[];
for(let difficulty=0;difficulty<4;difficulty++){
 const count={difficulty,pitches:160,contacts:0,homeRuns:0,misses:0};
 for(let i=0;i<count.pitches;i++){
  const s=E.createBaseball(cfg('baseball',{team:1,difficulty,seed:31+i*7919}));s.phase='play';s.pitch=i%8;s.pitchAim={x:(i%5-2)*.23,y:.8+(i%4)*.24};
  E.baseballAction(s,'primary');E.baseballAction(s,'primary');let contacted=false;
  for(let frame=0;frame<1200;frame++){
   E.stepBaseball(s,E.neutral(),1/60);
   if(s.stats[0].contacts)contacted=true;
   if(s.phase==='replay'||s.stage==='set')break;
  }
  count.contacts+=Number(contacted);count.homeRuns+=s.stats[0].homeRuns||0;count.misses+=Number(!contacted);E.assertFinite(s);
 }
 summaries.push(count);
}
console.log('CPU batting sample:',JSON.stringify(summaries));
assert(summaries[1].homeRuns<=summaries[1].pitches*.08,'Normal CPU home runs stay occasional across varied pitches');
assert(summaries[1].contacts>=12&&summaries[1].misses>=40,'Normal CPU can hit and miss');
assert(summaries[3].contacts>summaries[0].contacts,'Higher difficulty improves actual CPU contact');
const cpuContact=E.createBaseball(cfg('baseball',{team:1})),humanContact=E.createBaseball(cfg('baseball'));
for(const s of [cpuContact,humanContact])Object.assign(s.ball,{x:0,y:1.2,z:18});
assert.equal(E.hitBall(cpuContact,.19,0,1.2),false,'Player timing assist is never applied to CPU batters');
assert.equal(E.hitBall(humanContact,.19,0,1.2),true,'Human timing assist remains available');
// Fielders must chase, catch and choose a throw with no defensive input.
for(const online of [false,true]){
 const s=E.createBaseball(cfg('baseball',{team:1}));s.phase='play';s.online=online;if(online)s.controls={[s.pitcher]:{...E.neutral(),x:1,z:1}};
 Object.assign(s.ball,{x:0,y:1.2,z:18});s.hitMode='ground';assert(E.hitBall(s,0,0,1.2));
 Object.assign(s.ball,{x:-10,y:.3,z:4,vx:-3,vy:0,vz:-1});s.bounced=true;s.flightTime=.3;s.fielder=104;
 const f=s.players.find(p=>p.id===s.fielder),start={...f.p};if(online)s.controls[f.id]={...E.neutral(),x:1,z:1};
 assert.equal(E.actionButtons(s)[0].label[0],'守備オート');assert(E.actionButtons(s)[0].disabled);
 const selected=s.selected;E.baseballAction(s,'switch');assert.equal(s.selected,selected,'Manual field switches cannot interrupt automatic defense');
 let moved=false,caught=false,threw=false;
 for(let frame=0;frame<1100&&s.phase==='play';frame++){
  E.stepBaseball(s,E.neutral(),1/60);moved||=E.len(f.p,start)>.5;caught||=s.ball.owner>=0;threw||=s.stage==='throw';
 }
 assert(moved&&caught&&threw,JSON.stringify({online,moved,caught,threw,stage:s.stage}));assert.equal(s.phase,'replay');
}
const drill=E.createBaseball(cfg('baseball',{mode:'fielding',team:1}));drill.phase='play';drill.stage='live';drill.fielder=102;drill.selected=102;Object.assign(drill.ball,{owner:-1,x:-35,y:8,z:-20,vy:1});
const defender=drill.players.find(p=>p.id===102),startX=defender.p.x;E.stepBaseball(drill,{...E.neutral(),x:1},.1);assert(defender.p.x>startX,'Fielding practice keeps manual movement');assert(!E.autoFielding(drill));
const pitch=E.createBaseball(cfg('baseball',{team:1}));pitch.phase='play';E.stepBaseball(pitch,{...E.neutral(),x:1},.1);assert(pitch.pitchAim.x>0);E.baseballAction(pitch,'primary');assert.equal(pitch.stage,'meter','Pitcher controls are preserved');
console.log('PASS offline/online automatic chase, catch, throw and finish; manual pitching and fielding practice');
// CPU aim is its own decision, never copied from the player's stick.
function cpuShot(seed,difficulty,input){
 const s=E.createSoccer(cfg('soccer',{mode:'watch',seed,difficulty}));s.phase='play';s.stage='open';const p=s.players.find(p=>p.id===s.selected);p.p=E.vec(0,0,-17);s.ball.owner=p.id;Object.assign(s.ball,{x:0,y:.3,z:-17});s.lastInput=input;E.soccerAction(s,'primary');p.charge=.65;E.soccerAction(s,'release');return s;
}
const shotStats=[];
for(let difficulty=0;difficulty<4;difficulty++){
 let wide=0,power=0;
 for(let seed=1;seed<=100;seed++){
  const a=cpuShot(seed,difficulty,{...E.neutral(),x:1,aimX:1}),b=cpuShot(seed,difficulty,{...E.neutral(),x:-1,aimX:-1});assert.equal(a.ball.vx,b.ball.vx);assert.equal(a.ball.vz,b.ball.vz);
  const crossing=a.ball.x+a.ball.vx/a.ball.vz*(-34-a.ball.z);wide+=Number(Math.abs(crossing)>4.2);power+=a.ball.power;
 }
 shotStats.push({difficulty,wide,power:power/100});
}
assert(shotStats[0].wide>shotStats[3].wide,'Easy CPU makes more wide shots');assert(shotStats[0].power<shotStats[1].power&&shotStats[1].power<shotStats[3].power);console.log('PASS independent CPU aim and difficulty-scaled soccer shot errors/power:',JSON.stringify(shotStats));
const speeds=[];
for(let difficulty=0;difficulty<4;difficulty++){
 const s=E.createVolleyball(cfg('volleyball',{mode:'watch',difficulty}));s.phase='play';s.stage='rally';const p=s.players.find(p=>p.id===s.selected);p.p=E.vec(0,0,1);s.contactTeam=0;s.contacts=2;s.lastContact=0;Object.assign(s.ball,{x:0,y:2.6,z:1});assert(E.touch(s,p,'spike',E.neutral()));speeds.push(s.ball.power);
}
assert(speeds[0]<speeds[1]&&speeds[1]<speeds[2]&&speeds[2]<speeds[3]);console.log('PASS volleyball CPU spikes leave more reaction time at easier levels:',speeds.map(n=>n.toFixed(2)).join(', '));
