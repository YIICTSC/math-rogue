import {grant} from './activities';
import type {World, Adventurer} from './engine';
import {blockAt,solid} from './voxel';
import {VOXEL_CATALOG} from './voxelCatalog';

export const BUILDING_GOALS = [
 {id:'starter-home', gold:100, dimensions:[6,6,4], ja:'はじめての立体住宅', hira:'はじめてのりったいじゅうたく', en:'First three-dimensional home'},
 {id:'watchtower', gold:200, dimensions:[6,6,12], ja:'見晴らしの塔', hira:'みはらしのとう', en:'Lookout tower'},
 {id:'grand-house', gold:400, dimensions:[12,12,12], ja:'立体建築の大邸宅', hira:'りったいけんちくのだいていたく', en:'Grand three-dimensional residence'},
 {id:'landmark-builder', gold:1000, dimensions:[20,20,20], ja:'20×20×20のランドマーク', hira:'20×20×20のランドマーク', en:'20×20×20 landmark'},
] as const;
export interface BuildingGoalReward {completedAt:number;completedBy:string;gold:number;recipients:string[]}
/** The world ledger prevents payouts from repeated surveys or another builder's claim. */
export function distributeBuildingGoalRewards(world:World, achiever:Adventurer, now:number) {
 const achieved=new Set(Object.values(world.players).flatMap(p=>p.life?.buildingGoals||[]));
 const ledger=world.buildingGoalRewards??={};
 const fresh=BUILDING_GOALS.filter(goal=>achieved.has(goal.id)&&!ledger[goal.id]);
 const recipients=Object.values(world.players).filter(p=>!p.spectator&&!!p.profile);
 if(!fresh.length||!recipients.length)return 0;
 for(const goal of fresh)ledger[goal.id]={completedAt:now,completedBy:Object.values(world.players).find(p=>p.life?.buildingGoals?.includes(goal.id))?.id??achiever.id,gold:goal.gold,recipients:recipients.map(p=>p.id)};
 const gold=fresh.reduce((total,goal)=>total+goal.gold,0);
 for(const p of recipients){
  grant(p,{remove:[],cards:[],gold,heal:0});
  p.message='3D建築の達成報酬を参加者全員に配布しました。';
 }
 return gold;
}
export interface BuildingMeasurement {
 width:number; depth:number; height:number; blocks:number;
 floor:boolean; roof:boolean; walls:boolean; entrance:boolean; usable:boolean;
}
export interface BuildingSurvey {checkedAt:number; revision:number; buildings:BuildingMeasurement[]}
type Cell = {x:number;y:number;z:number;block:string;key:string};
const keyOf=(x:number,y:number,z:number)=>`${x},${y},${z}`;
const structural=(block:unknown):block is string=>typeof block==='string' && Object.hasOwn(VOXEL_CATALOG,block) &&
 ['wood','stone','color','glass'].includes(VOXEL_CATALOG[block as keyof typeof VOXEL_CATALOG].group);
export const buildingComplete=(m:BuildingMeasurement)=>m.floor&&m.roof&&m.walls&&m.entrance&&m.usable;
export const buildingMeetsGoal=(m:BuildingMeasurement,goal:typeof BUILDING_GOALS[number])=>
 buildingComplete(m)&&m.width>=goal.dimensions[0]&&m.depth>=goal.dimensions[1]&&m.height>=goal.dimensions[2];

