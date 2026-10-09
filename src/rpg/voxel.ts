import {landscapeGate} from './landscapeMap';
import {WORLD_SCALE,legacyRegion,landscapeRegion,landscapeHeight,landscapeBlock,waterProfile,STRUCTURES,LANDMARKS,mountainHeight} from './worldLandscape';
import {WIDTH,HEIGHT,type World,type Adventurer} from './engine';
import {natureAt,lifePlayer,lifeWalkable,type Material} from './life';
import {energyOf} from './energy';
import {occupiedFarmTile,farmBusy} from './farm/model';
import {occupiedCityTile} from './city/model';
import {BIOMES,biomeWeights,biomeAt} from './biomes';
import {CATALOG_BLOCKS,VOXEL_CATALOG,BLOCK_DROPS,shapeOf,TOOL_RANK,type CatalogBlock} from './voxelCatalog';
import {applyWorkshop,activeTools,type WorkshopAction,type VoxelContainer} from './voxelWorkshop';
export const BLOCKS=CATALOG_BLOCKS;
export type Block=typeof BLOCKS[number];
export const VOXEL_COLORS:Record<TerrainBlock,string>={...Object.fromEntries(BLOCKS.map(b=>[b,VOXEL_CATALOG[b].color])) as Record<Block,string>,'door-top':'#b38958',bedrock:'#424954','oasis-water':'#3de1cf'};
export type TerrainBlock=Block|'bedrock'|'oasis-water'|'door-top';
export const MIN_DEPTH=-18,MAX_HEIGHT=WORLD_SCALE.ceiling,EYE_HEIGHT=WORLD_SCALE.eyeHeight;
export interface VoxelWorld {edits:Record<string,Block|null>;revision:number;terrainVersion?:2;legacyFlat?:string[];rotations?:Record<string,number>;containers?:Record<string,VoxelContainer>}
export type VoxelAction=WorkshopAction|{type:'voxel-landmark'}|{type:'voxel-move';dx:number;dy:number}|{type:'voxel-snap'}|{type:'voxel-jump'}|{type:'voxel-dive'}|{type:'voxel-break'|'voxel-place';x:number;y:number;z:number;block?:Block;rotation?:number};
export const voxelKey=(x:number,y:number,z:number)=>`${x},${y},${z}`;
export function voxelWater(w:World,x:number,z:number){
 if(!legacyRegion(x,z))return waterProfile(x,z);
 x=Math.floor(x);z=Math.floor(z);if(w.tiles[z*WIDTH+x]!=='water')return null;
 let depth=6;for(let r=1;r<=6;r++)if([[x-r,z],[x+r,z],[x,z-r],[x,z+r]].some(([tx,tz])=>!legacyRegion(tx,tz)||w.tiles[tz*WIDTH+tx]!=='water')){depth=r;break;}
 return {surface:0,depth,flowX:.15,flowZ:.3,kind:'river' as const};
}
/** Grid traversal ray uses the authoritative blocks, including unloaded chunks. */
export function traceVoxel(w:World,origin:{x:number;y:number;z:number},direction:{x:number;y:number;z:number},reach=4.5){
 let x=Math.floor(origin.x),y=Math.floor(origin.y),z=Math.floor(origin.z);const axes=['x','y','z'] as const;
 const step={x:Math.sign(direction.x),y:Math.sign(direction.y),z:Math.sign(direction.z)};
 const delta={x:Math.abs(1/direction.x),y:Math.abs(1/direction.y),z:Math.abs(1/direction.z)};
 const next={x:direction.x?((direction.x>0?x+1:x)-origin.x)/direction.x:Infinity,y:direction.y?((direction.y>0?y+1:y)-origin.y)/direction.y:Infinity,z:direction.z?((direction.z>0?z+1:z)-origin.z)/direction.z:Infinity};
 for(let i=0;i<64;i++){const axis=axes.reduce((a,b)=>next[a]<next[b]?a:b);const distance=next[axis];if(distance>reach)return null;next[axis]+=delta[axis];if(axis==='x')x+=step.x;if(axis==='y')y+=step.y;if(axis==='z')z+=step.z;const block=blockAt(w,x,y,z);if(block){const normal={x:0,y:0,z:0};normal[axis]=-step[axis];return {x,y,z,block,normal,distance};}}
 return null;
}
export function protectedVoxel(w:World,x:number,z:number){if(!legacyRegion(x,z))return !landscapeRegion(x,z)||STRUCTURES.some(l=>Math.abs(x-l.x)<l.width/2+1&&Math.abs(z-l.z)<l.depth/2+1);return x<1||z<1||x>=WIDTH-1||z>=HEIGHT-1||occupiedFarmTile(w,z*WIDTH+x)||occupiedCityTile(w,z*WIDTH+x)||w.sites.some(s=>Math.abs(s.x-x)+Math.abs(s.y-z)<=1)||w.life.houses.some(h=>Math.abs(h.x-x)+Math.abs(h.y-z)<=1);}
const heightCache=new Map<number,Int8Array>();
const finalHeightCache=new WeakMap<World,{revision:number;heights:Int8Array}>();
export function terrainHeight(w:World,x:number,z:number){
 if(!legacyRegion(x,z))return landscapeRegion(x,z)?landscapeHeight(w.seed,x,z):0;
 let cache=finalHeightCache.get(w);if(!cache||cache.revision!==w.revision){cache={revision:w.revision,heights:new Int8Array(WIDTH*HEIGHT).fill(-128)};finalHeightCache.set(w,cache);}const cell=z*WIDTH+x;if(cache.heights[cell]!==-128)return cache.heights[cell];
 const save=(h:number)=>(cache!.heights[cell]=h);
 if((protectedVoxel(w,x,z)&&!occupiedFarmTile(w,z*WIDTH+x))||w.tiles[z*WIDTH+x]==='road'||w.tiles[z*WIDTH+x]==='water'||w.voxels?.legacyFlat?.includes(`${x},${z}`))return save(0);
 // Existing flat-world constructions remain at their original height on upgrade.
 if(w.voxels&&!w.voxels.terrainVersion&&Object.keys(w.voxels.edits).some(k=>k.startsWith(`${x},`)&&k.endsWith(`,${z}`)))return save(0);
 let heights=heightCache.get(w.seed);if(!heights){if(heightCache.size>8)heightCache.clear();heights=new Int8Array(WIDTH*HEIGHT).fill(-1);heightCache.set(w.seed,heights);}const tile=z*WIDTH+x;
 if(heights[tile]<0){const phase=(w.seed%997)/97,wave=(Math.sin(x*.115+phase)+Math.cos(z*.13-phase)+Math.sin((x+z)*.075+phase)) / 6+.5;const amp=biomeWeights(x,z).reduce((sum,weight,i)=>sum+weight*[4,6,3,7,9,6][i],0);heights[tile]=Math.max(0,Math.floor((wave-.18)*amp));}
 let h=heights[tile];
 for(const s of [...w.sites,...w.life.houses])h=Math.min(h,Math.max(0,Math.abs(s.x-x)+Math.abs(s.y-z)-2));
 for(let d=1;d<=5&&h>0;d++)if([[x-d,z],[x+d,z],[x,z-d],[x,z+d]].some(([tx,tz])=>w.tiles[tz*WIDTH+tx]==='road'))h=Math.min(h,d-1);
 return save(h);
}
const oasisCache=new Map<number,{id:string;x:number;z:number;depth:number}[]>();
const trunkFor=(node:{sprite:number;material:string}):Block=>node.material==='frostwood'?'frostwood':node.sprite===1?'birchwood':node.sprite===2?'darkwood':node.sprite===7?'acaciawood':'wood';
export function oasisCenters(w:World){let centers=oasisCache.get(w.seed);if(!centers){if(oasisCache.size>8)oasisCache.clear();centers=BIOMES.map((b,i)=>({id:`oasis-${i}`,x:b.x+9+(w.seed%5),z:b.y-7,depth:-7-(i%3)*2}));oasisCache.set(w.seed,centers);}return centers;}
export function undergroundOasis(w:World,x:number,y:number,z:number){return oasisCenters(w).find(c=>((x+.5-c.x)/5.5)**2+((z+.5-c.z)/5.5)**2+((y+.5-c.depth)/2.8)**2<1);}
/** Natural vegetation uses the same editable cells as player-built blocks. */
export function vegetationCells(w:World,x:number,z:number):{x:number;y:number;z:number;block:Block}[]{
 if(!legacyRegion(x,z))return [];
 const node=natureAt(w,z*WIDTH+x);if(!node||w.life.nodes[z*WIDTH+x]?.regrowAt||protectedVoxel(w,x,z))return [];
 const h=terrainHeight(w,x,z),cell=(dx:number,dy:number,dz:number,block:Block)=>({x:x+dx,y:h+dy,z:z+dz,block});
 if(node.rock)return [cell(0,0,0,node.material as Block)];
 if(node.sprite===3)return [cell(0,0,0,'herb')];
 if(node.sprite===5){const stem:Block=(x+z)%3===0?'bamboo':'reed';return [cell(0,0,0,stem),cell(0,1,0,stem)];}
 if(node.sprite===6)return [cell(0,0,0,'cactus'),cell(0,1,0,'cactus')];
 if(node.sprite===16)return [cell(0,0,0,'bush')];
 const trunk:Block=trunkFor(node);
 if(node.sprite===7)return [cell(0,0,0,trunk),cell(0,1,0,trunk)];
 const leaf:Block=[9,10].includes(node.sprite)?'frostleaves':'leaves';
 return [cell(0,0,0,trunk),cell(0,1,0,trunk),...[[0,0],[-1,0],[1,0],[0,-1],[0,1]].map(([dx,dz])=>cell(dx,2,dz,leaf)),cell(0,3,0,node.sprite===17?'fruit':leaf)].filter(c=>!protectedVoxel(w,c.x,c.z)&&w.tiles[c.z*WIDTH+c.x]!=='water');
}
function vegetationAt(w:World,x:number,y:number,z:number):Block|null{
 for(const [dx,dz] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]){
  const tx=x+dx,tz=z+dz;if(tx<1||tz<1||tx>=WIDTH-1||tz>=HEIGHT-1)continue;
  const level=y-terrainHeight(w,tx,tz);if(level<0||level>3)continue;
  const node=natureAt(w,tz*WIDTH+tx);if(!node||w.life.nodes[tz*WIDTH+tx]?.regrowAt||protectedVoxel(w,tx,tz))continue;
  const own=dx===0&&dz===0,tree=!node.rock&&![3,5,6,7,16].includes(node.sprite),leaf:Block=[9,10].includes(node.sprite)?'frostleaves':'leaves';
  if(!own){if(tree&&level===2)return leaf;continue;}
  if(node.rock){if(level===0)return node.material as Block;continue;}
  if(node.sprite===3){if(level===0)return 'herb';continue;}
  if(node.sprite===5){if(level<=1)return (tx+tz)%3===0?'bamboo':'reed';continue;}
  if(node.sprite===6){if(level<=1)return 'cactus';continue;}
  if(node.sprite===16){if(level===0)return 'bush';continue;}
  if(level<2)return trunkFor(node);
  if(tree)return level===3&&node.sprite===17?'fruit':leaf;
 }
 return null;
}
export function blockAt(w:World,x:number,y:number,z:number):TerrainBlock|null {
 if(y>MAX_HEIGHT)return null;
 if(!legacyRegion(x,z)){if(!landscapeRegion(x,z))return null;const key=voxelKey(x,y,z);if(w.voxels&&Object.hasOwn(w.voxels.edits,key))return w.voxels.edits[key];if(w.voxels?.edits[voxelKey(x,y-1,z)]==='door')return 'door-top';return y<=MIN_DEPTH?'bedrock':landscapeBlock(w.seed,x,y,z);}
 const key=voxelKey(x,y,z);if(w.voxels&&Object.hasOwn(w.voxels.edits,key))return w.voxels.edits[key];
 if(w.voxels?.edits[voxelKey(x,y-1,z)]==='door')return 'door-top';
 if(y<=MIN_DEPTH)return 'bedrock';const h=terrainHeight(w,x,z),protectedCell=protectedVoxel(w,x,z);
 if(y<h){
  if(w.tiles[z*WIDTH+x]==='water'){const bed=-(voxelWater(w,x,z)?.depth||1);return y<bed?(y===bed-1?'gravel':'stone'):null;}
  if(!protectedCell){const oasis=undergroundOasis(w,x,y,z);if(oasis){const radius=Math.hypot(x-oasis.x,z-oasis.z);if(y<=oasis.depth-2)return radius<4?'sand':'stone';return y===oasis.depth-1&&radius<3?'oasis-water':null;}
   // Winding caverns join the six oases without a second terrain simulation.
   if(y<=-4&&y>=-13&&Math.abs(Math.sin(x*.23+w.seed)+Math.cos(z*.21))<.24&&Math.abs(y-(-8+Math.round(Math.sin((x+z)*.09)*2)))<=1)return null;
  }
  if(y===h-1)return biomeAt(x,z).id==='snow'?'snow':biomeAt(x,z).id==='desert'?'sand':'dirt';
  if(y>=h-3)return 'dirt';
  const hash=(Math.imul(x+1,374761393)^Math.imul(z+1,668265263)^Math.imul(y+31,1274126177)^w.seed)>>>0;
  if(y<=-7&&hash%23<3)return 'steel';if(y<=-4&&hash%19<2)return 'crystal';if(hash%17<2)return 'ore';
  if(y<=-10&&hash%61<2)return 'diamond_ore';if(y<=-6&&hash%43<2)return 'gold_ore';if(y<=-5&&hash%37<2)return 'lapis_ore';if(hash%29<2)return 'copper_ore';if(hash%13<2)return 'coal_ore';if(hash%47===0)return 'quartz_ore';
  if(hash%31===0)return 'clay';if(hash%23===0)return 'gravel';if(y<=-14)return hash%3?'deepslate':'obsidian';
  return (['stone','stone','stone','granite','diorite','andesite','basalt'] as const)[Math.floor(x/5+z/5)%7];
 }
 if(protectedCell||landscapeGate(x,z)||w.tiles[z*WIDTH+x]==='water')return null;
 return vegetationAt(w,x,y,z);
}
export const solid=(b:TerrainBlock|null)=>!!b&&b!=='oasis-water'&&b!=='door'&&b!=='door-top';
const blockTop=(b:TerrainBlock)=>shapeOf(b)==='slab'?.5:1;
export function bodyClear(w:World,x:number,z:number,feet:number,top=feet+WORLD_SCALE.playerHeight){
 for(let y=Math.floor(feet);y<Math.ceil(top);y++){const b=blockAt(w,x,y,z);if(b&&solid(b)&&y+blockTop(b)>feet+.001&&y<top-.001)return false;}return true;
}
export function floorAt(w:World,x:number,z:number,maxTop:number):number|null {
 if(!legacyRegion(x,z)&&!landscapeRegion(x,z))return null;
 for(let y=Math.min(MAX_HEIGHT,Math.ceil(maxTop)-1);y>=MIN_DEPTH;y--){const b=blockAt(w,x,y,z);if(b&&solid(b)){const top=y+blockTop(b);if(top<=maxTop+.001&&bodyClear(w,x,z,top))return top;}}
 return null;
}
export function playerHeight(w:World,p:Adventurer){return p.position3D?.y??floorAt(w,p.x,p.y,terrainHeight(w,p.x,p.y)+1)??0;}
export function miningCost(block:TerrainBlock,p:Adventurer){const def=VOXEL_CATALOG[block as CatalogBlock],tool=['dirt','sand','snow','clay','gravel'].includes(block)?'shovel':def?.group==='wood'||['workbench','chest','composter'].includes(block)?'axe':'pickaxe';const rank=TOOL_RANK.indexOf(activeTools(p)[tool]!);const base=({stone:.3,brick:.2,ore:.6,crystal:.8,steel:1.2,obsidian:1.5,diamond_ore:1,bedrock:Infinity,'oasis-water':Infinity} as Partial<Record<TerrainBlock,number>>)[block]??(block.endsWith('_ore')?.6:def?.group==='stone'?.3:.1);return Math.max(rank>=0&&tool!=='pickaxe'?.02:.1,Math.round(base*([1,.75,.5,.3,.18][rank+1])*100)/100);}
export function voxelWalkable(w:World,x:number,z:number,maxTop=terrainHeight(w,Math.floor(x),Math.floor(z))+1){return floorAt(w,Math.floor(x),Math.floor(z),maxTop)!==null;}
function upgrade(w:World){const v=w.voxels??={edits:{},revision:0,terrainVersion:2};if(!v.terrainVersion){v.legacyFlat=[...new Set(Object.keys(v.edits).map(k=>{const [x,,z]=k.split(',');return `${x},${z}`;}))];v.terrainVersion=2;}return v;}
export function applyVoxel(w:World,p:Adventurer,a:VoxelAction,now:number){
 if(a.type==='voxel-craft'||a.type==='voxel-storage'||a.type==='voxel-compost'||a.type==='voxel-seeds')return applyWorkshop(w,p,a,now);
 const tell=(text:string)=>{p.message=text;w.revision++;return true;};
 if(a.type==='voxel-snap'){
  if(p.position3D&&!legacyRegion(p.position3D.x,p.position3D.z)){
   const pos=p.position3D,x=Math.floor(pos.x),z=Math.floor(pos.z);
   const water=voxelWater(w,x,z);if(water&&bodyClear(w,x,z,water.surface-1.3)){pos.y=water.surface-1.3;pos.surface2D=true;pos.swimming=false;delete pos.vy;w.revision++;return true;}
   const floor=floorAt(w,x,z,(pos.y??0)+.01);
   if(floor!==null&&Math.abs(floor-(pos.y??0))<.1){pos.surface2D=true;delete pos.vy;w.revision++;return true;}
   // Surface projection is safe and does not discard the exterior X/Z coordinates.
   for(let r=0;r<=12;r++)for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;const nx=x+dx,nz=z+dz,top=floorAt(w,nx,nz,terrainHeight(w,nx,nz)+1);if(top!==null&&!voxelWater(w,nx,nz)){p.position3D={x:nx+.5,z:nz+.5,y:top,surface2D:true};w.revision++;return true;}}
   pos.surface2D=true;delete pos.vy;w.revision++;return true;
  }
  // Underground coordinates never leak into the 2D tile simulation.
  if(!lifeWalkable(w,p.x,p.y)){let target:{x:number;y:number}|undefined;for(let r=1;r<=WIDTH+HEIGHT&&!target;r++)for(let dx=-r;dx<=r&&!target;dx++){const dz=r-Math.abs(dx);for(const sign of [-1,1])if(lifeWalkable(w,p.x+dx,p.y+dz*sign)){target={x:p.x+dx,y:p.y+dz*sign};break;}}if(target){p.x=target.x;p.y=target.y;}}
  delete p.position3D;w.revision++;return true;
 }
 upgrade(w);
 if(a.type==='voxel-landmark'){
  const pos=p.position3D;if(!pos)return false;
  const l=LANDMARKS.find(l=>Math.abs(pos.x-l.x)<l.width/2+4&&Math.abs(pos.z-l.z)<l.depth/2+6&&Math.abs((pos.y??0)-(l.kind==='tower'?Math.floor(mountainHeight(l.x,l.z)):0))<8);
  if(!l)return tell('道をたどって施設を探しましょう。コンパスで目的地を選べます。');
  const id='landmark-'+l.id,discoveries=p.voxelDiscoveries??=[];
  if(discoveries.includes(id))return tell('この施設は探索済みです。建物の中や上階も歩いて調べられます。');
  discoveries.push(id);const lp=lifePlayer(p);lp.bag.crystal=(lp.bag.crystal||0)+1;
  if(LANDMARKS.every(l=>discoveries.includes('landmark-'+l.id))){lp.bag.steel=(lp.bag.steel||0)+5;return tell('5つの施設の探索を達成！ 魔晶石と鋼材5個を獲得しました。');}
  return tell('新しい施設を発見！ 魔晶石を1個獲得しました。');
 }
 if(a.type==='voxel-jump'||a.type==='voxel-dive'){
  const pos=p.position3D;if(!pos)return false;
  const water=voxelWater(w,pos.x,pos.z);
  if(water&&(pos.y??0)<water.surface){const y=Math.max(water.surface-water.depth,Math.min(water.surface-.25,(pos.y??0)+(a.type==='voxel-dive'?-.5:.5)));if(bodyClear(w,Math.floor(pos.x),Math.floor(pos.z),y)){pos.y=y;pos.swimming=true;w.revision++;return true;}return false;}
  if(a.type==='voxel-dive'||pos.vy||now-(p.voxelAt||0)<400)return false;
  const floor=floorAt(w,Math.floor(pos.x),Math.floor(pos.z),(pos.y??0)+.05);if(floor===null||Math.abs(floor-(pos.y??0))>.1)return false;
  pos.vy=WORLD_SCALE.jumpSpeed;p.voxelAt=now;w.revision++;return true;
 }
 if(a.type==='voxel-move'){
  if(farmBusy(w,p))return false;
  if(!Number.isFinite(a.dx)||!Number.isFinite(a.dy)||Math.hypot(a.dx,a.dy)>.45||now-p.lastMove<45)return false;
  let {x,z}=p.position3D??{x:p.x+.5,z:p.y+.5},feet=playerHeight(w,p);
  const water=voxelWater(w,x,z);
  const dt=Math.min(.1,Math.max(0,(now-p.lastMove)/1000)),speed=water?WORLD_SCALE.swimSpeed:WORLD_SCALE.walkSpeed;
  const travel=Math.min(.4,dt*speed),length=Math.hypot(a.dx,a.dy);
  let vy=p.position3D?.vy||0;
  if(!length&&!vy)return false;
  if(vy){const next=feet+vy*dt;vy-=WORLD_SCALE.gravity*dt;
   if(next>feet){if(bodyClear(w,Math.floor(x),Math.floor(z),feet,next+WORLD_SCALE.playerHeight))feet=next;else vy=-.1;}
   else {const ground=floorAt(w,Math.floor(x),Math.floor(z),feet+.01);if(ground!==null&&next<=ground){feet=ground;vy=0;}else feet=next;}
  }
  const dx=a.dx*Math.min(1,travel/(length||1)),dz=a.dy*Math.min(1,travel/(length||1));
  const step=(nx:number,nz:number)=>{if(!legacyRegion(nx,nz)&&!landscapeRegion(nx,nz))return false;const r=WORLD_SCALE.radius;const corners=[[-r,-r],[-r,r],[r,-r],[r,r]].map(([ox,oz])=>({x:Math.floor(nx+ox),z:Math.floor(nz+oz)}));const heights=corners.map(c=>floorAt(w,c.x,c.z,feet+1));if(heights.some(h=>h===null))return false;let next=Math.max(...heights as number[]);const pool=voxelWater(w,nx,nz);if(pool&&next<pool.surface){next=Math.max(next,p.position3D?.swimming?Math.min(feet,pool.surface-.25):pool.surface-1.3);}else if(vy)next=Math.max(next,feet);if(corners.some(c=>!bodyClear(w,c.x,c.z,next)))return false;if(next<feet&&corners.some(c=>!bodyClear(w,c.x,c.z,next,feet+WORLD_SCALE.playerHeight)))return false;x=nx;z=nz;feet=next;return true;};
  if(dx)step(x+dx,z);if(dz)step(x,z+dz);p.position3D={x,z,y:feet,oxygen:p.position3D?.oxygen,waterAt:p.position3D?.waterAt,...(vy?{vy}:{}),...(water?{swimming:!!p.position3D?.swimming}:{})};if(legacyRegion(x,z)){p.x=Math.max(1,Math.min(WIDTH-2,Math.floor(x)));p.y=Math.max(1,Math.min(HEIGHT-2,Math.floor(z)));}p.lastMove=now;p.moveCount++;w.revision++;
  const oasis=legacyRegion(x,z)?undergroundOasis(w,p.x,feet,p.y):undefined;if(oasis&&!p.voxelDiscoveries?.includes(oasis.id)){(p.voxelDiscoveries??=[]).push(oasis.id);p.message='地下のオアシスを発見しました！';}
  return true;
 }
 let {x,y,z}=a;if(a.type==='voxel-break'&&blockAt(w,x,y,z)==='door-top')y--;if(![x,y,z].every(Number.isInteger)||y<=MIN_DEPTH||y>MAX_HEIGHT||protectedVoxel(w,x,z)||now-(p.voxelAt||0)<220)return false;
 const pos=p.position3D??{x:p.x+.5,z:p.y+.5};if(Math.hypot(x+.5-pos.x,y+.5-(playerHeight(w,p)+EYE_HEIGHT),z+.5-pos.z)>4.5)return false;
 const lp=lifePlayer(p),existing=blockAt(w,x,y,z),state=upgrade(w);const cost=a.type==='voxel-break'&&existing?miningCost(existing,p):.1;
 if(Object.keys(state.edits).length>=18000&&!Object.hasOwn(state.edits,voxelKey(x,y,z)))return tell('このワールドのブロック編集上限に達しました。');
 if(a.type==='voxel-break'){
  if(!existing||existing==='bedrock'||existing==='oasis-water')return false;
  if(energyOf(lp)+1e-8<cost)return tell('エネルギーが足りません。問題に正解して回復しましょう。');
  if(existing==='chest'&&Object.values(state.containers?.[voxelKey(x,y,z)]?.items||{}).some(n=>n!>0))return tell('チェストの中身を取り出してから壊してください。');
  const drop=BLOCK_DROPS[existing as Block]??existing as Material;lp.bag[drop]=(lp.bag[drop]||0)+1;state.edits[voxelKey(x,y,z)]=null;
  if(state.rotations)delete state.rotations[voxelKey(x,y,z)];if(state.containers)delete state.containers[voxelKey(x,y,z)];
  // Do not erase an entire crown when only its trunk or one leaf was harvested.
  for(const [dx,dz] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]){const tx=x+dx,tz=z+dz,tile=tz*WIDTH+tx,cells=vegetationCells(w,tx,tz);if(cells.length&&cells.every(c=>!solid(blockAt(w,c.x,c.y,c.z))))w.life.nodes[tile]={hits:0,regrowAt:Number.MAX_SAFE_INTEGER};}
  if(existing==='steel'&&!p.voxelDiscoveries?.includes('steel'))(p.voxelDiscoveries??=[]).push('steel');
 }else{
  if(a.block==='door'&&(y>=MAX_HEIGHT||blockAt(w,x,y+1,z)||!solid(blockAt(w,x,y-1,z))))return false;
  if(existing||!a.block||!BLOCKS.includes(a.block)||(lp.bag[a.block]||0)<1||(legacyRegion(x,z)&&w.tiles[z*WIDTH+x]==='water'))return false;
  if(energyOf(lp)+1e-8<cost)return tell('エネルギーが足りません。問題に正解して回復しましょう。');
  if(![[x,y-1,z],[x-1,y,z],[x+1,y,z],[x,y,z-1],[x,y,z+1]].some(([bx,by,bz])=>solid(blockAt(w,bx,by,bz))))return false;
  if(Object.values(w.players).some(q=>Math.floor(q.position3D?.x??q.x+.5)===x&&Math.floor(q.position3D?.z??q.y+.5)===z&&y>=playerHeight(w,q)&&y<playerHeight(w,q)+2))return false;
  if(a.rotation!==undefined&&(!Number.isInteger(a.rotation)||a.rotation<0||a.rotation>3))return false;
  lp.bag[a.block]=(lp.bag[a.block]||0)-1;state.edits[voxelKey(x,y,z)]=a.block;(state.rotations??={})[voxelKey(x,y,z)]=a.rotation??0;
 }
 lp.energy=Math.round((energyOf(lp)-cost)*100)/100;p.message=a.type==='voxel-break'?(existing==='steel'?'未知の鋼材ブロックを発見しました！':'ブロックから素材を獲得しました。'):'ブロックを設置しました。';p.voxelAt=now;state.revision++;w.revision++;
 // Mining under one's feet causes a fall to the next solid floor.
 for(const q of Object.values(w.players))if(q.position3D){const next=floorAt(w,Math.floor(q.position3D.x),Math.floor(q.position3D.z),playerHeight(w,q));if(next!==null&&!q.position3D.vy&&!voxelWater(w,q.position3D.x,q.position3D.z))q.position3D.y=next;}
 return true;
}

