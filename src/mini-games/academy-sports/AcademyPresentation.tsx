import React,{useEffect,useRef,useState} from 'react';
import {audioService} from '../../services/audioService';
import {assetUrl} from '../../utils/assetPaths';
import {PROTAGONISTS} from '../../three/protagonistCatalog';
import {trans} from '../../utils/textUtils';
import type {LanguageMode} from '../../types';
import {AcademyBroadcastPlanner,AcademyBroadcastQueue} from './broadcast';
import type {Match} from './engine';
import type {Event} from './core';
import {specialHero,specialName} from './specials';
export default function AcademyPresentation({match,paused,languageMode}:{match:Match;paused:boolean;languageMode:LanguageMode}){
 const cursor=useRef({stream:'',serial:0}),lastRoutine=useRef(0),lastSpecial=useRef(new Map<number,number>());
 const [cutin,setCutin]=useState<{hero:string;move:Event['move'];key:string}|null>(null);
 const planner=useRef(new AcademyBroadcastPlanner()),opened=useRef(false);
 const queue=useRef<AcademyBroadcastQueue|null>(null);
 if(!queue.current)queue.current=new AcademyBroadcastQueue(id=>id.startsWith('broadcast/')?audioService.playAcademyBroadcastVoiceFile(id.slice(10)):audioService.playAcademySportsVoiceFile(id),()=>audioService.stopSportsVoices());
 useEffect(()=>{const clear=()=>{queue.current?.cancel();setCutin(null);};window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);window.addEventListener('learning-rogue:sports-voice-muted',clear);return()=>{clear();window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);window.removeEventListener('learning-rogue:sports-voice-muted',clear);};},[]);
 useEffect(()=>{
  if(cursor.current.stream!==match.id){cursor.current={stream:match.id,serial:match.serial};lastSpecial.current.clear();planner.current.reset();opened.current=false;queue.current?.cancel();setCutin(null);}
  const events=match.events.filter(e=>e.id>cursor.current.serial);cursor.current.serial=match.serial;
  if(paused||document.hidden){queue.current?.cancel();setCutin(null);return;}
  const now=performance.now();
  if(!opened.current){opened.current=true;if(match.clock<3){const opening=planner.current.opening(match.sport,now);if(opening)queue.current?.enqueue(opening);}}
  for(const event of events){const actor=match.players.find(p=>p.id===event.actor);if(!actor)continue;
   if(event.kind==='special'){
    if(event.at-(lastSpecial.current.get(actor.id)??-10)<1.4)continue;
    lastSpecial.current.set(actor.id,event.at);
    if(match.sport!=='festival'&&event.move)setCutin({hero:actor.hero,move:event.move,key:`${match.id}:${event.id}`});
    queue.current?.enqueue({key:`athlete:${event.id}`,clips:[`${actor.hero}/${match.sport}/special`],priority:2,expiresAt:now+2500});
   }else if(['hit','catch'].includes(event.kind)&&actor.id===match.selected&&performance.now()-lastRoutine.current>1500){lastRoutine.current=performance.now();queue.current?.enqueue({key:`athlete:${event.id}`,clips:[`${actor.hero}/${match.sport}/action`],priority:0,expiresAt:now+1200});}
  }
  for(const sequence of planner.current.sequences(match,events,now))queue.current?.enqueue(sequence);
 },[match.id,match.serial,paused]);
 useEffect(()=>{if(!cutin)return;const timer=setTimeout(()=>setCutin(null),1450);return()=>clearTimeout(timer);},[cutin?.key]);
 useEffect(()=>{if(paused||match.sport==='festival')return;const profile=specialHero(match.config.hero),image=new Image();image.src=assetUrl(`sprites/academy-sports/cutins/cast-${profile.sheet}-v1.webp`);},[match.id,match.config.hero,paused]);
 if(!cutin||match.sport==='festival')return null;
 const hero=specialHero(cutin.hero),column=match.sport==='baseball'?0:match.sport==='soccer'?1:2;
 return <aside className="ac-signature-cutin" style={{'--signature':hero.color} as React.CSSProperties} key={cutin.key} aria-hidden="true" data-academy-cutin={match.sport} data-hero={cutin.hero}>
  <div className="ac-signature-art" style={{backgroundImage:`url(${assetUrl(`sprites/academy-sports/cutins/cast-${hero.sheet}-v1.webp`)})`,backgroundSize:`300% ${hero.rows*100}%`,backgroundPosition:`${column*50}% ${hero.row/(hero.rows-1)*100}%`}}/>
  <div><small>{languageMode==='ENGLISH'?'SIGNATURE BALL':languageMode==='HIRAGANA'?'ひっさつきゅう':'必殺球'}</small><strong>{specialName(cutin.hero,match.sport,languageMode,cutin.move)}</strong><span>{trans(PROTAGONISTS.find(p=>p.id===cutin.hero)?.name||cutin.hero,languageMode)}</span></div>
 </aside>;
}
