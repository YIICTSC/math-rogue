import React from 'react';
import {ArrowLeft,ArrowRight,Link2,Users} from 'lucide-react';
import type {LanguageMode} from '../../types';
import ResponsiveTitleArt from '../shared/ResponsiveTitleArt';
import ModeArt from './ModeArt';
import {local,BRANDS,SPORT_NAMES} from './copy';
import type {SportId} from './core';
import type {SoloIntent} from './modes';
import './preparation.css';
export default function AcademyLaunch({sport,languageMode,onSolo,onHost,onJoin,onBack}:{sport:SportId;languageMode:LanguageMode;onSolo:(intent:SoloIntent)=>void;onHost:()=>void;onJoin:()=>void;onBack:()=>void}){
 const L=local(languageMode),choices:[SoloIntent,string,string,number][]=[['match',L('ひとりで遊ぶ','Solo match','ひとりであそぶ'),L('CPUと対戦','Play the CPU','CPUとたいせん'),0],...(sport==='festival'?[]:[['practice',L('プラクティス','Practice','プラクティス'),L('アクションを練習','Train each action','アクションをれんしゅう'),1] as [SoloIntent,string,string,number]]),['watch',L('観戦する','Watch','かんせんする'),L('CPU同士の試合','CPU exhibition','CPUどうしのしあい'),sport==='baseball'?5:7]];
 return <main className={`ac-launch ac-launch-${sport}`} data-academy-launch={sport} data-gamepad-modal data-gamepad-initial-scope={`academy-${sport}-entry`} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();onBack();}}}><ResponsiveTitleArt game={sport} className="ac-launch-background"/><div className="ac-launch-shade"/><header><button onClick={onBack}><ArrowLeft size={18}/>{L('スポーツへ戻る','Sports club','スポーツへもどる')}</button><span>GAKURO ATHLETICS</span></header><div className="ac-launch-brand"><small>PLAY / LEARN / TOGETHER</small><h1>{L(...SPORT_NAMES[sport])}</h1><p>{BRANDS[sport]}</p></div><section className="ac-launch-menu" aria-label={L('遊び方を選ぶ','Choose how to play','あそびかたをえらぶ')}><div className="ac-launch-choices">{choices.map(([id,title,description,index])=><button key={id} data-intent={id} data-gamepad-initial-choice={id==='match'||undefined} onClick={()=>onSolo(id)}><ModeArt sport={sport} index={index}/><span><b>{title}</b><small>{description}</small></span><ArrowRight size={20}/></button>)}</div><nav className="ac-launch-online"><button onClick={onHost}><Users size={19}/><span>{L('オンラインの部屋を作る','Create online room','オンラインのへやをつくる')}</span></button><button onClick={onJoin}><Link2 size={19}/><span>{L('招待に参加する','Join invitation','しょうたいにさんかする')}</span></button></nav></section></main>;
}
