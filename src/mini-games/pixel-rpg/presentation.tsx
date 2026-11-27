import { createContext, useContext, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { LanguageMode } from '../../types';
import type { Copy } from './campaign';
import { trans } from '../../utils/textUtils';
import { arenaPosition, battleFrame, fieldFrame, type Animation } from './art';
import { cueStudentAction } from '../../components/school-dungeon/dungeons1/heroActions';
import { isProtagonistId } from '../../components/school-dungeon/student/content';
import type { Adventure } from './adventure';
import type { Battle } from './battle';
import { type Direction, type Point, same } from './world';

export const Language = createContext<LanguageMode>('JAPANESE');
export function useWords(){
  const language=useContext(Language),i=language==='ENGLISH'?1:0;
  const l=(copy:Copy)=>i===1?copy[1]:language==='HIRAGANA'?trans(copy[0],'HIRAGANA'):copy[0];
  return {i,l,t:(ja:string,en:string)=>l([ja,en]),language} as const;
}

export function Panel({heading,subtitle,close,children,wide=false}:{heading:string;subtitle?:string;close:()=>void;children:ReactNode;wide?:boolean}){
  const {t}=useWords();
  const shell=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const first=shell.current?.querySelector<HTMLElement>('button[data-pr-close]');
    first?.focus({preventScroll:true});
    return ()=>{if(previous?.isConnected)previous.focus({preventScroll:true});};
  },[heading]);
  return <div className="pr-shade" onPointerDown={e=>{if(e.target===e.currentTarget)close();}}>
    <section className={`pr-window ${wide?'pr-window-wide':''}`} ref={shell} role="dialog" aria-modal="true" aria-label={heading} data-gamepad-modal
      onKeyDown={e=>{
        if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}
        if(e.key!=='Tab')return;
        const all=Array.from(shell.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]')??[]);
        const first=all[0],last=all.at(-1);
        if(e.shiftKey&&document.activeElement===first&&last){e.preventDefault();last.focus();}
        if(!e.shiftKey&&document.activeElement===last&&first){e.preventDefault();first.focus();}
      }}>
      <header><div><h2>{heading}</h2>{subtitle&&<p>{subtitle}</p>}</div><button aria-label={t('閉じる','Close')} data-pr-close data-gamepad-back onClick={close}>×</button></header>
      <div className="pr-window-body">{children}</div>
    </section>
  </div>;
}

export function FieldCanvas({state,dash}:{state:Adventure;dash:boolean}){
  const ref=useRef<HTMLCanvasElement>(null);
  const data=useRef({state,dash});
  data.current={state,dash};
  useEffect(()=>{
    const canvas=ref.current;
    if(!canvas)return;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)return;
    let raf=0, last=0, sceneWidth=1, sceneHeight=1;
    let prev=data.current.state, movement:Parameters<typeof fieldFrame>[5];
    const resize=()=>{
      const {width,height}=canvas.getBoundingClientRect();
      if(width<8||height<8)return;
      const ratio=width/height;
      sceneHeight=Math.min(310,Math.max(ratio>2?86:115,Math.round(height/(ratio>2?2.25:2.35))));
      sceneWidth=Math.min(720,Math.round(sceneHeight*ratio));
      const pixelRatio=Math.min(2,window.devicePixelRatio||1,2048/Math.max(width,height));
      canvas.width=Math.round(width*pixelRatio);canvas.height=Math.round(height*pixelRatio);
      ctx.setTransform(canvas.width/sceneWidth,0,0,canvas.height/sceneHeight,0,0);
      ctx.imageSmoothingEnabled=false;
      const {state,dash}=data.current;
      fieldFrame(ctx,state,sceneWidth,sceneHeight,performance.now(),movement,dash);
    };
    const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
    const at=(s:Adventure,n:number)=>s.trail[Math.min(s.trail.length-1,n*2)]??s.at;
    const direction=(old:Point,next:Point,defaultDirection:Direction):Direction=>{
      if(same(old,next))return defaultDirection;
      if(next.x!==old.x)return next.x>old.x?'right':'left';
      return next.y>old.y?'down':'up';
    };
    const tick=(time:number)=>{
      raf=requestAnimationFrame(tick);
      if(time-last<25||document.hidden||!canvas.isConnected)return;
      last=time;
      const {state:s,dash}=data.current;
      if(prev.map!==s.map||prev.vehicle!==s.vehicle||s.trail.length===1)movement=undefined;
      else if(!same(prev.at,s.at)){
        const previous=s.party.map((_,i)=>at(prev,i)),next=s.party.map((_,i)=>at(s,i));
        if(s.vehicle==='foot')s.party.forEach((id,i)=>{
          if(!same(previous[i],next[i])&&isProtagonistId(id))cueStudentAction(id,'walk');
        });
        movement={lead:s.at,at:time,speed:dash?78:118,prev:previous,next,map:s.map,faces:previous.map((p,i)=>direction(p,next[i],movement?.faces[i]??s.direction))};
      }
      prev=s;
      fieldFrame(ctx,s,sceneWidth,sceneHeight,time,movement,dash);
    };
    raf=requestAnimationFrame(tick);
    return ()=>{observer.disconnect();cancelAnimationFrame(raf);};
  },[]);
  return <canvas ref={ref} className="pr-scene pr-field-scene" aria-hidden="true" />;
}

