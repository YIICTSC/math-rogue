import React,{useState} from 'react';
import type {SchoolAdventure} from '../useSchoolAdventure';
import {TECHNIQUES,WEAPONS,WEAPON_KINDS,equippedWeaponKind,weaponLevel,weaponThreshold,techniqueRank,canSpark,type WeaponKind} from './mastery';
import {assetUrl} from '../../../utils/assetPaths';
import './mastery.css';
export function WeaponKindIcon({kind,size=40}:{kind:WeaponKind;size?:number}){const i=WEAPON_KINDS.indexOf(kind);return <span aria-hidden="true" className="d1-weapon-icon" style={{width:size,height:size,backgroundImage:`url(${assetUrl('sprites/dungeons1/martial/weapons.webp')})`,backgroundSize:'400% 300%',backgroundPosition:`${i%4/3*100}% ${Math.floor(i/4)/2*100}%`}}/>;}
export function MasteryPanel({adventure:a,weapon}:{adventure:SchoolAdventure;weapon:any}){
 const equipped=equippedWeaponKind(weapon),[kind,setKind]=useState<WeaponKind>(equipped),p=a.martialProgress,l=a.text,level=weaponLevel(p,kind),xp=p.weaponXp[kind]||0;
 return <div className="d1-mastery">
  <h3>{l('武器熟練度とひらめき','Weapon mastery & breakthroughs')}</h3>
  <p>{l('敵への攻撃で武器が成長。技を選ぶと次の攻撃から使用します。技を10回使い、武器を鍛えると次の技をひらめくチャンス！','Attacking foes builds mastery. Select a technique to use it on your next attacks. Use it 10 times and train its weapon to gain a chance to discover the next technique.')}</p>
  <p>{l('熟練度・習得技は主人公ごとに保存され、帰還や敗北後も残ります。空振り・店員への攻撃は練習になりません。','Mastery and techniques belong to each hero and survive return or defeat. Empty swings and attacks on shopkeepers do not count.')}</p>
  <div className="d1-weapon-tabs" role="group" aria-label={l('武器種','Weapon types')}>{WEAPON_KINDS.map(k=><button key={k} aria-pressed={kind===k} onClick={()=>setKind(k)}><WeaponKindIcon kind={k} size={30}/><span>{l(WEAPONS[k].ja,WEAPONS[k].en)}<small>Lv{weaponLevel(p,k)}{k===equipped?' ✓':''}</small></span></button>)}</div>
  <div className="d1-mastery-heading"><WeaponKindIcon kind={kind} size={56}/><div><strong>{l(WEAPONS[kind].ja,WEAPONS[kind].en)} Lv{level}/10</strong><p>{level===10?l('極めた武器','Weapon mastered'):`${xp-weaponThreshold(level)} / ${weaponThreshold(level+1)-weaponThreshold(level)} ${l('次の熟練度まで','toward next level')}`}</p></div></div>
  <progress aria-label={l('武器熟練度','Weapon mastery')} value={level===10?1:xp-weaponThreshold(level)} max={level===10?1:weaponThreshold(level+1)-weaponThreshold(level)}/>
  {kind!==equipped&&<p className="d1-mastery-hint">{l('この武器種を装備すると選択した技を使えます。素手は武器を外して使います。','Equip this weapon type to use its selected technique. Unequip your weapon to use unarmed techniques.')}</p>}
  <button className="d1-normal-attack" aria-pressed={!p.selected[kind]} onClick={()=>a.selectMartialTechnique(kind,'')}>{l('通常攻撃に戻す','Use normal attacks')}</button>
  <div className="d1-techniques">{TECHNIQUES.filter(t=>t.kind===kind).map(t=>{
   const learned=p.learned.includes(t.id),rank=techniqueRank(p,t.id),ready=canSpark(p,t),selected=p.selected[kind]===t.id;
   const minimum=[0,1,3,5,7,8][t.tier];
   return <article key={t.id} className={`${learned?'learned':'locked'} ${selected?'selected':''}`}>
    <header><strong>{learned?'✦ ':'◇ '}{l(t.ja,t.en)}</strong><span>{t.tier===5?l('奥義','Secret art'):`${l('段階','Tier')} ${t.tier}`}</span></header>
    <p>×{t.power} · {l(t.pattern==='burst'?'周囲8方向':t.pattern==='sweep'?'前方なぎ払い':t.pattern==='pierce'?'2体貫通・防御半減':'単体攻撃',t.pattern==='burst'?'All adjacent foes':t.pattern==='sweep'?'Frontal sweep':t.pattern==='pierce'?'Pierce 2 foes, halve defense':'Single target')}</p>
    {learned?<><p>{l('技熟練','Technique rank')} {rank}/5 · {p.techniqueUses[t.id]||0} {l('回使用','uses')}</p><progress aria-label={l(t.ja,t.en)} value={Math.min(25,p.techniqueUses[t.id]||0)} max={25}/><button aria-pressed={selected} onClick={()=>a.selectMartialTechnique(kind,t.id)}>{selected?l('使用中','Selected'):l('この技を使う','Select technique')}</button></>:<><p>{l('必要条件：武器','Requires: weapon')} Lv{minimum}{t.tier>1&&!t.requires?` + ${l('前段階の技熟練2（10回使用）','previous technique rank 2 (10 uses)')}`:''}</p>{t.requires&&<p>{l('さらに各系統Lv8・最上位通常技の熟練3（15回使用）：','Also train each type to Lv8 and its tier-4 technique to rank 3 (15 uses): ')}{t.requires.map(k=>l(WEAPONS[k].ja,WEAPONS[k].en)).join(' / ')}</p>}<span className="d1-spark-status">{ready?l('ひらめき候補：この武器で攻撃しよう','Ready to discover: attack with this weapon'):l('鍛錬して条件を満たそう','Train to meet the requirements')}</span></>}
   </article>;
  })}</div>
 </div>;
}
export function MartialNotice({adventure:a}:{adventure:SchoolAdventure}){return a.series===1&&a.martialNotice?<div key={a.martialNotice.id} className="d1-spark-notice" role="status">✧ {a.text(a.martialNotice.ja,a.martialNotice.en)}</div>:null;}
