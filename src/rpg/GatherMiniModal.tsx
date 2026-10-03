import React,{useEffect,useRef,useState} from 'react';
import {X} from 'lucide-react';
import {audioService} from '../services/audioService';
import {trans} from '../utils/textUtils';
import type {LanguageMode} from '../types';
import type {World,Action} from './engine';
import {natureAt,type Work} from './life';
import LifeSprite from './LifeSprite';
import './life.css';

export default function GatherMiniModal({world,work,languageMode,send}:{world:World;work:Work;languageMode:LanguageMode;send:(a:Action)=>void}){
 const [clock,setClock]=useState(world.life.now),[pending,setPending]=useState(false),submitted=useRef(false),panel=useRef<HTMLElement>(null);
 const t=(s:string)=>trans(s,languageMode),fish=work.kind==='fish',node=natureAt(world,work.tile),duration=work.expires-work.started;
 useEffect(()=>{const before=document.activeElement as HTMLElement|null;panel.current?.focus();return()=>{if(before?.isConnected)before.focus();};},[]);
 useEffect(()=>{const base=world.life.now,start=performance.now(),timer=setInterval(()=>setClock(base+performance.now()-start),20);return()=>clearInterval(timer);},[world.life.now]);
 const confirm=()=>{if(submitted.current)return;submitted.current=true;setPending(true);audioService.playRpgLifeSound(fish?'reel':node?.rock?'mine':'gather');send({type:fish?'life-reel':'life-hit'});};
 const cancel=()=>{if(submitted.current)return;submitted.current=true;setPending(true);send({type:'life-cancel'});};
 const progress=Math.min(100,Math.max(0,(clock-work.started)/duration*100)),target=(work.target-work.started)/duration*100;
 const ready=fish?clock>=work.target&&clock<=work.expires:Math.abs(clock-work.target)<450;
 const zoneStart=(fish?work.target:work.target-450)-work.started,zoneEnd=work.target+450-work.started;
 return <div className="rpg-gather-screen" onPointerDown={e=>{if(!e.isPrimary||e.button!==0)return;e.preventDefault();e.stopPropagation();confirm();}} onClick={e=>{e.stopPropagation();if(e.detail===0)confirm();}}>
  <section ref={panel} className={`rpg-gather-mini ${ready?'is-ready':''}`} role="dialog" aria-modal="true" aria-label={t('採取アクション')} tabIndex={-1} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel();}else if((e.key===' '||e.key==='Enter')&&!(e.target as HTMLElement).closest('button')){e.preventDefault();e.stopPropagation();confirm();}else if(e.key==='Tab'){e.preventDefault();const close=panel.current?.querySelector<HTMLButtonElement>('button');if(document.activeElement===close)panel.current?.focus();else close?.focus();}}}>
   <header><LifeSprite index={fish?21:node?.sprite??0}/><div><small>{t(fish?'川釣り':node?.rock?'採掘する':'採取する')}</small><h2>{t(fish?'川釣り':node?.name||'採取')}</h2></div><button disabled={pending} aria-label={t('中断')} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();cancel();}}><X size={20}/></button></header>
   <p>{t(pending?'結果を確認中…':fish?(ready?'今！引き上げる':'浮きが沈んだら引き上げよう！'):'光るタイミングで道具を振ろう！')}</p>
   <div className="rpg-life-gauge rpg-gather-meter" aria-hidden="true"><span style={{left:`${Math.max(0,zoneStart/duration*100)}%`,width:`${(zoneEnd-zoneStart)/duration*100}%`}}/><i style={{left:`${target}%`}}/><b style={{left:`${progress}%`}}/></div>
   <strong className="rpg-gather-hint">{t('画面のどこでもタップして確定')}</strong>
  </section>
 </div>;
}
