import {CompactNotebook,JourneyFacility} from './JourneyScreens';
import {TOWN_BUILDINGS} from './journey';
import {StudentStory} from './student/StudentPanels';
import {DOJO_STAGES} from './dojo';
import SchoolDojo from './SchoolDojo';
import {SchoolSupplyIcon,TravelerCompanionIcon} from './sprites';
import React from 'react';
import {MARKS,equipmentResonance,goalFloor} from './adventure';
import type {SchoolAdventure} from './useSchoolAdventure';
import './adventure.css';
export default function SchoolAdventurePanel({adventure:a,inventory,player,itemName,gameOver,gameClear}:{adventure:SchoolAdventure;inventory:any[];player:any;itemName:(item:any)=>string;gameOver:boolean;gameClear:boolean}){

 const s=a.state,l=a.text,bag=inventory.find(i=>i.id===a.container);
 const back=()=>a.resume();
 const status=(i:any)=>`${i.wet?l(' 💧ぬれ',' 💧Wet'):''}${i.cursed?l(' 🔒封印',' 🔒Sealed'):''}${i.blessed?l(' ⭐応援',' ⭐Blessed'):''}${i.capacity?` [${i.contents?.length||0}/${i.capacity}]`:''}`;
 return <>
  <div className="school-adventure-toolbar" onPointerDown={e=>e.stopPropagation()}>
   <button onClick={()=>a.setPanel(a.dojoRun?'DOJO_PLAY':'NOTE')}>{l('冒険手帳','Notebook')}</button>
   {!a.dojoRun&&a.magicForm&&<button className={s.transformed?'student-transform active':'student-transform'} disabled={Boolean(a.panel||gameOver||gameClear||s.transformed)} onClick={a.transform} title={l('与えるダメージと受けるダメージが2倍。次の階で解除。','Deal and take double damage. Ends on the next floor.')}>{s.transformed?l('変身中：攻撃・被害×2','Transformed: deal/take ×2'):l('変身','Transform')}</button>}
   {a.dojoRun?<span>{a.dojoRun.stage}/50 · {l('手数','Turns')} {a.dojoRun.turns}/{DOJO_STAGES[a.dojoRun.stage-1].limit}</span>:s.scene!==undefined?<span>{s.town?(s.floor%5===0?l('旅の町：安全地帯','Journey village: safe area'):l('中継町：安全地帯','Relay town: safe area')):l('景勝地：ひと休み','Scenic stop: rest')}</span>:<span>{l('下校まで','Bell in')} {Math.max(0,320-s.floorTurns)} · {s.mode==='PUZZLE'?`${s.puzzleTurns}/${(s as any).puzzleLimit||0}`:`${s.floor}/${goalFloor(s)}`}</span>}

   {!a.dojoRun&&s.scene===undefined&&s.mode!=='PUZZLE'&&<span>{s.night?l('夜','Night'):l('昼','Day')} · {s.weather==='RAIN'?l('雨','Rain'):s.weather==='FOG'?l('霧','Fog'):s.weather==='WIND'?l('風','Wind'):l('晴れ','Clear')}</span>}
   {!a.dojoRun&&gameClear&&<button onClick={()=>a.returnHome()}>{l('学校前へ帰る','Return to school base')}</button>}
   {s.debt>0&&<button onClick={()=>a.setPanel('NOTE')}>{l('未払い','Bill')} {s.debt}</button>}
  </div>
  {a.panel&&<div className="school-adventure-backdrop" onKeyDown={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()}>
   <section className={`school-adventure-panel ${a.panel==='STUDENT_STORY'?l('旅の物語','Journey story'):a.panel.startsWith('FACILITY_')?'journey-facility':''}`} role="dialog" aria-modal="true" aria-label={l('学校前と冒険手帳','School base and notebook')}>
    <header><h2>{a.panel==='STUDENT_STORY'?l('旅の物語','Journey story'):a.panel.startsWith('FACILITY_')?l(TOWN_BUILDINGS.find(v=>v.kind===a.panel!.replace('FACILITY_',''))?.name||'町の施設',TOWN_BUILDINGS.find(v=>v.kind===a.panel!.replace('FACILITY_',''))?.en||'Town facility'):(a.panel==='DOJO'||a.panel==='DOJO_PLAY')?l('風来の学生道場','School Wanderer dojo'):a.panel==='TOWN'?l('ダンジョン途中の町','Journey village'):a.panel==='RECORDS'?l('探検の記録','Adventure records'):a.panel==='BASE'?l('学校前の集合場所','School meeting point'):a.panel==='BAG'?bag?itemName(bag):l('容器','Container'):l('放課後の冒険手帳','After-school notebook')}</h2>{a.panel!=='STUDENT_STORY'&&<button autoFocus onClick={back}>{s.place==='HOME'||s.place==='RELAY'?l('町へ戻る','Back to town'):l('冒険に戻る','Resume')}</button>}</header>
    <div className="school-adventure-body">

     {a.panel!=='STUDENT_STORY'&&a.panel!=='NOTE'&&a.message&&<p role="status" className="school-adventure-message">{a.message}</p>}
     {a.panel==='NOTE'?<CompactNotebook adventure={a} inventory={inventory} player={player} itemName={itemName}/>:a.panel.startsWith('FACILITY_')?<JourneyFacility adventure={a} inventory={inventory} player={player} itemName={itemName}/>:a.panel==='ROUTE_CLEAR'?<><h3>{l('新しい街道が開かれた！','A new road has opened!')}</h3><p>{l(a.routeEnding[0],a.routeEnding[1])}</p><button className="primary" onClick={()=>a.returnHome()}>{l('はじまりの町へ帰る','Return to Firstlight Town')}</button></>:a.panel==='STUDENT_STORY'?<StudentStory adventure={a}/>: (a.panel==='DOJO'||a.panel==='DOJO_PLAY')?<>{!a.dojoRun&&<button onClick={()=>a.setPanel(null)}>{l('学校前へ戻る','Back to the base')}</button>}<SchoolDojo adventure={a}/></>:a.panel==='RECORDS'?<><p>{l('見つけた道具と敵、冒険の出来事を記録します。','A record of discovered supplies, foes and adventure moments.')}</p><h3>{l('道場の修了証','Dojo certificate')} {Object.keys(a.base.dojo||{}).length}/50</h3><div className="school-adventure-action-grid"><button onClick={()=>a.claimMilestone('DOJO10')}>{l('道場10問：報酬を受け取る','10 lessons: claim reward')}</button><button onClick={()=>a.claimMilestone('DOJO50')}>{l('道場50問：報酬を受け取る','50 lessons: claim reward')}</button><button onClick={()=>a.claimMilestone('DISCOVER20')}>{l('発見20種：報酬を受け取る','20 discoveries: claim reward')}</button></div><h3>{l('発見した道具と敵','Discovered supplies and foes')}</h3><div className="school-adventure-list">{(a.base.codex||[]).map((key:string)=>{const item=a.catalog[key];return <div className="school-adventure-item" key={key}>{item&&<SchoolSupplyIcon type={key}/>}<span>{item?l(item.name,item.name):l(key.replace('ENEMY:',''),key.replace('ENEMY:',''))}</span>{item&&<small>{l(item.desc,item.desc)}</small>}</div>;})}</div><h3>{l('冒険日記','Adventure diary')}</h3>{(a.base.diary||[]).slice().reverse().map((line:string,i:number)=><p key={i}>{line}</p>)}</>:a.panel==='BASE'?<button onClick={()=>a.newJourney()}>{l('はじまりの町へ','To Firstlight Town')}</button>:a.panel==='BAG'&&bag?<>
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
       <button onClick={()=>a.setPanel('RECORDS')}>{l('探検の記録','Adventure records')}</button>

       <button disabled={!gameClear} onClick={() => a.returnHome()}>{l('達成して学校前へ帰る','Return after completion')}</button>
      </div>
      {s.companion&&<p className="school-adventure-friend"><TravelerCompanionIcon companion={s.companion}/>{l(s.companion.name,s.companion.name)} · Lv{s.companion.level} · HP {Math.max(0,s.companion.hp)} · {s.companion.order==='WAIT'?l('待機中','Waiting'):l('同行中','Following')}</p>}
      {!a.dojoRun&&gameClear&&<button onClick={()=>a.returnHome()}>{l('学校前へ帰る','Return to school base')}</button>}
   {s.debt>0&&<div><p>{l('購買部：未払い','Shop bill')} {s.debt} {s.alarm?l('見回り中','Monitors alerted'):''}</p><button onClick={a.pay}>{l('精算する','Pay bill')}</button><button onClick={a.returnGoods}>{l('持っている商品を返す','Return carried goods')}</button></div>}
      {equipmentResonance(player.equipment||{}).names.map(name=><p key={name}>{l('装備の共鳴','Equipment resonance')}: {l(name,name)} · +{equipmentResonance(player.equipment||{}).attack} / +{equipmentResonance(player.equipment||{}).defense}</p>)}
      <h3>{l('装備の校章・封印・応援印','Equipment emblems, seals and blessings')}</h3>
      <p>{l('工作のりで強化値と校章を合成できます。校章は4枠。封印品はお清め消しゴムで解除。応援印の道具を使うとHP20回復。','Craft glue combines enhancement and emblems, up to four slots. Cleanse sealed supplies with an eraser. Blessed supplies heal 20 HP when used.')}</p>
      {[...Object.values(player.equipment||{}).filter(Boolean),...inventory].map((i:any)=><div key={i.id} className="school-adventure-item"><SchoolSupplyIcon type={i.type}/><strong>{itemName(i)}{status(i)}</strong><span>{(i.marks||[]).map((m:string)=>MARKS[m]?l(MARKS[m].ja,MARKS[m].en):m).join(' · ')}</span>{i.capacity&&<button onClick={()=>{a.openContainer(i);}}>{l('中身を開く','Open contents')}</button>}</div>)}
     </>}
    </div>
   </section>
  </div>}
 </>;
}
