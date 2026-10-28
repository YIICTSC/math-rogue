import React,{useEffect,useRef,useState,useContext} from 'react';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import {LanternLanguage} from './language';
import {assetUrl} from '../../utils/assetPaths';
import {CHAPTERS,OBJECTIVES} from './story';
import {heroById} from './roster';
import {beginChapter} from './engine';
import {FIELD_QUESTS,MAIN_POINTS,locationPoint,canVisit,travelPath} from './world';
import {MapArt} from './art';
import type {Campaign} from './types';
import type {Update} from './Battlefield';
export default function ExpeditionMap({s,update}:{s:Campaign;update:Update}){
 const [selected,setSelected]=useState('main-'+s.chapter),[moving,setMoving]=useState(false),[position,setPosition]=useState(()=>locationPoint(s.worldLocation||'main-'+s.chapter)),[facing,setFacing]=useState(2),frame=useRef(0),location=useRef(s.worldLocation||'main-'+s.chapter);
 useEffect(()=>()=>cancelAnimationFrame(frame.current),[]);
 const travel=(id:string,arrive?:()=>void)=>{if(moving||!canVisit(s,id))return;const route=travelPath(s,location.current,id);if(!route.length){arrive?.();return;}setMoving(true);let start=performance.now(),index=0,from=locationPoint(location.current);const animate=(now:number)=>{const to=locationPoint(route[index]),t=Math.min(1,(now-start)/550);setFacing(Math.abs(to.x-from.x)>Math.abs(to.y-from.y)?to.x>from.x?1:3:to.y>from.y?2:0);setPosition({x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t});if(t===1){location.current=route[index];update(s=>{s.worldLocation=location.current;});index++;if(index===route.length){setMoving(false);arrive?.();return;}from=to;start=now;}frame.current=requestAnimationFrame(animate);};frame.current=requestAnimationFrame(animate);};
 const choose=(id:string)=>{setSelected(id);travel(id);};
 const main=selected.startsWith('main-'),index=main?Number(selected.slice(5)):0,c=CHAPTERS[index],quest=FIELD_QUESTS.find(q=>q.id===selected),unlocked=canVisit(s,selected),completed=!!quest&&!!s.fieldCompleted?.includes(quest.id);
 const explore=()=>travel(selected,()=>update(s=>{if(main)beginChapter(s,index);else if(quest){s.fieldQuest=quest.id;s.storyKind='side';s.storyIndex=0;s.phase='story';}}));
 return <TranslatedUiTree mode={useContext(LanternLanguage)}><div className="lw-field lw-expedition"><div className="lw-worldmap lw-exploration-map" style={{backgroundImage:'url('+assetUrl('sprites/lantern-war/expedition-map.webp')+')'}} role="group" aria-label="行き先を選ぶフィールドマップ">
 <svg className="lw-world-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={MAIN_POINTS.map(p=>p.x+','+p.y).join(' ')} fill="none" stroke="#f8eac8" strokeWidth=".32" strokeDasharray=".6 .7"/>{FIELD_QUESTS.map(q=><line key={q.id} x1={MAIN_POINTS[q.unlock].x} y1={MAIN_POINTS[q.unlock].y} x2={q.x} y2={q.y} stroke="#f4d68d" strokeWidth=".2" strokeDasharray=".4 .6"/>)}</svg>
 <div className="lw-field-heading"><small>ATLAS OF THE CONFLUENCE</small><b>灯をつなぐ旅路</b><span>{moving?'移動中':'行き先を選んで探索'} · {s.fieldCompleted?.length||0}/18</span></div>
 {MAIN_POINTS.map((p,i)=><button key={i} disabled={moving} className={'lw-map-node lw-main-node '+(selected==='main-'+i?'is-selected ':'')+(s.cleared.includes(i)?'is-clear':i<=s.chapter?'is-open':'is-locked')} style={{left:p.x+'%',top:p.y+'%'}} aria-label={'第'+(i+1)+'章 '+CHAPTERS[i].title+(i>s.chapter?' 未到達':'')} onClick={()=>choose('main-'+i)}><b>{s.cleared.includes(i)?'✦':i+1}</b><span>{CHAPTERS[i].place}</span></button>)}
 {FIELD_QUESTS.map(q=><button key={q.id} disabled={moving} className={'lw-map-node lw-side-node '+(selected===q.id?'is-selected ':'')+(canVisit(s,q.id)?'is-open':'is-locked')} style={{left:q.x+'%',top:q.y+'%'}} onClick={()=>choose(q.id)} aria-label={q.place+' · '+q.title}><b>{s.fieldCompleted?.includes(q.id)?'✓':'◇'}</b><span>{q.place}</span></button>)}
 <div className={'lw-world-hero '+(moving?'is-walking':'')} style={{left:position.x+'%',top:position.y+'%'}} aria-label={heroById(s.hero).name}><MapArt id={s.hero} direction={facing} walking={moving}/><i/></div>
 <div className="lw-field-legend"><span>◆ 本編</span><span>◇ 仲間と寄り道</span><span>物語が進むと探索範囲が広がる</span></div></div>
 <aside className="lw-chapter-panel lw-panel"><small>{main?'CHAPTER '+String(index+1).padStart(2,'0'):'SIDE STORY'}</small><h2>{main?c.title:quest?.title}</h2><p className="lw-subtitle">{main?c.subtitle:quest?.place}</p>{main?<><p>勝利条件：{OBJECTIVES[c.objective]}</p><p>報酬：{c.reward} G · 薬草3個</p><p>加入する仲間：{c.recruit.map(id=>heroById(id).name).join('、')||'集結した全員で最終決戦へ'}</p></>:quest&&<><p>{quest.request}</p><p>{heroById(quest.hero).name} · {s.recruited.includes(quest.hero)?'仲間との交流':'この場所で仲間にできる'}</p><p>{completed?'達成済み · 会話をもう一度読む':'選択で報酬が変わる · 経験値と補給を獲得'}</p></>}
 <button className="lw-primary" disabled={!unlocked||moving} onClick={explore}>{!unlocked?'前の章をクリアすると開放':moving?'移動中':main?s.cleared.includes(index)?'この戦場へ再出撃':'物語を進める':completed?'会話を読む':'この場所を訪ねる'}</button><button disabled={moving} onClick={()=>update(s=>{s.phase='camp';})}>焚き火のキャンプへ</button>{main&&unlocked&&index>0&&index%3===2&&<button disabled={moving} onClick={()=>travel(selected,()=>update(s=>beginChapter(s,index,true)))}>周辺の遊撃戦{s.sideCleared.includes(index)?'（達成済み）':''}</button>}<small>行き先を選んで探索</small></aside></div></TranslatedUiTree>;
}
