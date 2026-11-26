import React,{useCallback,useEffect,useRef,useState} from 'react';
import { ArrowLeft, DoorOpen, Gamepad2, Users, Fingerprint, Copy, BookOpen, PencilLine, Check } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { trans } from '../../utils/textUtils';
import type { LanguageMode } from '../../types';
import AvatarCreator from '../gakuro-kart/AvatarCreator';
import { AVATAR_COLORS, AVATAR_SPECIES, type KartAvatar } from '../gakuro-kart/avatar';
import type { LessonSelection } from '../gakuro-kart/questions';
import AvatarPreview from '../gakurogear/AvatarPreview';
import { loadVrAvatar,saveVrAvatar } from '../gakurogear/character';
import { cue,useVrBgm,type VrCue } from '../gakurogear/audio';
import OnlineLessonPicker from '../shared/OnlineLessonPicker';
import { createPractice, OnlineMission, savedTicket, secretMissionServer, type MissionConnection } from './connection';
import { clearMissionInvite, inviteUrl } from './invite';
import { MAPS, missionMap, type MapId } from './maps';
import { PRESETS, TITLE, EMOTE_COSTS, EMOTES, EMOTE_NAMES, normalizeCode, type Command, type EventKind, type Mode, type View } from './rules';
import { MODE_NAMES, MissionSettings } from './Settings';
import Field,{MissionViewport} from './Field';
import { badge,missionLevel,readProfile,recordMission,unlockEmote,type ExtraEmote } from './profile';
import './mission.css';

const events:Record<EventKind,VrCue>={correct:'correct',wrong:'wrong',task:'collect',repair:'door',stunned:'hold',rescue:'collect',block:'reload',alert:'alert',camera:'select',portal:'bubble',bonus:'correct'};
const errors:Record<string,[string,string]>={
  OFFLINE:['オンライン接続先がありません。CPU練習を選べます。','There is no online server in this version. CPU practice is available.'],
  CODE:['部屋が見つかりません。招待コードを確認してください。','Room not found. Check the invite code.'],
  CLOSED:['部屋が満員か、途中参加の受付を終了しています。','The room is full or has closed mid-match entry.'],
  NAME:['参加名とキャラクターを確認してください。','Check your name and character.'],
  LESSON:['問題を準備できませんでした。別の単元を選んでください。','Could not prepare that lesson. Choose another unit.'],
  EXPIRED:['再接続できませんでした。招待コードから入り直してください。','Could not reconnect. Join again using the invitation code.'],
  REMOVED:['ホストが部屋から退出させました。','The host removed you from the room.'],
  RECONNECTING:['通信が切れました。自動で再接続しています…','Connection lost. Reconnecting…'],
  BUSY:['サーバーの部屋が満室です。時間をおいて試してください。','The server is at capacity. Try again in a moment.'],
  VERSION:['サーバーとアプリのバージョンが一致していません。','The server and game versions do not match.'],
  COMMAND:['操作を処理できませんでした。','Could not process that action.'],
};
type Entry='menu'|'create'|'join'|'practice';
type Panel='settings'|'avatar'|'lesson'|'custom'|'guide'|'rewards'|null;
const readQuality=()=>{try{return localStorage.getItem('gakuro-secret-mission-quality')!=='low';}catch{return true;}};
function titleFor(lesson:LessonSelection|undefined,otherwise:string){
  return lesson?.assignment?.title||lesson?.title||lesson?.mode||otherwise;
}

