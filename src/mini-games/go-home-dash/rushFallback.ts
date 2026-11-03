import type {RushRenderFrame} from './rushRenderer';
import {loopPose} from './rush';
import {drawRunner} from './render';
import {drawAura} from './aura';
/** Same course and collisions, rendered in Canvas when WebGL is lost or unavailable. */
export function drawRushFallback(ctx:CanvasRenderingContext2D,w:number,h:number,f:RushRenderFrame){
 const r=f.state.rush,bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#183f5c');bg.addColorStop(.7,'#81b9ac');bg.addColorStop(1,'#f4d4a0');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 const scale=Math.min(w/800,h/400),offsetY=Math.max(0,(h-400*scale)*.45),bottom=(h-offsetY)/scale;
 ctx.save();ctx.translate((w-800*scale)/2,offsetY);ctx.scale(scale,scale);
 if(r.kind==='loop'){
  const cx=400,cy=212,R=124;ctx.fillStyle='#173642';ctx.beginPath();ctx.arc(cx,cy,R+10,0,Math.PI*2);ctx.arc(cx,cy,R-3,0,Math.PI*2,true);ctx.fill();ctx.fillStyle='#153748';ctx.fillRect(-800,336,2400,Math.max(20,bottom-336));
  const p=loopPose(r.progress,r.variant),x=cx+p.x*22,y=344-p.y*22;ctx.translate(x,y);ctx.rotate(-p.angle);ctx.scale(.65,.65);
  drawAura(ctx,0,0,'#7df5db',.6,f.frame,f.reduced);drawRunner(ctx,f.side,null,{x:0,y:0,vy:0,isJumping:false,isFalling:false,animFrame:Math.floor(f.frame/5)%4,barrier:false,dashFrames:0,flying:false},f.frame);
 }else{
  const project=(lane:number,ahead:number)=>{const scale=1/(1+Math.max(-20,ahead)*.0028);return {x:400+lane*120*scale,y:145+200*scale,scale};};
  ctx.fillStyle='#18343c';ctx.beginPath();ctx.moveTo(280,145);ctx.lineTo(520,145);ctx.lineTo(400+bottom*1.4,bottom+1);ctx.lineTo(400-bottom*1.4,bottom+1);ctx.closePath();ctx.fill();
  for(let i=0;i<16;i++){const a=project(0,i*180-(f.distance%180));ctx.fillStyle='#9dc2b455';for(const lane of [-.5,.5])ctx.fillRect(400+lane*240*a.scale,a.y,2+2*a.scale,12*a.scale);}
  for(const e of [...r.objects].sort((a,b)=>b.at-a.at)){const d=e.at-f.distance-120;if(e.taken||d< -80||d>3000)continue;const q=project(e.lane,d),sz=q.scale*45;ctx.fillStyle=e.kind==='coin'||e.kind==='star'?'#ffde76':e.kind==='boost'?'#87ffe1':e.kind==='gap'?'#041726':'#ff7185';
   if(e.kind==='coin'||e.kind==='star'){ctx.beginPath();ctx.arc(q.x,q.y-25*q.scale,Math.max(2,8*q.scale),0,Math.PI*2);ctx.fill();}else ctx.fillRect(q.x-sz/2,q.y-(e.kind==='lowBar'?85:sz)*q.scale,sz,e.kind==='gap'?sz*.22:sz);
  }
  const x=400+r.laneX*120,y=345-f.jump*.7;drawAura(ctx,x,y,'#7df5db',r.momentum/100+(r.turbo>0?.5:0),f.frame,f.reduced);
  const action=f.actions?.complete&&(f.jump>1||f.state.slide>0),sheet=action?f.actions:f.rear;if(sheet?.complete&&sheet.naturalWidth){const cell=sheet.naturalWidth/4,ch=action?sheet.naturalHeight/2:sheet.naturalHeight,frame=action?(f.jump>1?(f.jump<22?((f.vy??0)<0?0:3):(f.vy??0)<-2?1:2):(f.state.slide>44?0:f.state.slide<9?3:1+Math.floor(f.frame/7)%2)):Math.floor(f.frame/5)%4;ctx.drawImage(sheet,frame*cell,action&&f.jump<=1?ch:0,cell,ch,x-42,y-110,84,110);}
 }
 ctx.restore();ctx.canvas.dataset.rushRenderer='canvas';
}
