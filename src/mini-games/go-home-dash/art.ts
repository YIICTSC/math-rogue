import { ART_FRAMES } from './artFrames';
export type ArtSheet = 'items' | 'hazards' | 'enemies';
export type ArtImages = Partial<Record<ArtSheet,HTMLImageElement>>;
export type ArtKey = keyof typeof ART_FRAMES;
// Source rectangles are the normalized visible bounds, excluding atlas gutters.
export function drawArt(ctx:CanvasRenderingContext2D,images:ArtImages|undefined,key:ArtKey,x:number,y:number,width:number,height:number,fit:'contain'|'stretch'='contain') {
 const frame=ART_FRAMES[key],image=images?.[frame.sheet];
 if(!image?.complete||!image.naturalWidth)return false;
 if(fit==='contain'){
  const scale=Math.min(width/frame.width,height/frame.height),w=frame.width*scale,h=frame.height*scale;
  x+=(width-w)/2;y+=(height-h)/2;width=w;height=h;
 }
 ctx.drawImage(image,frame.x,frame.y,frame.width,frame.height,x,y,width,height);return true;
}
export function drawSlide(ctx:CanvasRenderingContext2D,image:HTMLImageElement|null,p:{x:number;y:number},frame:number) {
 if(!image?.complete||!image.naturalWidth)return false;
 const index=Math.floor(frame/9)%2;
 ctx.drawImage(image,index*160,0,160,80,p.x-56,p.y-51.8,112,56);return true;
}
