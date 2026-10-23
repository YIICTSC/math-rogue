import {createPortal} from 'react-dom';
import {PAPER_BRIDGE_TEXT} from '../data/paperPlaneBridgeText';
import React, {useCallback,useEffect,useRef,useState} from 'react';
import {PROTAGONISTS} from '../three/protagonistCatalog';
import {PAPER_BRIDGE_LINES,PAPER_VOICE_MS,PAPER_RIVALS,PAPER_DEPUTY_NAMES,PAPER_DEPUTY_ENGLISH} from '../data/paperPlaneBridge';
import {audioService} from '../services/audioService';
import {assetUrl} from '../utils/assetPaths';
import {trans} from '../utils/textUtils';
import type {LanguageMode} from '../types';
import './paperPlaneBridge.css';
export const PAPER_CAPTAINS=PROTAGONISTS.filter(h=>/^(high-school|magic)-/.test(h.id));
export type BridgeExpression='normal'|'command'|'damage'|'win';
export type BridgeCue={id:string;key:string;text:string;expression:BridgeExpression};
export type BridgeEvent='launch'|'fire'|'move'|'load'|'damage'|'critical'|'win'|'lose'|'hit'|'ready';
export const bridgePortrait=(id:string,expression:BridgeExpression='normal')=>assetUrl(`sprites/paper-plane/bridge/${id}${expression==='normal'?'':'-'+expression}.webp`);
export function bridgeSubtitle(cue:BridgeCue,language:LanguageMode){const entry=PAPER_BRIDGE_TEXT[cue.id+'/'+cue.key];return language==='ENGLISH'?(entry?.en||cue.text):language==='HIRAGANA'?(entry?.hira||cue.text):cue.text;}
export function bridgeExchange(event:BridgeEvent,captain:string,deputy:string,rival:string,variant=0):BridgeCue[]{
 const cue=(id:string,key:string):BridgeCue=>({id,key,text:PAPER_BRIDGE_LINES[id]?.[key]||'',expression:/damage|critical|lose/.test(key)?'damage':key==='win'?'win':/fire|ready/.test(key)?'command':'normal'});
 switch(event){
 case'launch':return[cue(captain,variant%2?'encounter':'launch'),cue(deputy,'launch'),cue(rival,'encounter')];
 case'ready':return[cue(deputy,variant%2?'ready2':'ready')];
 case'fire':return[cue(deputy,variant%2?'ready2':'ready'),cue(captain,variant%2?'fire2':'fire'),cue(rival,variant%2?'fire2':'fire')];
 case'win':return[cue(rival,'lose'),cue(deputy,'win'),cue(captain,'win')];
 case'lose':return[cue(captain,'lose'),cue(rival,'win')];
 case'hit':return[cue(rival,'damage')];
 case'damage':case'critical':return[cue(deputy,event),cue(captain,event)];
 default:return[cue(variant%2?captain:deputy,event)];
 }
}
/** A bounded communication queue, independent of the combat clock. */
export function usePaperBridge(captain:string,deputy:string,rival:string){
 const [current,setCurrent]=useState<BridgeCue|null>(null);
 const activeEvent=useRef<BridgeEvent|null>(null),prepared=useRef(false);
 const queue=useRef<BridgeCue[]>([]),generation=useRef(0),busy=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),serial=useRef<Record<string,number>>({}),lastAmbient=useRef(0),releaseTimer=useRef<(()=>void)|null>(null);
 const stop=useCallback(()=>{generation.current++;queue.current=[];busy.current=false;prepared.current=false;if(timer.current)clearTimeout(timer.current);timer.current=null;releaseTimer.current?.();releaseTimer.current=null;audioService.stopPaperPlaneVoices();setCurrent(null);},[]);
 const pump=useCallback(async()=>{
  if(busy.current)return;busy.current=true;const token=generation.current;
  while(queue.current.length&&token===generation.current){
   const cue=queue.current.shift()!;setCurrent(cue);
   const ms=PAPER_VOICE_MS[cue.id+'/'+cue.key]||2300;
   const played=await audioService.playPaperPlaneVoice(cue.id,cue.key).catch(()=>false);
   if(token!==generation.current)return;
   // Muted/blocked voices still show the complete subtitle without blocking gameplay.
   if(!played)await new Promise<void>(resolve=>{releaseTimer.current=resolve;timer.current=setTimeout(()=>{timer.current=null;releaseTimer.current=null;resolve();},Math.min(ms,3000));});
  }
  if(token===generation.current){busy.current=false;setCurrent(null);}
 },[]);
 const say=useCallback((event:BridgeEvent)=>{
  if(document.hidden)return;
  if(event==='ready'&&prepared.current)return;
  if(event==='move'||event==='load'){
   if(prepared.current||busy.current||Date.now()-lastAmbient.current<6500)return;lastAmbient.current=Date.now();
  }
  const wasPrepared=prepared.current;
  if(['win','lose','launch','critical','ready'].includes(event)||event==='fire'&&['launch','load','move'].includes(activeEvent.current||''))stop();
  if(event==='ready')prepared.current=true;
  if(event==='fire')prepared.current=false;
  activeEvent.current=event;
  const variant=serial.current[event]||0;serial.current[event]=variant+1;
  let cues=bridgeExchange(event,captain,deputy,rival,variant).filter(c=>c.text);
  if(event==='fire'&&wasPrepared)cues=cues.slice(1);
  // Finish a current call and response before reporting damage; discard old ambient chatter.
  if(queue.current.length>3&&event!=='win'&&event!=='lose')return;
  queue.current.push(...cues);void pump();
 },[captain,deputy,rival,pump,stop]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>{document.removeEventListener('visibilitychange',hide);stop();};},[stop]);
 return {current,say,stop};
}
export function PaperCaptainPicker({value,onChange,languageMode}:{value:string;onChange:(id:string)=>void;languageMode:LanguageMode}){
 const [chapter,setChapter]=useState(value.startsWith('magic-')?'magic':'high-school');
 const en=languageMode==='ENGLISH',l=(jp:string,english:string)=>en?english:trans(jp,languageMode);
 return <section className="paper-captain-picker"><h3>{l('艦長を選択','Choose your captain')}</h3><p>{l('高校編・マジック編の主人公が、あなたの艦隊を指揮します。','A hero from High School or Magic commands your fleet.')}</p><div className="paper-chapter-tabs">{['high-school','magic'].map(c=><button key={c} aria-pressed={chapter===c} onClick={()=>setChapter(c)}>{c==='magic'?l('マジック編','Magic'):l('高校編','High School')}</button>)}</div><div className="paper-captain-grid">{PAPER_CAPTAINS.filter(h=>h.id.startsWith(chapter+'-')).map((h,i)=><button key={h.id} data-gamepad-zone="paper-setup-captains" data-gamepad-order={i} data-gamepad-initial-choice={value===h.id} data-gamepad-down-zone="paper-captain-next" aria-pressed={value===h.id} onClick={()=>onChange(h.id)}><img src={bridgePortrait(h.id)} alt=""/><span>{trans(h.name,languageMode)}</span></button>)}</div></section>;
}
export function PaperBridgeHud({captain,deputy,rival,current,languageMode,critical,faceHost}:{captain:string;deputy:string;rival:typeof PAPER_RIVALS[number];current:BridgeCue|null;languageMode:LanguageMode;critical:boolean;faceHost:HTMLDivElement|null}){
 const en=languageMode==='ENGLISH',l=(jp:string,eng:string)=>en?eng:trans(jp,languageMode);
 const own=current?.id===captain,enemy=current?.id===rival.id;
 const captainName=trans(PAPER_CAPTAINS.find(h=>h.id===captain)?.name||'',languageMode);
 const faces=<><aside className={`paper-captain-window ${critical?'is-critical':''}`} aria-label={l('艦長通信','Captain communications')+' · '+captainName}><img data-expression={own?current.expression:critical?'damage':'normal'} src={bridgePortrait(captain,own?current.expression:critical?'damage':'normal')} alt=""/><div><small>{l('艦長','CAPTAIN')}</small><strong>{captainName}</strong></div></aside><aside className="paper-rival-window" aria-label={en?rival.en:trans(rival.name,languageMode)}><img src={bridgePortrait(rival.id,enemy?current.expression:'normal')} alt=""/><small>{en?rival.en:trans(rival.name,languageMode)}</small></aside></>;
 return <>{faceHost&&createPortal(faces,faceHost)}{current&&<div className={`paper-bridge-subtitle ${enemy?'is-enemy':''}`} role="status"><small>{enemy?l('敵艦通信','ENEMY COMMS'):own?l('艦長','CAPTAIN'):l('副官','FIRST OFFICER')+' · '+(en?PAPER_DEPUTY_ENGLISH[deputy]:trans(PAPER_DEPUTY_NAMES[deputy]||'',languageMode))}</small>{!own&&!enemy&&<img src={assetUrl(`sprites/paper-plane/pilots/${deputy}.webp`)} alt=""/>}<span>{bridgeSubtitle(current,languageMode)}</span></div>}</>;
}
export function PaperBattleTitle({resume,onResume,onStart,onHelp,onBack,languageMode}:{resume:boolean;onResume:()=>void;onStart:()=>void;onHelp:()=>void;onBack:()=>void;languageMode:LanguageMode}){
 const l=(jp:string,en:string)=>languageMode==='ENGLISH'?en:trans(jp,languageMode);
 return <section className="paper-battle-title" data-gamepad-navigation-root data-gamepad-initial-scope="paper-title"><img className="paper-title-art" src={assetUrl('sprites/paper-plane/bridge/title.webp')} alt=""/><div className="paper-title-copy"><small>ORIGAMI FLEET / TACTICAL BATTLE</small><h1>{l('紙飛行機バトル','PAPER PLANE BATTLE')}</h1><p>{l('その一枚が、空の運命を変える。','One sheet. A whole sky to change.')}</p><nav>{resume&&<button data-gamepad-zone="paper-title" data-gamepad-initial-choice onClick={onResume}>{l('航海を再開','Resume voyage')}</button>}<button data-gamepad-zone="paper-title" data-gamepad-initial-choice={!resume} onClick={onStart}>{l('新しい航海へ','New voyage')}</button><button data-gamepad-zone="paper-title" onClick={onHelp}>{l('遊び方','How to play')}</button><button data-gamepad-zone="paper-title" data-gamepad-back onClick={onBack}>{l('戻る','Back')}</button></nav></div></section>;
}
export function PaperBridgeReport({captain,current,won,languageMode}:{captain:string;current:BridgeCue|null;won:boolean;languageMode:LanguageMode}){
 const en=languageMode==='ENGLISH';
 return <div className="paper-bridge-report"><img src={current?(current.id.startsWith('PL_')?assetUrl(`sprites/paper-plane/pilots/${current.id}.webp`):bridgePortrait(current.id,current.expression)):bridgePortrait(captain,won?'win':'damage')} alt=""/><div><small>{current&&current.id!==captain?(current.id.startsWith('rival-')?(en?'ENEMY':trans('敵艦通信',languageMode)):(en?'FIRST OFFICER':trans('副官',languageMode))):(en?'CAPTAIN':trans('艦長',languageMode))}</small><p>{bridgeSubtitle(current||{id:captain,key:won?'win':'lose',text:PAPER_BRIDGE_LINES[captain]?.[won?'win':'lose']||'',expression:won?'win':'damage'},languageMode)}</p></div></div>;
}
