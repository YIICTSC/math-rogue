import {MAP_WIDTH} from './map';
import type {World,Player} from './engine';
import type {Home} from './progression';
export function homeAt(w:World,tile:number):Home|undefined{
 if(!Number.isInteger(tile)||tile<0||tile>=w.tiles.length||!w.tiles[tile].homeOwner)return;
 const owner=Object.values(w.players).find(p=>p.progress.home.tile===tile&&p.progress.home.level);
 if(owner)return owner.progress.home;
 const saved=Object.values(w.residents||{}).find(r=>r.progress.home.tile===tile&&r.progress.home.level);
 return saved?.progress.home||w.homeViews?.[tile];
}
export const roomTile=(p:Player)=>p.homeTile??p.progress.home.tile;
export const roomHome=(w:World,p:Player)=>p.indoors?homeAt(w,roomTile(p)):p.progress.home;
export function enterHome(w:World,p:Player,tile:number){const home=homeAt(w,tile);if(!home||Math.hypot(p.x-(tile%MAP_WIDTH+.5),p.z-(Math.floor(tile/MAP_WIDTH)+.5))>3)return false;p.indoors=true;p.homeTile=tile;p.dx=p.dz=0;p.fishing=undefined;return true;}
export function publicHome(home:Home):Home{return {tile:home.tile,level:home.level,furniture:home.furniture.map(f=>({...f})),pet:home.pet?{...home.pet}:undefined};}
