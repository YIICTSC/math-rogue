import React,{useEffect,useRef,useState} from 'react';
import type {ClubView} from './model';
import {audioService} from '../../services/audioService';
const labels:Record<string,[string,string]>={sweep:['スイープ','Sweep'],scoreAce:['Aの獲得','Aces'],scoreBig:['ビッグカシノ ♦10','Big casino ♦10'],scoreLittle:['リトルカシノ ♠2','Little casino ♠2'],scoreDiamonds:['ダイヤ最多','Most diamonds'],scorePrime:['プリミエラ','Primiera'],scoreSeven:['ダイヤの7','Seven of diamonds'],scoreCards:['獲得枚数最多','Most cards'],scoreSpades:['スペード最多','Most spades'],marriage:['マリッジ','Marriage'],book:['ブック完成','Book'],gin:['ジン','Gin'],goingOut:['上がり','Going out'],points:['得点','Points']};
export function ScoreFeedback({view,l}:{view:ClubView|null;l:(ja:string,en:string)=>string}){
 const prev=useRef<ClubView|null>(null),serial=useRef(0),lastVoice=useRef(0);const [items,setItems]=useState<{id:number;text:string}[]>([]);
 useEffect(()=>{const old=prev.current;prev.current=view?JSON.parse(JSON.stringify(view)):null;if(!view||!old||old.game!==view.game||old.seed!==view.seed||view.revision<old.revision||old.round!==view.round){setItems([]);return;}if(old.revision===view.revision)return;
 let overlap=Math.min(old.log.length,view.log.length);while(overlap>0&&JSON.stringify(old.log.slice(-overlap))!==JSON.stringify(view.log.slice(0,overlap)))overlap--;
 const fresh=view.log.slice(overlap);
 const gains=view.players.flatMap((p,i)=>{const value=p.score-(old.players[i]?.score??p.score);if(value<=0)return [];const reasons=[...new Set(fresh.filter(e=>e.player===i&&labels[e.key]).map(e=>l(...labels[e.key])+(e.value?` +${e.value}`:'')))];if(reasons.length===1)reasons[0]=reasons[0].replace(/ \+\d+$/,'');return [{id:++serial.current,text:`${p.name} · ${reasons.join(' / ')||l('得点','Points')}　+${value}`}];});
 if(!gains.length)return;setItems(v=>[...v,...gains].slice(-8));
 if(view.players[view.self].score>old.players[view.self].score&&view.phase!=='result'&&Date.now()-lastVoice.current>4000){lastVoice.current=Date.now();void audioService.playCardClubVoice(view.players[view.self].hero,'win');}
 },[view]);
 useEffect(()=>{if(!items.length)return;const t=setTimeout(()=>setItems(v=>v.slice(1)),3200);return()=>clearTimeout(t);},[items]);
 return <div className="cc-score-feedback" role="status" aria-live="polite">{items.slice(0,3).map(i=><div key={i.id} data-score-reward>✦ {i.text}</div>)}</div>;
}
