import React,{Suspense,lazy,useEffect,useRef} from 'react';
import{createPortal}from'react-dom';
import AvatarCreator from '../gakuro-kart/AvatarCreator';
import type{KartAvatar}from'../gakuro-kart/avatar';
import type{LanguageMode}from'../../types';
import{trans}from'../../utils/textUtils';
import './sportsCharacter.css';
const Preview=lazy(()=>import('./SportsCharacterPreview'));
export default function SportsCharacterDialog({avatar,onChange,onClose,languageMode,sport='dodgeball'}:{avatar:KartAvatar;onChange:(a:KartAvatar)=>void;onClose:()=>void;languageMode:LanguageMode;sport?:'tennis'|'dodgeball'|'basketball'}){
 const t=(s:string)=>trans(s,languageMode),root=useRef<HTMLElement>(null);
 useEffect(()=>{const old=document.activeElement as HTMLElement;root.current?.querySelector<HTMLButtonElement>('button')?.focus();return()=>old?.focus();},[]);
 return createPortal(<div className="sports-character-backdrop" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();onClose();}if(e.key==='Tab'){const items=[...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,[tabindex="0"]')].filter(n=>n.getClientRects().length);if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0]?.focus();}}}}><section ref={root} role="dialog" aria-modal="true" aria-label={t('キャラクタークリエイト')} className="sports-character-dialog"><header><h2>{t('キャラクタークリエイト')}</h2><button onClick={onClose}>{t('確定')} ×</button></header><div className="sports-character-body"><div className="sports-character-preview"><Suspense fallback={null}>{<Preview sport={sport} avatar={avatar} label={t(sport==='tennis'?'テニスの素振り':sport==='basketball'?'バスケットボールのシュート練習':'ドッジボールの投球練習')}/>}</Suspense></div><div className="sports-character-options"><AvatarCreator value={avatar} onChange={onChange} languageMode={languageMode} activity="sports" sport={sport}/></div></div></section></div>,document.body);
}
