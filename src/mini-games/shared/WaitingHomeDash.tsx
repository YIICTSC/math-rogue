import React, {useState,useRef} from 'react';
import {createPortal} from 'react-dom';
import GoHomeDash from '../../components/GoHomeDash';
import {GameMode, type LanguageMode} from '../../types';
import './waitingHomeDash.css';

export default function WaitingHomeDash({languageMode}:{languageMode:LanguageMode}) {
 const [open,setOpen]=useState(false);const details=useRef<HTMLDetailsElement>(null);
 const L=(ja:string,en:string,hi:string)=>languageMode==='ENGLISH'?en:languageMode==='HIRAGANA'?hi:ja;
 return <details ref={details} className="online-waiting-dash" onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary><strong>{L('待っている間に遊ぼう','Play while you wait','まっているあいだにあそぼう')}</strong><span>{L('帰宅ダッシュ一発アウト · HP 1','One-hit Home Dash · HP 1','きたくダッシュいっぱつアウト · HP 1')}</span></summary>
  <p>{L('開始前は何度でもリトライできます','Retry as often as you like before the game starts','かいしまえはなんどでもリトライできます')}</p>
  {open&&createPortal(<section className="online-waiting-dash-stage" role="dialog" aria-modal="true" aria-label={L('帰宅ダッシュ一発アウト','One-hit Home Dash','きたくダッシュいっぱつアウト')}><header><b>{L('帰宅ダッシュ一発アウト · HP 1','One-hit Home Dash · HP 1','きたくダッシュいっぱつアウト · HP 1')}</b><button autoFocus onClick={()=>{if(details.current)details.current.open=false;setOpen(false);}}>{L('閉じる','Close','とじる')}</button></header><div className="online-waiting-dash-frame"><GoHomeDash onBack={()=>{}} problemMode={GameMode.MIXED} languageMode={languageMode} initialHp={1} initialMaxHp={1} compact exitEnabled={false}/></div></section>,document.body)}
 </details>;
}
