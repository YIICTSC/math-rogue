import React,{useMemo,useState} from 'react';
import {definition,type GameId} from './catalog';
import {GENRES,GENRE_LABELS,searchGames} from './discovery';

export function GameChooser({english,l,onChoose,people,selected}:{
  english:boolean;l:(jp:string,en:string)=>string;onChoose:(id:GameId,seats?:number)=>void;people?:number;selected?:GameId;
}){
  const [query,setQuery]=useState(''),[genre,setGenre]=useState('');
  const [seatCount,setSeatCount]=useState<number>();
  const [sort,setSort]=useState('default');
  const available=useMemo(()=>searchGames('','','available').map(g=>({
    ...g,
    seats:definition(g.id as GameId).players.filter(n=>n>=(people??0)),
  })).filter(g=>g.seats.length>0),[people]);
  const options=useMemo(()=>[...new Set(available.flatMap(g=>g.seats))].sort((a,b)=>a-b),[available]);
  const counts=useMemo(()=>new Map(GENRES.map(g=>[g,available.filter(game=>game.category===g).length])),[available]);
  const activeSeats=seatCount!==undefined&&options.includes(seatCount)?seatCount:undefined;
  const activeGenre=counts.get(genre)?genre:'';
  const playable=useMemo(()=>{
    const byId=new Map(available.map(g=>[g.id,g]));
    const matches=searchGames(query,activeGenre,'available')
      .map(g=>byId.get(g.id))
      .filter(g=>g!==undefined)
      .filter(g=>activeSeats===undefined||g.seats.includes(activeSeats));
    if(sort==='fewest')return matches.sort((a,b)=>Math.min(...a.seats)-Math.min(...b.seats));
    if(sort==='most')return matches.sort((a,b)=>Math.max(...b.seats)-Math.max(...a.seats));
    return matches;
  },[available,query,activeGenre,activeSeats,sort]);

  return <>
    <div className="cc-search-tools">
      <label>{l('名前・ジャンルで検索','Search names or genres')}<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={l('例：神経衰弱、ポーカー、トリック','e.g. Memory, poker, trick')}/></label>
      <label>{l('ゲームのジャンル','Game genre')}<select value={activeGenre} onChange={e=>setGenre(e.target.value)}><option value="">{l('すべてのジャンル','All genres')}</option>{GENRES.filter(g=>(counts.get(g)||0)>0).map(g=><option key={g} value={g}>{english?GENRE_LABELS[g]:l(g,GENRE_LABELS[g])} · {counts.get(g)} {l('種が遊べます','available')}</option>)}</select></label>
      <label>{l('対応人数','Player count')}<select value={activeSeats??''} onChange={e=>setSeatCount(e.target.value?Number(e.target.value):undefined)}>
        <option value="">{l('すべての人数','Any number')}</option>
        {options.map(n=><option key={n} value={n}>{n}{l('人',n===1?' player':' players')}</option>)}
      </select></label>
      <label>{l('並べ替え','Sort by')}<select value={sort} onChange={e=>setSort(e.target.value)}>
        <option value="default">{l('既定順','Default order')}</option>
        <option value="fewest">{l('最少人数が少ない順','Fewest required')}</option>
        <option value="most">{l('最大人数が多い順','Most supported')}</option>
      </select></label>
    </div>
    <div className="cc-search-summary">
      <p role="status" className="cc-search-count">{l('遊べるゲーム','Available games')}: {playable.length}</p>
      {(query||activeGenre||activeSeats!==undefined)&&<button onClick={()=>{setQuery('');setGenre('');setSeatCount(undefined);}}>{l('絞り込みを解除','Clear filters')}</button>}
    </div>
    <div className="cc-games">{playable.map(g=>{
      const d=definition(g.id as GameId);
      return <button key={g.id} data-game-id={d.id} aria-pressed={selected===undefined?undefined:selected===d.id} onClick={()=>onChoose(d.id,activeSeats)}>
        <small>{english?GENRE_LABELS[g.category]:l(g.category,GENRE_LABELS[g.category])} · {g.seats.join(' / ')} {l('人','players')}</small>
        <h2>{english?g.english:l(g.name,g.english)}</h2><p>{l(d.rule,d.englishRule)}</p>
      </button>;
    })}</div>
    {!playable.length&&<p className="cc-empty-search">{l('一致するゲームがありません。検索語・ジャンル・人数を変更してください。','No matching games. Try another name, genre or player count.')}</p>}
  </>;
}
