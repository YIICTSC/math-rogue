import {useEffect,useRef} from 'react';
import type {HomeGame} from './homeGames';
import {audioService} from '../../services/audioService';
import {gameAudioSnapshot,gameAudioEvents,GAME_SOUND_BANK,type GameAudioSnapshot,type HobbySound} from './gameAudio';
export default function useGameAudio(g:HomeGame|undefined,selfId:string,active:boolean,worldTime=0){
 const pending=useRef(new Set<number>());
 const previous=useRef<GameAudioSnapshot>(),last=useRef<Partial<Record<HobbySound,number>>>({});
 useEffect(()=>{if(!g){previous.current=undefined;return;}const now=gameAudioSnapshot(g,selfId),cues=gameAudioEvents(previous.current,now);previous.current=now;if(!active)return;const time=performance.now();for(const cue of cues){if(time-(last.current[cue]??-Infinity)<(cue==='pool-hit'||cue==='pool-rail'?90:60))continue;last.current[cue]=time;if(cue==='race-move'||cue==='board-flip'){const timer=window.setTimeout(()=>{pending.current.delete(timer);audioService.playHobbySound(cue);},cue==='race-move'?220:90);pending.current.add(timer);}else audioService.playHobbySound(cue);}},[g,selfId,active]);
 useEffect(()=>{if(!active||!g)return;void audioService.preloadHobbySounds(GAME_SOUND_BANK[g.kind]);return()=>{pending.current.forEach(clearTimeout);pending.current.clear();audioService.stopHobbySounds();};},[g?.key,g?.kind,active]);
 useEffect(()=>{if(!active)return;const unlock=()=>audioService.init();window.addEventListener('pointerdown',unlock,true);window.addEventListener('keydown',unlock,true);return()=>{window.removeEventListener('pointerdown',unlock,true);window.removeEventListener('keydown',unlock,true);};},[active]);
 const signal=g?.party?.signal;
 useEffect(()=>{if(!active||g?.phase!=='playing'||g.kind!=='reaction'||!signal)return;const timer=window.setTimeout(()=>audioService.playHobbySound('signal'),Math.max(0,(signal.at-worldTime)*1000));return()=>clearTimeout(timer);},[g?.key,signal?.at,active]);
}
