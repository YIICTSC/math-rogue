import {assetUrl} from '../../../utils/assetPaths';
import {isProtagonistId,studentHero} from './content';
const atlases=new Map<string,HTMLImageElement>();
export function studentSpriteUrl(id:string,transformed=false){return assetUrl(`sprites/wandering-student/${studentHero(id).id}${transformed&&id.startsWith('magic-')?'-transformed':''}.webp`);}
export function loadStudentSprite(id:string,transformed=false){if(typeof Image==='undefined'||!isProtagonistId(id))return;const key=id+(transformed&&id.startsWith('magic-')?'-transformed':'');let image=atlases.get(key);if(!image){image=new Image();image.src=studentSpriteUrl(id,transformed);atlases.set(key,image);}return image;}
export function studentDirection(dir:{x:number;y:number}){const x=Math.sign(dir.x),y=Math.sign(dir.y);return y>0?(x>0?4:x<0?5:0):y<0?(x>0?6:x<0?7:1):x>0?2:x<0?3:0;}
export function drawStudentSprite(ctx:CanvasRenderingContext2D,id:string,dir:{x:number;y:number},x:number,y:number,size:number,transformed=false){const image=loadStudentSprite(id,transformed);if(!image?.complete||!image.naturalWidth)return false;const index=studentDirection(dir),w=image.naturalWidth/4,h=image.naturalHeight/2;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,index%4*w,Math.floor(index/4)*h,w,h,x,y,size,size);ctx.restore();return true;}
