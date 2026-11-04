import type {ArcadeState} from './arcade';
import {easeRush,sideLoopPose} from './rush';
export function trickRotation(s:ArcadeState,reduced=false){return reduced||s.rush.trickTime<=36?0:easeRush((72-s.rush.trickTime)/36)*Math.PI*2;}
/** Additive bloom and free-flying stars, never a line or ring enclosing the hero. */
export function drawTrickBurst(ctx:CanvasRenderingContext2D,x:number,y:number,s:ArcadeState,reduced=false,scale=1){
 const life=s.rush.trickTime;if(!life)return;const t=(72-life)/72,fade=Math.sin(Math.PI*(.12+t*.88)),radius=(reduced?40:55+75*t)*scale;
 ctx.save();ctx.globalCompositeOperation='lighter';const glow=ctx.createRadialGradient(x,y-38*scale,0,x,y-38*scale,radius);glow.addColorStop(0,`rgba(255,224,150,${fade*.62})`);glow.addColorStop(.42,`rgba(113,245,255,${fade*.32})`);glow.addColorStop(1,'rgba(163,107,255,0)');ctx.fillStyle=glow;ctx.fillRect(x-radius,y-38*scale-radius,radius*2,radius*2);
 const count=reduced?7:24;for(let i=0;i<count;i++){const a=i*2.399+s.rush.trickSerial*.8,d=(18+t*(reduced?30:130))*(.5+(i%5)/7)*scale,px=x+Math.cos(a)*d,py=y-38*scale+Math.sin(a)*d-t*18*scale,size=(2+i%3)*fade*scale;ctx.globalAlpha=fade;ctx.fillStyle=['#fff3b0','#82ffff','#ffb4ef'][i%3];ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=reduced?0:12*scale;ctx.beginPath();ctx.moveTo(px,py-size*2);ctx.lineTo(px+size,py);ctx.lineTo(px,py+size*2);ctx.lineTo(px-size,py);ctx.closePath();ctx.fill();}ctx.restore();
}
export function drawSideLoop(ctx:CanvasRenderingContext2D,s:ArcadeState,progress:number,floor:number,reduced=false){
 const q=sideLoopPose(progress),r=q.radius,cx=q.cx,cy=floor-r;ctx.save();ctx.lineWidth=18;ctx.strokeStyle='#153740';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.lineWidth=7;ctx.strokeStyle='#78d4d1';ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#ffea9f';ctx.stroke();
 for(let i=0;i<20;i++){const a=i*Math.PI/10;ctx.fillStyle=i/20<Math.max(0,(progress-.16)/.68)?'#fff2aa':'#459b9f';ctx.beginPath();ctx.arc(cx+Math.sin(a)*r,cy+Math.cos(a)*r,2.5,0,Math.PI*2);ctx.fill();}
 ctx.globalCompositeOperation='lighter';for(let i=0;i<5;i++){const a=(s.frame*.03+i*1.26),x=cx+Math.sin(a)*r,y=cy+Math.cos(a)*r,g=ctx.createRadialGradient(x,y,0,x,y,8);g.addColorStop(0,'#acfffccc');g.addColorStop(1,'#6bffe000');ctx.fillStyle=g;if(!reduced)ctx.fillRect(x-8,y-8,16,16);}ctx.restore();
}
