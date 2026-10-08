import React from 'react';
import type {OnlineWorld} from './onlineEngine';

export default function VrLobby({world,code,host,en,error,onLeave,onConfigure,onStart}:{world:OnlineWorld;code:string;host:boolean;en:boolean;error:string;onLeave:()=>void;onConfigure:()=>void;onStart:()=>void}) {
 const t=(ja:string,eng:string)=>en?eng:ja;
 return <div className="gear-shell"><header className="gear-header"><button onClick={onLeave}>{t('退室','Leave')}</button><strong>GAKURO VR</strong></header><main className="gear-select gear-online-lobby"><section>
  <h1>{t('待機室','LOBBY')}</h1><button onClick={onConfigure}>{t('キャラクタークリエイト','Character creator')}</button>
  <p>{t('部屋コード','Room code')}: <strong>{code}</strong></p><button onClick={()=>void navigator.clipboard.writeText(code).catch(()=>{})}>{t('コードをコピー','Copy code')}</button>
  <p>{world.lesson.title}</p><p>{world.mode==='coop'?t('協力：全員の課題クリアを目指す。クリア後は他の人を支援。','Co-op: complete everyone’s objectives. Help others after clearing.'):t('3回でアウト。Fホールド・R射撃・T装填。エネルギー不足で3問。','Three hits eliminate. F hold · R shoot · T reload. Answer three questions to restore energy.')}</p>
  <div className="gear-lobby-roster" aria-label={t('参加者','Players')}>{Object.values(world.players).map(p=><p key={p.id}>{p.name}</p>)}</div>
  {error&&<p role="alert">{error}</p>}
  {host?<button className="gear-primary" disabled={world.mode==='royale'&&Object.keys(world.players).length<2} onClick={onStart}>{t('ホストが開始','START')}</button>:<p>{t('ホストの開始を待っています','Waiting for host')}</p>}
 </section></main></div>;
}
