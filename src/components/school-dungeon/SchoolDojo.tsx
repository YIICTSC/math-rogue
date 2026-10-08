import React,{useState} from 'react';
import {DOJO_STAGES} from './dojo';
import type {SchoolAdventure} from './useSchoolAdventure';
export default function SchoolDojo({adventure:a}:{adventure:SchoolAdventure}){
 const l=a.text,[selected,setSelected]=useState(a.dojoRun?.stage||1),[hint,setHint]=useState(false),records=a.base.dojo||{},run=a.dojoRun;
 const stage=DOJO_STAGES[(run?.stage||selected)-1];
 if(run)return <><h3>{run.stage}. {l(stage.name,stage.en)}</h3><p>{l(stage.lesson,stage.english)}</p><p>HP {run.hp}/7 · {l('お腹','Food')} {run.food} · {l('手数','Turns')} {run.turns}/{stage.limit}</p>
 <p>{l('移動・攻撃はいつもの十字キーとAボタン。Bで道具とヒント、Rで道具を使えます。','Use the usual D-pad and A button to move and attack. B opens tools and hints; R uses your tool.')}</p>
 <div className="school-adventure-action-grid"><button disabled={run.won||run.failed||!run.charges} onClick={()=>a.dojoStep({type:'TOOL'},true)}>{l('道具を使う','Use tool')} ({run.charges})</button><button onClick={()=>setHint(v=>!v)}>{l('先生のヒント','Teacher hint')}</button><button onClick={()=>a.beginDojo(run.stage)}>{l('やり直す','Restart')}</button><button onClick={a.exitDojo}>{l('50ステージ一覧','All 50 stages')}</button></div>
 {hint&&<p className="school-adventure-message">{l(stage.hint,stage.hintEn)}</p>}
 {(run.won||run.failed)&&<div className="school-adventure-message">{run.won?l('練習クリア！学んだ作戦を冒険でも使おう。','Lesson cleared! Use this strategy in your adventure.'):l('もう一度考えてみよう。道具・位置・手数を見直そう。','Try again. Review your tools, position and turn budget.')}{run.won&&run.stage<50&&<button onClick={()=>a.beginDojo(run.stage+1)}>{l('次の練習へ','Next lesson')}</button>}</div>}</>;
 return <div className="school-dojo"><p>{l('風来の小学生道場：冒険とは別の持ち物で練習。失敗しても倉庫や救助に影響しません。','School Wanderer dojo: practice with separate supplies. Failure never affects your warehouse or rescue.')} {Object.keys(records).length}/50</p><div className="school-dojo-stages">{DOJO_STAGES.map(s=><button key={s.id} className={selected===s.id?'primary':''} onClick={()=>setSelected(s.id)}>{s.id} {records[s.id]?'★':''}<small>{l(s.name,s.en)}</small></button>)}</div><h3>{selected}. {l(stage.name,stage.en)}</h3><p>{l(stage.lesson,stage.english)}</p><button className="primary" onClick={()=>a.beginDojo(selected)}>{l('この練習をはじめる','Start this lesson')}</button></div>;
}
