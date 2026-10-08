import {SchoolActorIcon,ExpansionIcon} from './sprites';
import React,{useState,useRef,useEffect} from 'react';
import {DOJO_STAGES,dojoStart,dojoAct,type DojoAction,type DojoRun} from './dojo';
import type {SchoolAdventure} from './useSchoolAdventure';
import {assetUrl} from '../../utils/assetPaths';
export default function SchoolDojo({adventure:a}:{adventure:SchoolAdventure}){
 const l=a.text,[selected,setSelected]=useState(1),[run,setRun]=useState<DojoRun|null>(null),[hint,setHint]=useState(false);
 const boardRef=useRef<HTMLDivElement>(null);useEffect(()=>{if(run)boardRef.current?.focus({preventScroll:true});},[run!==null]);
 const stage=DOJO_STAGES[selected-1],records=a.base.dojo||{},passed=Object.keys(records).length;
 const act=(action:DojoAction)=>{if(!run)return;const next=dojoAct(run,action);setRun(next);if(next.won&&!run.won)a.dojoComplete(selected,next.turns);};
 return <div className="school-dojo"><details className="school-dojo-help"><summary>{l('遊び方・操作','How to play')} · {passed}/50</summary><p>{l('風来の小学生道場：冒険とは別の持ち物で練習。失敗しても倉庫や救助に影響しません。','School Wanderer dojo: practice with separate supplies. Failure never affects your warehouse or rescue.')}</p><p>{l('隣のマスをタッチ、または矢印キー。斜めはQ・E・Z・C、道具はスペース。','Tap an adjacent tile or use arrow keys. Q/E/Z/C move diagonally; Space uses your tool.')}</p></details>
 {!run?<><div className="school-dojo-stages">{DOJO_STAGES.map(s=><button key={s.id} className={selected===s.id?'primary':''} onClick={()=>{setSelected(s.id);setHint(false);}}>{s.id} {records[s.id]?'★':''}<small>{l(s.name,s.en)}</small></button>)}</div><h3>{selected}. {l(stage.name,stage.en)}</h3><p>{l(stage.lesson,stage.english)}</p><button className="primary" onClick={()=>{setRun(dojoStart(stage));setHint(false);}}>{l('この練習をはじめる','Start this lesson')}</button></>:<>
 <p>{selected}. {l(stage.name,stage.en)} · HP {run.hp}/7 · {l('お腹','Food')} {run.food} · {l('手数','Turns')} {run.turns}/{stage.limit}</p><p>{l(stage.lesson,stage.english)}</p>
 <div ref={boardRef} className="school-dojo-board" style={{backgroundImage:`linear-gradient(#16383c66,#16383c88),url(${assetUrl('sprites/school-wanderer/scenery-atlas.webp')})`}} tabIndex={0} role="group" aria-label={l('道場の練習マップ','Dojo practice map')} onKeyDown={e=>{const directions:Record<string,[number,number]>={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],q:[-1,-1],e:[1,-1],z:[-1,1],c:[1,1]};if(directions[e.key]){e.preventDefault();act({type:'MOVE',dx:directions[e.key][0],dy:directions[e.key][1]});}else if(e.key===' '){e.preventDefault();act({type:'TOOL'});}}}>
 {run.map.flatMap((row,y)=>row.map((tile,x)=>{const enemy=run.enemies.find(e=>e.x===x&&e.y===y),trap=run.revealed&&run.traps.some(t=>t.x===x&&t.y===y);return <button tabIndex={-1} key={`${x},${y}`} className={'dojo-tile '+tile.toLowerCase()} disabled={Math.max(Math.abs(x-run.x),Math.abs(y-run.y))!==1||run.won||run.failed} onClick={()=>act({type:'MOVE',dx:x-run.x,dy:y-run.y})} aria-label={`${x},${y} ${tile}`}></button>;}))}
 <span className="dojo-piece dojo-player" style={{left:`${run.x*100/9}%`,top:`${run.y*100/9}%`}}><SchoolActorIcon role="GUARD" size={30}/></span>
 <span className="dojo-piece dojo-goal" style={{left:`${stage.goal.x*100/9}%`,top:`${stage.goal.y*100/9}%`}}>↓</span>
 {run.enemies.map((enemy,i)=><span key={'enemy'+i} className="dojo-piece" style={{left:`${enemy.x*100/9}%`,top:`${enemy.y*100/9}%`}}><ExpansionIcon index={9} size={30}/>{enemy.sleep>0&&<small>💤</small>}</span>)}
 {stage.key&&!run.key&&<span className="dojo-piece" style={{left:`${stage.key.x*100/9}%`,top:`${stage.key.y*100/9}%`}}>🔑</span>}
 {run.revealed&&run.traps.map((trap,i)=><span key={'trap'+i} className="dojo-piece" style={{left:`${trap.x*100/9}%`,top:`${trap.y*100/9}%`}}>⚠</span>)}
 </div>
 <div className="school-dojo-controls">{[[-1,-1,'↖'],[0,-1,'↑'],[1,-1,'↗'],[-1,0,'←'],[0,0,'·'],[1,0,'→'],[-1,1,'↙'],[0,1,'↓'],[1,1,'↘']].map(([dx,dy,label])=><button key={label} disabled={run.won||run.failed} onClick={()=>dx===0&&dy===0?act({type:'WAIT'}):act({type:'MOVE',dx:Number(dx),dy:Number(dy)})}>{label}</button>)}</div>
 <div className="school-adventure-action-grid"><button disabled={run.won||run.failed||!run.charges} onClick={()=>act({type:'TOOL'})}>{l('道具を使う','Use tool')} · {l(({SLEEP:'ホイッスル',RAY:'魔法の傘',FLOAT:'浮き輪',FLOAT_ACTIVE:'浮き輪',REVEAL:'虫めがね',LUNCH:'お弁当',KEY:'鍵',DIG:'つるはし'} as Record<string,string>)[run.tool]||'道具なし',run.tool||'No tool')} ({run.charges})</button><button onClick={()=>setHint(v=>!v)}>{l('先生のヒント','Teacher hint')}</button><button onClick={()=>setRun(dojoStart(stage))}>{l('やり直す','Restart')}</button><button onClick={()=>setRun(null)}>{l('50ステージ一覧','All 50 stages')}</button></div>
 {hint&&<p className="school-adventure-message">{l(stage.hint,stage.hintEn)}</p>}
 {run.message&&<p role="status">{l(({BLOCKED:'そこには進めません。向きは変えられます。',EMPTY:'道具の残り回数がありません。',TRAP:'罠を踏んだ！HP3減。',ATTACK:'攻撃した。敵が隣にいると反撃されます。',MOVE:'一歩進んだ。',SLEEP:'近くの敵を眠らせた。',RAY:'正面へ傘の魔法！',FLOAT:'浮き輪を装着した。',REVEAL:'隠れた罠を調べた。',LUNCH:'お弁当でお腹が20回復。',KEY:'鍵で扉を開けた。',DIG:'正面の壁を掘った。'} as Record<string,string>)[run.message]||'',run.message)}</p>}
 {(run.won||run.failed)&&<div className="school-adventure-message"><strong>{run.won?l('練習クリア！学んだ作戦を冒険でも使おう。','Lesson cleared! Use this strategy in your adventure.'):l('もう一度考えてみよう。道具・位置・手数を見直そう。','Try again. Review your tools, position and turn budget.')}</strong>{run.won&&selected<50&&<button onClick={()=>{setSelected(selected+1);setRun(dojoStart(DOJO_STAGES[selected]));setHint(false);}}>{l('次の練習へ','Next lesson')}</button>}</div>}
 </>}
 </div>;
}
