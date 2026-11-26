import React, { useState } from 'react';
import { MAPS, type MapId } from './maps';
import { MODES, PRESETS, ROLES, SPECIAL_ROLES, sanitizeSettings, type Mode, type Settings } from './rules';

export type Copy=(ja:string,en:string)=>string;
type NumberKey='capacity'|'traitors'|'bots'|'seconds'|'speed'|'crewSight'|'shadeSight'|'stunDelay'|'sabotageDelay'|'meetings'|'talk'|'vote'|'tasks';
export const MODE_NAMES:Record<Mode,[string,string]>={
  standard:['通常対戦','Standard'],large:['大人数対戦','Large group'],classroom:['授業モード','Classroom'],tag:['鬼ごっこ','Chase'],
};
const numbers:[NumberKey,string,string,number,number,number?][]=[
  ['capacity','定員','Capacity',6,40],['traitors','裏切り者の人数（0で自動）','Infiltrators (0 = automatic)',0,8],
  ['bots','CPUで補う人数','CPU seats',0,39],['seconds','探索時間（秒）','Exploration time (seconds)',60,1200,30],
  ['speed','移動速度','Movement speed',3.5,7,.1],['crewSight','クルーの視界','Crew vision',4,13,.1],
  ['shadeSight','裏切り者の視界','Infiltrator vision',5,16,.1],['stunDelay','シャボンの再使用（秒）','Bubble cooldown (seconds)',6,70],
  ['sabotageDelay','妨害の再使用（秒）','Sabotage cooldown (seconds)',15,150],['meetings','会議ボタンの使用回数','Meeting calls per player',0,3],
  ['talk','議論時間（秒）','Discussion time (seconds)',8,90],['vote','投票時間（秒）','Voting time (seconds)',8,75],
  ['tasks','ひとり分の任務数','Tasks per player',1,6],
];
type Toggle='reveal'|'ghosts'|'sfx'|'late'|'split'|'observer'|'rotate';
const toggles:[Toggle,string,string][]=[
  ['reveal','追放された人の役職を公開','Reveal the ejected role'],['ghosts','ゴーストの学習任務を共同進捗に入れる','Ghosts can keep helping with shared tasks'],
  ['late','途中参加を受け付ける','Allow mid-match joining'],['rotate','前回の裏切り者を避ける','Rotate the infiltrators'],
  ['split','15人以下の複数班に自動分割','Split into groups of up to 15'],['observer','教員は進行・観戦のみ','Teacher manages and observes'],
  ['sfx','対戦の効果音','Match sound effects'],
];

export function MissionSettings({value,onSave,t,local=false}:{value:Settings;onSave:(v:Settings)=>void;t:Copy;local?:boolean}){
  const [draft,setDraft]=useState(value);
  const change=<K extends keyof Settings>(key:K,content:Settings[K])=>setDraft(prev=>({...prev,[key]:content}));
  const save=()=>onSave(sanitizeSettings(draft));
  const preset=(name: keyof typeof PRESETS)=>{const p=PRESETS[name];setDraft(local?{...p,mode:name==='tag'?'tag':'standard',capacity:15,bots:Math.max(5,p.bots),observer:false,split:false}:p);};
  return <section className="sm-settings" aria-label={t('対戦設定','Match settings')}>
    <div className="sm-presets">{(local?['practice','tag']:['beginner','standard','classroom','large','tag'] as const).map(name=>
      <button type="button" key={name} onClick={()=>preset(name as keyof typeof PRESETS)}>{name==='beginner'?t('初心者向け','Beginner'):name==='practice'?t('CPU練習','CPU practice'):t(...MODE_NAMES[name as Mode])}</button>)}</div>
    <div className="sm-form-grid">
      {!local&&<label>{t('モード','Mode')}<select value={draft.mode} onChange={e=>preset(e.target.value as Mode)}>{MODES.map(mode=><option key={mode} value={mode}>{t(...MODE_NAMES[mode])}</option>)}</select></label>}
      <label>{t('マップ','Map')}<select value={draft.map} onChange={e=>change('map',e.target.value as MapId)}>{Object.entries(MAPS).map(([key,map])=><option key={key} value={key}>{t(map.ja,map.en)}</option>)}</select></label>
      <label>{t('難易度','Difficulty')}<select value={draft.difficulty} onChange={e=>change('difficulty',e.target.value as Settings['difficulty'])}><option value="easy">{t('やさしい','Easy')}</option><option value="normal">{t('ふつう','Normal')}</option><option value="hard">{t('むずかしい','Hard')}</option></select></label>
      <label>{t('回答形式','Question format')}<select value={draft.style} onChange={e=>change('style',e.target.value as Settings['style'])}><option value="choice">{t('選択式','Multiple choice')}</option><option value="mixed">{t('選択式・入力式','Choice and typed answers')}</option></select></label>
      {draft.mode!=='tag'&&<><label>{t('会議中のチャット','Meeting chat')}<select value={draft.chat} onChange={e=>change('chat',e.target.value as Settings['chat'])}><option value="quick">{t('定型文のみ','Quick messages')}</option><option value="text">{t('定型文と自由入力','Quick and typed messages')}</option><option value="off">{t('使用しない','Disabled')}</option></select></label>
      <label>{t('投票の公開','Ballot visibility')}<select value={draft.votes} onChange={e=>change('votes',e.target.value as Settings['votes'])}><option value="secret">{t('票数のみ','Totals only')}</option><option value="open">{t('誰が誰に投票したか表示','Show each ballot')}</option></select></label>
      <label>{t('同数の場合','Tied vote')}<select value={draft.tie} onChange={e=>change('tie',e.target.value as Settings['tie'])}><option value="none">{t('追放なし','No ejection')}</option><option value="random">{t('同数の候補から抽選','Random among tied players')}</option></select></label></>}
      {numbers.filter(([k])=>(draft.mode!=='tag'||!['sabotageDelay','meetings','talk','vote'].includes(k))).map(([k,ja,en,min,max,step])=>
        <label key={k}>{t(ja,en)}<input type="number" value={draft[k]} min={k==='capacity'&&draft.mode==='large'?16:min} max={k==='capacity'&&!['large','classroom'].includes(draft.mode)?15:max} step={step??1} onChange={e=>change(k,Number(e.target.value))}/></label>)}
    </div>
    <div className="sm-toggles">{toggles.filter(([key])=>(key!=='split'||['large','classroom'].includes(draft.mode))&&(key!=='observer'||draft.mode==='classroom')&&(draft.mode!=='tag'||key!=='reveal')).map(([key,ja,en])=>
      <label key={key}><input type="checkbox" checked={draft[key]} onChange={e=>change(key,e.target.checked)}/>{t(ja,en)}</label>)}</div>
    {draft.mode!=='tag'&&<details><summary>{t('特殊役職と出現率','Special roles and chances')}</summary><div className="sm-form-grid">
      {SPECIAL_ROLES.map(role=>{
        const names=ROLES[role];return <label key={role} title={t(names[3],names[4])}>{t(names[0],names[1])} %<input type="number" min={0} max={100} value={draft.roles[role]??0}
          onChange={e=>change('roles',{...draft.roles,[role]:Number(e.target.value)})}/></label>;
      })}
    </div></details>}
    <button className="sm-primary" onClick={save}>{t('設定を適用','Apply settings')}</button>
  </section>;
}
