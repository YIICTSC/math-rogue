import React, {useState} from 'react';
import GoHomeDash from '../../components/GoHomeDash';
import {GameMode, type LanguageMode} from '../../types';
import './waitingHomeDash.css';

export default function WaitingHomeDash({languageMode}:{languageMode:LanguageMode}) {
 const [open,setOpen]=useState(false);
 const L=(ja:string,en:string,hi:string)=>languageMode==='ENGLISH'?en:languageMode==='HIRAGANA'?hi:ja;
 return <details className="online-waiting-dash" onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary><strong>{L('待っている間に遊ぼう','Play while you wait','まっているあいだにあそぼう')}</strong><span>{L('帰宅ダッシュ一発アウト · HP 1','One-hit Home Dash · HP 1','きたくダッシュいっぱつアウト · HP 1')}</span></summary>
  <p>{L('開始前は何度でもリトライできます','Retry as often as you like before the game starts','かいしまえはなんどでもリトライできます')}</p>
  {open&&<div className="online-waiting-dash-frame"><GoHomeDash onBack={()=>{}} problemMode={GameMode.MIXED} languageMode={languageMode} initialHp={1} initialMaxHp={1} compact exitEnabled={false}/></div>}
 </details>;
}
