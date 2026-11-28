import React, {useContext,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {assetUrl} from '../../utils/assetPaths';
import {normalizeRoomInput} from '../../services/onlineTransport';
import {copyInviteUrl} from '../shared/copyInviteUrl';
import {GameChooser} from './GameChooser';
import {definition,type GameId} from './catalog';
import {CARD_CLUB_ROOM_CAPACITY,clubSeatsFor,recommendedClubGames} from './lobbyGames';
import {CARD_CLUB_HEROES,type ClubLobby} from './session';
import {LADDER_RULES,ladderOptions,type LadderOptions} from './ladderOptions';
import {cardClubInviteCode,cardClubInviteUrl,normalizeCardClubCode} from './invite';
import {LocalTablePortraits} from '../shared/localTableMatch';

type Copy = (jp:string,en:string)=>string;

export function Face({hero}:{hero:string}){
  const portrait=useContext(LocalTablePortraits)[hero];
  if(portrait)return <span className="cc-face cc-face-guest" aria-hidden="true">{portrait}</span>;
  return <span className="cc-face" aria-hidden="true" style={{backgroundImage:`url("${assetUrl(`sprites/after-school-poker/portraits/${hero}.webp`)}")`}}/>;
}

const heroName = (hero:{id:string;name:string}, l:Copy) =>
  l(hero.name,hero.id.replace(/^(high-school|magic)-/,'').replaceAll('-',' '));

export function ClubHeroes({hero,onHero,l,disabled=false}:{
  hero:string;onHero:(id:string)=>void;l:Copy;disabled?:boolean;
}){
  return <div className="cc-heroes" role="group" aria-label={l('キャラクター選択','Choose your character')}>
    {CARD_CLUB_HEROES.map(h=><button key={h.id} type="button" disabled={disabled} aria-pressed={hero===h.id} onClick={()=>onHero(h.id)}>
      <Face hero={h.id}/><small>{heroName(h,l)}</small>
    </button>)}
  </div>;
}

export function ClubOnlineEntry({mode,name,onName,hero,onHero,code,onCode,busy,l,onSubmit,parseInviteCode=cardClubInviteCode}:{
  mode:'host'|'join';name:string;onName:(value:string)=>void;hero:string;onHero:(id:string)=>void;
  code:string;onCode:(value:string)=>void;busy:boolean;l:Copy;onSubmit:()=>void;parseInviteCode?:(href:string)=>string;
}){
  const [chooseHero,setChooseHero]=useState(false);
  const host=mode==='host';
  const canSubmit=!busy&&!!name.trim()&&(host||!!normalizeCardClubCode(code));
  const selected=CARD_CLUB_HEROES.find(h=>h.id===hero)!;
  return <form className="cc-panel cc-connection cc-online-entry" onSubmit={event=>{event.preventDefault();if(canSubmit)onSubmit();}}>
    <h1>{host?l('オンラインの部屋を作る','Create online room'):l('招待に参加する','Join invitation')}</h1>
    <p>{host?l('部屋を作ったら、招待URLか6桁のコードを友達に送れます。','Create a room, then share a link or six-digit code with friends.'):l('参加名と招待コードを確認して、部屋に入ります。','Check your name and invitation code, then join the room.')}</p>
    <label>{l('参加名','Player name')}<input autoComplete="nickname" maxLength={32} value={name} disabled={busy} onChange={e=>onName(e.target.value)} /></label>
    {!host&&<label>{l('招待コード','Invitation code')}<input inputMode="numeric" autoComplete="off" maxLength={6} placeholder="000000" value={code} disabled={busy}
      onChange={e=>onCode(normalizeRoomInput(e.target.value).replace(/[^0-9]/g,'').slice(0,6))}
      onPaste={e=>{const pastedCode=parseInviteCode(e.clipboardData.getData('text'));if(pastedCode){e.preventDefault();onCode(pastedCode);}}}/></label>}
    <div className="cc-profile-preview">
      <Face hero={hero}/><strong>{heroName(selected,l)}</strong>
      <button type="button" disabled={busy} aria-expanded={chooseHero} onClick={()=>setChooseHero(v=>!v)}>{l('キャラクター変更','Change character')}</button>
    </div>
    {chooseHero&&<ClubHeroes hero={hero} onHero={id=>{onHero(id);setChooseHero(false);}} l={l} disabled={busy}/>}
    <button type="submit" className="cc-primary cc-entry-submit" disabled={!canSubmit}>
      {busy?l('接続中…','Connecting…'):host?l('部屋を作る','Create room'):l('参加する','Join room')}
    </button>
  </form>;
}

function ClubInvite({code,l}:{code:string;l:Copy}){
  const [status,setStatus]=useState<'idle'|'copied'|'failed'>('idle');
  const url=cardClubInviteUrl(location.href,code,Capacitor.isNativePlatform());
  return <section className="cc-invite">
    <div><span>{l('招待コード','Invitation code')}</span><output className="cc-code">{code}</output></div>
    <div className="cc-invite-link">
      <input aria-label={l('招待リンク','Invitation link')} value={url} readOnly onFocus={e=>e.currentTarget.select()}/>
      <button type="button" onClick={async()=>setStatus(await copyInviteUrl(url)?'copied':'failed')}>
        {status==='copied'?l('コピーしました','Copied'):l('招待URLをコピー','Copy invite link')}
      </button>
    </div>
    {status==='failed'&&<p role="status">{l('招待リンクを選択してコピーしてください。','Select the invitation link and copy it.')}</p>}
  </section>;
}

export function ClubLobbyPanel({packet,host,english,l,title,onConfigure,onStart}:{
  packet:ClubLobby;host:boolean;english:boolean;l:Copy;title:(id:string)=>string;
  onConfigure:(game:GameId,count:number,options?:Partial<LadderOptions>)=>void;onStart:()=>void;
}){
  const [showCatalog,setShowCatalog]=useState(false);
  const people=packet.members.length,cpu=packet.count-people,online=!!packet.code;
  const choose=(id:GameId,preferredSeats?:number)=>{
    const seats=preferredSeats??clubSeatsFor(id,people);
    if(seats===undefined)return;
    onConfigure(id,seats);
    setShowCatalog(false);
  };
  const game=definition(packet.game);
  return <section className="cc-panel cc-lobby">
    <div className="cc-lobby-heading">
      <h1>{online?l('オンラインルーム','Online room'):l('CPU戦の準備','CPU match setup')}</h1>
      <span aria-live="polite">{online?`${people} / ${CARD_CLUB_ROOM_CAPACITY} ${l('人が参加中','joined')}`:l('ひとりで遊ぶ','Solo play')}</span>
    </div>
    <div className="cc-lobby-roster">
      {online&&<ClubInvite key={packet.code} code={packet.code} l={l}/>}
      <ul className="cc-seat-list" aria-label={l('参加者','Participants')}>
        {packet.members.map(p=><li key={p.id}><Face hero={p.hero}/><div><strong>{p.name}</strong><small>{p.id===packet.hostId?l('ホスト','Host'):l('参加済み','Joined')}{p.id===packet.selfId?` · ${l('あなた','You')}`:''}</small></div></li>)}
      </ul>
    </div>
    <div className="cc-lobby-selection">
      <section className="cc-lobby-game">
        <div><h2>{title(game.id)}</h2><p>{l(game.rule,game.englishRule)}</p></div>
        {host&&<label>{l('対戦の席数','Match seats')}<select value={packet.count} onChange={e=>onConfigure(game.id,Number(e.target.value))}>
          {game.players.filter(n=>n>=people).map(n=><option key={n}>{n}</option>)}
        </select></label>}
      </section>
      <p className="cc-seat-summary">{people} {l('人が参加',people===1?'human player':'human players')}{cpu>0&&` ＋ CPU ${cpu}`}</p>
      {host&&<section className="cc-lobby-choices">
        <div className="cc-lobby-heading"><h2>{l('いまの人数におすすめ','Recommended for this group')}</h2>
          <button type="button" aria-expanded={showCatalog} onClick={()=>setShowCatalog(v=>!v)}>{showCatalog?l('一覧を閉じる','Close game list'):l('ゲームを探す','Browse games')}</button>
        </div>
        <div className="cc-recommendations">{recommendedClubGames(people).map(id=><button type="button" key={id} aria-pressed={id===game.id} onClick={()=>choose(id)}>
          <strong>{title(id)}</strong>
          <small>{clubSeatsFor(id,people)} {l('人卓','seats')}</small>
        </button>)}</div>
        {showCatalog&&<GameChooser english={english} l={l} people={people} selected={game.id} onChoose={choose}/>}
      </section>}
      {game.id==='daihinmin'&&<details className="cc-ladder-details" open={!online||undefined}>
        <summary>{l('大富豪のルール設定','President table rules')}</summary>
        <fieldset className="cc-local-rules">
          <legend>{l('全国のローカルルール','Local rule variants')}</legend>
          <p>{l('地域や仲間によって呼び名・運用が異なります。ここに書かれた効果で遊びます。4枚の革命と階段は基本ルールです。','Names and customs vary by group. These descriptions define this table; four-card revolution and runs remain standard.')}</p>
          <label>{l('ラウンド数','Rounds')}<select disabled={!host} value={packet.ladderOptions?.rounds??5} onChange={e=>onConfigure(game.id,packet.count,{...packet.ladderOptions,rounds:Number(e.target.value)})}>
            {[1,3,5,10,20].map(n=><option key={n}>{n}</option>)}
          </select></label>
          {LADDER_RULES.map(([key,ja,en,desc,english])=><label key={key}><input type="checkbox" disabled={!host} checked={!!packet.ladderOptions?.[key]} onChange={e=>onConfigure(game.id,packet.count,{...ladderOptions(packet.ladderOptions),[key]:e.target.checked})}/><span><b>{l(ja,en)}</b><small>{l(desc,english)}</small></span></label>)}
        </fieldset>
      </details>}
    </div>
    <div className="cc-start-row">
      {host?<button type="button" className="cc-primary" onClick={onStart}>{l('このメンバーで開始','Start this table')}</button>:
        <p role="status">{l('ホストがゲームを始めるのを待っています。','Waiting for the host to start.')}</p>}
    </div>
  </section>;
}
