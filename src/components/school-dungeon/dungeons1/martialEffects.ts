import {assetUrl} from '../../../utils/assetPaths';
import {WEAPONS,WEAPON_KINDS,type WeaponKind} from './mastery';
let atlas:HTMLImageElement|undefined;
/** The hero sheet contains only gestures. Weapon silhouettes and trails live here. */
export function drawMartialEffect(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,t:number,kind:WeaponKind,dir={x:1,y:0},tier=0){
 if(!atlas&&typeof Image!=='undefined'){atlas=new Image();atlas.src=assetUrl('sprites/dungeons1/martial/weapons.webp');}
 const color=WEAPONS[kind].color,angle=Math.atan2(dir.y,dir.x),s=size,alpha=Math.sin(Math.PI*Math.min(.99,Math.max(.01,t)));
 ctx.save();ctx.translate(x+s/2,y+s/2);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=Math.max(2,s*.055);ctx.lineCap='round';ctx.shadowColor=color;ctx.shadowBlur=tier>=3?10:3;
 const sweep=-1.7+t*3.4;
 if(['rapier','spear','bow'].includes(kind)){
  for(let i=0;i<(tier>=2?3:1);i++){const yy=(i-(tier>=2?1:0))*s*.17;ctx.beginPath();ctx.moveTo(-s*.7+t*s*.3,yy);ctx.lineTo(s*.6,yy);ctx.lineTo(s*.35,yy-s*.1);ctx.moveTo(s*.6,yy);ctx.lineTo(s*.35,yy+s*.1);ctx.stroke();}
 }else if(kind==='fist'){
  for(let i=0;i<6;i++){const a=i*Math.PI/3+t;ctx.beginPath();ctx.moveTo(Math.cos(a)*s*.15,Math.sin(a)*s*.15);ctx.lineTo(Math.cos(a)*s*(.35+t*.35),Math.sin(a)*s*(.35+t*.35));ctx.stroke();}
  ctx.beginPath();ctx.arc(0,0,s*(.15+t*.25),0,Math.PI*2);ctx.stroke();
 }else if(kind==='hammer'){
  ctx.beginPath();ctx.arc(0,0,s*(.15+t*.55),0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-s*.5,s*.3);ctx.lineTo(-s*.2,s*.1);ctx.lineTo(0,s*.35);ctx.lineTo(s*.2,s*.08);ctx.lineTo(s*.5,s*.3);ctx.stroke();
 }else if(kind==='whip'){
  ctx.beginPath();ctx.moveTo(-s*.65,0);ctx.bezierCurveTo(-s*.2,-s*.8*Math.sin(t*Math.PI),s*.4,s*.7,s*.7,-s*.2);ctx.stroke();
 }else{
  const loops=kind==='chakram'||tier>=3?2:1;
  for(let i=0;i<loops;i++){ctx.beginPath();ctx.arc(0,0,s*(.48+i*.15),sweep-1.7,sweep+.5);ctx.stroke();}
 }
 if(tier>=4){ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,s*.72,-t*3,t*3+Math.PI);ctx.stroke();}
 // A real illustrated weapon moves with the effect, never baked into a protagonist pose.
 if(kind!=='fist'&&atlas?.complete&&atlas.naturalWidth){
  const index=WEAPON_KINDS.indexOf(kind),w=atlas.naturalWidth/4,h=atlas.naturalHeight/3;
  ctx.save();ctx.translate(Math.cos(sweep)*s*.22,Math.sin(sweep)*s*.22);ctx.rotate(['spear','rapier','bow'].includes(kind)?Math.PI/4:sweep+Math.PI/4);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(atlas,index%4*w,Math.floor(index/4)*h,w,h,-s*.5,-s*.5,s,s);ctx.restore();
 }
 ctx.restore();
}
