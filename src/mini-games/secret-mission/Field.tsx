import React,{useEffect,useRef,useState} from 'react';
import { Map as MapIcon, Radio, ScanEye, ShieldCheck, Wrench, Bell, Zap, Settings2, Crosshair, Flag } from 'lucide-react';
import { AVATAR_COLORS } from '../gakuro-kart/avatar';
import BombStick from '../gakurogear/BombStick';
import { PAD, useGameplayGamepad } from '../../hooks/useGameplayGamepad';
import type { LanguageMode } from '../../types';
import { MAPS, missionMap, type MissionMap } from './maps';
import { EMOTES, EMOTE_NAMES, ROLES, type Command, type Disruption, type Emote, type View } from './rules';
import type { Copy } from './Settings';
import { createMissionScene } from './scene';
import Meeting,{Groups,facility,person,timeText} from './Meeting';
import TaskDialog from './TaskDialog';
import Results,{ClassReport} from './Results';
import type { MissionProfile } from './profile';

export function MissionMapCanvas({map,view,full=false,t}:{map:MissionMap;view?:View;full?:boolean;t:Copy}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=ref.current,ctx=canvas?.getContext('2d');if(!canvas||!ctx)return;
    const x=(n:number)=>n*canvas.width/map.w,z=(n:number)=>n*canvas.height/map.d;
    ctx.fillStyle='#142837';ctx.fillRect(0,0,canvas.width,canvas.height);
    for(const f of map.facilities){
      const target=(view?.assigned.includes(f.id)&&!view.completed.includes(f.id)&&view.alarm?.kind!=='signal');
      ctx.fillStyle=target?'#2c695c':'#293f51';
      ctx.fillRect(x(f.x-f.w/2),z(f.z-f.d/2),x(f.w),z(f.d));
      if(full){
        ctx.fillStyle=target?'#b7f7c5':'#c9d9e5';ctx.font='700 15px system-ui';ctx.textAlign='center';
        ctx.fillText(String(f.id+1),x(f.x),z(f.z)+5);
      }
    }
    ctx.fillStyle='#8baabe';
    for(const wall of map.walls)ctx.fillRect(x(wall.x-wall.w/2),z(wall.z-wall.d/2),Math.max(1,x(wall.w)),Math.max(1,z(wall.d)));
    const closed=view?.alarm?.kind==='doors'&&map.doors[view.alarm.door??-1];
    if(closed){ctx.fillStyle='#ff825b';ctx.fillRect(x(closed.x-closed.w/2),z(closed.z-closed.d/2),x(closed.w),Math.max(2,z(closed.d)));}
    function dot(point:{x:number;z:number},color:string,r:number){
      ctx!.beginPath();ctx!.arc(x(point.x),z(point.z),r,0,2*Math.PI);ctx!.fillStyle=color;ctx!.fill();
    }
    dot(map.meeting,'#ffd185',full?5:3);
    for(const index of view?.alarm?.stations??[])if(!view?.alarm?.repaired.includes(index)){
      const f=map.facilities[index];if(f)dot(f,'#ff774e',full?7:3);
    }
    if(full&&view?.observer)for(const p of view.actors)dot(p,AVATAR_COLORS[p.avatar.outfit],6);
    if(view?.self)dot(view.self,'#e9fff2',full?6:3.3);
  },[map,view,full]);
  const width=full?672:276,height=Math.max(full?280:105,Math.round(width*map.d/map.w));
  return <canvas className="sm-map-canvas" ref={ref} width={width} height={height} role="img" aria-label={t('施設マップ','Facility map')}/>;
}

