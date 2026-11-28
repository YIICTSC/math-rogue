import type { Adventurer, World } from '../engine';
import type { CreatureFacing } from '../lifestyle/creatureArt';
import { floorAt, playerHeight, voxelWater } from '../voxel';
import type { FarmPlayer } from './model';

export function walkingPet(w:World,owner:Adventurer,farm:FarmPlayer){
  const pet=farm.pets.find(candidate=>candidate.id===farm.activePet);
  if(!pet||owner.life?.indoors||owner.spectator||owner.nativeScene||pet.awayUntil>w.life.time)return null;
  const x=Math.floor(owner.position3D?.x??owner.x),z=Math.floor(owner.position3D?.z??owner.y);
  const level=playerHeight(w,owner);
  const spots:readonly [number,number,CreatureFacing][]=[[-1,0,'right'],[0,1,'back'],[1,0,'left'],[0,-1,'front']];
  for(const [dx,dz,facing] of spots){
    const y=floorAt(w,x+dx,z+dz,level+.9,level-1);
    if(y===null||voxelWater(w,x+dx,z+dz,y))continue;
    return {pet,x:x+dx+.5,y,z:z+dz+.5,facing,walk:w.life.now-owner.lastMove<700};
  }
  return null;
}
