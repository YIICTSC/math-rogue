import {actionPoseFrame} from '../student/actionGeometry';
import {studentPoseAtlas} from '../dungeons1/poseAtlas';
import {D1_ACTION_ROWS} from '../dungeons1/actionLayout';
import {useCanonicalD2Pose} from './directionPolicy';
import {D2_ACTION_LAYOUT} from '../../../data/dungeons2HeroActionLayout';
import {assetUrl} from '../../../utils/assetPaths';
export const D2_ACTIONS=['walk-left','walk-right','attack','throw','swing','read','use','shoot'] as const;
export type D2HeroAction='walk'|'attack'|'throw'|'swing'|'read'|'use'|'shoot';
const clock=()=>typeof performance==='undefined'?Date.now():performance.now();
export const D2_ACTION_CELL=96,D2_ACTION_ANCHOR=94;
const motions=new Map<string,{action:D2HeroAction;started:number;duration:number;step:number}>(),steps=new Map<string,number>(),images=new Map<string,HTMLImageElement>();
const durations:Record<D2HeroAction,number>={walk:320,attack:340,throw:440,swing:480,read:760,use:640,shoot:440};
export const d2ActionUrl=(id:string,transformed=false)=>assetUrl(`sprites/dungeons2/actions/${id.replace('dungeons2-','')}${transformed?'-transformed':''}.webp`);
export function cueD2HeroAction(id:string,action:D2HeroAction){if(!id.startsWith('dungeons2-'))return;const step=(steps.get(id)||0)+(action==='walk'?1:0);steps.set(id,step);motions.set(id,{action,started:clock(),duration:durations[action],step});}
export function d2HeroActionSnapshot(id:string,now=clock()){
 const m=motions.get(id);if(!m||now-m.started>=m.duration)return null;
 const row=m.action==='walk'?(m.step+Math.floor((now-m.started)/100))%2:D2_ACTIONS.indexOf(m.action);
 return {...m,row,progress:Math.max(0,(now-m.started)/m.duration)};
}
export function loadD2HeroActions(id:string,transformed=false){if(typeof Image==='undefined'||!id.startsWith('dungeons2-'))return;const key=id+(transformed?'-transformed':'');let img=images.get(key);if(!img){img=new Image();img.src=d2ActionUrl(id,transformed);images.set(key,img);}return img;}
export function drawD2HeroAction(ctx:CanvasRenderingContext2D,id:string,frame:number,x:number,y:number,size:number,transformed=false,source?:HTMLImageElement){
 const motion=d2HeroActionSnapshot(id);if(!motion)return false;
 if(useCanonicalD2Pose(id,transformed,frame,motion.action)){
  if(!source){const key=id+(transformed?'-transformed':'')+':directions';source=images.get(key);if(!source){source=new Image();source.src=assetUrl(`sprites/dungeons2/${id.replace('dungeons2-','')}${transformed?'-transformed':''}-directions.webp`);images.set(key,source);}}
  if(!source.complete||!source.naturalWidth)return false;
  const atlas=studentPoseAtlas(id,source,transformed);if(!atlas)return false;
  const [start]=D1_ACTION_ROWS[motion.action];
  const pose=start+actionPoseFrame(motion.action,motion.progress,motion.step);
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(atlas,frame*96,pose*96,96,96,Math.round(x-size*.25),Math.round(y-size*.25),size*1.5,size*1.5);ctx.restore();return true;
 }
 const img=loadD2HeroActions(id,transformed);if(!img?.complete||!img.naturalWidth)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;
 const bob=motion.action==='walk'?Math.sin(motion.progress*Math.PI*4)*size*.018:0;
 const baseline=D2_ACTION_LAYOUT[id.replace('dungeons2-','')+(transformed?'-transformed':'')]?.baseline||124;
 ctx.drawImage(img,frame*D2_ACTION_CELL,motion.row*D2_ACTION_CELL,D2_ACTION_CELL,D2_ACTION_CELL,x-size*.25,y+size*(baseline*.5-D2_ACTION_ANCHOR)/64+bob,size*1.5,size*1.5);ctx.restore();return true;
}
