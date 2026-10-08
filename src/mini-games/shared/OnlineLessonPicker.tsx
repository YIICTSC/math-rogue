import React,{useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import ModeSelectionScreen from '../../components/ModeSelectionScreen';
import AssignmentInboxModal from '../../components/AssignmentInboxModal';
import {storageService} from '../../services/storageService';
import {getAssignmentFromUrl,getAssignmentRepresentativeMode} from '../../utils/assignmentUtils';
import {trans} from '../../utils/textUtils';
import type {AssignmentPayload,LanguageMode} from '../../types';
import type {VisualThemeId} from '../../data/visualThemes';
import type {LessonSelection} from '../gakuro-kart/questions';
import './onlineLessonPicker.css';
export default function OnlineLessonPicker({activity,languageMode,busy,error,onSelect,onBack}:{activity:'kart'|'golf'|'vr';languageMode:LanguageMode;busy:boolean;error:string;onSelect:(selection:LessonSelection)=>void;onBack:()=>void}){
 const [inbox,setInbox]=useState(false),[counts,setCounts]=useState(()=>storageService.getModeCorrectCounts()),[assignment]=useState(()=>getAssignmentFromUrl()||storageService.getCurrentAssignment());
 const t=(s:string)=>trans(s,languageMode);
 const [theme]=useState<VisualThemeId>(()=>{try{const value=localStorage.getItem('learning-rogue-visual-theme');return ['elementary','high-school','magic'].includes(value||'')?value as VisualThemeId:'elementary';}catch{return 'elementary';}});
 useEffect(()=>{const update=()=>setCounts(storageService.getModeCorrectCounts());window.addEventListener('focus',update);window.addEventListener('storage',update);return()=>{window.removeEventListener('focus',update);window.removeEventListener('storage',update);};},[]);
 const selectAssignment=(a:AssignmentPayload)=>{setInbox(false);onSelect({mode:getAssignmentRepresentativeMode(a),assignment:{...a,answerMode:'CHOICE',units:a.units.map(u=>({...u,answerMode:'CHOICE'}))}});};
 const title=activity==='kart'?t('カートの問題選択'):activity==='golf'?t('ゴルフの問題選択'):languageMode==='ENGLISH'?'VR lesson selection':languageMode==='HIRAGANA'?'VRの もんだいせんたく':'VRの問題選択';
 return createPortal(<section className="online-lesson-picker" aria-label={title} data-online-lesson={activity}><header><button disabled={busy} onClick={onBack}>{t('戻る')}</button><b>{title}</b><button disabled={busy} onClick={()=>setInbox(true)}>{t('配信課題を選ぶ')}</button>{assignment&&<button disabled={busy} onClick={()=>selectAssignment(assignment)}>{t('受け取り済みの課題')}</button>}</header>{error&&<p role="alert">{t(error)}</p>}<div className="online-lesson-main" inert={busy||undefined}><ModeSelectionScreen languageMode={languageMode} visualTheme={theme} fixedAnswerMode="CHOICE" modeCorrectCounts={counts} modeMasteryMap={Object.fromEntries(Object.entries(counts).map(([mode,count])=>[mode,count>=100]))} onBack={onBack} onSelectMode={(mode,modes)=>onSelect({mode,modes})}/></div>{busy&&<div className="online-lesson-busy" role="status">{t('問題とコースを準備中…')}</div>}<AssignmentInboxModal open={inbox} onClose={()=>setInbox(false)} onSelect={selectAssignment} onProfileChange={()=>setCounts(storageService.getModeCorrectCounts())} languageMode={languageMode}/></section>,document.body);
}
