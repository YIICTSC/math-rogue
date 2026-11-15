import React from 'react';
import type {LanguageMode} from '../../types';
import {assetUrl}from'../../utils/assetPaths';
import {DASH_UPGRADES,upgradeText,upgradeDescription,upgradeLevel,type DashUpgrade,type UpgradeLevels}from'./upgrades';
import './upgrades.css';
export function DashUpgradeIcon({icon,className=''}:{icon:number;className?:string}){const index=icon%24;return <span aria-hidden="true" className={`dash-upgrade-art ${className}`} style={{backgroundImage:`url("${assetUrl(`sprites/go-home-dash/upgrades/upgrades-${icon<24?'a':'b'}.webp`)}")`,backgroundPosition:`${index%6/5*100}% ${Math.floor(index/6)/3*100}%`}}/>;}
export default function UpgradeScreen({options,levels,level,onChoose,language}:{options:DashUpgrade[];levels:UpgradeLevels;level:number;onChoose:(card:DashUpgrade)=>void;language:LanguageMode}){
 const l=(ja:string,en:string,hi:string)=>upgradeText([ja,en,hi],language),owned=DASH_UPGRADES.filter(u=>upgradeLevel(levels,u.id)>0),category={attack:l('攻撃','ATTACK','こうげき'),movement:l('身軽さ','MOVEMENT','みがるさ'),defense:l('守り','DEFENSE','まもり'),utility:l('サポート','SUPPORT','サポート'),antiAir:l('対空装備','ANTI-AIR','たいくうそうび')};
 return <div data-gamepad-modal data-gamepad-initial-scope={`go-home-upgrades-${level}`} className="dash-upgrade-screen" onPointerDown={e=>e.stopPropagation()}>
  <header className="dash-upgrade-heading"><span>AFTER SCHOOL / LV {level}</span><h2>GRADE UP!</h2><p>{l('ひとつ選んで、帰り道を切りひらこう。','Pick one upgrade for the road home.','ひとつえらんで、かえりみちをきりひらこう。')}</p></header>
  <div className="dash-upgrade-grid">{options.map((card,index)=>{const current=upgradeLevel(levels,card.id),next=card.id==='REFILL'?0:Math.min(card.maxLevel,current+1);return <button key={card.id} data-gamepad-initial-choice={index===0?true:undefined} data-gamepad-zone="go-home-upgrades" data-gamepad-order={index} className="dash-upgrade-card" data-category={card.category} data-upgrade-id={card.id} onClick={e=>{e.stopPropagation();onChoose(card);}}>
   <span className="dash-upgrade-category">{category[card.category]}<b>{!current?'NEW!':`LV ${current} → ${next}`}</b></span><DashUpgradeIcon icon={card.icon}/><h3>{upgradeText(card.name,language)}</h3><span className="dash-upgrade-level" aria-label={`Lv ${next}/${card.maxLevel}`}>{'★'.repeat(next)}<i>{'☆'.repeat(Math.max(0,card.maxLevel-next))}</i></span><p>{upgradeDescription(card,next,language)}</p><span className="dash-upgrade-pick">{l('選ぶ','SELECT','えらぶ')} →</span>
  </button>;})}</div>
  <footer className="dash-upgrade-build"><span>{l('今回の装備','CURRENT BUILD','こんかいのそうび')} · {owned.length}/{DASH_UPGRADES.length}</span><div>{owned.slice(-10).map(card=><span key={card.id} title={`${upgradeText(card.name,language)} Lv ${upgradeLevel(levels,card.id)}`}><DashUpgradeIcon icon={card.icon}/><b>{upgradeLevel(levels,card.id)}</b></span>)}{owned.length>10&&<small>+{owned.length-10}</small>}</div></footer>
 </div>;
}
