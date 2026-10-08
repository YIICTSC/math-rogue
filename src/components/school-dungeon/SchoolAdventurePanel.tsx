import {SchoolSupplyIcon,SchoolActorIcon} from './sprites';
import React,{useState} from 'react';
import {MARKS,MODES,goalFloor,type AdventureMode} from './adventure';
import type {SchoolAdventure} from './useSchoolAdventure';
import './adventure.css';
export default function SchoolAdventurePanel({adventure:a,inventory,player,itemName,gameOver,gameClear}:{adventure:SchoolAdventure;inventory:any[];player:any;itemName:(item:any)=>string;gameOver:boolean;gameClear:boolean}){
 const [mode,setMode]=useState<AdventureMode>('STORY');const [selected,setSelected]=useState<string[]>([]);const [gold,setGold]=useState(0);const [friend,setFriend]=useState<'HEAL'|'GUARD'|'FETCH'|null>(null);
 const s=a.state,l=a.text,bag=inventory.find(i=>i.id===a.container),definition=MODES.find(m=>m.id===mode)!;
 const back=()=>a.resume();
 const status=(i:any)=>`${i.cursed?l(' 🔒封印',' 🔒Sealed'):''}${i.blessed?l(' ⭐応援',' ⭐Blessed'):''}${i.capacity?` [${i.contents?.length||0}/${i.capacity}]`:''}`;
 return <>
  <div className="school-adventure-toolbar" onPointerDown={e=>e.stopPropagation()}>
   <button onClick={()=>a.setPanel('NOTE')}>{l('冒険手帳','Notebook')}</button>
   <span>{l('下校まで','Bell in')} {Math.max(0,320-s.floorTurns)} · {s.mode==='PUZZLE'?`${s.puzzleTurns}/${(s as any).puzzleLimit||0}`:`${s.floor}/${goalFloor(s)}`}</span>
   {gameClear&&<button onClick={()=>a.returnHome()}>{l('学校前へ帰る','Return to school base')}</button>}
   {s.debt>0&&<button onClick={()=>a.setPanel('NOTE')}>{l('未払い','Bill')} {s.debt}</button>}
  </div>
  {a.panel&&<div className="school-adventure-backdrop" onKeyDown={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()}>
   <section className="school-adventure-panel" role="dialog" aria-modal="true" aria-label={l('学校前と冒険手帳','School base and notebook')}>
    <header><h2>{a.panel==='BASE'?l('学校前の集合場所','School meeting point'):a.panel==='BAG'?bag?itemName(bag):l('容器','Container'):l('放課後の冒険手帳','After-school notebook')}</h2>{!s.returned&&<button autoFocus onClick={back}>{l('冒険に戻る','Resume')}</button>}</header>
    <div className="school-adventure-body">
     {a.message&&<p role="status" className="school-adventure-message">{a.message}</p>}
     {a.panel==='BASE'?<div className="school-adventure-columns">
      <div>
       <p>{l('倉庫と貯金箱はこの端末に保存します。手ぶらの挑戦では持ち込めません。','Warehouse and savings are stored on this device. Challenge modes start without stored equipment.')}</p>
       <label>{l('冒険を選ぶ','Choose adventure')}<select value={mode} onChange={e=>setMode(e.target.value as AdventureMode)}>{MODES.map(m=><option key={m.id} value={m.id}>{l(m.ja,m.en)}</option>)}</select></label>
       <p>{l(definition.desc,definition.english)}</p>
       {mode==='RESCUE'&&<p>{a.base.rescue?`${l('救助先','Rescue floor')} ${a.base.rescue.floor} · ${l('残り','Attempts left')} ${3-a.base.rescue.attempts}`:l('倒れた冒険があると救助できます。','A defeated adventure creates a rescue request.')}</p>}
       {mode==='STORY'&&<>
        <label>{l('持っていくおこづかい','Starting coins')}<input type="number" min="0" max={a.base.bank} value={gold} onChange={e=>setGold(Math.max(0,Math.min(a.base.bank,Number(e.target.value)||0)))}/></label>
        <label>{l('いっしょに行く同級生','Classmate')}<select value={friend||''} onChange={e=>setFriend((e.target.value||null) as any)}><option value="">{l('ひとりで挑戦','Solo')}</option><option value="HEAL">{l('保健係あおい：回復','Aoi: healing')}</option><option value="GUARD">{l('体育係たける：援護','Takeru: support')}</option><option value="FETCH">{l('図書係ひなた：道具回収','Hinata: supplies')}</option></select></label>
       </>}
       <button className="primary" disabled={mode==='RESCUE'&&(!a.base.rescue||a.base.rescue.attempts>=3)} onClick={()=>{if((s as any).departed&&!s.returned&&!gameOver&&!gameClear&&!window.confirm(l('今の冒険を終了して、新しい冒険を始めますか？','End the current adventure and start a new one?')))return;a.start(mode,selected,gold,friend);setSelected([]);}}>{l('このルールで出発','Start this adventure')}</button>
       <h3>{l('達成した挑戦','Completed challenges')}</h3>{MODES.map(m=><div key={m.id}>{l(m.ja,m.en)} {a.base.clears[m.id]||0}</div>)}
      </div>
      <div><h3>{l('学校前の倉庫','Warehouse')} ({a.base.warehouse.length})</h3><p>{l('おこづかい貯金','Savings')} {a.base.bank} · {l('持ち込み','Selected')} {selected.length}/16</p>
       <div className="school-adventure-list">{a.base.warehouse.map(i=><label className="school-adventure-check" key={i.id}><input type="checkbox" disabled={mode!=='STORY'||(!selected.includes(i.id)&&selected.length>=16)} checked={selected.includes(i.id)} onChange={()=>setSelected(v=>v.includes(i.id)?v.filter(id=>id!==i.id):[...v,i.id])}/><SchoolSupplyIcon type={i.type}/><span>{itemName(i)}{status(i)}</span></label>)}{!a.base.warehouse.length&&<p>{l('帰りの連絡帳で帰還すると、道具を預けられます。','Use a return notebook to bring supplies home.')}</p>}</div>
       <p>{l('帰還した道具は、次の冒険で選んだ分だけ持ち出せます。','Returned supplies can be selected for the next story adventure.')}</p>
      </div>
     </div>:a.panel==='BAG'&&bag?<>
      <p>{bag.type==='BAG_HEAL'?l('入れるとHP30回復。取り出すには箱を割ります。','Store a supply to heal 30 HP. Break the box to retrieve it.'):bag.type==='BAG_CHANGE'?l('入れた道具が変化します。箱を割って取り出します。','Stored supplies transform. Break the box to retrieve them.'):l('道具を入れる・取り出すごとに1ターン進みます。','Storing or taking out a supply costs one turn.')}</p>
      <div className="school-adventure-columns"><div><h3>{l('入れる道具','Store a supply')}</h3>{inventory.filter(i=>i.id!==bag.id&&!i.capacity).map(i=><button key={i.id} disabled={(bag.contents?.length||0)>=bag.capacity||Boolean(i.shopOwner)} onClick={()=>a.containerPut(i.id)}><SchoolSupplyIcon type={i.type}/>{itemName(i)}{status(i)}</button>)}</div><div><h3>{l('入っている道具','Contents')} ({bag.contents?.length||0}/{bag.capacity})</h3>{(bag.contents||[]).map((i:any,index:number)=><button key={i.id} disabled={!['BAG_SAVE','BAG_IDENTIFY'].includes(bag.type)} onClick={()=>a.containerTake(index)}><SchoolSupplyIcon type={i.type}/>{itemName(i)}{status(i)}</button>)}<button onClick={a.breakContainer}>{l('箱を割って全部出す','Break and empty')}</button></div></div>
     </>:<>
      <p>{l('足元か正面の施設：＋保健室、＄行商、☺同級生、！会話。水路は浮き輪、？の壁はつるはしで調べよう。','Facilities on your tile or ahead: + nurse, $ trader, ☺ classmate, ! story. Use a float badge for water and a pickaxe on marked walls.')}</p>
      <div className="school-adventure-action-grid">
       <button onClick={()=>{back();a.interact();}}>{l('施設・同級生と話す','Interact with facility')}</button>
       <button onClick={()=>{back();a.dig();}}>{l('正面の壁を掘る','Dig ahead')}</button>
       <button onClick={()=>{back();a.trapAction();}}>{l('正面の罠を回収','Collect trap ahead')}</button>
       <button onClick={()=>{back();a.trapAction(true);}}>{l('正面に罠を置く','Place trap ahead')} ({s.pouch.length}/8)</button>
       <button disabled={!s.companion} onClick={a.toggleFriend}>{l('同級生：','Classmate: ')}{s.companion?.order==='WAIT'?l('待機→集合','Wait → follow'):l('集合→待機','Follow → wait')}</button>
       <button onClick={()=>a.setPanel('BASE')}>{l('倉庫・貯金・挑戦一覧','Warehouse and challenges')}</button>
       <button disabled={!gameClear} onClick={a.returnHome}>{l('達成して学校前へ帰る','Return after completion')}</button>
      </div>
      {s.companion&&<p className="school-adventure-friend"><SchoolActorIcon role={s.companion.role}/>{l(s.companion.name,s.companion.role==='HEAL'?'Aoi':s.companion.role==='GUARD'?'Takeru':'Hinata')} · Lv{s.companion.level} · HP {Math.max(0,s.companion.hp)} · {s.companion.order==='WAIT'?l('待機中','Waiting'):l('同行中','Following')}</p>}
      {gameClear&&<button onClick={()=>a.returnHome()}>{l('学校前へ帰る','Return to school base')}</button>}
   {s.debt>0&&<div><p>{l('購買部：未払い','Shop bill')} {s.debt} {s.alarm?l('見回り中','Monitors alerted'):''}</p><button onClick={a.pay}>{l('精算する','Pay bill')}</button><button onClick={a.returnGoods}>{l('持っている商品を返す','Return carried goods')}</button></div>}
      <h3>{l('装備の校章・封印・応援印','Equipment emblems, seals and blessings')}</h3>
      <p>{l('工作のりで強化値と校章を合成できます。校章は4枠。封印品はお清め消しゴムで解除。応援印の道具を使うとHP20回復。','Craft glue combines enhancement and emblems, up to four slots. Cleanse sealed supplies with an eraser. Blessed supplies heal 20 HP when used.')}</p>
      {[...Object.values(player.equipment||{}).filter(Boolean),...inventory].map((i:any)=><div key={i.id} className="school-adventure-item"><SchoolSupplyIcon type={i.type}/><strong>{itemName(i)}{status(i)}</strong><span>{(i.marks||[]).map((m:string)=>MARKS[m]?l(MARKS[m].ja,MARKS[m].en):m).join(' · ')}</span>{i.capacity&&<button onClick={()=>{a.openContainer(i);}}>{l('中身を開く','Open contents')}</button>}</div>)}
     </>}
    </div>
   </section>
  </div>}
 </>;
}
