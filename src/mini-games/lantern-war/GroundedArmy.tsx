import TranslatedUiTree from '../../components/TranslatedUiTree';
import {useContext} from 'react';
import {LanternLanguage} from './language';
import React,{useEffect,useRef} from 'react';
import {assetUrl} from '../../utils/assetPaths';
import {battleSource,type BattleAction} from './battleSources';
import METRICS from './battleMetrics.json';
import type {Campaign} from './types';
const images=new Map<string,HTMLImageElement>();
const metrics=METRICS as Record<string,Record<BattleAction,{x:number;y:number;w:number;h:number;bounds:{x:number;y:number;w:number;h:number};footX:number;footY:number;bodyBounds?:{x:number;y:number;w:number;h:number};contacts?:{x:number;y:number;width:number}[]}[]>>;
function art(path:string){let img=images.get(path);if(!img){img=new Image();img.src=assetUrl(path);images.set(path,img);}return img;}
function groundShadow(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,opacity:number){ctx.save();ctx.translate(x,y);ctx.scale(1,ry/rx);const gradient=ctx.createRadialGradient(0,0,0,0,0,rx);gradient.addColorStop(0,'rgba(7,14,23,'+opacity+')');gradient.addColorStop(.45,'rgba(7,14,23,'+(opacity*.62)+')');gradient.addColorStop(1,'rgba(7,14,23,0)');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(0,0,rx,0,Math.PI*2);ctx.fill();ctx.restore();}
/** Source artwork is inspected per family: school/magic/enemies face left; the newly authored fantasy and Star Tide poses face right. */
export const sourceFacesRight=(id:string)=>['aster','lyra','nagi','mio','sena'].includes(id)||id.startsWith('dungeons2-');
export default function GroundedArmy({s,age}:{s:Campaign;age:number}){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef({s,age});latest.current={s,age};
 useEffect(()=>{let raf=0;
 const draw=(now:number)=>{
 const c=canvas.current,ctx=c?.getContext('2d');if(!c||!ctx){raf=requestAnimationFrame(draw);return;}
 const w=c.clientWidth,h=c.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);
 if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const {s,age}=latest.current,e=s.battle?.encounter;if(!e){raf=requestAnimationFrame(draw);return;}
 const event=e.events[e.index],shown=e.events.slice(0,e.index+(age>=650?1:0)),landscape=h<440&&w>h;
 const footer=landscape?58:128,lastFoot=h-footer-(landscape?12:22),spacing=Math.max(8,Math.min(80,h*.075,(lastFoot-h*.64)/2));
 c.dataset.minimumFootY=String((lastFoot-2*spacing)/h);c.dataset.maximumFootY=String(lastFoot/h);
 const bodyHeight=Math.min(210,h*(landscape?.19:.27),Math.max(80,w*.125));
 const squads=[s.battle!.squads.find(q=>q.id===e.ally)!,s.battle!.squads.find(q=>q.id===e.enemy)!];
 const actors=squads.flatMap((q,side)=>q.members.map(f=>({f,side,row:f.slot%3,front:f.slot<3}))).sort((a,b)=>a.row-b.row||Number(a.front)-Number(b.front));
 for(const {f,side,row,front} of actors){
 const last=[...shown].reverse().find(v=>v.target===f.uid),hp=last?.hp??f.hp,active=event?.actor===f.uid&&age<1200,target=event?.target===f.uid&&age>=650&&age<1300;
 const action:BattleAction=active?(age<400?'windup':event?.skill?'ultimate':'attack'):target&&!event?.heal?'hurt':'ready';
 const frame=action==='ready'?Math.floor(now/1200)%4:Math.floor(Math.max(0,age)/160)%4,spec=battleSource(f.hero,action,frame),m=metrics[f.hero]?.[action]?.[frame],idle=metrics[f.hero]?.ready?.[0];
 if(!m||!idle)continue;const img=art(spec.path);if(!img.complete||!img.naturalWidth)continue;
 const xRatio=side===0?(front?.29:.085)+row*.075:(front?.71:.915)-row*.075;
 const lunge=active&&age>400&&age<1050?(side===0?1:-1)*Math.min(44,w*.035):0;
 const x=xRatio*w+lunge,y=lastFoot-(2-row)*spacing,reference=Math.max(.2,(idle.footY-(idle.bodyBounds?.y??idle.bounds.y))/idle.h),scale=bodyHeight/(reference*m.h),flip=side===0?!sourceFacesRight(f.hero):sourceFacesRight(f.hero);
 ctx.save();ctx.globalAlpha=hp<=0?.24:1;
 // Three ground layers: short cast shadow, soft ambient footprint, and dark sole contacts.
 groundShadow(ctx,x+bodyHeight*.15,y+7,bodyHeight*.44,bodyHeight*.075,.28);
 groundShadow(ctx,x,y+3,bodyHeight*.29,bodyHeight*.045,.4);
 const contacts=(m as typeof m&{contacts?:{x:number;y:number;width:number}[]}).contacts||[{x:m.footX,y:m.footY,width:m.bounds.w*.11}];
 for(const contact of contacts){const cx=x+(contact.x-m.footX)*scale*(flip?-1:1);groundShadow(ctx,cx,y+2,Math.max(6,contact.width*scale*.65),Math.max(2,bodyHeight*.019),.7);}
 ctx.translate(x+(target&&!event?.heal?Math.sin(age*.04)*4:0),y);if(flip)ctx.scale(-1,1);
 const breath=action==='ready'?1+Math.sin(now/850+f.slot)*.004:1;ctx.scale(1,breath);
 if(target&&!event?.heal)ctx.filter='brightness(1.2)';
 ctx.drawImage(img,m.x,m.y,m.w,m.h,-m.footX*scale,-m.footY*scale,m.w*scale,m.h*scale);
 ctx.restore();
 if(target&&event&&!event.heal){ctx.save();ctx.translate(x,y-bodyHeight*.48);const weapon=squads.flatMap(q=>q.members).find(f=>f.uid===event.actor)?.weapon||'sword';const magic=['magic','staff'].includes(weapon);const t=Math.max(0,Math.min(1,(age-650)/650));ctx.globalAlpha=Math.sin(t*Math.PI);ctx.strokeStyle=magic?'#a9e6ff':'#fff1ba';ctx.lineWidth=magic?5:8;ctx.shadowColor=magic?'#6a85ff':'#ffb44d';ctx.shadowBlur=22;ctx.beginPath();if(!magic&&['axe','lance'].includes(weapon)){ctx.arc(0,0,bodyHeight*.2*(1+t),0,Math.PI*2);for(let i=0;i<8;i++){const angle=i*Math.PI/4;ctx.moveTo(Math.cos(angle)*bodyHeight*.22,Math.sin(angle)*bodyHeight*.22);ctx.lineTo(Math.cos(angle)*bodyHeight*.4,Math.sin(angle)*bodyHeight*.4);}}else if(magic){ctx.arc(0,0,bodyHeight*.32*t,0,Math.PI*2);}else{ctx.moveTo(-bodyHeight*.3,bodyHeight*.3);ctx.lineTo(bodyHeight*.3,-bodyHeight*.3);ctx.moveTo(-bodyHeight*.2,-bodyHeight*.2);ctx.lineTo(bodyHeight*.2,bodyHeight*.2);}ctx.stroke();ctx.restore();}
 if(target&&event&&event.damage!==0){const text=(event.heal?'+':'')+Math.abs(event.damage)+(event.crit?'!':'');ctx.save();ctx.textAlign='center';ctx.font='bold '+Math.max(22,bodyHeight*.2)+'px Georgia';ctx.lineWidth=3;ctx.strokeStyle=event.heal?'#143e30':'#672c35';ctx.fillStyle=event.heal?'#baf3c9':'#ffe8ab';ctx.strokeText(text,x,y-bodyHeight*.65);ctx.fillText(text,x,y-bodyHeight*.65);ctx.restore();}
 }
 raf=requestAnimationFrame(draw);
 };raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
 },[]);
 return <TranslatedUiTree mode={useContext(LanternLanguage)}><canvas ref={canvas} className="lw-grounded-armies" aria-label="前衛と後衛が向き合う戦闘隊列" role="img"/></TranslatedUiTree>;
}