export function MissionViewport({map,view,t,preview=false,quality=true}:{map:MissionMap;view?:View;t:Copy;preview?:boolean;quality?:boolean}){
  const host=useRef<HTMLDivElement>(null),live=useRef(view);live.current=view;
  const [fallback,setFallback]=useState(false);
  const en=t('','en')==='en';
  useEffect(()=>{
    const element=host.current;if(!element)return;
    let renderer:ReturnType<typeof createMissionScene>;
    try{renderer=createMissionScene(element,map,en,preview,quality);setFallback(false);}
    catch{setFallback(true);return;}
    let id=0,disposed=false,last=0;
    const lost=(e:Event)=>{e.preventDefault();cancelAnimationFrame(id);setFallback(true);};
    const canvas=element.querySelector('canvas');
    canvas?.addEventListener('webglcontextlost',lost);
    const draw=(now:number)=>{
      if(disposed)return;
      const interval=preview||live.current?.observer?38:quality?15:32;
      if(!document.hidden&&now-last>=interval){renderer.draw(live.current,now);last=now;}
      id=requestAnimationFrame(draw);
    };
    id=requestAnimationFrame(draw);
    return ()=>{disposed=true;cancelAnimationFrame(id);canvas?.removeEventListener('webglcontextlost',lost);renderer.dispose();};
  },[map,en,preview,quality]);
  return <div className={'sm-viewport '+(fallback?'is-fallback':'')} data-secret-viewport>
    <div ref={host} className="sm-renderer"/>
    {fallback&&<div className="sm-fallback"><MissionMapCanvas map={map} view={view} full t={t}/>
      {view?.self&&<div className="sm-fallback-actors">{[...view.bodies,...view.actors].map(p=><span key={p.id}>{p.name}</span>)}</div>}</div>}
  </div>;
}
type Panel='map'|'systems'|'role'|'admin'|'controls'|null;
type Binding='use'|'report'|'action'|'map';
const commands:[Binding,string,string,string][]=[['use','端末を操作','Interact','KeyE'],['report','通報','Report','KeyR'],['action','役職アクション','Role action','KeyQ'],['map','地図','Map','KeyM']];
const defaultKeys=Object.fromEntries(commands.map(([k,, ,code])=>[k,code])) as Record<Binding,string>;
const controlKey='gakuro-secret-mission-controls-v1';
function preferredKeys(){
  try{return {...defaultKeys,...JSON.parse(localStorage.getItem(controlKey)??'{}')} as Record<Binding,string>;}catch{return defaultKeys;}
}
const alarmNames:Record<Disruption,[string,string]>={
  lights:['停電','Power outage'],signal:['通信障害','Communications jammed'],doors:['扉の封鎖','Door sealed'],critical:['重大な設備異常','Critical failure'],
};

