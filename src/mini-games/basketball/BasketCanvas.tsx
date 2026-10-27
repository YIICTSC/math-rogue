import React,{useEffect,useRef} from 'react';
import type {BasketView} from './types';
import {BODY_COLORS,HAIR_COLORS} from '../gakuro-kart/avatar';
import type {KartAvatar} from '../gakuro-kart/avatar';
/** Logical court coordinates match the authoritative simulation; rendering never advances it. */
export default function BasketCanvas({view,selfId,avatar}:{view:BasketView|null;selfId:string;avatar?:KartAvatar;suspended?:boolean;aim?:number}){
 const canvas=useRef<HTMLCanvasElement>(null),snapshot=useRef(view);snapshot.current=view;
 useEffect(()=>{const c=canvas.current!;const ctx=c.getContext('2d')!;let frame=0;
 const draw=(now:number)=>{const r=c.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);if(c.width!==Math.round(r.width*dpr)||c.height!==Math.round(r.height*dpr)){c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);}const w=c.width,h=c.height;ctx.clearRect(0,0,w,h);
 const landscape=w>h*1.25,scale=Math.min(w/(landscape?36:19),h/(landscape?19:36));
 const point=(x:number,y:number,z=0)=>landscape?{x:w/2+y*scale*1.6,y:h/2+x*scale-z*scale*.7}:{x:w/2+x*scale,y:h/2-y*scale*1.6-z*scale*.7};
 const path=(points:number[][],fill?:string)=>{ctx.beginPath();points.forEach(([x,y],i)=>{const p=point(x,y);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}ctx.stroke();};
 ctx.fillStyle='#102a36';ctx.fillRect(0,0,w,h);ctx.lineWidth=Math.max(1,scale*.035);ctx.strokeStyle='#c89b61';
 for(let i=0;i<16;i++)path([[-8+i,-10],[-7+i,-10],[-7+i,10],[-8+i,10]],i%2?'#dca76c':'#e3b57d');
 ctx.strokeStyle='#fff5da';ctx.lineWidth=scale*.07;path([[-8,-10],[8,-10],[8,10],[-8,10],[-8,-10]]);path([[-8,0],[8,0]]);
 const ellipse=(x:number,y:number,rad:number)=>{const p=point(x,y),a=point(-8,-10),b=point(8,10);ctx.save();ctx.beginPath();ctx.rect(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(a.x-b.x),Math.abs(a.y-b.y));ctx.clip();ctx.beginPath();ctx.ellipse(p.x,p.y,rad*scale*(landscape?1.6:1),rad*scale*(landscape?1:1.6),0,0,Math.PI*2);ctx.stroke();ctx.restore();};ellipse(0,0,2);
 for(const side of [-1,1]){path([[-2.6,side*10],[-2.6,side*6],[2.6,side*6],[2.6,side*10]],'#194857');ellipse(0,side*8.7,6.5);}
 ctx.fillStyle='#ffffff30';ctx.font=`bold ${scale*.5}px system-ui`;ctx.textAlign='center';ctx.fillText('GAKURO · BASKETBALL',w/2,h/2-scale*2.5);
 const v=snapshot.current,m=v?.match;
 const units=m?.units||Array.from({length:6},(_,i)=>({id:String(i),owner:null,side:i<3?0:1,x:(i%3-1)*4,y:i<3?-4:4,vx:0,vy:0,name:'CPU',action:0,actionSeq:0,avatar:avatar}));
 for(const u of [...units].sort((a,b)=>point(a.x,a.y).y-point(b.x,b.y).y)){
 const p=point(u.x,u.y),moving=Math.hypot(u.vx,u.vy)>.1,swing=moving?Math.sin(now*.016+u.id.length)*scale*.13:0;ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(p.x,p.y+scale*.2,scale*.46,scale*.16,0,0,7);ctx.fill();
 if(u.owner===selfId){ctx.strokeStyle='#fff177';ctx.lineWidth=scale*.08;ctx.beginPath();ctx.ellipse(p.x,p.y+scale*.15,scale*.58,scale*.25,0,0,7);ctx.stroke();}
 ctx.lineWidth=scale*.15;ctx.lineCap='round';ctx.strokeStyle='#183346';ctx.beginPath();ctx.moveTo(p.x-scale*.15,p.y-scale*.2);ctx.lineTo(p.x-scale*.22+swing,p.y+scale*.1);ctx.moveTo(p.x+scale*.15,p.y-scale*.2);ctx.lineTo(p.x+scale*.22-swing,p.y+scale*.1);ctx.stroke();
 ctx.fillStyle=u.side===0?'#2b9bc1':'#e76643';ctx.fillRect(p.x-scale*.27,p.y-scale*.85,scale*.54,scale*.65);ctx.strokeStyle=BODY_COLORS[u.avatar?.body??0];ctx.beginPath();ctx.moveTo(p.x-scale*.29,p.y-scale*.75);ctx.lineTo(p.x-scale*.42,p.y-scale*(u.action>0?1.2:.35));ctx.moveTo(p.x+scale*.29,p.y-scale*.75);ctx.lineTo(p.x+scale*.42,p.y-scale*(u.action>0?1.2:.35));ctx.stroke();ctx.fillStyle=BODY_COLORS[u.avatar?.body??0];ctx.beginPath();ctx.arc(p.x,p.y-scale*1.05,scale*.24,0,7);ctx.fill();ctx.fillStyle=HAIR_COLORS[u.avatar?.hair??0];ctx.beginPath();ctx.arc(p.x,p.y-scale*1.15,scale*.25,Math.PI,Math.PI*2);ctx.fill();
 ctx.fillStyle='#fff';ctx.font=`bold ${scale*.25}px system-ui`;ctx.fillText(u.id.at(-1)||'1',p.x,p.y-scale*.43);ctx.fillStyle='#143142';ctx.font=`${Math.max(9,scale*.24)}px system-ui`;ctx.fillText(u.name,p.x,p.y+scale*.6);
 }
 for(const y of [-8.7,8.7]){const p=point(0,y,3.1);ctx.strokeStyle='#fff';ctx.lineWidth=scale*.12;ctx.strokeRect(p.x-scale*.65,p.y-scale*.4,scale*1.3,scale*.5);ctx.strokeStyle='#ff653b';ctx.beginPath();ctx.ellipse(p.x,p.y+scale*.12,scale*.43,scale*.16,0,0,7);ctx.stroke();}
 if(m){const b=m.ball,p=point(b.x,b.y,b.z);ctx.fillStyle='#eb8436';ctx.strokeStyle='#7d3519';ctx.lineWidth=scale*.045;ctx.beginPath();ctx.arc(p.x,p.y,scale*.22,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-scale*.22,p.y);ctx.lineTo(p.x+scale*.22,p.y);ctx.stroke();}
 frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);},[selfId,avatar]);
 return <canvas ref={canvas} aria-label="Basketball court" style={{width:'100%',height:'100%',display:'block'}}/>;
}
