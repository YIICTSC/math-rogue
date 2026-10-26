import React from 'react';
import type {TennisView} from './types';
export default function Bracket({view,t,watch,canWatch}:{view:TennisView;t:(s:string)=>string;watch:(id:string)=>void;canWatch:boolean}){
 const rounds=[...new Set(view.bracket.map(m=>m.round))],last=Math.ceil(Math.log2(Math.max(2,view.teams.length)))-1;
 return <div className="tn-bracket">{rounds.map(round=><section key={round}><h3>{round===last?t('決勝'):`${t('回戦')} ${round+1}`}</h3>{view.bracket.filter(m=>m.round===round).map(m=><article key={m.id} className={m.id===view.match?.id?'is-current':''}><small>{m.phase==='finished'?m.reason==='bye'?t('不戦勝'):'✓':m.phase==='study'?t('テニスの学習タイム'):'LIVE'}</small>{m.teams.map((id,i)=><div key={i} className={m.winner===id&&id!==null?'is-winner':''}><span data-allow-japanese="true">{id===null?'—':view.teams[id]?.name}</span><b>{m.games[i]}</b></div>)}{canWatch&&m.phase!=='finished'&&<button onClick={()=>watch(m.id)}>{t('この試合を観戦')}</button>}</article>)}</section>)}</div>;
}
