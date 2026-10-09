import {MAP_WIDTH,MAP_HEIGHT} from './worldDimensions';
import {biomeAt,biomeSurface} from './biomes';
/** Shared geometry for the single surface map; original save coordinates remain intact. */
export const WORLD_SCALE = {block:1, playerHeight:1.78, eyeHeight:1.62, radius:.28, walkSpeed:3.2, swimSpeed:2.2, stepHeight:1, gravity:18, jumpSpeed:6, chunk:16, min:0, max:MAP_WIDTH, ceiling:352} as const;
export const legacyRegion=(x:number,z:number)=>x>=0&&z>=0&&x<MAP_WIDTH&&z<MAP_HEIGHT;
export const landscapeRegion=(x:number,z:number)=>!legacyRegion(x,z)&&x>=WORLD_SCALE.min&&z>=WORLD_SCALE.min&&x<WORLD_SCALE.max&&z<MAP_HEIGHT;
export const MOUNTAINS=[{x:222,z:24,radius:18,height:36},{x:224,z:98,radius:22,height:46},{x:160,z:108,radius:17,height:18}] as const;
export const LANDMARKS=[
 {id:'academy',x:30,z:108,width:18,depth:12,height:16,kind:'school',label:'冒険学園'},
 {id:'castle',x:224,z:54,width:24,depth:20,height:28,kind:'castle',label:'白雲の城'},
 {id:'village',x:64,z:104,width:10,depth:10,height:8,kind:'village',label:'川辺の村'},
 {id:'temple',x:106,z:108,width:18,depth:14,height:16,kind:'temple',label:'湖畔の神殿'},
 {id:'tower',x:160,z:108,width:8,depth:8,height:18,kind:'tower',label:'山頂の観測塔'},
] as const;
/** Residential courtyards share the same collision/terrain model as major facilities. */
export const STRUCTURES=[...LANDMARKS,...Array.from({length:8},(_,i)=>({id:'home-'+i,x:64+(i%4-1.5)*10,z:104+(i<4?-10:10),width:6,depth:6,height:6,kind:'village',label:'川辺の住居'}))];
export const LANDSCAPE_BIOME_NAMES={forest:'ささやきの森',meadow:'木漏れ日の草原',wetland:'鏡水の湿原',alpine:'高山の草原',rock:'岩山',snow:'雪山',desert:'琥珀の砂丘',ruins:'暁の古代遺跡'};
export type LandscapeBiome='forest'|'meadow'|'wetland'|'rock'|'snow'|'alpine'|'desert'|'ruins';
export function landscapeHash(x:number,z:number,seed:number){let n=Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
const smooth=(n:number)=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
function coreDistance(x:number,z:number){return Math.hypot(Math.max(0,-x,x-191),Math.max(0,-z,z-87));}
function mountainTrailHeight(x:number,z:number){for(const m of MOUNTAINS){const r=Math.hypot(x-m.x,z-m.z);if(r>m.radius||r<5)continue;const angle=Math.atan2(z-m.z,x-m.x),target=(1-r/m.radius)*Math.PI*8,delta=Math.atan2(Math.sin(angle-target),Math.cos(angle-target));if(Math.abs(delta)*r<2.3){const idealRadius=m.radius*(1-(target+delta)/(Math.PI*8));return m.height*Math.max(0,1-idealRadius/m.radius)**1.12;}}return null;}
export function mountainHeight(x:number,z:number){return Math.max(0,...MOUNTAINS.map(m=>m.height*Math.max(0,1-Math.hypot(x-m.x,z-m.z)/m.radius)**1.12));}
export function trailAt(x:number,z:number){
 for(const m of MOUNTAINS){const r=Math.hypot(x-m.x,z-m.z);if(r>m.radius||r<5)continue;
  const angle=Math.atan2(z-m.z,x-m.x);const target=(1-r/m.radius)*Math.PI*8;
  const delta=Math.atan2(Math.sin(angle-target),Math.cos(angle-target));if(Math.abs(delta)*r<2.3)return true;
 }return false;
}
function roadDistance(x:number,z:number){return Math.min(Math.hypot(x-96,Math.max(44-z,0,z-108)),Math.hypot(z-108,Math.max(30-x,0,x-224)),Math.hypot(x-224,Math.max(54-z,0,z-108)));}
export function roadAt(x:number,z:number){return roadDistance(x,z)<2.8;}
export function waterProfile(x:number,z:number){
 const river=246+Math.sin(z/24)*2;
 const riverDistance=Math.abs(x-river),lake=Math.hypot((x-124)/1.2,z-103);
 if(lake<10)return {surface:1,depth:Math.max(1,Math.floor((1-lake/10)*12)),flowX:.2,flowZ:.05,kind:'lake' as const};
 if(riverDistance<3)return {surface:2,depth:Math.max(1,Math.floor((1-riverDistance/3)*5)),flowX:Math.cos(z/64)*.2,flowZ:1,kind:'river' as const};
 // A high spring feeds a stepped cascade on the south face of the eastern mountain.
 if(Math.abs(x-226)<3&&z>105&&z<123){const surface=Math.max(3,Math.floor(mountainHeight(226,z)/6)*6);return {surface,depth:2,flowX:0,flowZ:1,kind:'waterfall' as const};}
 return null;
}
export function landscapeHeight(seed:number,x:number,z:number){
 const mountain=mountainHeight(x,z),water=waterProfile(x,z);
 const h=mountainTrailHeight(x,z)??(mountain>0?mountain:3+Math.sin(x/39)*2+Math.cos(z/47)*2+Math.sin((x+z)/19));
 let height=Math.floor(h*smooth(coreDistance(x,z)/18));
 if(water)height=water.surface-water.depth;
 // Grade the verges into the road instead of cutting a vertical trench.
 if(!water)height=Math.floor(height*smooth((roadDistance(x,z)-3)/16));
 if(roadAt(x,z))height=water?water.surface+1:0;
 for(const l of STRUCTURES){const distance=Math.max(Math.abs(x-l.x)-l.width/2-6,Math.abs(z-l.z)-l.depth/2-8,0);
  if(l.kind==='tower'&&distance<40){const plateau=Math.floor(mountainHeight(l.x,l.z)-distance*.7);height=Math.floor(height+(Math.max(height,plateau)-height)*(1-smooth(distance/40)));}
  else if(distance<16&&!water)height=Math.floor(height*smooth(distance/16));
 }
 return height;
}
export function landscapeEnvironment(seed:number,x:number,z:number){
 const height=landscapeHeight(seed,x,z),water=waterProfile(x,z),moisture=(Math.sin(x/61)+Math.cos(z/37)+2)/4;
 const biome:LandscapeBiome=biomeAt(x,z).id;
 return {height,water,moisture,biome,trail:trailAt(x,z),road:roadAt(x,z)};
}
/** Walls have actual thickness and a 4m wide, 3m high opening. */
export function landmarkBlock(x:number,y:number,z:number):'brick'|'plank'|'glass'|'stone'|null{
 for(const l of STRUCTURES){const base=l.kind==='tower'?Math.floor(mountainHeight(l.x,l.z)):0;
  const dx=Math.abs(x+.5-l.x),dz=Math.abs(z+.5-l.z),h=y-base;
  if(dx>l.width/2||dz>l.depth/2||h<0||h>l.height+8)continue;
  if(l.kind==='castle'&&h>=l.height&&dx>l.width/2-4&&dz>l.depth/2-4&&h<l.height+6)return 'stone';
  if(l.kind==='castle'&&h===l.height+1&&(dx>l.width/2-1||dz>l.depth/2-1)&&(Math.floor(x+z)%3===0))return 'stone';
  if(l.kind!=='castle'&&h>l.height&&h===l.height+1+Math.floor((1-dx/(l.width/2))*6))return 'plank';
  if(h===l.height)return 'plank';
  const wall=dx>l.width/2-1||dz>l.depth/2-1;
  const entry=z>=l.z+l.depth/2-1&&dx<2&&h<3;
  if(wall&&!entry&&h<l.height){if(h%6>=2&&h%6<=3&&((Math.floor(x)%6+6)%6<2||(Math.floor(z)%6+6)%6<2))return 'glass';return 'brick';}
  if(h===0)return 'stone';
  // Walkable upper floor, leaving a broad stairwell along the eastern wall.
  if(h===6&&l.height>12&&x<l.x+l.width/2-4)return 'plank';
  const step=Math.floor(l.z+l.depth/2-z);if(x>l.x+l.width/2-4&&x<l.x+l.width/2-1&&step>=1&&step<=6&&h<step)return 'stone';
 }return null;
}
export function landscapeTree(seed:number,x:number,z:number){
 if(landscapeHash(x,z,seed)>.022||roadAt(x,z)||trailAt(x,z))return null;
 const e=landscapeEnvironment(seed,x,z);if(e.water||e.height>135||e.biome==='meadow'&&landscapeHash(x,z,seed+7)>.2)return null;
 if(STRUCTURES.some(l=>Math.abs(x-l.x)<l.width/2+8&&Math.abs(z-l.z)<l.depth/2+10))return null;
 return {height:5+Math.floor(landscapeHash(x,z,seed+4)*6),base:e.height,pine:e.height>80||e.biome==='forest'};
}
export function landscapeBlock(seed:number,x:number,y:number,z:number):'stone'|'snow'|'dirt'|'gravel'|'sand'|'wood'|'leaves'|'brick'|'plank'|'glass'|null{
 const h=landscapeHeight(seed,x,z);
 if(y<h){
  const water=waterProfile(x,z);
  // A bridge is a deck over real water/air, never a solid dam to the lake bed.
  if(water&&roadAt(x,z)&&y>=water.surface-water.depth)return y===h-1?'plank':null;
  // Traversable cave cuts horizontally into mountain slopes; floor and roof remain solid.
  const caveY=32+Math.floor(Math.sin(z/40)*3);if(h>caveY&&Math.abs(x-(326+Math.sin(z/30)*7))<3&&y>=caveY&&y<caveY+4)return null;
  if(y===h-1)return h>190?'snow':waterProfile(x,z)?'gravel':trailAt(x,z)||roadAt(x,z)?'sand':h>130?'stone':'dirt';
  return y>h-4?'dirt':'stone';
 }
 const structure=landmarkBlock(x,y,z);if(structure)return structure;
 for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
  const t=landscapeTree(seed,x+dx,z+dz);if(!t)continue;const level=y-t.base;
  if(!dx&&!dz&&level>=0&&level<t.height)return 'wood';
  if(level>=t.height-3&&level<=t.height&&Math.abs(dx)+Math.abs(dz)<= (t.pine?Math.min(3,t.height-level):level===t.height?1:3))return 'leaves';
 }return null;
}

/** Continuous climate tint; also grades the old six biomes into the exploration border. */
export function landscapeColor(seed:number,x:number,z:number){
 const e=landscapeEnvironment(seed,x,z);
 const mix=(a:string,b:string,t:number)=>{t=smooth(t);const channels=[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0'));return '#'+channels.join('');};
 let color=biomeSurface(x,z).color;
 if(e.water)color=mix(color,'#628b73',.2);
 color=mix(color,'#89888b',(e.height-24)/36);
 if(e.biome==='snow')color=mix(color,'#e5edf1',.45);
 return color;
}
