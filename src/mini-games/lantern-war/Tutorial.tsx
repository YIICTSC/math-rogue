import React,{useEffect,useRef,useState,useContext}from'react';
import guides from './tutorialData.json';
import {LanternLanguage}from'./language';
import {assetUrl}from'../../utils/assetPaths';
export const GUIDE_TOPICS=['battle','formation','tactics','bonds','forge','journal'] as const;
export type GuideTopic=typeof GUIDE_TOPICS[number];
export const guideKey=(topic:GuideTopic)=>'learning-rogue:lantern-war:guide:v1:'+topic;
const rows=Object.values(guides);export const GUIDE_ENGLISH=Object.fromEntries(rows.flatMap(g=>[[g.title,Object.entries(guides).find(([,v])=>v===g)?.[0]==='battle'?'Battle guide':({formation:'Formation guide',tactics:'Tactics guide',bonds:'Support guide',forge:'Training and forge guide',journal:'Journal guide'} as Record<string,string>)[Object.keys(guides).find(k=>guides[k as GuideTopic]===g)!]],...g.slides.flatMap(s=>[[s.title,s.englishTitle],[s.body,s.englishBody]])]));
export const GUIDE_HIRAGANA=Object.fromEntries(rows.flatMap(g=>[[g.title,g.hiraganaTitle],...g.slides.flatMap(s=>[[s.title,s.hiraganaTitle],[s.body,s.hiraganaBody]])]));
const words=[['遊び方','How to play','あそびかた'],['あとで読む','Read later','あとでよむ'],['前へ','Previous','まえへ'],['次へ','Next','つぎへ'],['理解した','Got it','りかいした']];for(const [ja,en,hira]of words){GUIDE_ENGLISH[ja]=en;GUIDE_HIRAGANA[ja]=hira;}
export function Tutorial({topic,onOpen,blocked=false}:{topic:GuideTopic;onOpen?:()=>void;blocked?:boolean}){
 const language=useContext(LanternLanguage),en=language==='ENGLISH',hira=language==='HIRAGANA';
 const [open,setOpen]=useState(()=>{try{return !blocked&&!localStorage.getItem(guideKey(topic));}catch{return !blocked;}}),[page,setPage]=useState(0);
 const node=useRef<HTMLDivElement>(null),callback=useRef(onOpen);callback.current=onOpen;const previous=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(!open)return;previous.current=document.activeElement as HTMLElement;callback.current?.();node.current?.focus();return()=>{if(previous.current?.isConnected)previous.current.focus();};},[open]);
 const close=()=>{try{localStorage.setItem(guideKey(topic),'seen');}catch{/* Session access still works. */}setOpen(false);};
 const g=guides[topic],s=g.slides[page],l=(ja:string)=>en?GUIDE_ENGLISH[ja]||ja:hira?GUIDE_HIRAGANA[ja]||ja:ja;
 const image=s.visual==='map'?'field-guide':s.visual==='bonds'?'story-guide':topic==='battle'&&page===0?'battle-guide':topic==='formation'&&page===0?'camp-guide':null;
 return <><button className="lw-help" disabled={blocked} onClick={()=>{setPage(0);setOpen(true);}}>{l('遊び方')}</button>{open&&<div className="lw-guide-backdrop" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const buttons=node.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');if(!buttons?.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===node.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}>
 <div className="lw-guide lw-panel" role="dialog" aria-modal="true" aria-label={l(g.title)} tabIndex={-1} ref={node} data-gamepad-navigation-root><header><small>FIELD MANUAL · {page+1} / {g.slides.length}</small><h2>{l(g.title)}</h2></header>
 {image?<img className="lw-guide-image" src={assetUrl('sprites/lantern-war/tutorial/'+image+'.webp')} alt=""/>:<div className={'lw-guide-diagram '+s.visual} aria-hidden="true">{s.visual==='formation'?<><span>FRONT 🛡 ⚔ 🛡</span><span>REAR 🏹 ✦ ✚</span></>:s.visual==='resources'?<><span>AP ◆ → ⚔ / ✚</span><span>PP ◇ → 🛡 / ↩</span></>:s.visual==='rest'?<><span>⏱ 8s</span><span>AP 0 · PP 0</span></>:<><span>⚑ ─ ◆ ─ ♜</span><span>→ → →</span></>}</div>}
 <article><h3>{l(s.title)}</h3><p>{l(s.body)}</p></article><footer><button onClick={close}>{l('あとで読む')}</button><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>{l('前へ')}</button><button className="lw-primary" onClick={()=>page+1===g.slides.length?close():setPage(p=>p+1)}>{l(page+1===g.slides.length?'理解した':'次へ')}</button></footer></div></div>}</>;
}
