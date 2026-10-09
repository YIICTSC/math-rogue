import {WORLD_SCALE} from './worldLandscape';
import {mapPosition} from './landscapeMap';
import {gameCommand,type GameCommand} from '../mini-games/gakuro-craft/homeGames';
import {farmBusy} from './farm/model';
import {WIDTH,HEIGHT,type World,type Adventurer} from './engine';
import {blockAt,solid,playerHeight,type Block} from './voxel';
import {lifePlayer,canAfford,homeGameWorld,type Material} from './life';
import {furnishing,type PlacedFurniture,furnitureSize} from './homeCatalog';
export interface VoxelRoom {id:string;owner:string;shared:boolean;door:{x:number;y:number;z:number};cells:{x:number;z:number}[];floor:number;stock:Record<string,number>;furniture:PlacedFurniture[];revision:number}
export type RoomAction={type:'voxel-room-game';id:string;command:GameCommand}|{type:'voxel-room-register';x:number;y:number;z:number}|{type:'voxel-room-mode';id:string;shared:boolean}|{type:'voxel-room-craft';id:string;item:string}|{type:'voxel-room-place';id:string;item:string;x:number;z:number;rotation:0|1}|{type:'voxel-room-pack';id:string;furnitureId:string};
export function roomContains(r:VoxelRoom,p:Adventurer,w:World){const pos=mapPosition(p);return Math.abs(playerHeight(w,p)-r.floor)<.1&&r.cells.some(c=>c.x===Math.floor(pos.x)&&c.z===Math.floor(pos.z));}
export function currentVoxelRoom(w:World,p:Adventurer){return w.voxelRooms?.find(r=>roomContains(r,p,w));}
export function nearDoor(w:World,p:Adventurer){const feet=Math.floor(playerHeight(w,p)),pos=mapPosition(p),px=Math.floor(pos.x),pz=Math.floor(pos.z);for(let z=pz-2;z<=pz+2;z++)for(let x=px-2;x<=px+2;x++)for(let y=feet-1;y<=feet+1;y++)if(blockAt(w,x,y,z)==='door'&&Math.hypot(x+.5-(p.position3D?.x??p.x+.5),z+.5-(p.position3D?.z??p.y+.5),y-feet)<=2.6)return {x,y,z};}
/** A door seals the boundary during flood-fill. Open air and missing floors reject registration. */
export function findEnclosure(w:World,door:{x:number;y:number;z:number}){
 const clear=(x:number,z:number)=>!solid(blockAt(w,x,door.y,z))&&!solid(blockAt(w,x,door.y+1,z))&&blockAt(w,x,door.y,z)!=='door'&&blockAt(w,x,door.y+1,z)!=='door-top';
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const start={x:door.x+dx,z:door.z+dz};if(!clear(start.x,start.z))continue;const seen=new Set<string>(),queue=[start],cells:{x:number;z:number}[]=[];let valid=true;
  while(queue.length&&valid){const c=queue.shift()!,key=`${c.x},${c.z}`;if(seen.has(key))continue;seen.add(key);if(!clear(c.x,c.z))continue;
   if(c.x<WORLD_SCALE.min||c.z<WORLD_SCALE.min||c.x>=WORLD_SCALE.max||c.z>=HEIGHT||Math.abs(c.x-door.x)>16||Math.abs(c.z-door.z)>16||cells.length>=256||!solid(blockAt(w,c.x,door.y-1,c.z))||!solid(blockAt(w,c.x,door.y+2,c.z))){valid=false;break;}cells.push(c);
   for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push({x:c.x+a,z:c.z+b});
  }
  if(valid&&cells.length>=4)return cells;
 }
}
export function roomUsable(w:World,r:VoxelRoom){if(blockAt(w,r.door.x,r.door.y,r.door.z)!=='door')return false;const cells=findEnclosure(w,r.door);return !!cells&&cells.length===r.cells.length&&cells.every(c=>r.cells.some(v=>v.x===c.x&&v.z===c.z));}
export function applyRoomAction(w:World,p:Adventurer,a:RoomAction){
 const pos=mapPosition(p),px=Math.floor(pos.x),pz=Math.floor(pos.z);
 if(!w.started||w.ended||p.spectator||p.life?.indoors||(a.type!=='voxel-room-game'&&farmBusy(w,p)))return false;const tell=(s:string)=>{p.message=s;w.revision++;return true;};
 if(a.type==='voxel-room-register'){
  if(![a.x,a.y,a.z].every(Number.isInteger)||blockAt(w,a.x,a.y,a.z)!=='door'||Math.hypot(a.x-px,a.z-pz)>3||Math.abs(a.y-playerHeight(w,p))>2.6)return false;
  const door={x:a.x,y:a.y,z:a.z},cells=findEnclosure(w,door);if(!cells)return tell('壁・屋根・床で囲った空間にドアを設置してください。');
  const rooms=w.voxelRooms??=[];if(rooms.some(r=>r.cells.some(c=>cells.some(v=>v.x===c.x&&v.z===c.z))&&r.floor===a.y))return tell('この空間は登録済みです。');if(rooms.length>=40)return false;
  rooms.push({id:`voxel-home-${p.id}-${w.revision}`,owner:p.id,shared:false,door,cells,floor:a.y,stock:{},furniture:[],revision:0});return tell('囲われた空間を自宅として登録しました。');
 }
 const r=w.voxelRooms?.find(r=>r.id===a.id);if(!r||!(r.owner===p.id||r.shared)||(!roomContains(r,p,w)&&Math.hypot(r.door.x-px,r.door.z-pz)>3))return false;
 if(a.type==='voxel-room-game'){
  if(!a.command||typeof a.command.type!=='string')return false;
  const command=a.command;if(command.type==='game_join'){const f=r.furniture.find(f=>f.slot===command.slot),size=f&&furnitureSize(f);if(!f||!size||Math.max(f.x-px,0,px-f.x-size.width+1)+Math.max(f.y-pz,0,pz-f.y-size.height+1)>2)return false;}
  const host=homeGameWorld(w),reply=gameCommand(host,host.players[p.id],a.command);w.life.games=host.games;return tell(reply&&reply.type==='notice'?reply.text:'家具のゲームを操作しました。');
 }
 if(a.type==='voxel-room-mode'){if(r.owner!==p.id||typeof a.shared!=='boolean')return false;if(a.shared&&Object.values(w.farm?.people||{}).some(f=>f.pets.some(pet=>pet.homeId===r.id)))return tell('ペットが暮らす自宅は共用施設に変更できません。');r.shared=a.shared;r.revision++;return tell(a.shared?'みんなが使える共用施設にしました。':'自分の自宅にしました。');}
 if(!roomUsable(w,r))return tell('壁・屋根・床を修復して、囲われた部屋に戻してください。');
 const lp=lifePlayer(p);
 if(a.type==='voxel-room-craft'){const f=furnishing(a.item);if(!f||!canAfford(lp.bag,f.cost)||Object.values(r.stock).reduce((a,b)=>a+b,0)>=40)return false;for(const [k,n] of Object.entries(f.cost))lp.bag[k as Material]=(lp.bag[k as Material]||0)-n;r.stock[f.id]=(r.stock[f.id]||0)+1;}
 if(a.type==='voxel-room-place'){
  const f=furnishing(a.item);if(!f||!Number.isInteger(a.x)||!Number.isInteger(a.z)||![0,1].includes(a.rotation)||(r.stock[f.id]||0)<1||Math.hypot(a.x-px,a.z-pz)>4)return false;
  const placed:PlacedFurniture={id:`f-${p.id}-${w.revision}`,item:f.id,x:a.x,y:a.z,rotation:a.rotation,slot:Math.max(-1,...r.furniture.map(f=>f.slot??-1))+1},size=furnitureSize(placed);
  for(let z=a.z;z<a.z+size.height;z++)for(let x=a.x;x<a.x+size.width;x++){if(!r.cells.some(c=>c.x===x&&c.z===z)||(!f.floor&&Object.values(w.players).some(q=>Math.floor(mapPosition(q).x)===x&&Math.floor(mapPosition(q).z)===z&&roomContains(r,q,w)))||r.furniture.some(v=>{const s=furnitureSize(v);return !!furnishing(v.item)?.floor===!!f.floor&&x>=v.x&&x<v.x+s.width&&z>=v.y&&z<v.y+s.height;}))return false;}
  r.stock[f.id]--;r.furniture.push(placed);
 }
 if(a.type==='voxel-room-pack'){const i=r.furniture.findIndex(f=>f.id===a.furnitureId);if(i<0)return false;const f=r.furniture.splice(i,1)[0];r.stock[f.item]=(r.stock[f.item]||0)+1;}
 r.revision++;return tell('部屋の家具を更新しました。');
}
