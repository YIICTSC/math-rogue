import React from 'react';
import type {LanguageMode} from '../../types';
import type {Config,SportId} from './core';
import {local} from './copy';
import {PRACTICE_MODES,modeCard} from './modes';
import ModeArt from './ModeArt';
export default function ModePicker({sport,config,languageMode,onChange}:{sport:SportId;config:Config;languageMode:LanguageMode;onChange:(c:Partial<Config>)=>void}){
 const L=local(languageMode),practice=config.mode!=='match'&&config.mode!=='watch',category=practice?'practice':config.mode,selected=modeCard(sport,config);
 const chooseCategory=(id:string)=>{const first=PRACTICE_MODES[sport][0];onChange(id==='practice'?{mode:first.mode,drill:first.drill}:{mode:id as 'match'|'watch',drill:undefined});};
 return <div className="ac-mode-browser"><div className="ac-category-tabs" role="tablist" aria-label={L('モードの種類','Mode category','モードのしゅるい')}>{(['match',...(PRACTICE_MODES[sport].length?['practice']:[]),'watch'] as const).map(id=><button key={id} role="tab" aria-selected={category===id} onClick={()=>chooseCategory(id)}>{id==='match'?L('対戦','Match','たいせん'):id==='practice'?L('プラクティス','Practice','プラクティス'):L('観戦','Watch','かんせん')}</button>)}</div>{practice?<div className="ac-illustrated-modes" data-count={PRACTICE_MODES[sport].length}>{PRACTICE_MODES[sport].map(m=><button key={m.id} aria-pressed={selected.id===m.id} data-mode={m.id} onClick={()=>onChange({mode:m.mode,drill:m.drill})}><ModeArt sport={sport} index={m.art}/><b>{L(...m.name)}</b><span aria-hidden="true">{selected.id===m.id?'✓':'›'}</span></button>)}</div>:<div className="ac-mode-feature"><ModeArt sport={sport} index={selected.art}/><div><h3>{L(...selected.name)}</h3><p>{L(...selected.description)}</p></div></div>}<p className="ac-mode-description" aria-live="polite">{L(...selected.description)}{practice&&<small>{config.drill?L('5回チャレンジ・成功数を記録','Five attempts · track your successes','5かいチャレンジ・せいこうすうをきろく'):L('10打席で練習','Practice over ten at-bats','10だせきでれんしゅう')}</small>}</p></div>;
}
