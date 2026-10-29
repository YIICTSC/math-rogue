import assert from 'node:assert/strict';import{build}from'esbuild';import fs from'node:fs/promises';
await fs.mkdir('tmp/tennis-tests',{recursive:true});await build({entryPoints:['src/mini-games/tennis/engine.ts','src/mini-games/tennis/scoring.ts','src/mini-games/tennis/protocol.ts'],bundle:true,platform:'node',format:'esm',outdir:'tmp/tennis-tests'});
const E=await import('../tmp/tennis-tests/engine.js'),S=await import('../tmp/tennis-tests/scoring.js'),P=await import('../tmp/tennis-tests/protocol.js');let serial=0;
const factory=()=>({title:'Arithmetic',questions:Array.from({length:3},(_,i)=>({id:`q${serial++}-${i}`,mode:'ADDITION',question:'1 + 1 = ?',options:['1','2','3','4'],correct:1}))});
function answerAll(w){for(const p of Object.values(w.players))while(p.quiz){const q=p.quiz;assert(E.command(w,p.id,{type:'answer',id:q.id,index:q.index,option:1}));assert(E.command(w,p.id,{type:'continue',id:q.id,index:q.index}));}}
function game(count,mode='singles'){const w=E.createTennis(55,count===1);for(let i=0;i<count;i++)assert(E.addPlayer(w,'p'+i,'Player '+i));assert(E.configure(w,mode,1));assert(E.startTennis(w,factory));return w;}
for(const n of Array.from({length:32},(_,i)=>i+1))for(const mode of ['singles','doubles']){const w=game(n,mode),teams=w.teams.length,size=2**Math.ceil(Math.log2(teams));assert.equal(w.matches.length,size/2);assert.equal(w.matches.filter(m=>m.reason==='bye').length,size-teams);assert.equal(new Set(w.teams.flatMap(t=>t.members.filter(Boolean))).size,n);assert(P.validView(E.viewFor(w,'p0')));for(const match of w.matches)if(match.teams[1]!==null)assert.equal(match.units.length,mode==='singles'?2:4);}
{const w=game(3);const bye=w.matches.find(m=>m.reason==='bye'),id=bye.units[0].owner;assert.notEqual(E.viewFor(w,id).match.id,bye.id,'Bye entrants automatically watch the active court');}
console.log('PASS: 1–32 entrants, singles/doubles, balanced byes and CPU partners.');
{
 const w=E.createTennis(1);for(const id of ['a','b','c','d'])assert(E.addPlayer(w,id,id));
 E.disconnectPlayer(w,'b');assert(E.addPlayer(w,'replacement','Replacement'));E.configure(w,'doubles',1);
 const preview=E.viewFor(w,'a').players.filter(p=>!p.spectator).map(p=>p.id);
 assert.deepEqual(preview,['a','replacement','c','d']);assert(E.startTennis(w,factory));
 assert.deepEqual(w.teams.map(t=>t.members),[preview.slice(0,2),preview.slice(2)]);
 console.log('PASS: lobby pair preview matches the real teams after a player leaves and a new player joins.');
}
{
 const w=game(2),p=w.players.p0,q=p.quiz,v=E.viewFor(w,'p0');assert.equal(v.quiz.question.id,q.lesson.questions[0].id);assert.equal('correct' in v.quiz.question,false);assert(!JSON.stringify(v).includes(q.lesson.questions[1].id));assert.equal(E.command(w,'p0',{type:'answer',id:q.id,index:1,option:1}),false);assert(E.command(w,'p0',{type:'answer',id:q.id,index:0,option:1}));assert.equal(E.command(w,'p0',{type:'answer',id:q.id,index:0,option:1}),false);assert.equal(p.correct,1);assert.equal(E.viewFor(w,'p1').quiz.answer,null);assert(E.command(w,'p0',{type:'continue',id:q.id,index:0}));answerAll(w);assert.equal(w.matches[0].phase,'serve');assert.equal(E.command(w,'p0',{type:'move',x:NaN,y:0}),false);assert.equal(E.command(w,'p0',{type:'swing',shot:'fake',aim:0,power:1}),false);assert.equal(E.command(w,'p0',{type:'swing',shot:'topspin',aim:0,power:4}),false);assert(E.command(w,'p0',{type:'swing',shot:'topspin',aim:0,power:.7}));assert.equal(w.matches[0].phase,'rally');for(let i=0;i<50;i++)E.tick(w,1/60,factory);assert.equal(w.matches[0].phase,'rally');assert.equal(w.matches[0].faults,0);assert(P.validView(E.viewFor(w,'p0')));
 const bad=structuredClone(E.viewFor(w,'p0'));bad.match.ball.x=NaN;assert.equal(P.validView(bad),false);
 console.log('PASS: private questions, replay rejection, authoritative input bounds and legal cross-court serve.');
}
{
 const m={points:[3,3],games:[0,0],tiebreak:false};assert.equal(S.scorePoint(m,0,3).game,false);assert.equal(S.pointLabel(m.points,0),'AD');assert.equal(S.scorePoint(m,1,3).game,false);assert.equal(S.pointLabel(m.points,0),'40');S.scorePoint(m,0,3);assert(S.scorePoint(m,0,3).game);assert.deepEqual(m.games,[1,0]);m.games=[3,2];m.points=[0,3];assert(S.scorePoint(m,1,3).game);assert(m.tiebreak);m.points=[6,6];assert.equal(S.scorePoint(m,0,3).match,false);assert(S.scorePoint(m,0,3).match);
 console.log('PASS: 15/30/40, deuce/advantage, games, set and tie-break by two.');
}
{
 const w=game(1,'doubles');answerAll(w);const m=w.matches[0],order=[];m.games=[3,3];m.tiebreak=true;
 for(let n=0;n<8;n++){m.points=[n,0];m.phase='point';m.wait=.001;m.studyAt=0;E.tick(w,.02,factory);order.push(m.units[m.serverUnit].id.split('-').slice(-2).join('-'));}
 assert.deepEqual(order,['0-1','1-1','1-1','0-0','0-0','1-0','1-0','0-1']);console.log('PASS: doubles tie-break service rotates through all four players.');
}
{
 const w=game(1,'doubles');answerAll(w);let rallies=0,points=0;for(let n=0;n<60*600&&w.phase!=='result';n++){answerAll(w);for(const m of w.matches)for(const u of m.units)u.cpu=true;E.tick(w,1/60,factory);rallies=Math.max(rallies,...w.matches.map(m=>m.rally));points=Math.max(points,...w.matches.map(m=>m.pointSerial));}console.log('CPU diagnostic',rallies,points,w.phase);assert(rallies>=3,'CPUs must actually sustain rallies');assert(points>=4,'Rallies must resolve into real points');assert.equal(w.phase,'result','CPU match must reach results');assert.notEqual(w.champion,null);
 console.log('PASS: full simulated doubles match with real rallies, scoring, learning breaks and results.');
}
for(const count of[3,5,6,9,17,32]){
 const w=game(count);let steps=0;while(w.phase!=='result'&&steps++<20000){answerAll(w);for(const m of w.matches.filter(m=>m.round===w.round)){if(m.phase==='point')m.wait=.001;if(['serve','rally'].includes(m.phase)){m.phase='rally';Object.assign(m.ball,{x:9,y:5,z:.081,vx:0,vy:0,vz:-1,spin:0,bounces:0,lastSide:0,serve:false});}}E.tick(w,.05,factory);}assert.equal(w.phase,'result',`${count} player tournament finishes`);assert(w.champion!==null);assert.equal(w.matches.filter(m=>m.phase==='finished'&&m.reason!=='bye').length,count-1);
}
console.log('PASS: complete 3/5/6/9/17/32-player elimination tournaments through the final.');
{
 const w=game(3,'doubles');answerAll(w);const m=w.matches[0],team=w.teams[1];assert.equal(team.members[1],null);E.disconnectPlayer(w,team.members[0]);E.tick(w,.02,factory);assert.equal(m.reason,'forfeit');assert.equal(m.winner,0);assert(E.addPlayer(w,'late','Late'));assert(w.players.late.spectator);assert.equal(E.command(w,'late',{type:'swing',shot:'special',aim:0,power:1}),false);
 const lobby=E.createTennis(1);E.addPlayer(lobby,'departing','Leaving');E.disconnectPlayer(lobby,'departing');assert.equal(Object.keys(lobby.players).length,0);assert(E.addPlayer(lobby,'new','New'));assert.equal(lobby.players.new.slot,0);
 console.log('PASS: withdrawal forfeits even with a CPU partner; late joins spectate only.');
}

