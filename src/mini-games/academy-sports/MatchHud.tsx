import React from 'react';
import type {LanguageMode} from '../../types';
import {PROTAGONISTS} from '../../three/protagonistCatalog';
import {trans} from '../../utils/textUtils';
import {assetUrl} from '../../utils/assetPaths';
import type {Athlete} from './core';
import type {Match} from './engine';
import {local,TEAM_NAMES} from './copy';
import {PITCHES} from './baseball';
import {specialHero,specialName} from './specials';
import './match-hud.css';

const teamColors=['#45d4ee','#ff6895'];
const grade=(n:number)=>n>=.92?'S':n>=.84?'A':n>=.75?'B':n>=.66?'C':n>=.57?'D':'E';
function Portrait({player,sport}:{player:Athlete;sport:'baseball'|'soccer'}){
 const h=specialHero(player.hero);
 return <span className="ac-bc-portrait" aria-hidden="true" style={{backgroundImage:`url(${assetUrl(`sprites/academy-sports/cutins/cast-${h.sheet}-v1.webp`)})`,backgroundSize:`300% ${h.rows*100}%`,backgroundPosition:`${sport==='baseball'?0:50}% ${h.row/(h.rows-1)*100}%`}}/>;
}
function PlayerCard({player,sport,kind,languageMode,children}:{player:Athlete;sport:'baseball'|'soccer';kind:string;languageMode:LanguageMode;children:React.ReactNode}){
 const name=trans(PROTAGONISTS.find(p=>p.id===player.hero)?.name||player.name,languageMode);
 return <section className={'ac-bc-player ac-bc-'+kind} style={{'--side':teamColors[player.team]} as React.CSSProperties} aria-label={name} data-player={player.id}>
  <Portrait player={player} sport={sport}/><div className="ac-bc-player-copy"><div className="ac-bc-player-name"><b>{kind==='pitcher'?'P':kind==='batter'?'BAT':player.role}</b><span>{name}</span><small>#{player.slot+1}</small></div>{children}</div>
 </section>;
}
function SoccerRadar({match,languageMode}:{match:Extract<Match,{sport:'soccer'}>;languageMode:LanguageMode}){
 const L=local(languageMode),x=(z:number)=>6+(33-z)/66*88,y=(x:number)=>5+(x+21)/42*50;
 return <figure className="ac-bc-radar" aria-label={L('選手とボールの位置','Player and ball positions','せんしゅとボールのいち')}><svg viewBox="0 0 100 60" role="img" aria-label={L('戦術ミニマップ','Tactical minimap','せんじゅつミニマップ')}>
  <title>{L('青と桃色の点は各チーム、金色はボール。白い輪は操作選手。','Blue and pink: teams. Gold: ball. White ring: controlled player.','あおとももいろのてんはかくチーム、きんいろはボール。しろいわはそうさせんしゅ。')}</title>
  <rect className="ac-radar-field" x="6" y="5" width="88" height="50"/><path d="M50 5V55 M6 16H20V44H6 M94 16H80V44H94 M6 24H11V36H6 M94 24H89V36H94"/><circle className="ac-radar-line" cx="50" cy="30" r="7"/>
  {match.players.map(p=><circle key={p.id} data-radar-player={p.id} cx={x(p.p.z)} cy={y(p.p.x)} r={p.id===match.selected?2.5:1.65} fill={teamColors[p.team]} stroke={p.id===match.selected?'#fff':'#102536'} strokeWidth={p.id===match.selected?1:.5}/>) }
  <circle data-radar-ball cx={x(match.ball.z)} cy={y(match.ball.x)} r="1.8" fill="#ffe276" stroke="#181e30" strokeWidth=".6"/>
 </svg><figcaption>{L('戦術マップ','TACTICAL MAP','せんじゅつマップ')}<span>◆ {L('ボール','BALL','ボール')}</span></figcaption></figure>;
}
export default function MatchHud({match,languageMode}:{match:Match;languageMode:LanguageMode}){
 const L=local(languageMode),C=(v:readonly[string,string,string])=>L(...v);
 if(match.sport==='baseball'){
  const pitcher=match.players.find(p=>p.id===match.pitcher)!,batter=match.players.find(p=>p.id===match.bat)!;
  const speed=match.pitchSpeedKmh;
  const pitchNames=['FASTBALL','TWO-SEAM','SLIDER','CURVE','FORK','CHANGEUP','RUNNING FASTBALL','SINKER','STAR DROP'];
  return <div className="ac-broadcast ac-broadcast-baseball" data-broadcast="baseball">
   <section className="ac-bc-diamond-board" aria-label={L('得点・カウント・走者','Score, count and runners','とくてん・カウント・そうしゃ')}>
    <div className="ac-bc-inning"><span>ACADEMY BALLPARK</span><b>{match.inning} {match.half===0?L('回 表','TOP','かい おもて'):L('回 裏','BOTTOM','かい うら')}</b></div>
    <div className="ac-bc-baseball-body"><div className="ac-bc-team-scores">{match.score.map((score,i)=><div key={i} data-batting={match.half===i} style={{'--side':teamColors[i]} as React.CSSProperties}><i>{match.half===i?'▶':' '}</i><span>{C(TEAM_NAMES[i])}</span><strong>{score}</strong></div>)}</div>
     <div className="ac-bc-counts">{[[L('ボール','Balls','ボール'),'B',match.balls,3],[L('ストライク','Strikes','ストライク'),'S',match.strikes,2],[L('アウト','Outs','アウト'),'O',match.outs,2]].map(([label,key,n,max])=><div key={key} aria-label={`${label} ${n}`}><b>{key}</b>{Array.from({length:Number(max)},(_,i)=><i key={i} data-lit={i<Number(n)} data-count={key}/>)}</div>)}</div>
     <div className="ac-bc-bases" aria-label={L('走者','Runners','そうしゃ')}>{match.bases.map((id,i)=><i key={i} className={'ac-bc-base ac-base-'+(i+1)} data-occupied={id!==null} aria-label={`${i+1} ${L('塁','base','るい')} ${id!==null?L('走者あり','occupied','そうしゃあり'):L('走者なし','empty','そうしゃなし')}`}/>)}<span>⌂</span></div>
    </div>
   </section>
   <div className="ac-bc-matchup">
    <PlayerCard player={pitcher} sport="baseball" kind="pitcher" languageMode={languageMode}><div className="ac-bc-statline"><span>{L('球速','VELO','きゅうそく')} <b>{speed&&speed>0?speed:Math.round((20+pitcher.skills.pitch*10)*3.6)}</b><small>km/h</small></span><span>{L('制球','CTRL','せいきゅう')} <b>{grade(pitcher.skills.control)}</b></span></div><div className="ac-bc-spirit"><span>{languageMode==='ENGLISH'?pitchNames[match.pitch]:PITCHES[match.pitch]}</span><meter aria-label={L('投手のスピリット','Pitcher spirit','とうしゅのスピリット')} min={0} max={100} value={pitcher.spirit}/></div></PlayerCard>
    <PlayerCard player={batter} sport="baseball" kind="batter" languageMode={languageMode}><div className="ac-bc-statline"><span>{L('ミート','HIT','ミート')} <b>{grade(batter.skills.control)}</b></span><span>{L('パワー','POW','パワー')} <b>{grade(batter.skills.power)}</b></span><span>{L('走力','SPD','そうりょく')} <b>{grade(batter.skills.speed)}</b></span></div><div className="ac-bc-spirit"><span>{match.signatureReady?.[batter.id]?L('必殺打 準備完了','SIGNATURE ARMED','ひっさつだ じゅんびかんりょう'):match.batMode==='power'?L('強振','POWER','きょうしん'):match.batMode==='bunt'?L('バント','BUNT','バント'):L('ミート','CONTACT','ミート')}</span><meter aria-label={L('打者のスピリット','Batter spirit','だしゃのスピリット')} min={0} max={100} value={batter.spirit}/></div></PlayerCard>
   </div>
  </div>;
 }
 if(match.sport==='soccer'){
  const selected=match.players.find(p=>p.id===match.selected)||match.players[0],opponent=match.players.find(p=>p.team!==match.config.team&&p.role==='GK')!;
  // Present accelerated matches on the familiar 45 / 90 minute broadcast clock.
  const halfLength=match.config.minutes*30,seconds=Math.max(0,Math.floor((match.half-1)*2700+Math.min(match.halfTime,halfLength)/halfLength*2700));
  const time=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  const chain=match.chains?.[match.config.team]||0,duel=match.duel&&match.clock-match.duel.at<1.1?match.duel:null;
  return <div className="ac-broadcast ac-broadcast-soccer" data-broadcast="soccer" data-shot={match.shotTimer>0}>
   <section className="ac-bc-football-board" aria-label={L('試合の得点と時計','Match score and clock','しあいのとくてんととけい')}>
    <div className="ac-bc-team ac-bc-home"><span>{C(TEAM_NAMES[0])}</span><strong>{match.score[0]}</strong></div><div className="ac-bc-clock"><b data-match-clock>{time}</b><small>{match.half===1?L('前半','1ST HALF','ぜんはん'):L('後半','2ND HALF','こうはん')}{match.halfTime>halfLength?' +AT':''}</small></div><div className="ac-bc-team ac-bc-away"><strong>{match.score[1]}</strong><span>{C(TEAM_NAMES[1])}</span></div>
   </section>
   {chain>0&&<div className="ac-bc-chain" aria-label={`${L('連携','Chain','れんけい')} ${chain}`}><strong>{chain}</strong><div><b>LINK</b><span>{L('連携で威力UP','SHOT BOOST','れんけいでいりょくUP')}</span></div><i style={{width:chain/5*100+'%'}}/></div>}
   {duel&&<div className="ac-bc-duel-toast" key={duel.at} data-grade={duel.grade}><b>{duel.grade==='perfect'?'PERFECT':duel.grade==='good'?'GOOD':L('切り返し','BURST','きりかえし')}</b>{duel.grade!=='burst'&&<span>{L('突破成功・連携UP','DRIBBLE WIN · LINK UP','とっぱせいこう・れんけいUP')}</span>}</div>}
   <PlayerCard player={selected} sport="soccer" kind="controlled" languageMode={languageMode}><div className="ac-bc-spirit"><span>{L('スピリット','SPIRIT','スピリット')}</span><meter aria-label={L('操作選手のスピリット','Controlled player spirit','そうさせんしゅのスピリット')} min={0} max={100} value={selected.spirit}/><b>{Math.round(selected.spirit)}%</b></div><div className="ac-bc-technique">{specialName(selected.hero,'soccer',languageMode)}<span>{selected.spirit>=35?L('発動可能','READY','はつどうかのう'):L('回復中','CHARGING','かいふくちゅう')}</span></div>{selected.charge>0&&<div className="ac-bc-charge"><span>{L('シュート','SHOT','シュート')}</span><meter aria-label={L('シュートのため','Shot charge','シュートのため')} min={0} max={2} value={selected.charge}/></div>}</PlayerCard>
   <PlayerCard player={opponent} sport="soccer" kind="keeper" languageMode={languageMode}><div className="ac-bc-spirit"><span>{L('相手GK','OPPONENT GK','あいてGK')}</span><meter aria-label={L('相手キーパーのガード','Opponent keeper guard','あいてキーパーのガード')} min={0} max={100} value={match.guard[opponent.team]}/><b>{Math.round(match.guard[opponent.team])}%</b></div></PlayerCard>
   <SoccerRadar match={match} languageMode={languageMode}/>
  </div>;
 }
 return null;
}
