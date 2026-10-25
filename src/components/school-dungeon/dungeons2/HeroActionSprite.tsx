import React,{useEffect,useRef} from 'react';
import {drawStudentSprite,studentDirection} from '../student/sprites';
export function HeroActionSprite({id,direction={x:0,y:1},transformed=false}:{id:string;direction?:{x:number;y:number};transformed?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),current=useRef({id,direction,transformed});current.current={id,direction,transformed};
 useEffect(()=>{let raf=0;const draw=()=>{const ctx=canvas.current?.getContext('2d');if(ctx){ctx.clearRect(0,0,128,128);const p=current.current;drawStudentSprite(ctx,p.id,p.direction,16,24,96,p.transformed);}raf=requestAnimationFrame(draw);};draw();return()=>cancelAnimationFrame(raf);},[]);
 return <span className="traveler-sprite" data-facing={studentDirection(direction)} aria-hidden="true"><canvas ref={canvas} width={128} height={128} style={{width:'100%',height:'100%',imageRendering:'pixelated'}}/></span>;
}
