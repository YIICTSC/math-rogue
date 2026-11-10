import React,{useEffect,useRef,useState}from'react';import type{Match}from'./engine';import type{KartAvatar}from'../gakuro-kart/avatar';import{createAcademyRenderer,type RenderStatus}from'./renderer';
export default function Scene({match,avatar,paused,onStatus}:{match:Match;avatar:KartAvatar;paused:boolean;onStatus:(status:RenderStatus)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef({match,avatar,paused,onStatus}),[version,setVersion]=useState(0);latest.current={match,avatar,paused,onStatus};
 useEffect(()=>{let engine:ReturnType<typeof createAcademyRenderer>|undefined,frame=0,dead=false,restoring=false,last=performance.now();const el=canvas.current!;const restore=()=>{restoring=true;setVersion(v=>v+1);};el.addEventListener('webglcontextrestored',restore);
 try{engine=createAcademyRenderer(el,s=>{if(!dead)latest.current.onStatus(s);});const tick=(at:number)=>{if(dead)return;const v=latest.current;engine?.draw(v.match,v.paused?0:Math.min(.05,(at-last)/1000),v.avatar);last=at;frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);}catch{latest.current.onStatus({ready:false,failed:true,players:0,total:0,drawCalls:0,triangles:0});}
 return()=>{dead=true;cancelAnimationFrame(frame);el.removeEventListener('webglcontextrestored',restore);engine?.dispose(!restoring);};},[version]);
 return <canvas className="ac-canvas" ref={canvas} aria-label="3D sports field" data-sport={match.sport}/>;
}
