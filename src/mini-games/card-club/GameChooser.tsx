import React,{useMemo,useState} from 'react';
import { definition,isPlayable,type GameId } from './catalog';
import { GENRES,GENRE_LABELS,searchGames } from './discovery';

export function GameChooser({english,l,onChoose}:{english:boolean;l:(jp:string,en:string)=>string;onChoose:(id:GameId)=>void}){
  const [query,setQuery]=useState(''),[genre,setGenre]=useState('');
  const results=useMemo(()=>searchGames(query,genre),[query,genre]);
  const playable=results.filter(g=>isPlayable(g.id));
  const counts=useMemo(()=>new Map(GENRES.map(g=>[g,searchGames('',g,'available').length])),[]);
  return <>
    <div className="cc-search-tools">
      <label>{l('名前・ジャンルで検索','Search names or genres')}<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={l('例：神経衰弱、ポーカー、トリック','e.g. Memory, poker, trick')}/></label>
      <label>{l('ゲームのジャンル','Game genre')}<select value={genre} onChange={e=>setGenre(e.target.value)}><option value="">{l('すべてのジャンル','All genres')}</option>{GENRES.map(g=><option key={g} value={g}>{english?GENRE_LABELS[g]:l(g,GENRE_LABELS[g])} · {counts.get(g)} {l('種が遊べます','available')}</option>)}</select></label>
      {(query||genre)&&<button onClick={()=>{setQuery('');setGenre('');}}>{l('絞り込みを解除','Clear filters')}</button>}
    </div>
    <p role="status" className="cc-search-count">{l('遊べるゲーム','Available games')}: {playable.length} · {l('掲載ルール','Reference entries')}: {results.length}</p>
    <div className="cc-games">{playable.map(g=>{const d=definition(g.id as GameId);return <button key={g.id} onClick={()=>onChoose(d.id)}><small>{english?GENRE_LABELS[g.category]:l(g.category,GENRE_LABELS[g.category])} · {d.players.join(' / ')} {l('人','players')}</small><h2>{english?g.english:g.name}</h2><p>{l(d.rule,d.englishRule)}</p><span>CPU / ONLINE →</span></button>;})}</div>
    {!playable.length&&<p className="cc-empty-search">{results.length?l('この条件に一致するゲームは、まだ実装されていません。下の一覧で参考ルールを確認できます。','Matching reference games are not implemented yet. Their rules are listed below.'):l('一致するゲームがありません。検索語やジャンルを変更してください。','No matching games. Try another name or genre.')}</p>}
    <details className="cc-reference" open={!playable.length||undefined}><summary>{l('検索したゲームの対応状況','Coverage for these results')} ({playable.length}/{results.length})</summary><p>{l('未対応のゲームは遊べません。各ルールを確認して順次追加します。','Unimplemented games are not playable. Each ruleset is added separately.')}</p><div>{results.map(g=><a key={g.id} href={g.source} target="_blank" rel="noreferrer">{english?g.english:g.name} · {isPlayable(g.id)?l('対応済み','Available'):l('未対応','Not yet supported')}</a>)}</div></details>
  </>;
}
