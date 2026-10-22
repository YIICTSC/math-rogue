import { drawArt, type ArtImages, type ArtKey } from './art';
import { entityRects, entityY, isPickup, laserActive, type ArcadeEntity, type ArcadeState } from './arcade';
const COLORS:Record<string,string>={coin:'#ffdc70',star:'#ff90d8',magnet:'#f49ac2',shield:'#7de9ff',double:'#fff07b',sneakers:'#a9ffb5',board:'#82b9ff',rocket:'#ffb88a',lowGravity:'#b9a5ff',gravity:'#d4a2ff',wave:'#8dffdf',charge:'#91efff',orb:'#ffed9a',pad:'#bdff80',boost:'#8dfff4'};
const ICONS:Record<string,string>={magnet:'∩',shield:'◇',double:'×2',sneakers:'↑↑',board:'≋',rocket:'↑',lowGravity:'↓',gravity:'↕',wave:'∿',charge:'ϟ',orb:'↑',pad:'↑',boost:'»'};
function star(ctx:CanvasRenderingContext2D,x:number,y:number,r:number){ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,v=i%2?r*.45:r;ctx.lineTo(x+Math.cos(a)*v,y+Math.sin(a)*v);}ctx.closePath();ctx.fill();}
export function drawArcade(ctx:CanvasRenderingContext2D,s:ArcadeState,distance:number,reducedMotion=false,width=800,height=400,art?:ArtImages) {
 ctx.save();
 if(s.fever>0){ctx.fillStyle='#ffd96a0d';ctx.fillRect(0,0,width,height);ctx.strokeStyle='#ffe793';ctx.lineWidth=3;ctx.strokeRect(2,2,width-4,height-4);}
 if(s.vehicle==='gravity'){ctx.fillStyle='#c6a2ff';ctx.fillRect(0,18,width,3);}
 for(const e of s.entities){
  if(e.taken)continue;const x=e.d-distance,y=entityY(s,e);if(x+e.width/2<0||x-e.width/2>width+20)continue;
  const pulse=reducedMotion?0:Math.sin(s.frame*.08+e.id)*2;
  if(isPickup(e.kind)){
   const floorItem=e.kind==='pad'||e.kind==='boost';
   const portal=e.kind==='gravity'||e.kind==='wave';
   const size=e.kind==='coin'?26:e.kind==='star'?38:e.kind==='orb'?56:48;
   const aw=floorItem?e.width:portal?76:size,ah=floorItem?24:portal?96:size;
   ctx.save();if(e.kind==='coin'){ctx.translate(x,y);ctx.scale(.65+.35*Math.abs(Math.cos(s.frame*.055+e.id)),1);ctx.translate(-x,-y);}
   const drew=drawArt(ctx,art,e.kind as ArtKey,x-aw/2,floorItem?y-16:y-ah/2+pulse,aw,ah,floorItem?'stretch':'contain');ctx.restore();
   if(drew)continue;
   const color=COLORS[e.kind]||'#fff';ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=2;
   if(e.kind==='coin'){ctx.beginPath();ctx.ellipse(x,y,7+Math.abs(Math.cos(s.frame*.055+e.id))*3,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#754b17';ctx.fillRect(x-1,y-5,2,10);}
   else if(e.kind==='star'){star(ctx,x,y+pulse,17);ctx.fillStyle='#fff9e3';star(ctx,x,y+pulse,7);}
   else if(e.kind==='pad'||e.kind==='boost'){ctx.fillRect(x-e.width/2,y-7,e.width,8);ctx.fillStyle='#153a42';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText(ICONS[e.kind],x,y);}
   else if(e.kind==='gravity'||e.kind==='wave'||e.kind==='lowGravity'){
    ctx.fillStyle=color+'30';ctx.beginPath();ctx.ellipse(x,y-10,25,58,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillText(ICONS[e.kind],x,y);
   }else{
    ctx.fillStyle='#172640ee';ctx.beginPath();ctx.roundRect(x-19,y-19+pulse,38,38,9);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillText(ICONS[e.kind]||'?',x,y+7+pulse);
   }
   continue;
  }
  if(e.kind==='spike'&&drawArt(ctx,art,'spike',x-e.width/2,y-e.height,e.width,e.height,'stretch'))continue;
  if(e.kind==='rail'&&drawArt(ctx,art,'rail',x-e.width/2,y,e.width,26,'stretch'))continue;
  if((e.kind==='wall'||e.kind==='tunnel'||e.kind==='airGate')&&art?.hazards?.complete){
   let painted=true;
   for(const rect of entityRects(s,e,distance))painted=drawArt(ctx,art,e.kind==='airGate'?'gate':e.kind,rect.x,rect.y,rect.w,rect.h,'stretch')&&painted;
   if(painted)continue;
  }
  if(e.kind==='spike'){
   ctx.fillStyle='#ff8096';ctx.strokeStyle='#fff0c9';ctx.lineWidth=2;
   for(let i=0;i<e.width;i+=25){ctx.beginPath();ctx.moveTo(x-e.width/2+i,y);ctx.lineTo(x-e.width/2+i+12,y-e.height);ctx.lineTo(x-e.width/2+i+24,y);ctx.closePath();ctx.fill();ctx.stroke();}
  }else if(e.kind==='rail'){ctx.fillStyle='#e5c887';ctx.fillRect(x-e.width/2,y,e.width,8);ctx.fillStyle='#e5c88766';for(let i=-e.width/2;i<e.width/2;i+=42)ctx.fillRect(x+i,y+8,3,30);}
  else if(e.kind==='saw'){
   ctx.save();ctx.translate(x,y+e.height/2);if(!reducedMotion)ctx.rotate(s.frame*.08);if(drawArt(ctx,art,'saw',-25,-25,50,50)){ctx.restore();continue;}ctx.fillStyle='#b5c8e7';star(ctx,0,0,25);ctx.fillStyle='#ff6f93';ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fill();ctx.restore();
  }else if(e.kind==='missile'){
   if(drawArt(ctx,art,'missile',x-32,y-6,72,34))continue;
   ctx.fillStyle='#ffb975';ctx.beginPath();ctx.moveTo(x-25,y+11);ctx.lineTo(x+18,y);ctx.lineTo(x+18,y+22);ctx.closePath();ctx.fill();ctx.fillStyle='#ff617d';ctx.fillRect(x+18,y+6,14,10);
  }else if(e.kind==='laser'){
   drawArt(ctx,art,'laserEmitter',x-e.width/2-26,y-12,34,30);
   const active=laserActive(s,e);ctx.fillStyle=active?'#ff6388':'#ffb87540';ctx.fillRect(x-e.width/2,y,e.width,active?14:3);ctx.strokeStyle='#ffb875';ctx.lineWidth=2;ctx.setLineDash(active?[]:[8,8]);ctx.strokeRect(x-e.width/2,y-5,e.width,24);ctx.setLineDash([]);ctx.font='bold 13px sans-serif';ctx.fillStyle='#ffe2b2';ctx.textAlign='center';ctx.fillText(active?'!':'···',x,y-12);
  }else{
   for(const r of entityRects(s,e,distance)){
    ctx.fillStyle=e.kind==='wall'?'#6c4d77':'#243954';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle=e.kind==='wall'?'#ffbf87':'#8ff3e7';ctx.lineWidth=3;ctx.strokeRect(r.x,r.y,r.w,r.h);
    ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillText(e.kind==='wall'?'»':'↓',r.x+r.w/2,r.y+Math.min(r.h-3,28));
   }
  }
 }
 if(s.boss){
  const x=610,y=112+(reducedMotion?0:Math.sin(s.frame*.04)*14);
  if(!drawArt(ctx,art,'boss',x-85,y-46,170,90)){
  ctx.fillStyle='#2d294e';ctx.beginPath();ctx.ellipse(x,y,63,29,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ff99af';ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle='#ffcb7c';ctx.fillRect(x-16,y-9,32,13);ctx.fillStyle='#1f1735';ctx.fillRect(x-10,y-5,6,5);ctx.fillRect(x+4,y-5,6,5);
  ctx.strokeStyle='#c1eaff';ctx.beginPath();ctx.moveTo(x-85,y-16);ctx.lineTo(x-40,y-16);ctx.moveTo(x+40,y-16);ctx.lineTo(x+85,y-16);ctx.stroke();
  }
  for(let i=0;i<3;i++){ctx.fillStyle=i<s.boss.hp?'#ff99af':'#ffffff30';ctx.fillRect(x-34+i*25,y-64,18,6);}
 }
 ctx.restore();
}
export function drawArcadeRunner(ctx:CanvasRenderingContext2D,s:ArcadeState,p:{x:number;y:number},color:string,art?:ArtImages) {
 ctx.save();
 if(s.board>0&&!drawArt(ctx,art,'board',p.x-46,p.y-6,92,24,'stretch')){ctx.fillStyle='#87beff';ctx.beginPath();ctx.ellipse(p.x,p.y+4,42,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#78ffdc';ctx.fillRect(p.x-31,p.y+10,16,3);ctx.fillRect(p.x+13,p.y+10,16,3);}
 if(s.vehicle==='rocket'&&!drawArt(ctx,art,'rocket',p.x-45,p.y-67,32,58)){ctx.fillStyle='#c1d5f0';ctx.fillRect(p.x-37,p.y-62,16,40);ctx.fillStyle='#ffba74';ctx.beginPath();ctx.moveTo(p.x-37,p.y-22);ctx.lineTo(p.x-29,p.y+2+Math.sin(s.frame)*7);ctx.lineTo(p.x-21,p.y-22);ctx.closePath();ctx.fill();}
 if(s.combo>=10||s.fever>0){ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x-25,p.y-27);ctx.quadraticCurveTo(p.x-75,p.y-15,p.x-115,p.y-30+Math.sin(s.frame*.07)*8);ctx.stroke();}
 if(s.shield>0){ctx.strokeStyle='#8feaff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y-37,36,47,0,0,Math.PI*2);ctx.stroke();}
 ctx.restore();
}
