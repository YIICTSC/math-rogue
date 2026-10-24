import {audioService} from '../../../services/audioService';
import React from 'react';
import {assetUrl} from '../../../utils/assetPaths';
import {CHRONICLE_CHOICES,type ChronicleBranch,type chronicleScene} from './story';
import './chronicles.css';
export function ChronicleScene({scene,line,text,advance,choose,replay=false}:{scene:ReturnType<typeof chronicleScene>;line:number;text:(ja:string,en:string)=>string;advance:()=>void;choose:(branch:ChronicleBranch)=>void;replay?:boolean}){
 React.useEffect(()=>{audioService.stopDungeonChronicleVoices(true);if(line===0&&scene.ending)void audioService.playDungeonChronicleVoiceFile(scene.heroId,'ending-'+scene.branch);else if(scene.lines[Math.min(line,scene.lines.length-1)].speaker[0]===scene.npc[0])void audioService.playDungeonChronicleVoiceFile('npc-'+scene.routeId.toLowerCase(),scene.stage===1?'reveal':'talk');return()=>audioService.stopDungeonChronicleVoices();},[scene.routeId,scene.heroId,scene.stage,scene.ending,scene.branch,line]);
 const current=scene.lines[Math.min(line,scene.lines.length-1)],done=line>=scene.lines.length-1;
 return <section className="dungeon-chronicle" aria-label={text('迷宮の年代記','Dungeon chronicle')}>
  <div className="chronicle-art"><img className="chronicle-event" src={assetUrl(scene.eventArt)} alt=""/><img className="chronicle-npc" src={assetUrl(scene.portrait)} alt=""/></div>
  <div className="chronicle-copy"><p className="chronicle-eyebrow">{scene.ending?text('あなたが選んだ結末','The ending you chose'):text('迷宮の年代記','Dungeon chronicle')} · {scene.stage+1}/4</p><h3>{text(...scene.title)}</h3><strong>{text(...current.speaker)}</strong><p className="chronicle-dialogue" role="status" aria-live="polite">{text(...current.text)}</p>
   {done&&!scene.ending&&!replay?<div className="chronicle-choices">{CHRONICLE_CHOICES.map((c,i)=><button autoFocus={i===0} key={c.id} onClick={()=>choose(c.id)}><strong>{text(...c.label)}</strong><small>{text(...c.detail)}</small></button>)}</div>:<button autoFocus className="primary" onClick={advance}>{!done?text('次のことば','Next'):replay?text('記録へ戻る','Back to records'):text('結末を記録して町へ帰る','Record ending and return to town')}</button>}
   <small>{Math.min(line+1,scene.lines.length)}/{scene.lines.length}</small>
  </div>
 </section>;
}
