import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['src/components/school-dungeon/dojo.ts'],outfile:'tmp/school-test/dojo.mjs',bundle:true,platform:'node',format:'esm'});
const {DOJO_STAGES,dojoStart,dojoAct}=await import('../tmp/school-test/dojo.mjs');
assert.equal(DOJO_STAGES.length,50);assert.equal(new Set(DOJO_STAGES.map(s=>JSON.stringify([s.map,s.start,s.enemies,s.traps,s.key,s.tool,s.food]))).size,50);
const completions=[];
for(const stage of DOJO_STAGES){let run=dojoStart(stage);const group=Math.floor((stage.id-1)/5);const act=a=>{run=dojoAct(run,a);assert(!run.failed,`stage ${stage.id}: failed at ${run.x},${run.y} turn ${run.turns}, HP ${run.hp}`);};
 const toward=(target,doors=false)=>{for(let n=0;n<45&&(run.x!==target.x||run.y!==target.y);n++){
  const q=[{x:run.x,y:run.y,path:[]}],seen=new Set([`${run.x},${run.y}`]);let path;
  for(let i=0;i<q.length;i++){const p=q[i];if(p.x===target.x&&p.y===target.y){path=p.path;break;}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,t=run.map[y]?.[x],key=`${x},${y}`;if(!t||t==='WALL'||(t==='DOOR'&&!doors)||seen.has(key))continue;seen.add(key);q.push({x,y,path:[...p.path,[dx,dy]]});}}
  assert(path?.length,`stage ${stage.id}: no path`);const [dx,dy]=path[0];if(run.map[run.y+dy][run.x+dx]==='DOOR')act({type:'TOOL'});else act({type:'MOVE',dx,dy});
 }assert.equal(run.x,target.x);assert.equal(run.y,target.y);};
 if([4,5,6,7].includes(group))act({type:'TOOL'});
 if(group===3){const enemy=run.enemies[0];if(Math.abs(enemy.x-run.x)>2)act({type:'MOVE',dx:Math.sign(enemy.x-run.x),dy:0});act({type:'TOOL'});}
 if(group===8){toward(stage.key);toward(stage.goal,true);}
 else if(group===9){for(const [coordinate,value] of [['x',stage.goal.x],['y',stage.goal.y]])while(run[coordinate]!==value){const dx=coordinate==='x'?Math.sign(value-run.x):0,dy=coordinate==='y'?Math.sign(value-run.y):0;if(run.map[run.y+dy][run.x+dx]==='WALL'){act({type:'MOVE',dx,dy});act({type:'TOOL'});}act({type:'MOVE',dx,dy});}}
 else toward(stage.goal);
 assert(run.won,`stage ${stage.id} not won`);assert.deepEqual(dojoAct(run,{type:'WAIT'}),run);completions.push({stage:stage.id,turns:run.turns,hp:run.hp});
}
const water=dojoStart(DOJO_STAGES[25]);assert.equal(water.charges,1);const stored=JSON.stringify(water);dojoAct(water,{type:'TOOL'});assert.equal(JSON.stringify(water),stored,'reducer must not mutate its input');
console.log('PASS: all 50 unique dojo stages have legal winning action sequences, tool mechanics, budgets and immutable states');console.log(JSON.stringify(completions));
let hungry=dojoStart(DOJO_STAGES[35]);for(let i=0;i<9;i++)hungry=dojoAct(hungry,{type:'WAIT'});assert(hungry.failed&&hungry.hp<=0,'food lessons must punish starvation');
let dry=dojoStart(DOJO_STAGES[25]);for(let i=0;i<5;i++)dry=dojoAct(dry,{type:'MOVE',dx:1,dy:0});const blocked=dojoAct(dry,{type:'MOVE',dx:0,dy:1});assert.equal(blocked.y,dry.y);assert.equal(blocked.turns,dry.turns);
let danger=dojoStart(DOJO_STAGES[20]);danger=dojoAct(danger,{type:'MOVE',dx:1,dy:0});danger=dojoAct(danger,{type:'WAIT'});assert(danger.failed,'strong guards require tactical tools');
console.log('PASS: starvation, unprepared water crossing and unsafe combat are real failures');
