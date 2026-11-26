import React from 'react';
import { ROLES,type Command,type StudyReport,type View,type Winner } from './rules';
import { awardSize,badge,missionLevel,type MissionProfile } from './profile';
import type { Copy } from './Settings';
import { Groups } from './Meeting';

function winnerText(w:Winner,t:Copy){
  if(w.side==='ended')return t('試合終了','Match ended');
  if(w.side==='neutral')return t('トリックスターの勝利','Trickster wins');
  return w.side==='crew'?t('クルーの勝利','Crew wins'):t('裏切り者の勝利','Infiltrators win');
}
const reasons:Record<Winner['reason'],[string,string]>={
  duties:['必要な学習任務が完了した','The shared learning goal was reached'],
  vote:['裏切り者がいなくなった','No infiltrators remain'],
  parity:['裏切り者が同数以上になった','The infiltrators reached parity'],
  failure:['重大な妨害を時間内に解除できなかった','The critical systems were not restored in time'],
  time:['探索の制限時間に達した','Exploration time expired'],
  tagged:['逃げるチーム全員を捕まえた','Every runner was caught'],
  trick:['トリックスターが投票で追放された','The Trickster was voted out'],
  ended:['司会が試合を終了した','The moderator ended the match'],
};
export const percent=(answers:number,correct:number)=>answers?Math.round(correct*100/answers)+'%':'—';
function csvCell(value:unknown){
  const raw=String(value??'');
  const safe=/^[=+\-@\t\r]/.test(raw)?"'"+raw:raw;
  return '"'+safe.replaceAll('"','""')+'"';
}
export function exportReport(reports:StudyReport[],t:Copy){
  const rows:unknown[][]=[
    [t('参加名','Player'),t('正答数','Correct'),t('回答数','Attempts'),t('正答率','Accuracy'),t('学習任務','Tasks'),t('施設復旧','Repairs'),t('協力','Cooperation')],
    ...reports.map(r=>[r.name,r.correct,r.answers,percent(r.answers,r.correct),r.tasks,r.repairs,r.cooperation]),
    [],[t('参加名','Player'),t('単元','Unit'),t('問題','Question'),t('正答数','Correct'),t('回答数','Attempts')],
  ];
  for(const report of reports){
    for(const [unit,summary] of Object.entries(report.units))rows.push([report.name,unit,'',summary.correct,summary.answers]);
    for(const q of Object.values(report.questions))rows.push([report.name,q.unit,q.prompt,q.correct,q.answers]);
  }
  const blob=new Blob(['\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='secret-mission-class.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function ClassReport({reports,t}:{reports:StudyReport[];t:Copy}){
  const attempts=reports.reduce((n,r)=>n+r.answers,0),correct=reports.reduce((n,r)=>n+r.correct,0);
  return <section className="sm-classreport">
    <div className="sm-inline"><strong>{t('クラス全体','Class total')} · {correct}/{attempts} · {percent(attempts,correct)}</strong><button onClick={()=>exportReport(reports,t)}>{t('CSVを保存','Save CSV')}</button></div>
    <div className="sm-table"><table><thead><tr><th>{t('参加名','Player')}</th><th>{t('正答 / 回答','Correct / attempts')}</th><th>{t('正答率','Accuracy')}</th><th>{t('任務','Tasks')}</th></tr></thead>
      <tbody>{reports.map(r=><tr key={r.id}><th>{r.name}</th><td>{r.correct}/{r.answers}</td><td>{percent(r.answers,r.correct)}</td><td>{r.tasks}</td></tr>)}</tbody></table></div>
    <details><summary>{t('保存と削除','Storage and deletion')}</summary><p>{t('この集計は部屋に一時保存され、再戦または部屋の終了で消えます。保存したCSVは端末で削除できます。','Reports are held in the room and clear on rematch or room closure. Delete any exported CSV from your device.')}</p></details>
  </section>;
}
export default function Results({view,t,profile,onExit,send}:{view:View;t:Copy;profile:MissionProfile;onExit:()=>void;send:(c:Command)=>void}){
  const w=view.winner;
  if(!w)return null;
  const stats=view.report,rewards=stats&&w.side!=='ended'?awardSize(stats,!!view.won):undefined;
  return <div className="sm-overlay"><section role="dialog" aria-modal="true" aria-label={t('対戦結果','Match results')} className="sm-dialog sm-results" data-winner={w.side}>
    <header><div><small>{t('対戦結果','Match results')}</small><h2>{winnerText(w,t)}</h2></div>{view.won&&<span className="sm-medal" aria-hidden="true">✦</span>}</header>
    <p>{t(...reasons[w.reason])}</p>
    {view.role&&<p>{t('あなたの役職','Your role')} · <b>{t(ROLES[view.role][0],ROLES[view.role][1])}</b></p>}
    {stats&&<>
      <div className="sm-result-grid">
        <span>{t('学習任務','Tasks')}<b>{stats.tasks}</b></span><span>{t('正答 / 回答','Correct / attempts')}<b>{stats.correct}/{stats.answers}</b></span>
        <span>{t('正答率','Accuracy')}<b>{percent(stats.answers,stats.correct)}</b></span>
        <span>{t('設備復旧','Repairs')}<b>{stats.repairs}</b></span><span>{t('協力','Cooperation')}<b>{stats.cooperation}</b></span>
        {!!rewards&&<span>XP<b>+{rewards.xp}</b></span>}
      </div>
      {!!rewards&&<p className="sm-role-pill">{badge(profile,t('','en')==='en')} · Lv.{missionLevel(profile)} · {t('バッジ用トークン','Tokens')} +{rewards.tokens}</p>}
    </>}
    <Groups view={view} send={send} t={t}/>
    {!view.observer&&view.groups.length>1&&<div className="sm-inline">{view.groups.map(g=><span key={g.id}>
      {t('班','Group')} {g.id+1} · {g.phase==='result'?t('終了','Finished'):t('対戦中','In progress')}
    </span>)}</div>}
    {view.reports&&<ClassReport reports={view.reports} t={t}/>}
    <details><summary>{t('参加者の役職','Player roles')}</summary><ul className="sm-ballots">{view.roster.map(p=><li key={p.id}>{p.name} · {p.role?t(ROLES[p.role][0],ROLES[p.role][1]):'—'}</li>)}</ul></details>
    <div className="sm-inline">
      {view.canRematch&&<button className="sm-primary" onClick={()=>send({type:'rematch'})}>{t('同じ設定でロビーへ','Rematch with these settings')}</button>}
      {view.self&&<button onClick={()=>send({type:'practice-task'})}>{t('学習を続ける','Keep practising')}</button>}
      <button onClick={onExit}>{t('退出','Leave')}</button>
    </div>
    {!view.host&&<p className="sm-muted">{t('ホストが再戦を選ぶと、そのままロビーへ戻れます。','When the host chooses a rematch, you’ll return to the same lobby.')}</p>}
  </section></div>;
}
