import React,{useState,type ComponentType} from 'react';
import type {KochoHeroId} from './guests';
import {kochoSupers} from './superMoves';
import {KOCHO_FUSION_PRICE,makeKochoFusion,fusionName,fusionDescription,type FusionCard} from './fusion';
interface Props<C extends FusionCard<C>> {
 hand:C[];hero:KochoHeroId;money:number;used:boolean;language:string;tr:(text:string)=>string;
 CardArt:ComponentType<{card:C;className?:string}>;onClose:()=>void;onConfirm:(ids:string[])=>void;
}
export default function FusionWorkshop<C extends FusionCard<C>>({hand,hero,money,used,language,tr,CardArt,onClose,onConfirm}:Props<C>){
 const [ids,setIds]=useState<string[]>([]),cards=ids.map(id=>hand.find(c=>c.id===id)).filter((c):c is C=>!!c);
 const result=makeKochoFusion(hero,cards,'fusion-preview'),canFuse=Boolean(result&&!used&&money>=KOCHO_FUSION_PRICE);
 return <div className="kocho-fusion-overlay" data-gamepad-modal data-gamepad-initial-scope="kocho-fusion" role="dialog" aria-modal="true" aria-label={tr('カード合成')}>
  <section className="kocho-fusion-workshop"><header><div><h2>{tr('カード合成')}</h2><small>{money} G · {tr(used?'このショップでは合成済み':'各ショップで1回だけ')}</small></div><button data-gamepad-back onClick={onClose}>{tr('閉じる')} ×</button></header>
  <p>{tr('2〜3枚を選んだ順に合成。最大4アクション。CDは素材の最大値。')}</p>
  <div className="kocho-fusion-columns"><div className="kocho-fusion-ingredients">{hand.map((c,i)=><button key={c.id} data-fusion-ingredient={c.id} data-gamepad-zone="kocho-fusion-ingredients" data-gamepad-order={i} disabled={used||c.currentCooldown>0||Boolean(c.fusionSuper)||(!ids.includes(c.id)&&ids.length>=3)} aria-pressed={ids.includes(c.id)} onClick={()=>setIds(v=>v.includes(c.id)?v.filter(id=>id!==c.id):[...v,c.id])}>
   <CardArt card={c} className="kocho-fusion-ingredient-art"/><b>{fusionName(c,language,tr)}</b><small>CD {c.cooldown}</small>{ids.includes(c.id)&&<span className="kocho-fusion-order">{ids.indexOf(c.id)+1}</span>}
  </button>)}</div>
  <aside className="kocho-fusion-result" data-fusion-preview><h3>{tr('選んだ順に発動')}</h3><ol>{cards.map(c=><li key={c.id}>{fusionName(c,language,tr)}</li>)}</ol>
   {result?<><CardArt card={result} className="kocho-fusion-preview-art"/><strong>{fusionName(result,language,tr)}</strong>{result.fusionSuper&&<b className="kocho-fusion-super-tag">{tr('1枚で超必殺技！')}</b>}<p>{fusionDescription(result,language,tr)}</p><small>CD {result.cooldown}</small></>:<p>{tr('素材を2〜3枚選ぼう')}</p>}
   <button data-fusion-confirm data-gamepad-initial-choice disabled={!canFuse} onClick={()=>onConfirm(ids)}>{tr('この順で合成する')} · {KOCHO_FUSION_PRICE} G</button>
   {money<KOCHO_FUSION_PRICE&&<small>{tr('お金が足りません')}</small>}
  </aside></div>
  <details className="kocho-fusion-recipes"><summary>{tr('超必殺技の合成順')}</summary><p>{tr('3枚を正しい順で選ぶと、専用イラストの超必殺技カードが完成！')}</p>{kochoSupers(hero).map(m=><p key={m.id}><b>{language==='ENGLISH'?m.englishName:language==='HIRAGANA'?m.hiraganaName:m.name}</b><span>{m.steps.map(choices=>choices.map(tr).join(' / ')).join(' → ')}</span></p>)}</details>
 </section>
 </div>;
}
