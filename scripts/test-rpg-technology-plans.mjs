import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import { createServer } from 'vite';

const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},
  server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try {
  const E=await server.ssrLoadModule('/src/rpg/engine.ts');
  const V=await server.ssrLoadModule('/src/rpg/voxel.ts');
  const M=await server.ssrLoadModule('/src/rpg/machinery.ts');
  const T=await server.ssrLoadModule('/src/rpg/technologyResearch.ts');
  const B=await server.ssrLoadModule('/src/rpg/blueprints.ts');
  const F=await server.ssrLoadModule('/src/rpg/farm/model.ts');
  const {DAY_SECONDS}=await server.ssrLoadModule('/src/rpg/town/catalog.ts');
  const resources=(plan,player,parts)=>{
    for(const {block} of parts) player.life.bag[block]=(player.life.bag[block]||0)+1;
    for(const [item,count] of Object.entries(plan.supplies??{})) player.life.bag[item]=(player.life.bag[item]||0)+count;
  };
  const examples={
    'lever-lamp':({op})=>op('use',0),
    'pressure-door':({move})=>move(0),
    'double-lock':({op})=>{op('mode',1,1,0,'subtract');op('use',0,1);op('use',1,-1);},
    clock:()=>{},
    'night-light':({world})=>{world.town.elapsed=DAY_SECONDS*.80;},
    'piston-door':({op})=>op('use',0),
    'rail-trip':({rail})=>rail(),
    'piston-lift':({op})=>{op('piston-axis',1);op('use',0);},
    'rail-signal':({op})=>op('cart-place',0),
    'rail-loop':({op,rail})=>{op('use',1,-1);rail(false);},
    sorter:({op,put})=>{op('filter',0,0,0,'ore');put('ore',0,0,1);put('stone',0,0,1);},
    smelter:({put})=>{put('ore',0,0,1,4);put('coal',0,0,1);},
    crafter:({op,put})=>{put('wood',0,0,1);op('use',-1);},
    pump:({op,bucket})=>{bucket('water',-1);op('use',0,1);},
    'water-lift':({bucket})=>bucket('water',0,0,2),
    harvester:({op,farm,at})=>{const spot=at(1);Object.assign(farm().plots[0],{x:spot.x,y:spot.z,crop:'turnip',growth:1});op('use',0,1);},
    beacon:({op})=>op('use',0),
    notes:({op})=>op('use',0),
    'street-grid':({op})=>op('use',0,1),
    'castle-gate':({move})=>move(0,2),
    metro:({rail})=>rail(),
    viaduct:({rail})=>rail(),
    freight:({op,at,storageCargo})=>{op('cart-place',0,0,0,'minecart_chest');storageCargo('ore');
      const end=at(2);op('cart-route',0,0,0,V.voxelKey(end.x,end.y,end.z));op('cart-drive',0);},
    'ranch-care':({op,farm,at,world})=>{
      const spot=at(1),f=farm();f.x=spot.x;f.y=spot.z;f.feed=3;
      f.animals=[{id:'cow',kind:'cow',name:'ミルク',born:0,feed:-1,brush:-1,clean:-1,bond:30,health:80,progress:0,ready:0}];
      world.farm.revision++;
      op('farm-job',0,0,0,'ranch');op('use',0,1);
    },
    fountain:({op,put})=>{put('water_bucket',0,0,1);op('use',0,1,1);},
    'logic-subtract':({op})=>{op('mode',0,0,0,'subtract');op('use',-1);},
    'rail-attraction':({rail})=>rail(),
  };
  assert.equal(Object.keys(examples).length,T.TECH_PLANS.length);
  assert.equal(new Set(T.SHOWCASE_PROJECTS).size,22);
  const samples=[];

  for(const plan of T.TECH_PLANS){
    let now=1791150000000;
    const world=E.createWorld(42,undefined,0,now);
    E.addPlayer(world,'a','Builder');
    world.sites=[];
    const player=world.players.a;
    const parts=T.showcaseParts(plan);
    const origin={x:34,z:42,y:plan.id==='metro'?-3:parts.some(part=>part.y<0)?1:0};
    const at=(x=0,z=0,y=0)=>({x:x+origin.x,z:z+origin.z,y:y+origin.y});
    world.voxels={edits:{},revision:1,terrainVersion:2,legacyFlat:[],placedBy:{},rotations:{}};
    const bottom=Math.min(...parts.map(part=>part.y))+origin.y;
    for(let z=36;z<49;z++) for(let x=26;x<46;x++){
      world.tiles[z*E.WIDTH+x]='grass';world.voxels.legacyFlat.push(`${x},${z}`);
      for(let y=Math.min(bottom,0);y<=4;y++) world.voxels.edits[V.voxelKey(x,y,z)]=null;
    }
    const buildingSite=structuredClone(world);
    const move=(x,z,y)=>{const dest=at(x,z,y);player.x=dest.x;player.y=dest.z;player.position3D={x:dest.x+.5,y:dest.y,z:dest.z+.5};};
    const send=action=>E.applyAction(world,player.id,action,now+=300);
    const succeed=(action)=>assert(send(action),`${plan.id}: ${JSON.stringify(action)}`);
    const op=(command,x,z,y,value)=>succeed({type:'voxel-device',command,...at(x,z,y),value});
    const put=(item,x,z,y,amount=1)=>succeed({type:'voxel-storage',...at(x,z,y),item,amount,direction:'deposit'});
    const rail=(board=true)=>{op('cart-place',0);if(board)op('cart-ride',0);op('cart-drive',0);};
    const bucket=(command,x,z,y)=>succeed({type:'voxel-fluid',command,...at(x,z,y)});
    resources(plan,player,parts);
    const sorted=[...parts].sort((a,b)=>a.y-b.y);
    for(const part of sorted){
      move(part.x-1,part.z-1,part.y);
      player.life.energy=6;
      const cell=at(part.x,part.z,part.y);
      succeed({type:'voxel-place',block:part.block,rotation:part.rotation,...cell});
      assert.equal(V.blockAt(world,cell.x,cell.y,cell.z),part.block,`${plan.id}: part has a valid support`);
    }
    move(-1,1);
    examples[plan.id]({world,at,op,put,rail,move,bucket,farm:()=>F.farmOf(world,player),
      storageCargo:item=>succeed({type:'voxel-device',command:'cart-cargo',...at(0),direction:'load',item,amount:1})});
    for(let tick=0;tick<42&&!T.researchStatus(world,player,plan,origin).ready;tick++) E.advanceWorld(world,now+=300);
    assert(T.researchStatus(world,player,plan,origin).ready,
      `${plan.id}: placed=${T.researchStatus(world,player,plan,origin).found}; carts=${JSON.stringify(M.machineCarts(world))}`);
    succeed({type:'voxel-research',plan:plan.id,...origin});
    assert(T.earnedBlueprint(plan,plan.title.ja),`${plan.id} has an importable design.`);
    assert.equal(player.life.research[0],plan.id);
    if(T.SHOWCASE_PROJECTS.includes(plan.id)){
      const pattern=T.earnedBlueprint(plan,plan.title.ja,true);
      assert.equal(pattern?.cells.length,parts.length,`${plan.id}: the whole construction fits its blueprint`);
      const corner={x:origin.x+Math.min(...parts.map(p=>p.x)),y:bottom,z:origin.z+Math.min(...parts.map(p=>p.z))};
      const positions=pattern.cells.map(cell=>B.blueprintPoint(corner,cell));
      const builder=buildingSite.players.a;
      resources(plan,builder,parts);
      let pasted=false;
      for(let z=38;z<=47&&!pasted;z++)for(let x=29;x<=42&&!pasted;x++){
        if(positions.some(cell=>Math.hypot(cell.x-x,cell.y-bottom-1.1,cell.z-z)>4.5||
          cell.x===x&&cell.z===z&&cell.y>=bottom&&cell.y<bottom+2))continue;
        builder.x=x;builder.y=z;builder.position3D={x:x+.5,y:bottom,z:z+.5,surface2D:true};
        pasted=E.applyAction(buildingSite,builder.id,{type:'voxel-blueprint',command:'place',...corner,pattern},now);
      }
      assert(pasted,`${plan.id}: whole blueprint can be placed from a safe tile`);
      for(const {x,y,z,block} of positions)assert.equal(V.blockAt(buildingSite,x,y,z),block);
      if(process.env.RPG_SHOWCASE_DATA)samples.push({id:plan.id,world});
    }
    console.log(`PASS ${plan.id}`);
  }
  if(process.env.RPG_SHOWCASE_DATA)await writeFile(process.env.RPG_SHOWCASE_DATA,JSON.stringify(samples));
} finally {await server.close();}
