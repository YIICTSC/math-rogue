import type { Adventurer, World } from './engine';
import { lifePlayer } from './life';
import { ridingCart } from './machinery';
import { isGatePart } from './machineryParts';
import { sandboxAllows } from './sandboxAccess';
import { ALL_MATERIAL_NAMES, type VoxelItem } from './voxelCatalog';
import { blockAt, bodyClear, floorAt, playerHeight, voxelWater } from './voxel';
import { visibleWildlife } from './lifestyle/wildlife';
import { legacyRegion } from './worldLandscape';

export const PACK_SPECIES={
  horse:{feed:'hay',speed:5.3,slots:6},
  donkey:{feed:'hay',speed:4.35,slots:12},
  camel:{feed:'herb',speed:4.65,slots:10},
} as const;
type PackKind=keyof typeof PACK_SPECIES;
type Position={x:number;y:number;z:number};
type Stock=Partial<Record<VoxelItem,number>>;
export type PackAnimal=Position & {
  id:string;kind:PackKind;owner:string;name?:string;rider?:string;follow:boolean;dir:number;cargo:Stock;fedAt:number;
};
export type PackTraining={id:string;feeds:number;at:number};
export type PackAction={type:'voxel-pack-animal';id:string}&(
  | {command:'feed'|'mount'|'dismount'|'follow'}
  | {command:'name';name:string}
  | {command:'cargo';item:VoxelItem;amount:number;direction:'load'|'unload'}
);

const compass=[{dx:0,dz:-1},{dx:1,dz:0},{dx:0,dz:1},{dx:-1,dz:0}];
const tameDistance=2.7, saddle=1.08;
const paused=new WeakMap<World,number>();
const validKind=(kind:string):kind is PackKind=>Object.hasOwn(PACK_SPECIES,kind);
export const packAnimals=(w:World)=>Object.values(w.packAnimals??{});
export const ridingAnimal=(w:World,id:string)=>w.packAnimals&&packAnimals(w).find(animal=>animal.rider===id);
export const ownedPackAnimal=(w:World,id:string)=>w.packAnimals&&packAnimals(w).find(animal=>animal.owner===id);
const point=(w:World,p:Adventurer):Position=>({x:p.position3D?.x??p.x+.5,y:playerHeight(w,p),z:p.position3D?.z??p.y+.5});
const distance=(a:Position,b:Position)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export const nearPackAnimal=(w:World,p:Adventurer,animal:PackAnimal)=>distance(point(w,p),animal)<=tameDistance;

export function packFeedCandidates(w:World,p:Adventurer) {
  if (!w.started||w.gameMode!=='COOP'||p.life?.indoors||p.spectator||ownedPackAnimal(w,p.id)) return [];
  const pos=point(w,p);
  return visibleWildlife(w,pos.x,pos.z,tameDistance,pos.y).filter(animal=>validKind(animal.kind)&&distance(pos,animal)<=tameDistance);
}

function stableStep(w:World,x:number,z:number,y:number) {
  const tx=Math.floor(x),tz=Math.floor(z);
  if(!legacyRegion(tx,tz))return null;
  const ground=floorAt(w,tx,tz,y+1);
  if(ground===null||y-ground>1.2||!bodyClear(w,tx,tz,ground,ground+2.75))return null;
  if(ground>=y+.95&&isGatePart(blockAt(w,tx,Math.floor(ground-.01),tz)))return null;
  const pool=voxelWater(w,tx,tz,ground);
  return pool&&ground<pool.surface?null:{x,y:ground,z};
}

function setRider(p:Adventurer,animal:PackAnimal,surface2D=p.position3D?.surface2D??true) {
  p.position3D={x:animal.x,y:animal.y+saddle,z:animal.z,surface2D,layered2D:surface2D};
  p.x=Math.floor(animal.x);
  p.y=Math.floor(animal.z);
}

