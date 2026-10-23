import React,{useMemo,useState} from 'react';
import { definition,type GameId } from './catalog';
import { GENRES,GENRE_LABELS,searchGames } from './discovery';

export function GameChooser({english,l,onChoose}:{english:boolean;l:(jp:string,en:string)=>string;onChoose:(id:GameId)=>void}){
  const [query,setQuery]=useState(''),[genre,setGenre]=useState('');
  const playable=useMemo(()=>searchGames(query,genre,'available'),[query,genre]);
  const counts=useMemo(()=>new Map(GENRES.map(g=>[g,searchGames('',g,'available').length])),[]);
  return <>
    <div className="cc-search-tools">
      <label>{l('名前・ジャンルで検索','Search names or genres')}<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={l('例：神経衰弱、ポーカー、トリック','e.g. Memory, poker, trick')}/></label>
      <label>{l('ゲームのジャンル','Game genre')}<select value={genre} onChange={e=>setGenre(e.target.value)}><option value="">{l('すべてのジャンル','All genres')}</option>{GENRES.filter(g=>(counts.get(g)||0)>0).map(g=><option key={g} value={g}>{english?GENRE_LABELS[g]:l(g,GENRE_LABELS[g])} · {counts.get(g)} {l('種が遊べます','available')}</option>)}</select></label>
      {(query||genre)&&<button onClick={()=>{setQuery('');setGenre('');}}>{l('絞り込みを解除','Clear filters')}</button>}
    </div>
    <p role="status" className="cc-search-count">{l('遊べるゲーム','Available games')}: {playable.length}</p>
    <div className="cc-games">{playable.map(g=>{const d=definition(g.id as GameId);return <button key={g.id} onClick={()=>onChoose(d.id)}><small>{english?GENRE_LABELS[g.category]:l(g.category,GENRE_LABELS[g.category])} · {d.players.join(' / ')} {l('人','players')}</small><h2>{english?g.english:l(g.name,g.english)}</h2><p>{l(d.rule,d.englishRule)}</p><span>CPU / ONLINE →</span></button>;})}</div>
    {!playable.length&&<p className="cc-empty-search">{l('一致するゲームがありません。検索語やジャンルを変更してください。','No matching games. Try another name or genre.')}</p>}
  </>;
}
