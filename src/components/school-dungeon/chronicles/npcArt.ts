import {assetUrl} from '../../../utils/assetPaths';
import {chronicleRoute} from './story';
const images=new Map<string,HTMLImageElement>();
export function loadChronicleNpc(mode:string){const id=chronicleRoute(mode).id.toLowerCase();let image=images.get(id);if(!image&&typeof Image!=='undefined'){image=new Image();image.src=assetUrl(`sprites/dungeons-chronicles/map-npc/${id}.webp`);images.set(id,image);}return image;}
/** The transparent sprite has a common foot anchor, with the same height as a traveler. */
export function drawChronicleNpc(ctx:CanvasRenderingContext2D,mode:string,x:number,y:number,size:number){
 const image=loadChronicleNpc(mode);ctx.save();ctx.imageSmoothingEnabled=false;
 if(image?.complete&&image.naturalWidth)ctx.drawImage(image,x-size*.1,y-size*.3,size*1.2,size*1.2);
 ctx.fillStyle='#fff6d2';ctx.strokeStyle='#51432b';ctx.lineWidth=1;
 ctx.beginPath();ctx.roundRect(x+size*.57,y-size*.35,size*.43,size*.3,size*.06);ctx.fill();ctx.stroke();
 ctx.fillStyle='#51432b';for(let i=0;i<3;i++)ctx.fillRect(x+size*(.65+i*.1),y-size*.23,size*.035,size*.035);
 ctx.restore();
}
