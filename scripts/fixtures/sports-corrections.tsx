import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import Presentation from '../../src/mini-games/shared/SportsPresentation';
import type {SportsEvent,Sport} from '../../src/mini-games/shared/sportsEvents';
import {audioService} from '../../src/services/audioService';
import {defaultAvatar} from '../../src/mini-games/gakuro-kart/avatar';
const sport=new URLSearchParams(location.search).get('sport') as Sport;
audioService.playSportsVoiceFile=async()=>false;
audioService.stopSportsVoices=()=>{};
const actors=[{id:'local',owner:'local',name:'火神つばさ',avatar:{...defaultAvatar(),protagonist:'magic-tsubasa'}}];
function App(){const[events,setEvents]=useState<SportsEvent[]>([]);Object.assign(window,{__classic:{emit:()=>setEvents(old=>[...old,{id:old.length+1,kind:'special',actor:'local',at:old.length}])}});return <Presentation sport={sport} stream="correction" viewerId="local" actors={actors} events={events} languageMode="JAPANESE"/>;}
createRoot(document.getElementById('root')!).render(<App/>);
