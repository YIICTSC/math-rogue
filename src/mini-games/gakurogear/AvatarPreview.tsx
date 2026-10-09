import React,{useEffect,useRef} from 'react';
import type {KartAvatar} from '../gakuro-kart/avatar';
import {createScene} from './scene';
import {MISSIONS} from './engine';
export default function AvatarPreview({avatar}:{avatar:KartAvatar}){const host=useRef<HTMLDivElement>(null),scene=useRef<ReturnType<typeof createScene>|null>(null);useEffect(()=>{if(!host.current)return;const mission={...MISSIONS[0],routes:[],cameras:[],targets:[],obstacles:[]};let view:ReturnType<typeof createScene>;try{view=createScene(host.current,mission,avatar);}catch{return;}scene.current=view;let frame=0;const draw=()=>{if(!document.hidden)view.portrait();frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);scene.current=null;view.dispose();};},[]);useEffect(()=>{scene.current?.setAvatar(avatar);},[avatar]);return <div ref={host} className="gear-avatar-preview" aria-hidden="true"/>;}
