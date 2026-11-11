import assert from 'node:assert/strict';import {build} from 'esbuild';
const b=await build({stdin:{contents:"export * from './src/mini-games/academy-sports/engine';export * from './src/mini-games/academy-sports/core';export * from './src/mini-games/academy-sports/soccer';export * from './src/mini-games/academy-sports/sportsMotion';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});const E=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
const game=()=>{const s=E.createMatch({...E.defaultConfig('soccer'),hero:'magic-akari'});s.phase='play';s.stage='open';return s;};
for(const team of [0,1]){
 const s=E.createMatch({...E.defaultConfig('soccer'),team});s.phase='play';s.stage='open';
 for(const role of ['GK','DF','MF','FW']){const p=s.players.find(p=>p.team===team&&p.role===role);s.ball.owner=p.id;s.ball.team=team;s.selected=s.players.find(q=>q.team===team&&q.id!==p.id).id;E.syncSoloSoccerControl(s);assert.equal(s.selected,p.id,role+' inherits solo control');E.soccerAction(s,'switch');assert.equal(s.selected,p.id,'Switch cannot leave a friendly carrier');}
 const p=s.players.find(p=>p.team===team&&p.role==='GK');s.selected=p.id;s.ball.owner=p.id;p.cooldown=0;E.stepSoccer(s,{...E.neutral(),x:1},1/60);assert.equal(s.ball.owner,p.id,'Human keeper does not auto-pass');assert(p.v.x>0,'Human keeper can move with the ball');
 s.online=true;s.selected=team*100+9;s.ball.owner=team*100;E.syncSoloSoccerControl(s);assert.equal(s.selected,team*100+9,'Online seat stays independent of possession');s.online=false;s.config.mode='watch';E.syncSoloSoccerControl(s);assert.equal(s.selected,team*100+9,'CPU exhibition remains autonomous');
}
{
 const s=game(),passer=s.players.find(p=>p.id===s.selected),receiver=s.players.find(p=>p.id===8);
 for(const q of s.players){q.p=E.vec(19,0,q.team?-25:8);q.home={...q.p};}
 passer.p=E.vec(0,0,8);receiver.p=E.vec(0,0,-4);receiver.home={...receiver.p};Object.assign(s.ball,{owner:passer.id,team:0,x:0,y:.23,z:8});s.lastInput={...E.neutral(),z:-1};E.soccerAction(s,'pass');
 for(let n=0;n<150&&s.ball.owner<0;n++)E.stepSoccer(s,E.neutral(),1/60);
 assert.equal(s.ball.owner,receiver.id,'Real pass is received');assert.equal(s.selected,receiver.id,'Input follows the actual pass recipient');
 const k=game(),keeper=k.players.find(p=>p.id===0);keeper.p=E.vec(0,0,30);k.selected=9;Object.assign(k.ball,{owner:-1,team:1,last:109,x:0,y:.6,z:29.8,vx:0,vy:0,vz:4,power:5});E.stepSoccer(k,E.neutral(),1/60);assert.equal(k.ball.owner,keeper.id,'Keeper actually catches incoming opponent ball');assert.equal(k.selected,keeper.id,'Actual save immediately hands solo control to keeper');
}
console.log('PASS both teams: solo GK/DF/MF/FW follow possession, manual switch lock, controlled keeper, online and watch isolation');
function duel(distance){const s=game(),p=s.players.find(p=>p.id===s.selected);for(const q of s.players)q.p=E.vec(15,0,q.team?25:-25);p.p=E.vec(0,0,0);const defender=s.players.find(q=>q.team!==p.team);defender.p=E.vec(distance,0,0);s.ball.owner=p.id;s.ball.team=p.team;s.lastInput={...E.neutral(),z:-1};return{s,p,defender};}
for(const [distance,grade,chain]of[[1.7,'perfect',2],[2.8,'good',1],[6,'burst',0]]){const{s,p,defender}=duel(distance),before=p.spirit;E.soccerAction(s,'defend');assert.equal(s.duel.grade,grade);assert.equal(s.chains[p.team],chain);assert.equal(p.spirit,before-18);assert(E.len(s.ball,p.p)<.6,'Dribble carries the ball in the same step');if(chain)assert(defender.stun>0);E.soccerAction(s,'defend');assert.equal(p.spirit,before-18,'Held dribble cannot repeatedly spend during cooldown');}
const shoot=chain=>{const s=game(),p=s.players.find(p=>p.id===s.selected);s.chains[p.team]=chain;s.chainAt[p.team]=s.clock;s.ball.owner=p.id;E.soccerAction(s,'special');for(let n=0;n<50&&s.pendingShot;n++)E.stepSoccer(s,E.neutral(),1/60);return s.ball.power;};assert(shoot(5)>shoot(0)*1.15,'Successful links increase actual shot speed');
const s=game();s.chains=[5,0];s.chainAt=[0,0];s.clock=11;E.stepSoccer(s,E.neutral(),1/60);assert.equal(s.chains[0],0,'Stale links expire');
console.log('PASS timing-based dribble grades, cooldown/cost, attached ball, chain boost and expiry');
for(const sport of ['baseball','soccer']){
 const m=E.createMatch(E.defaultConfig(sport)),p=m.players.find(p=>p.id===m.selected);p.v=E.vec(3,0,4);const poses=[];
 for(const motion of sport==='baseball'?['run','swing','throw','catch']:['run','kick','tackle','catch'])for(const t of[0,.25,.5,.75,.99]){const a=E.sportsPose(m,p,motion,(1-t)*.6,.6,t*6);assert(Object.values(a.joints).every(q=>Object.values(q).every(Number.isFinite)));poses.push(JSON.stringify(a.joints));}
 assert(new Set(poses).size>10,'Actions have distinct phases, not one held pose');
 const still=E.sportsPose(m,p,'run',0,.6,2,true);assert.equal(still.bob,0,'Reduced motion removes ornamental bouncing');
 if(sport==='baseball'){m.stage='windup';m.timer=.2;p.id=m.pitcher;const lift=E.sportsPose(m,p,'pitch',.8,1,0);m.timer=.6;const release=E.sportsPose(m,p,'pitch',.4,1,0);assert.notDeepEqual(lift.joints['upper_arm.R'],release.joints['upper_arm.R']);assert.notEqual(lift.joints.spine.y,release.joints.spine.y,'Pitch uses real torso twist');}
}
console.log('PASS full-body gait, windup/release/finish, swing, kick, tackle, catches and reduced-motion poses');
