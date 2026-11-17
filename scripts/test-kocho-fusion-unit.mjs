import assert from 'node:assert/strict';import {build} from 'esbuild';
async function bundled(path){const r=await build({entryPoints:[path],bundle:true,format:'esm',platform:'node',write:false});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));}
const f=await bundled('src/mini-games/kocho/fusion.ts'),{kochoSupers}=await bundled('src/mini-games/kocho/superMoves.ts');
const card=(id,extra={})=>({id,name:id,type:'ATTACK',range:[1],damage:2,cooldown:3,currentCooldown:0,description:'description',energyCost:1,maxSlots:3,usedSlots:0,color:'bg-blue-600',...extra});
const a=card('dash',{name:'ダッシュ',type:'MOVE',damage:0,cooldown:5,usedSlots:1}),b=card('strike',{name:'定規スラッシュ',damage:7,cooldown:2,usedSlots:2});
const before=JSON.stringify([a,b]);let c=f.makeKochoFusion('original',[a,b],'f');assert.equal(JSON.stringify([a,b]),before);assert.equal(c.cooldown,5);assert.equal(c.name,'ダッシュ＋定規スラッシュ');assert.deepEqual(c.fusionParts.map(c=>c.usedSlots),[1,2]);assert.equal(c.damage,7);assert.equal(c.energyCost,1);
const reverse=f.makeKochoFusion('original',[b,a],'f');assert.equal(reverse.name,'定規スラッシュ＋ダッシュ');assert.deepEqual(reverse.fusionParts.map(c=>c.id),['strike','dash']);
assert.equal(f.makeKochoFusion('original',[a,a],'f'),null);assert.equal(f.makeKochoFusion('original',[a],'f'),null);assert(f.makeKochoFusion('original',[a,{...b,currentCooldown:1}],'f'));
const four=f.makeKochoFusion('original',[c,card('c'),card('d')],'four');assert.equal(four.fusionParts.length,4);assert.equal(f.makeKochoFusion('original',[four,a],'five'),null);
const upgraded=f.applyFusionDamageUpgrade({...c,damage:c.damage+2},2);assert.equal(upgraded.fusionParts[1].damage,9);assert.equal(upgraded.damage,9);assert.equal(c.fusionParts[1].damage,7);
let recipes=0;for(const hero of ['original','rebel','akari'])for(const m of kochoSupers(hero))for(const x of m.steps[0])for(const y of m.steps[1])for(const z of m.steps[2]){
 const cards=[x,y,z].map((name,i)=>card(String(i),{name,cooldown:i+2}));const c=f.makeKochoFusion(hero,cards,'super');assert.equal(c.fusionSuper.id,m.id);assert.equal(c.fusionSuper.hero,hero);assert.equal(f.fusionSuper(c).name,m.name);assert.equal(c.cooldown,4);assert.equal(c.damage,6+m.damage);assert.equal(f.fusionName(c,'ENGLISH',s=>s),m.englishName);assert.equal(f.fusionName(c,'HIRAGANA',s=>s),m.hiraganaName);const again=f.makeKochoFusion(hero,[{...c,currentCooldown:5},card('x')],'again');assert(again);assert.equal(again.fusionParts.length,4);assert.equal(again.fusionParts[2].fusionFinishers[0].id,m.id);assert.equal(again.fusionParts[2].fusionFinishers[0].hero,hero);assert.equal(again.currentCooldown,0);recipes++;
}
assert.equal(recipes,1422);assert.equal(f.fusionName(c,'ENGLISH',s=>({ダッシュ:'Dash',定規スラッシュ:'Ruler Slash'})[s]??s),'Dash＋Ruler Slash');assert(!f.fusionDescription(c,'ENGLISH',s=>({ダッシュ:'Dash',定規スラッシュ:'Ruler Slash'})[s]??s).includes('ダッシュ'));
console.log('PASS 1,422 ordered super recipes, ordinary/nested fusion, cooldown maximum, upgrades, immutable snapshots, invalid ingredients and three-language names.');

assert.equal(f.KOCHO_FUSION_PRICE,100);
