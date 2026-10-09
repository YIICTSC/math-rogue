import React from 'react';
import type {OnlineWorld} from './onlineEngine';
import type {KartAvatar} from '../gakuro-kart/avatar';
import OnlineEntryScreen from '../shared/OnlineEntryScreen';
import AvatarPreview from './AvatarPreview';
import {loadVrAvatar} from './character';
import {MISSIONS} from './engine';

export default function VrLobby({world,code,host,en,error,onLeave,onConfigure,onStart,avatar}:{world:OnlineWorld;code:string;host:boolean;en:boolean;error:string;onLeave:()=>void;onConfigure:()=>void;onStart:()=>void;avatar?:KartAvatar}) {
 const t=(ja:string,eng:string)=>en?eng:ja;
 return <OnlineEntryScreen className="gear-shell gear-preparing" brand="GAKURO VR" title={t('待機室','LOBBY')} languageMode={en?'ENGLISH':'JAPANESE'} onBack={onLeave} preview={<div className="gear-lobby-preview"><AvatarPreview avatar={avatar??loadVrAvatar()}/><div className="gear-lobby-roster" aria-label={t('参加者','Players')}>{Object.values(world.players).map(p=><p key={p.id}>{p.name}{p.wins>0&&` · ${t('勝利','WINS')} ${p.wins}`}</p>)}</div></div>} footer={host?<button aria-label={t('ホストが開始','START')} className="online-entry-primary" disabled={world.mode==='royale'&&Object.keys(world.players).length<2} onClick={onStart}>{t('ホストが開始','START')} →</button>:<p role="status">{t('ホストの開始を待っています','Waiting for host')}</p>}>
  <p>{Object.keys(world.players).length} / 8 · {en?MISSIONS[world.missionId-1].en:MISSIONS[world.missionId-1].name}</p>
  <label>{t('部屋コード','Room code')}<input readOnly value={code} onFocus={e=>e.target.select()}/></label><button onClick={()=>void navigator.clipboard.writeText(code).catch(()=>{})}>{t('コードをコピー','Copy code')}</button>
  <p>{world.lesson.title}</p>
  <details><summary>{t('モード','Mode')}: {world.mode==='coop'?t('協力','Co-op'):t('バトルロイヤル','Battle royale')}</summary><p>{world.mode==='coop'?t('協力：全員の課題クリアを目指す。自分の部屋をクリアすると隣室への扉が開き、仲間を支援できます。問題で弾薬を補給。','Co-op: complete everyone’s objectives. Clear your room to unlock adjacent doors and help allies. Answer questions for ammo.'):t('3回被弾で勝敗確定。その後は復活して脱落した仲間同士で遊べます。緑の安全エリア内で生き残ろう。','Three hits lock your result. Respawn and keep playing with eliminated players. Survive inside the green zone.')}</p></details>
  <button onClick={onConfigure}>{t('キャラクタークリエイト','Character creator')}</button>
  {error&&<p role="alert">{error}</p>}
 </OnlineEntryScreen>;
}
