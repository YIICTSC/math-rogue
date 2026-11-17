import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MathChallengeScreen,KanjiChallengeScreen,EnglishChallengeScreen,GeneralChallengeScreen} from '../../src/components/DeferredChallengeScreens';
import {GameMode} from '../../src/types';
import {audioService} from '../../src/services/audioService';
for(const key of ['playBGM','playSound','setBgmDuckMultiplier'])(audioService as any)[key]=()=>{};
Object.assign(window,{__mounts:{},__questions:{}});
const screens=[MathChallengeScreen,KanjiChallengeScreen,EnglishChallengeScreen,GeneralChallengeScreen],modes=[GameMode.ADDITION,GameMode.KANJI_1,GameMode.ENGLISH_ES,GameMode.UPPER_TRIVIA];
function App(){const [kind,setKind]=useState(-1),[tick,setTick]=useState(0);Object.assign(window,{__refresh:()=>setTick(v=>v+1),__open:setKind});const Screen=screens[kind];return <main data-tick={tick}>{Screen&&<Screen key={kind} mode={modes[kind]} onComplete={()=>{}}/>}</main>;}
createRoot(document.getElementById('root')!).render(<App/>);
