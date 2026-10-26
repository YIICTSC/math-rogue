import React,{useEffect,useState} from 'react';
import {playStarStory,stopStarVoice} from './voice';
import ConversationStage from '../../components/dialogue/ConversationStage';
import {starDialogue} from './conversation';
export function StoryPresentation({title,art,lines,children,en=false,onExit,progress}:{title:string;art:string;lines:{id:string;speaker:string;text:string}[];children?:React.ReactNode;en?:boolean;onExit?:()=>void;progress?:{index:number;total:number}}){
 const [line,setLine]=useState(0),[playing,setPlaying]=useState(false),[replay,setReplay]=useState(0),current=lines[Math.min(line,lines.length-1)];
 useEffect(()=>{setLine(0);},[art,title]);
 useEffect(()=>{let live=true;setPlaying(true);void playStarStory(current.id).finally(()=>{if(live)setPlaying(false);});return()=>{live=false;stopStarVoice();};},[current.id,replay]);
 const chapter=Number(art.match(/events\/(\d+)\.webp/)?.[1]||0),actors=starDialogue(chapter,current.id,en);
 return <ConversationStage className="st-story-backdrop" theme="sea" title={title} eyebrow={`STAR TIDE · ${en?'STORY':'物語'}`} background={art} illustration={!!art&&actors.active==='narrator'} {...actors} speaker={current.speaker} text={current.text} lineKey={current.id+':'+line} progress={`${progress?.index??line+1} / ${progress?.total??lines.length}`} onClose={onExit} closeLabel={en?'Close':'閉じる'}>
 <button onClick={()=>setReplay(v=>v+1)} aria-label={en?'Replay voice':'もう一度聞く'}>{playing?'◖':'▷'} {en?'Voice':'ボイス'}</button>
 {line<lines.length-1?<button autoFocus data-gamepad-initial-choice className="conversation-primary" onClick={()=>setLine(v=>v+1)}>{en?'Next':'次のことば'} →</button>:<div className="st-dialogue-choices">{children}</div>}
 </ConversationStage>;
}
