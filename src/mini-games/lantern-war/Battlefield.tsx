import {battleVoice,stopLanternVoice,beginLanternBattleVoice}from'./voices';
import {Tutorial}from'./Tutorial';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import {useContext} from 'react';
import {LanternLanguage} from './language';
import React,{useEffect,useMemo,useState} from 'react';
import {assetUrl} from '../../utils/assetPaths';
import {MapArt,BattleArt,cutin} from './art';
import {MapScenery,battleBackground} from './MapScenery';
import GroundedArmy from './GroundedArmy';
import {heroById,WEAPONS} from './roster';
import {CHAPTERS,OBJECTIVES,TERRAIN_INFO,SUPPORTS} from './story';
import {orderMove,restSquad,braveSkill,useItem,living,pathTo,encounterPreview,startEncounter,finishEncounter} from './engine';
import type {Campaign,Squad} from './types';
export type Update=(f:(s:Campaign)=>unknown)=>void;
export function Battlefield({s,update}:{s:Campaign;update:Update}){
 const b=s.battle!,[selected,setSelected]=useState('ally-0'),[showDanger,setDanger]=useState(false),[cursor,setCursor]=useState({x:1,y:8});
 const q=b.squads.find(q=>q.id===selected),chapter=CHAPTERS[b.chapter],preview=useMemo(()=>encounterPreview(s),[s]);
 const choose=(x:number,y:number)=>{const ally=b.squads.find(q=>q.team==='ally'&&living(q)&&q.x===x&&q.y===y);if(ally)setSelected(ally.id);else update(s=>orderMove(s,selected,x,y));setCursor({x,y});};
 const danger=new Set(b.squads.filter(q=>q.team==='enemy'&&living(q)).flatMap(q=>b.map.flatMap((row,y)=>row.map((t,x)=>Math.abs(q.x-x)+Math.abs(q.y-y)<=3?x+','+y:'')).filter(Boolean)));
 return <TranslatedUiTree mode={useContext(LanternLanguage)}><div className="lw-war">
 <Tutorial topic="battle" blocked={!!b.pending||!!b.encounter} onOpen={()=>update(s=>{if(s.battle)s.battle.paused=true;})}/><div className="lw-warbar"><div><small>CHAPTER {String(b.chapter+1).padStart(2,'0')} · {chapter.place}</small><h2>{chapter.title}</h2><p>{b.sideQuest?'遊撃戦：敵部隊を全滅':OBJECTIVES[chapter.objective]}{chapter.objective==='defend'?'（'+(60+chapter.turns*6)+'秒）':''}</p></div><div><b>{Math.max(0,Math.ceil(b.limit-b.time))}s</b><span>BRAVE ◆ {b.brave}</span><button className="lw-primary" disabled={!!b.pending} onClick={()=>update(s=>{s.battle!.paused=!s.battle!.paused;})}>{b.paused?'▶ 進軍開始':'Ⅱ 一時停止'}</button></div></div>
 <div className="lw-warbody"><div className="lw-map-wrap"><div className={'lw-battlemap lw-biome-'+chapter.theme} role="group" aria-label="進軍マップ" tabIndex={0} onKeyDown={e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();setCursor(p=>({x:Math.max(0,Math.min(11,p.x+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0))),y:Math.max(0,Math.min(9,p.y+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0)))}));}if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(cursor.x,cursor.y);}}}>
 <MapScenery map={b.map} theme={chapter.theme} chapter={b.chapter}/>
 {b.map.flatMap((row,y)=>row.map((t,x)=><button key={x+','+y} aria-label={x+','+y+' '+TERRAIN_INFO[t].name} className={'lw-cell lw-terrain-'+(t==='#'?'wall':t==='.'?'plain':t)+(cursor.x===x&&cursor.y===y?' is-cursor':'')+(showDanger&&danger.has(x+','+y)?' is-danger':'')+(q?.path.some(p=>p.x===x&&p.y===y)?' is-path':'')} style={{left:x/12*100+'%',top:y/10*100+'%'}} onClick={()=>choose(x,y)}><span>{t==='g'?'⚑':t==='h'?'♜':t==='t'?'◆':''}</span></button>))}
 {b.squads.filter(living).map(squad=><button key={squad.id} className={'lw-squad '+squad.team+(selected===squad.id?' is-selected':'')+(squad.moving?' is-walking':'')} style={{left:squad.x/12*100+'%',top:squad.y/10*100+'%'}} aria-label={squad.name+' スタミナ'+squad.stamina} onClick={()=>{if(squad.team==='ally')setSelected(squad.id);else if(q)update(s=>orderMove(s,selected,squad.x,squad.y));}}><MapArt id={squad.team==='civil'?'civil':squad.members.find(f=>f.hp>0)?.hero||'aster'} direction={squad.facing} walking={squad.moving}/><i className="lw-hp"><i style={{width:squad.members.reduce((n,f)=>n+f.hp,0)/squad.members.reduce((n,f)=>n+f.maxHp,0)*100+'%'}}/></i><small>{squad.rest>0?'休':squad.wait>0?'待':squad.stamina}</small></button>)}
 </div><div className="lw-maplegend"><span>♜ 本拠・回復</span><span>⚑ 星門</span><span>◆ 物資</span><span>矢印＋決定でも操作</span></div></div>
 <aside className="lw-orders"><h3>{q?.name||'部隊を選択'}</h3>{q&&<><p>スタミナ {q.stamina}/{q.maxStamina}{q.rest>0?' · 休息 '+Math.ceil(q.rest)+'秒':''}{q.wait>0?' · 後退待機 '+Math.ceil(q.wait)+'秒':''}</p><div className="lw-member-mini">{q.members.map(f=><div key={f.uid}><BattleArt id={f.hero}/><span>{f.name}<small>HP {f.hp}/{f.maxHp}</small></span></div>)}</div><div className="lw-actions"><button disabled={!!b.pending||q.rest>0} onClick={()=>update(s=>restSquad(s,selected))}>休息（8秒・無防備）</button><button disabled={!!b.pending||s.supplies<1} onClick={()=>update(s=>useItem(s,selected))}>薬草 ×{s.supplies}</button><button disabled={!!b.pending||b.brave<1} onClick={()=>update(s=>braveSkill(s,selected,'heal'))}>◆1 癒しの旗</button><button disabled={!!b.pending||b.brave<1} onClick={()=>update(s=>braveSkill(s,selected,'rally'))}>◆1 進軍の号令</button></div></>}
 <button aria-pressed={showDanger} onClick={()=>setDanger(!showDanger)}>敵の行動圏 {showDanger?'表示中':'を表示'}</button><p className="lw-tip">部隊→目的地を選択。進軍中も指示変更できます。接敵すると時間が止まります。弓・魔法・杖の別部隊を近くに置くと援護。</p></aside></div>
 <details className="lw-log"><summary>戦況記録 · {b.log[0]}</summary>{b.log.map((t,i)=><p key={i}>{t}</p>)}</details>
 {b.pending&&preview&&<div className="lw-modal"><div className="lw-panel lw-prediction" role="dialog" aria-modal="true" aria-label="戦闘予測"><small>ENCOUNTER · 進軍停止</small><h2>部隊交戦</h2><div className="lw-predict-sides"><div><BattleArt id={b.squads.find(q=>q.id===b.pending![0])!.members.find(f=>f.hp>0)!.hero}/><b>味方損害 {preview.allyLoss} HP</b></div><strong>VS</strong><div><BattleArt id={b.squads.find(q=>q.id===b.pending![1])!.members.find(f=>f.hp>0)!.hero}/><b>敵損害 {preview.enemyLoss} HP</b></div></div><p>{preview.winner==='ally'?'優勢：味方が押し返す見込み':'劣勢：味方が後退する見込み'} · 援護 {preview.support.length}部隊</p><p>HP残存率で勝敗を判定。APが尽きるか、一方が全滅すると交戦終了。</p><button autoFocus className="lw-primary" onClick={()=>update(startEncounter)}>戦闘開始</button><button onClick={()=>update(s=>{const b=s.battle!,a=b.squads.find(q=>q.id===b.pending![0])!,e=b.squads.find(q=>q.id===b.pending![1])!;a.path=[];a.wait=3;const retreat=pathTo(b,a,{x:1,y:8})[0];if(retreat){a.x=retreat.x;a.y=retreat.y;}b.pending=null;b.paused=true;})}>退避して指示を見直す</button></div></div>}
 {b.encounter&&<CombatStage s={s} update={update}/>}
 </div></TranslatedUiTree>;
}
function CombatStage({s,update}:{s:Campaign;update:Update}){
 const e=s.battle!.encounter!,[speed,setSpeed]=useState(1),[age,setAge]=useState(0),event=e.events[e.index],finished=e.index>=e.events.length;
 const a=s.battle!.squads.find(q=>q.id===e.ally)!,z=s.battle!.squads.find(q=>q.id===e.enemy)!;
 useEffect(()=>{setAge(0);if(finished)return;const start=performance.now(),timer=setInterval(()=>setAge((performance.now()-start)*speed),50);const advance=setTimeout(()=>update(s=>{if(s.battle?.encounter)s.battle.encounter.index++;}),1600/speed);return()=>{clearInterval(timer);clearTimeout(advance);};},[e.index,speed,finished]);
 const actor=event?.actorHero||a.members[0].hero,target=event?.targetHero||z.members[0].hero;
 useEffect(()=>{beginLanternBattleVoice();return stopLanternVoice;},[]);
 useEffect(()=>{const key=`${s.chapter}:${s.battle!.time}:${e.ally}:${e.enemy}:${e.index}`;if(finished){battleVoice(a.members.find(f=>f.hp>0)?.hero||a.members[0].hero,e.winner==='ally'?'win':'defeat',key);return;}if(!event)return;if(event.actorHero.startsWith('enemy-')){battleVoice(event.targetHero,event.hp<=0?'defeat':'damage',key);return;}const lead=a.members.find(f=>f.hp>0&&SUPPORTS.some(p=>p.a===actor&&p.b===f.hero||p.b===actor&&p.a===f.hero))?.hero||a.members.find(f=>f.hero!==actor)?.hero;if(event.passive&&event.name.startsWith('援護'))battleVoice(actor,'support',key,lead);else if(event.heal)battleVoice(event.targetHero,'heal',key);else battleVoice(actor,event.skill?(event.name===heroById(actor).skill?'ultimate':'technique'):'attack',key,undefined,event.name);},[e.index,finished]);

 const c=cutin(actor),isAlly=!actor.startsWith('enemy-'),action=age<400?'windup':age<1100?event?.skill?'ultimate':'attack':'ready';
 return <TranslatedUiTree mode={useContext(LanternLanguage)}><div className="lw-combat" role="dialog" aria-modal="true" aria-label="部隊自動戦闘"><div className="lw-combat-bg" style={{backgroundImage:(s.battle!.chapter===15?'linear-gradient(#071b4a88,#071b4a88),':'')+'url('+assetUrl(battleBackground(s.battle!.chapter))+')'}}/>
 <header><small>AUTOMATIC BATTLE · AP ◆ / PP ◇</small><div><button onClick={()=>setSpeed(speed===1?3:1)}>{speed}×</button><button onClick={()=>update(finishEncounter)}>演出をスキップ</button></div></header>
 <div className="lw-combat-formation"><b>{a.name}</b><strong>{a.members.length} <small>VS</small> {z.members.length}</strong><b>{z.name}</b></div>
 <ArmyStage s={s} age={age}/>
 {!finished&&event&&<>
 {event.skill&&age<600&&<div className="lw-cutin"><div className="lw-cutin-art">{c?<img src={assetUrl(c)} alt=""/>:<BattleArt id={actor} action="ultimate"/>}</div><span>◆ {event.name}</span></div>}
 <div className="lw-combat-caption" role="status"><small>{event.passive?'PASSIVE · PP ◇':'ACTIVE · AP ◆'}</small><h2>{event.name}</h2><p>{event.actorHero.startsWith('enemy-')?'境界兵':heroById(event.actorHero).name} → {event.targetHero.startsWith('enemy-')?'境界兵':heroById(event.targetHero).name}</p><span>{e.index+1} / {e.events.length}</span></div></>}
 {finished&&<div className="lw-combat-end"><small>ENGAGEMENT COMPLETE</small><h2>{e.winner==='ally'?'敵部隊を押し返した':'味方部隊が後退'}</h2><p>味方損害 {e.allyLoss} / 敵損害 {e.enemyLoss}</p><button autoFocus className="lw-primary" onClick={()=>update(finishEncounter)}>戦場へ戻る</button></div>}
 </div></TranslatedUiTree>;
}


