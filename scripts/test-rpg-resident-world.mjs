import assert from 'node:assert/strict';import {createServer} from 'vite';
const server=await createServer({cacheDir:'node_modules/.vite-resident-core',optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const E=await server.ssrLoadModule('/src/rpg/engine.ts'),R=await server.ssrLoadModule('/src/rpg/town/worldResidents.ts'),T=await server.ssrLoadModule('/src/rpg/town/model.ts'),L=await server.ssrLoadModule('/src/rpg/life.ts'),S=await server.ssrLoadModule('/src/rpg/worldSave.ts');
 const w=E.createWorld(42,undefined,0,Date.now());E.addPlayer(w,'a','Tester');const p=w.players.a;p.profile={hp:72,maxHp:72,gold:100,deckSize:0,deck:[],character:'WARRIOR',image:''};T.advanceTown(w,Date.now());R.advanceResidents(w);
 assert.ok(Object.keys(w.town.walkers).length>=12);for(const r of Object.values(w.town.walkers))assert.ok(L.lifeWalkable(w,r.x,r.y),'Spawn must be walkable');
 p.spectator=true;const initial=JSON.stringify(w.town.walkers),seen=new Set();let moved=0;
 const clone=structuredClone(w);
 for(let tick=0;tick<80;tick++){w.life.time+=3;clone.life.time+=3;R.advanceResidents(w);R.advanceResidents(clone);for(const r of Object.values(w.town.walkers)){assert.ok(L.lifeWalkable(w,r.x,r.y),'Walking avoids blocked terrain');assert.ok(Math.abs(r.x-r.homeX)<=12&&Math.abs(r.y-r.homeY)<=12);if(r.activity==='walk')moved++;seen.add(r.activity);}}
 assert.ok(moved>10);assert.notEqual(JSON.stringify(w.town.walkers),initial);assert.deepEqual(w.town.walkers,clone.town.walkers);assert.ok(seen.has('rest')&&seen.has('walk'));
 p.spectator=false;const r=w.town.walkers['resident-mina'];p.x=r.x+10;p.y=r.y;const send=a=>E.applyAction(w,'a',a,Date.now());
 assert.equal(send({type:'town-encounter',target:'resident-mina'}),false);assert.equal(send({type:'town-talk',target:'resident-mina'}),false);assert.equal(send({type:'town-word-teach',target:'resident-mina',word:{text:'hello',reading:'hello',genre:'greeting'}}),false);
 p.x=r.x;p.y=r.y;assert.ok(send({type:'town-encounter',target:'resident-mina'}));const before={x:r.x,y:r.y};for(let i=0;i<5;i++){w.life.time+=3;R.advanceResidents(w);}assert.deepEqual({x:r.x,y:r.y},before,'Conversation stops walking');assert.equal(send({type:'move',dx:1,dy:0}),false,'Conversation owns movement');assert.ok(send({type:'town-talk',target:'resident-mina'}));assert.ok(w.social.talks.at(-1).people.includes('resident-mina'));
 const player={currentHp:72,maxHp:72,gold:100,deck:[],relics:[],rpgMutationRevision:0};assert.equal(S.canSaveWorld(w,'a',player),false);assert.ok(send({type:'town-encounter',target:null}));assert.equal(w.town.encounters.a,undefined);assert.ok(S.canSaveWorld(w,'a',player));
 const saved=S.makeWorldSave(w,'a',player),restored=S.restoreWorldSave(JSON.parse(JSON.stringify(saved)));assert.deepEqual(restored.town.walkers,w.town.walkers);assert.deepEqual(restored.town.encounters,{});
 p.x=r.x+20;w.town.encounters.a={target:'resident-mina',until:w.life.time+180};R.advanceResidents(w);assert.equal(w.town.encounters.a,undefined,'Walking away cancels a stale conversation');
 delete w.town.walkers;R.advanceResidents(w);assert.ok(w.town.walkers['resident-mina'],'Old saves receive positions');
 console.log('Resident world passed: placement, deterministic free walking/resting, collision bounds, proximity guards, frozen conversations, movement ownership, save roundtrip and old-save migration.');
}finally{await server.close();}
