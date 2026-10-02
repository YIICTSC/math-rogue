import assert from 'node:assert/strict';
import {createServer} from 'vite';
import sharp from 'sharp';
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{
 const {createWorld,addPlayer,applyAction,WIDTH}=await server.ssrLoadModule('/src/rpg/engine.ts');
 const {lifeWalkable,interiorOf}=await server.ssrLoadModule('/src/rpg/life.ts');
 const {roomRoute,ROOM_DOOR,placementFits}=await server.ssrLoadModule('/src/rpg/homeCatalog.ts');
 const w=createWorld(77,undefined,180,10000);addPlayer(w,'owner','Owner');addPlayer(w,'guest','Guest');const owner=w.players.owner,guest=w.players.guest;
 const site=w.tiles.findIndex((t,i)=>t==='grass'&&i%WIDTH>2&&i%WIDTH<WIDTH-3&&Math.floor(i/WIDTH)>2&&w.sites.every(s=>Math.abs(s.x-i%WIDTH)+Math.abs(s.y-Math.floor(i/WIDTH))>=4)&&lifeWalkable(w,i%WIDTH-1,Math.floor(i/WIDTH))&&[1,-1,WIDTH,-WIDTH].every(d=>w.tiles[i+d]!=='water'));
 assert.ok(site>=0);owner.x=site%WIDTH;owner.y=Math.floor(site/WIDTH);owner.life.bag={plank:6,brick:2};
 assert.equal(applyAction(w,'owner',{type:'life-build'},11000),true);assert.equal(w.life.houses.length,0,'cannot build without a kit');
 applyAction(w,'owner',{type:'life-craft',recipe:'housekit'},12000);assert.equal(owner.life.bag.housekit,1);assert.equal(owner.life.bag.plank,0);
 applyAction(w,'owner',{type:'life-build'},13000);const h=w.life.houses[0];assert.ok(h);assert.equal(owner.life.indoors,h.id,'building on own tile opens the house');assert.equal(owner.life.bag.housekit,0);assert.deepEqual(owner.life.roomPos,{x:9,y:11});
 applyAction(w,'owner',{type:'life-leave'},14000);assert.equal(owner.life.indoors,undefined);assert.ok(lifeWalkable(w,owner.x,owner.y));
 guest.x=h.x-1;guest.y=h.y;applyAction(w,'guest',{type:'move',dx:1,dy:0},15000);assert.equal(guest.life.indoors,h.id,'overlapping the house enters it');
 applyAction(w,'owner',{type:'life-enter',houseId:h.id},15100);assert.equal(owner.life.indoors,h.id);
 owner.life.bag={plank:100,reed:100,ore:100,wood:100,crystal:100};const originalWood=owner.life.bag.wood;
 applyAction(w,'owner',{type:'life-furniture-craft',item:'plushBear'},16000);assert.equal(owner.life.bag.wood,originalWood-1);assert.equal(h.interior.stock.plushBear,1);
 const count=h.interior.placed.length;applyAction(w,'owner',{type:'life-place',item:'plushBear',x:9,y:11,rotation:0},16100);assert.equal(h.interior.placed.length,count,'entrance and occupied tiles stay clear');assert.equal(h.interior.stock.plushBear,1);
 applyAction(w,'owner',{type:'life-place',item:'plushBear',x:2,y:2,rotation:0},16200);assert.equal(h.interior.stock.plushBear,1,'furniture cannot overlap');
 applyAction(w,'owner',{type:'life-place',item:'plushBear',x:5,y:5,rotation:0},16300);assert.equal(h.interior.stock.plushBear,0);const plush=h.interior.placed.find(p=>p.item==='plushBear');assert.ok(plush);
 const before=h.interior.placed.length;applyAction(w,'guest',{type:'life-pack',id:plush.id},16400);assert.equal(h.interior.placed.length,before,'guest cannot edit owner furniture');
 applyAction(w,'owner',{type:'life-rotate',id:plush.id},16500);assert.equal(plush.rotation,1);
 applyAction(w,'owner',{type:'life-furniture-craft',item:'blueRug'},16600);applyAction(w,'owner',{type:'life-place',item:'blueRug',x:4,y:4,rotation:0},16700);assert.ok(h.interior.placed.some(p=>p.item==='blueRug'),'rug can go underneath objects');
 applyAction(w,'owner',{type:'life-furniture-craft',item:'darts'},17000);applyAction(w,'owner',{type:'life-place',item:'darts',x:7,y:5,rotation:0},17100);const dart=h.interior.placed.find(p=>p.item==='darts');assert.ok(dart);assert.ok(h.home.furniture.some(f=>f.slot===dart.slot&&f.item==='darts'));
 applyAction(w,'guest',{type:'life-game',command:{type:'game_join',slot:dart.slot}},17200);assert.equal(Object.values(w.life.games).length,0,'far players cannot join a furniture game');
 guest.life.roomPos={x:6,y:5};owner.life.roomPos={x:7,y:4};applyAction(w,'guest',{type:'life-game',command:{type:'game_join',slot:dart.slot}},17300);applyAction(w,'owner',{type:'life-game',command:{type:'game_join',slot:dart.slot}},17400);const game=Object.values(w.life.games)[0];assert.deepEqual(game.players,['guest','owner']);applyAction(w,'guest',{type:'life-game',command:{type:'game_start',key:game.key}},17500);assert.equal(game.phase,'playing');applyAction(w,'owner',{type:'life-pack',id:dart.id},17600);assert.ok(h.interior.placed.some(p=>p.id===dart.id),'cannot pack a running game');
 const route=roomRoute(interiorOf(h),owner.life.roomPos,ROOM_DOOR);assert.deepEqual(route.at(-1),ROOM_DOOR,'room remains connected to its exit');assert.equal(placementFits(h.interior,{id:'bad',item:'bed',x:-1,y:5,rotation:0},[]),false);
 const pos={...owner.life.roomPos};assert.equal(applyAction(w,'owner',{type:'life-room-move',dx:2,dy:0},17700),false);assert.deepEqual(owner.life.roomPos,pos,'cannot teleport indoors');
 owner.life.roomPos={x:9,y:12};applyAction(w,'owner',{type:'life-room-move',dx:0,dy:1},18000);assert.equal(owner.life.indoors,undefined,'walking onto doorway exits');assert.ok(!Object.values(w.life.games).some(g=>g.players.includes('owner')),'exit removes game participant');
 guest.life.roomPos={x:9,y:12};applyAction(w,'guest',{type:'life-room-move',dx:0,dy:1},19000);assert.equal(guest.life.indoors,undefined);assert.equal(Object.values(w.life.games).length,0);
 for(const [path,cols,rows]of [['public/sprites/rpg/craft-items.webp',4,3],['public/sprites/rpg/home-interiors.webp',6,4]]){const meta=await sharp(path).metadata();assert.equal(meta.format,'webp');assert.equal(meta.hasAlpha,true);assert.equal(meta.width/cols,meta.height/rows,'atlas has square cells');}
 console.log('RPG homes passed: building kits, automatic entry, walkable exits, owner permissions, furniture costs/collisions/rotation, rugs, shared games and WebP atlases.');
}finally{await server.close();}
