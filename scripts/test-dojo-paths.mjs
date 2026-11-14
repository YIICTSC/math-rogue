import assert from 'node:assert/strict';import{build}from'esbuild';
const b=await build({entryPoints:['src/components/school-dungeon/dojo.ts'],bundle:true,write:false,format:'esm',platform:'node'});const E=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
const plans=[];
for(const stage of E.DOJO_STAGES){
 const start=E.dojoStart(stage),required=E.dojoRequired(stage.id);
 const signature=r=>JSON.stringify([r.x,r.y,r.dir,r.hp,r.food,r.charges,r.tool,r.key,r.revealed,r.map,r.enemies,r.traps,r.pouch,!!r.used?.includes(required)]);
 const queue=[{r:start,path:[]}],visited=new Map([[signature(start),0]]);let answer=null;
 for(let cursor=0;cursor<queue.length&&cursor<150000;cursor++){
  const {r,path}=queue[cursor];if(r.won){answer=path;break;}
  const actions=[...[[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]].map(([dx,dy])=>({type:'MOVE',dx,dy})),...[[0,-1],[0,1],[-1,0],[1,0]].map(([dx,dy])=>({type:'FACE',dx,dy})),{type:'WAIT'},{type:'ATTACK'},{type:'TOOL'},{type:'COLLECT'},{type:'PLACE'}];
  for(const action of actions){const next=E.dojoAct(r,action);if(next.failed)continue;const key=signature(next),old=visited.get(key);if(old!==undefined&&old<=next.turns)continue;visited.set(key,next.turns);queue.push({r:next,path:[...path,action]});}
 }
 assert(answer,'Lesson '+stage.id+' must have a legal solution; searched '+queue.length);let replay=start;for(const a of answer)replay=E.dojoAct(replay,a);assert(replay.won);assert(replay.used.includes(required));plans.push({id:stage.id,actions:answer});console.log('PASS dojo',stage.id,'turns',replay.turns,'/',stage.limit,'nodes',visited.size);
}
await (await import('node:fs/promises')).mkdir('tmp',{recursive:true});
await (await import('node:fs/promises')).writeFile('tmp/dojo-solutions.json',JSON.stringify(plans));
