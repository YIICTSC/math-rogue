import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createServer } from 'vite';

const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},
  server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try {
  const E=await server.ssrLoadModule('/src/rpg/engine.ts');
  const M=await server.ssrLoadModule('/src/rpg/machinery.ts');
  const D=await server.ssrLoadModule('/src/rpg/worldDelta.ts');
  const world=E.createWorld(42,undefined,0);
  world.voxels={edits:{},revision:0,terrainVersion:2,placedBy:{}};
  for(let i=0;i<40;i++)E.addPlayer(world,`player-${i}`,`Builder ${i+1}`);
  const {edits,placedBy}=world.voxels;
  for(let row=0;row<128;row++) {
    const x0=10+18*(row%8),z=12+3*Math.floor(row/8);
    for(let i=0;i<16;i++) {
      const x=x0+i,id=`${x},25,${z}`;
      const block=i===0?'crystal_lever':i===15?'crystal_lamp':'crystal_wire';
      edits[id]=block;
      placedBy[id]='player-0';
      M.recordMachineEdit(world,x,25,z,null,block);
      if(i===0)world.voxels.machinery.devices[id].enabled=true;
    }
  }
  assert(!M.canAddMachinePart(world));
  let now=Date.now();
  for(let k=0;k<4;k++)M.advanceMachinery(world,now+=250);
  const nearLamp='25,25,12',farLamp='151,25,57';
  assert(M.inspectMachine(world,25,25,12).device.signal>0);
  assert(world.voxels.machinery.devices[farLamp].signal>0);
  const {tiles,...initial}=world;
  const writer=new D.WorldDeltaWriter();
  assert.equal(writer.capture(initial),null);
  let client=structuredClone(world);
  const first=world.players['player-0'];
  first.x=10;first.y=12;first.position3D={x:10.5,y:25,z:12.5};
  assert(M.applyMachineCommand(world,first,{type:'voxel-device',command:'use',x:10,y:25,z:12},now+=250));
  const sample=[];
  let totalDelta=0,totalFull=0;
  for(let i=0;i<15;i++) {
    const start=performance.now();
    M.advanceMachinery(world,now+=250);
    sample.push(performance.now()-start);
    // A moving participant generates a frame even as the circuit settles.
    if(i===2)first.life.bag.wood+=1;
    if(i===8)delete first.life.bag.stone;
    world.revision++;
    const {tiles,...full}=world;
    const frame=writer.capture(full);
    const wire=JSON.stringify(frame);
    totalDelta+=wire.length;
    totalFull+=JSON.stringify(full).length;
    assert(!D.applyWorldDelta({...client,revision:client.revision-1},frame));
    const patched=D.applyWorldDelta(client,JSON.parse(wire));
    assert(patched);
    assert.deepEqual(patched,JSON.parse(JSON.stringify(full)));
    client={...patched,tiles};
  }
  assert.equal(client.voxels.machinery.devices[nearLamp].signal,0);
  assert(client.voxels.machinery.devices[farLamp].signal>0);
  assert(totalDelta<totalFull*.6);

  M.recordMachineEdit(world,25,25,12,'crystal_lamp',null);
  edits[nearLamp]=null;delete placedBy[nearLamp];world.revision++;
  const {tiles:terrain,...complete}=world;
  const removed=writer.capture(complete);
  const next=D.applyWorldDelta(client,JSON.parse(JSON.stringify(removed)));
  assert.equal(next.voxels.edits[nearLamp],null);
  assert(!Object.hasOwn(next.voxels.placedBy,nearLamp));
  assert(!Object.hasOwn(next.voxels.machinery.devices,nearLamp));
  const max=Math.max(...sample).toFixed(1);
  console.log(`PASS 2,048-device circuit, 40 players, on/off/removal and inventory delta parity. ${Math.round(totalDelta*100/totalFull)}% of full snapshot text. Slowest tick ${max} ms.`);
} finally {await server.close();}
