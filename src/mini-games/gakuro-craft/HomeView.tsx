import React from 'react';
import PetSprite,{petPose} from './PetSprite';
import {FurnitureSprite} from './FurnitureSprite';
import {HOME_ITEMS,HOME_SIZES,type Home} from './progression';
import {avatarSvg} from './avatarSprite';
import type {Avatar} from './avatar';
export default function HomeView({home,slot,onSelect,t,avatar,time=0,visitors=[]}:{home:Home;slot:number;onSelect:(n:number)=>void;t:(s:string)=>string;avatar:Avatar;time?:number;visitors?:{name:string;avatar:Avatar}[]}){
 const pet=home.pet?petPose(home,time):null;const size=HOME_SIZES[home.level],tw=44,th=22,ox=size*tw/2+30,oy=80,project=(i:number)=>[ox+(i%size-Math.floor(i/size))*tw/2,oy+(i%size+Math.floor(i/size))*th/2];
 return <svg className="gc-home-view" viewBox={`0 0 ${size*tw+60} ${size*th+170}`} role="group" aria-label={t('家の中')}>
 <defs><linearGradient id="home-floor"><stop stopColor="#e8cb91"/><stop offset="1" stopColor="#ba8a5b"/></linearGradient><linearGradient id="home-wall"><stop stopColor="#f4e7d1"/><stop offset="1" stopColor="#cbbfa8"/></linearGradient></defs>
 <path d={`M30 ${oy+size*th/2} L${ox} ${oy} L${ox+size*tw/2} ${oy+size*th/2} V${oy+size*th/2-60} L${ox} ${oy-60} L30 ${oy+size*th/2-60}Z`} fill="url(#home-wall)" stroke="#9e8c75"/>
 {Array.from({length:size*size},(_,i)=>{const [x,y]=project(i),f=home.furniture.find(f=>f.slot===i);return <g key={i} role="button" tabIndex={0} aria-label={`${t('部屋のマス')} ${i+1}${f?' '+t(HOME_ITEMS[f.item][0]):''}`} aria-pressed={slot===i} onClick={()=>onSelect(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(i);}}} style={{cursor:'pointer'}}>
 <path d={`M${x} ${y} l22 11 -22 11 -22 -11Z`} fill={slot===i?'#90c8a4':(i%size+Math.floor(i/size))%2?'#d3ac77':'url(#home-floor)'} stroke={slot===i?'#2b7559':'#ac8457'} strokeWidth={slot===i?2:1}/>
 {f&&<g transform={`translate(${x},${y+4})`}><ellipse cy="2" rx="17" ry="7" fill="#705742" opacity=".2"/><FurnitureSprite item={f.item} rotation={f.rotation||0}/></g>}
 </g>;})}
 {pet&&<g data-home-pet={home.pet?.kind||'calico'} style={{transition:'transform .14s linear'}} transform={'translate('+(ox+(pet.x-pet.z)*tw/2)+','+(oy+(pet.x+pet.z)*th/2+10)+')'}><ellipse rx="10" ry="4" fill="#705742" opacity=".18"/><PetSprite kind={home.pet?.kind} frame={pet.frame} flip={pet.flip}/><text y="-28" textAnchor="middle" fontSize="7" fill="#496752">{home.pet?.name}</text></g>}
 {visitors.slice(0,4).map((p,i)=><g key={i}><image href={'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(avatarSvg(p.avatar))} x={ox-70+i*36} y={oy+size*th-15} width="32" height="46"/><text x={ox-54+i*36} y={oy+size*th+33} textAnchor="middle" fontSize="7" fill="#496752">{p.name}</text></g>)}
 <image href={'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(avatarSvg(avatar))} x={ox-20} y={oy+size*th-35} width="40" height="58"/>
 <text x={ox} y={oy+size*th+45} textAnchor="middle" fontSize="13" fill="#547566">{t('自分だけの部屋')}</text>
 </svg>;
}
