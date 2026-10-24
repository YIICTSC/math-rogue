import {assetUrl} from '../../../utils/assetPaths';
import {studentActionSnapshot,D1_ACTION_CELL} from './heroActions';
import {studentPoseAtlas} from './poseAtlas';
import {D1_HERO_ACTION_KEYS} from '../../../data/dungeons1HeroActionKeys';
const paintedAtlases=new Map<string,HTMLImageElement>();
const MAX_PAINTED_ATLASES=8;
export function loadD1HeroArt(id:string,transformed=false){
 const key=id+(transformed&&id.startsWith('magic-')?'-transformed':'');
 if(!D1_HERO_ACTION_KEYS.has(key)||typeof Image==='undefined')return;
 let image=paintedAtlases.get(key);
 if(image){paintedAtlases.delete(key);paintedAtlases.set(key,image);return image;}
 image=new Image();image.src=assetUrl(`sprites/dungeons1/actions/${key}.webp`);
 paintedAtlases.set(key,image);
 if(paintedAtlases.size>MAX_PAINTED_ATLASES)paintedAtlases.delete(paintedAtlases.keys().next().value!);
 return image;
}
/** Artwork is bottom-centered and drawn at integer pixel coordinates. */
export function drawD1HeroAction(ctx:CanvasRenderingContext2D,id:string,source:HTMLImageElement,facing:number,x:number,y:number,size:number,transformed=false){
 const motion=studentActionSnapshot(id);if(!motion)return false;
 const painted=loadD1HeroArt(id,transformed);
 ctx.save();ctx.imageSmoothingEnabled=false;
 // The painted atlas has the same 8-direction order as the legacy hero sheets.
 if(painted?.complete&&painted.naturalWidth){
  const row=motion.action==='walk'?motion.frame<3?0:1:({attack:2,throw:3,swing:4,read:5,use:6,shoot:7})[motion.action];
  ctx.drawImage(painted,facing*96,row*96,96,96,Math.round(x-size*.25),Math.round(y-size*.25),size*1.5,size*1.5);
 }else{
  const atlas=studentPoseAtlas(id,source,transformed);
  if(!atlas){ctx.restore();return false;}
  ctx.drawImage(atlas,facing*D1_ACTION_CELL,motion.row*D1_ACTION_CELL,D1_ACTION_CELL,D1_ACTION_CELL,Math.round(x-size*.25),Math.round(y-size*.25),size*1.5,size*1.5);
 }
 ctx.restore();return true;
}
