import React from 'react';
import { WEAPONS, ITEMS } from './engine';
import type { OnlineWorld, Participant, VrInput } from './onlineEngine';
import { storm } from './royale';
import { multiTouchAction } from '../../utils/multiTouchAction';

export function RoyaleHud({world:w,player:p,en}:{world:OnlineWorld;player:Participant;en:boolean}) {
  const t=(ja:string,eng:string)=>en?eng:ja,s=storm(w),k=p.battle;
  const alive=Object.values(w.players).filter(q=>q.connected&&!q.spectator&&!q.out).length;
  const hit=w.time-k.hitAt<.65;
  const angle=k.hitFrom?Math.atan2(k.hitFrom.x-p.run.player.x,k.hitFrom.z-p.run.player.z)-p.run.player.angle:0;
  const loot=k.pickup&&w.time-k.pickup.at<2?k.pickup:null;
  const names:Record<string,string>={weapon:loot?(en?WEAPONS[loot.slot]?.en:WEAPONS[loot.slot]?.ja):'',item:loot?(en?ITEMS[loot.slot]?.en:ITEMS[loot.slot]?.ja):'',ammo:t('弾薬','Ammo'),repair:t('回復','Health'),shield:t('シールド','Shield'),materials:t('カバー資材','Cover materials'),energy:t('エネルギー','Energy')};
  return <>
    <div className={'gear-royale-status'+(p.zoneExposure>0?' is-danger':'')}><b>{t('残り','ALIVE')} {alive}</b><span>◷ {Math.ceil(Math.max(0,w.limit-w.time))}s</span><span>◎ {k.eliminations}</span><small>{s.final?t('最終エリア','FINAL ZONE'):t(s.shrinking?'エリア縮小中':'エリア縮小まで',s.shrinking?'ZONE CLOSING':'ZONE CLOSES IN')} · {s.seconds}s</small>{p.out&&<strong>{t('復活練習中・勝敗は確定','PRACTICE RESPAWN — RESULT LOCKED')}</strong>}{p.zoneExposure>0&&<strong>{t('エリア外！円の内側へ','OUTSIDE ZONE — MOVE IN')}</strong>}</div>
    <div className="gear-royale-vitals">
      <div><span>♥ {t('体力','Health')}</span><meter min={0} max={3} value={3-(p.out?p.respawnHits:p.hits)} aria-label={t('体力','Health')}/><b>{3-(p.out?p.respawnHits:p.hits)}/3</b></div>
      <div className="is-shield"><span>◈ {t('シールド','Shield')}</span><meter min={0} max={2} value={k.shield} aria-label={t('シールド','Shield')}/><b>{k.shield}/2</b></div>
      <div className="is-stamina"><span>↗ {t('走力','Sprint')}</span><meter min={0} max={100} value={k.stamina} aria-label={t('走力','Sprint')}/><b>{Math.floor(k.stamina)}</b></div>
      <small>⚡ {p.energy} · {p.invulnerable>0?t('保護中','PROTECTED'):p.run.stealth>0?t('透明中','CLOAKED'):t('問題で補給できます','Learn to resupply')}</small>
    </div>
    <div className="gear-royale-feed" aria-live="polite">{w.royale?.feed.map(f=><p key={f.id}>{w.players[f.actor]?.name} <span>◎</span> {w.players[f.target]?.name}</p>)}</div>
    {loot&&<div className="gear-royale-pickup" role="status">＋ {names[loot.kind]}</div>}
    {hit&&<div className="gear-royale-damage" aria-hidden="true" style={{transform:`translate(-50%,-50%) rotate(${-angle*180/Math.PI}deg)`}}>⌃</div>}
  </>;
}

export function RoyaleLoadout({player:p,en,disabled,onInput}:{player:Participant;en:boolean;disabled:boolean;onInput:(v:Partial<VrInput>)=>void}) {
  const t=(ja:string,eng:string)=>en?eng:ja;
  return <div className="gear-royale-loadout" aria-label={t('装備スロット','Equipment slots')}>
    <div className="gear-royale-weapon-name"><b>{en?WEAPONS[p.run.weapon].en:WEAPONS[p.run.weapon].ja}</b><strong>{p.reloading>0?t('装填中','RELOADING'):WEAPONS[p.run.weapon].melee?'∞':p.run.ammo}</strong></div>
    <div className="gear-royale-slots">{WEAPONS.map((weapon,i)=><button key={i} aria-label={en?weapon.en:weapon.ja} title={en?weapon.en:weapon.ja} disabled={disabled||!p.weapons[i]} aria-pressed={p.run.weapon===i} {...multiTouchAction(()=>onInput({weapon:i}))}><span aria-hidden="true">{weapon.icon}</span><small>{i+1}</small>{p.weapons[i]&&<b>{weapon.melee?'∞':i===p.run.weapon?p.run.ammo:p.battle.ammo[i]}</b>}</button>)}</div>
    <label><span>{t('アイテム','Item')}</span><select aria-label={t('アイテムスロット','Item slot')} value={p.run.item} disabled={disabled} onChange={e=>onInput({item:Number(e.target.value)})}>{ITEMS.map((item,i)=><option key={i} value={i}>{item.icon} {en?item.en:item.ja} ×{p.run.items[i]}</option>)}</select></label>
  </div>;
}
