import React,{useContext} from 'react';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import {LanternLanguage} from './language';
import {beginEndless,leaveEndless,makeEndlessBattle,ENDLESS_OBJECTIVES} from './endless';
import {ENDLESS_CAST} from './endlessRoster';
import {Portrait} from './art';
import type {Campaign} from './types';
import type {Update} from './Battlefield';
export function EndlessHub({s,update}:{s:Campaign;update:Update}){
 const p=s.endless!,m=makeEndlessBattle(s).endless!;
 return <TranslatedUiTree mode={useContext(LanternLanguage)}><section className="lw-endless-hub"><small>HEIRS OF THE LANTERN · INFINITE VOYAGE</small><h1>無窮航路</h1><p>王冠の物語の、その先へ。クリアした編成・経験・絆・装備を引き継いで、終わらない世界の灯をつなぐ。</p><div className="lw-endless-stats"><b>第{p.depth}航路</b><span>踏破 {p.wins}</span><span>最高到達 {p.best}</span></div><article><small>NEXT EXPEDITION</small><h2>{m.title}</h2><div className="lw-actions">{[0,1,2].map(route=><button key={route} aria-pressed={(p.route||0)===route} onClick={()=>update(s=>{s.endless!.route=route;})}>{['灯を追う航路','忘れられた航路','潮を渡る航路'][route]}</button>)}</div><strong>{ENDLESS_OBJECTIVES[m.objective]}</strong><p>気象：{({clear:'晴天',rain:'雨',fog:'濃霧',heat:'熱波',storm:'雷雨'})[m.weather]} · 報酬 {m.reward} G · 敵の強さは育成と航路に連動</p><p>城壁・砲台・狙撃手・灯台・地雷・架橋・秘宝・増援。遠隔兵器は遮蔽物を利用し、奪取すれば味方になります。</p><div className="lw-actions"><button className="lw-primary" onClick={()=>update(beginEndless)}>物語を読んで出撃</button><button onClick={()=>update(s=>{s.phase='camp';})}>編成・育成・補給</button><button onClick={()=>update(leaveEndless)}>本編の世界へ戻る</button></div></article><details><summary>航路の仲間と踏破記録</summary><div className="lw-endless-cast">{ENDLESS_CAST.map(h=><article key={h.id}><Portrait id={h.id} reaction={s.recruited.includes(h.id)?'joy':'resolve'}/><h3>{h.name}</h3><p>{h.role} · {s.recruited.includes(h.id)?'加入済み':'航路の勝利で加入'}</p><blockquote>{h.motto}</blockquote></article>)}</div>{p.history.map((line,i)=><p key={i}>{line}</p>)}</details></section></TranslatedUiTree>;
}
