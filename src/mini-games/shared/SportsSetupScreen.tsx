import React from 'react';
import OnlineEntryScreen from './OnlineEntryScreen';
import type {LanguageMode} from '../../types';
import {trans} from '../../utils/textUtils';
import './sportsSetup.css';

type Member={id:string;name:string;connected:boolean;spectator?:boolean};
/** Shared clubhouse: scenery and members on the left, preparation and a fixed start action on the right. */
export default function SportsSetupScreen({sport,brand,title,preview,caption,children,footer,onBack,languageMode,members,selfId,capacity=24,previewActions}:{sport:'golf'|'tennis'|'dodgeball'|'basketball';brand:string;title:string;preview:React.ReactNode;caption?:React.ReactNode;children:React.ReactNode;footer:React.ReactNode;onBack:()=>void;languageMode:LanguageMode;members?:Member[];selfId?:string;capacity?:number;previewActions?:React.ReactNode}){
 const t=(s:string)=>trans(s,languageMode);
 return <OnlineEntryScreen className={`sp-setup sp-${sport} ${members?'sp-lobby':''}`} brand={brand} title={title} languageMode={languageMode} onBack={onBack} caption={!members?caption:undefined} footer={footer} preview={<><div className="sp-scene">{preview}</div>{previewActions&&<div className="sp-preview-tools">{previewActions}</div>}{members&&<section className="sp-members"><header><strong>{t('出場者')}</strong><span>{members.filter(p=>p.connected&&!p.spectator).length} / {capacity}</span></header><div>{members.map(p=><span key={p.id} data-self={p.id===selfId} data-offline={!p.connected} data-allow-japanese="true">{p.id===selfId?'◆ ':''}{p.name}{p.spectator&&<small>{t('観戦中')}</small>}</span>)}</div></section>}</>}>{children}</OnlineEntryScreen>;
}
