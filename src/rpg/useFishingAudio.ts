import {useEffect,useRef} from 'react';
import {audioService} from '../services/audioService';
import {fishById,type FishCatch} from './fishing';
import {fishingFeedback} from './fishingAudio';
import type {LifePlayer,Work} from './life';
export default function useFishingAudio(life:LifePlayer|undefined,message:string,active:boolean,result:FishCatch|undefined){
 const previous=useRef<{work?:Work;catchAt?:number}>({}),lastResult=useRef(0);
 useEffect(()=>{const before=previous.current,caught=!!life?.lastCatch&&life.lastCatch.at!==before.catchAt;const cue=fishingFeedback(before.work,life?.work,caught,message);previous.current={work:life?.work?{...life.work,fishing:life.work.fishing?{...life.work.fishing}:undefined}:undefined,catchAt:life?.lastCatch?.at};if(!active)return;if(cue)audioService.playRpgFishingSound(cue);},[life?.work?.target,life?.work?.fishing?.beat,life?.lastCatch?.at,message,active]);
 useEffect(()=>{if(active&&life)void audioService.preloadRpgFishingSounds();},[active,!!life]);
 useEffect(()=>{if(!active||!result)return;if(lastResult.current===result.at)return;lastResult.current=result.at;const rarity=fishById(result.id).rarity,special=rarity==='rare'||rarity==='legendary';audioService.playRpgFishingSound(special?'rare':'catch');if(!result.record)return;const timer=setTimeout(()=>{if(!document.hidden)audioService.playRpgFishingSound('record');},special?1350:600);return()=>clearTimeout(timer);},[result?.at,active]);
 useEffect(()=>{if(!active)audioService.stopRpgFishingSounds();return()=>audioService.stopRpgFishingSounds();},[active]);
}
