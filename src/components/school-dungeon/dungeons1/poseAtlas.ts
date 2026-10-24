import {D1_ACTION_CELL,D1_ACTION_ROWS,type StudentAction} from './heroActions';

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
    const facingLeft=[3,5,7].includes(facing),side=facingLeft?-1:1;
    const bob=action==='walk'?(frame%3===1?-1:0):frame===1?-1:0;
    p.save();p.translate(ox,oy);
    // Alternating feet are separately posed; their shared baseline prevents skating.
    const stride=action==='walk'?Math.round(phase*2):action==='attack'&&frame===1?side*2:0;
    p.drawImage(source,0,hip,center,64-hip,-stride,hip,center,64-hip);
    p.drawImage(source,center,hip,64-center,64-hip,center+stride,hip,64-center,64-hip);
    if(action==='walk'){
     p.drawImage(source,0,0,64,hip,0,bob,64,hip);
    }else{
     // Preserve the head and central costume, then articulate each original arm
     // around its shoulder rather than stretching the complete character image.
     p.drawImage(source,0,0,64,shoulder,0,bob,64,shoulder);
     p.drawImage(source,left+armWidth,shoulder,width-armWidth*2,hip-shoulder,left+armWidth,shoulder+bob,width-armWidth*2,hip-shoulder);
     const angles=action==='read'?[-.7,.7]:action==='use'?[0,side*1.7]:action==='throw'?[0,side*(frame===0?-1.6:frame===1?1.5:.3)]:action==='shoot'?[-.9,.9]:[0,side*(frame===0?-1.5:frame===1?1.4:.2)];
     for(let arm=0;arm<2;arm++){
      const ax=arm?right-armWidth+1:left,pivot=arm?ax:ax+armWidth;
      p.save();p.translate(pivot,shoulder+bob);p.rotate(angles[arm]);
      p.drawImage(source,ax,shoulder,armWidth,armHeight,arm?0:-armWidth,0,armWidth,armHeight);p.restore();
     }
     // A readable prop silhouette distinguishes actions at a 48px game tile.
     prop(p,action,frame,center,shoulder,hip,side,skin,sleeve,facing);
    }
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
 const front=facing!==1&&facing!==6&&facing!==7;
 if(action==='read'){
  const y=shoulder+5;
  rect(cx-11,y,22,13,'#202b46');rect(cx-10,y,9,10,'#eee3b7');rect(cx+1,y,9,10,'#fff0cd');rect(cx-1,y,2,12,'#a78452');
  for(let i=0;i<3;i++){rect(cx-8,y+2+i*3,5,1,'#9a9a96');rect(cx+3,y+2+i*3,5,1,'#a1a5a4');}
  hand(cx-11,y+7);hand(cx+10,y+7);
 }else if(action==='use'){
  const x=cx+side*7,y=shoulder-3+(frame===1?-3:2);
  rect(x-2,y,6,9,'#27374b');rect(x-1,y+3,4,5,'#66d8af');rect(x,y+3,1,3,'#ccffe7');rect(x,y-2,2,3,'#d5b47b');hand(x-2,y+7);
 }else if(action==='throw'||action==='shoot'){
  const reach=frame===0?-6:frame===1?15:8,x=cx+side*reach,y=shoulder+4;
  rect(cx+side*4,y,side>0?Math.max(2,reach-4):4,3,sleeve);hand(x,y);
  if(action==='shoot'){rect(x-4,y-3,9,2,'#e5f2ee');rect(x-1,y-5,5,2,'#a3c8d2');rect(x-1,y-1,5,2,'#7195ae');}
  else if(frame!==2){rect(x-1,y-4,4,4,'#34434f');rect(x,y-4,2,2,'#b8c9cf');}
 }else{
  const x=cx+side*(frame===1?14:7),y=shoulder+(frame===0?-8:frame===1?9:5);
  p.save();p.translate(Math.round(x),Math.round(y));p.rotate(side*(frame===1?1.2:-.6));
  rect(-2,-19,4,21,'#332b3b');rect(-1,-18,2,18,action==='swing'?'#91b3d5':'#e5b963');rect(0,-17,1,14,'#fff0b6');rect(-4,0,8,2,'#946b46');rect(-1,2,2,5,'#654337');p.restore();hand(x,y+3);
  if(action==='swing'){rect(x-2,y-19,5,5,'#385a89');rect(x-1,y-18,3,3,'#9ef0e5');}
 }
 // Back-facing book and bottle remain visible at the side, without drawing a face.
 if(!front&&action==='read')rect(cx-1,shoulder+3,2,2,'#c9ab70');
}