function moveAnimal(w:World,animal:PackAnimal,dx:number,dz:number) {
  const tx=animal.x+dx,tz=animal.z+dz;
  if(!stableStep(w,animal.x+dx/2,animal.z+dz/2,animal.y))return false;
  const spot=stableStep(w,tx,tz,animal.y);
  if(!spot||packAnimals(w).some(other=>other!==animal&&distance(spot,other)<.8))return false;
  Object.assign(animal,spot,{dir:Math.atan2(dx,-dz)});
  return true;
}

export function steerPackAnimal(w:World,p:Adventurer,dx:number,dz:number,continuous:boolean,now:number) {
  const animal=ridingAnimal(w,p.id);
  if(!animal)return false;
  const length=Math.hypot(dx,dz);
  if(!Number.isFinite(length)||length<=0||
    (continuous?length>.45||now-p.lastMove<45:!Number.isInteger(dx)||!Number.isInteger(dz)||length!==1||now-p.lastMove<118))return false;
  const info=PACK_SPECIES[animal.kind], fresh=w.life.time-animal.fedAt<4*60;
  const stride=info.speed*(fresh?1:.78)*(Object.keys(animal.cargo).length>=info.slots*.75?.84:1);
  const step=continuous?Math.min(.5,stride*Math.min(.12,(now-p.lastMove)/1000)):Math.min(.89,stride*.18);
  if(!moveAnimal(w,animal,dx/length*step,dz/length*step))return false;
  setRider(p,animal,!continuous);
  p.lastMove=now;p.moveCount++;w.revision++;
  return true;
}

function dismount(w:World,p:Adventurer,animal:PackAnimal) {
  const x=Math.floor(animal.x),z=Math.floor(animal.z);
  for(const {dx,dz} of compass){
    const spot=stableStep(w,x+dx+.5,z+dz+.5,animal.y);
    if(!spot)continue;
    const surface2D=p.position3D?.surface2D??true;
    p.position3D={...spot,surface2D,layered2D:surface2D};
    p.x=x+dx;p.y=z+dz;
    delete animal.rider;
    return true;
  }
  return false;
}

export function applyPackAction(w:World,p:Adventurer,action:PackAction,now:number,otherVehicle:boolean) {
  if(w.gameMode!=='COOP'||!w.started||w.ended||p.spectator||otherVehicle||ridingCart(w,p.id)||
    now-(p.transportAt??0)<300||typeof action.id!=='string'||action.id.length>64)return false;
  const animal=ownedPackAnimal(w,p.id),bag=lifePlayer(p).bag, pos=point(w,p);
  if(!animal) {
    if(action.command!=='feed'||packAnimals(w).length>=40)return false;
    const wild=packFeedCandidates(w,p).find(entry=>entry.id===action.id);
    if(!wild||!validKind(wild.kind))return false;
    const feed=PACK_SPECIES[wild.kind].feed;
    if(!bag[feed]||p.packTraining?.id===wild.id&&now-p.packTraining.at<2600)return false;
    const feeds=(p.packTraining?.id===wild.id?p.packTraining.feeds:0)+1;
    bag[feed]--;
    if(feeds>=3){
      (w.packAnimals??={})[wild.id]={id:wild.id,kind:wild.kind,owner:p.id,x:wild.x,y:wild.y,z:wild.z,
        follow:true,dir:0,fedAt:w.life.time,cargo:{}};
      delete p.packTraining;
    } else p.packTraining={id:wild.id,feeds,at:now};
  } else {
    if(action.id!==animal.id||distance(pos,animal)>tameDistance)return false;
    const region={x:Math.floor(animal.x),y:Math.floor(animal.y),z:Math.floor(animal.z)};
    if(action.command!=='dismount'&&!sandboxAllows(w,p.id,region,action.command==='cargo'?'storage':'cart',p.id))return false;
    if(action.command==='mount') {
      if(animal.rider||!stableStep(w,animal.x,animal.z,animal.y))return false;
      animal.rider=p.id;
      setRider(p,animal);
    } else if(action.command==='dismount') {
      if(animal.rider!==p.id||!dismount(w,p,animal))return false;
    } else if(action.command==='follow') animal.follow=!animal.follow;
    else if(action.command==='feed') {
      const feed=PACK_SPECIES[animal.kind].feed;
      if(!bag[feed]||w.life.time-animal.fedAt<3)return false;
      bag[feed]--;animal.fedAt=w.life.time;
    } else if(action.command==='name') {
      if(typeof action.name!=='string'||action.name.length>18||/[\u0000-\u001f\u007f]/.test(action.name))return false;
      animal.name=action.name.trim()||undefined;
    } else if(action.command==='cargo') {
      if(!Object.hasOwn(ALL_MATERIAL_NAMES,action.item)||!Number.isSafeInteger(action.amount)||action.amount<1||action.amount>64||
        !['load','unload'].includes(action.direction))return false;
      const {item,amount,direction}=action;
      const from=direction==='load'?bag:animal.cargo, to=direction==='load'?animal.cargo:bag;
      if((from[item]??0)<amount||direction==='load'&&((to[item]??0)+amount>64||
        !to[item]&&Object.keys(to).length>=PACK_SPECIES[animal.kind].slots))return false;
      from[item]=from[item]!-amount;
      if(!from[item])delete from[item];
      to[item]=(to[item]??0)+amount;
    } else return false;
  }
  p.transportAt=now;
  w.revision++;
  return true;
}

