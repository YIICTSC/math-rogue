import {FishingFrame} from './FishSprite';
import {biomeAt} from './biomes';
import {reelWindow} from './fishing';
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
 const [clock,setClock]=useState(world.life.now),[pending,setPending]=useState(false),submitted=useRef(false),bitePlayed=useRef(false),panel=useRef<HTMLElement>(null);
 const t=(s:string)=>trans(s,languageMode),fish=work.kind==='fish',node=natureAt(world,work.tile),duration=work.expires-work.started;
 useEffect(()=>{const before=document.activeElement as HTMLElement|null;panel.current?.focus();return()=>{if(before?.isConnected)before.focus();};},[]);
 useEffect(()=>{const base=world.life.now,start=performance.now(),timer=setInterval(()=>setClock(base+performance.now()-start),20);return()=>clearInterval(timer);},[world.life.now]);
 const confirm=()=>{if(submitted.current)return;submitted.current=true;setPending(true);if(fish)audioService.playRpgFishingSound(work.fishing?.phase==='bite'?'hook':'reel');else audioService.playRpgLifeSound(node?.rock?'mine':'gather');send(fish?{type:'life-reel',phaseTarget:work.target}:{type:'life-hit'});};
 const cancel=()=>{if(submitted.current)return;submitted.current=true;setPending(true);if(fish)audioService.stopRpgFishingSounds();send({type:'life-cancel'});};
 const progress=Math.min(100,Math.max(0,(clock-work.started)/duration*100)),target=(work.target-work.started)/duration*100;
 const reeling=work.fishing?.phase==='reel',window=work.fishing?reelWindow(work.fishing.id):450;
 const ready=fish?(reeling?Math.abs(clock-work.target)<=window:clock>=work.target&&clock<=work.expires):Math.abs(clock-work.target)<450;
 useEffect(()=>{if(!fish||reeling||pending||bitePlayed.current||world.life.now>work.expires)return;const timer=setTimeout(()=>{if(bitePlayed.current)return;bitePlayed.current=true;audioService.playRpgFishingSound('bite');},Math.max(0,work.target-world.life.now));return()=>clearTimeout(timer);},[fish,reeling,pending,work.target,work.expires,world.life.now]);
 const zoneStart=(fish&&!reeling?work.target:work.target-(fish?window:450))-work.started,zoneEnd=(fish&&!reeling?work.expires:work.target+(fish?window:450))-work.started;
 return <div className="rpg-gather-screen" onPointerDown={e=>{if(!e.isPrimary||e.button!==0)return;e.preventDefault();e.stopPropagation();confirm();}} onClick={e=>{e.stopPropagation();if(e.detail===0)confirm();}}>
  <section ref={panel} className={`rpg-gather-mini ${ready?'is-ready':''} ${fish?'rpg-fishing-mini':''}`} role="dialog" aria-modal="true" aria-label={t('採取アクション')} tabIndex={-1} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel();}else if((e.key===' '||e.key==='Enter')&&!(e.target as HTMLElement).closest('button')){e.preventDefault();e.stopPropagation();confirm();}else if(e.key==='Tab'){e.preventDefault();const close=panel.current?.querySelector<HTMLButtonElement>('button');if(document.activeElement===close)panel.current?.focus();else close?.focus();}}}>
   <header>{fish?<FishingFrame index={ready?2:0}/>:<LifeSprite index={node?.sprite??0}/>}<div><small>{t(fish?'川釣り':node?.rock?'採掘する':'採取する')}</small><h2>{t(fish?'川釣り':node?.name||'採取')}</h2></div><button disabled={pending} aria-label={t('中断')} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();cancel();}}><X size={20}/></button></header>
   {fish&&<div className={`rpg-fishing-scene ${ready?'is-biting':''} ${reeling?'is-reeling':''}`} style={{'--water':biomeAt(work.tile%192,Math.floor(work.tile/192)).color} as React.CSSProperties}><div className="rpg-fishing-water"/><FishingFrame index={reeling?3:ready?2:Math.floor(clock/500)%2}/>{reeling&&<span className="rpg-fishing-shadow"><FishingFrame index={4+Math.floor(clock/450)%2}/></span>}<small>{t(biomeAt(work.tile%192,Math.floor(work.tile/192)).name)}</small></div>}
   <p>{t(pending?'結果を確認中…':fish?(reeling?(ready?'今！巻く！':'光る範囲で巻いて、魚を引き寄せよう！'):(ready?'今！引き上げる':'浮きが沈んだら引き上げよう！')):'光るタイミングで道具を振ろう！')}</p>
   <div className="rpg-life-gauge rpg-gather-meter" aria-hidden="true"><span style={{left:`${Math.max(0,zoneStart/duration*100)}%`,width:`${(zoneEnd-zoneStart)/duration*100}%`}}/><i style={{left:`${target}%`}}/><b style={{left:`${progress}%`}}/></div>
   {reeling&&<div className="rpg-fishing-beats">{[0,1,2].map(i=><span key={i} className={i<(work.fishing?.hits||0)?'is-hit':''}>◆</span>)}<b>{work.fishing?.beat||0}/3 · {t('成功')} {work.fishing?.hits||0}/2</b></div>}
   <strong className="rpg-gather-hint">{t('画面のどこでもタップして確定')}</strong>
  </section>
 </div>;
}
