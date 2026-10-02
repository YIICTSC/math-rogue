import React, { useEffect, useRef } from 'react';
import TranslatedUiTree from '../components/TranslatedUiTree';
import type { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';
import { STORIES, storyDialogue, type StoryAction } from './stories';
import type { Adventurer, Site } from './engine';
import { biomeAt } from './biomes';
export function StoryJournal({player,onTrack,languageMode}:{languageMode:LanguageMode;player:Adventurer;onTrack:(x:number,y:number)=>void}) {
 return <TranslatedUiTree mode={languageMode}><details className="rpg-journal"><summary>冒険手帳 · {Object.values(player.stories||{}).filter(p=>p.stage==='complete').length} / {STORIES.length}</summary>
 <p>依頼は好きな順番で進められます。</p>{STORIES.map(s=>{
  const progress=player.stories?.[s.id];const goal=progress?.stage==='accepted';
  return <button key={s.id} onClick={()=>onTrack(goal?s.goalX:s.x,goal?s.goalY:s.y)}><strong>{s.title}</strong><small>{progress?.stage==='complete'?'完了':goal?s.goal:progress?.stage==='found'?`${trans(s.npc,languageMode)} · ${trans("報告",languageMode)}`:s.npc} · {biomeAt(s.x,s.y).name}</small></button>;
 })}</details></TranslatedUiTree>;
}
export function StoryDialog({site,player,send,onClose,languageMode}:{languageMode:LanguageMode;site:Site;player:Adventurer;send:(a:StoryAction)=>void;onClose:()=>void}) {
 const {story,text,choices}=storyDialogue(site,player);
 const dialog=useRef<HTMLElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current?.focus();return()=>previous?.focus();},[]);
 const key=(e:React.KeyboardEvent)=>{if(e.key==='Escape'){e.stopPropagation();onClose();}if(e.key==='Tab'){const buttons=dialog.current?.querySelectorAll<HTMLButtonElement>('button');if(!buttons?.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
 return <TranslatedUiTree mode={languageMode}><div className="rpg-dialog-backdrop" onClick={onClose}><section ref={dialog} tabIndex={-1} onKeyDown={key} className="rpg-story-dialog" role="dialog" aria-modal="true" aria-labelledby="rpg-story-title" onClick={e=>e.stopPropagation()}>
 <small>{biomeAt(site.x,site.y).name} · {story.title}</small><h2 id="rpg-story-title">{site.storyRole==='npc'?story.npc:story.goal}</h2>
 <p>{text}</p><div>{choices.map(c=><button key={c.id} onClick={()=>send({type:'story-choice',siteId:site.id,choice:c.id})}>{c.label}</button>)}<button onClick={onClose}>会話を終える</button></div>
 </section></div></TranslatedUiTree>;
}
