import type {UmbrellaEffect,UmbrellaKind} from './umbrella';
const colors:Record<UmbrellaKind,string>={rain:'#62dfff',fire:'#ff8749',thunder:'#fff278',sleep:'#d5a4ff',blow:'#9ff5df',warp:'#c898ff',change:'#f5a8ef',bind:'#91bdff',heal:'#82f7ad'};
/** World-space ray, traveling spell and impact remain visible independently of menus. */
export function drawUmbrellaEffect(ctx:CanvasRenderingContext2D,fx:UmbrellaEffect,progress:number,startX:number,startY:number,tile:number){
 const p=Math.max(0,Math.min(1,progress)),travel=Math.min(1,p/.6),color=colors[fx.umbrellaKind];
 const x0=(fx.startX-startX+.5)*tile,y0=(fx.startY-startY+.5)*tile,x1=(fx.targetX-startX+.5)*tile,y1=(fx.targetY-startY+.5)*tile;
 const x=x0+(x1-x0)*travel,y=y0+(y1-y0)*travel;
 ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineCap='round';ctx.globalAlpha=.3*(1-p)+.15;ctx.lineWidth=Math.max(2,tile*.065);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
 ctx.globalAlpha=1-p*.5;ctx.shadowColor=color;ctx.shadowBlur=tile*.2;
 if(p<.65){ctx.beginPath();ctx.arc(x,y,tile*.12,0,Math.PI*2);ctx.fill();for(let i=1;i<=4;i++){const t=Math.max(0,travel-i*.055);ctx.globalAlpha=(1-i*.18)*(1-p);ctx.beginPath();ctx.arc(x0+(x1-x0)*t,y0+(y1-y0)*t,tile*(.1-i*.014),0,Math.PI*2);ctx.fill();}}
 if(p>=.55){const impact=(p-.55)/.45;ctx.globalAlpha=1-impact;ctx.lineWidth=Math.max(2,tile*.06);ctx.beginPath();ctx.arc(x1,y1,tile*(.14+impact*.48),0,Math.PI*2);ctx.stroke();for(let n=0;n<8;n++){const angle=n*Math.PI/4,r=tile*(.1+impact*.55);ctx.beginPath();ctx.moveTo(x1+Math.cos(angle)*r,y1+Math.sin(angle)*r);ctx.lineTo(x1+Math.cos(angle)*(r+tile*.13),y1+Math.sin(angle)*(r+tile*.13));ctx.stroke();}
 ctx.shadowBlur=0;ctx.font=`bold ${Math.max(12,tile*.32)}px sans-serif`;ctx.textAlign='center';ctx.fillText(fx.impactValue||({sleep:'Zzz',bind:'❄',heal:'+',warp:'↗',change:'↔',blow:'»',rain:'',fire:'',thunder:'ϟ'}[fx.umbrellaKind]),x1,y1-tile*(.4+impact*.35));}
 if(fx.umbrellaKind==='rain')for(let i=0;i<5;i++){ctx.globalAlpha=(1-p)*.9;const dx=(i-2)*tile*.13,dy=((p*2+i*.18)%1-.5)*tile;ctx.beginPath();ctx.moveTo(x+dx,y+dy-tile*.12);ctx.lineTo(x+dx-tile*.04,y+dy);ctx.stroke();}
 ctx.restore();
}
