import React from 'react';
import type {Match} from './engine';
import type {LanguageMode} from '../../types';
import {local,type Copy} from './copy';
import {modeCard} from './modes';
const hints:Record<string,Copy>={
 'soccer-move':['方向入力＋ダッシュで金の円へ。','Move and hold Dash to reach the gold ring.','ほうこうにゅうりょく＋ダッシュで、きんのまるへ。'],
 'soccer-shot':['A／Zをためて離す。方向入力で狙う。','Hold A/Z, then release. Aim with directions.','A・Zをためてはなそう。ほうこうでねらおう。'],
 'soccer-pass':['味方へ方向を向け、パス／C。','Aim toward your teammate and press Pass/C.','みかたへむけて、パス・C。'],
 'soccer-lob':['ロングパス／Fで味方へつなぐ。','Use Long pass/F to reach your teammate.','ロングパス・Fでみかたへつなごう。'],
 'soccer-dribble':['相手が近づいたら切り返し／X。','Press Dribble move/X near the defender.','あいてがちかづいたら、きりかえし・X。'],
 'soccer-tackle':['正面からタックル／Xで奪う。','Use Tackle/X from the front to win the ball.','しょうめんからタックル・Xでうばおう。'],
 'soccer-special':['必殺技／Vでシュートしよう。','Use Signature/V to shoot.','ひっさつわざ・Vでシュート。'],
 'soccer-switch':['選手交代／Qで別の味方へ。','Press Switch/Q to control another teammate.','せんしゅこうたい・Qで、べつのみかたへ。'],
 'volley-serve':['A／Zでトス、もう一度でサーブ。','A/Z to toss, then A/Z again to serve.','A・Zでトス、もういちどでサーブ。'],
 'volley-receive':['落下点へ動き、A／Zでつなぐ。','Move under the ball and press A/Z to receive.','らっかちてんへうごき、A・Zでつなごう。'],
 'volley-set':['頭上の球をA／Zでトス。','Press A/Z as the ball reaches above your head.','あたまのうえのたまを、A・Zでトス。'],
 'volley-spike':['ジャンプ／R → A／Zでスパイク。','Jump/R, then A/Z to spike.','ジャンプ・R → A・Zでスパイク。'],
 'volley-block':['球がネットへ来たらブロック／X。','Press Block/X as the ball reaches the net.','たまがネットへきたら、ブロック・X。'],
 'volley-dive':['飛び込み／X → A／Zでレシーブ。','Dive/X, then A/Z to receive.','とびこみ・X → A・Zでレシーブ。'],
 'volley-special':['必殺球／V → A／Zを2回でサーブ。','Signature/V, then A/Z twice to serve.','ひっさつきゅう・V → A・Zを2かいでサーブ。'],
 'volley-move':['金の円へ移動し、ジャンプ／R。','Reach the gold ring, then Jump/R.','きんのまるへいどうして、ジャンプ・R。']
};
export default function PracticeHud({match,languageMode,onRetry}:{match:Match;languageMode:LanguageMode;onRetry:()=>void}){
 const p=match.practice;if(!p)return null;const L=local(languageMode),mode=modeCard(match.sport,match.config);
 return <section className="ac-practice-hud" data-practice={p.id} data-result={p.result||''}><header><span>PRACTICE</span><b>{p.attempt} / {p.limit}</b><strong>{p.successes} {L('成功','cleared','せいこう')}</strong></header><h2>{L(...mode.name)}</h2><p>{L(...hints[p.id])}</p><div className="ac-practice-time"><i style={{width:`${Math.max(0,1-p.time/12)*100}%`}}/></div><footer><span role="status">{p.result==='success'?L('成功！','SUCCESS!','せいこう！'):p.result==='miss'?L('もう一度、次の球へ！','Try again on the next ball!','つぎのたまでチャレンジ！'):match.phase==='ready'?L('準備…','GET READY','じゅんび…'):L('チャレンジ中','YOUR TURN','チャレンジちゅう')}</span><button disabled={!!p.result} onClick={onRetry}>{L('この練習をやり直す','Retry this attempt','このれんしゅうをやりなおす')}</button></footer></section>;
}
