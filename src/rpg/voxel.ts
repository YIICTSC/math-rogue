import {WIDTH,HEIGHT,type World,type Adventurer} from './engine';
import {natureAt,lifePlayer,lifeWalkable,type Material} from './life';
import {energyOf} from './energy';
import {occupiedFarmTile,farmBusy} from './farm/model';
import {occupiedCityTile} from './city/model';
import {BIOMES,biomeWeights,biomeAt} from './biomes';
export const BLOCKS=['wood','stone','plank','brick','frostwood','ore','crystal','dirt','sand','snow','steel','leaves','frostleaves','fruit','bush','reed','herb','cactus','door'] as const;
export type Block=typeof BLOCKS[number];
export const VOXEL_COLORS:Record<TerrainBlock,string>={wood:'#98704a',stone:'#829096',plank:'#c39a63',brick:'#ae6550',frostwood:'#c5dee0',ore:'#75634f',crystal:'#9e75ce',dirt:'#89734e',sand:'#d7ba79',snow:'#dbe9ef',steel:'#648c9a',leaves:'#508741',frostleaves:'#bad5c7',fruit:'#d87835',bush:'#639943',reed:'#88a85b',herb:'#72aa66',cactus:'#438754',door:'#b38958','door-top':'#b38958',bedrock:'#424954','oasis-water':'#3de1cf'};
export type TerrainBlock=Block|'bedrock'|'oasis-water'|'door-top';
export const MIN_DEPTH=-18,MAX_HEIGHT=18,EYE_HEIGHT=1.62;
export interface VoxelWorld {edits:Record<string,Block|null>;revision:number;terrainVersion?:2;legacyFlat?:string[]}
export type VoxelAction={type:'voxel-move';dx:number;dy:number}|{type:'voxel-snap'}|{type:'voxel-break'|'voxel-place';x:number;y:number;z:number;block?:Block};
export const voxelKey=(x:number,y:number,z:number)=>`${x},${y},${z}`;
export function protectedVoxel(w:World,x:number,z:number){return x<1||z<1||x>=WIDTH-1||z>=HEIGHT-1||occupiedFarmTile(w,z*WIDTH+x)||occupiedCityTile(w,z*WIDTH+x)||w.sites.some(s=>Math.abs(s.x-x)+Math.abs(s.y-z)<=1)||w.life.houses.some(h=>Math.abs(h.x-x)+Math.abs(h.y-z)<=1);}
const heightCache=new Map<number,Int8Array>();
const finalHeightCache=new WeakMap<World,{revision:number;heights:Int8Array}>();
export function terrainHeight(w:World,x:number,z:number){
 if(x<0||z<0||x>=WIDTH||z>=HEIGHT)return 0;
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
export function oasisCenters(w:World){let centers=oasisCache.get(w.seed);if(!centers){if(oasisCache.size>8)oasisCache.clear();centers=BIOMES.map((b,i)=>({id:`oasis-${i}`,x:b.x+9+(w.seed%5),z:b.y-7,depth:-7-(i%3)*2}));oasisCache.set(w.seed,centers);}return centers;}
export function undergroundOasis(w:World,x:number,y:number,z:number){return oasisCenters(w).find(c=>((x+.5-c.x)/5.5)**2+((z+.5-c.z)/5.5)**2+((y+.5-c.depth)/2.8)**2<1);}
/** Natural vegetation uses the same editable cells as player-built blocks. */
export function vegetationCells(w:World,x:number,z:number):{x:number;y:number;z:number;block:Block}[]{
 const node=natureAt(w,z*WIDTH+x);if(!node||w.life.nodes[z*WIDTH+x]?.regrowAt||protectedVoxel(w,x,z))return [];
 const h=terrainHeight(w,x,z),cell=(dx:number,dy:number,dz:number,block:Block)=>({x:x+dx,y:h+dy,z:z+dz,block});
 if(node.rock)return [cell(0,0,0,node.material as Block)];
 if(node.sprite===3)return [cell(0,0,0,'herb')];
 if(node.sprite===5)return [cell(0,0,0,'reed'),cell(0,1,0,'reed')];
 if(node.sprite===6)return [cell(0,0,0,'cactus'),cell(0,1,0,'cactus')];
 if(node.sprite===16)return [cell(0,0,0,'bush')];
 const trunk:Block=node.material==='frostwood'?'frostwood':'wood';
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
  if(node.sprite===5){if(level<=1)return 'reed';continue;}
  if(node.sprite===6){if(level<=1)return 'cactus';continue;}
  if(node.sprite===16){if(level===0)return 'bush';continue;}
  if(level<2)return node.material==='frostwood'?'frostwood':'wood';
  if(tree)return level===3&&node.sprite===17?'fruit':leaf;
 }
 return null;
}
export function blockAt(w:World,x:number,y:number,z:number):TerrainBlock|null {
 if(x<0||z<0||x>=WIDTH||z>=HEIGHT||y>MAX_HEIGHT)return null;
 const key=voxelKey(x,y,z);if(w.voxels&&Object.hasOwn(w.voxels.edits,key))return w.voxels.edits[key];
 if(w.voxels?.edits[voxelKey(x,y-1,z)]==='door')return 'door-top';
 if(y<=MIN_DEPTH)return 'bedrock';const h=terrainHeight(w,x,z),protectedCell=protectedVoxel(w,x,z);
 if(y<h){
  if(w.tiles[z*WIDTH+x]==='water')return y< -1?'stone':null;
  if(!protectedCell){const oasis=undergroundOasis(w,x,y,z);if(oasis){const radius=Math.hypot(x-oasis.x,z-oasis.z);if(y<=oasis.depth-2)return radius<4?'sand':'stone';return y===oasis.depth-1&&radius<3?'oasis-water':null;}
   // Winding caverns join the six oases without a second terrain simulation.
   if(y<=-4&&y>=-13&&Math.abs(Math.sin(x*.23+w.seed)+Math.cos(z*.21))<.24&&Math.abs(y-(-8+Math.round(Math.sin((x+z)*.09)*2)))<=1)return null;
  }
  if(y===h-1)return biomeAt(x,z).id==='snow'?'snow':biomeAt(x,z).id==='desert'?'sand':'dirt';
  if(y>=h-3)return 'dirt';
  const hash=(Math.imul(x+1,374761393)^Math.imul(z+1,668265263)^Math.imul(y+31,1274126177)^w.seed)>>>0;
  if(y<=-7&&hash%23<3)return 'steel';if(y<=-4&&hash%19<2)return 'crystal';if(hash%17<2)return 'ore';return 'stone';
 }
 if(protectedCell||w.tiles[z*WIDTH+x]==='water')return null;
 return vegetationAt(w,x,y,z);
}
export const solid=(b:TerrainBlock|null)=>!!b&&b!=='oasis-water'&&b!=='door'&&b!=='door-top';
export function floorAt(w:World,x:number,z:number,maxTop:number):number|null {
 if(x<1||z<1||x>=WIDTH-1||z>=HEIGHT-1||w.tiles[z*WIDTH+x]==='water')return null;
 for(let y=Math.min(MAX_HEIGHT,Math.floor(maxTop)-1);y>=MIN_DEPTH;y--)if(solid(blockAt(w,x,y,z))&&!solid(blockAt(w,x,y+1,z))&&!solid(blockAt(w,x,y+2,z)))return y+1;
 return null;
}
export function playerHeight(w:World,p:Adventurer){return p.position3D?.y??floorAt(w,p.x,p.y,terrainHeight(w,p.x,p.y)+1)??0;}
export function miningCost(block:TerrainBlock,p:Adventurer){const base=({stone:.3,brick:.2,ore:.6,crystal:.8,steel:1.2,bedrock:Infinity,'oasis-water':Infinity} as Partial<Record<TerrainBlock,number>>)[block]??.1;const factor=p.life?.pickaxe==='steel'?.3:p.life?.pickaxe==='iron'?.5:p.life?.pickaxe==='stone'?.75:1;return Math.max(.1,Math.round(base*factor*100)/100);}
export function voxelWalkable(w:World,x:number,z:number,maxTop=terrainHeight(w,Math.floor(x),Math.floor(z))+1){return floorAt(w,Math.floor(x),Math.floor(z),maxTop)!==null;}
function upgrade(w:World){const v=w.voxels??={edits:{},revision:0,terrainVersion:2};if(!v.terrainVersion){v.legacyFlat=[...new Set(Object.keys(v.edits).map(k=>{const [x,,z]=k.split(',');return `${x},${z}`;}))];v.terrainVersion=2;}return v;}
export function applyVoxel(w:World,p:Adventurer,a:VoxelAction,now:number){
 const tell=(text:string)=>{p.message=text;w.revision++;return true;};
 if(a.type==='voxel-snap'){
  // Underground coordinates never leak into the 2D tile simulation.
  if(!lifeWalkable(w,p.x,p.y)){let target:{x:number;y:number}|undefined;for(let r=1;r<=WIDTH+HEIGHT&&!target;r++)for(let dx=-r;dx<=r&&!target;dx++){const dz=r-Math.abs(dx);for(const sign of [-1,1])if(lifeWalkable(w,p.x+dx,p.y+dz*sign)){target={x:p.x+dx,y:p.y+dz*sign};break;}}if(target){p.x=target.x;p.y=target.y;}}
  delete p.position3D;w.revision++;return true;
 }
 upgrade(w);
 if(a.type==='voxel-move'){
  if(farmBusy(w,p))return false;
  if(!Number.isFinite(a.dx)||!Number.isFinite(a.dy)||Math.hypot(a.dx,a.dy)>.45||now-p.lastMove<45)return false;
  let {x,z}=p.position3D??{x:p.x+.5,z:p.y+.5},feet=playerHeight(w,p);
  const travel=Math.min(.4,Math.max(0,(now-p.lastMove)/1000)*3.2),length=Math.hypot(a.dx,a.dy);if(!length)return false;
  const dx=a.dx*Math.min(1,travel/length),dz=a.dy*Math.min(1,travel/length);
  const step=(nx:number,nz:number)=>{const corners=[[-.18,-.18],[-.18,.18],[.18,-.18],[.18,.18]].map(([ox,oz])=>({x:Math.floor(nx+ox),z:Math.floor(nz+oz)}));const heights=corners.map(c=>floorAt(w,c.x,c.z,feet+1));if(heights.some(h=>h===null))return false;const next=Math.max(...heights as number[]);if(corners.some(c=>solid(blockAt(w,c.x,next,c.z))||solid(blockAt(w,c.x,next+1,c.z))))return false;if(next<feet&&corners.some(c=>{for(let y=next;y<=feet+1;y++)if(solid(blockAt(w,c.x,y,c.z)))return true;return false;}))return false;x=nx;z=nz;feet=next;return true;};
  step(x+dx,z);step(x,z+dz);p.position3D={x,z,y:feet};p.x=Math.floor(x);p.y=Math.floor(z);p.lastMove=now;p.moveCount++;w.revision++;
  const oasis=undergroundOasis(w,p.x,feet,p.y);if(oasis&&!p.voxelDiscoveries?.includes(oasis.id)){(p.voxelDiscoveries??=[]).push(oasis.id);p.message='地下のオアシスを発見しました！';}
  return true;
 }
 let {x,y,z}=a;if(a.type==='voxel-break'&&blockAt(w,x,y,z)==='door-top')y--;if(![x,y,z].every(Number.isInteger)||y<=MIN_DEPTH||y>MAX_HEIGHT||protectedVoxel(w,x,z)||now-(p.voxelAt||0)<220)return false;
 const pos=p.position3D??{x:p.x+.5,z:p.y+.5};if(Math.hypot(x+.5-pos.x,y+.5-(playerHeight(w,p)+EYE_HEIGHT),z+.5-pos.z)>4.5)return false;
 const lp=lifePlayer(p),existing=blockAt(w,x,y,z),state=upgrade(w);const cost=a.type==='voxel-break'&&existing?miningCost(existing,p):.1;
 if(Object.keys(state.edits).length>=18000&&!Object.hasOwn(state.edits,voxelKey(x,y,z)))return tell('このワールドのブロック編集上限に達しました。');
 if(a.type==='voxel-break'){
  if(!existing||existing==='bedrock'||existing==='oasis-water')return false;
  if(energyOf(lp)+1e-8<cost)return tell('エネルギーが足りません。問題に正解して回復しましょう。');
  lp.bag[existing as Material]=(lp.bag[existing as Material]||0)+1;state.edits[voxelKey(x,y,z)]=null;
  // Do not erase an entire crown when only its trunk or one leaf was harvested.
  for(const [dx,dz] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]){const tx=x+dx,tz=z+dz,tile=tz*WIDTH+tx,cells=vegetationCells(w,tx,tz);if(cells.length&&cells.every(c=>!solid(blockAt(w,c.x,c.y,c.z))))w.life.nodes[tile]={hits:0,regrowAt:Number.MAX_SAFE_INTEGER};}
  if(existing==='steel'&&!p.voxelDiscoveries?.includes('steel'))(p.voxelDiscoveries??=[]).push('steel');
 }else{
  if(a.block==='door'&&(y>=MAX_HEIGHT||blockAt(w,x,y+1,z)||!solid(blockAt(w,x,y-1,z))))return false;
  if(existing||!a.block||!BLOCKS.includes(a.block)||(lp.bag[a.block]||0)<1||w.tiles[z*WIDTH+x]==='water')return false;
  if(energyOf(lp)+1e-8<cost)return tell('エネルギーが足りません。問題に正解して回復しましょう。');
  if(![[x,y-1,z],[x-1,y,z],[x+1,y,z],[x,y,z-1],[x,y,z+1]].some(([bx,by,bz])=>solid(blockAt(w,bx,by,bz))))return false;
  if(Object.values(w.players).some(q=>Math.floor(q.position3D?.x??q.x+.5)===x&&Math.floor(q.position3D?.z??q.y+.5)===z&&y>=playerHeight(w,q)&&y<playerHeight(w,q)+2))return false;
  lp.bag[a.block]=(lp.bag[a.block]||0)-1;state.edits[voxelKey(x,y,z)]=a.block;
 }
 lp.energy=Math.round((energyOf(lp)-cost)*100)/100;p.message=a.type==='voxel-break'?(existing==='steel'?'未知の鋼材ブロックを発見しました！':'ブロックから素材を獲得しました。'):'ブロックを設置しました。';p.voxelAt=now;state.revision++;w.revision++;
 // Mining under one's feet causes a fall to the next solid floor.
 for(const q of Object.values(w.players))if(q.position3D){const next=floorAt(w,Math.floor(q.position3D.x),Math.floor(q.position3D.z),playerHeight(w,q));if(next!==null)q.position3D.y=next;}
 return true;
}