export default function SecretMission({initialCode,onBack,language='JAPANESE'}:{initialCode?:string;onBack:()=>void;language?:LanguageMode}){
  const en=language==='ENGLISH';
  const t=useCallback((ja:string,english:string)=>en?english:language==='HIRAGANA'?trans(ja,language):ja,[en,language]);
  const [entry,setEntry]=useState<Entry>(initialCode?'join':'menu'),[panel,setPanel]=useState<Panel>(null),[busy,setBusy]=useState(false);
  const [view,setView]=useState<View|null>(null),[status,setStatus]=useState(''),[name,setName]=useState(initialCode?'':t('プレイヤー','Player'));
  const [code,setCode]=useState(initialCode??''),[mode,setMode]=useState<Mode>('standard'),[map,setMap]=useState<MapId>('school');
  const [practiceMode,setPracticeMode]=useState<'standard'|'tag'>('standard'),[bots,setBots]=useState(5);
  const [lesson,setLesson]=useState<LessonSelection>(),[avatar,setAvatar]=useState(loadVrAvatar),[quality,setQuality]=useState(readQuality);
  const [copied,setCopied]=useState(false),[profile,setProfile]=useState(readProfile),[customTitle,setCustomTitle]=useState(t('クラスの問題','Class quiz'));
  const [custom,setCustom]=useState([{question:'',answer:'',options:['','','']}]);
  const connection=useRef<MissionConnection|null>(null), generation=useRef(0), attempted=useRef(false), profileReceipt=useRef('');
  const phase=view?.phase;
  const bgm=phase==='result'?view.winner?.side==='ended'?'lobby':view.won||view.observer?'clear':'fail':view?.task?'quiz'
    :phase==='briefing'||phase==='talk'||phase==='vote'||phase==='eject'||view?.alarm?.kind==='critical'?'royale'
    :phase==='field'?'training':view?'lobby':'title';
  useVrBgm(bgm,view?['school','orbit','magic','ruins'].indexOf(view.map)+1:1,58);
  const feedback=errors[status]?t(...errors[status]):status?t('接続を確認して、もう一度試してください。','Check your connection and try again.'):'';
  const blockingStatus=['RECONNECTING','EXPIRED','REMOVED'].includes(status)?feedback:'';

  const send=useCallback((action:Command)=>connection.current?.send(action),[]);
  useEffect(()=>{
    if(!view?.event||!view.settings.sfx)return;
    cue(events[view.event.kind]);
  },[view?.event?.serial]);
  useEffect(()=>{
    if(!view?.settings.sfx)return;
    if(phase==='briefing')cue('countdown');
    else if(phase==='talk'||phase==='vote')cue('alert');
    else if(phase==='eject')cue('hold');
    else if(phase==='result')cue(view.won?'clear':'fail');
  },[phase,view?.round]);
  useEffect(()=>{
    if(view?.report&&view.winner&&profileReceipt.current!==view.round){
      profileReceipt.current=view.round;setProfile(recordMission(view));
    }
  },[view?.round,view?.winner?.side,!!view?.report]);

  const disconnect=(leave=true)=>{
    generation.current++;connection.current?.close(leave);connection.current=null;
    if(leave)clearMissionInvite();
    setView(null);setBusy(false);setStatus('');setPanel(null);
  };
  useEffect(()=>()=>{generation.current++;connection.current?.close(false);},[]);
  const open=async(kind:'create'|'join'|'practice',resume=false)=>{
    if(busy||(!resume&&!name.trim())||(kind==='join'&&!/^\d{6}$/.test(code)))return;
    void audioService.unlockAudio();cue('select');
    const id=++generation.current;
    setBusy(true);setStatus('');
    const notice=(s:string)=>{if(generation.current===id)setStatus(s);};
    const update=(v:View)=>{if(generation.current===id)setView(v);};
    const config={...PRESETS[kind==='practice'?practiceMode==='tag'?'tag':'practice':mode],map,bots:kind==='practice'?bots:PRESETS[mode].bots};
    try{
      if(kind==='practice'){
        const local=await createPractice({name,avatar,settings:config,lesson,english:en},update,notice);
        if(id!==generation.current){local.close(false);return;}
        connection.current=local;
        local.send({type:'start'});
      }else{
        const online=new OnlineMission(update,notice);connection.current=online;
        await online.open({name,avatar,code:kind==='join'?code:undefined,settings:config,lesson,english:en});
      }
    }catch(error){
      if(id===generation.current){connection.current?.close(false);connection.current=null;setStatus((error as Error).message);}
    }finally{if(id===generation.current)setBusy(false);}
  };
  useEffect(()=>{
    if(!initialCode||attempted.current||!savedTicket(initialCode))return;
    attempted.current=true;void open('join',true);
  },[initialCode]);
  const leaveRoom=()=>{
    if(view?.phase!=='result'&&view?.phase!=='lobby'&&view&&!window.confirm(t('対戦から退出しますか？','Leave this match?')))return;
    disconnect();
    if(initialCode)onBack();
    else setEntry('menu');
  };
  const back=()=>{
    if(view){leaveRoom();return;}
    if(entry==='menu'||initialCode){disconnect();onBack();}
    else{disconnect();setEntry('menu');}
  };
  const chooseLesson=async(selection?:LessonSelection)=>{
    try{
      if(connection.current)await connection.current.setLesson(selection);
      setLesson(selection);setPanel(null);setStatus('');
    }catch{setStatus('LESSON');}
  };
  const changeAvatar=(a:KartAvatar)=>{setAvatar(a);saveVrAvatar(a);send({type:'profile',avatar:a});};
  const changeQuality=(value:boolean)=>{
    setQuality(value);
    try{localStorage.setItem('gakuro-secret-mission-quality',value?'high':'low');}catch{}
  };
  const copy=async()=>{
    const address=inviteUrl(connection.current!.code);
    try{await navigator.clipboard.writeText(address);setCopied(true);}
    catch{const input=document.querySelector<HTMLInputElement>('[data-secret-invite]');input?.focus();input?.select();setCopied(document.execCommand('copy'));}
  };
  const updateCustom=(index:number,key:'question'|'answer'|'options',value:string,option=0)=>setCustom(rows=>rows.map((q,i)=>i!==index?q:
    key==='options'?{...q,options:q.options.map((old,j)=>j===option?value:old)}:{...q,[key]:value}));
  const useCustom=async()=>{
    const {customMissionLesson}=await import('./lessons');
    await chooseLesson(customMissionLesson(customTitle,custom.filter(row=>row.question.trim()&&row.answer.trim())));
  };
  const roomCode=connection.current?.code;
  const field=!!view&&view.phase!=='lobby';
  const root=<div className={'sm-app '+(field?'is-field':'')} data-secret-mission data-gamepad-initial-scope="secret-mission" aria-label={t(TITLE,'Learning Rogue SECRET MISSION')}>
    {field?<Field view={view} send={send} t={t} language={language} profile={profile} onExit={leaveRoom} quality={quality} onQuality={changeQuality} status={blockingStatus}/>
    :<>
      <header className="sm-top"><button className="sm-back" onClick={back}><ArrowLeft size={17}/>{t(view?'退出':'戻る',view?'Leave':'Back')}</button>
        {entry!=='menu'&&<strong>SECRET <em>MISSION</em></strong>}
        <button className="sm-back" onClick={()=>setPanel('guide')}><BookOpen size={17}/>{t('遊び方','How to play')}</button>
      </header>
      {entry==='menu'&&!view?<main className="sm-title">
        <div className="sm-cover"><MissionViewport map={missionMap('school')} t={t} preview quality={quality}/></div>
        <section className="sm-title-copy"><span>{t('学習ローグ','LEARNING ROGUE')} <i>VR</i></span><h1>SECRET<br/><em>MISSION</em></h1>
          <p>{t('夕暮れの学園で、端末を直し、仲間の動きを見極めろ。','Repair the academy after hours. Watch who is working beside you.')}</p>
          <div className="sm-title-actions">
            <button className="sm-primary" onClick={()=>{setStatus('');setEntry('create');}}><Users size={21}/>{t('オンラインの部屋を作る','Create online room')}</button>
            <button onClick={()=>{setStatus('');setEntry('join');}}><DoorOpen size={21}/>{t('招待に参加する','Join invitation')}</button>
            <button onClick={()=>{setStatus('');setEntry('practice');}}><Gamepad2 size={21}/>{t('CPUで練習','Practise with CPU')}</button>
          </div>
          <button className="sm-level" onClick={()=>setPanel('rewards')}><Fingerprint size={16}/> {badge(profile,en)} · Lv.{missionLevel(profile)} · {profile.tokens} {t('トークン','tokens')}</button>
        </section>
      </main>:view?<main className="sm-main sm-lobby">
        <div className="sm-lobby-heading"><div><small>{t(...MODE_NAMES[view.settings.mode])}</small><h1>{t('作戦室','Briefing room')}</h1></div>{roomCode&&<strong className="sm-code">{roomCode}</strong>}</div>
        <div className="sm-lobby-areas">
          <section className="sm-card">
            {roomCode&&<div className="sm-share"><label>{t('招待URL','Invite URL')}<input data-secret-invite readOnly value={inviteUrl(roomCode)}/></label>
              <button onClick={()=>void copy()}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?t('コピー済み','Copied'):t('URLをコピー','Copy URL')}</button></div>}
            <h2>{t('参加者','Participants')} <small>{view.roster.filter(p=>!p.bot).length} / {view.settings.capacity}</small></h2>
            <ul className="sm-roster">{view.roster.map(p=><li key={p.id}><i style={{background:AVATAR_COLORS[p.color]}} aria-hidden="true"/><span>{AVATAR_SPECIES[p.species]?.icon} {p.name}</span>
              <small>{p.id===view.who?t('あなた','You'):''}{p.bot?' CPU':''}{!p.connected?t(' 離席',' Away'):p.ready?t(' ✓ 準備完了',' ✓ Ready'):''}</small>
              {view.host&&p.id!==view.who&&!p.bot&&<button onClick={()=>window.confirm(p.name+' · '+t('退出させますか？','Remove from the room?'))&&send({type:'kick',id:p.id})}>{t('退出','Remove')}</button>}</li>)}</ul>
            {view.settings.bots>0&&<p className="sm-muted">{t('開始時に空席をCPUで補います。','CPU players fill open seats when the match begins.')} · {view.settings.bots}</p>}
          </section>
          <section className="sm-card sm-brief"><h2>{t('作戦設定','Mission setup')}</h2>
            <p><b>{t(MAPS[view.map].ja,MAPS[view.map].en)}</b> · {t(...MODE_NAMES[view.settings.mode])}</p>
            <p className="sm-muted">{t('学習範囲','Learning unit')} · <span data-allow-japanese="true">{view.lesson}</span></p>
            <div className="sm-inline"><button onClick={()=>setPanel('avatar')}><PencilLine size={16}/>{t('キャラクター','Character')}</button>
              {view.host&&<><button onClick={()=>setPanel('settings')}>{t('対戦設定','Match settings')}</button><button onClick={()=>setPanel('lesson')}>{t('学年・単元を選ぶ','Choose grade and unit')}</button>
              {view.settings.mode==='classroom'&&<button onClick={()=>setPanel('custom')}>{t('問題を作る','Write questions')}</button>}</>}</div>
            {view.settings.mode==='classroom'&&<p className="sm-muted">{t('参加名だけで遊べます。集計は部屋の中で教員と本人に表示します。','Players need only a display name. Learning results are shown to the player and teacher.')}</p>}
            {view.host?<><button className="sm-primary" disabled={!view.canStart} onClick={()=>{void audioService.unlockAudio();send({type:'start'});}}>{t('作戦を開始','Start mission')}</button>
              {!view.canStart&&<p className="sm-muted">{t('必要人数','Minimum seats')} · {view.settings.mode==='large'?16:6} {t('人。参加者の準備完了を待ちます。','. Wait until everyone is ready.')}</p>}</>
              :<button className="sm-primary" aria-pressed={!!view.roster.find(p=>p.id===view.who)?.ready}
                onClick={()=>send({type:'ready',value:!view.roster.find(p=>p.id===view.who)?.ready})}>{view.roster.find(p=>p.id===view.who)?.ready?t('準備完了 ✓','Ready ✓'):t('準備完了','Ready')}</button>}
          </section>
        </div>
      </main>:<main className="sm-main sm-entry"><section className="sm-card">
        <small>SECRET MISSION</small><h1>{entry==='join'?t('招待に参加','Join invitation'):entry==='practice'?t('CPU練習','CPU practice'):t('オンラインの部屋を作る','Create online room')}</h1>
        {entry==='create'&&<p>{t('参加名と対戦の種類を選び、部屋で招待URLを共有します。','Choose a display name and match type, then share the room link.')}</p>}
        {entry==='practice'&&<p>{t('CPUが移動、任務、妨害、通報、投票を担当します。','CPU players move, study, sabotage, report and vote.')}</p>}
        <form onSubmit={e=>{e.preventDefault();void open(entry as 'create'|'join'|'practice');}}>
          <label>{t('参加名','Display name')}<input value={name} onChange={e=>setName(e.target.value)} maxLength={18} required autoComplete="off" placeholder={t('ニックネーム','Nickname')}/></label>
          {entry==='join'?<label>{t('6桁の招待コード','Six-digit room code')}<input value={code} onChange={e=>setCode(normalizeCode(e.target.value))} inputMode="numeric" maxLength={6} required readOnly={!!initialCode}/></label>
            :<>
              {entry==='create'?<label>{t('対戦の種類','Match type')}<select value={mode} onChange={e=>setMode(e.target.value as Mode)}>{Object.entries(MODE_NAMES).map(([key,labels])=><option key={key} value={key}>{t(...labels)}</option>)}</select></label>
                :<div className="sm-form-grid"><label>{t('ルール','Rules')}<select value={practiceMode} onChange={e=>setPracticeMode(e.target.value as typeof practiceMode)}><option value="standard">{t(...MODE_NAMES.standard)}</option><option value="tag">{t(...MODE_NAMES.tag)}</option></select></label>
                <label>CPU<select value={bots} onChange={e=>setBots(Number(e.target.value))}>{[5,7,11,14].map(n=><option key={n}>{n}</option>)}</select></label></div>}
              <label>{t('マップ','Map')}<select value={map} onChange={e=>setMap(e.target.value as MapId)}>{Object.entries(MAPS).map(([id,m])=><option key={id} value={id}>{t(m.ja,m.en)}</option>)}</select></label>
              <div className="sm-inline"><button type="button" onClick={()=>setPanel('lesson')}>{t('学年・単元を選ぶ','Choose grade and unit')}</button><small data-allow-japanese="true">{titleFor(lesson,t('おまかせ','Automatic'))}</small></div>
            </>}
          <button className="sm-primary" disabled={busy||!name.trim()||(entry==='join'&&code.length!==6)}>{busy?t('準備中…','Connecting…'):entry==='join'?t('参加する','Join room'):entry==='practice'?t('練習を始める','Start practice'):t('部屋を作る','Create room')}</button>
        </form>
        {!secretMissionServer()&&entry!=='practice'&&<p className="sm-muted">{t(...errors.OFFLINE)}</p>}
      </section><div className="sm-entry-map"><MissionViewport map={missionMap(map)} t={t} preview quality={quality}/></div></main>}
      {feedback&&<p className="sm-error" role="alert">{feedback}</p>}
    </>}
    {panel==='rewards'&&<div className="sm-overlay"><section className="sm-dialog" role="dialog" aria-modal="true" aria-label={t('任務の記録','Mission record')}>
      <header><h2>{t('任務の記録','Mission record')}</h2><button onClick={()=>setPanel(null)} aria-label={t('閉じる','Close')}>×</button></header>
      <p className="sm-role-pill">{badge(profile,en)} · Lv.{missionLevel(profile)} · {profile.tokens} {t('トークン','tokens')}</p>
      <div className="sm-result-grid"><span>{t('勝利','Wins')}<b>{profile.wins}</b></span><span>{t('学習任務','Tasks')}<b>{profile.tasks}</b></span><span>{t('設備復旧','Repairs')}<b>{profile.repairs}</b></span></div>
      <h3>{t('エモート交換','Emote exchange')}</h3>
      <div className="sm-inline">{(Object.keys(EMOTE_COSTS) as ExtraEmote[]).map(key=><button key={key} disabled={profile.emotes.includes(key)||profile.tokens<EMOTE_COSTS[key]}
        onClick={()=>setProfile(unlockEmote(key))}>{EMOTES[key]} {t(...EMOTE_NAMES[key])} · {profile.emotes.includes(key)?t('交換済み','Owned'):EMOTE_COSTS[key]}</button>)}</div>
    </section></div>}
    {(panel==='guide'||panel==='avatar'||panel==='settings'||panel==='custom')&&<div className="sm-overlay"><section className="sm-dialog" role="dialog" aria-modal="true" aria-label={
      panel==='guide'?t('遊び方','How to play'):panel==='avatar'?t('キャラクター','Character'):panel==='settings'?t('対戦設定','Match settings'):t('問題を作る','Write questions')}>
      <header><h2>{panel==='guide'?t('遊び方','How to play'):panel==='avatar'?t('キャラクター','Character'):panel==='settings'?t('対戦設定','Match settings'):t('問題を作る','Write questions')}</h2>
        <button onClick={()=>setPanel(null)} aria-label={t('閉じる','Close')}>×</button></header>
      {panel==='guide'&&<div className="sm-guide">
        <p><b>{t('見つける','Find')}</b> {t('地図の緑印が自分の任務。端末に近づいて問題を解きます。','Green marks show your assigned terminals. Approach one to solve a question.')}</p>
        <p><b>{t('協力する','Repair')}</b> {t('光る端末を動かして、妨害を解除します。重大な設備異常は2か所の復旧が必要です。','Restore the highlighted terminals when systems go down. Critical incidents require two repairs.')}</p>
        <p><b>{t('推理する','Investigate')}</b> {t('気絶した仲間を見つけたら通報。見たことを話してから投票します。','Report a stunned teammate, share what you saw and vote.')}</p>
        <p><b>{t('動く','Move')}</b> {t('WASD／方向キー／左スティック。Eで操作、Rで通報、Qで役職行動、Mで地図。','WASD / arrows / left stick. E to interact, R to report, Q for your ability, M for map.')}</p>
        <p>{t('鬼ごっこには会議がなく、正解で加速や隠れ場所が使えます。','Chase has no meetings. Correct answers grant speed boosts or access to hiding spots.')}</p>
      </div>}
      {panel==='avatar'&&<div className="sm-avatar"><AvatarPreview avatar={avatar}/><AvatarCreator activity="vr" value={avatar} languageMode={language} onChange={changeAvatar}/></div>}
      {panel==='settings'&&view&&<MissionSettings value={view.settings} t={t} local={connection.current?.local} onSave={value=>{send({type:'settings',value});setPanel(null);}}/>}
      {panel==='custom'&&<div className="sm-custom">
        <label>{t('問題セット名','Question set name')}<input value={customTitle} onChange={e=>setCustomTitle(e.target.value)} maxLength={80}/></label>
        {custom.map((row,i)=><fieldset key={i}><legend>{t('問題','Question')} {i+1}</legend>
          <label>{t('問題文','Prompt')}<textarea value={row.question} maxLength={600} onChange={e=>updateCustom(i,'question',e.target.value)}/></label>
          <label>{t('正解','Correct answer')}<input value={row.answer} maxLength={140} onChange={e=>updateCustom(i,'answer',e.target.value)}/></label>
          {row.options.map((option,j)=><label key={j}>{t('誤答候補','Distractor')} {j+1}<input value={option} maxLength={140} onChange={e=>updateCustom(i,'options',e.target.value,j)}/></label>)}
          {custom.length>1&&<button onClick={()=>setCustom(rows=>rows.filter((_,j)=>j!==i))}>{t('この問題を削除','Remove question')}</button>}
        </fieldset>)}
        <div className="sm-inline"><button disabled={custom.length>=24} onClick={()=>setCustom(rows=>[...rows,{question:'',answer:'',options:['','','']}])}>{t('問題を追加','Add question')}</button>
          <button className="sm-primary" disabled={!custom.some(q=>q.question.trim()&&q.answer.trim())} onClick={()=>void useCustom()}>{t('この問題セットを使う','Use question set')}</button></div>
      </div>}
    </section></div>}
  </div>;
  return <>{root}{panel==='lesson'&&<OnlineLessonPicker activity="vr" languageMode={language} busy={busy} error="" onBack={()=>setPanel(null)} onSelect={selection=>void chooseLesson(selection)}
    extraHeader={lesson&&<button onClick={()=>void chooseLesson(undefined)}>{t('おまかせに戻す','Reset to automatic')}</button>}/>}</>;
}
