import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('tmp/school-test',{recursive:true});
await build({entryPoints:['src/components/school-dungeon/adventure.ts'],outfile:'tmp/school-test/rules.mjs',bundle:true,platform:'node',format:'esm'});
const {newAdventure,newBase,mergeEquipment,equipmentHas,putInContainer,decorateFloor,puzzleLayout,evolveEnemy,goalFloor,ADVENTURE_ITEMS,MODES}=await import('../tmp/school-test/rules.mjs');
const item=(type,extra={})=>({id:type,type,category:'WEAPON',name:type,desc:'',...extra});
const combined=mergeEquipment(item('PENCIL_SWORD',{plus:2}),item('STAINLESS_PEN',{plus:3}));
assert.equal(combined.plus,6);assert(equipmentHas(combined,'STAINLESS_PEN'));assert.equal(combined.markSlots,4);
assert.throws(()=>mergeEquipment(item('PENCIL_SWORD',{marks:['a','b','c','d']}),item('STAINLESS_PEN')),/slots/);
assert.throws(()=>mergeEquipment(item('PENCIL_SWORD',{cursed:true}),item('STAINLESS_PEN')),/seals/);
assert.throws(()=>mergeEquipment(item('PENCIL_SWORD'),item('armor',{category:'ARMOR'})));
const bag={...ADVENTURE_ITEMS.BAG_SAVE,id:'bag'},original=item('PENCIL_SWORD');
const stored=putInContainer(bag,original);assert.equal(bag.contents.length,0);assert.equal(stored.contents.length,1);original.name='Changed';assert.notEqual(stored.contents[0].name,original.name);
assert.throws(()=>putInContainer(stored,{...bag,id:'nested'}));assert.throws(()=>putInContainer({...stored,capacity:1},item('other')));assert.throws(()=>putInContainer(bag,item('unpaid',{shopOwner:1})));
for(const mode of MODES){const state=newAdventure(mode.id);assert.equal(goalFloor(state),mode.id==='RESCUE'?1:mode.floors);}
assert.equal(newBase().bank,0);const evolved=evolveEnemy({name:'Paper',hp:4,maxHp:10,attack:3,defense:0,xp:4});assert.equal(evolved.schoolRank,2);assert.equal(evolved.hp,22);assert.equal(evolved.attack,6);
for(let seed=0;seed<40;seed++){
 const map=Array.from({length:26},(_,y)=>Array.from({length:26},(_,x)=>x&&y&&x<25&&y<25?'FLOOR':'WALL'));map[22][22]='STAIRS';const state=newAdventure();let r=seed+1;const random=()=>((r=(r*1664525+1013904223)>>>0)/2**32);decorateFloor(state,map,2,2,1,new Set(['10,10']),random);
 for(const key of Object.keys(state.terrain)){const [x,y]=key.split(',').map(Number);assert.notEqual(key,'10,10');assert(Math.abs(x-2)+Math.abs(y-2)>=4);assert(Math.max(Math.abs(x-22),Math.abs(y-22))>1);}
 assert.equal(map[22][22],'STAIRS');
 // Blocking water/holes cannot sever the wide-room path to the stairs.
 const todo=[[2,2]],seen=new Set(['2,2']);for(const [x,y] of todo)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;if(map[ny]?.[nx]&&map[ny][nx]!=='WALL'&&!['WATER','HOLE'].includes(state.terrain[k])&&!seen.has(k)){seen.add(k);todo.push([nx,ny]);}}assert(seen.has('22,22'));
}
for(let i=0;i<8;i++){const p=puzzleLayout(26,26,i);assert.equal(p.map[p.goal.y][p.goal.x],'STAIRS');assert.equal(p.map[p.start.y][p.start.x],'FLOOR');assert(p.limit>=5);}
console.log('PASS: emblem inheritance, seals, container capacity/ownership, challenge goals, enemy evolution and 40 safe maps');
const {companionDirection,companionStep}=await import('../tmp/school-test/rules.mjs');
for(const [n,[dx,dy]] of [[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1]].entries())assert.equal(companionDirection(dx,dy),n);
const routeMap=Array.from({length:9},(_,y)=>Array.from({length:9},(_,x)=>x>0&&y>0&&x<8&&y<8?'FLOOR':'WALL'));
routeMap[3][3]='WALL';routeMap[4][3]='WALL';routeMap[5][3]='WALL';
const follower={x:2,y:4};let moves=0;
while(Math.max(Math.abs(follower.x-6),Math.abs(follower.y-4))>1&&moves++<15){const step=companionStep(follower,6,4,routeMap,{},[]);assert(step);assert(routeMap[step.y][step.x]!=='WALL');if(step.x!==follower.x&&step.y!==follower.y){assert(routeMap[follower.y][step.x]!=='WALL');assert(routeMap[step.y][follower.x]!=='WALL');}Object.assign(follower,step);}
assert(moves<15);assert.equal(companionStep({x:5,y:4},6,4,routeMap,{},[]),null);
const narrow=[['WALL','WALL','WALL','WALL','WALL'],['WALL','FLOOR','FLOOR','FLOOR','WALL'],['WALL','WALL','WALL','WALL','WALL']];
assert.equal(companionStep({x:1,y:1},3,1,narrow,{'2,1':'HOLE'},[]),null);
assert.equal(companionStep({x:1,y:1},3,1,narrow,{},[{x:2,y:1}]),null);
console.log('PASS: eight companion directions, safe detours, corner collision, hazards and occupied corridors');
const {equipmentResonance}=await import('../tmp/school-test/rules.mjs');
assert.deepEqual(equipmentResonance({}),{attack:0,defense:0,names:[]});assert.equal(equipmentResonance({weapon:item('NURSE_PENCIL',{marks:['HEAL_SWORD']}),accessory:item('RING_HEAL')}).attack,2);assert.equal(equipmentResonance({weapon:item('DRAGON_RULER',{marks:['DRAGON_KILLER']}),armor:item('FIREFIGHTER')}).defense,3);
console.log('PASS: school equipment resonance and inherited emblems');