export default function Field({view,send,t,language,profile,onExit,quality,onQuality,status}:{
  view:View;send:(c:Command)=>void;t:Copy;language:LanguageMode;profile:MissionProfile;onExit:()=>void;
  quality:boolean;onQuality:(v:boolean)=>void;status:string;
}){
  const map=missionMap(view.map,view.large), h=view.hint, self=view.self, alive=self?.presence==='active';
  const [panel,setPanel]=useState<Panel>(null),[keys,setKeys]=useState(preferredKeys),[binding,setBinding]=useState<Binding|null>(null);
  const direction=useRef(new Set<string>()),pad=useRef({x:0,z:0,run:false}),touch=useRef({x:0,z:0});
  const active=view.phase==='field'&&!panel&&!view.task&&!view.paused&&!status&&!view.observer&&!!self&&(alive||view.settings.ghosts);
  const playable=useRef(active);playable.current=active;
  const role=view.role?ROLES[view.role]:undefined, shade=role?.[2]==='shade', tag=view.settings.mode==='tag';
  const sabotageReady=(view.sabotageReady??Infinity)<=view.now&&!view.alarm;
  const primary:Command|undefined=h.repair!==undefined?{type:'repair',id:h.repair}:h.terminal!==undefined?{type:'task',id:h.terminal}
    :h.hide?{type:'hide'}:h.door?{type:'unseal'}:h.tunnel?{type:'tunnel'}:h.meeting?{type:'meeting'}:h.camera
      ?{type:'camera',id:map.cameras.reduce((winner,cam,i,list)=>Math.hypot(cam.x-(self?.x??0),cam.z-(self?.z??0))<Math.hypot(list[winner].x-(self?.x??0),list[winner].z-(self?.z??0))?i:winner,0)}:undefined;
  const primaryText=h.repair!==undefined?t('設備を復旧','Repair') : h.terminal!==undefined?t('学習端末を操作','Use terminal')
    :h.hide?t('隠れる','Hide'):h.door?t('扉を開放','Unseal') : h.tunnel?t('整備通路','Service tunnel') : h.meeting?t('会議を開く','Call meeting'):h.camera?t('監視カメラ','Security camera'):t('施設を操作','Interact');
  const power:Command|undefined=h.special&&view.role==='medic'?{type:'ability',id:h.special}:h.stun?{type:'stun',id:h.stun}:h.special?{type:'ability',id:h.special}:undefined;
  const handle=useRef((key:Binding)=>{});handle.current=key=>{
    if(key==='map'&&view.phase==='field'){setPanel(p=>p==='map'?null:'map');return;}
    if(!active)return;
    if(key==='use'&&primary)send(primary);
    if(key==='report'&&h.body)send({type:'report',id:h.body});
    if(key==='action'&&power)send(power);
  };
  useEffect(()=>{setPanel(null);},[view.phase,view.round,view.group]);
  useEffect(()=>{
    if(active)return;
    direction.current.clear();touch.current={x:0,z:0};pad.current={x:0,z:0,run:false};
    send({type:'input',x:0,z:0});
  },[active,send]);
  useEffect(()=>{
    const blur=()=>{direction.current.clear();touch.current={x:0,z:0};pad.current={x:0,z:0,run:false};send({type:'input',x:0,z:0});};
    const kdown=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLElement&&e.target.closest('input,textarea,select'))return;
      if(binding){
        e.preventDefault();
        if(e.code!=='Escape'){
          const next={...keys,[binding]:e.code};setKeys(next);
          try{localStorage.setItem(controlKey,JSON.stringify(next));}catch{}
        }
        setBinding(null);return;
      }
      if(e.code==='Escape'){
        if(view.task)send({type:'close-task'});
        else setPanel(null);
        return;
      }
      const actions=commands.filter(([key])=>keys[key]===e.code);
      if(actions.length&&!e.repeat){for(const [key] of actions)handle.current(key);return;}
      if(!playable.current)return;
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)){
        e.preventDefault();direction.current.add(e.code);
      }
    };
    const kup=(e:KeyboardEvent)=>direction.current.delete(e.code);
    window.addEventListener('keydown',kdown);window.addEventListener('keyup',kup);window.addEventListener('blur',blur);
    document.addEventListener('visibilitychange',blur);
    return ()=>{window.removeEventListener('keydown',kdown);window.removeEventListener('keyup',kup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',blur);};
  },[view.task?.token,keys,binding,send]);
  useEffect(()=>{
    const timer=setInterval(()=>{
      if(!playable.current||document.hidden)return;
      const d=direction.current, touchInput=touch.current, gamepad=pad.current;
      const x=Number(d.has('KeyD')||d.has('ArrowRight'))-Number(d.has('KeyA')||d.has('ArrowLeft'));
      const z=Number(d.has('KeyS')||d.has('ArrowDown'))-Number(d.has('KeyW')||d.has('ArrowUp'));
      send({type:'input',x:x||touchInput.x||gamepad.x,z:z||touchInput.z||gamepad.z,run:d.has('ShiftLeft')||d.has('ShiftRight')||gamepad.run});
    },70);
    return ()=>clearInterval(timer);
  },[send]);
  useGameplayGamepad('vr',input=>{
    if(!input.active||!playable.current){pad.current={x:0,z:0,run:false};return;}
    pad.current={x:input.x,z:input.y,run:input.buttons[PAD.LB]};
    if(input.pressed[PAD.A])handle.current('use');
    if(input.pressed[PAD.X])handle.current('report');
    if(input.pressed[PAD.RT])handle.current('action');
    if(input.pressed[PAD.Y])handle.current('map');
  });
  const remaining=view.phase==='field'?view.clock:view.deadline-view.now;
  const system=view.alarm;
  const warning=system?.kind==='critical'?t(...MAPS[view.map].critical):system?t(...alarmNames[system.kind]):'';
  const nowHint=h.repair!==undefined?facility(map,h.repair,t):h.terminal!==undefined?facility(map,h.terminal,t):'';
  const open=(value:Panel)=>{setBinding(null);setPanel(old=>old===value?null:value);};
  return <main className={'sm-field '+(system?'is-alarm':'')} data-secret-phase={view.phase} data-secret-group={view.group}
    data-gamepad-live={active?'vr':undefined} aria-label={t('対戦フィールド','Match field')}>
    <MissionViewport map={map} view={view} t={t} quality={quality}/>
    <header className="sm-hud">
      <div className="sm-hud-title"><span className="sm-brand">SECRET<span> MISSION</span></span><small>{t(MAPS[view.map].ja,MAPS[view.map].en)}{view.groups.length>1?' · '+t('班','Group')+' '+(view.group+1):''}</small></div>
      <div className="sm-objective"><span>{t('共同任務','Shared tasks')} <b>{view.done}/{view.total}</b></span><progress max={Math.max(view.total,1)} value={view.done}/></div>
      <strong className="sm-timer">{timeText(remaining)}</strong>
      <button className="sm-icon" aria-label={t('操作と設定','Controls and settings')} onClick={()=>open('controls')}><Settings2 size={19}/></button>
    </header>
    {view.paused&&!status&&<p role="status" className="sm-connection-banner">{t('一時停止中','Paused')}</p>}
    {view.phase==='field'&&warning&&<div className="sm-alert" role="status"><Zap size={16}/>{warning} · {timeText((system?.ends??0)-view.now)}{system?.stations.length?' · '+system.repaired.length+'/'+system.stations.length:''}</div>}
    {view.phase==='field'&&<aside className="sm-tools">
      <button onClick={()=>open('map')} className="sm-map-button" aria-label={t('地図を開く','Open map')}><MissionMapCanvas map={map} view={view} t={t}/><span><MapIcon size={14}/>{t('地図','Map')}</span></button>
      {view.role&&<button onClick={()=>open('role')} aria-label={t('役職と任務','Role and tasks')}><Flag size={15}/>{t('任務','Tasks')}</button>}
      {shade&&!tag&&alive&&<button onClick={()=>open('systems')} aria-label={t('妨害マップ','Sabotage map')}><Zap size={15}/>{t('妨害','Sabotage')} {!sabotageReady&&timeText((view.sabotageReady??view.now)-view.now)}</button>}
      {view.host&&<button onClick={()=>open('admin')}><Radio size={15}/>{t('進行','Manage')}</button>}
    </aside>}
    {view.phase==='field'&&active&&<>
      <div className="sm-stick"><BombStick disabled={!active} en={language==='ENGLISH'} onChange={(x,z)=>{touch.current={x,z};}}/></div>
      <div className="sm-actions">
        {h.body&&alive&&<button className="sm-action-warning" onClick={()=>send({type:'report',id:h.body!})}><Bell size={18}/>{t('通報','Report')}</button>}
        {power&&<button className={shade?'sm-action-warning':''} onClick={()=>send(power)}><Crosshair size={18}/>{h.stun?t('シャボン','Bubble'):t('役職アクション','Role action')}</button>}
        <button className="sm-primary" disabled={!primary} onClick={()=>primary&&send(primary)}><Wrench size={19}/>{primaryText}</button>
      </div>
      <div className="sm-caption">{!alive?t('ゴーストとして学習を続けよう','Continue studying as a ghost'):nowHint||t('地図で次の端末を探そう','Use the map to find your next terminal')}</div>
    </>}
    {view.phase==='field'&&!alive&&!view.observer&&!view.settings.ghosts&&!view.task&&
      <div className="sm-caption"><button onClick={()=>send({type:'practice-task'})}>{t('個人練習をする','Practise on your own')}</button></div>}
    {view.camera!==undefined&&<div className="sm-caption"><ScanEye size={16}/>{t('監視カメラ','Security camera')} {view.camera+1}</div>}
    {view.phase==='briefing'&&<div className="sm-overlay"><section className="sm-dialog sm-briefing" role="dialog" aria-modal="true" aria-label={t('役職発表','Role briefing')} data-side={role?.[2]}>
      <ShieldCheck size={39}/><small>{t('まもなく開始','Starting shortly')} · {timeText(remaining)}</small>
      <h2>{view.observer?t('進行・観戦','Moderator view'):tag?(shade?t('追うチーム','Chaser'):t('逃げるチーム','Runner')):role?t(role[0],role[1]):t('作戦開始','Mission starts')}</h2>
      <p>{tag?t('会議はありません。任務で加速や隠れ場所を使い、時間まで逃げ切ろう。','No meetings. Tasks unlock speed boosts and hiding places. Survive until time runs out.'):role?t(role[3],role[4]):t('各班の対戦と学習進捗を見守れます。','Watch each group and its learning progress.')}</p>
      {!!view.allies.length&&<p>{t('仲間','Allies')} · {view.allies.map(id=>person(view,id,t)).join(' / ')}</p>}
      <Groups view={view} send={send} t={t}/>
      <button onClick={onExit}>{t('退出','Leave')}</button>
    </section></div>}
    {['talk','vote','eject'].includes(view.phase)&&<Meeting key={view.round+':'+view.group+':'+view.meeting?.by} view={view} map={map} t={t} send={send} onExit={onExit}/>}
    {view.phase==='result'&&!view.task&&<Results view={view} t={t} profile={profile} onExit={onExit} send={send}/>}
    {panel&&!view.task&&view.phase==='field'&&<div className="sm-overlay"><section className={'sm-dialog sm-panel '+(panel==='map'||panel==='systems'?'sm-map-panel':'')} role="dialog" aria-modal="true" aria-label={panel==='systems'?t('妨害工作','Sabotage'):panel==='role'?t('役職と任務','Role and tasks'):panel==='controls'?t('操作と設定','Controls and settings'):panel==='admin'?t('進行管理','Match management'):t('施設マップ','Facility map')}>
      <header><h2>{panel==='systems'?t('妨害工作','Sabotage'):panel==='role'?t('役職と任務','Role and tasks'):panel==='controls'?t('操作と設定','Controls and settings'):panel==='admin'?t('進行管理','Match management'):t('施設マップ','Facility map')}</h2><button onClick={()=>open(null)} aria-label={t('閉じる','Close')}>×</button></header>
      {(panel==='map'||panel==='systems')&&<>
        <MissionMapCanvas map={map} view={view} full t={t}/>
        {panel==='map'&&system?.kind==='signal'&&<p className="sm-warning">{t('通信障害中は任務の位置表示が消えます。','A communications outage hides task locations.')}</p>}
        {panel==='systems'&&<div className="sm-inline">{(['lights','signal','critical'] as const).map(kind=><button key={kind} disabled={!sabotageReady} onClick={()=>{send({type:'sabotage',kind});open(null);}}>{t(...alarmNames[kind])}</button>)}</div>}
        <ul className="sm-facilities">{map.facilities.map(f=><li key={f.id}><b>{f.id+1}</b><span>{t(f.ja,f.en)}</span>
          {panel==='systems'?<button disabled={!sabotageReady} onClick={()=>{send({type:'sabotage',kind:'doors',door:f.id});open(null);}}>{t('扉を閉鎖','Seal door')}</button>
          :view.assigned.includes(f.id)&&system?.kind!=='signal'&&<small>{view.completed.includes(f.id)?'✓':t('任務','Task')}</small>}</li>)}</ul>
        {panel==='map'&&view.role==='monitor'&&system?.kind!=='signal'&&<div className="sm-inline">{map.cameras.map((_,i)=><button key={i} disabled={(view.abilityReady??0)>view.now} onClick={()=>{send({type:'camera',id:i});open(null);}}>{t('カメラ','Camera')} {i+1}</button>)}</div>}
      </>}
      {panel==='role'&&role&&<>
        <p className="sm-role-pill">{t(role[0],role[1])}</p><p>{t(role[3],role[4])}</p>
        {!!view.allies.length&&<p>{t('仲間','Allies')} · {view.allies.map(id=>person(view,id,t)).join(' / ')}</p>}
        <ul className="sm-facilities">{view.assigned.map(id=><li key={id}><b>{id+1}</b>{facility(map,id,t)} <small>{view.completed.includes(id)?'✓':t('未完了','Open')}</small></li>)}</ul>
        {!!view.notes?.length&&<section><h3>{t('最近の施設記録','Recent terminal activity')}</h3><ul>{view.notes.map((note,i)=><li key={i}>{note}</li>)}</ul></section>}
        {alive&&<div className="sm-inline">{(['wave','spark','check',...profile.emotes] as Emote[]).map(key=><button key={key} onClick={()=>{send({type:'emote',emote:key});open(null);}}>
          {EMOTES[key]} {t(...EMOTE_NAMES[key])}
        </button>)}</div>}
      </>}
      {panel==='admin'&&view.host&&<>
        <Groups view={view} send={send} t={t}/>
        <div className="sm-inline">
          <button onClick={()=>send({type:'pause'})}>{view.paused?t('再開','Resume'):t('一時停止','Pause')}</button>
          <button onClick={()=>send({type:'extend'})}>{t('時間を1分延ばす','Add one minute')}</button>
          {!tag&&<button onClick={()=>send({type:'force-meeting'})}>{t('会議を開く','Call meeting')}</button>}
          <button onClick={()=>{if(window.confirm(t('対戦を終了しますか？','End this match?')))send({type:'end'});}}>{t('対戦を終了','End match')}</button>
        </div>
        {view.reports&&<ClassReport reports={view.reports} t={t}/>}
        <ul className="sm-facilities">{view.roster.filter(p=>!p.bot&&p.id!==view.who).map(p=><li key={p.id}>{p.name}<button onClick={()=>{if(window.confirm(p.name+' · '+t('退出させますか？','Remove from the room?')))send({type:'kick',id:p.id});}}>{t('退出させる','Remove')}</button></li>)}</ul>
      </>}
      {panel==='controls'&&<>
        <p>{t('WASD・方向キー・スティックで移動。ShiftまたはLBで走ります。','Move with WASD, arrows or the stick. Hold Shift or LB to run.')}</p>
        <div className="sm-form-grid">{commands.map(([key,ja,en])=><label key={key}>{t(ja,en)}<button aria-pressed={binding===key} onClick={()=>setBinding(key)}>{binding===key?t('キーを押す','Press a key'):keys[key].replace('Key','')}</button></label>)}</div>
        <label className="sm-check"><input type="checkbox" checked={quality} onChange={e=>onQuality(e.target.checked)}/>{t('高画質','High quality')}</label>
        <button onClick={onExit}>{t('退出','Leave')}</button>
      </>}
    </section></div>}
    {view.task&&<TaskDialog key={view.task.token+':'+(view.task.puzzle?.kind??'question')} task={view.task} label={view.task.station<0?t('練習問題','Practice question'):facility(map,view.task.station,t)} t={t} language={language} clock={view.now} send={send}/>}
    {status&&<div className="sm-overlay sm-reconnecting"><section className="sm-dialog" role="dialog" aria-modal="true" aria-label={t('接続状況','Connection status')}>
      <p role="status">{status}</p><button onClick={onExit}>{t('退出','Leave')}</button>
    </section></div>}
  </main>;
}
