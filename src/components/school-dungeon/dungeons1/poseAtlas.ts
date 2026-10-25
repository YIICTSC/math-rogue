import {actionGeometry} from '../student/actionGeometry';
import {D1_ACTION_CELL,D1_ACTION_ROWS,type StudentAction} from './actionLayout';

const CELL=D1_ACTION_CELL;
// A small LRU keeps transformed forms and hero selection from accumulating canvases.
const cache=new Map<string,HTMLCanvasElement>();
const MAX_ATLASES=4;
const unreadable=new WeakSet<HTMLImageElement>();
const canvas=(w:number,h:number)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const context=(c:HTMLCanvasElement)=>{const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;return ctx;};
/** Build articulated poses from the shipped eight-direction artwork. All pixels,
 * costume colors and proportions come from that hero, including transformed forms.
 * No per-frame resampling, allocations or pixel reads happen in the draw loop. */
export function studentPoseAtlas(id:string,image:HTMLImageElement,transformed=false){
 if(unreadable.has(image))return undefined;
 const key=id+(transformed?':transformed':'');const existing=cache.get(key);
 if(existing){cache.delete(key);cache.set(key,existing);return existing;}
 const atlas=canvas(CELL*8,CELL*24),out=context(atlas),sw=image.naturalWidth/4,sh=image.naturalHeight/2;
 for(let facing=0;facing<8;facing++){
  const source=canvas(64,64),s=context(source);
  s.drawImage(image,facing%4*sw,Math.floor(facing/4)*sh,sw,sh,0,0,64,64);
  let pixels:Uint8ClampedArray;
  try{pixels=s.getImageData(0,0,64,64).data;}catch{unreadable.add(image);return undefined;}
  let left=64,right=0,top=64,bottom=0;
  for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(pixels[(y*64+x)*4+3]>80){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(left>right)continue;
  const height=bottom-top+1,width=right-left+1,hip=Math.round(top+height*.75),shoulder=Math.round(top+height*.43),center=Math.round((left+right)/2);
  const armWidth=Math.max(3,Math.round(width*.23)),armHeight=hip-shoulder;
  const skin=sample(pixels,center,Math.round(top+height*.34),'#efb78f');
  const sleeve=sample(pixels,left+armWidth-1,shoulder+2,'#eee9da');
  for(const [action,[start,count]]of Object.entries(D1_ACTION_ROWS) as [StudentAction,readonly[number,number]][]){
   for(let frame=0;frame<count;frame++){
    const pose=canvas(CELL,CELL),p=context(pose),ox=16,oy=16;
    const phase=action==='walk'?Math.sin(frame/6*Math.PI*2):frame===1?1:0;
    const geometry=actionGeometry(facing,frame,action);
    const facingLeft=[3,5,7].includes(facing),side=facingLeft?-1:1;
    const bob=action==='walk'?(frame%3===1?-1:0):frame===1?-1:0;
    p.save();p.translate(ox,oy);
    if(action!=='walk'&&geometry.behind)prop(p,action,frame,center,shoulder,hip,side,skin,sleeve,facing);
    // Alternating feet are separately posed; their shared baseline prevents skating.
    const strideX=action==='walk'?Math.round(phase*geometry.x*2):0;
    const strideY=action==='walk'?Math.round(phase*geometry.y*1.5):0;
    p.drawImage(source,0,hip,center,64-hip,-strideX,hip-strideY,center,64-hip);
    p.drawImage(source,center,hip,64-center,64-hip,center+strideX,hip+strideY,64-center,64-hip);
    if(action==='walk'){
     p.drawImage(source,0,0,64,hip,0,bob,64,hip);
    }else{
     // Preserve the head and central costume, then articulate each original arm
     // around its shoulder rather than stretching the complete character image.
     p.drawImage(source,0,0,64,shoulder,0,bob,64,shoulder);
     p.drawImage(source,left+armWidth,shoulder,width-armWidth*2,hip-shoulder,left+armWidth,shoulder+bob,width-armWidth*2,hip-shoulder);
     const reachAngle=geometry.angle-Math.PI/2;
     const angles=action==='read'?[-.7,.7]:action==='use'?[0,side*(frame===1?1.7:.9)]:[reachAngle*.3,reachAngle*.3];
     for(let arm=0;arm<2;arm++){
      const ax=arm?right-armWidth+1:left,pivot=arm?ax:ax+armWidth;
      p.save();p.translate(pivot,shoulder+bob);p.rotate(angles[arm]);
      p.drawImage(source,ax,shoulder,armWidth,armHeight,arm?0:-armWidth,0,armWidth,armHeight);p.restore();
     }
     // A readable prop silhouette distinguishes actions at a 48px game tile.
     if(!geometry.behind)prop(p,action,frame,center,shoulder,hip,side,skin,sleeve,facing);
    }
    // Raised arms must not overwrite the directional face/hair reference.
    if(action!=='walk')p.drawImage(source,0,0,64,shoulder,0,bob,64,shoulder);
    p.restore();out.drawImage(pose,facing*CELL,(start+frame)*CELL);
   }
  }
 }
 cache.set(key,atlas);if(cache.size>MAX_ATLASES)cache.delete(cache.keys().next().value!);return atlas;
}
function sample(data:Uint8ClampedArray,x:number,y:number,fallback:string){const i=(Math.max(0,Math.min(63,y))*64+Math.max(0,Math.min(63,x)))*4;return data[i+3]>160?`rgb(${data[i]},${data[i+1]},${data[i+2]})`:fallback;}
function prop(p:CanvasRenderingContext2D,action:StudentAction,frame:number,cx:number,shoulder:number,hip:number,side:number,skin:string,sleeve:string,facing:number){
 const rect=(x:number,y:number,w:number,h:number,color:string)=>{p.fillStyle=color;p.fillRect(Math.round(x),Math.round(y),w,h);};
 const hand=(x:number,y:number)=>{rect(x-1,y-1,4,4,'#302c3e');rect(x,y,2,2,skin);};
 const g=actionGeometry(facing,frame,action);
 const originY=shoulder+7;
 if(action==='read'){
  // The book follows the chest plane; north-facing props are drawn behind the torso.
  const width=g.x===0?20:14,x=cx+g.x*7-width/2,y=originY+g.y*4;
  rect(x-1,y-1,width+2,12,'#202b46');rect(x,y,width/2-1,9,'#eee3b7');rect(x+width/2,y,width/2,9,'#fff0cd');
  rect(x+width/2-1,y,2,10,'#a78452');hand(x-2,y+7);hand(x+width,y+7);
 }else if(action==='use'){
  const x=cx+g.x*9+(g.x===0?6:0),y=originY+g.y*4-(frame===1?10:4);
  rect(x-2,y,6,9,'#27374b');rect(x-1,y+3,4,5,'#66d8af');rect(x,y+3,1,3,'#ccffe7');rect(x,y-2,2,3,'#d5b47b');hand(x-2,y+7);
 }else{
  // Draw in a local forward/right basis: the projectile and weapon travel along
  // the same eight-direction vector as movement, including north and south.
  const x=cx+g.x*g.reach,y=originY+g.y*g.reach*.7;
  const armSteps=Math.max(1,Math.ceil(g.reach));
  for(let i=3;i<armSteps;i++){const t=i/armSteps;rect(cx+(x-cx)*t-1,originY+(y-originY)*t-1,3,3,sleeve);}
  hand(x,y);
  p.save();p.translate(Math.round(x),Math.round(y));p.rotate(g.angle);
  if(action==='throw'){
   if(frame!==2){rect(-2,-2,5,5,'#34434f');rect(-1,-2,3,2,'#b8c9cf');}
  }else if(action==='shoot'){
   rect(-7,-1,17,2,'#e5f2ee');rect(5,-3,3,6,'#a3c8d2');rect(-7,-3,3,6,'#7195ae');
  }else{
   rect(0,-2,20,4,'#332b3b');rect(1,-1,18,2,action==='swing'?'#91b3d5':'#e5b963');rect(2,-1,14,1,'#fff0b6');rect(-1,-4,2,8,'#946b46');rect(-6,-1,5,2,'#654337');
   if(action==='swing'){rect(18,-3,6,6,'#385a89');rect(19,-2,4,4,'#9ef0e5');}
  }
  p.restore();
 }
}