export function advancePackAnimals(w:World,now:number) {
  if(!w.started||w.ended||!w.packAnimals||now-(paused.get(w)??0)<330)return;
  paused.set(w,now);
  for(const animal of packAnimals(w)){
    const owner=w.players[animal.owner];
    if(!owner||owner.nativeScene||owner.life?.indoors){
      if(animal.rider){delete animal.rider;w.revision++;}
      continue;
    }
    if(owner.spectator||animal.rider||!animal.follow)continue;
    const target=point(w,owner), l=Math.hypot(target.x-animal.x,target.z-animal.z);
    if(l<1.65||l>16||Math.abs(target.y-animal.y)>4)continue;
    const mx=(target.x-animal.x)/l*.68,mz=(target.z-animal.z)/l*.68;
    if(moveAnimal(w,animal,mx,mz)||Math.abs(mx)>.1&&moveAnimal(w,animal,mx,0)||Math.abs(mz)>.1&&moveAnimal(w,animal,0,mz)) w.revision++;
  }
}

export function restorePackAnimals(w:World) {
  if(!w.packAnimals)return;
  const animals:World['packAnimals']={}, owners=new Set<string>();
  for(const [id,animal] of Object.entries(w.packAnimals).slice(0,40)) {
    if(!/^wild-[-\d]+-[-\d]+:(horse|donkey|camel)$/.test(id)||!animal||!validKind(animal.kind)||id!==animal.id||
      typeof animal.owner!=='string'||owners.has(animal.owner)||![animal.x,animal.y,animal.z,animal.dir].every(Number.isFinite)||!legacyRegion(animal.x,animal.z))continue;
    const cargo=Object.fromEntries(Object.entries(animal.cargo??{}).filter(([item,quantity])=>
      Object.hasOwn(ALL_MATERIAL_NAMES,item)&&Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=64).slice(0,PACK_SPECIES[animal.kind].slots));
    const owner=w.players[animal.owner], rider=animal.rider===animal.owner&&owner&&!owner.spectator&&!owner.gliding&&
      !Object.values(w.transport?.boats??{}).some(boat=>boat.rider===owner.id)&&!ridingCart(w,owner.id)&&distance(point(w,owner),animal)<2;
    animals[id]={...animal,cargo,rider:rider?animal.owner:undefined,follow:animal.follow===true,
      name:typeof animal.name==='string'?animal.name.slice(0,18):undefined,
      fedAt:Number.isFinite(animal.fedAt)?Math.min(w.life.time,animal.fedAt):w.life.time};
    owners.add(animal.owner);
  }
  w.packAnimals=animals;
}
