import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createServer} from 'vite';

const server=await createServer({configFile:false,logLevel:'error',optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,watch:null,hmr:false}});
try{
 const {HEROES}=await server.ssrLoadModule('/src/mini-games/lantern-war/roster.ts');
 const V=await server.ssrLoadModule('/src/mini-games/lantern-war/vacationArt.ts');
 const {battleSource,BATTLE_ACTIONS}=await server.ssrLoadModule('/src/mini-games/lantern-war/battleSources.ts');
 const {artFacing,mirrorArt}=await server.ssrLoadModule('/src/mini-games/lantern-war/artFacing.ts');
 const inspected=new Set();
 for(const hero of HEROES){
  for(const action of BATTLE_ACTIONS)for(let frame=0;frame<4;frame++){
   const spec=battleSource(hero.id,action,frame,true),m=V.vacationMetric(hero.id,action,frame);
   assert(m&&m.bounds.w>0&&m.bounds.h>0,hero.id+' '+action);
   assert(m.bounds.x>=0&&m.bounds.y>=0&&m.bounds.x+m.bounds.w<=m.w&&m.bounds.y+m.bounds.h<=m.h);
   for(const target of ['left','right'])assert.equal(mirrorArt(hero.id,action,frame,target,true),artFacing(hero.id,action,frame,true)!==target);
   if(!inspected.has(spec.path)){const meta=await sharp('public/'+spec.path).metadata();assert(meta.hasAlpha);assert.equal(meta.width,m.w*spec.cols);assert.equal(meta.height,m.h*spec.rows);inspected.add(spec.path);}
   if(V.GENERATED_VACATION_HEROES.includes(hero.id)){
    assert(m.bounds.x>=60&&m.bounds.y>=60,'padded frame: '+hero.id+' '+action);
    assert(m.w-m.bounds.x-m.bounds.w>=60&&m.h-m.bounds.y-m.bounds.h>=60);
    assert.equal(spec.index,BATTLE_ACTIONS.indexOf(action));
   }
  }
  const portrait=V.vacationPortraitSource(hero.id);if(portrait)assert((await fs.stat('public/'+portrait.path)).size>1000);
  if(V.GENERATED_VACATION_HEROES.includes(hero.id))assert.notEqual(battleSource(hero.id,'ready').path,battleSource(hero.id,'ready',0,true).path,'main campaign clothing is preserved');
 }
 assert.equal(new Set(V.VACATION_DIALOGUE_HEROES).size,44);
 const sources=JSON.parse(await fs.readFile('assets/lantern-war/vacation-individual-portraits.json','utf8'));
 assert.equal(Object.keys(sources).length,44,'all protagonists have dedicated four-expression vacation portraits');
 for(const id of V.VACATION_DIALOGUE_HEROES){
  const {data,info}=await sharp('public/sprites/lantern-war/vacation/dialogue-'+id+'.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,1792);assert.equal(info.height,704);
  for(let frame=0;frame<4;frame++){let top=704,bottom=0,left=448,right=0;
   for(let y=0;y<704;y++)for(let x=0;x<448;x++)if(data[(y*info.width+frame*448+x)*4+3]>80){top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);}
   assert(top>=28&&top<=75,id+' '+frame+' head height matches protagonist: '+top);assert(bottom>=580&&bottom<=595,id+' upper-thigh baseline');
   assert(left>=12&&right<=435,id+' portrait stays within its own expression cell');
  }
 }
 assert.equal(artFacing('high-school-gardener','attack',2,true),'left');assert.equal(artFacing('high-school-gardener','attack',1,true),'right');
 assert.equal(artFacing('end-vesper','dialogue',0,true),'left');
 console.log(`PASS ${HEROES.length} vacation heroes × 6 actions × 4 frames; ${inspected.size} transparent resources; portrait anchors, gutters, clothing isolation and mixed facing.`);
}finally{await server.close();}
