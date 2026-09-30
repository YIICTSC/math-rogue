import React,{useState} from 'react';
import type {Command,Material,Player,World} from './engine';
import {FURNITURE,HOME_COINS,HOME_COSTS,HOME_NAMES,HOME_SIZES,questRows,STAGES,village} from './progression';
type Props={world:World;me:Player;t:(s:string)=>string;send:(c:Command)=>void;items:Record<Material,[string,string]>};
export function GoalsPanel({world,me,t,send,items}:Props){const v=village(world);return <>
 <div className="gc-village-summary"><b>🌿 {t(v.stage.name)}</b><span>{v.score} / {v.next?.need??v.score} {t('発展ポイント')}</span><progress max={v.next?.need||Math.max(1,v.score)} value={v.score}/><p>{t('納品で3、収穫で2、新しい建築マスで2ポイント。')}</p></div>
 <div className="gc-stages">{STAGES.map((s,i)=><div key={s.name} className={v.level>=i?'unlocked':''}><b>{v.level>=i?'✓':'🔒'} {t(s.name)}</b><small>{t(s.facility)} · {s.need}</small></div>)}</div>
 <h3>{t('住民の依頼')}</h3><p>{t('常設依頼は3件まで受注できます。日替わり依頼は島の1日ごとに更新。')} {t('島の1日は4分です。')}</p>
 <div className="gc-quests">{questRows(world,me).map(q=>{const locked=v.level<q.stage;return <article key={q.id} className={q.claimed?'complete':''}><div className="gc-quest-resident">{q.resident==='ソラ'?'🛠':q.resident==='ミドリ'?'🌱':'🎣'} {t(q.resident)}{q.daily&&<small>{t('日替わり')}</small>}</div><h4>{t(q.title)}</h4><p>{t(q.description)}</p><progress max={q.target} value={Math.min(q.value,q.target)}/><small>{Math.min(q.value,q.target)} / {q.target} · 🪙{q.coins} {Object.entries(q.reward).map(([k,n])=>`${items[k as Material][0]}×${n}`).join(' ')}</small><button disabled={q.claimed||locked||(q.accepted&&q.value<q.target)||(!q.accepted&&me.progress.active.length>=3)} onClick={()=>send({type:q.accepted?'quest_claim':'quest_accept',id:q.id})}>{t(q.claimed?'達成済み':locked?'島の発展で解放':q.accepted?q.value>=q.target?'報告して報酬を受け取る':'挑戦中':'依頼を受ける')}</button></article>;})}</div>
 </>;}
export function HomePanel({world,me,t,send,items,selected,onChooseLand,onStudy}:Props&{selected:number;onChooseLand:()=>void;onStudy:()=>void}){
 const home=me.progress.home,v=village(world),[slot,setSlot]=useState(-1),[furniture,setFurniture]=useState<(typeof FURNITURE)[number]>('bench'),size=HOME_SIZES[home.level];
 const cost=HOME_COSTS[home.level],coins=HOME_COINS[home.level],blocked=!!cost&&(me.coins<coins||Object.entries(cost).some(([k,n])=>me.bag[k as Material]<n!));
 return <><h3>🏡 {t(HOME_NAMES[home.level])}</h3>{!home.level?<><p>{t('広場から離れた空いた草地に、自分の家の入口を建てましょう。')}</p><p>🪵6 · 🪨4 · {t('建築費はコイン不要')}</p><div className="gc-row"><button onClick={onChooseLand}>{t('空き地を選ぶ')}</button><button disabled={selected<0||me.bag.wood<6||me.bag.stone<4||world.paused} onClick={()=>send({type:'home_claim',tile:selected})}>{t('選んだ場所に家を建てる')}</button></div></>:<>
 <p>{t('家の入口')} · {home.tile%40}, {Math.floor(home.tile/40)} · {size}×{size}</p>
 {!me.indoors?<><p>{t('入口の近くまで移動して、自分の家に入りましょう。')}</p><button className="gc-primary" onClick={()=>send({type:'home_enter'})}>{t('家に入る')}</button></>:<>
 <p>{t('マスを選び、持ち物の家具を飾れます。')}</p><div className="gc-home-grid" style={{gridTemplateColumns:`repeat(${size},minmax(0,1fr))`}}>{Array.from({length:size*size},(_,i)=>{const f=home.furniture.find(f=>f.slot===i);return <button key={i} aria-label={`${t('部屋のマス')} ${i+1}${f?' '+t(items[f.item][1]):''}`} aria-pressed={slot===i} onClick={()=>setSlot(i)}>{f?items[f.item][0]:'·'}</button>;})}</div>
 <div className="gc-furniture">{FURNITURE.map(b=><button key={b} aria-pressed={b===furniture} onClick={()=>setFurniture(b)}>{items[b][0]} {t(items[b][1])} ×{me.bag[b]}</button>)}</div><div className="gc-row"><button disabled={slot<0||!me.bag[furniture]||home.furniture.some(f=>f.slot===slot)||world.paused} onClick={()=>send({type:'home_place',slot,item:furniture})}>{t('家具を飾る')}</button><button disabled={!home.furniture.some(f=>f.slot===slot)||world.paused} onClick={()=>send({type:'home_remove',slot})}>{t('家具を戻す')}</button></div><button className="gc-primary" onClick={onStudy}>⚡ {t('問題で回復')}</button>
 {cost?<div className="gc-home-upgrade"><h3>{t('家を拡張')}</h3><p>{t(HOME_NAMES[home.level+1])} · {HOME_SIZES[home.level+1]}×{HOME_SIZES[home.level+1]}</p><p>🪙{coins} · {Object.entries(cost).map(([k,n])=>`${t(items[k as Material][1])} ×${n}`).join(' / ')}</p><button disabled={blocked||v.level<home.level||world.paused} onClick={()=>{setSlot(-1);send({type:'home_upgrade'});}}>{t(v.level<home.level?'島を発展させて拡張':'家を拡張する')}</button></div>:<p>{t('最大まで拡張しました。自由に家具を飾りましょう！')}</p>}
 <button onClick={()=>send({type:'home_leave'})}>{t('家を出る')}</button></>}
 </>}
 </>;
}
