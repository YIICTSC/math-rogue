import React from 'react';
import type {LanguageMode} from '../../types';
import {validRoomAddress} from '../../services/onlineTransport';
import './inviteJoin.css';
export default function InviteJoin({title,name,onName,onJoin,onClose,busy,error,languageMode,code,onCode}:{title:string;name:string;onName:(name:string)=>void;onJoin:()=>void;onClose:()=>void;busy:boolean;error:string;languageMode:LanguageMode;code?:string;onCode?:(code:string)=>void}){
 const L=(ja:string,en:string,hi:string)=>languageMode==='ENGLISH'?en:languageMode==='HIRAGANA'?hi:ja;
 const canJoin=!busy&&!!name.trim()&&(!onCode||validRoomAddress(code??''));
 return <main className="online-invite-entry" data-invite-entry><form onSubmit={e=>{e.preventDefault();if(canJoin)onJoin();}}>
  <small>INVITATION</small><h1>{title}</h1><h2>{L('招待に参加する','Join invitation','しょうたいにさんかする')}</h2>
  <label>{L('参加名','Player name','さんかなまえ')}<input autoFocus autoComplete="nickname" maxLength={16} value={name} disabled={busy} onChange={e=>onName(e.target.value)} /></label>
  {onCode&&<label>{L('招待コード','Invitation code','しょうたいコード')}<input autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={8} value={code??''} disabled={busy} placeholder={L('6桁のコード','6-digit code','6けたのコード')} onChange={e=>onCode(e.target.value.toUpperCase())}/></label>}
  <button className="online-invite-submit" type="submit" disabled={!canJoin}>{busy?L('接続中…','Connecting…','せつぞくちゅう…'):L('参加する','Join','さんかする')}</button>
  {busy&&<p role="status">{L('サーバー起動時は最大3分お待ちください。','Server startup can take up to 3 minutes.','さーばーきどうじはさいだい3ぷんおまちください。')}</p>}
  {error&&<p role="alert">{error}</p>}
  <button className="online-invite-close" type="button" onClick={onClose}>{onCode?L('タイトルへ戻る','Back to title','タイトルへもどる'):L('学習ローグへ戻る','Back to Learning Rogue','がくしゅうろーぐへもどる')}</button>
 </form></main>;
}
