import{endingNarration,endingCrown,narrationParts}from'./endingText';
import{useLanternMusic}from'./music';
import{storyBackground}from'./scenes';
import {playLanternLine,playLanternSequence,stopLanternVoice}from'./voices';
import {FIELD_QUESTS,fieldLines,finishFieldQuest} from './world';
import MiniGameProblemChallenge from '../../components/MiniGameProblemChallenge';
import {GameMode} from '../../types';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import {useContext} from 'react';
import {LanternLanguage} from './language';
import React,{useEffect,useRef,useState} from 'react';
import type {MiniGameComponentProps} from '../../components/MiniGameRouter';
import {assetUrl} from '../../utils/assetPaths';
import {CHAPTERS,SUPPORTS,supportLines,supportKey} from './story';
import {HEROES,heroById} from './roster';
import {newCampaign,loadCampaign,saveCampaign,clone,tick,advanceStory,claimResult,retryBattle,SAVE_KEY} from './engine';
import {FieldMap,Camp} from './CampaignViews';
import {Battlefield,type Update} from './Battlefield';
import {Portrait,BattleArt} from './art';
import type {Campaign,Line} from './types';
import './lantern-war.css';
export default function LanternWar({onBack,onFinish,languageMode='JAPANESE',problemMode=GameMode.MIXED,problemModePool,answerMode,assignment,onAnswerResult}:MiniGameComponentProps){
 const [setupOpen,setSetupOpen]=useState(false),setupDialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(!setupOpen)return;const dialog=setupDialog.current,previous=document.activeElement;dialog?.showModal();return()=>{dialog?.close();if(previous instanceof HTMLElement)previous.focus();};},[setupOpen]);
 const [s,setS]=useState<Campaign|null>(()=>loadCampaign()),[entered,setEntered]=useState(false),[hero,setHero]=useState<'aster'|'lyra'>('aster'),[difficulty,setDifficulty]=useState<Campaign['difficulty']>('story'),[saveError,setSaveError]=useState(false),[confirmNew,setConfirmNew]=useState(false);
 useLanternMusic(entered,s);
 const update:Update=f=>setS(prev=>{if(!prev)return prev;const next=clone(prev);f(next);return next;});
 useEffect(()=>{if(!s)return;const timer=setTimeout(()=>setSaveError(!saveCampaign(s)),200);return()=>clearTimeout(timer);},[s]);
 useEffect(()=>{if(!entered)return;const timer=setInterval(()=>setS(prev=>{if(!prev||prev.phase!=='battle'||!prev.battle||prev.battle.paused||prev.studyPending||document.hidden)return prev;const next=clone(prev);tick(next);return next;}),500);return()=>clearInterval(timer);},[entered]);
 useEffect(()=>{const pause=()=>{if(document.hidden)update(s=>{if(s.battle)s.battle.paused=true;});};document.addEventListener('visibilitychange',pause);return()=>document.removeEventListener('visibilitychange',pause);},[]);
 useEffect(()=>{const stop=()=>{if(document.hidden)stopLanternVoice();};document.addEventListener('visibilitychange',stop);window.addEventListener('blur',stopLanternVoice);return()=>{stopLanternVoice();document.removeEventListener('visibilitychange',stop);window.removeEventListener('blur',stopLanternVoice);};},[]);
 const exit=()=>{stopLanternVoice();if(s)setSaveError(!saveCampaign(s));onBack();};
 const start=()=>{setS(newCampaign(hero,difficulty));setEntered(true);setConfirmNew(false);setSetupOpen(false);};
 return <LanternLanguage.Provider value={languageMode}><TranslatedUiTree mode={languageMode}><section className="lw-root" style={Object.fromEntries(["scenery-0","scenery-1","scenery-3","world-map","title-landscape","title-portrait"].map(name=>["--lw-"+name,"url("+assetUrl("sprites/lantern-war/"+name+".webp")+")"])) as React.CSSProperties} data-gamepad-navigation-root data-lantern-war>

 {!entered?<div className="lw-title">
 <picture className="lw-title-art"><source media="(orientation: portrait)" srcSet={assetUrl('sprites/lantern-war/title-portrait.webp')}/><img src={assetUrl('sprites/lantern-war/title-landscape.webp')} alt="" fetchPriority="high"/></picture><div className="lw-title-shade"/>
 <button className="lw-title-back" onClick={exit}>‹ ゲーム一覧へ</button>
 <div className="lw-title-content"><div className="lw-title-text"><span className="lw-title-star" aria-hidden="true">✦</span><small>LEARNING ROGUE · HEIRS OF THE LANTERN</small><h1>継界戦記</h1><h2>灯を継ぐ者たち</h2><p>異なる世界から来た仲間と、<br/>誰かの明日を照らす灯を継ぐ。</p></div>
 <nav className="lw-title-menu">{s&&<button autoFocus className="lw-primary" onClick={()=>setEntered(true)}>旅の続きを開く · 第{s.chapter+1}章</button>}<button className={s?'':'lw-primary'} onClick={()=>setSetupOpen(true)}>新しい旅を始める <span aria-hidden="true">→</span></button></nav></div>
 <small className="lw-title-credit">全18章・部隊編成・作戦自動戦闘・支援会話</small>
 {setupOpen&&<dialog ref={setupDialog} role="dialog" aria-modal="true" className="lw-journey-dialog lw-panel" onCancel={()=>setSetupOpen(false)} aria-labelledby="lw-journey-heading"><h2 id="lw-journey-heading">主人公を選択</h2><div className="lw-title-controls"><div className="lw-hero-choices" role="group" aria-label="主人公を選択">{(['aster','lyra'] as const).map(id=><button key={id} aria-pressed={hero===id} onClick={()=>setHero(id)}><BattleArt id={id}/><b>{heroById(id).name}</b><small>{id==='aster'?'王冠よりも、隣の声を。':'帰る場所を守る剣を。'}</small></button>)}</div><label>難易度<select value={difficulty} onChange={e=>setDifficulty(e.target.value as Campaign['difficulty'])}><option value="story">物語 · 味方HP補正あり</option><option value="tactician">軍師 · 編成と作戦を重視</option></select></label><button className="lw-primary" onClick={()=>{setSetupOpen(false);s?setConfirmNew(true):start();}}>選んだ主人公で始める</button><button onClick={()=>setSetupOpen(false)}>タイトルへ戻る</button><small>行動後に自動保存。音声は設定で調整できます。</small></div></dialog>}
 {confirmNew&&<div className="lw-modal"><div className="lw-panel" role="dialog" aria-modal="true" aria-label="新しい旅を始める"><h2>現在の旅を置き換えます</h2><p>第{s!.chapter+1}章までの、このモードの保存データが置き換わります。</p><button onClick={start}>選んだ主人公で始める</button><button autoFocus onClick={()=>setConfirmNew(false)}>続きの旅を残す</button></div></div>}
 </div>:s&&<><header className="lw-header"><button onClick={exit}>‹ 保存して一覧へ</button><span>継界戦記 <small>灯を継ぐ者たち</small></span><div>{s.gold} G · 薬草 {s.supplies}<small>{s.difficulty==='story'?'物語':'軍師'}</small></div></header>
 <div className="lw-screen" hidden={!!s.studyPending}>
 {s.phase==='field'&&<FieldMap s={s} update={update}/>}
 {s.phase==='camp'&&<Camp s={s} update={update}/>}
 {s.phase==='battle'&&<Battlefield s={s} update={update}/>}
 {s.phase==='story'&&<Story s={s} update={update}/>}
 {s.phase==='result'&&<div className="lw-result"><small>{s.battle?.result==='win'?'CHAPTER COMPLETE':'REGROUP AT THE LANTERN'}</small><h2>{s.battle?.result==='win'?'灯は、次の道へ':'もう一度、作戦を練ろう'}</h2><p>{s.battle?.reason}</p>{s.battle?.result==='win'?<><p>交戦時間 {Math.floor(s.battle.time)}秒 · 仲間の経験と絆を獲得</p><button className="lw-primary" onClick={()=>update(claimResult)}>戦いの後の物語へ</button></>:<><button className="lw-primary" onClick={()=>update(retryBattle)}>出撃時点から再挑戦</button><button onClick={()=>update(s=>{s.phase='camp';s.battle=null;s.checkpoint=null;})}>キャンプで編成を見直す</button></>}</div>}
 {s.phase==='ending'&&<Ending s={s} update={update} onFinish={onFinish}/>}
 </div></>}
 {entered&&s?.studyPending&&<div className="lw-study"><button onClick={exit}>‹ 保存して一覧へ</button><MiniGameProblemChallenge mode={problemMode} modePool={problemModePool} answerMode={answerMode} assignment={assignment} onAnswerResult={onAnswerResult} languageMode={languageMode} problemOffset={s.studyProblems||0} onComplete={()=>update(s=>{s.studyPending=false;s.studyProblems=(s.studyProblems||0)+3;if(s.battle)s.battle.paused=true;})}/></div>}
 {saveError&&<div className="lw-save-error" role="alert">保存領域が不足しています。進行は画面内に保持しています。</div>}
 </section></TranslatedUiTree></LanternLanguage.Provider>;
}
function getLines(s:Campaign):Line[]{if(s.storyKind==='side'&&s.fieldQuest)return fieldLines(s.fieldQuest);if(s.storyKind==='support'){const [index,rank]=(s.supportId||'0:0').split(':').map(Number);return supportLines(index,rank);}const chapter=s.battle?.chapter??s.chapter;return s.storyKind==='outro'?CHAPTERS[chapter].outro:CHAPTERS[chapter].intro;}
function Story({s,update}:{s:Campaign;update:Update}){
 const language=useContext(LanternLanguage);
 const lines=getLines(s),line=lines[Math.min(s.storyIndex,lines.length-1)],chapter=s.battle?.chapter??s.chapter,c=CHAPTERS[chapter],speaker=line.who==='$hero'?s.hero:line.who;
 useEffect(()=>{if(language==='ENGLISH')return;void playLanternLine(speaker,speaker===s.hero&&s.hero==='lyra'?line.text.replaceAll('僕','私'):line.text);return stopLanternVoice;},[speaker,line.text,s.hero,language]);
 const sideQuest=s.storyKind==='side'?FIELD_QUESTS.find(q=>q.id===s.fieldQuest):undefined;
 const pair=s.storyKind==='support'?SUPPORTS[Number((s.supportId||'0:0').split(':')[0])]:undefined,leftActor=pair?.a||s.hero;
 const counterpart=sideQuest?.hero||pair?.b||(speaker==='narrator'||speaker===s.hero?(lines.find(l=>!['$hero','narrator'].includes(l.who))?.who||'high-school-warrior'):speaker);
 const ending=!sideQuest&&s.storyKind==='outro'&&s.storyIndex===lines.length-1&&c.dilemma;
 const next=(choice?:number)=>update(s=>{if(s.storyKind==='side'&&s.storyIndex===lines.length-1){finishFieldQuest(s,choice||0);return;}if(s.storyKind==='support'&&s.storyIndex===lines.length-1){const [i,r]=(s.supportId||'0:0').split(':').map(Number);const key=supportKey(i,r);if(!s.supports.includes(key))s.supports.push(key);}advanceStory(s,lines.length,choice);});
 return <TranslatedUiTree mode={useContext(LanternLanguage)}><div className="lw-story" style={{backgroundImage:(chapter===15&&s.storyKind!=='support'&&s.storyKind!=='side'?'linear-gradient(#071b4a88,#071b4a88),':'')+'url('+assetUrl(storyBackground(s))+')'}}>
 <header><small>{s.storyKind==='support'?'CAMP · 支援会話':sideQuest?'EXPEDITION · SIDE STORY':'CHAPTER '+String(chapter+1).padStart(2,'0')}</small><h2>{sideQuest?.title||(s.storyKind==='support'?'焚き火の言葉':c.title)}</h2><span>{s.storyIndex+1} / {lines.length}</span></header>
 <div className="lw-story-cast"><figure className={speaker===leftActor?'is-speaking':''}><Portrait id={leftActor} reaction={line.reaction}/></figure><figure className={speaker===counterpart?'is-speaking':''}><Portrait id={counterpart} reaction={line.reaction}/></figure></div>
 <div className="lw-story-script"><b>{speaker==='narrator'?'語り':heroById(speaker).name}</b><p key={s.storyIndex} aria-live="polite">{speaker===s.hero&&s.hero==='lyra'?line.text.replaceAll('僕','私'):line.text}</p><div>{s.storyIndex>0&&<button onClick={()=>update(s=>{s.storyIndex--;})}>前の台詞</button>}{sideQuest&&s.storyIndex===lines.length-1?sideQuest.choices.map((choice,i)=><button key={choice} className="lw-primary" onClick={()=>next(i)}>{choice}</button>):ending?c.dilemma!.map((choice,i)=><button key={choice} className="lw-primary" onClick={()=>next(i)}>{choice}</button>):<button autoFocus className="lw-primary" onClick={()=>next()}>{s.storyIndex===lines.length-1?s.storyKind==='intro'?'戦場へ':s.storyKind==='support'?'キャンプへ':'次の灯へ':'次の台詞'} →</button>}</div></div>
 </div></TranslatedUiTree>;
}
function Ending({s,update,onFinish}:{s:Campaign;update:Update;onFinish?:MiniGameComponentProps['onFinish']}){
 const shared=Object.values(s.choices).filter(v=>v===1).length>=3,[page,setPage]=useState(0),cast=s.recruited.map(heroById);
 const language=useContext(LanternLanguage);useEffect(()=>{if(language==='ENGLISH')return;const lines=page===0?[...narrationParts(endingNarration(shared)),...narrationParts(endingCrown(heroById(s.hero).name))].map(text=>({speaker:'narrator',text})):[];void playLanternSequence([...lines,{speaker:cast[page].id,text:cast[page].motto}]);return stopLanternVoice;},[page,language]);
 return <TranslatedUiTree mode={language}><div className="lw-ending"><div className="lw-ending-scenery"/><article><small>HEIRS OF THE LANTERN · EPILOGUE</small><h2>{shared?'誰かの隣に灯る朝':'帰る場所を照らす灯'}</h2><p>{endingNarration(shared)}</p><p>王冠は砦の棚に置かれた。次の朝、{heroById(s.hero).name}は、名前を書いた旗を洗い、みんなの食器を並べた。</p><div className="lw-epilogue-cast"><BattleArt id={cast[page].id}/><div><h3>{cast[page].name}</h3><blockquote>{cast[page].motto}</blockquote><p>この旅で得た力：Lv.{levelFor(s,cast[page].id)}。離れる世界にも、帰る灯を残した。</p></div></div><nav><button disabled={page===0} onClick={()=>setPage(page-1)}>前の仲間</button><span>{page+1}/{cast.length}</span><button disabled={page===cast.length-1} onClick={()=>setPage(page+1)}>次の仲間</button></nav><p>本編18章 完結 · 支援会話 {s.supports.length}/36 · 遊撃戦 {s.sideCleared.length}/6</p><button className="lw-primary" onClick={()=>{onFinish?.('WIN');update(s=>{s.phase='field';s.battle=null;});}}>クリア後の世界へ</button></article></div></TranslatedUiTree>;
}
function levelFor(s:Campaign,id:string){return 1+Math.floor((s.xp[id]||0)/100);}
