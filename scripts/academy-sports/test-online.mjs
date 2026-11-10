import assert from'node:assert/strict';import{build}from'esbuild';
const r=await build({stdin:{contents:"export * from './src/mini-games/academy-sports/onlineWorld';export * from './src/mini-games/academy-sports/core';export * from './src/mini-games/academy-sports/engine';export * from './src/mini-games/academy-sports/onlineInvite';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});const E=await import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
const factory=()=>({title:'共有単元・たし算',questions:[0,1,2].map(i=>({id:'addition-'+i,mode:'ADDITION',question:'1 + 1 = ?',options:['0','1','2','3'],correct:2}))});
let seq=new Map(),now=100;const cmd=(w,id,c)=>{const n=(seq.get(id)||0)+1;seq.set(id,n);return w.command(id,c,n,now);};
const create=(sport,count)=>{seq=new Map();const w=new E.OnlineWorld(sport,'p0',{},factory);w.config.seed=7891;for(let i=0;i<count;i++){assert(w.add('p'+i,'Player '+i));cmd(w,'p'+i,{type:'ready',ready:true});}return w;};
const completeStudy=w=>{for(const p of w.view.players){let q;while((q=w.study.view(p.id))){assert(cmd(w,p.id,{type:'answer',quizId:q.id,index:q.index,option:2}));assert(cmd(w,p.id,{type:'continue',quizId:q.id,index:q.index}));}}};
const start=w=>{assert(cmd(w,'p0',{type:'start'}));for(const p of w.view.players)cmd(w,p.id,{type:'loaded',loaded:true});completeStudy(w);w.tick(1/60,now);};
for(const sport of ['baseball','soccer','volleyball','festival']){
 const count=E.ONLINE_CAPACITY[sport],w=create(sport,count);assert(!w.add('overflow','Overflow'));const per=sport==='festival'?2:count/2;for(let team=0;team<(sport==='festival'?4:2);team++)assert.equal(w.team(team).length,per);
 assert(!cmd(w,'p1',{type:'start'}));assert(cmd(w,'p0',{type:'start'}));w.tick(1/60,now);assert.equal(w.view.match.clock,0,'No clock while clients load');for(const p of w.view.players)cmd(w,p.id,{type:'loaded',loaded:true});w.tick(1/60,now);assert(!w.view.loading);assert.equal(w.view.match.clock,0,'Study begins after start and pauses play');assert.equal(E.onlineSnapshot(w).quiz,null);const privateView=E.onlineSnapshot(w,'p0');assert(privateView.quiz);assert(!('correct' in privateView.quiz.question));assert(E.validOnlineView(privateView,sport));completeStudy(w);w.bind();
 const assigned=w.view.players.filter(p=>p.unit>=0).map(p=>p.unit);assert.equal(new Set(assigned).size,assigned.length);assert.equal(assigned.length,sport==='baseball'?2:count);
 assert(E.validOnlineView(E.onlineSnapshot(w),sport));assert(!E.validOnlineView({...E.onlineSnapshot(w),sport:'bad'},sport));
 assert(!cmd(w,'p1',{type:'configure',config:{innings:9},limit:2}));assert(!cmd(w,'p1',{type:'pause',paused:true}));assert(!cmd(w,'p1',{type:'tactic',key:'__proto__',value:3}));assert(!cmd(w,'p1',{type:'action',action:'setScore'}));
 const snapshot=E.onlineSnapshot(w);assert(Buffer.byteLength(JSON.stringify(snapshot))<256000);assert(!('controls'in snapshot.match));assert.equal(snapshot.match.history.length,0);assert(!JSON.stringify(snapshot).includes('correctAnswer'));
 w.disconnect('p1');assert(!w.view.players.find(p=>p.id==='p1').connected);assert(!cmd(w,'p1',{type:'action',action:'primary'}));w.tick(1/60,now);E.assertFinite(w.view.match);
 console.log('PASS',sport,count,'seats, teams, authority, loading barrier, assigned controls, bounded snapshot and disconnect');
}
{
 const w=create('baseball',4);start(w);const s=w.view.match;s.phase='play';const attack=w.view.players.find(p=>p.unit===s.bat),def=w.view.players.find(p=>p.unit===s.pitcher);assert(attack&&def);const before=s.bat;assert(cmd(w,def.id,{type:'input',input:{...E.neutral(),x:.9,z:-.3}}));for(let i=0;i<40;i++){now+=16;w.tick(1/60,now);}assert(s.pitchAim.x>0);
 assert(cmd(w,def.id,{type:'action',action:'primary'}));assert.equal(s.stage,'meter');assert(cmd(w,def.id,{type:'action',action:'primary'}));for(let i=0;i<50;i++){now+=16;w.tick(1/60,now);}assert.equal(s.stage,'pitch');assert(cmd(w,attack.id,{type:'action',action:'primary'}));assert(s.swingAt>0);
 // Rotation follows the batting order, without a waiter's ability to control the current batter.
 s.batting[s.half]=(s.batting[s.half]+1)%9;s.bat=s.half*100+s.batting[s.half];w.bind();assert.notEqual(w.view.players.find(p=>p.unit===s.bat).id,attack.id);assert.equal(attack.unit,-1);assert(!cmd(w,attack.id,{type:'action',action:'primary'}));
 console.log('PASS baseball two-team pitch/bat input and alternating teammates');
}
{
 const w=create('baseball',2);start(w);const s=w.view.match;s.phase='play';s.stage='pitch';s.clock=10;s.timer=1;s.plateAt=9.61;s.plateBall={x:0,y:1.2,z:18};Object.assign(s.ball,{x:0,y:1.2,z:18,vx:0,vy:0,vz:20});s.swingAt=-99;s.balls=0;s.strikes=0;w.tick(.02,now);assert.equal(s.strikes,1,'Online strike uses plate position while awaiting delayed swing');assert.equal(s.balls,0);
 s.phase='play';s.stage='pitch';s.clock=11;s.plateAt=10.8;s.plateBall={x:0,y:1.2,z:18};Object.assign(s.ball,{x:0,y:1.2,z:18,vx:0,vy:0,vz:20});s.aim={x:0,y:1.2};s.swingAt=-99;w.bind();const batter=w.view.players.find(p=>p.unit===s.bat);assert(cmd(w,batter.id,{type:'action',action:'primary',observedClock:10.8}));assert.equal(s.swingAt,10.8);w.tick(1/60,now);assert.equal(s.stage,'live','Valid delayed swing can hit the plate ball');
 console.log('PASS baseball bounded delayed swing and plate-position strike verdict');
}
for(const sport of ['soccer','volleyball','festival']){
 const w=create(sport,E.ONLINE_CAPACITY[sport]);start(w);const s=w.view.match;s.phase='play';if(sport==='soccer'){s.stage='open';s.ball.owner=-1;s.ball.x=18;s.ball.z=15;}const people=w.view.players.filter(p=>p.unit>=0).slice(0,2),before=people.map(p=>s.players.find(u=>u.id===p.unit).p.x);
 for(const p of people)cmd(w,p.id,{type:'input',input:{...E.neutral(),x:.8}});for(let i=0;i<12;i++){now+=16;w.tick(1/60,now);}people.forEach((p,i)=>assert(s.players.find(u=>u.id===p.unit).p.x>before[i],sport+' simultaneous movement'));
 now+=1000;w.tick(1/60,now);for(const p of people)assert.equal(s.controls[p.unit].x,0,'Stale input expires');
 console.log('PASS',sport,'simultaneous human movement and input expiry');
}
{
 const w=create('soccer',2);start(w);const s=w.view.match;cmd(w,'p0',{type:'pause',paused:true});const time=s.clock;w.tick(.1,now);assert.equal(s.clock,time);cmd(w,'p0',{type:'pause',paused:false});s.phase='finished';s.winner=0;w.tick(1/60,now);assert.equal(w.view.phase,'result');assert(!cmd(w,'p1',{type:'rematch'}));assert(cmd(w,'p0',{type:'rematch'}));assert.equal(w.view.phase,'lobby');assert(w.view.players.every(p=>!p.ready));
 const url=E.academyInviteUrl('https://example.test/game?other=1#hash','soccer','012345');assert.deepEqual(E.academyInvitation(url),{sport:'soccer',code:'012345'});assert.equal(E.academyInvitation('https://example.test/?academySport=chess&academyRoom=012345'),null);assert.equal(E.academyInvitation('https://example.test/?academySport=soccer&academyRoom=999999'),null);
 console.log('PASS host pause, shared result, rematch readiness and bounded invitation links');
}
{
 const w=create('volleyball',12);start(w);const s=w.view.match;s.phase='play';const server=w.view.players.find(p=>p.unit===s.server*100+s.serveSlot[s.server]),teammate=w.view.players.find(p=>p.team===server.team&&p.id!==server.id),opponent=w.view.players.find(p=>p.team!==server.team);
 assert(!cmd(w,teammate.id,{type:'action',action:'primary'}),'Only the server can launch the serve');assert.equal(s.stage,'serve');assert(!cmd(w,opponent.id,{type:'action',action:'alternate'}),'Opponents cannot change serve tactics');assert(cmd(w,server.id,{type:'action',action:'primary'}));assert.equal(s.stage,'toss');assert(!w.add('x'.repeat(101),'Long ID'));
 console.log('PASS volleyball server ownership and opposing tactic isolation');
}
// Full matches run through the same authenticated command path as connected peers.
for(const sport of ['baseball','soccer','volleyball','festival']){
 const w=create(sport,2);start(w);let frame=0;
 while(w.view.phase!=='result'&&frame++<150000){now+=1000/60;if(w.study.pending)completeStudy(w);const s=w.view.match;w.bind();
  for(const person of w.view.players){if(person.unit<0)continue;const p=s.players.find(u=>u.id===person.unit);let input=E.neutral();
   if(sport==='baseball'){
    if(person.team!==s.half){if(s.stage==='set'&&s.timer>.4)cmd(w,person.id,{type:'action',action:'primary'});if(s.stage==='meter'&&s.timer>.3)cmd(w,person.id,{type:'action',action:'primary'});
     if(['live','throw'].includes(s.stage)){const b=s.ball,t=b.y>2?(b.vy+Math.sqrt(b.vy*b.vy+19.62*b.y))/9.81:0,dx=b.x+b.vx*t-p.p.x,dz=b.z+b.vz*t-p.p.z,n=Math.max(1,Math.hypot(dx,dz));input={...input,x:dx/n,z:dz/n,dash:true};if(b.owner>=0&&frame%12===0)cmd(w,person.id,{type:'action',action:'primary'});if(frame%80===0)cmd(w,person.id,{type:'action',action:'defend'});}}
    else if(s.stage==='pitch'&&s.bat%3===0&&s.ball.z>17.5&&s.swingAt<0)cmd(w,person.id,{type:'action',action:'primary'});
   }else if(sport==='soccer'){
    const dx=s.ball.x-p.p.x,dz=s.ball.z-p.p.z,n=Math.max(1,Math.hypot(dx,dz));input={...input,x:dx/n,z:dz/n,dash:true};if(frame%30===0){if(s.stage==='restart')cmd(w,person.id,{type:'action',action:'primary'});else if(s.ball.owner===p.id)cmd(w,person.id,{type:'action',action:p.spirit>35?'special':'pass'});else cmd(w,person.id,{type:'action',action:'defend'});}
   }else if(sport==='volleyball'){
    if(s.server===person.team&&s.stage==='serve')cmd(w,person.id,{type:'action',action:'primary'});else if(s.server===person.team&&s.stage==='toss'&&s.timer>.45)cmd(w,person.id,{type:'action',action:'primary'});else if(s.stage==='rally'&&Math.hypot(s.ball.x-p.p.x,s.ball.z-p.p.z)<2.1&&s.ball.y-p.p.y<3.15&&s.ball.vy<1.2&&s.lastContact!==p.id&&frame%5===0)cmd(w,person.id,{type:'action',action:'primary'});
   }else{
    if(s.contest<2){input={...input,z:-1,dash:true};if(frame%40===0)cmd(w,person.id,{type:'action',action:'jump'});}else if(s.contest===2){input={...input,x:-p.p.x/Math.max(1,Math.hypot(p.p.x,p.p.z)),z:-p.p.z/Math.max(1,Math.hypot(p.p.x,p.p.z))};if(frame%35===0)cmd(w,person.id,{type:'action',action:'jump'});if(frame%15===0)cmd(w,person.id,{type:'action',action:'primary'});}else{const enemy=s.players.filter(q=>q.team!==p.team&&q.hp>0).sort((a,b)=>Math.hypot(a.p.x-p.p.x,a.p.z-p.p.z)-Math.hypot(b.p.x-p.p.x,b.p.z-p.p.z))[0];if(enemy){const dx=enemy.p.x-p.p.x,dz=enemy.p.z-p.p.z,n=Math.max(1,Math.hypot(dx,dz));input={...input,x:dx/n,z:dz/n};if(frame%12===0)cmd(w,person.id,{type:'action',action:'primary'});}}if(s.held[p.id])cmd(w,person.id,{type:'action',action:'pass'});
   }
   cmd(w,person.id,{type:'input',input});
  }
  w.tick(1/60,now);if(frame%1200===0)E.assertFinite(w.view.match);
 }
 assert.equal(w.view.phase,'result',sport+' complete online-command match');E.assertFinite(w.view.match);console.log('PASS full',sport,'match through online commands:',w.view.match.score,'frames',frame);
}

{
 const w=create('baseball',2);assert.equal(w.view.phase,'lobby');assert.equal(w.study.view('p0'),null);assert(w.setLesson(factory));for(const p of w.view.players)cmd(w,p.id,{type:'ready',ready:true});assert(cmd(w,'p0',{type:'start'}));const q=w.study.view('p0'),other=w.study.view('p1');assert(q&&other);assert.notEqual(q.id,other.id);assert(!cmd(w,'p1',{type:'answer',quizId:q.id,index:0,option:2}));assert(cmd(w,'p0',{type:'answer',quizId:q.id,index:0,option:2}));assert(!cmd(w,'p0',{type:'answer',quizId:q.id,index:0,option:2}));assert.equal(w.view.players[0].correct,1);assert.equal(w.study.view('p1').answer,null,'Peer feedback remains private');assert.equal(w.study.view('p0').answer,2);assert(!w.setLesson(factory));cmd(w,'p0',{type:'continue',quizId:q.id,index:0});completeStudy(w);for(const p of w.view.players)cmd(w,p.id,{type:'loaded',loaded:true});w.tick(1/60,now);w.view.match.phase='play';w.view.match.inning++;w.tick(1/60,now);assert(w.study.pending,'Next inning inserts the host lesson');const clock=w.view.match.clock;w.tick(1/60,now);assert.equal(w.view.match.clock,clock);w.disconnect('p1');assert.equal(w.study.view('p1'),null);completeStudy(w);w.tick(1/60,now);assert(w.view.match.clock>clock);console.log('PASS host lesson after start and at breaks, private grades, duplicate rejection, disconnect and resume');
}
