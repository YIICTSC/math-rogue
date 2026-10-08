import {useEffect,useRef} from 'react';
import {audioService,type BgmPlaybackOptions} from '../../services/audioService';
import type {Run} from './engine';
export type VrCue='select'|'alert'|'bubble'|'hold'|'reload'|'collect'|'door'|'correct'|'wrong'|'clear'|'fail'|'countdown';
export const VR_CUES:VrCue[]=['select','alert','bubble','hold','reload','collect','door','correct','wrong','clear','fail','countdown'];
export function cue(kind:VrCue){audioService.playVrSound(kind);}
type Track=Parameters<typeof audioService.playBGM>[0];
export function vrTrack(screen:'title'|'avatar'|'lesson'|'lobby'|'training'|'royale'|'quiz'|'clear'|'fail',mission=1):{type:Track;options:BgmPlaybackOptions}{
 const tracks:Record<string,{type:Track;options:BgmPlaybackOptions}>={title:{type:'kocho_setup',options:{mode:'OLD'}},avatar:{type:'shop',options:{mode:'NEW',theme:'high-school'}},lesson:{type:'relic_select',options:{mode:'NEW',theme:'high-school'}},lobby:{type:'paper_plane_setup',options:{mode:'OLD'}},royale:{type:'survivor_metal',options:{mode:'OLD'}},quiz:{type:'math',options:{mode:'NEW',theme:'elementary'}},clear:{type:'victory',options:{mode:'NEW',theme:'high-school'}},fail:{type:'game_over',options:{mode:'OLD',theme:'elementary'}}};
 const areas:Track[]=['school_psyche','dungeon_gym','dungeon_library','dungeon_roof','dungeon_science','dungeon_boss','dungeon_gym','dungeon_science','dungeon_music','paper_plane_battle'];
 return tracks[screen]??{type:areas[(mission-1)%10],options:{mode:'OLD'}};
}
export function useVrBgm(screen:Parameters<typeof vrTrack>[0],mission=1,priority=30){const scope=useRef<ReturnType<typeof audioService.acquireBgmScene>|null>(null);useEffect(()=>{const track=vrTrack(screen,mission);scope.current=audioService.acquireBgmScene(track.type,track.options,priority);return()=>{scope.current?.();scope.current=null;};},[]);useEffect(()=>{const track=vrTrack(screen,mission);scope.current?.update(track.type,track.options);},[screen,mission]);}
export function createRunAudio(){let prior:Run|null=null,lastCountdown=-1;return(s:Run,limit?:number)=>{if(limit!==undefined){const remaining=Math.ceil(limit-s.time);if(remaining<=10&&remaining>0&&remaining!==lastCountdown&&s.status==='playing'){cue('countdown');lastCountdown=remaining;}}if(prior){if(s.detection>0&&prior.detection===0)cue('alert');if(s.ammo<prior.ammo)cue('bubble');if(s.holds>prior.holds)cue('hold');if(s.collected.filter(Boolean).length>prior.collected.filter(Boolean).length)cue('collect');if(s.switches.filter(Boolean).length>prior.switches.filter(Boolean).length)cue('door');if(s.status!==prior.status&&s.status!=='playing')cue(s.status==='clear'?'clear':'fail');}prior={...s,collected:[...s.collected],switches:[...s.switches]};};}
