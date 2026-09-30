import {createWorld,type World,type Player} from './engine';
import {MAP_WIDTH,MAP_HEIGHT,MAP_TILES,LEGACY_SIZE,LEGACY_OFFSET_X,LEGACY_OFFSET_Z} from './map';
export function expandLegacyIsland(saved:{world:World;player:Player}){
 const w=saved.world;if(!Array.isArray(w.tiles))return false;
 if(w.tiles.length===MAP_TILES){w.width=MAP_WIDTH;w.height=MAP_HEIGHT;return true;}
 if(w.tiles.length!==LEGACY_SIZE**2)return false;
 const remap=(i:number)=>Number.isInteger(i)&&i>=0&&i<LEGACY_SIZE**2?(Math.floor(i/LEGACY_SIZE)+LEGACY_OFFSET_Z)*MAP_WIDTH+i%LEGACY_SIZE+LEGACY_OFFSET_X:-1;
 const generated=createWorld(w.seed),original=w.tiles;let revision=w.revision;
 for(let i=0;i<original.length;i++){
  const index=remap(i),old=original[i],fresh=generated.tiles[index];
  // Open up untouched old coastal water into the newly generated land.
  const openCoast=old.ground==='water'&&!old.owner&&!old.homeOwner&&!old.blocks.length&&old.crop===null&&fresh.ground!=='water';
  generated.tiles[index]={...old,...(openCoast?{ground:fresh.ground,nature:fresh.nature}:{}),revision:++revision};
 }
 const seenProgress=new WeakSet<object>(),seenPlayers=new WeakSet<object>();
 const progress=(p:{home?:{tile:number}}|undefined)=>{if(p?.home&&!seenProgress.has(p)){seenProgress.add(p);p.home.tile=remap(p.home.tile);}};
 const player=(p:Player)=>{if(seenPlayers.has(p))return;seenPlayers.add(p);p.x+=LEGACY_OFFSET_X;p.z+=LEGACY_OFFSET_Z;progress(p.progress);if(p.homeTile!==undefined)p.homeTile=remap(p.homeTile);if(p.fishing)p.fishing.tile=remap(p.fishing.tile);if(p.lastAction)p.lastAction.tile=remap(p.lastAction.tile);};
 player(saved.player);for(const p of Object.values(w.players||{}))player(p);
 for(const r of Object.values(w.residents||{}))if(r)progress(r.progress);
 w.builtSites=Array.isArray(w.builtSites)?w.builtSites.map(remap):original.flatMap((t,i)=>t.blocks.length?[remap(i)]:[]);
 w.tiles=generated.tiles;w.width=MAP_WIDTH;w.height=MAP_HEIGHT;w.revision=revision;w.games={};w.homeViews={};return true;
}
