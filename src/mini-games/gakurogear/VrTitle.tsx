import {useVrBgm,cue} from './audio';
import {audioService} from '../../services/audioService';
import React,{useEffect,useRef,useState} from 'react';
import type {MiniGameComponentProps} from '../../components/MiniGameRouter';
import GameTitleScreen from '../shared/GameTitleScreen';
import OnlineLessonPicker from '../shared/OnlineLessonPicker';
import {createPortal} from 'react-dom';
import AvatarCreator from '../gakuro-kart/AvatarCreator';
import {buildLesson,type LessonSelection} from '../gakuro-kart/questions';
import type {KartLesson} from '../gakuro-kart/learning';
import type {KartAvatar} from '../gakuro-kart/avatar';
import {loadVrAvatar,saveVrAvatar} from './character';
import {createScene} from './scene';
import {MISSIONS} from './engine';
import StagePreview from './StagePreview';
import GakuroGear from './GakuroGear';
import OnlineGame from './OnlineGame';
import VrLobby from './VrLobby';
import {VrRoom} from './network';
import type {OnlineMode,OnlineWorld} from './onlineEngine';
import '../gakuro-kart/kart.css';
import './gakurogear.css';
function AvatarPreview({avatar}:{avatar:KartAvatar}){const host=useRef<HTMLDivElement>(null),scene=useRef<ReturnType<typeof createScene>|null>(null);useEffect(()=>{if(!host.current)return;const mission={...MISSIONS[0],routes:[],cameras:[],targets:[],obstacles:[]};let view:ReturnType<typeof createScene>;try{view=createScene(host.current,mission,avatar);}catch{return;}scene.current=view;let frame=0;const draw=()=>{if(!document.hidden)view.portrait();frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);scene.current=null;view.dispose();};},[]);useEffect(()=>{scene.current?.setAvatar(avatar);},[avatar]);return <div ref={host} className="gear-avatar-preview" aria-hidden="true"/>;}
export default function VrTitle(props:MiniGameComponentProps){const language=props.languageMode??'JAPANESE',en=language==='ENGLISH',t=(ja:string,eng:string)=>en?eng:ja;
 const [entry,setEntry]=useState<'title'|'lesson'|'solo'|'online'|'setup'|'join'>('title'),[intent,setIntent]=useState<'solo'|'create'|'join'>('solo');
 const [mode,setMode]=useState<OnlineMode>('coop'),[mission,setMission]=useState(1),[limit,setLimit]=useState(300),[name,setName]=useState('Player'),[code,setCode]=useState(''),[lesson,setLesson]=useState<KartLesson|null>(null),[world,setWorld]=useState<OnlineWorld|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[avatar,setAvatar]=useState(loadVrAvatar),[editing,setEditing]=useState(false);
 useVrBgm(editing?'avatar':entry==='lesson'?'lesson':entry==='online'?'lobby':'title',mission,20);
 const room=useRef<VrRoom|null>(null);useEffect(()=>()=>room.current?.close(),[]);
 const leave=()=>{setEditing(false);room.current?.close();room.current=null;setWorld(null);setEntry('title');setError('');};
 const choose=async(selection:LessonSelection)=>{void audioService.unlockAudio();cue('select');try{setBusy(true);setError('');const questions=buildLesson(selection,15);setLesson(questions);if(intent==='solo'){setEntry('solo');return;}const r=new VrRoom(setWorld,setError);room.current=r;await r.create(name,mode,mission,questions,limit,avatar);setEntry('online');}catch(e){setError(String((e as Error).message));room.current?.close();}finally{setBusy(false);}};
 const join=async()=>{void audioService.unlockAudio();cue('select');try{setBusy(true);setError('');const r=new VrRoom(setWorld,setError);room.current=r;await r.join(name,code,avatar);setEntry('online');}catch(e){setError((e as Error).message);room.current?.close();}finally{setBusy(false);}};
 const withCreator=(content:React.ReactNode)=><>{content}{editing&&createPortal(<div className="gear-avatar-backdrop" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();setEditing(false);}if(e.key==='Tab'){const nodes=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled)')),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}><section role="dialog" aria-modal="true" aria-label={t('キャラクタークリエイト','Character creator')} className="gear-avatar-dialog"><header className="gear-header"><strong>{t('主人公を作る','Create your character')}</strong><button autoFocus onClick={()=>setEditing(false)}>{t('完了','Done')}</button></header><div className="gear-avatar-content"><AvatarPreview avatar={avatar}/><AvatarCreator activity="vr" value={avatar} languageMode={language} onChange={a=>{setAvatar(a);saveVrAvatar(a);room.current?.setAvatar(a);}}/></div></section></div>,document.body)}</>;
 if(entry==='solo'&&lesson)return withCreator(<GakuroGear {...props} onBack={()=>setEntry('title')} lesson={lesson} avatar={avatar} onConfigure={()=>setEditing(true)} editing={editing}/>);
 if(entry==='lesson')return <OnlineLessonPicker activity="vr" languageMode={language} busy={busy} error={error} onBack={()=>setEntry(intent==='create'?'setup':'title')} onSelect={selection=>void choose(selection)}/>;
 if(entry==='online'&&world&&room.current){if(world.phase!=='lobby')return withCreator(<OnlineGame room={room.current} world={world} en={en} onBack={leave} onConfigure={()=>setEditing(true)} editing={editing}/>);return withCreator(<VrLobby world={world} code={room.current.code} host={room.current.host} en={en} error={error} onLeave={leave} onConfigure={()=>setEditing(true)} onStart={()=>room.current?.start()}/>);}
 const openLessons=()=>{setIntent('solo');void audioService.unlockAudio();cue('select');setEntry('lesson');};
 const setup=entry==='setup',joining=entry==='join';
 const actions=setup?[{label:t('問題を選んで部屋を作る','Choose lesson and create room'),onClick:()=>{setIntent('create');setEntry('lesson');},disabled:busy}]:joining?[{label:t('参加する','Join'),onClick:()=>void join(),disabled:busy||!code.trim()}]:[{label:t('ソロトレーニング','Solo training'),onClick:openLessons},{label:t('オンラインルーム作成','Create online room'),onClick:()=>setEntry('setup')},{label:t('ルームに参加','Join room'),onClick:()=>setEntry('join')}];
 return <GameTitleScreen kind="vr" title={setup?t('オンラインルーム作成','Create online room'):joining?t('ルームに参加','Join room'):t('GAKURO VRトレーニング','GAKURO VR Training')} subtitle={t('学校を舞台にしたステルス訓練','TACTICAL SCHOOL TRAINING')} languageMode={language} backLabel={entry==='title'?'学習ローグへ':t('戻る','Back')} onClose={entry==='title'?props.onBack:()=>setEntry('title')} backdrop={<StagePreview mission={MISSIONS[mission-1]}/>} actions={actions}>
 {(setup||joining)&&<div className="gear-title-options"><label>{t('参加名','Name')}<input disabled={busy} value={name} maxLength={24} onChange={e=>setName(e.target.value)}/></label>{joining?<label>{t('部屋コード','Room code')}<input disabled={busy} value={code} maxLength={8} onChange={e=>setCode(e.target.value.toUpperCase())}/></label>:<><label>{t('モード','Mode')}<select value={mode} onChange={e=>setMode(e.target.value as OnlineMode)}><option value="coop">{t('協力','Co-op')}</option><option value="royale">{t('バトルロイヤル','Battle royale')}</option></select></label>{mode==='coop'&&<label>{t('協力ミッション','Co-op mission')}<select value={mission} onChange={e=>setMission(Number(e.target.value))}>{MISSIONS.map(m=><option key={m.id} value={m.id}>{m.id}: {en?m.en:m.name}</option>)}</select></label>}<label>{t('制限時間（秒）','Time limit (seconds)')}<input type="number" min={60} max={900} step={30} value={limit} onChange={e=>setLimit(Math.max(60,Math.min(900,Number(e.target.value)||60)))}/></label></>}{busy&&<p role="status">{t('接続中…','Connecting…')}</p>}</div>}{error&&<p role="alert">{error}</p>}
 </GameTitleScreen>;
}
