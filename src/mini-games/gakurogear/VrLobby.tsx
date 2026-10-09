import React from 'react';
import type {OnlineWorld} from './onlineEngine';

export default function VrLobby({world,code,host,en,error,onLeave,onConfigure,onStart}:{world:OnlineWorld;code:string;host:boolean;en:boolean;error:string;onLeave:()=>void;onConfigure:()=>void;onStart:()=>void}) {
 const t=(ja:string,eng:string)=>en?eng:ja;
 return <div className="gear-shell"><header className="gear-header"><button onClick={onLeave}>{t('退室','Leave')}</button><strong>GAKURO VR</strong></header><main className="gear-select gear-online-lobby"><section>
  <h1>{t('待機室','LOBBY')}</h1><button onClick={onConfigure}>{t('キャラクタークリエイト','Character creator')}</button>
  <p>{t('部屋コード','Room code')}: <strong>{code}</strong></p><button onClick={()=>void navigator.clipboard.writeText(code).catch(()=>{})}>{t('コードをコピー','Copy code')}</button>
  <p>{world.lesson.title}</p><p>{world.mode==='coop'?t('協力：全員の課題クリアを目指す。クリア前から仲間の回収・救助を支援できます。問題で弾薬を補給。','Co-op: complete everyone’s objectives. Help collect and revive allies before clearing. Answer questions for ammo.'):t('3回被弾で勝敗確定。その後は復活して脱落した仲間同士で遊べます。緑の安全エリア内で生き残ろう。','Three hits lock your result. Respawn and keep playing with eliminated players. Survive inside the green zone.')}</p>
  <div className="gear-lobby-roster" aria-label={t('参加者','Players')}>{Object.values(world.players).map(p=><p key={p.id}>{p.name}{p.wins>0&&` · ${t('勝利','WINS')} ${p.wins}`}</p>)}</div>
  {error&&<p role="alert">{error}</p>}
  {host?<button className="gear-primary" disabled={world.mode==='royale'&&Object.keys(world.players).length<2} onClick={onStart}>{t('ホストが開始','START')}</button>:<p>{t('ホストの開始を待っています','Waiting for host')}</p>}
 </section></main></div>;
}
