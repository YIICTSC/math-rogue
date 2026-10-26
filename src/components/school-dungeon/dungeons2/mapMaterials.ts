import {assetUrl} from '../../../utils/assetPaths';
export const MAP_MATERIAL_ROUTES=['STORY','BARE','MYSTERY','TRAPS','NO_GEAR','CARDS','RESCUE','PUZZLE','VERDANT','GLACIER','TIDAL','ARCHIVE','FOUNDRY','MIRROR','CLOCKWORK','STORM','ABYSS','VOID','CHRONICLE','CONSTELLATION','DRAGON','INFINITE'] as const;
export interface MaterialContext{mode?:string;floor?:number;town?:boolean;scene?:number;}
export const mapMaterialPaths=(mode:string)=>({tiles:assetUrl(`sprites/dungeons-map-materials/${mode.toLowerCase()}.webp`),walls:assetUrl(`sprites/dungeons-map-materials/walls/${mode.toLowerCase()}.webp`)});
const routes=new Set<string>(MAP_MATERIAL_ROUTES),cache=new Map<string,{tiles:HTMLImageElement;walls:HTMLImageElement}>();
export function materialRoute(s:MaterialContext){return s.scene===undefined&&!s.town&&s.mode&&routes.has(s.mode)?s.mode:undefined;}
export function loadMapMaterials(mode:string){
 if(!routes.has(mode)||typeof Image==='undefined')return;
 let entry=cache.get(mode);if(entry){cache.delete(mode);cache.set(mode,entry);return entry;}
 const paths=mapMaterialPaths(mode),tiles=new Image(),walls=new Image();tiles.src=paths.tiles;walls.src=paths.walls;entry={tiles,walls};cache.set(mode,entry);
 // Only the current and two recent dungeon sets stay resident on mobile.
 if(cache.size>3)cache.delete(cache.keys().next().value!);return entry;
}
export function materialHash(x:number,y:number,floor:number,salt=0){let n=Math.imul(x+137,374761393)^Math.imul(y+263,668265263)^Math.imul(floor+salt,1274126177);n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0;}
/** Each floor keeps one coherent base material; wear and inlays stay sparse. */
export function floorMaterialIndex(x:number,y:number,floor=1){const col=materialHash(0,0,floor)%4,detail=materialHash(x,y,floor,31);return detail%43===0?56+(detail>>>8)%8:detail%127===0?[4,5,6,7,12,13,14,15][(detail>>>8)%8]:detail%13===0?8+col:col;}
export function wallMaterialVariant(x:number,y:number,floor=1,front=false){const n=materialHash(x,y,floor,73);return front&&n%4===0?8+(n>>>8)%8:n%5===0?16+(n>>>8)%8:(n>>>8)%8;}
const ready=(img:HTMLImageElement)=>img.complete&&img.naturalWidth>0;
function drawCell(ctx:CanvasRenderingContext2D,img:HTMLImageElement,index:number,x:number,y:number,size:number){ctx.drawImage(img,index%8*64,Math.floor(index/8)*64,64,64,x,y,size,size);}
export function drawMapMaterial(ctx:CanvasRenderingContext2D,map:readonly(readonly string[])[],kind:string,x:number,y:number,size:number,mx:number,my:number,s:MaterialContext,quarters:number[]){
 const route=materialRoute(s);if(!route)return false;const art=loadMapMaterials(route);if(!art||!ready(art.tiles)||!ready(art.walls))return false;
 const floor=s.floor||1;ctx.save();ctx.imageSmoothingEnabled=false;
 drawCell(ctx,art.tiles,kind==='STAIRS'?40+materialHash(mx,my,floor,101)%8:floorMaterialIndex(mx,my,floor),x,y,size);
 if(kind==='WALL'){
  const v=wallMaterialVariant(mx,my,floor,['FLOOR','STAIRS'].includes(map[my+1]?.[mx])),half=size/2;
  for(let q=0;q<4;q++){const qx=q===1||q===2?1:0,qy=q>=2?1:0;ctx.drawImage(art.walls,quarters[q]*32+qx*16,v*32+qy*16,16,16,x+qx*half,y+qy*half,half,half);}
 }else if(kind!=='STAIRS'&&map[my-1]?.[mx]==='WALL'){ctx.fillStyle='#070b1580';ctx.fillRect(x,y,size,size*.1);}
 if(kind==='STAIRS'){
  // The tiny marker is shared by all stairs; the artwork underneath belongs to the route.
  ctx.strokeStyle='#fff2b0';ctx.lineWidth=Math.max(1,size*.035);ctx.beginPath();ctx.moveTo(x+size*.72,y+size*.17);ctx.lineTo(x+size*.8,y+size*.25);ctx.lineTo(x+size*.88,y+size*.17);ctx.stroke();
 }
 ctx.restore();return true;
}
export function drawMapGroundFeature(ctx:CanvasRenderingContext2D,kind:string,x:number,y:number,size:number,s:MaterialContext,mx=0,my=0){
 const route=materialRoute(s),base=({WATER:32,ICE:34,CRACK:36,HOLE:38}as Record<string,number>)[kind];if(!route||base===undefined)return false;
 const art=loadMapMaterials(route);if(!art||!ready(art.tiles))return false;ctx.save();ctx.imageSmoothingEnabled=false;drawCell(ctx,art.tiles,base+materialHash(mx,my,s.floor||1,197)%2,x,y,size);ctx.restore();return true;
}
