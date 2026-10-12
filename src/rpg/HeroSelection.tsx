import React, { useMemo, useState } from 'react';
import CharacterSelectionScreen from '../components/CharacterSelectionScreen';
import { getSelectableEnemyHeroes, isEnemyHeroUnlocked, enemyHeroDeck } from './enemyHeroes';
import { trans } from '../utils/textUtils';
import './rpg.css';
export default function HeroSelection(props:React.ComponentProps<typeof CharacterSelectionScreen>) {
 const [enemies,setEnemies]=useState(false),[query,setQuery]=useState(''),[selected,setSelected]=useState('');
 const heroes=useMemo(()=>getSelectableEnemyHeroes(props.visualTheme||'elementary').filter(isEnemyHeroUnlocked),[props.visualTheme]);
 const current=heroes.find(h=>h.id===selected)||heroes[0];
 const t=(s:string)=>trans(s,props.languageMode);
 const copy=(ja:string,en:string,hi:string)=>props.languageMode==='ENGLISH'?en:props.languageMode==='HIRAGANA'?hi:ja;
 return <div className="rpg-hero-selection"><nav><button aria-pressed={!enemies} onClick={()=>setEnemies(false)}>{t('いつもの主人公')}</button><button aria-pressed={enemies} onClick={()=>setEnemies(true)}>{t('敵キャラクターで冒険')} ({heroes.length})</button></nav>
 <div className="rpg-hero-content">{!enemies?<CharacterSelectionScreen {...props}/>:<div className="rpg-hero-browser"><section><h1>{t('敵キャラクターを主人公に')}</h1><p>{copy('本編の図鑑に登録した敵が使えます。バカンス版はモード解禁と本編での遭遇が必要です。','Use enemies registered in the main game bestiary. Vacation variants require unlocking Vacation Mode and meeting that variant in the main game.','ほんぺんの ずかんに とうろくした てきが つかえます。ばかんすばんは モードかいきんと ほんぺんでの そうぐうが ひつようです。')}</p><input aria-label={t('名前で検索')} placeholder={t('名前で検索')} value={query} onChange={e=>setQuery(e.target.value)}/><div className="rpg-hero-grid">{heroes.filter(h=>h.name.includes(query.trim())).map(h=><button aria-pressed={current?.id===h.id} key={h.id} onClick={()=>setSelected(h.id)}><img loading="lazy" src={h.imageData} alt=""/><strong>{t(h.name)}{h.id.endsWith(':VACATION')&&` · ${copy('バカンス','Vacation','ばかんす')}`}</strong><small>{t(h.role)}</small></button>)}</div></section>
 {current?<aside><img src={current.imageData} alt={current.name}/><h2>{t(current.name)}{current.id.endsWith(':VACATION')&&` · ${copy('バカンス','Vacation','ばかんす')}`}</h2><p>{t(current.description)}</p><p>HP {current.maxHp} · {current.gold} G</p><h3>{t(current.relic.name)}</h3><p>{t(current.relic.description)}</p><h3>{t('専用の初期デッキ')}</h3><ul>{enemyHeroDeck(current).map(c=><li key={c.id}>{t(c.name)} <small>{t(c.description)}</small></li>)}</ul><button className="rpg-hero-confirm" onClick={()=>{if(isEnemyHeroUnlocked(current))props.onSelect(current,'STANDARD');}}>{t('このキャラクターで冒険する')}</button></aside>:<aside><p>{copy('本編で敵に出会うと解禁されます。','Meet enemies in the main game to unlock them.','ほんぺんで てきに であうと かいきんされます。')}</p></aside>}</div>}</div></div>;
}
