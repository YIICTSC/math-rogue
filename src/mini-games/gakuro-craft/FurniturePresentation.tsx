import React,{useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {assetUrl} from '../../utils/assetPaths';
import type {GameKind} from './homeGames';
import {GAME_LABELS} from './partyGames';
import './furniturePresentation.css';
export const furnitureTitleArt=(kind:string)=>assetUrl(`sprites/rpg/game-room/titles/${kind==='bowling'?'coindozer':kind}.webp`);
export function FurnitureTitle({kind,t}:{kind:GameKind;t:(s:string)=>string}){return <header className="gc-title-art" style={{'--title-art':`url("${furnitureTitleArt(kind)}")`} as React.CSSProperties}><div><small>GAKURO · GAME CLUB</small><h2>{t(GAME_LABELS[kind])}</h2><p>{t('ひとりでも、仲間とでも。自分だけの冒険を始めよう。')}</p><span>01 — 04 PLAYERS</span></div></header>;}
export function FurnitureViewport({active,children}:{active:boolean;children:React.ReactNode}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!active)return;const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';root.current?.focus();return()=>{document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};},[active]);
 if(!active)return <>{children}</>;
 return createPortal(<div className="gc-furniture-viewport" ref={root} tabIndex={-1} onKeyDown={e=>{if(e.key!=='Tab')return;const nodes=Array.from<HTMLElement>(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]')||[]).filter(n=>n.getClientRects().length>0),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===root.current)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===root.current)){e.preventDefault();first?.focus();}}}>{children}</div>,document.body);
}
