import {WIDTH,HEIGHT,createWorld,type World} from './engine';
import {ORIGINAL_WIDTH,ORIGINAL_HEIGHT,originalRegion} from './worldDimensions';
import {STRUCTURES,legacyRegion} from './worldLandscape';
/** Convert tile-addressed state once. Keep every original surface coordinate intact. */
export function migrateUnifiedWorld(w:World):World {
 if(w.tiles.length===WIDTH*HEIGHT)return w;
 if(w.tiles.length!==ORIGINAL_WIDTH*ORIGINAL_HEIGHT)throw new Error('Unsupported RPG map dimensions');
 const remap=(tile:number)=>tile>=0&&tile<ORIGINAL_WIDTH*ORIGINAL_HEIGHT?Math.floor(tile/ORIGINAL_WIDTH)*WIDTH+tile%ORIGINAL_WIDTH:tile;
 const generated=createWorld(w.seed).tiles,old=w.tiles;
 for(let z=0;z<ORIGINAL_HEIGHT;z++)for(let x=0;x<ORIGINAL_WIDTH;x++)generated[z*WIDTH+x]=old[z*ORIGINAL_WIDTH+x];
 // The former southern/eastern border becomes traversable instead of a seam.
 for(let z=1;z<ORIGINAL_HEIGHT;z++)if(generated[z*WIDTH+ORIGINAL_WIDTH-1]==='forest')generated[z*WIDTH+ORIGINAL_WIDTH-1]='grass';
 for(let x=1;x<ORIGINAL_WIDTH;x++)if(generated[(ORIGINAL_HEIGHT-1)*WIDTH+x]==='forest')generated[(ORIGINAL_HEIGHT-1)*WIDTH+x]='grass';
 w.tiles=generated;
 const visit=(v:unknown)=>{if(!v||typeof v!=='object')return;for(const [key,value] of Object.entries(v)){
  if((key==='tile'||key==='homeTile')&&typeof value==='number')(v as Record<string,unknown>)[key]=key==='homeTile'&&value>=ORIGINAL_WIDTH*ORIGINAL_HEIGHT?WIDTH*HEIGHT+value-ORIGINAL_WIDTH*ORIGINAL_HEIGHT:remap(value);
  else if(key==='nodes'||key==='picked'){const mapped=Object.fromEntries(Object.entries(value||{}).map(([k,n])=>[remap(Number(k)),n]));(v as Record<string,unknown>)[key]=mapped;}
  else if(key==='roads'&&Array.isArray(value))(v as Record<string,unknown>)[key]=value.map(remap);
  else if(key!=='tiles')visit(value);
 }};visit(w);
 w.life.games=Object.fromEntries(Object.values(w.life.games).map(game=>{game.key=game.homeTile+':'+game.slot;return [game.key,game];}));
 // Pack connected exterior construction columns, retaining their relative geometry,
 // floors, rotations, containers and room furniture. Never overwrite other edits.
 const edits=w.voxels?.edits||{},outside=new Set(Object.keys(edits).map(k=>{const [x,,z]=k.split(',').map(Number);return `${x},${z}`;}).filter(k=>{const [x,z]=k.split(',').map(Number);return !originalRegion(x,z);}));
 const occupied=new Set(Object.keys(edits).map(k=>{const [x,,z]=k.split(',');return `${x},${z}`;}).filter(k=>{const [x,z]=k.split(',').map(Number);return originalRegion(x,z);}));
 const translations=new Map<string,{dx:number;dz:number}>();
 while(outside.size){const first=outside.values().next().value!,todo=[first],component:string[]=[];outside.delete(first);
  while(todo.length){const key=todo.pop()!;component.push(key);const [x,z]=key.split(',').map(Number);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const n=`${x+dx},${z+dz}`;if(outside.delete(n))todo.push(n);}}
  const xs=component.map(k=>Number(k.split(',')[0])),zs=component.map(k=>Number(k.split(',')[1])),minX=Math.min(...xs),minZ=Math.min(...zs),spanX=Math.max(...xs)-minX+1,spanZ=Math.max(...zs)-minZ+1;
  let destination:{dx:number;dz:number}|undefined;
  search:for(let z=2;z<HEIGHT-spanZ-1;z++)for(let x=2;x<WIDTH-spanX-1;x++){
   if(originalRegion(x,z)||originalRegion(x+spanX-1,z+spanZ-1))continue;
   if(STRUCTURES.some(l=>x<l.x+l.width/2+2&&x+spanX>l.x-l.width/2-2&&z<l.z+l.depth/2+2&&z+spanZ>l.z-l.depth/2-2))continue;
   if(component.some(k=>{const [cx,cz]=k.split(',').map(Number);return occupied.has(`${cx+x-minX},${cz+z-minZ}`);}))continue;
   destination={dx:x-minX,dz:z-minZ};break search;
  }
  if(!destination)throw new Error('旧建築を安全に移す空間が不足しています。保存データは保持されています。');
  for(const key of component){translations.set(key,destination);const [x,z]=key.split(',').map(Number);occupied.add(`${x+destination.dx},${z+destination.dz}`);}
 }
 const moveKey=(key:string)=>{const [x,y,z]=key.split(',').map(Number),offset=translations.get(`${x},${z}`);return offset?`${x+offset.dx},${y},${z+offset.dz}`:key;};
 if(w.voxels){for(const field of ['edits','rotations','containers'] as const){const values=w.voxels[field];if(values)(w.voxels as unknown as Record<string,unknown>)[field]=Object.fromEntries(Object.entries(values).map(([k,v])=>[moveKey(k),v]));}}
 const offsetAt=(x:number,z:number)=>translations.get(`${Math.floor(x)},${Math.floor(z)}`)||Array.from(translations).find(([key])=>{const [cx,cz]=key.split(',').map(Number);return Math.abs(cx-x)<=16&&Math.abs(cz-z)<=16;})?.[1];
 if(w.voxels){w.voxels.legacyFlat??=[];for(const [key,offset]of translations){const [x,z]=key.split(',').map(Number);w.voxels.legacyFlat.push(`${x+offset.dx},${z+offset.dz}`);}}
 for(const room of w.voxelRooms||[]){const offset=originalRegion(room.door.x,room.door.z)?undefined:offsetAt(room.door.x,room.door.z);if(offset){room.door.x+=offset.dx;room.door.z+=offset.dz;for(const cell of room.cells){cell.x+=offset.dx;cell.z+=offset.dz;if(w.voxels)w.voxels.edits[`${cell.x},${room.floor-1},${cell.z}`]??='stone';}for(const furniture of room.furniture){furniture.x+=offset.dx;furniture.y+=offset.dz;}for(const farm of Object.values(w.farm?.people||{}))for(const pet of farm.pets)if(pet.homeId===room.id&&pet.roomPos){pet.roomPos.x+=offset.dx;pet.roomPos.y+=offset.dz;}}}
 for(const p of Object.values(w.players)){if(p.position3D&&!originalRegion(p.position3D.x,p.position3D.z)){const offset=offsetAt(p.position3D.x,p.position3D.z);if(offset){p.position3D.x+=offset.dx;p.position3D.z+=offset.dz;p.x=Math.floor(p.position3D.x);p.y=Math.floor(p.position3D.z);}else delete p.position3D;}}
 w.revision++;return w;
}