function ArmyStage({s,age}:{s:Campaign;age:number}){
 const e=s.battle!.encounter!,event=e.events[e.index],events=e.events.slice(0,e.index+(age>=650?1:0));
 const squads=[s.battle!.squads.find(q=>q.id===e.ally)!,s.battle!.squads.find(q=>q.id===e.enemy)!];
 return <TranslatedUiTree mode={useContext(LanternLanguage)}><>
 <GroundedArmy s={s} age={age}/>
 <div className="lw-parameter-decks">{squads.map((squad,side)=><section key={squad.id} className={'lw-parameter-deck '+(side?'enemy':'ally')} aria-label={squad.name}>
 <div className="lw-parameter-grid">{squad.members.map(f=>{
 const last=[...events].reverse().find(v=>v.target===f.uid),hp=last?.hp??f.hp,used=events.filter(v=>v.actor===f.uid),maxAP=side===0&&(s.xp[f.hero]||0)>=800?3:2;
 const ap=Math.max(0,maxAP-used.filter(v=>!v.passive).reduce((n,v)=>n+(v.skill||v.name==='横列掃討'?2:1),0)),pp=Math.max(0,2-used.filter(v=>v.passive).length);
 return <div key={f.uid} style={{gridColumn:side?3-f.slot%3:f.slot%3+1,gridRow:Math.floor(f.slot/3)+1,'--lw-slot-order':f.slot%3} as React.CSSProperties} className={'lw-parameter-card '+(event?.actor===f.uid?'is-active':'')+(event?.target===f.uid?'is-target':'')+(hp<=0?'is-fallen':'')}><b>{f.slot+1}</b><div><strong>{f.name}</strong><i className="lw-unit-hp"><i style={{width:hp/f.maxHp*100+'%'}}/></i><span>{hp}/{f.maxHp} <em><i className="lw-point-label">AP</i>◆{ap}</em> <em><i className="lw-point-label">PP</i>◇{pp}</em></span></div></div>;
 })}</div></section>)}</div>
 </></TranslatedUiTree>;
}
