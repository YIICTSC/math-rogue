import React,{useEffect,useRef} from 'react';
import './item-menu.css';
/** Tapping, keyboard activation and a stationary hold only inspect. Never run an item action here. */
export function InspectSlot({onInspect,children,...props}:Omit<React.ButtonHTMLAttributes<HTMLButtonElement>,'onClick'> & {onInspect:()=>void}){
 const latest=useRef(onInspect);latest.current=onInspect;
 const gesture=useRef({timer:0,x:0,y:0,suppressUntil:0,active:false,held:false});
 const cancel=()=>{window.clearTimeout(gesture.current.timer);gesture.current.timer=0;};
 useEffect(()=>cancel,[]);
 return <button {...props} type="button" onPointerDown={e=>{cancel();if(e.button!==0)return;const g=gesture.current;g.active=true;g.held=false;g.suppressUntil=0;g.x=e.clientX;g.y=e.clientY;g.timer=window.setTimeout(()=>{g.timer=0;g.held=true;g.suppressUntil=Date.now()+1200;latest.current();},450);}} onPointerMove={e=>{const g=gesture.current;if(g.active&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>10){cancel();g.suppressUntil=Date.now()+700;}}} onPointerUp={()=>{cancel();const g=gesture.current;g.active=false;if(g.held)g.suppressUntil=Date.now()+700;}} onPointerCancel={()=>{cancel();gesture.current.active=false;gesture.current.suppressUntil=Date.now()+700;}} onPointerLeave={cancel} onClick={e=>{if(e.detail!==0&&Date.now()<gesture.current.suppressUntil)return;latest.current();}} onContextMenu={e=>{e.preventDefault();cancel();latest.current();}}>{children}</button>;
}
