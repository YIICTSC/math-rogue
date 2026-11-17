import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({stdin:{contents:"export * from './src/mini-games/after-school-rush/catalog';export * from './src/mini-games/after-school-rush/action/physics';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});
const E=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const {S}=E;
let cases=0;
for(const entry of E.CATALOG.filter(e=>['duel','parry'].includes(e.game.action.family)))for(const tier of [0,2,4])for(const aspect of [.55,1.67,2.8])for(const facing of [-1,1]){
 const spec={...entry.game.action,tier},t=spec.family==='parry'?600:100;
 const base=[...E.initialAction(spec,22,tier)];base[S.T]=t;base[S.COMBAT_ASPECT]=aspect;base[S.FACING]=facing;
 const enemy=E.actionWorld(spec,base).enemy,reach=E.meleeReach(base);
 base[S.X]=enemy.x-facing*(reach-5);base[S.Y]=enemy.y;
 const press=(s,button)=>E.actionInput(spec,s,{kind:'button',button},{now:t,before:t,dt:0});
 if(spec.family==='duel'){
  const hit=press(base,'a');assert.equal(hit[S.SCORE],1,'A hits before entering the enemy artwork');assert.equal(hit[S.CONTACT_KIND],1);assert.equal(hit[S.CONTACT_AT],t);assert.equal(hit[S.CONTACT_DIRECTION],facing);
  assert((enemy.x-hit[S.CONTACT_X])*facing>0,'Impact is on the near surface');
  assert.equal(press(hit,'a')[S.SCORE],1,'Same press cannot score twice');
  const closed=E.actionInput({...spec,boss:true},base,{kind:'button',button:'a'},{now:600,before:600,dt:0});assert.equal(closed[S.SCORE],0,'Boss opening still matters');
 }else{
  const blocked=press(base,'b');assert(blocked[S.COMBO]>t,'Parry works from the visible enemy edge');assert.equal(blocked[S.CONTACT_KIND],2);
  const counter=press(blocked,'a');assert.equal(counter[S.SCORE],1);assert.equal(counter[S.CONTACT_KIND],1);
  assert.equal(press(base,'a')[S.SCORE],0,'Counter requires a successful parry');
  const early=E.actionInput(spec,base,{kind:'button',button:'b'},{now:100,before:100,dt:0});assert.equal(early[S.COMBO],0,'Early parry still fails');
 }
 for(const [index,value]of[[S.X,enemy.x-facing*(reach+10)],[S.Y,enemy.y-150],[S.FACING,-facing]]){
  const miss=[...base];miss[index]=value;
  const result=press(miss,spec.family==='duel'?'a':'b');assert.equal(result[S.CONTACT_AT],-9999,'Distant, airborne and backwards attacks miss');assert.equal(result[S.SCORE],0);assert.equal(result[S.COMBO],0);
 }
 assert.deepEqual(base.slice(S.CONTACT_X,S.CONTACT_DIRECTION+1),[0,0,0,-9999,0],'Input state stays immutable');cases++;
}
const parry=E.CATALOG.find(e=>e.game.action.family==='parry');assert.equal(E.initialAction({...parry.game.action,variant:1},1,0)[S.FACING],1,'Parry starts facing its opponent');
console.log(`PASS ${cases} melee cases: all duel/parry games, tiers, portrait/landscape, both directions, edge contact, cooldown, boss windows and misses`);
