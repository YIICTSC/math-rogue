import {audioService} from '../../services/audioService';
import {trans} from '../../utils/textUtils';
import React,{useEffect,useRef,useState,Suspense,lazy} from 'react';
import AcademyLaunch from './AcademyLaunch';
import type {SoloIntent} from './modes';
import SportsSetupScreen from '../shared/SportsSetupScreen';
import InviteJoin from '../shared/InviteJoin';
import SportsInviteBox from '../shared/SportsInviteBox';
import ResponsiveTitleArt from '../shared/ResponsiveTitleArt';
import {useSportsInvitation} from '../shared/useSportsInvitation';
import type {LessonSelection} from '../gakuro-kart/questions';
import type {LanguageMode,AssignmentAnswerResult} from '../../types';
import {defaultConfig,type SportId} from './core';
import {local,BRANDS,SPORT_NAMES,TEAM_NAMES} from './copy';
import {AcademyRoom} from './onlineRoom';
import {ONLINE_CAPACITY,type OnlineView,type OnlineCommand} from './onlineWorld';
import {academyInviteUrl} from './onlineInvite';
const LessonPicker=lazy(()=>import('../shared/OnlineLessonPicker'));
export interface OnlineSession {view:OnlineView;selfId:string;host:boolean;send:(command:OnlineCommand)=>void;leave:()=>void;}
export default function AcademySportsEntry({sport,languageMode='JAPANESE',onClose,inviteCode='',inviteName,renderGame}:{sport:SportId;languageMode?:LanguageMode;onClose:()=>void;onAnswerResult?:(result:AssignmentAnswerResult)=>void;inviteCode?:string;inviteName?:string;renderGame:(online?:OnlineSession,intent?:SoloIntent)=>React.ReactNode}){
 const L=local(languageMode),C=(v:readonly[string,string,string])=>L(...v);
 const [intent,setIntent]=useState<SoloIntent>('match');
 const [entry,setEntry]=useState<'title'|'solo'|'host'|'join'>(inviteCode?'join':'title');
 const [name,setName]=useState(inviteName??(inviteCode?'':'Player')),[code,setCode]=useState(inviteCode);
 const [view,setView]=useState<OnlineView|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[picker,setPicker]=useState(false);
 const room=useRef<AcademyRoom|null>(null),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;room.current?.close();room.current=null;};},[]);
 const leave=()=>{room.current?.close();room.current=null;setView(null);setBusy(false);setPicker(false);setError('');setEntry('title');};
 const makeRoom=()=>{room.current?.close();const next=new AcademyRoom(sport,v=>{if(mounted.current&&room.current===next)setView(v);},message=>{if(mounted.current&&room.current===next)setError(message);});room.current=next;return next;};
 const create=async(chosen:LessonSelection)=>{
  if(busy)return;void audioService.unlockAudio();setBusy(true);setError('');
  const next=view&&room.current?room.current:makeRoom();
  try{if(view)await next.setLesson(chosen);else await next.create(name.trim(),defaultConfig(sport),chosen);}
  catch(e){if(!view)next.close(false);if(mounted.current&&room.current===next){if(!view)setView(null);setError(e instanceof Error?e.message:String(e));}}
  finally{if(mounted.current&&room.current===next)setBusy(false);}
 };
 const join=async()=>{if(busy||!name.trim())return;void audioService.unlockAudio();setBusy(true);setError('');const next=makeRoom();try{await next.join(code,name.trim());}catch(e){next.close(false);if(mounted.current&&room.current===next){setView(null);setError(e instanceof Error?e.message:String(e));}}finally{if(mounted.current&&room.current===next)setBusy(false);}};
 useSportsInvitation(inviteCode,inviteName,join);
 const online=room.current&&view?{view,selfId:room.current.selfId,host:room.current.host,send:(c:OnlineCommand)=>room.current?.send(c),leave}:undefined;
 if(entry==='solo')return <>{renderGame(undefined,intent)}</>;
 if(view&&view.phase!=='lobby'&&online)return <>{renderGame(online)}{error&&<div className="ac-online-error" role="alert">{error}<button onClick={leave}>{L('戻る','Back','もどる')}</button></div>}</>;
 if(!view&&entry==='title')return <AcademyLaunch sport={sport} languageMode={languageMode} onBack={onClose} onSolo={chosen=>{setIntent(chosen);setEntry('solo');}} onHost={()=>setEntry('host')} onJoin={()=>setEntry('join')}/>;
 if(!view&&entry==='join')return <InviteJoin title={BRANDS[sport]} languageMode={languageMode} name={name} onName={setName} code={code} onCode={setCode} busy={busy} error={error} onJoin={()=>void join()} onClose={leave} closeLabel={L('タイトルへ戻る','Back to title','タイトルへもどる')}/>;
 const me=view?.players.find(p=>p.id===room.current?.selfId),people=view?.players.filter(p=>p.connected)||[],host=room.current?.host;
 const canStart=people.length>=2&&people.every(p=>p.ready)&&new Set(people.map(p=>p.team)).size>=2;
 const field=(label:string,key:'innings'|'minutes'|'points'|'sets',values:number[])=><label>{label}<select disabled={!host} value={view?.config[key]} onChange={e=>room.current?.send({type:'configure',config:{[key]:Number(e.target.value)},limit:view!.limit})}>{values.map(n=><option key={n} value={n}>{n}</option>)}</select></label>;
 return <><div inert={picker||undefined}><SportsSetupScreen sport={sport} brand={BRANDS[sport]} title={L(view?'スタート前の集合':'オンラインの部屋を作る',view?'Match lobby':'Create online room',view?'スタートまえのしゅうごう':'オンラインのへやをつくる')} languageMode={languageMode} onBack={leave} members={view?.players} selfId={room.current?.selfId} capacity={view?.limit||ONLINE_CAPACITY[sport]} preview={<ResponsiveTitleArt game={sport}/>} caption={L('ホストが選んだ単元で、試合開始後に全員が学習します。','Everyone studies the host’s lesson after the match starts.','ホストがえらんだたんげんで、しあいかいしごにぜんいんががくしゅうします。')} footer={!view?
  <button className="online-entry-primary" disabled={busy||!name.trim()} onClick={()=>setPicker(true)}>{L('問題を選んで部屋を作る','Choose lesson and create room','もんだいをえらんでへやをつくる')}</button>:
  <div className="sp-footer-row"><button disabled={busy||me?.ready} onClick={()=>{void audioService.unlockAudio();room.current?.send({type:'ready',ready:true});}}>{me?.ready?L('準備完了','Ready','じゅんびかんりょう'):L('準備完了にする','Get ready','じゅんびかんりょうにする')}</button>{host?<button className="online-entry-primary" disabled={!canStart} onClick={()=>room.current?.send({type:'start'})}>{L('試合を開始','Start match','しあいをかいし')}</button>:<p>{L('ホストの開始を待っています。','Waiting for the host.','ホストのかいしをまっています。')}</p>}</div>}>
 {!view&&<label>{L('参加名','Player name','さんかなまえ')}<input maxLength={16} autoComplete="nickname" value={name} onChange={e=>setName(e.target.value)} disabled={busy}/></label>}
 <p className="ac-lobby-note">{L('2人以上で対戦。空いた選手はCPUが担当します。','Two or more players. CPU fills unoccupied positions.','2にんいじょうでたいせん。あいたせんしゅはCPUがたんとうします。')}</p>
 {view&&<><SportsInviteBox compact code={room.current!.code} url={academyInviteUrl(location.href,sport,room.current!.code)} t={s=>trans(s,languageMode)}/>
 <p className="ac-shared-lesson">{L('共通の学習範囲','Shared lesson','きょうつうのがくしゅうはんい')}：<b data-allow-japanese="true">{view.lessonTitle}</b></p>
 {host&&<button disabled={busy} onClick={()=>setPicker(true)}>{L('単元を変更','Change lesson','たんげんをへんこう')}</button>}
 <label>{L('所属チーム','Your team','しょぞくチーム')}<select value={me?.team??0} onChange={e=>room.current?.send({type:'team',team:Number(e.target.value)})}>{TEAM_NAMES.slice(0,sport==='festival'?4:2).map((t,i)=><option value={i} key={i}>{C(t)}</option>)}</select></label>
 <details className="ac-lobby-roster"><summary>{L('出場者とチームを確認','Review players and teams','しゅつじょうしゃとチームをかくにん')}</summary><div className="ac-online-roster">{people.map(p=><p key={p.id}><b data-allow-japanese="true">{p.name}</b> · {C(TEAM_NAMES[p.team])} · {p.seat+1} · {p.ready?L('準備完了','Ready','じゅんびかんりょう'):L('準備中','Preparing','じゅんびちゅう')}</p>)}</div></details>
 {sport==='baseball'&&<p className="ac-lobby-note">{L('各チームの担当者が打席ごとに順番に操作します。','Teammates take turns controlling each at-bat and its defense.','たんとうしゃがだせきごとにじゅんばんにそうさします。')}</p>}
 {host&&<><label>{L('募集人数','Room capacity','ぼしゅうにんずう')}<select value={view.limit} onChange={e=>room.current?.send({type:'configure',config:{},limit:Number(e.target.value)})}>{Array.from({length:ONLINE_CAPACITY[sport]-1},(_,i)=>i+2).map(n=><option key={n}>{n}</option>)}</select></label>{sport==='baseball'&&field(L('イニング数','Innings','イニングすう'),'innings',[3,6,9])}{sport==='baseball'&&<label>{L('守備の操作','Fielding controls','しゅびのそうさ')}<select value={view.config.manualFielding?'manual':'auto'} onChange={e=>room.current?.send({type:'configure',config:{manualFielding:e.target.value==='manual'},limit:view.limit})}><option value="auto">{L('オート','Automatic','オート')}</option><option value="manual">{L('手動','Manual','しゅどう')}</option></select></label>}{sport==='soccer'&&field(L('試合時間（分）','Match minutes','しあいじかん（ふん）'),'minutes',[1,3,5])}{sport==='volleyball'&&<>{field(L('セット数','Sets','セットすう'),'sets',[1,3])}{field(L('セット点数','Set points','セットてんすう'),'points',[15,25])}</>}</>}
 {!canStart&&<p>{L('2チーム以上・2人以上で、全員の準備完了を待ちます。','At least two teams and two ready players are required.','2チーム・2にんいじょうで、ぜんいんのじゅんびかんりょうをまちます。')}</p>}</>}
 {error&&<p role="alert">{error}</p>}
 </SportsSetupScreen></div>
 {picker&&<Suspense fallback={null}><LessonPicker activity="academy-sports" languageMode={languageMode} busy={busy} error={error} onBack={()=>setPicker(false)} onSelect={chosen=>{setPicker(false);void create(chosen);}}/></Suspense>}
 </>;
}
