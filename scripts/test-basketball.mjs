import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs/promises';
await fs.mkdir('tmp/basketball',{recursive:true});
await build({entryPoints:['src/mini-games/basketball/engine.ts','src/mini-games/basketball/protocol.ts'],outdir:'tmp/basketball',bundle:true,format:'esm',platform:'node'});
const E=await import('../tmp/basketball/engine.js'),P=await import('../tmp/basketball/protocol.js');
const lesson=()=>({title:'Test',questions:Array.from({length:3},(_,i)=>({id:'q'+i,mode:'ADDITION',question:'1 + 1',options:['2','3','4','5'],correct:0}))});
function answer(w){for(const p of Object.values(w.players))while(p.quiz){const q=p.quiz;assert(E.command(w,p.id,{type:'answer',id:q.id,index:q.index,option:0}));assert(!E.command(w,p.id,{type:'answer',id:q.id,index:q.index,option:0}));assert(E.command(w,p.id,{type:'continue',id:q.id,index:q.index}));}}
function fresh(n=1){const w=E.createBasketball(17,n===1);for(let i=0;i<n;i++)assert(E.addPlayer(w,'p'+i,'P'+i));assert(E.startBasketball(w,lesson));return w;}
for(let n=1;n<=24;n++){const w=fresh(n);assert.equal(w.teams.length,Math.max(2,Math.ceil(n/3)));const humans=w.teams.map(t=>t.members.filter(Boolean).length);assert(Math.max(...humans)-Math.min(...humans)<=1);for(const p of Object.values(w.players)){const v=E.viewFor(w,p.id);assert(P.validView(v));if(v.quiz)assert(!Object.hasOwn(v.quiz.question,'correct'));}answer(w);}
let w=fresh(),m=E.currentMatch(w,'p0'),u=m.units.find(u=>u.owner==='p0');assert(!E.command(w,'p0',{type:'throw',aim:0,special:false}));answer(w);for(const unit of m.units)unit.cpu=false;
assert(!E.command(w,'p0',{type:'move',x:Infinity,y:0}));assert(!E.command(w,'p0',{type:'throw',aim:NaN,special:false}));
function frames(n){for(let i=0;i<n;i++)E.tick(w,1/60,lesson);}
for(const [distance,points]of [[2,2],[8,3]]){m.ball.holder=u.id;u.x=0;u.y=8.7-distance;u.action=0;u.energy=1;w.random=0;const old=m.score[0];assert(E.command(w,'p0',{type:'throw',aim:0,special:false}));frames(70);assert.equal(m.score[0],old+points);assert.equal(m.units.find(v=>v.id===m.ball.holder).side,1);}
m.ball.holder=u.id;m.ball.age=0;m.shotClock=10;u.action=0;assert(E.command(w,'p0',{type:'pass'}));frames(100);assert.notEqual(m.ball.holder,u.id);assert(m.shotClock<10,'passing cannot reset the shot clock');
const opponent=m.units.find(v=>v.side===1);m.ball.holder=opponent.id;u.x=opponent.x;u.y=opponent.y;u.cooldown=0;assert(E.command(w,'p0',{type:'catch'}));assert.equal(m.ball.holder,u.id);assert(!E.command(w,'p0',{type:'catch'}));m.shotClock=.01;frames(1);assert.equal(m.units.find(v=>v.id===m.ball.holder).side,1);
m.time=59.99;frames(1);assert.equal(m.phase,'study');const before=m.time;frames(120);assert.equal(m.time,before,'learning pauses match clock');answer(w);assert.equal(m.phase,'play');
m.time=179.99;m.score=[4,4];frames(1);assert.equal(m.phase,'play','ties continue');m.score=[6,4];frames(1);assert.equal(m.winner,0);frames(190);assert.equal(w.phase,'result');assert(E.rematch(w));assert.equal(w.phase,'lobby');
w=fresh(7);answer(w);for(let round=0;round<5&&w.phase!=='result';round++){for(const match of w.matches.filter(m=>m.round===w.round&&m.phase==='play')){match.time=181;match.score=[2,0];}for(let i=0;i<190;i++)E.tick(w,1/60,lesson);answer(w);}assert.equal(w.phase,'result');assert(w.champion!==null);
console.log('PASS: basketball 1–24 entrants, balanced teams, hidden quiz answers, scoring 2/3 points, possession, pass, steal, shot clock, learning pause, overtime, tournament and rematch.');
// CPU teams must complete a real simulation without scripted baskets or skipped learning.
w=fresh();answer(w);for(const u of w.matches[0].units)u.cpu=true;for(let i=0;i<60*300&&w.phase!=='result';i++){E.tick(w,1/60,lesson);answer(w);}assert.equal(w.phase,'result');assert(w.matches[0].score[0]+w.matches[0].score[1]>0);
console.log('PASS: autonomous CPU basketball reaches the result screen.');
// First solo tutorial progresses through real commands; online cannot enable it.
w=E.createBasketball(17,true,true);E.addPlayer(w,'p0','New player');assert(E.startBasketball(w,lesson));m=E.currentMatch(w,'p0');u=m.units.find(u=>u.owner==='p0');assert.equal(m.tutorial.stage,'move');assert(P.validView(E.viewFor(w,'p0')));answer(w);
assert(!E.command(w,'p0',{type:'throw',aim:0,special:false}),'cannot skip tutorial actions');
for(let i=0;i<22;i++){E.command(w,'p0',{type:'move',x:1,y:0});E.tick(w,1/60,lesson);}assert.equal(m.tutorial.stage,'dash');
E.command(w,'p0',{type:'move',x:0,y:0});assert(!E.command(w,'p0',{type:'dodge'}));E.command(w,'p0',{type:'move',x:1,y:0});assert(E.command(w,'p0',{type:'dodge'}));assert.equal(m.tutorial.stage,'pass');E.command(w,'p0',{type:'move',x:0,y:0});assert(E.command(w,'p0',{type:'pass'}));frames(180);assert.equal(m.tutorial.stage,'steal');assert.equal(m.time,0);assert.equal(m.shotClock,24);assert(E.command(w,'p0',{type:'catch'}));assert.equal(m.tutorial.stage,'shoot');assert(!E.command(w,'p0',{type:'throw',aim:0,special:false}),'must approach the basket');
for(let i=0;i<180&&Math.hypot(u.x,8.7-u.y)>3;i++){const dx=-u.x,dy=6.3-u.y,n=Math.max(1,Math.hypot(dx,dy));E.command(w,'p0',{type:'move',x:dx/n,y:dy/n});E.tick(w,1/60,lesson);}E.command(w,'p0',{type:'move',x:0,y:0});assert(E.command(w,'p0',{type:'throw',aim:0,special:false}));frames(70);assert.equal(m.tutorial.stage,'complete');assert.equal(m.score[0],2);assert(P.validView(E.viewFor(w,'p0')));assert(E.command(w,'p0',{type:'tutorial-complete'}));assert(!m.tutorial);assert.deepEqual(m.score,[0,0]);frames(10);assert(m.time>0);assert(!E.command(w,'p0',{type:'tutorial-complete'}));
const online=E.createBasketball(17,false,true);assert.equal(online.tutorialRequested,false);
console.log('PASS: first-solo tutorial requires movement/dash/pass/receive/steal/close shot, freezes clocks, confirms a basket and starts normal play; online stays unchanged.');
