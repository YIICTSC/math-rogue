import {WIDTH,HEIGHT,createWorld,type World} from './engine';
import {EXPANDED_WIDTH,EXPANDED_HEIGHT,originalRegion} from './worldDimensions';
/** Restore the original footprint; archive the expanded world before touching it. */
export function migrateUnifiedWorld(w:World):World {
 if(w.compactMapVersion===1)return w;
 const expanded=w.tiles.length===EXPANDED_WIDTH*EXPANDED_HEIGHT;
 if(!expanded&&w.tiles.length!==WIDTH*HEIGHT)throw new Error('Unsupported RPG map dimensions');
 const sourceWidth=expanded?EXPANDED_WIDTH:WIDTH;
 const outsideEdits=Object.keys(w.voxels?.edits||{}).some(k=>{const [x,,z]=k.split(',').map(Number);return !originalRegion(x,z);});
 if(!expanded&&!outsideEdits){w.compactMapVersion=1;return w;}
 if(expanded||outsideEdits){const snapshot=structuredClone(w);delete snapshot.expandedMapArchive;w.expandedMapArchive={width:sourceWidth,height:expanded?EXPANDED_HEIGHT:HEIGHT,world:snapshot};}
 const remap=(tile:number)=>tile>=sourceWidth*(expanded?EXPANDED_HEIGHT:HEIGHT)?WIDTH*HEIGHT+tile-sourceWidth*(expanded?EXPANDED_HEIGHT:HEIGHT):originalRegion(tile%sourceWidth,Math.floor(tile/sourceWidth))?Math.floor(tile/sourceWidth)*WIDTH+tile%sourceWidth:-1;
 if(expanded){const old=w.tiles;w.tiles=Array.from({length:WIDTH*HEIGHT},(_,i)=>old[Math.floor(i/WIDTH)*sourceWidth+i%WIDTH]);}
 const visit=(v:unknown)=>{if(!v||typeof v!=='object')return;for(const [key,value]of Object.entries(v)){
  if(key==='expandedMapArchive'||key==='tiles')continue;
  if((key==='tile'||key==='homeTile')&&typeof value==='number')(v as Record<string,unknown>)[key]=remap(value);
  else if(key==='nodes'||key==='picked')(v as Record<string,unknown>)[key]=Object.fromEntries(Object.entries(value||{}).map(([k,n])=>[remap(Number(k)),n]).filter(([k])=>Number(k)>=0));
  else if(key==='roads'&&Array.isArray(value))(v as Record<string,unknown>)[key]=value.map(remap).filter(n=>n>=0);
  else if(Array.isArray(value))(v as Record<string,unknown>)[key]=value.filter(entry=>!entry||typeof entry!=='object'||!('tile' in entry)||remap(entry.tile)>=0).map(entry=>{visit(entry);return entry;});
  else visit(value);
 }};if(expanded)visit(w);
 if(w.city)w.city.lots=w.city.lots.filter(l=>originalRegion(l.x,l.y));
 w.sites=w.sites.filter(s=>originalRegion(s.x,s.y));w.life.houses=w.life.houses.filter(h=>originalRegion(h.x,h.y));
 w.voxelRooms=w.voxelRooms?.filter(r=>originalRegion(r.door.x,r.door.z)&&r.cells.every(c=>originalRegion(c.x,c.z)));
 if(w.voxels){for(const field of ['edits','rotations','containers']as const){const data=w.voxels[field];if(data)(w.voxels as unknown as Record<string,unknown>)[field]=Object.fromEntries(Object.entries(data).filter(([k])=>{const [x,,z]=k.split(',').map(Number);return originalRegion(x,z);}));}w.voxels.legacyFlat=w.voxels.legacyFlat?.filter(k=>{const [x,z]=k.split(',').map(Number);return originalRegion(x,z);});w.voxels.revision++;}
 const spawn=createWorld(w.seed).sites.find(s=>s.kind==='town')||{x:96,y:44};
 for(const p of Object.values(w.players)){if(!originalRegion(p.x,p.y)){p.x=spawn.x;p.y=spawn.y;}if(p.position3D&&!originalRegion(p.position3D.x,p.position3D.z))delete p.position3D;if(p.life?.indoors&&!w.life.houses.some(h=>h.id===p.life?.indoors))delete p.life.indoors;if(p.life?.homeId&&!w.life.houses.some(h=>h.id===p.life?.homeId))delete p.life.homeId;}
 for(const f of Object.values(w.farm?.people||{})){if(f.x!==undefined&&f.y!==undefined&&!originalRegion(f.x,f.y)){delete f.x;delete f.y;}f.plots=f.plots.filter(p=>p.x===undefined||p.y===undefined||originalRegion(p.x,p.y));for(const pet of f.pets)if(pet.homeId&&!w.life.houses.some(h=>h.id===pet.homeId)&&!w.voxelRooms?.some(r=>r.id===pet.homeId)){delete pet.homeId;pet.roomPos={x:3,y:4};}}
 w.life.games=Object.fromEntries(Object.values(w.life.games).filter(g=>g.homeTile>=0).map(g=>{g.key=g.homeTile+':'+g.slot;return [g.key,g];}));
 w.compactMapVersion=1;w.revision++;return w;
}
