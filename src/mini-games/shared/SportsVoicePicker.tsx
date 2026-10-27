import React,{useEffect} from 'react';
import type {LanguageMode} from '../../types';
import type {KartAvatar} from '../gakuro-kart/avatar';
import {GENERIC_SPORTS_VOICES} from './sportsVoices';
import {audioService} from '../../services/audioService';
import {trans} from '../../utils/textUtils';
export default function SportsVoicePicker({avatar,onChange,languageMode}:{avatar:KartAvatar;onChange:(v:KartAvatar)=>void;languageMode:LanguageMode}){
 const t=(s:string)=>trans(s,languageMode),index=languageMode==='ENGLISH'?1:languageMode==='HIRAGANA'?2:0;
 useEffect(()=>()=>audioService.stopSportsVoices(),[]);
 if(avatar.protagonist)return <p>{t('主人公専用のスポーツボイスを使用します。')}</p>;
 return <fieldset className="sports-voice-picker"><legend>{t('スポーツボイス')}</legend><label>{t('声のタイプ')}<select aria-label={t('声のタイプ')} value={avatar.sportsVoice??GENERIC_SPORTS_VOICES[0].id} onChange={e=>{audioService.stopSportsVoices();onChange({...avatar,sportsVoice:e.target.value});}}>{GENERIC_SPORTS_VOICES.map(v=><option key={v.id} value={v.id}>{v.label[index]}</option>)}</select></label><button type="button" onClick={()=>{audioService.stopSportsVoices();void audioService.playSportsVoiceFile(`${avatar.sportsVoice??GENERIC_SPORTS_VOICES[0].id}/preview`);}}>{t('ボイスを試聴')}</button><small>{t('4種目共通の8種類から選べます。')}</small></fieldset>;
}