/** Only explicitly placed construction blocks count, never generated terrain or 2D houses. */
export function surveyBuildings(world:World, player:Adventurer, now:number):BuildingSurvey {
 const voxels=world.voxels, cells=new Map<string,Cell>();
 for(const [key,block] of Object.entries(voxels?.edits||{})) {
  if(!structural(block))continue;
  const coordinates=key.split(',').map(Number);
  if(coordinates.length!==3||!coordinates.every(Number.isInteger))continue;
  const [x,y,z]=coordinates;cells.set(key,{x,y,z,block,key});
  if(block==='door') {const upper=keyOf(x,y+1,z);if(!Object.hasOwn(voxels!.edits,upper))cells.set(upper,{x,y:y+1,z,block:'door-top',key:upper});}
 }
 const seen=new Set<string>(),buildings:BuildingMeasurement[]=[];
 const ownedDoors=new Set((world.voxelRooms||[]).filter(room=>room.owner===player.id).map(room=>keyOf(room.door.x,room.door.y,room.door.z)));
 for(const cell of cells.values()) {
  if(seen.has(cell.key))continue;
  const component:Cell[]=[cell];seen.add(cell.key);let own=false;
  for(let i=0;i<component.length;i++) {
   const c=component[i];if(voxels?.placedBy?.[c.key]===player.id||ownedDoors.has(c.key))own=true;
   for(const [dx,dy,dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
    const key=keyOf(c.x+dx,c.y+dy,c.z+dz),neighbor=cells.get(key);
    if(neighbor&&!seen.has(key)){seen.add(key);component.push(neighbor);}
   }
  }
  if(!own && !component.some(c=>voxels?.placedBy?.[c.key]) && component.some(c=>c.block==='door' && Math.hypot(c.x-(player.position3D?.x??player.x+.5),c.z-(player.position3D?.z??player.y+.5))<=6))own=true;
  if(!own)continue;
  let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  for(const c of component){minX=Math.min(minX,c.x);maxX=Math.max(maxX,c.x);minY=Math.min(minY,c.y);maxY=Math.max(maxY,c.y);minZ=Math.min(minZ,c.z);maxZ=Math.max(maxZ,c.z);}
  const width=maxX-minX+1,height=maxY-minY+1,depth=maxZ-minZ+1;
  const m:BuildingMeasurement={width,depth,height,blocks:component.length,floor:false,roof:false,walls:false,entrance:false,usable:false};
  buildings.push(m);if(width<3||height<4||depth<3||Math.max(width,height,depth)>64)continue;
  const at=(x:number,y:number,z:number)=>cells.get(keyOf(x,y,z))?.block;
  const support=(x:number,y:number,z:number)=>{const block=at(x,y,z);return !!block&&block!=='door'&&block!=='door-top'&&VOXEL_CATALOG[block as keyof typeof VOXEL_CATALOG]?.shape==='cube';};
  m.floor=true;m.roof=true;m.walls=true;
  for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){
   if(!support(x,minY,z))m.floor=false;if(!support(x,maxY,z))m.roof=false;
  }
  for(let y=minY+1;y<maxY;y++){
   for(let x=minX;x<=maxX;x++)if(!at(x,y,minZ)||!at(x,y,maxZ))m.walls=false;
   for(let z=minZ;z<=maxZ;z++)if(!at(minX,y,z)||!at(maxX,y,z))m.walls=false;
  }
  const doors=component.filter(c=>c.block==='door'&&c.y===minY+1&&(c.x===minX||c.x===maxX||c.z===minZ||c.z===maxZ));
  const open=(x:number,z:number)=>x>minX&&x<maxX&&z>minZ&&z<maxZ&&!solid(blockAt(world,x,minY+1,z))&&!solid(blockAt(world,x,minY+2,z))&&blockAt(world,x,minY+1,z)!=='door'&&blockAt(world,x,minY+2,z)!=='door-top';
  for(const door of doors){
   const start=[[door.x-1,door.z],[door.x+1,door.z],[door.x,door.z-1],[door.x,door.z+1]].find(([x,z])=>open(x,z));
   if(!start)continue;m.entrance=true;
   const room=[start],visited=new Set([`${start[0]},${start[1]}`]);
   for(let i=0;i<room.length;i++)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const x=room[i][0]+dx,z=room[i][1]+dz,key=`${x},${z}`;
    if(!visited.has(key)&&open(x,z)){visited.add(key);room.push([x,z]);}
   }
   if(room.length>=Math.max(4,Math.ceil((width-2)*(depth-2)/4)))m.usable=true;
  }
 }
 return {checkedAt:now,revision:voxels?.revision||0,buildings:buildings.sort((a,b)=>Number(buildingComplete(b))-Number(buildingComplete(a)) || b.width*b.depth*b.height-a.width*a.depth*a.height).slice(0,40)};
}
