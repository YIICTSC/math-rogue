import {WIDTH} from './engine';
import type {World,Site} from './engine';
import {BIOMES} from './biomes';
/** Idempotent save migration. Already peaceful worlds retain their achievements. */
export function migrateCampaign(w:World){
 if(w.campaignVersion===2)return w;
 if(!w.won){
  const old=w.sites.filter(s=>s.kind==='guardian'),order=['forest','wetland','ruins'];
  for(const biome of BIOMES){
   const index=order.indexOf(biome.id),site=index>=0?old[index]:undefined;
   const x=biome.x-6,y=biome.y-5;
   const trial:Site=site||{id:`trial-${biome.id}`,x,y,kind:'guardian',name:'',hp:150,maxHp:150,cleared:false};
   Object.assign(trial,{x,y,name:`${biome.name}の試験官`});if(!site)w.sites.push(trial);
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)w.tiles[(y+dy)*WIDTH+x+dx]='grass';
   for(let px=x;px<=biome.x;px++)w.tiles[y*WIDTH+px]='road';
   for(let py=y;py<=biome.y;py++)w.tiles[py*WIDTH+biome.x]='road';
  }
  const boss=w.sites.find(s=>s.kind==='boss');if(boss)boss.name='魔王城';
 }else if(w.city){w.endingProgress=Object.fromEntries(Object.keys(w.players).map(id=>[id,6]));}
 w.campaignVersion=2;w.revision++;return w;
}
