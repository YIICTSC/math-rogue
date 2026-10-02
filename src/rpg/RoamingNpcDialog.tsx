import React, { useEffect, useRef } from 'react';
import TranslatedUiTree from '../components/TranslatedUiTree';
import type { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';
import { assetUrl } from '../utils/assetPaths';
import type { Site, Adventurer } from './engine';
import { biomeAt } from './biomes';
import { getRoamingNpcEvent, ROAMING_NPC_UI_COPY, type RoamingNpcChoice } from './roamingNpcs';

type NpcResult = NonNullable<Adventurer['npcEventResults']>[string];

export default function RoamingNpcDialog({site,player,pending,blockedReason,onChoose,onClose,languageMode}:{
  site: Site;
  player: Adventurer;
  pending: boolean;
  blockedReason: string | null;
  onChoose: (choiceId: string) => void;
  onClose: () => void;
  languageMode: LanguageMode;
}) {
  const dialog=useRef<HTMLElement>(null);
  const event=getRoamingNpcEvent(site.npcEventId);
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current?.focus();return()=>previous?.focus();},[]);
  if(!event)return null;
  const seen=player.npcEventsSeen?.includes(site.id)||false;
  const result=player.npcEventResults?.[site.id];
  const chosen=event.choices.find(choice=>choice.id===result?.choiceId);
  const resultText=getNpcResultText(chosen,result);
  const copy=(text:string)=>trans(text,languageMode);
  const key=(e:React.KeyboardEvent)=>{if(e.key==='Escape'){e.stopPropagation();onClose();}if(e.key==='Tab'){const buttons=dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');if(!buttons?.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
  return <TranslatedUiTree mode={languageMode}><div className="rpg-dialog-backdrop" onClick={onClose}><section ref={dialog} tabIndex={-1} onKeyDown={key} className="rpg-story-dialog rpg-roaming-npc-dialog" role="dialog" aria-modal="true" aria-labelledby="rpg-roaming-npc-title" onClick={e=>e.stopPropagation()}>
    <small>{copy(biomeAt(site.x,site.y).name)} · {copy(ROAMING_NPC_UI_COPY.heading.ja)}</small>
    <div className="rpg-story-dialog-layout">
      <img className="rpg-story-dialog-portrait" src={assetUrl(event.portrait)} alt="" aria-hidden="true" />
      <div className="rpg-story-dialog-copy">
        <h2 id="rpg-roaming-npc-title">{copy(event.name.ja)}</h2>
        <h3>{copy(event.title.ja)}</h3>
        <p>{copy(event.description.ja)}</p>
        {resultText?<p className="rpg-npc-event-result" role="status">{copy(resultText)}</p>:seen?<p role="status">{copy(ROAMING_NPC_UI_COPY.resolved.ja)}</p>:blockedReason?<p role="status">{copy(blockedReason)}</p>:<div>{event.choices.map(choice=>{
          const cost='cost' in choice.effect ? choice.effect.cost || 0 : 0;
          const affordable=(player.profile?.gold||0)>=cost;
          return <button key={choice.id} disabled={pending||!affordable} onClick={()=>onChoose(choice.id)}>{copy(choice.label.ja)}</button>;
        })}{event.choices.some(choice=>'cost' in choice.effect&&(choice.effect.cost||0)>(player.profile?.gold||0))&&<p role="status">{copy(ROAMING_NPC_UI_COPY.insufficientGold.ja)}</p>}</div>}
        {pending&&<p role="status">{copy(ROAMING_NPC_UI_COPY.pending.ja)}</p>}
      </div>
    </div>
    <button className="rpg-npc-event-close" onClick={onClose}>{copy(ROAMING_NPC_UI_COPY.close.ja)}</button>
  </section></div></TranslatedUiTree>;
}

function getNpcResultText(choice:RoamingNpcChoice|undefined,result:NpcResult|undefined):string|null {
  if(!choice||!result)return null;
  if(result.outcome==='fallback')return ROAMING_NPC_UI_COPY.fallback.ja;
  if(result.outcome==='win')return choice.winResult?.ja||choice.result.ja;
  if(result.outcome==='lose')return choice.loseResult?.ja||choice.result.ja;
  return choice.result.ja;
}