for(const mode of ['singles','doubles'])for(const side of [0,1])for(const odd of [false,true]){
 const w=game(mode==='singles'?2:4,mode);answerAll(w);const m=w.matches[0];
 m.games=side===0?[0,0]:[1,0];m.points=odd?[1,0]:[0,0];m.phase='point';m.wait=.001;E.tick(w,.02,factory);
 const u=m.units[m.serverUnit],sign=Math.sign(u.x),width=mode==='singles'?E.SINGLES_WIDTH:E.DOUBLES_WIDTH,baseline=u.y;
 assert.equal(u.side,side);
 const move=(x,y,frames=60)=>{for(let n=0;n<frames;n++){assert(E.command(w,u.owner,{type:'move',x,y}));E.tick(w,1/60,factory);}};
 move(sign,0);assert.equal(u.x,sign*(width-.22),'server stops inside the correct sideline');
 move(-sign,0);assert.equal(u.x,sign*.22,'server cannot cross the center mark');
 move(0,-Math.sign(baseline));assert.equal(u.y,baseline,'server cannot step across the baseline');
 assert(E.command(w,u.owner,{type:'swing',shot:'topspin',aim:0,power:.7}));assert.equal(m.phase,'rally');
 assert.equal(m.ball.x,u.x,'serve launches from the adjusted stance');
 move(-sign,0,25);assert.equal(Math.sign(u.x),-sign,'free movement resumes after serving');
 for(let n=0;n<60&&m.ball.bounces===0&&m.phase==='rally';n++)E.tick(w,1/60,factory);
 assert.equal(m.faults,0,'service-box ruling does not follow the moving server');
 assert.equal(m.ball.bounces,1,'serve lands in the score-selected diagonal service box');
 assert(P.validView(E.viewFor(w,u.owner)));
}
console.log('PASS: legal lateral serve movement for both sides and service halves in singles/doubles; baseline guard and stable service-box ruling.');
assert.equal(E.createTennis().targetGames,3,'New matches default to three games');
for(const [age,returned,offset=0]of [[0,true],[.15,false],[null,false],[0,true,-1.1]]){
 const w=game(2);answerAll(w);const m=w.matches[0],attacker=m.units[0],receiver=m.units[1];
 m.phase='rally';m.shotSerial=5;attacker.shot='special';attacker.shotSeq=5;receiver.x=0;receiver.y=5;receiver.swing=0;receiver.cpu=false;receiver.buffer=age===null?0:.32-age;
 m.ball={star:true,x:0,y:5+offset,z:1,vx:0,vy:offset?40:8,vz:0,spin:0,lastSide:attacker.side,bounces:1,serve:false,netLet:false,trail:[]};
 attacker.shot='slice'; // Queuing the next shot cannot weaken an airborne star ball.
 E.tick(w,offset?.025:.01,factory);
 assert.equal(m.phase,returned?'rally':'point');if(returned)assert.equal(m.ball.lastSide,receiver.side);else assert(receiver.spinStun>0);
}
console.log('PASS: three-game default, precise star return and mistimed spinning loss.');
