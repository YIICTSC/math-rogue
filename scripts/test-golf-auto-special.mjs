import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,watch:null,hmr:false},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
try{
const E=await server.ssrLoadModule('/src/mini-games/gakuro-golf/engine.ts');
const {HOLES}=await server.ssrLoadModule('/src/mini-games/gakuro-golf/course.ts');
const {validView}=await server.ssrLoadModule('/src/mini-games/gakuro-golf/protocol.ts');
const lesson=()=>({title:'Test',questions:[0,1,2].map(i=>({id:'q'+i,mode:'ADDITION',question:'1+1',options:['0','1','2','3'],correct:2}))});
const world=()=>{const w=E.createGolf();E.addPlayer(w,'p','Player');E.startGolf(w,'Test');return w;};
const w=world(),p=w.players.p;
for(let batch=0;batch<2;batch++){p.phase='ready';E.command(w,'p',{type:'quiz'},lesson);for(let i=0;i<3;i++){E.command(w,'p',{type:'answer',shotId:p.shotId,index:i,option:2});E.command(w,'p',{type:'continue',shotId:p.shotId,index:i});}assert(Math.abs(p.starEnergy-(batch+1)/2)<1e-9);}
for(const energy of [0,.5,1])for(const impact of [-.21,-.2,0,.2,.21,1]){
 const w=world(),p=w.players.p;Object.assign(p,{phase:'aim',starEnergy:energy,shotsLeft:3,correct:3});
 assert(E.command(w,'p',{type:'shot',shotId:p.shotId,club:'driver',angle:0,power:.5,impact,special:true}));
 const special=energy===1&&Math.abs(impact)<=.2;assert.equal(p.shotSpecial,special);assert.equal(p.starEnergy,special?0:energy);
}
for(const hole of [0,5,17])for(const club of ['driver','putter'])for(const power of [.05,1])for(const angle of [0,Math.PI]){
 const w=world(),p=w.players.p;Object.assign(p,{hole,scores:Array(hole).fill(4),phase:'aim',starEnergy:1,shotsLeft:3,correct:3});
 assert(E.command(w,'p',{type:'shot',shotId:p.shotId,club,angle,power,impact:0}));
 assert(p.shotSpecial);let peak=0;
 for(let i=0;i<180;i++){E.tick(w,1/30);peak=Math.max(peak,p.y);assert(validView(E.viewFor(w,'p')));}
 assert.equal(p.phase,'holed');assert.equal(p.strokes,1);assert.equal(p.penalty,false);assert.deepEqual({x:p.x,z:p.z},HOLES[hole].cup);assert(peak>30);
 assert.equal(w.sportsEvents.filter(e=>e.kind==='special').length,1);assert.equal(w.sportsEvents.filter(e=>e.call==='hole-in-one').length,1);
}
console.log('PASS six-answer gauge, yellow boundaries, client flag cannot force special, short/long/reversed shots and putting recover to cup across holes, server view validation and single scoring.');
}finally{await server.close();}
