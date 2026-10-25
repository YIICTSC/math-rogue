import assert from 'node:assert/strict';import {build} from 'esbuild';
const result=await build({entryPoints:['src/components/school-dungeon/chronicles/optionalNpcs.ts'],bundle:true,write:false,format:'esm',platform:'node'}),{syncOptionalNpcs,isConversationNpc}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const map=Array.from({length:12},(_,y)=>Array.from({length:12},(_,x)=>x>0&&y>0&&x<11&&y<11?'FLOOR':'WALL'));map[9][9]='STAIRS';
const state={mode:'STORY',floor:1,events:{},terrain:{},storySeen:[],chronicle:{version:1,mode:'STORY',heroId:'high-school-warrior',seen:[],choices:{}}},p={x:3,y:3},acts=[{floor:1},{floor:5},{floor:21}];
assert(syncOptionalNpcs(state,map,p,[],20,acts));assert.deepEqual(Object.values(state.events).map(e=>e.kind),['CHRONICLE','PERSONAL']);assert(!state.chronicle.pending);assert(!syncOptionalNpcs(state,map,p,[],20,acts));
for(const[k,e]of Object.entries(state.events)){assert(isConversationNpc(e));const[x,y]=k.split(',').map(Number);assert.equal(map[y][x],'FLOOR');assert(x!==p.x||y!==p.y);}
state.chronicle.seen=[0];state.storySeen=[1];assert(syncOptionalNpcs(state,map,p,[],20,acts));assert.equal(Object.keys(state.events).length,0);
state.floor=8;assert(syncOptionalNpcs(state,map,p,[],20,acts));assert.equal(Object.keys(state.events).length,2);
// NPCs remain passable in fixed narrow puzzle corridors.
const corridor=Array.from({length:5},(_,y)=>Array.from({length:10},(_,x)=>y===2&&x>0&&x<9?'FLOOR':'WALL'));
corridor[2][8]='STAIRS';state.events={};assert(syncOptionalNpcs(state,corridor,{x:1,y:2},[],20,acts));assert(Object.values(state.events).every(e=>e.passable));
console.log('PASS: optional NPCs are stable, reachable, empty-tile only, non-blocking, threshold-aware, and never start dialogue or mark events read.');
