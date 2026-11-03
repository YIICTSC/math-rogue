import {LanternVacation,vacationMetric} from './vacationArt';
import {artFacing,mirrorArt} from './artFacing';
import {enemyMetric} from './enemyArtMetrics';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import {useContext} from 'react';
import {LanternLanguage} from './language';
import React,{useEffect,useRef} from 'react';
import {assetUrl} from '../../utils/assetPaths';
import {battleSource,type BattleAction} from './battleSources';
import METRICS from './battleMetrics.json';
import ENDLESS_METRICS from './endlessBattleMetrics.json';
import type {Campaign} from './types';
import {battleEffect,eventReaction} from './battleEffects';
import {ATTACK_EFFECTS} from '../../data/attackEffects';
const images=new Map<string,HTMLImageElement>();
const metrics={...METRICS,...ENDLESS_METRICS} as Record<string,Record<BattleAction,{x:number;y:number;w:number;h:number;bounds:{x:number;y:number;w:number;h:number};footX:number;footY:number;bodyBounds?:{x:number;y:number;w:number;h:number};contacts?:{x:number;y:number;width:number}[]}[]>>;
function art(path:string){
 let img=images.get(path);if(img)images.delete(path);else{img=new Image();img.src=assetUrl(path);}
 images.set(path,img);
 // Hundreds of endless enemy variants must not retain every decoded texture.
 while(images.size>32)images.delete(images.keys().next().value!);
 return img;
}
function groundShadow(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,opacity:number){ctx.save();ctx.translate(x,y);ctx.scale(1,ry/rx);const gradient=ctx.createRadialGradient(0,0,0,0,0,rx);gradient.addColorStop(0,'rgba(7,14,23,'+opacity+')');gradient.addColorStop(.45,'rgba(7,14,23,'+(opacity*.62)+')');gradient.addColorStop(1,'rgba(7,14,23,0)');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(0,0,rx,0,Math.PI*2);ctx.fill();ctx.restore();}
/** Source directions are reviewed per character, action and animation frame. */
export const sourceFacesRight=(id:string,action:BattleAction='ready',frame=0)=>artFacing(id,action,frame)==='right';
export default function GroundedArmy({s,age}:{s:Campaign;age:number}){
 const vacation=useContext(LanternVacation),canvas=useRef<HTMLCanvasElement>(null),latest=useRef({s,age,vacation});latest.current={s,age,vacation};
 useEffect(()=>{let raf=0;
 const effects=Object.fromEntries(Object.keys(ATTACK_EFFECTS).map(key=>{const img=new Image();img.src=assetUrl('sprites/attack-vfx-'+key+'.webp');return [key,img];}));
 const draw=(now:number)=>{
 const c=canvas.current,ctx=c?.getContext('2d');if(!c||!ctx){raf=requestAnimationFrame(draw);return;}
 const w=c.clientWidth,h=c.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);
 if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const {s,age,vacation}=latest.current,e=s.battle?.encounter;if(!e){raf=requestAnimationFrame(draw);return;}
 const event=e.events[e.index],shown=e.events.slice(0,e.index+(age>=650?1:0)),landscape=h<440&&w>h;
 const footer=landscape?58:128,lastFoot=h-footer-(landscape?12:22),spacing=Math.max(8,Math.min(80,h*.075,(lastFoot-h*.64)/2));
 c.dataset.minimumFootY=String((lastFoot-2*spacing)/h);c.dataset.maximumFootY=String(lastFoot/h);
 const bodyHeight=Math.min(210,h*(landscape?.19:.27),Math.max(80,w*.125));
 const squads=[s.battle!.squads.find(q=>q.id===e.ally)!,s.battle!.squads.find(q=>q.id===e.enemy)!];
 const actors=squads.flatMap((q,side)=>q.members.map(f=>({f,side,row:f.slot%3,front:f.slot<3}))).sort((a,b)=>a.row-b.row||Number(a.front)-Number(b.front));
 for(const {f,side,row,front} of actors){
 const last=[...shown].reverse().find(v=>v.target===f.uid),hp=last?.hp??f.hp,active=event?.actor===f.uid&&age<1200,target=event?.target===f.uid&&age>=650&&age<1300;
 const reaction=event?eventReaction(event):'neutral',harmful=reaction==='hurt',supportive=reaction==='heal'||reaction==='buff';
 if(!event&&(hp<=0||(side===0?e.winner!=='ally':e.winner!=='enemy')))continue;
 const action:BattleAction=target&&harmful&&event?.actor===event?.target?'hurt':active?(supportive?'guard':reaction==='neutral'?'ready':age<400?'windup':event?.skill?'ultimate':'attack'):target&&harmful?'hurt':'ready';
 const frame=action==='ready'?Math.floor(now/1200)%4:Math.floor(Math.max(0,age)/160)%4,spec=battleSource(f.hero,action,frame,vacation);
 const img=art(spec.path);if(!img.complete||!img.naturalWidth)continue;
 const cw=img.naturalWidth/spec.cols,ch=img.naturalHeight/spec.rows;
 const fallback={x:(spec.index%spec.cols)*cw,y:Math.floor(spec.index/spec.cols)*ch,w:cw,h:ch,bounds:{x:0,y:0,w:cw,h:ch},bodyBounds:{x:0,y:0,w:cw,h:ch},footX:cw/2,footY:ch};
 const m=(vacation?vacationMetric(f.hero,action,frame):undefined)||enemyMetric(f.hero,action)||metrics[f.hero]?.[action]?.[frame]||fallback,idle=(vacation?vacationMetric(f.hero,'ready'):undefined)||enemyMetric(f.hero)||metrics[f.hero]?.ready?.[0]||fallback;
 const xRatio=side===0?(front?.29:.085)+row*.075:(front?.71:.915)-row*.075;
 const lunge=active&&harmful&&event?.actor!==event?.target&&age>400&&age<1050?(side===0?1:-1)*Math.min(44,w*.035):0;
 const celebrating=!event&&hp>0&&(side===0?e.winner==='ally':e.winner==='enemy');
 const x=xRatio*w+lunge,y=lastFoot-(2-row)*spacing-(celebrating?Math.abs(Math.sin(now/700+f.slot))*3:0),reference=Math.max(.2,(idle.footY-(idle.bodyBounds?.y??idle.bounds.y))/idle.h),scale=bodyHeight/(reference*m.h),flip=mirrorArt(f.hero,action,frame,side===0?'right':'left',vacation);
 ctx.save();ctx.globalAlpha=hp<=0?.24:1;
 // Three ground layers: short cast shadow, soft ambient footprint, and dark sole contacts.
 groundShadow(ctx,x+bodyHeight*.15,y+7,bodyHeight*.44,bodyHeight*.075,.28);
 groundShadow(ctx,x,y+3,bodyHeight*.29,bodyHeight*.045,.4);
 const contacts=(m as typeof m&{contacts?:{x:number;y:number;width:number}[]}).contacts||[{x:m.footX,y:m.footY,width:m.bounds.w*.11}];
 for(const contact of contacts){const cx=x+(contact.x-m.footX)*scale*(flip?-1:1);groundShadow(ctx,cx,y+2,Math.max(6,contact.width*scale*.65),Math.max(2,bodyHeight*.019),.7);}
 ctx.translate(x+(target&&harmful?Math.sin(age*.04)*4:0),y);if(flip)ctx.scale(-1,1);
 const breath=action==='ready'?1+Math.sin(now/850+f.slot)*.004:1;ctx.scale(1,breath);
 if(target&&harmful)ctx.filter='brightness(1.2)';
 else if(target&&supportive||celebrating)ctx.filter='brightness(1.08) drop-shadow(0 0 5px #b8edbb)';
 ctx.drawImage(img,m.x,m.y,m.w,m.h,-m.footX*scale,-m.footY*scale,m.w*scale,m.h*scale);
 ctx.restore();
 if(target&&event){
 const weapon=squads.flatMap(q=>q.members).find(f=>f.uid===event.actor)?.weapon||'sword',key=battleEffect(event,weapon),elapsed=age-650;
 const layer=(effect:typeof key,size:number)=>{const img=effects[effect];if(!img?.complete||!img.naturalWidth)return;const cw=img.naturalWidth/4,ch=img.naturalHeight,frame=Math.min(3,Math.floor(elapsed/ATTACK_EFFECTS[effect].frameMs));ctx.save();ctx.globalAlpha=Math.min(1,(650-elapsed)/200);ctx.translate(x,y-bodyHeight*.48);ctx.drawImage(img,frame*cw,0,cw,ch,-size/2,-size/2,size,size);ctx.restore();};
 layer(key,bodyHeight*(supportive?1.2:1.7));
 if(event.crit&&elapsed>60)layer('critical',bodyHeight*1.25);
 }
 if(target&&event&&event.damage!==0){const text=(event.heal?'+':'')+Math.abs(event.damage)+(event.crit?'!':'');ctx.save();ctx.textAlign='center';ctx.font='bold '+Math.max(22,bodyHeight*.2)+'px Georgia';ctx.lineWidth=3;ctx.strokeStyle=event.heal?'#143e30':'#672c35';ctx.fillStyle=event.heal?'#baf3c9':'#ffe8ab';ctx.strokeText(text,x,y-bodyHeight*.65);ctx.fillText(text,x,y-bodyHeight*.65);ctx.restore();}
 }
 raf=requestAnimationFrame(draw);
 };raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
 },[]);
 return <TranslatedUiTree mode={useContext(LanternLanguage)}><canvas ref={canvas} className="lw-grounded-armies" aria-label="前衛と後衛が向き合う戦闘隊列" role="img"/></TranslatedUiTree>;
}
