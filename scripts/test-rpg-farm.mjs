import assert from "node:assert/strict";
import { createServer } from "vite";
import fs from "node:fs";
const server = await createServer({
  cacheDir: "node_modules/.vite-farm-test",
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
try {
  const E = await server.ssrLoadModule("/src/rpg/engine.ts"),
    F = await server.ssrLoadModule("/src/rpg/farm/model.ts"),
    C = await server.ssrLoadModule("/src/rpg/farm/catalog.ts"),
    T = await server.ssrLoadModule("/src/rpg/town/model.ts"),
    N = await server.ssrLoadModule("/src/rpg/town/catalog.ts"),
    L = await server.ssrLoadModule("/src/rpg/life.ts"),
    H = await server.ssrLoadModule("/src/rpg/homeCatalog.ts"),
    S = await server.ssrLoadModule("/src/rpg/worldSave.ts"),
    Y = await server.ssrLoadModule("/src/rpg/city/model.ts"),
    Looks = await server.ssrLoadModule('/src/rpg/farm/animalLook.ts');
  let now = 1791150000000;
  const w = E.createWorld(42, undefined, 0, now);
  E.addPlayer(w, "a", "Farmer");
  E.addPlayer(w, "b", "Friend");
  const p = w.players.a;
  p.profile = {
    hp: 72,
    maxHp: 72,
    gold: 100,
    deck: [],
    deckSize: 0,
    character: "WARRIOR",
    image: "",
  };
  const player = {
    id: "WARRIOR",
    currentHp: 72,
    maxHp: 72,
    gold: 100,
    deck: [],
    relics: [],
    potions: [],
    rpgMutationRevision: 0,
  };
  const send = (a, id = "a") => E.applyAction(w, id, a, (now += 300));
  for (let y = 18; y < 50; y++)
    for (let x = 18; x < 60; x++) w.tiles[y * E.WIDTH + x] = "grass";
  w.sites = w.sites.filter((s) => s.x < 15 || s.x > 65 || s.y < 15 || s.y > 55);
  p.x = 21;
  p.y = 22;
  w.players.b.x = 25;
  w.players.b.y = 25;
  assert.equal(C.CROPS.length, 32);
  assert.equal(C.LIVESTOCK.length, 8);
  assert.equal(C.PET_SPECIES.length, 18);
  assert.equal(C.FARM_DISHES.length, 48);
  assert.equal(N.ALL_DISHES.length, 72);
  assert.ok(send({ type: "farm-start" }));
  assert.equal(send({ type: "farm-start" }), false);
  const f = F.ownFarm(w, "a");
  assert.equal(f.seeds.turnip, 3);
  assert.equal(send({ type: "farm-establish", x: 0, y: 0 }), false);
  assert.ok(send({ type: "farm-establish", x: 22, y: 23 }));
  assert.equal(p.life.bag.wood, 0);
  // Legacy farms retain planted cells during the per-cell migration.
  f.spatialVersion=undefined;F.farmOf(w,p);p.x=22;p.y=24;
  assert.ok(F.occupiedFarmTile(w, 24 * E.WIDTH + 24));
  assert.equal(Y.validCityTile(w, 24, 24), false);
  assert.equal(F.validFarmSpot(w, 23, 23), false);
  assert.equal(L.natureAt(w, 24 * E.WIDTH + 24), null);
  assert.ok(L.lifeWalkable(w, 24, 24));
  assert.ok(send({ type: "farm-plant", slot: 0, crop: "turnip" }));
  assert.equal(send({ type: "farm-plant", slot: 12, crop: "turnip" }), false);
  assert.equal(send({ type: "farm-plant", slot: 1, crop: "tomato" }), false);
  assert.equal(send({ type: "farm-harvest", slot: 0 }), false);
  assert.ok(send({ type: "farm-water", slot: 0 }));
  assert.equal(send({ type: "farm-water", slot: 0 }), false);
  assert.ok(send({ type: "farm-fertilize", slot: 0 }));
  assert.equal(send({ type: "farm-fertilize", slot: 0 }), false);
  const day = (n) => {
    w.town.day = n;
    w.town.elapsed = n * 180;
    F.advanceFarm(w);
  };
  day(1);
  assert.equal(f.plots[0].growth, 1);
  assert.ok(send({ type: "farm-harvest", slot: 0 }));
  assert.equal(f.pantry.turnip.quality, 4);
  assert.equal(f.book.turnip.best, 80);
  assert.equal(send({ type: "farm-harvest", slot: 0 }), false);
  assert.ok(send({ type: "farm-reward", id: "first" }));
  assert.equal(send({ type: "farm-reward", id: "first" }), false);
  let old = f.coins;
  assert.ok(
    send({ type: "farm-sell", ingredient: "turnip", amount: 1, quality: true }),
  );
  assert.equal(f.coins - old, 24);
  assert.equal(
    send({
      type: "farm-sell",
      ingredient: "turnip",
      amount: -1,
      quality: true,
    }),
    false,
  );
  assert.equal(
    send({ type: "farm-seed", crop: "__proto__", amount: 1 }),
    false,
  );
  // Another participant cannot harvest this farmer's plots; its commands address only its own farm.
  assert.equal(send({ type: "farm-harvest", slot: 0 }, "b"), true);
  assert.equal(f.pantry.turnip.quality, 3);
  f.coins = 5000;
  p.life.bag.wood = 100;
  p.life.bag.stone = 100;
  p.life.bag.ore = 100;
  p.life.bag.crystal = 100;
  assert.ok(send({ type: "farm-animal-buy", kind: "chicken", name: "コッコ" }));
  assert.ok(send({ type: "farm-animal-buy", kind: "cow", name: "ミルク" }));
  const hen = f.animals[0];
  assert.equal(Looks.ranchStage(w,hen),'young');
  w.town.elapsed+=110;
  assert.equal(Looks.ranchStage(w,hen),'growing');
  assert.ok(send({ type: "farm-animal-care", id: hen.id, care: "feed" }));
  assert.equal(
    send({ type: "farm-animal-care", id: hen.id, care: "feed" }),
    false,
  );
  assert.ok(send({ type: "farm-animal-care", id: hen.id, care: "brush" }));
  assert.ok(send({ type: "farm-animal-care", id: hen.id, care: "clean" }));
  day(2);
  assert.equal(Looks.ranchStage(w,hen),'adult');
  assert.equal(hen.ready, 1);
  assert.ok(send({ type: "farm-animal-care", id: hen.id, care: "collect" }));
  assert.ok(f.pantry.egg.normal > 0);
  assert.equal(
    send({ type: "farm-animal-care", id: hen.id, care: "collect" }),
    false,
  );
  day(3);
  assert.equal(hen.ready, 0, "unfed animals do not produce");
  const cow=f.animals.find(animal=>animal.kind==='cow');
  cow.bond=70;cow.health=90;cow.variant='rare';f.feed=20;
  assert.ok(send({type:'farm-animal-breed',id:cow.id,name:'ココア'}));
  const calf=f.animals.at(-1);
  assert.equal(calf.parentId,cow.id);
  assert.equal(Looks.ranchStage(w,calf),'young');
  const motherPos=Looks.ranchPosition(w,f,cow,f.animals.indexOf(cow));
  const calfPos=Looks.ranchPosition(w,f,calf,f.animals.indexOf(calf));
  assert(Math.hypot(motherPos.x-calfPos.x,motherPos.z-calfPos.z)<.8,'The juvenile stays by its parent in the shared map.');
  assert.equal(
    send({ type: "farm-animal-care", id: hen.id, care: "hack" }),
    false,
  );
  f.xp = 700;
  assert.ok(send({ type: "farm-upgrade", upgrade: "barn" }));
  assert.equal(F.animalLimit(f), 12);
  assert.ok(send({ type: "farm-upgrade", upgrade: "greenhouse" }));
  assert.ok(send({ type: "farm-upgrade", upgrade: "irrigation" }));
  assert.equal(send({ type: "farm-upgrade", upgrade: "greenhouse" }), false);
  // All crops can complete in the greenhouse; irrigation supplies water, and harvest quality enters the collection.
  for (const crop of C.CROPS) {
    const slot = 1;
    assert.ok(send({ type: "farm-seed", crop: crop.id, amount: 1 }));
    assert.ok(send({ type: "farm-plant", slot, crop: crop.id }));
    for (let i = 0; i < crop.days; i++) day(w.town.day + 1);
    assert.equal(f.plots[slot].growth, crop.days);
    assert.ok(send({ type: "farm-harvest", slot }));
    assert.ok(f.book[crop.id]);
    delete f.plots[slot].crop;
  }
  assert(send({type:'farm-animal-buy',kind:'bees',name:'朝露'}));
  const hive=f.animals.find(animal=>animal.kind==='bees');
  const V=await server.ssrLoadModule('/src/rpg/voxel.ts');
  const bed=`${f.x},${V.terrainHeight(w,f.x,f.y-2)},${f.y-2}`;
  w.voxels??={edits:{},revision:0,terrainVersion:2};
  w.voxels.edits[bed]='garden_bed';
  assert(F.apiaryHasFlowers(w,f));
  for(let i=0;i<2;i++){
    assert(send({type:'farm-animal-care',id:hive.id,care:'feed'}));
    day(w.town.day+1);
  }
  assert.equal(hive.ready,0,'A new hive matures before producing honey.');
  assert(send({type:'farm-animal-care',id:hive.id,care:'feed'}));
  day(w.town.day+1);
  assert.equal(hive.ready,2,'Flowers add a unit of honey to a full production cycle.');
  assert(send({type:'farm-animal-care',id:hive.id,care:'collect'}));
  assert(send({type:'voxel-bottle-honey'}));
  assert.equal(p.life.bag.bottled_honey,1);
  assert.equal((f.pantry.honey.normal??0)+(f.pantry.honey.quality??0),0);
  assert(!send({type:'voxel-bottle-honey'}));
  const petHome={id:'pet-home',owner:'a',ownerName:'Farmer',x:60,y:60,biome:'meadow',home:{tile:60*E.WIDTH+60,furniture:[],stock:{}},invitedAt:0};w.life.houses.push(petHome);p.life.indoors=petHome.id;
  assert.ok(send({type:'farm-pet-adopt',kind:'shiba',name:'ポチ'}));const pet=f.pets[0];assert.equal(pet.homeId,petHome.id);
  for(const care of ['feed','pat','play','train'])assert.ok(send({type:'farm-pet-care',id:pet.id,care}));
  assert.equal(send({type:'farm-pet-care',id:pet.id,care:'play'}),false);
  pet.hunger=80;pet.bond=50;p.moveCount+=20;F.advanceFarm(w);assert.equal(pet.bond,50,'Only an invited pet goes for a walk.');
  assert.ok(send({type:'farm-pet-care',id:pet.id,care:'follow'}));
  delete p.life.indoors;
  p.moveCount+=20;F.advanceFarm(w);
  assert.equal(f.activePet,pet.id);assert.equal(pet.bond,54);
  p.life.bag.thread=2;
  assert.ok(send({type:'farm-pet-collar',id:pet.id,color:'teal'}));
  assert.equal(pet.collar,'teal');assert.equal(p.life.bag.thread,0);
  p.life.indoors=petHome.id;
  f.feed=3;
  assert.ok(send({type:'farm-pet-care',id:pet.id,care:'trip'}));
  assert(pet.awayUntil>w.life.time);
  assert.equal(f.activePet,undefined);
  const errands=pet.trips;
  w.life.time+=46;F.advanceFarm(w);
  assert.equal(pet.trips,errands+1);
  assert.equal(pet.awayUntil,0);
  assert.ok(send({type:'farm-name',id:pet.id,name:'コムギ'}));assert.equal(pet.name,'コムギ');delete p.life.indoors;
  // Cooking consumes actual crop and animal products once, then shares the existing authoritative timing action.
  const home = {
    id: "home-a",
    owner: "a",
    ownerName: "Farmer",
    x: 40,
    y: 40,
    biome: "meadow",
    home: {
      tile: 40 * E.WIDTH + 40,
      level: 1,
      furniture: [{ slot: 0, item: "workbench" }],
    },
    interior: H.newInterior(),
    invitedAt: 0,
  };
  w.life.houses.push(home);
  p.life.indoors = home.id;
  p.life.roomPos = { x: 9, y: 11 };
  T.personOf(w, "a");
  const recipe = C.FARM_DISHES[4];
  delete f.pantry.strawberry;
  assert.equal(send({ type: "town-cook-start", dish: recipe.id }), true);
  assert.equal(
    w.town.cooking.a,
    undefined,
    "missing ingredients must reject cooking",
  );
  for (const [id, n] of Object.entries(recipe.farmCost))
    f.pantry[id] = { normal: n, quality: 0 };
  assert.ok(send({ type: "town-cook-start", dish: recipe.id }));
  for (const [id] of Object.entries(recipe.farmCost))
    assert.equal(f.pantry[id].normal, 0);
  assert.equal(
    send({ type: "farm-feed-buy" }),
    false,
    "cooking owns player input",
  );
  for (let i = 0; i < 3; i++) {
    now = w.town.cooking.a.started + 800;
    assert.ok(E.applyAction(w, "a", { type: "town-cook-tap" }, now));
  }
  assert.equal(w.town.people.a.foods[recipe.id].perfect, 1);
  assert.ok(send({ type: "town-meal", dish: recipe.id, target: "a" }));
  assert.equal(w.town.people.a.foods[recipe.id].perfect, 0);
  // Every farm recipe uses its own crop/product combination and completes in the shared kitchen.
  for (const recipe of C.FARM_DISHES) {
    for (const [key, n] of Object.entries(recipe.farmCost))
      f.pantry[key] = { normal: n, quality: 1 };
    for (const [key, n] of Object.entries(recipe.cost)) p.life.bag[key] = n;
    assert.ok(send({ type: "town-cook-start", dish: recipe.id }), recipe.id);
    for (const [key] of Object.entries(recipe.farmCost)) {
      assert.equal(f.pantry[key].normal, 0);
      assert.equal(
        f.pantry[key].quality,
        1,
        "normal quality is used before premium",
      );
    }
    for (let i = 0; i < 3; i++) {
      now = w.town.cooking.a.started + 800;
      assert.ok(E.applyAction(w, "a", { type: "town-cook-tap" }, now));
    }
    assert.ok(w.town.people.a.cooked[recipe.id]);
  }
  const save = S.makeWorldSave(w, "a", player, now),
    resume = S.restoreWorldSave(save, now + 86400000);
  assert.deepEqual(
    resume.farm,
    w.farm,
    "closed-app crop, pet and animal clocks remain frozen",
  );
  assert.deepEqual(resume.life.time, w.life.time);
  assert.equal(resume.farm.people.a.animals.find(animal=>animal.id===calf.id).parentId,cow.id);
  assert.equal(Looks.ranchArt(resume,resume.farm.people.a.animals.find(animal=>animal.id===cow.id)),'cow-rare');
  const before = f.coins;
  p.nativeScene = { token: "busy" };
  assert.equal(send({ type: "farm-seed", crop: "carrot", amount: 1 }), false);
  delete p.nativeScene;
  assert.equal(f.coins, before);
  {
  const farmWorld=E.createWorld(42,undefined,0,now);
  E.addPlayer(farmWorld,'a','Grower');
  const grower=farmWorld.players.a;
  farmWorld.sites=[];
  farmWorld.voxels={edits:{},placedBy:{},terrainVersion:2,revision:0,legacyFlat:[]};
  for(let z=35;z<49;z++)for(let x=29;x<45;x++){
    farmWorld.tiles[z*E.WIDTH+x]='grass';
    farmWorld.voxels.legacyFlat.push(`${x},${z}`);
    for(let y=0;y<3;y++)farmWorld.voxels.edits[V.voxelKey(x,y,z)]=null;
  }
  const go=(x,z)=>Object.assign(grower,{x,y:z,position3D:{x:x+.5,y:0,z:z+.5,surface2D:true}});
  const act=(action)=>assert(E.applyAction(farmWorld,'a',action,now+=300),JSON.stringify(action));
  const failed=(action)=>assert.equal(E.applyAction(farmWorld,'a',action,now+=300),false);
  const place=(block,x,z,rotation=0)=>{
    go(x-1,z+1);grower.life.bag[block]=1;grower.life.energy=6;
    act({type:'voxel-place',block,x,y:0,z,rotation});
    assert.equal(V.blockAt(farmWorld,x,0,z),block);
  };
  const day=(date)=>{
    farmWorld.town.day=date;
    farmWorld.town.elapsed=date*N.DAY_SECONDS;
    F.advanceFarm(farmWorld);
  };
  day(14);
  place('hydroponic_bed',32,38);
  go(31,38);grower.life.hoe=true;
  act({type:'farm-till',dx:1,dy:0});
  const hydro=F.farmOf(farmWorld,grower);
  const bed=hydro.plots.find(plot=>plot.x===32&&plot.y===38);
  assert(bed.hydroponic);
  hydro.seeds.mushroom=1;
  act({type:'farm-plant',slot:bed.slot,crop:'mushroom'});
  day(15);
  assert.equal(bed.growth,0,'The tray requires a supply of water.');
  grower.life.bag.water_bucket=1;
  act({type:'voxel-fluid',command:'water',x:33,y:0,z:38});
  for(let dayNumber=16;dayNumber<=18;dayNumber++)day(dayNumber);
  assert.equal(bed.growth,3);
  act({type:'farm-harvest',slot:bed.slot});
  assert.equal(hydro.pantry.mushroom.normal,3);

  place('farm_machine',38,45,1);
  place('crystal_lever',38,46);
  place('warehouse_chest',39,45);
  go(37,45);
  hydro.pantry.mushroom.normal=7;
  const wallet=hydro.coins;
  act({type:'voxel-device',command:'farm-job',x:38,y:0,z:45,value:'ship:mushroom'});
  act({type:'voxel-device',command:'use',x:38,y:0,z:46});
  const pulse=()=>{for(let i=0;i<12;i++)E.advanceWorld(farmWorld,now+=350);};
  pulse();pulse();
  assert.equal(hydro.pantry.mushroom.normal,4);
  assert.equal(hydro.coins,wallet+60);
  day(19);pulse();
  assert.equal(hydro.pantry.mushroom.normal,1);

  place('brew_cauldron',39,42);
  Object.assign(grower.life.bag,{herb:3,reed:1,glass:1,bottled_honey:2});
  act({type:'voxel-craft',recipe:'herbal_essence',amount:1});
  assert.equal(grower.life.bag.herbal_essence,2);
  act({type:'voxel-craft',recipe:'heal_draught',amount:1});
  act({type:'native-profile',profile:{...p.profile,hp:55}});
  act({type:'voxel-potion',item:'heal_draught'});
  assert.equal(grower.hp,63);
  act({type:'native-profile',profile:{...grower.profile,mutationRevision:grower.mutationRevision}});
  failed({type:'voxel-potion',item:'heal_draught'});
  place('summoning_altar',40,42);
  Object.assign(grower.life.bag,{emberstone:3,crystal_powder:2});
  act({type:'voxel-summon'});
  assert.equal(hydro.pets.find(pet=>pet.id===hydro.activePet)?.kind,'dragon');
  assert.equal(grower.life.bag.emberstone,0);
  Object.assign(grower.life.bag,{emberstone:3,crystal_powder:2,bottled_honey:1});
  failed({type:'voxel-summon'});
  assert.equal(grower.life.bag.emberstone,3);
  console.log('PASS hydroponic mushrooms, daily automated shipping, cauldron recipes, healing and the one-per-player familiar.');
  }
  for (const c of C.CROPS)
    assert.ok(fs.existsSync(`public/sprites/rpg/farm/crops/${c.id}.webp`));
  for (const a of C.LIVESTOCK)
    assert.ok(fs.existsSync(`public/sprites/rpg/farm/animals/${a.id}.webp`));
  for (const p of C.PET_SPECIES)
    assert.ok(fs.existsSync(`public/sprites/rpg/farm/pets/${p.id}.webp`));
  for (const d of C.FARM_DISHES) {
    assert.ok(fs.existsSync(`public/sprites/rpg/farm/food/${d.index}.webp`));
    for (const id of Object.keys(d.farmCost)) assert.ok(C.ingredientById(id));
  }
  console.log(
    "Farm passed: 32 crops, 8 livestock, 18 pets, 48 recipes, seasons/growth/quality/rotation, no duplicate rewards/production, ownership, irrigation/greenhouse/barn, home-only pet care, ingredient cooking, busy guards, frozen save/restore and 114 generated WebP assets.",
  );
} finally {
  await server.close();
}
