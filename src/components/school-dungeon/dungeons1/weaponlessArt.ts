import {assetUrl} from '../../../utils/assetPaths';
import {D1_HERO_ACTION_KEYS} from '../../../data/dungeons1HeroActionKeys';
import type {CombatPose} from './mastery';
const images=new Map<string,HTMLImageElement>();
export const COMBAT_POSES:CombatPose[]=['slash','cleave','thrust','kick'];
export function loadWeaponlessArt(id:string,transformed=false){
 const key=id+(transformed&&id.startsWith('magic-')?'-transformed':'');
 if(!D1_HERO_ACTION_KEYS.has(key)||typeof Image==='undefined')return;
 let image=images.get(key);if(image){images.delete(key);images.set(key,image);return image;}
 image=new Image();image.src=assetUrl(`sprites/dungeons1/martial/${key}.webp`);images.set(key,image);if(images.size>8)images.delete(images.keys().next().value!);return image;
}
/** Four independently illustrated gestures, shared by every weapon. Face toward the target. */
export function drawWeaponlessArt(ctx:CanvasRenderingContext2D,id:string,transformed:boolean,pose:CombatPose,facing:number,x:number,y:number,size:number,progress:number){
 const image=loadWeaponlessArt(id,transformed);if(!image?.complete||!image.naturalWidth)return false;
 const mirror=[3,5,7].includes(facing),anticipation=Math.sin(progress*Math.PI)*size*.05;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x+size/2+(mirror?-anticipation:anticipation)),Math.round(y+size/2));if(mirror)ctx.scale(-1,1);
 ctx.drawImage(image,COMBAT_POSES.indexOf(pose)*96,0,96,96,-size*.75,-size*.75,size*1.5,size*1.5);ctx.restore();return true;
}
