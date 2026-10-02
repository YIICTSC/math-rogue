import React, { useMemo, useState } from 'react';
import CharacterSelectionScreen from '../components/CharacterSelectionScreen';
import { getEnemyHeroes, enemyHeroDeck } from './enemyHeroes';
import { trans } from '../utils/textUtils';
import './rpg.css';
export default function HeroSelection(props:React.ComponentProps<typeof CharacterSelectionScreen>) {
 const [enemies,setEnemies]=useState(false),[query,setQuery]=useState(''),[selected,setSelected]=useState('');
 const heroes=useMemo(()=>getEnemyHeroes(props.visualTheme||'elementary'),[props.visualTheme]);
 const current=heroes.find(h=>h.id===selected)||heroes[0];
 const t=(s:string)=>trans(s,props.languageMode);
 return <div className="rpg-hero-selection"><nav><button aria-pressed={!enemies} onClick={()=>setEnemies(false)}>{t('いつもの主人公')}</button><button aria-pressed={enemies} onClick={()=>setEnemies(true)}>{t('敵キャラクターで冒険')} ({heroes.length})</button></nav>
 <div className="rpg-hero-content">{!enemies?<CharacterSelectionScreen {...props}/>:<div className="rpg-hero-browser"><section><h1>{t('敵キャラクターを主人公に')}</h1><input aria-label={t('名前で検索')} placeholder={t('名前で検索')} value={query} onChange={e=>setQuery(e.target.value)}/><div className="rpg-hero-grid">{heroes.filter(h=>h.name.includes(query.trim())).map(h=><button aria-pressed={current.id===h.id} key={h.id} onClick={()=>setSelected(h.id)}><img loading="lazy" src={h.imageData} alt=""/><strong>{t(h.name)}</strong><small>{t(h.role)}</small></button>)}</div></section>
 <aside><img src={current.imageData} alt={current.name}/><h2>{t(current.name)}</h2><p>{t(current.description)}</p><p>HP {current.maxHp} · {current.gold} G</p><h3>{t(current.relic.name)}</h3><p>{t(current.relic.description)}</p><h3>{t('専用の初期デッキ')}</h3><ul>{enemyHeroDeck(current).map(c=><li key={c.id}>{t(c.name)} <small>{t(c.description)}</small></li>)}</ul><button className="rpg-hero-confirm" onClick={()=>props.onSelect(current,'STANDARD')}>{t('このキャラクターで冒険する')}</button></aside></div>}</div></div>;
}
