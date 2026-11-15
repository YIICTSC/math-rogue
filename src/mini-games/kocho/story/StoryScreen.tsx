import React,{useEffect,useRef,useState}from'react';
import type{LanguageMode}from'../../../types';
import {assetUrl}from'../../../utils/assetPaths';
import {audioService}from'../../../services/audioService';
import scenes from './scenes.json';
import './story.css';
export {default as kochoStoryReady}from'./ready.json';
export const kochoStoryScenes=scenes;
export default function KochoStoryScreen({sceneId,language,onDone}:{sceneId:string;language:LanguageMode;onDone:()=>void}){
 const scene=scenes.find(s=>s.id===sceneId)!,[index,setIndex]=useState(0),[auto,setAuto]=useState(true),[muted,setMuted]=useState(false),[retry,setRetry]=useState(0),[error,setError]=useState(false),token=useRef(0);
 useEffect(()=>{const visibility=()=>{if(document.hidden){token.current++;audioService.stopKochoVoices();}else setRetry(v=>v+1);};const volume=()=>setRetry(v=>v+1);document.addEventListener('visibilitychange',visibility);window.addEventListener('learning-rogue:sports-voice-muted',volume);return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('learning-rogue:sports-voice-muted',volume);};},[]);
 const en=language==='ENGLISH',hi=language==='HIRAGANA',l=(ja:string,english:string,kana=ja)=>en?english:hi?kana:ja;
 useEffect(()=>{const ticket=++token.current;setError(false);if(document.hidden)return;const line=scene.lines[index];let timer:ReturnType<typeof setTimeout>|undefined;
  if(muted||!audioService.canPlayConversationVoice()){if(auto)timer=setTimeout(()=>{if(token.current===ticket){if(index+1<scene.lines.length)setIndex(index+1);else onDone();}},Math.max(1800,Math.min(6000,line.text.length*95)));}
  else void audioService.playKochoStoryVoice(line.audio).then(ok=>{if(token.current!==ticket)return;if(!ok){setError(true);return;}if(auto){if(index+1<scene.lines.length)setIndex(index+1);else onDone();}}).catch(()=>{if(token.current===ticket)setError(true);});
  return()=>{token.current++;clearTimeout(timer);audioService.stopKochoVoices();};
 },[sceneId,index,auto,muted,retry]);
 const line=scene.lines[index],names:Record<string,string[]>= {narrator:['ナレーション','Narrator','ナレーション'],original:['赤ジャージの勇者','Tracksuit hero','あかジャージのゆうしゃ'],rebel:['叛逆の高校生','Rebel student','はんぎゃくのこうこうせい'],akari:['星宮あかり','Akari Hoshimiya','ほしみやあかり'],aster:['アステル｜継界戦記','Aster | Lantern War','アステル｜けいかいせんき'],lyra:['リュラ｜継界戦記','Lyra | Lantern War','リュラ｜けいかいせんき']};
 return <section className="kocho-story-screen" data-kocho-story data-gamepad-modal data-gamepad-initial-scope={sceneId} role="dialog" aria-modal="true" aria-label={en?scene.englishTitle:hi?scene.hiraganaTitle:scene.title}>
 <img className="kocho-story-art" src={assetUrl(scene.image)} alt=""/><header><span>{en?scene.englishTitle:hi?scene.hiraganaTitle:scene.title}</span><button data-gamepad-back onClick={onDone}>{l('スキップ','Skip')} »</button></header>
 <div className="kocho-story-dialogue"><div className="kocho-story-speaker">{names[line.speaker]?.[en?1:hi?2:0]} <small>{index+1}/{scene.lines.length}</small></div><p aria-live="polite">{en?line.english:hi?line.hiragana:line.text}</p>{error&&<button onClick={()=>setRetry(v=>v+1)}>{l('音声を再読み込み','Retry voice','おんせいを よみなおす')}</button>}<nav><button disabled={index===0} onClick={()=>setIndex(i=>Math.max(0,i-1))}>‹ {l('戻る','Back','もどる')}</button><button aria-pressed={muted} onClick={()=>setMuted(v=>!v)}>{muted?l('音声OFF','Voice OFF','おんせいOFF'):l('音声ON','Voice ON','おんせいON')}</button><button aria-pressed={auto} onClick={()=>setAuto(v=>!v)}>{auto?l('自動ON','Auto ON','じどうON'):l('自動OFF','Auto OFF','じどうOFF')}</button><button data-gamepad-initial-choice onClick={()=>{if(index+1<scene.lines.length)setIndex(index+1);else onDone();}}>{index+1===scene.lines.length?(scene.stage===8?l('結果へ','Results','けっかへ'):l('ゲームへ','Continue')):l('次へ','Next','つぎへ')} ›</button></nav></div>
 </section>;
}
