import {assetUrl} from '../../../utils/assetPaths';
export const D2_ACTIONS=['walk-1','walk-2','walk-3','walk-4','attack-ready','attack-release','throw-ready','throw-release','swing-ready','swing-release','read-1','read-2','use-1','use-2','shoot-ready','shoot-release'] as const;
export type D2HeroAction='walk'|'attack'|'throw'|'swing'|'read'|'use'|'shoot';
const clock=()=>typeof performance==='undefined'?Date.now():performance.now();
export const D2_ACTION_CELL=96,D2_ACTION_ANCHOR=88;
const motions=new Map<string,{action:D2HeroAction;started:number;duration:number;step:number}>(),steps=new Map<string,number>(),images=new Map<string,HTMLImageElement>();
const durations:Record<D2HeroAction,number>={walk:360,attack:380,throw:440,swing:480,read:760,use:640,shoot:440};
const rows:Record<D2HeroAction,number>={walk:0,attack:4,throw:6,swing:8,read:10,use:12,shoot:14};
export const d2ActionUrl=(id:string,transformed=false)=>assetUrl(`sprites/dungeons2/animations/${id.replace('dungeons2-','')}${transformed?'-transformed':''}.webp`);
export function cueD2HeroAction(id:string,action:D2HeroAction){if(!id.startsWith('dungeons2-'))return;const step=(steps.get(id)||0)+(action==='walk'?1:0);steps.set(id,step);motions.set(id,{action,started:clock(),duration:durations[action],step});}
export function clearD2HeroAction(id:string){motions.delete(id);steps.delete(id);}
export function d2HeroActionSnapshot(id:string,now=clock()){
 const m=motions.get(id);if(!m||now<m.started||now-m.started>=m.duration)return null;
 const progress=Math.max(0,(now-m.started)/m.duration),frame=m.action==='walk'?(m.step*2+Math.floor(progress*4))%4:Math.min(1,Math.floor(progress*2));
 return {...m,row:rows[m.action]+frame,frame,progress};
}
export function loadD2HeroActions(id:string,transformed=false){if(typeof Image==='undefined'||!id.startsWith('dungeons2-'))return;const key=id+(transformed?'-transformed':'');let img=images.get(key);if(!img){img=new Image();img.src=d2ActionUrl(id,transformed);images.set(key,img);}return img;}
/** Every frame is dedicated ImageGen artwork. No body cutting, mirroring or procedural poses. */
export function drawD2HeroAction(ctx:CanvasRenderingContext2D,id:string,facing:number,x:number,y:number,size:number,transformed=false,_source?:HTMLImageElement){
 const motion=d2HeroActionSnapshot(id);
 // The animation atlas contains action poses, not idle poses. Let the caller
 // draw the regular directional standing sprite once the action has finished.
 if(!motion)return false;
 const image=loadD2HeroActions(id,transformed);if(!image?.complete||!image.naturalWidth)return false;
 const row=motion.row;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,facing*96,row*96,96,96,Math.round(x-size*.25),Math.round(y-size*.375),size*1.5,size*1.5);ctx.restore();return true;
}
