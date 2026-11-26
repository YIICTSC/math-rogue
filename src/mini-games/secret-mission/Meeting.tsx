import React,{useState} from 'react';
import { AVATAR_COLORS } from '../gakuro-kart/avatar';
import type { MissionMap } from './maps';
import { QUICK_CHAT, ROLES, type Command, type View } from './rules';
import type { Copy } from './Settings';

export const person=(view:View,id:string|undefined,t:Copy)=>view.roster.find(p=>p.id===id)?.name??(id==='skip'?t('スキップ','Skip'):t('司会','Moderator'));
export const facility=(map:MissionMap,id:number|undefined,t:Copy)=>{
  const f=map.facilities[id??-1];return f?t(f.ja,f.en):t('端末','Terminal');
};
export const timeText=(ms:number)=>{const secs=Math.max(0,Math.ceil(ms/1000));return Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0');};
export function Groups({view,send,t}:{view:View;send:(c:Command)=>void;t:Copy}){
  if(!view.observer||view.groups.length<2)return null;
  return <div className="sm-inline" aria-label={t('班を切り替える','Switch group')}>
    {view.groups.map(g=><button key={g.id} aria-pressed={g.id===view.group} onClick={()=>send({type:'group',id:g.id})}>
      {t('班','Group')} {g.id+1} · {g.phase==='result'?t('終了','Finished'):`${g.done}/${g.total}`}
    </button>)}
  </div>;
}

export default function Meeting({view,map,t,send,onExit}:{view:View;map:MissionMap;t:Copy;send:(c:Command)=>void;onExit:()=>void}){
  const [vote,setVote]=useState(''),[line,setLine]=useState(0),[station,setStation]=useState(''),[target,setTarget]=useState(''),[text,setText]=useState(''),[manage,setManage]=useState(false);
  const m=view.meeting;
  if(!m)return null;
  const eject=view.phase==='eject', voting=view.phase==='vote', alive=view.self?.presence==='active';
  const time=timeText(view.deadline-view.now);
  const title=eject?t('投票結果','Vote result'):voting?t('投票','Vote'):t('緊急会議','Emergency meeting');
  return <div className="sm-overlay"><section role="dialog" aria-modal="true" aria-label={title} className={'sm-dialog sm-meeting'+(eject?' sm-eject':'')}>
    <header><div><small>{t('調査を一時中断','Exploration on hold')}</small><h2>{title}</h2></div><strong className="sm-timer">{time}</strong></header>
    <p>{eject?(m.ejected?person(view,m.ejected,t)+t(' が追放された。',' was ejected.'):t('今回は追放なし。','No one was ejected.'))
      :m.victim?t('通報','Report')+' · '+person(view,m.by,t)+' / '+person(view,m.victim,t):t('会議を招集','Meeting called')+' · '+person(view,m.by,t)}</p>
    {eject&&m.revealed&&<p className="sm-role-pill">{t(ROLES[m.revealed][0],ROLES[m.revealed][1])}</p>}
    <div className="sm-vote-grid">{view.roster.map(p=><button key={p.id} style={{'--seat-color':AVATAR_COLORS[p.color]} as React.CSSProperties}
      aria-pressed={vote===p.id} disabled={!voting||!alive||p.presence!=='active'||!p.connected||m.voted} onClick={()=>setVote(p.id)}>
      <i aria-hidden="true"/><span>{p.name}</span><small>{eject?m.totals?.[p.id]??0:p.presence==='ghost'?t('ゴースト','Ghost'):p.voted?'✓':p.connected?'·':t('離席','Away')}</small>
    </button>)}</div>
    {voting&&alive&&!m.voted&&<div className="sm-inline">
      <button aria-pressed={vote==='skip'} onClick={()=>setVote('skip')}>{t('投票をスキップ','Skip vote')}</button>
      <button className="sm-primary" disabled={!vote} onClick={()=>send({type:'vote',id:vote})}>{t('投票する','Submit vote')}</button>
    </div>}
    {voting&&m.voted&&<p role="status">{t('投票済み。全員の投票を待っています。','Vote submitted. Waiting for the other votes.')}</p>}
    {eject&&<p>{t('スキップ','Skip')} · {m.totals?.skip??0}</p>}
    {eject&&m.ballots&&<ul className="sm-ballots">{Object.entries(m.ballots).map(([id,to])=><li key={id}>{person(view,id,t)} → {person(view,to,t)}</li>)}</ul>}
    {!eject&&view.settings.chat!=='off'&&<>
      <ol className="sm-messages" aria-label={t('会議の発言','Meeting messages')} aria-live="polite">
        {m.messages.map(msg=><li key={msg.id}><strong>{person(view,msg.from,t)}</strong> {msg.station!==undefined&&<small>{facility(map,msg.station,t)} · </small>}
          {msg.target&&<small>{person(view,msg.target,t)} · </small>}{msg.line!==undefined?t(QUICK_CHAT[msg.line][0],QUICK_CHAT[msg.line][1]):msg.text}</li>)}
      </ol>
      {alive&&<div className="sm-meeting-form">
        <label>{t('発言','Message')}<select value={line} onChange={e=>setLine(Number(e.target.value))}>{QUICK_CHAT.map((item,i)=><option value={i} key={i}>{t(item[0],item[1])}</option>)}</select></label>
        <label>{t('施設','Facility')}<select value={station} onChange={e=>setStation(e.target.value)}><option value="">—</option>{map.facilities.map(f=><option key={f.id} value={f.id}>{t(f.ja,f.en)}</option>)}</select></label>
        <label>{t('相手','Player')}<select value={target} onChange={e=>setTarget(e.target.value)}><option value="">—</option>{view.roster.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <button onClick={()=>send({type:'say',line,station:station?Number(station):undefined,target:target||undefined})}>{t('定型文を送る','Send quick message')}</button>
        {view.settings.chat==='text'&&<form onSubmit={e=>{e.preventDefault();if(text.trim())send({type:'say',text});setText('');}}>
          <input aria-label={t('自由入力','Typed message')} value={text} maxLength={100} onChange={e=>setText(e.target.value)}/><button disabled={!text.trim()}>{t('送信','Send')}</button>
        </form>}
      </div>}
    </>}
    {!alive&&!view.observer&&!eject&&<p className="sm-muted">{t('ゴーストは会議を見守ります。探索に戻ったら学習を続けられます。','Ghosts can watch the meeting and resume studying during exploration.')}</p>}
    {view.host&&view.settings.mode==='classroom'&&!eject&&<div className="sm-inline">{voting?<button onClick={()=>send({type:'finish-vote'})}>{t('投票を締め切る','Close voting')}</button>
      :<button onClick={()=>send({type:'extend-talk'})}>{t('議論を20秒延ばす','Add 20 seconds')}</button>}</div>}
    <Groups view={view} send={send} t={t}/>
    <div className="sm-inline">{view.host&&view.settings.mode==='classroom'&&<button aria-pressed={manage} onClick={()=>setManage(!manage)}>{t('進行管理','Match management')}</button>}
      <button onClick={onExit}>{t('退出','Leave')}</button></div>
    {manage&&<div className="sm-inline">
      <button onClick={()=>send({type:'pause'})}>{view.paused?t('再開','Resume'):t('一時停止','Pause')}</button>
      <button onClick={()=>send({type:'extend'})}>{t('時間を1分延ばす','Add one minute')}</button>
      <button onClick={()=>window.confirm(t('対戦を終了しますか？','End this match?'))&&send({type:'end'})}>{t('対戦を終了','End match')}</button>
    </div>}
  </section></div>;
}
