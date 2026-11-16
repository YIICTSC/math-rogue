import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,watch:null,hmr:false},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
try{
 const G=await server.ssrLoadModule('/src/mini-games/gakuro-golf/engine.ts'),C=await server.ssrLoadModule('/src/mini-games/gakuro-golf/course.ts'),M=await server.ssrLoadModule('/src/mini-games/gakuro-golf/motion.ts'),P=await server.ssrLoadModule('/src/mini-games/gakuro-golf/protocol.ts');
 const E=await server.ssrLoadModule('/src/mini-games/tennis/engine.ts');
 const D=await server.ssrLoadModule('/src/mini-games/gakuro-golf/side-golf/courses.ts'),S=await server.ssrLoadModule('/src/mini-games/gakuro-golf/side-golf/physics.ts');
 // Overhead mechanics must be determined by position/timing, never by the input's claimed shot.
 const tw=E.createTennis(12,true);E.addPlayer(tw,'a','A');E.addPlayer(tw,'b','B');E.startTennis(tw,()=>({title:'Test',questions:Array.from({length:3},(_,i)=>({id:'q'+i,mode:'ADDITION',question:'1 + 1 = ?',options:['2','3','4','5'],correct:0}))}));const tm=tw.matches[0],u=tm.units[0];tm.phase='rally';Object.assign(tm.ball,{x:u.x,y:u.y,z:3,vx:0,vy:0,vz:-1,lastSide:1,serve:false,bounces:0});
 assert(E.canSmash(tm,u));
 for(const [field,value] of [['z',1.8],['z',4],['vz',5],['x',u.x+3],['lastSide',u.side]]){const before=tm.ball[field];tm.ball[field]=value;assert.equal(E.canSmash(tm,u),false,`${field}=${value} cannot smash`);tm.ball[field]=before;}
 assert(E.command(tw,u.owner,{type:'swing',shot:'topspin',aim:0,power:.2}));assert(u.smash&&tm.ball.smash);assert(tm.ball.vz<0,'overhead smash initially drives the ball down');
 u.swing=0;u.energy=1;Object.assign(tm.ball,{x:u.x,y:u.y,z:3,vx:0,vy:0,vz:-1,lastSide:1,serve:false,bounces:0});assert(E.command(tw,u.owner,{type:'swing',shot:'special',aim:0,power:1}));assert(tm.ball.star&&tm.ball.smash);assert.equal(u.energy,0);
 console.log('PASS: overhead window, reach, rising/friendly rejection, immediate smash and special smash.');
 assert.equal(C.ADVENTURE_HOLES.length,18);assert.equal(C.HOLES.length,18);
 for(let i=0;i<18;i++){
  const w=G.createGolf(55);G.addPlayer(w,'a','A');assert(G.setCourse(w,'adventure'));G.startGolf(w,'Test');const p=w.players.a;p.hole=i;p.x=p.z=0;p.y=C.groundHeight(C.holeFor(p),p);p.correct=3;p.phase='aim';p.shotsLeft=3;
  assert(P.validView(G.viewFor(w,'a')),'adventure view round trip');assert.equal(G.setCourse(w,'classic'),false,'course locked during play');
  const angle=Math.atan2(C.holeFor(p).cup.x,C.holeFor(p).cup.z),prediction=M.predictShot(G.viewFor(w,'a').players[0],'iron',angle,.7);
  // Share precisely the preview's ideal strike, then run authoritative tick to settle.
  Object.assign(p,G.shotVelocity(p,'iron',angle,.7));Object.assign(p,{phase:'moving',origin:{x:0,z:0},shotAngle:angle,shotClub:'iron',shotSpin:0,spinApplied:false,flightTime:0});
  let before={x:p.x,y:p.y+.55,z:p.z};for(let step=0;step<901&&p.phase==='moving';step++){before={x:p.x,y:p.y+.55,z:p.z};G.tick(w,1/30);if(p.penalty)break;}
  const end=prediction.at(-1),actual=p.penalty?before:{x:p.x,y:p.y+.55,z:p.z};assert(Math.hypot(end.x-actual.x,end.y-actual.y,end.z-actual.z)<.001,`hole ${i+1}: terrain preview matches authoritative result`);
  assert(Number.isFinite(p.x+p.y+p.z));
 }
 const falling=new M.BallMotion(),voidPlayer={...G.viewFor((()=>{const w=G.createGolf();G.addPlayer(w,'a','A');return w;})(),'a').players[0],course:'adventure',hole:9,x:65,z:60,y:26,phase:'moving',vx:0,vz:0,vy:-30};assert.equal(C.surface(C.holeFor(voidPlayer),voidPlayer),'ob');falling.push(voidPlayer,0);falling.push({...voidPlayer,y:20},200);assert(falling.sample(100+M.BALL_RENDER_DELAY).y<25,'sky falls are visibly below island altitude');
 console.log('PASS: all 18 adventure holes have identical authoritative/preview terrain, wind, slopes, bounce and penalties.');
 assert.equal(D.SIDE_COURSES.length,72);assert.equal(new Set(D.SIDE_COURSES.map(c=>c.id)).size,72);
 for(const c of D.SIDE_COURSES){const state=S.createSideState(c.id);assert(S.shootSide(state,44,.55,'normal'));for(let n=0;n<1800&&state.phase==='flight';n++)S.tickSide(state,1/120);assert(Number.isFinite(state.ball.x+state.ball.y));}
 const goal=S.createSideState(0);goal.phase='flight';goal.strokes=2;Object.assign(goal.ball,{x:331,y:41.5,vx:2,vy:-1});S.tickSide(goal,.04);assert.equal(goal.phase,'holed');assert.equal(goal.event,'goal');assert.equal(goal.conceded,false);
 const ice=S.createSideState(0);ice.phase='flight';ice.shot='ice';Object.assign(ice.ball,{x:160,y:18,vx:0,vy:-1});S.tickSide(ice,.03);assert(ice.frozen.includes(0),'ice freezes water');
 const fall=S.createSideState(0);S.shootSide(fall,-90,1,'normal');Object.assign(fall.ball,{x:160,y:18,vx:0,vy:-1});S.tickSide(fall,.03);assert.equal(fall.event,'water');assert.equal(fall.strokes,2);assert.equal(fall.ball.x,fall.origin.x,'failure is a quick return to the previous shot');
 const heavy=S.createSideState(2);heavy.inventory.heavy=1;S.shootSide(heavy,0,1,'heavy');Object.assign(heavy.ball,{x:161,y:46,vx:50,vy:0});S.tickSide(heavy,.04);assert(heavy.broken.includes(2),'heavy breaks fragile wall');
 const sticky=S.createSideState(2);sticky.inventory.sticky=1;S.shootSide(sticky,0,1,'sticky');Object.assign(sticky.ball,{x:160,y:46,vx:35,vy:0});S.tickSide(sticky,.06);assert.equal(sticky.phase,'aim');assert(sticky.attached,'sticky permits the next shot from a wall');
 const warp=S.createSideState(5);S.shootSide(warp,45,.5,'normal');Object.assign(warp.ball,{x:125,y:65,vx:5,vy:0});S.tickSide(warp,.01);assert(warp.ball.x>240&&warp.warpCooldown>0,'portals preserve a usable exit and suppress instant recapture');
 const brake=S.createSideState(0);brake.inventory.brake=brake.inventory.undo=1;S.shootSide(brake,44,.7,'normal');assert(S.airBrake(brake));assert.equal(brake.ball.vx,0);assert.equal(brake.inventory.brake,0);assert(S.rewindSide(brake));assert.equal(brake.strokes,0);assert.equal(brake.inventory.undo,0);assert.equal(S.rewindSide(brake),false,'cannot undo the same shot twice');
 console.log('PASS: 72 courses, fast flight, frost, hazard penalty, wall break, wall anchoring, portal, brake and one-use rewind.');
}finally{await server.close();}
