import React,{useEffect,useRef,useState} from 'react';
import {courtArea,type CourtArea} from './courtLayout';
import type {DodgeView} from './types';

export default function DodgeCourtFallback({view,selfId,courtFrame}:{view:DodgeView|null;selfId:string;courtFrame?:React.RefObject<HTMLDivElement|null>}) {
 const root=useRef<HTMLDivElement>(null),[layout,setLayout]=useState<{area:CourtArea;wide:boolean}|null>(null);
 useEffect(()=>{
  const el=root.current!,resize=()=>setLayout({area:courtArea(el,courtFrame?.current),wide:el.clientWidth/el.clientHeight>1.3});
  const observer=new ResizeObserver(resize);observer.observe(el);if(courtFrame?.current)observer.observe(courtFrame.current);resize();
  return()=>observer.disconnect();
 },[courtFrame]);
 const flip=view?.match?.units.find(u=>u.owner===selfId)?.side===1?-1:1,wide=layout?.wide;
 return <div ref={root} className="dg-fallback"><svg viewBox={wide?'-12.7 -9 25.4 18':'-9 -12.7 18 25.4'} style={layout?{left:layout.area.x,top:layout.area.y,width:layout.area.width,height:layout.area.height}:undefined} role="img" aria-label="Dodgeball court 2D"><g transform={wide?'rotate(90)':undefined}><path fill="#3c887a" stroke="#fff" strokeWidth=".08" d="M-8-10H8V10H-8Z M-8 0H8"/>{view?.match?.units.map(u=><circle key={u.id} cx={u.x*flip} cy={-u.y*flip} r=".6" fill={u.owner===selfId?'#fff18a':u.side?'#ff9c88':'#8bffe0'}/>)}{view?.match&&<circle cx={view.match.ball.x*flip} cy={-view.match.ball.y*flip} r=".3" fill="white"/>}</g></svg></div>;
}