export function BattleCanvas({battle,animation,reduced}:{battle:Battle;animation?:Animation;reduced:boolean}){
  const ref=useRef<HTMLCanvasElement>(null), current=useRef({battle,animation,reduced});
  current.current={battle,animation,reduced};
  useEffect(()=>{
    const canvas=ref.current;
    if(!canvas)return;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)return;
    let raf=0,last=0,sceneWidth=1,sceneHeight=1;
    const compact=window.matchMedia('(max-height: 500px) and (orientation: landscape)');
    const resize=()=>{
      const {width,height}=canvas.getBoundingClientRect();
      if(width<8||height<8)return;
      const ratio=width/height;
      sceneHeight=Math.round(Math.min(270,Math.max(104,height/1.75)));
      sceneWidth=Math.round(Math.min(800,sceneHeight*ratio));
      const pixelRatio=Math.min(2,window.devicePixelRatio||1,2560/Math.max(width,height));
      canvas.width=Math.round(width*pixelRatio);
      canvas.height=Math.round(height*pixelRatio);
      ctx.setTransform(canvas.width/sceneWidth,0,0,canvas.height/sceneHeight,0,0);
      ctx.imageSmoothingEnabled=false;
      const {battle,animation,reduced}=current.current;
      battleFrame(ctx,battle,sceneWidth,sceneHeight,performance.now(),animation,reduced,compact.matches);
    };
    const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
    const tick=(time:number)=>{
      raf=requestAnimationFrame(tick);
      if(time-last<23||document.hidden||!canvas.isConnected)return;
      const {battle,animation,reduced}=current.current;
      last=time;battleFrame(ctx,battle,sceneWidth,sceneHeight,time,animation,reduced,compact.matches);
    };
    raf=requestAnimationFrame(tick);
    return()=>{observer.disconnect();cancelAnimationFrame(raf);};
  },[]);
  return <canvas ref={ref} className="pr-scene pr-battle-scene" aria-hidden="true" />;
}

export function positionStyle(side:'party'|'enemy',index:number){
  const p=arenaPosition(side,index);
  const c=arenaPosition(side,index,true);
  return {'--pr-unit-x':`${p.x*100}%`,'--pr-unit-x-compact':`${c.x*100}%`,top:`${p.y*100}%`} as CSSProperties;
}
export function Meter({value,max,className=''}:{value:number;max:number;className?:string}){
  return <span className={`pr-meter ${className}`} aria-hidden="true"><i style={{width:`${Math.max(0,Math.min(100,(value/max)*100))}%`}} /></span>;
}
