import React from 'react';
import type {LanguageMode} from '../../types';
import './inviteJoin.css';
export default function InviteJoin({title,name,onName,onJoin,onClose,busy,error,languageMode}:{title:string;name:string;onName:(name:string)=>void;onJoin:()=>void;onClose:()=>void;busy:boolean;error:string;languageMode:LanguageMode}){
 const L=(ja:string,en:string,hi:string)=>languageMode==='ENGLISH'?en:languageMode==='HIRAGANA'?hi:ja;
 return <main className="online-invite-entry" data-invite-entry><form onSubmit={e=>{e.preventDefault();if(!busy&&name.trim())onJoin();}}>
  <small>INVITATION</small><h1>{title}</h1><h2>{L('招待に参加する','Join invitation','しょうたいにさんかする')}</h2>
  <label>{L('参加名','Player name','さんかなまえ')}<input autoFocus autoComplete="nickname" maxLength={16} value={name} disabled={busy} onChange={e=>onName(e.target.value)} /></label>
  <button className="online-invite-submit" type="submit" disabled={busy||!name.trim()}>{busy?L('接続中…','Connecting…','せつぞくちゅう…'):L('参加する','Join','さんかする')}</button>
  {busy&&<p role="status">{L('サーバー起動時は最大3分お待ちください。','Server startup can take up to 3 minutes.','さーばーきどうじはさいだい3ぷんおまちください。')}</p>}
  {error&&<p role="alert">{error}</p>}
  <button className="online-invite-close" type="button" onClick={onClose}>{L('学習ローグへ戻る','Back to Learning Rogue','がくしゅうろーぐへもどる')}</button>
 </form></main>;
}
