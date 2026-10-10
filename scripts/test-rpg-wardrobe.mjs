import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
const server=await createServer({cacheDir:'node_modules/.vite-wardrobe',optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const E=await server.ssrLoadModule('/src/rpg/engine.ts'),T=await server.ssrLoadModule('/src/rpg/town/model.ts'),W=await server.ssrLoadModule('/src/rpg/town/wardrobe.ts'),S=await server.ssrLoadModule('/src/rpg/worldSave.ts');
 let now=1791111111111;const w=E.createWorld(42,undefined,0,now);E.addPlayer(w,'a','Tester');E.addPlayer(w,'b','Other');const p=w.players.a;p.profile={hp:p.hp,maxHp:p.maxHp,gold:1000,deck:[],deckSize:0,character:'WARRIOR',image:''};p.gold=1000;T.advanceTown(w,now);const target='resident-mina',walker=w.town.walkers[target];p.x=walker.x;p.y=walker.y;
 const send=a=>{const result=E.applyAction(w,'a',a,now+=300);if(p.profile)p.profile.mutationRevision=p.mutationRevision;return result;};
 assert.ok(send({type:'town-encounter',target}));const mine=w.town.people.a,npc=w.town.people[target];
 assert.equal(send({type:'town-outfit-buy',outfit:'__proto__'}),false);assert.equal(p.gold,1000);
 assert.equal(send({type:'town-outfit-gift',target,outfit:'wedding'}),false);
 assert.ok(send({type:'town-outfit-buy',outfit:'wedding'}));assert.equal(p.gold,940);assert.equal(p.profile.gold,940);assert.equal(p.mutations.at(-1).gold,-60);assert.equal(mine.clothes.wedding,1);
 assert.ok(send({type:'town-outfit-gift',target,outfit:'wedding'}));assert.equal(mine.clothes.wedding,0);assert.deepEqual(npc.wardrobe,['wedding']);assert.equal(npc.wearing,undefined);assert.equal(npc.reaction.emotion,'surprise');assert.equal(w.social.talks.at(-1).lines[1].speaker,target);
 assert.equal(send({type:'town-outfit-gift',target,outfit:'wedding'}),false);assert.equal(send({type:'town-outfit-wear',target,outfit:'swim'}),false);
 const bond=w.town.bonds.find(b=>b.people.includes('a')&&b.people.includes(target));bond.friendship=70;
 assert.ok(send({type:'town-outfit-wear',target,outfit:'wedding'}));assert.equal(npc.wearing,'wedding');assert.equal(W.residentAppearance(w,target,'fallback'),'sprites/rpg/wardrobe/mina/wedding.webp');
 p.x=190;p.y=87;assert.equal(send({type:'town-outfit-wear',target,outfit:'default'}),false);assert.equal(npc.wearing,'wedding');p.x=walker.x;p.y=walker.y;
 assert.ok(send({type:'town-outfit-wear',target,outfit:'default'}));assert.equal(npc.wearing,undefined);assert.equal(W.residentAppearance(w,target,'fallback'),'fallback');
 assert.equal(send({type:'town-outfit-wear',target:'a',outfit:'default'}),false);assert.equal(send({type:'town-outfit-wear',target:'resident-custom-1',outfit:'wedding'}),false);
 assert.ok(send({type:'town-outfit-wear',target,outfit:'wedding'}));send({type:'town-encounter',target:null});
 const player={id:'WARRIOR',currentHp:p.profile.hp,maxHp:p.profile.maxHp,gold:p.profile.gold,deck:[],relics:[],potions:[],rpgMutationRevision:p.mutationRevision};const save=S.makeWorldSave(w,'a',player,now),restored=S.restoreWorldSave(save,now+86400000);assert.deepEqual(restored.town.people.a.clothes,mine.clothes);assert.equal(restored.town.people[target].wearing,'wedding');assert.deepEqual(restored.town.people[target].wardrobe,npc.wardrobe);
 for(const id of ['mina','ao','ren','sui','saha','yuki','phil','towa','nono','kino','nemu','mio'])for(const style of [...W.OUTFITS.map(o=>o.id),'joy','shy','surprise','sad']){const image=W.outfitById(style)?W.outfitImage('resident-'+id,style):W.reactionImage('resident-'+id,style);assert.ok(image);assert.ok((await fs.stat('public/'+image)).size>1000);}
 assert.equal(W.OUTFITS.length,8);console.log('Wardrobe passed: gold mutations, inventory, gift persistence, friendship admission, proximity, invalid actions, usual outfit, all residents and save restoration.');
}finally{await server.close();}
