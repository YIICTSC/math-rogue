import {audioService} from '../../../services/audioService';
import {hasEstablishedDungeonVoice} from '../student/battleVoicePolicy';
import React from 'react';
import {CHRONICLE_CHOICES,type ChronicleBranch,type chronicleScene} from './story';
import ConversationStage,{type Reaction} from '../../dialogue/ConversationStage';
import {chronicleHero} from './story';
import {studentHero} from '../student/content';
import './chronicles.css';
export function ChronicleScene({scene,line,text,advance,choose,replay=false,onClose,closeLabel}:{scene:ReturnType<typeof chronicleScene>;line:number;text:(ja:string,en:string)=>string;advance:()=>void;choose:(branch:ChronicleBranch)=>void;replay?:boolean;onClose?:()=>void;closeLabel?:string}){
 React.useEffect(()=>{audioService.stopDungeonChronicleVoices(true);if(line===0&&scene.ending){if(!hasEstablishedDungeonVoice(scene.heroId))void audioService.playDungeonChronicleVoiceFile(scene.heroId,'ending-'+scene.branch);}else if(scene.lines[Math.min(line,scene.lines.length-1)].speaker[0]===scene.npc[0])void audioService.playDungeonChronicleVoiceFile('npc-'+scene.routeId.toLowerCase(),scene.stage===1?'reveal':'talk');return()=>audioService.stopDungeonChronicleVoices();},[scene.routeId,scene.heroId,scene.stage,scene.ending,scene.branch,line]);
 const current=scene.lines[Math.min(line,scene.lines.length-1)],done=line>=scene.lines.length-1,hero=studentHero(scene.heroId),profile=chronicleHero(scene.heroId);
 const speaker=current.speaker[0]===scene.npc[0]?'right':current.speaker[0]===hero.name?'left':'narrator';
 const sequence:Reaction[][]=[['neutral','concern','concern','concern','resolve','neutral'],['concern','concern','concern','resolve','concern','resolve'],['neutral','concern','resolve','concern','resolve','resolve'],['neutral','concern','resolve','joy','joy','joy']];
 const endingMoods:Reaction[]=scene.branch==='release'?['concern','concern','resolve','joy','joy','neutral']:scene.branch==='defy'?['resolve','concern','resolve','resolve','joy','resolve']:sequence[3];
 const reaction=(scene.ending?endingMoods:sequence[Math.min(scene.stage,3)])[Math.min(line,5)],listening=scene.ending?reaction:scene.stage===1?'concern':'neutral';
 return <ConversationStage className="dialogue-chronicle" title={text(...scene.title)} eyebrow={`${scene.ending?text('あなたが選んだ結末','The ending you chose'):text('迷宮の年代記','Dungeon chronicle')} · ${scene.stage+1}/4`} background={scene.background}
 left={{id:scene.heroId,name:text(hero.name,profile.en),reaction:speaker==='left'?reaction:listening}}
 right={{id:'chronicle-'+scene.routeId.toLowerCase(),name:text(...scene.npc),reaction:speaker==='right'?reaction:listening}}
 active={speaker} speaker={text(...current.speaker)} text={text(...current.text)} lineKey={`${scene.routeId}:${scene.stage}:${line}`} progress={`${Math.min(line+1,scene.lines.length)} / ${scene.lines.length}`} onClose={onClose} closeLabel={closeLabel||text('冒険に戻る','Resume')}>
 {done&&!scene.ending&&!replay?<div className="conversation-choice-group chronicle-choices">{CHRONICLE_CHOICES.map((c,i)=><button autoFocus={i===0} data-gamepad-initial-choice={i===0} key={c.id} onClick={()=>choose(c.id)}><strong>{text(...c.label)}</strong><small>{text(...c.detail)}</small></button>)}</div>:<button autoFocus data-gamepad-initial-choice className="conversation-primary" onClick={advance}>{!done?text('次のことば','Next'):replay?text('記録へ戻る','Back to records'):text('結末を記録して町へ帰る','Record ending and return to town')}</button>}
 </ConversationStage>;
}
