import React,{lazy,Suspense,useState} from 'react';
import {Flag,ArrowUpRight} from 'lucide-react';
import {assetUrl} from '../../utils/assetPaths';
import {trans} from '../../utils/textUtils';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import type {AssignmentAnswerResult,LanguageMode} from '../../types';
import './sports.css';
const Golf=lazy(()=>import('../gakuro-golf/GakuroGolf')),Tennis=lazy(()=>import('../tennis/Tennis'));
function RacketIcon(){return <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true"><ellipse cx="22" cy="13" rx="9" ry="12" transform="rotate(35 22 13)" stroke="currentColor" strokeWidth="2"/><path d="m16 22-9 11m4-14 10-15m-4 20 10-15M12 10l17 12M15 6l17 12" stroke="currentColor" strokeWidth="1.4"/></svg>;}
export default function SportsHub({onClose,languageMode='JAPANESE',golfInviteCode='',tennisInviteCode='',onAnswerResult}:{onClose:()=>void;languageMode?:LanguageMode;golfInviteCode?:string;tennisInviteCode?:string;onAnswerResult?:(result:AssignmentAnswerResult)=>void}){
 const[sport,setSport]=useState<'home'|'golf'|'tennis'>(tennisInviteCode?'tennis':golfInviteCode?'golf':'home'),[inviteActive,setInviteActive]=useState(true),t=(s:string)=>trans(s,languageMode);
 const back=()=>{setInviteActive(false);setSport('home');};
 if(sport==='golf')return <Suspense fallback={<div className="sports-loading" role="status">GAKURO GOLF…</div>}><Golf backLabel="スポーツへ戻る" onClose={back} languageMode={languageMode} inviteCode={inviteActive?golfInviteCode:''}/></Suspense>;
 if(sport==='tennis')return <Suspense fallback={<div className="sports-loading" role="status">GAKURO TENNIS…</div>}><Tennis onAnswerResult={onAnswerResult} onClose={back} languageMode={languageMode} inviteCode={inviteActive?tennisInviteCode:''}/></Suspense>;
 return <TranslatedUiTree mode={languageMode}><main className="sports-hub" data-gamepad-navigation-root aria-label={t('スポーツクラブ')}><img className="sports-art" src={assetUrl('sprites/sports/club.webp')} alt=""/><div className="sports-shade"/><header><button onClick={onClose}>← {t('学習ローグへ')}</button><span>GAKURO · ATHLETICS</span></header><div className="sports-copy"><small>THE ACADEMY SPORTS CLUB</small><h1>{t('スポーツ')}<span>PLAY. LEARN.<br/>TOGETHER.</span></h1><p>{t('コートでも、グリーンでも。')}</p></div><nav className="sports-choices" aria-label={t('種目を選ぶ')}><button onClick={()=>setSport('tennis')} className="sports-tennis"><div><RacketIcon/><small>01 · TENNIS</small><ArrowUpRight size={23}/></div><h2>{t('テニス')}</h2><p>{t('ラリーをつなぎ、勝利の一球へ。')}</p><span>{t('シングルス・ダブルス・オンライン大会')}</span></button><button onClick={()=>setSport('golf')} className="sports-golf"><div><Flag size={32}/><small>02 · GOLF</small><ArrowUpRight size={23}/></div><h2>{t('ゴルフ')}</h2><p>{t('18ホールの冒険。ひとりでも、仲間とも。')}</p><span>18 HOLES · ONLINE / SOLO</span></button></nav></main></TranslatedUiTree>;
}
