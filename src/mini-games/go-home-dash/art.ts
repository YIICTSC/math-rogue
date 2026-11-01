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
 if(['boss','TEACHER_RUNNER','HALL_MONITOR'].includes(key)){ctx.save();ctx.translate(x+width,y);ctx.scale(-1,1);ctx.drawImage(image,frame.x,frame.y,frame.width,frame.height,0,0,width,height);ctx.restore();}
 else ctx.drawImage(image,frame.x,frame.y,frame.width,frame.height,x,y,width,height);return true;
}
export function drawSlide(ctx:CanvasRenderingContext2D,image:HTMLImageElement|null,p:{x:number;y:number},frame:number) {
 if(!image?.complete||!image.naturalWidth)return false;
 const index=Math.floor(frame/9)%2;
 ctx.drawImage(image,index*160,0,160,80,p.x-56,p.y-51.8,112,56);return true;
}

// Threats get a steady red rim; only the upward wisps move (never a flashing fill).
export function drawDangerAura(ctx:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,frame:number,reducedMotion=false) {
 ctx.save();
 const cx=x+width/2,cy=y+height/2,rx=Math.max(20,width*.72),ry=Math.max(20,height*.68);
 ctx.translate(cx,cy);ctx.scale(rx,ry);
 const glow=ctx.createRadialGradient(0,0,.30,0,0,1);glow.addColorStop(0,'#ff24492b');glow.addColorStop(.65,'#ff18383a');glow.addColorStop(1,'#ff183800');ctx.fillStyle=glow;ctx.fillRect(-1,-1,2,2);
 ctx.restore();
 ctx.save();ctx.strokeStyle='#ff425c99';ctx.lineWidth=1.4;
 for(let i=0;i<3;i++){
  const phase=reducedMotion?.4:((frame*.013+i*.31)%1),px=x+width*(.2+i*.3),base=y+height*(.8-phase*.4);
  ctx.globalAlpha=.65*(1-phase);ctx.beginPath();ctx.moveTo(px,base);ctx.quadraticCurveTo(px+5,base-8,px-1,base-17);ctx.stroke();
 }
 ctx.restore();
}
export function drawHostileArt(ctx:CanvasRenderingContext2D,images:ArtImages|undefined,key:ArtKey,x:number,y:number,width:number,height:number,fit:'contain'|'stretch'='contain') {
 if(['wall','tunnel','gate','IRON_BARRIER','spike'].includes(key)){x-=width*.045;width*=1.09;}
 ctx.save();ctx.shadowColor='#ff234b';ctx.shadowBlur=13;
 const drawn=drawArt(ctx,images,key,x,y,width,height,fit);
 ctx.restore();return drawn;
}
// Draw a staircase from the actual solid geometry. Repeating the full staircase
// icon in every block produced descending mini-stairs and misleading landings.
export function drawStairArt(ctx:CanvasRenderingContext2D,images:ArtImages,rect:{left:number;top:number;width:number;height:number}) {
 const image=images.hazards,frame=ART_FRAMES.step;
 const {left:x,top:y,width:w,height:h}=rect;
 ctx.fillStyle='#695666';ctx.fillRect(x,y,w,h);
 if(image?.complete&&image.naturalWidth){ctx.save();ctx.globalAlpha*=.16;ctx.drawImage(image,frame.x,frame.y+frame.height*.83,frame.width,frame.height*.16,x,y+4,w,Math.max(1,h-4));ctx.restore();}
 ctx.strokeStyle='#c79b812f';ctx.lineWidth=1;
 for(let row=0;row<h/18;row++){const yy=y+row*18;ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+w,yy);ctx.stroke();for(let xx=x+(row%2?18:0);xx<x+w;xx+=36){ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx,Math.min(y+h,yy+18));ctx.stroke();}}
 const shade=ctx.createLinearGradient(x,y,x+w,y);shade.addColorStop(0,'#211c3322');shade.addColorStop(1,'#211c3388');ctx.fillStyle=shade;ctx.fillRect(x,y,w,h);
 ctx.fillStyle='#ffd18b';ctx.fillRect(x,y,w,4);ctx.fillStyle='#a97547';ctx.fillRect(x,y+4,w,3);
 ctx.strokeStyle='#ff6476';ctx.lineWidth=1.5;ctx.strokeRect(x+.75,y+.75,Math.max(0,w-1.5),Math.max(0,h-1.5));
}

// Modular pillar material: repeat only the neutral body texture, then draw the
// gap-facing end cap separately. Never stretch a complete gate over a long wall.
export function drawFlightPillar(ctx:CanvasRenderingContext2D,images:ArtImages,rect:{left:number;top:number;width:number;height:number},upper:boolean) {
 const {left:x,top:y,width:w,height:h}=rect;if(h<=0)return;
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
 const shade=ctx.createLinearGradient(x,0,x+w,0);shade.addColorStop(0,'#182b45');shade.addColorStop(.3,'#3e657b');shade.addColorStop(.75,'#25465f');shade.addColorStop(1,'#14243c');ctx.fillStyle=shade;ctx.fillRect(x,y,w,h);
 const image=images.hazards,frame=ART_FRAMES.gate;
 if(image?.complete&&image.naturalWidth){ctx.globalAlpha=.22;for(let yy=y;yy<y+h;yy+=32)ctx.drawImage(image,frame.x+frame.width*.3,frame.y+frame.height*.4,frame.width*.4,frame.height*.16,x,yy,w,32);ctx.globalAlpha=1;}
 ctx.fillStyle='#8bced999';ctx.fillRect(x+3,y,3,h);ctx.fillRect(x+w-6,y,3,h);
 ctx.strokeStyle='#95c8d433';ctx.lineWidth=1;for(let yy=y+24;yy<y+h-12;yy+=32){ctx.beginPath();ctx.moveTo(x+8,yy);ctx.lineTo(x+w-8,yy);ctx.stroke();}
 const cap=upper?y+h-13:y;ctx.fillStyle='#142839';ctx.fillRect(x,cap,w,13);ctx.fillStyle='#ffdb9b';ctx.fillRect(x,upper?cap+9:cap,w,4);
 ctx.fillStyle='#56bed0';for(let xx=x+9;xx<x+w-6;xx+=16)ctx.fillRect(xx,cap+5,7,3);
 ctx.restore();
}
