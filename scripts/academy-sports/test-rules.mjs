import assert from'node:assert/strict';import fs from'node:fs/promises';import{build}from'esbuild';
const result=await build({stdin:{contents:"export * from './src/mini-games/academy-sports/core';export * from './src/mini-games/academy-sports/engine';export * from './src/mini-games/academy-sports/baseball';export * from './src/mini-games/academy-sports/soccer';export * from './src/mini-games/academy-sports/volleyball';export * from './src/mini-games/academy-sports/festival';export * from './src/mini-games/academy-sports/records';export * from './src/three/protagonistCatalog';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const E=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')),N=E.neutral;
const cfg=(sport,extra={})=>({...E.defaultConfig(sport),...extra});
const tick=(s,n=60)=>{for(let i=0;i<n;i++)E.stepMatch(s,N(),1/60);};
for(const sport of['baseball','soccer','volleyball','festival']){
 for(let difficulty=0;difficulty<4;difficulty++)for(let seed=1;seed<=4;seed++){
  const s=E.createMatch(cfg(sport,{mode:'watch',difficulty,seed}));const expected=sport==='baseball'?18:sport==='soccer'?22:sport==='volleyball'?12:8;assert.equal(s.players.length,expected);
  assert.equal(new Set(s.players.map(p=>p.id)).size,expected);for(const p of s.players){assert(E.PROTAGONISTS.some(h=>h.id===p.hero),p.hero);await fs.access('public/models/sports-wardrobe/'+p.hero+'.glb');}
  let frames=0;while(s.phase!=='finished'&&frames++<180000){E.stepMatch(s,N(),1/60);if(frames%1000===0)E.assertFinite(s);}
  assert.equal(s.phase,'finished',`${sport} d${difficulty} seed${seed} must finish`);E.assertFinite(s);if(sport==='festival'){assert.equal(s.results.length,4);assert.equal(s.results.reduce((n,r)=>n+r.order.length,0),16);assert.equal(s.score.reduce((a,b)=>a+b,0),880);}
 }
 console.log('PASS',sport,'16 full CPU matches, four AI levels, roster identity, finite physics and final results');
}
// Baseball counts, fair physical contact, real fly trajectory and outs on throws.
{
 for(const team of [0,1])for(const mode of ['batting','home-run','pitching','fielding']){const p=E.createBaseball(cfg('baseball',{team,mode}));assert.equal(p.half,['batting','home-run'].includes(mode)?team:1-team,'Practice puts the player on the correct side');}
 const s=E.createBaseball(cfg('baseball'));s.phase='play';E.pitchVerdict(s,'strike');E.pitchVerdict(s,'strike');E.pitchVerdict(s,'strike');assert.equal(s.outs,1);assert.equal(s.strikes,0);
 for(let i=0;i<4;i++)E.pitchVerdict(s,'ball');assert.notEqual(s.bases[0],null);s.strikes=2;E.pitchVerdict(s,'foul');assert.equal(s.strikes,2,'Foul cannot make the third strike');
 const hit=E.createBaseball(cfg('baseball'));hit.phase='play';Object.assign(hit.ball,{x:0,y:1.2,z:18});assert.equal(E.hitBall(hit,.6,0,1.2),false,'Mistimed swings miss');assert.equal(E.hitBall(hit,0,2,1.2),false,'Reticle misses do not produce hits');
 hit.hitMode='fly';hit.batMode='power';hit.players.find(p=>p.id===hit.bat).skills.power=1;assert(E.hitBall(hit,0,0,1.2));assert(hit.ball.vy>10&&hit.ball.vz<0);for(let i=0;i<400&&hit.stats[0].homeRuns!==1;i++)E.stepBaseball(hit,N(),1/60);assert.equal(hit.stats[0].homeRuns,1,'Physical flight crossing the fence produces a home run');assert(hit.score[0]>=1);
 const out=E.createBaseball(cfg('baseball',{team:1}));out.phase='play';out.stage='live';out.ball.owner=100;out.bounced=true;out.outsAtHit=0;out.playRuns=0;out.runners=[{unit:out.bat,from:0,target:1,at:0,progress:0,forced:true,tag:false,done:false}];out.players.find(p=>p.id===102).p={...E.BASES[1]};E.throwToBase(out,1);for(let i=0;i<180&&out.outs===0;i++)E.stepBaseball(out,N(),1/60);assert.equal(out.outs,1,'A throw beats the runner to first');
 const early=E.createBaseball(cfg('baseball',{team:1}));early.phase='play';early.stage='throw';early.flightTime=1;early.throwBase=1;early.throwTarget=101;early.fielder=101;early.bounced=true;early.runners=[{unit:early.bat,from:0,target:1,at:0,progress:0,forced:true,tag:false,done:false}];for(const p of early.players.filter(p=>p.team===1))p.p=E.vec(100,0,100);early.players.find(p=>p.id===101).p=E.vec(7,0,7);Object.assign(early.ball,{owner:-1,x:7,y:1,z:7,vx:0,vy:0,vz:0});E.stepBaseball(early,N(),1/60);assert.equal(early.outs,0,'Catching a throw away from the base does not force the runner out');
 const fly=E.createBaseball(cfg('baseball',{mode:'watch'}));fly.phase='play';fly.stage='live';fly.flightTime=1;fly.bounced=false;fly.fielder=106;fly.runners=[{unit:2,from:3,target:3,at:3,progress:0,forced:false,tag:false,done:false},{unit:fly.bat,from:0,target:1,at:0,progress:0,forced:true,tag:false,done:false}];fly.players.find(p=>p.id===2).p={...E.BASES[3]};for(const p of fly.players.filter(p=>p.team===1))p.p=E.vec(100,0,100);fly.players.find(p=>p.id===106).p=E.vec(-30,0,-30);Object.assign(fly.ball,{owner:-1,x:-30,y:1,z:-30,vx:0,vy:0,vz:0});E.stepBaseball(fly,N(),1/60);assert.equal(fly.outs,1);assert.equal(fly.runners[0].target,4,'A deep caught fly permits advancement only after retouching third');assert.equal(fly.runners[0].retouch,undefined);
 const pitchSpeed=count=>{const p=E.createBaseball(cfg('baseball',{team:1}));p.phase='play';p.stats[1].pitches=count;E.baseballAction(p,'primary');E.baseballAction(p,'primary');tick(p,45);return p.ball.vz;};assert(pitchSpeed(100)<pitchSpeed(0),'Cumulative pitching workload reduces velocity despite between-pitch spirit recovery');
 console.log('PASS baseball strikeout/walk/foul, contact accuracy, airborne home run, running and force out');
}
// Soccer scoring uses a crossing, supports misses, keeper saves, halves, restarts and spirit.
{
 for(const formation of ['4-4-2','4-3-3','3-5-2']){const f=E.createSoccer(cfg('soccer',{formation}));assert.deepEqual(['DF','MF','FW'].map(role=>f.players.filter(p=>p.team===0&&p.role===role).length),formation.split('-').map(Number),'Formation updates role labels and positioning together');}
 const s=E.createSoccer(cfg('soccer'));s.phase='play';s.stage='open';s.ball.owner=-1;Object.assign(s.ball,{x:0,y:.3,z:-32.8,vx:0,vy:0,vz:-20,team:0,last:8});s.players.find(p=>p.id===100).p.x=9;E.stepSoccer(s,N(),1/60);assert.equal(s.score[0],1);
 const wide=E.createSoccer(cfg('soccer'));wide.phase='play';wide.stage='open';Object.assign(wide.ball,{owner:-1,x:8,y:.3,z:-32.8,vx:0,vy:0,vz:-20,team:0,last:8});E.stepSoccer(wide,N(),1/60);assert.equal(wide.score[0],0);assert.equal(wide.stage,'restart');
 const save=E.createSoccer(cfg('soccer'));save.phase='play';save.stage='open';const keeper=save.players.find(p=>p.id===100);keeper.p=E.vec(0,0,-31);Object.assign(save.ball,{owner:-1,x:0,y:1,z:-30.8,vx:0,vy:0,vz:-10,team:0,power:20,last:8});E.stepSoccer(save,N(),1/60);assert(save.stats[1].saves>0);assert.equal(save.score[0],0);
 const kick=E.createSoccer(cfg('soccer'));kick.phase='play';kick.stage='open';kick.ball.owner=kick.selected;const striker=kick.players.find(p=>p.id===kick.selected);striker.spirit=0;E.soccerAction(kick,'special');assert.equal(kick.cinema,0,'Not enough spirit cannot start a signature');striker.spirit=100;E.soccerAction(kick,'special');assert(kick.cinema>0);for(let i=0;i<60;i++)E.stepSoccer(kick,N(),1/60);assert.equal(kick.ball.special,true);assert(striker.spirit<100);
 console.log('PASS soccer goal crossing, wide shot, restart, goalkeeper save and signature spirit gate');
}
// Volleyball deuce, deciding set, touch faults and actual serve trajectory.
{
 const s=E.createVolleyball(cfg('volleyball',{points:15,sets:3}));s.points=[14,14];E.volleyballPoint(s,0,'test');assert.equal(s.score[0],0);E.volleyballPoint(s,0,'test');assert.equal(s.score[0],1);assert.equal(s.setNumber,2);assert.equal(s.rotations[0],0);
 const rotation=E.createVolleyball(cfg('volleyball'));E.volleyballPoint(rotation,1,'side out');assert.equal(rotation.rotations[1],1);assert.equal(rotation.server,1);assert.equal((rotation.serveSlot[1]+rotation.rotations[1])%6,3,'The rotating back-right player serves');
 const fault=E.createVolleyball(cfg('volleyball',{rules:'standard'}));fault.phase='play';fault.stage='rally';const p=fault.players[0];fault.contacts=3;fault.contactTeam=0;fault.lastContact=1;Object.assign(fault.ball,{x:p.p.x,y:1,z:p.p.z,owner:-1});E.touch(fault,p,'receive',N());assert.equal(fault.points[1],1,'Fourth touch awards the other side');
 const twice=E.createVolleyball(cfg('volleyball',{rules:'standard'}));twice.phase='play';twice.stage='rally';const q=twice.players[0];twice.lastContact=q.id;twice.ball.y=1;twice.ball.x=q.p.x;twice.ball.z=q.p.z;E.touch(twice,q,'receive',N());assert.equal(twice.points[1],1);
 const serve=E.createVolleyball(cfg('volleyball'));serve.phase='play';E.volleyballAction(serve,'primary',N());tick(serve,24);E.volleyballAction(serve,'primary',N());assert.equal(serve.stage,'rally');assert(serve.ball.vz<0&&Number.isFinite(serve.ball.vy));assert.equal(serve.ball.owner,-1);
 console.log('PASS volleyball deuce, set progression, rotation, four-hit/double-contact faults and serve physics');
}
// Festival score order, no duplicate awards, checkpoint recovery and real item projectiles.
{
 const s=E.createFestival(cfg('festival'));s.phase='play';s.finishes=[4,3,2,1];E.endContest(s);assert.deepEqual(s.score,[10,40,70,100]);E.endContest(s);assert.deepEqual(s.score,[10,40,70,100]);tick(s,250);assert.equal(s.contest,1);
 E.startContest(s,2);s.phase='play';s.held[s.selected]='ball';E.festivalAction(s,'pass',N());assert.equal(s.projectiles.length,1);assert.equal(s.targetHP[s.config.team],100,'Throwing does not damage the target before physical contact');tick(s,120);assert(s.targetHP[s.config.team]<100);
 console.log('PASS festival rankings, one award per event, event transition and projectile target collision');
}
// User input and persisted settings cannot inject non-finite positions or invalid rules.
{
 const config=E.normalizeConfig({team:99,innings:-10,points:0,formation:'broken',difficulty:7},'baseball');assert.equal(config.team,0);assert.equal(config.innings,3);assert.equal(config.points,15);
 const s=E.createMatch(cfg('soccer',{mode:'watch'}));E.stepMatch(s,{...N(),x:NaN,z:Infinity},.016);E.stepMatch(s,N(),NaN);E.assertFinite(s);
 let text='';const storage={getItem:()=>text,setItem:(key,value)=>{text=value;}};assert.equal(E.recordMatch(s,storage),false);E.finish(s);assert(E.recordMatch(s,storage));assert(E.recordMatch(s,storage));assert.equal(E.readRecords(storage).length,1);assert.equal(E.recordMatch({...s,id:'other'},{getItem:()=>text,setItem:()=>{throw Error('quota');}}),false);assert.equal(E.readRecords({getItem:()=>'{bad'}).length,0);
 console.log('PASS invalid settings/input isolation, completed-result-only storage, deduplication and quota recovery');
}