/** Exterior tile movement shares the exact solid/air map with 3D walking. */
export function landscapeStep(w:World,pos:{x:number;z:number;y?:number},dx:number,dz:number){
 const x=Math.floor(pos.x)+dx,z=Math.floor(pos.z)+dz;
 if(!legacyRegion(x,z)&&!landscapeRegion(x,z))return null;
 let top=floorAt(w,x,z,(pos.y??0)+1);const water=voxelWater(w,x,z);
 if(water&&(top===null||top<water.surface)){top=water.surface-1.3;if(!bodyClear(w,x,z,top))return null;}if(top===null)return null;
 if(legacyRegion(x,z)&&!lifeWalkable(w,x,z)&&!landscapeGate(x,z))return null;
 return {x:x+.5,z:z+.5,y:top};
}
export function moveLandscape2D(w:World,p:Adventurer,dx:number,dz:number,now:number){
 const pos=p.position3D;if(!pos)return false;const next=landscapeStep(w,pos,dx,dz);if(!next)return false;
 p.position3D={...next,surface2D:true,oxygen:pos.oxygen,waterAt:pos.waterAt};p.lastMove=now;p.moveCount++;w.revision++;
 if(legacyRegion(next.x,next.z)){p.x=Math.floor(next.x);p.y=Math.floor(next.z);delete p.position3D;}
 return true;
}
/** Bounded A* uses the same height/body test as authoritative movement. */
export function findLandscapeRoute(w:World,p:Adventurer,x:number,z:number){
 if(!p.position3D||!Number.isInteger(x)||!Number.isInteger(z)||!landscapeRegion(x,z)&&!legacyRegion(x,z))return [];
 const start=p.position3D,heuristic=(pos:{x:number;z:number})=>Math.abs(Math.floor(pos.x)-x)+Math.abs(Math.floor(pos.z)-z),key=(pos:{x:number;z:number})=>Math.floor(pos.x)+','+Math.floor(pos.z);
 type Node={pos:{x:number;z:number;y?:number};path:{x:number;y:number}[];cost:number};
 const open:Node[]=[{pos:start,path:[],cost:0}],seen=new Map<string,number>([[key(start),0]]);let best=open[0];
 for(let count=0;open.length&&count<512;count++){
  open.sort((a,b)=>a.cost+heuristic(a.pos)-b.cost-heuristic(b.pos));const current=open.shift()!;
  if(heuristic(current.pos)<heuristic(best.pos))best=current;if(!heuristic(current.pos))return current.path;
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const pos=landscapeStep(w,current.pos,dx,dz);if(!pos)continue;const id=key(pos),cost=current.cost+1;if((seen.get(id)??Infinity)<=cost)continue;seen.set(id,cost);open.push({pos,cost,path:[...current.path,{x:Math.floor(pos.x),y:Math.floor(pos.z)}]});}
 }
 return best.path;
}
/** Authority-owned breath and currents continue even while the player stands still. */
export function advanceVoxelWater(w:World,now:number){
 if(!w.started||w.ended)return;
 for(const p of Object.values(w.players)){
  const pos=p.position3D;if(!pos||p.spectator||p.nativeScene||p.life?.indoors)continue;
  const dt=Math.min(1,Math.max(0,(now-(pos.waterAt??now))/1000));pos.waterAt=now;
  const pool=voxelWater(w,pos.x,pos.z),submerged=!!pool&&(pos.y??0)+EYE_HEIGHT<pool.surface;
  const oxygen=Math.min(20,Math.max(0,(pos.oxygen??20)+(submerged?-dt:dt*4)));
  if(pos.oxygen!==oxygen){pos.oxygen=oxygen;w.revision++;}
  if(oxygen===0&&pool){
   // Find a clear surface, including beside a bridge; never push into a solid deck.
   let rescued=false;for(let r=0;r<=12&&!rescued;r++)for(let dx=-r;dx<=r&&!rescued;dx++)for(let dz=-r;dz<=r;dz++){
    if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;const x=Math.floor(pos.x)+dx,z=Math.floor(pos.z)+dz,water=voxelWater(w,x,z);if(!water)continue;
    const feet=water.surface-1.3;if(bodyClear(w,x,z,feet)){pos.x=x+.5;pos.z=z+.5;pos.y=feet;pos.oxygen=5;pos.swimming=false;rescued=true;w.revision++;break;}
   }
   if(!rescued){const safe=w.sites.find(s=>s.kind==='town');if(safe){p.x=safe.x;p.y=safe.y;delete p.position3D;w.revision++;continue;}}
  }
  if(pool&&!pos.surface2D&&(pos.y??0)<pool.surface&&dt){const nx=pos.x+pool.flowX*dt*.3,nz=pos.z+pool.flowZ*dt*.3;
   if(voxelWater(w,nx,nz)&&bodyClear(w,Math.floor(nx),Math.floor(nz),pos.y??0)){pos.x=nx;pos.z=nz;w.revision++;if(legacyRegion(nx,nz)){p.x=Math.floor(nx);p.y=Math.floor(nz);}}
  }
 }
}
