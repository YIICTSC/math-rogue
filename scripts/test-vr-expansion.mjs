import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['src/mini-games/gakurogear/engine.ts'],bundle:true,platform:'node',format:'esm',outfile:'tmp/vr-expansion.mjs'});
const {MISSIONS,WEAPON_UNLOCKS,ITEM_UNLOCKS,WEAPONS,createRun,blocked,floorHeight,step,objectivesComplete}=await import('../tmp/vr-expansion.mjs');
const neutral={x:0,z:0,crouch:true,interact:false,decoy:false};
assert.equal(MISSIONS.length,300);assert.equal(new Set(MISSIONS.map(m=>m.id)).size,300);
assert.equal(new Set(MISSIONS.slice(50).map(m=>m.size)).size,5);
for(const m of MISSIONS){
 const run=createRun(m);run.switches.fill(true);
 // Flood-fill once per mission verifies all mandatory locations can be reached, including crouch tunnels.
 const key=(x,z)=>`${x},${z}`,start=[Math.round(m.spawn.x*2),Math.round(m.spawn.z*2)],queue=[start],seen=new Set([key(...start)]);
 for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(!seen.has(k)&&!blocked(m,{x:nx/2,z:nz/2},.27,true,run)){seen.add(k);queue.push([nx,nz]);}}}
 for(const q of [...m.targets,m.exit,...(m.switches??[]),...(m.defend?[m.defend]:[])])assert(queue.some(([x,z])=>Math.hypot(x/2-q.x,z/2-q.z)<.8),`Unreachable ${m.id}: ${JSON.stringify(q)}`);
 assert(m.ammo>=m.requiredShots);assert(m.limit>m.par);
 if(m.terrain?.length){assert.equal(floorHeight(m,{x:m.size,z:0}),0);assert.equal(floorHeight(m,{x:-m.size,z:0}),0);assert.equal(floorHeight(m,{x:0,z:m.size}),0);run.player={...m.spawn,angle:0};step(m,run,neutral,.05);assert.equal(run.player.y,floorHeight(m,run.player));}
}
const simple={...MISSIONS[0],id:300,obstacles:[],cameras:[],sensors:[],routes:[[{x:0,z:2},{x:1,z:2}]],spawn:{x:0,z:0},targets:[],exit:{x:7,z:7}};
for(let i=0;i<WEAPONS.length;i++){const m={...simple,routes:[[{x:0,z:Math.min(1,WEAPONS[i].range/2)},{x:1,z:1}]]},run=createRun(m);run.player.angle=0;step(m,run,{...neutral,weapon:i,shoot:true},.05);assert(run.guards[0].sleep>0);assert.equal(run.ammo,m.ammo-WEAPONS[i].cost);assert.equal(run.meleeHits,WEAPONS[i].melee?1:0);}
for(let item=0;item<4;item++){const run=createRun(simple),before=run.items[item];step(simple,run,{...neutral,item,useItem:true},.05);assert.equal(run.items[item],before-1);if(item===1)assert.equal(run.ammo,simple.ammo+8);if(item===2)assert(run.stealth>0);if(item===3)assert(run.boost>0);}
const m={...simple,requiredShots:0,defend:{x:0,z:0,seconds:1},requireSwitches:true,switches:[{x:0,z:0}],routes:[]},r=createRun(m);assert(!objectivesComplete(m,r));r.switches[0]=true;for(let i=0;i<22;i++)step(m,r,neutral,.05);assert(objectivesComplete(m,r));
console.log('PASS 300 unique stage IDs, five sizes, all objectives reachable, elevation, six weapons, four items and compound extraction goals.');

for(let i=0;i<WEAPONS.length;i++){for(const id of [Math.max(1,WEAPON_UNLOCKS[i]-1),WEAPON_UNLOCKS[i]]){const m={...simple,id},r=createRun(m);step(m,r,{...neutral,weapon:i},.05);assert.equal(r.weapon,id>=WEAPON_UNLOCKS[i]?i:0);}}for(let i=0;i<4;i++){const m={...simple,id:Math.max(1,ITEM_UNLOCKS[i]-1)},r=createRun(m);step(m,r,{...neutral,item:i,useItem:true},.05);if(i>0){assert.equal(r.item,0);assert.equal(r.items[i],0);}}console.log('PASS weapon/item unlock boundaries enforced by simulation.');
