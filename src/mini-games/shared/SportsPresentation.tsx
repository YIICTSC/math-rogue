import React,{useEffect,useRef,useState} from 'react';
import {PROTAGONISTS} from '../../three/protagonistCatalog';
import {assetUrl} from '../../utils/assetPaths';
import {trans} from '../../utils/textUtils';
import type {LanguageMode} from '../../types';
import type {KartAvatar} from '../gakuro-kart/avatar';
import {audioService} from '../../services/audioService';
import {sportsSpeaker,sportsVoicePath,sportsVoiceAvailable,SPORTS_HEROES} from './sportsVoices';
import type {Sport,SportsEvent} from './sportsEvents';
import {SportsVoiceQueue,type SportsVoiceCue} from './sportsVoiceQueue';
import './sportsPresentation.css';
export interface SportsActor {id:string;name:string;avatar?:KartAvatar}
export interface SportsPresentationProps {sport:Sport;stream:string|null;events?:SportsEvent[];actors:SportsActor[];paused?:boolean;languageMode:LanguageMode;focusActor?:string}
export default function SportsPresentation({sport,stream,events,actors,paused=false,languageMode,focusActor}:SportsPresentationProps){
 const t=(s:string)=>trans(s,languageMode),cursor=useRef<{stream:string|null;id:number}>({stream:null,id:0}),[cutin,setCutin]=useState<{key:string;speaker:string;name:string}|null>(null),currentActors=useRef(actors);currentActors.current=actors;
 const queue=useRef<SportsVoiceQueue|null>(null);if(!queue.current)queue.current=new SportsVoiceQueue(id=>audioService.playSportsVoiceFile(id),()=>audioService.stopSportsVoices());
 useEffect(()=>{
  const silence=()=>queue.current?.cancel();const clear=()=>{silence();setCutin(null);};window.addEventListener('learning-rogue:sports-voice-muted',silence);document.addEventListener('visibilitychange',clear);window.addEventListener('blur',clear);
  return()=>{clear();window.removeEventListener('learning-rogue:sports-voice-muted',silence);document.removeEventListener('visibilitychange',clear);window.removeEventListener('blur',clear);};
 },[]);
 useEffect(()=>{if(paused||!stream){queue.current?.cancel();setCutin(null);}},[paused,stream]);
 useEffect(()=>{
  if(!stream){cursor.current={stream:null,id:0};return;}
  const last=events?.at(-1)?.id??0;
  if(cursor.current.stream!==stream){cursor.current={stream,id:last};return;}
  if(last<cursor.current.id){cursor.current.id=last;return;}
  const fresh=(events??[]).filter(e=>e.id>cursor.current.id);cursor.current.id=last;
  if(paused||document.hidden)return;
  const cues:SportsVoiceCue[]=[];
  for(const e of fresh){
   if(focusActor&&e.actor&&e.actor!==focusActor)continue;
   if(e.kind==='referee'){cues.push({id:`referee/${sport}/${e.call}`,priority:1});continue;}
   const index=currentActors.current.findIndex(a=>a.id===e.actor),actor=currentActors.current[index];if(!actor)continue;
   const speaker=sportsSpeaker(actor.avatar,Math.max(0,index));
   if(e.kind==='special'){setCutin({key:`${stream}:${e.id}`,speaker,name:actor.name});cues.push({id:`${speaker}/${sport}/special`,priority:2});}
   else cues.push({id:`${speaker}/${sport}/action`,priority:0});
  }
  queue.current?.enqueue(cues);
 },[events,stream,sport,paused,focusActor]);
 useEffect(()=>{if(!cutin)return;const timer=setTimeout(()=>setCutin(null),1450);return()=>clearTimeout(timer);},[cutin?.key]);
 // Warm just the current court's performers; never download the full cast to start a match.
 useEffect(()=>{
  if(!stream)return;const controllers:AbortController[]=[];
  for(const actor of actors){const speaker=sportsSpeaker(actor.avatar);for(const event of ['action','special']){const path=sportsVoicePath(`${speaker}/${sport}/${event}`);if(path&&sportsVoiceAvailable(`${speaker}/${sport}/${event}`)){const controller=new AbortController();controllers.push(controller);void fetch(assetUrl(path),{signal:controller.signal}).catch(()=>{});}}if(Object.hasOwn(SPORTS_HEROES,speaker)){const hero=SPORTS_HEROES[speaker as keyof typeof SPORTS_HEROES];const image=new Image();image.src=assetUrl(`sprites/sports-cutins/cast-${hero.sheet}.webp`);}}
  return()=>controllers.forEach(c=>c.abort());
 },[stream,sport,actors.map(a=>a.avatar?.protagonist??a.avatar?.sportsVoice??'custom').join('|')]);
 const hero=cutin&&SPORTS_HEROES[cutin.speaker as keyof typeof SPORTS_HEROES],column=['golf','tennis','basketball','dodgeball'].indexOf(sport);
 return cutin?<div className={`sports-performance sports-performance-${sport}`} key={cutin.key} aria-hidden="true" data-sport-cutin={sport} data-speaker={cutin.speaker}>
  <div className="sports-rendered-burst" style={{backgroundImage:`url(${assetUrl(`sprites/sports-effects/${sport}.webp`)})`}}/>
  <div className="sports-cutin-banner">
   {hero?<div className="sports-cutin-art" style={{backgroundImage:`url(${assetUrl(`sprites/sports-cutins/cast-${hero.sheet}.webp`)})`,backgroundSize:`400% ${hero.rows*100}%`,backgroundPosition:`${column/3*100}% ${hero.row/(hero.rows-1)*100}%`}}/>:<div className="sports-cutin-symbol">{sport==='golf'?'⛳':sport==='tennis'?'🎾':sport==='basketball'?'🏀':'🏐'}</div>}
   <div className="sports-cutin-copy"><small>{t('必殺プレー')}</small><strong>{t(PROTAGONISTS.find(p=>p.id===cutin.speaker)?.name??cutin.name)}</strong><b>{hero?hero.moves[sport][languageMode==='ENGLISH'?1:languageMode==='HIRAGANA'?2:0]:t('スターショット')}</b></div>
  </div>
 </div>:null;
}
