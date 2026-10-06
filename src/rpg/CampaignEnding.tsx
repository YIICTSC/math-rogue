import React from 'react';
import type {World,Action} from './engine';
import type {LanguageMode} from '../types';
import {assetUrl} from '../utils/assetPaths';
import {trans} from '../utils/textUtils';
import {audioService} from '../services/audioService';
import './campaignEnding.css';
export const ENDING_LINES=[
 ['魔王、消滅','最後の一撃が、無限を名乗る魔王の核を砕いた。三度姿を変えた闇は、今度こそ光の粒となって消えていく。'],
 ['学んだことは、力になる','この世界へ来た日は、何も分からなかった。一問ずつ考え、仲間と支え合い、六地域の試練を越えた。その積み重ねが世界を救った。'],
 ['六地域に、朝が来る','草原に花が咲き、森に歌が戻る。湿原の水は澄み、砂丘に旅人が帰り、高原に灯がともり、遺跡の時計が再び動き出す。'],
 ['おかえり、私たちの英雄','住人たちは、あなたの名前を呼んで迎えた。守ったのは王冠ではない。友達と食卓を囲み、明日を楽しみにできる、この暮らしだ。'],
 ['次は、幸せをつくる番','六地域の試験官は、世界の復興をあなたに託した。道をつなぎ、住まいと仕事を増やし、水・電気・教育・医療を届けよう。'],
 ['世界運営、解放','戦いの物語はここで結ぶ。そして暮らしの物語は続いていく。時間制限のない平和な世界で、住人の幸福を育てる街づくりを始めよう。'],
] as const;
export default function CampaignEnding({world,selfId,languageMode,send}:{world:World;selfId:string;languageMode:LanguageMode;send:(a:Action)=>void}){
 const step=Math.min(5,world.endingProgress?.[selfId]||0),line=ENDING_LINES[step];
 React.useEffect(()=>{const release=audioService.acquireBgmScene('victory',{theme:'magic-female',mode:'NEW'},45);return release;},[]);
 return <section className="rpg-campaign-ending" role="dialog" aria-modal="true" aria-label={trans('エンディング',languageMode)}>
  <img className="rpg-ending-art" src={assetUrl(`sprites/rpg/ending/${Math.floor(step/2)+1}.webp`)} alt=""/>
  <div className="rpg-ending-copy" key={step}><span>EPILOGUE · {step+1} / 6</span><h1>{trans(line[0],languageMode)}</h1><p>{trans(line[1],languageMode)}</p>
   <nav aria-label="EPILOGUE">{ENDING_LINES.map((_,i)=><span key={i} className={i<=step?'complete':''}/>)}</nav>
   <button onClick={()=>send({type:'ending-progress',step:step+1})}>{trans(step===5?'未来を引き受ける':'物語を進める',languageMode)}</button>
  </div>
 </section>;
}
