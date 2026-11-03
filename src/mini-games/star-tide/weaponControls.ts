import type {World} from './engine';

export type WeaponSlot='a'|'b';

/** One owner per weapon gesture: an old finger/key release cannot fire a newer hold. */
export class WeaponControls {
 held:{slot:WeaponSlot;source:string}|null=null;
 constructor(private world:World){}
 press(slot:WeaponSlot,source:string,automatic=true){
  this.cancel();
  if(!this.world.beginCharge(slot==='b',automatic))return false;
  this.held={slot,source};
  return true;
 }
 release(source:string){
  if(this.held?.source!==source)return false;
  this.held=null;
  return this.world.releaseCharge();
 }
 cancel(source?:string){
  if(source!==undefined&&this.held?.source!==source)return;
  this.held=null;this.world.chargeHeld=false;this.world.chargeTime=0;
 }
}
