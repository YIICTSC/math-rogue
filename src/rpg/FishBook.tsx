import React,{useState} from 'react';
import {FISH,mergeFishRecords,readFishBook,type FishRecords} from './fishing';
import {BIOMES} from './biomes';
import FishSprite from './FishSprite';
import {trans} from '../utils/textUtils';
import type {LanguageMode} from '../types';
export default function FishBook({records={},languageMode}:{records?:FishRecords;languageMode:LanguageMode}){
 const [biome,setBiome]=useState('all'),[onlyCaught,setOnlyCaught]=useState(false),t=(s:string)=>trans(s,languageMode),book=mergeFishRecords(readFishBook(),records),found=FISH.filter(f=>book[f.id]).length;
 return <div className="rpg-fish-book"><header><div><small>{t('釣り図鑑')}</small><h3>{found} / 60</h3></div><progress value={found} max={60}/></header><p>{t('発見と最大サイズはこの端末に保存。釣果数はこの部屋の記録です。')}</p><div className="rpg-fish-filters"><select aria-label={t('生息地')} value={biome} onChange={e=>setBiome(e.target.value)}><option value="all">{t('すべての生息地')}</option>{BIOMES.map(b=><option key={b.id} value={b.id}>{t(b.name)}</option>)}</select><button aria-pressed={onlyCaught} onClick={()=>setOnlyCaught(!onlyCaught)}>{t(onlyCaught?'発見済みのみ':'すべての魚')}</button></div><div className="rpg-fish-catalog">{FISH.filter(f=>(biome==='all'||biome===f.biome)&&(!onlyCaught||book[f.id])).map(f=><article key={f.id} className={`rarity-${f.rarity}`}><FishSprite id={f.id} unknown={!book[f.id]}/><small>{t(BIOMES.find(b=>b.id===f.biome)!.name)}</small><h4>{book[f.id]?t(f.name):'???'}</h4><span>{t(({common:'ふつう',uncommon:'珍しい',rare:'希少',legendary:'伝説'} as const)[f.rarity])}</span><strong>{book[f.id]?`${t('最大')} ${book[f.id].best.toFixed(1)} cm`:`${f.min}–${f.max} cm`}</strong><small>{t('部屋の釣果')} {records[f.id]?.count||0} · {t('大成功')} {records[f.id]?.perfect||0}</small></article>)}</div>{onlyCaught&&!found&&<p>{t('まだ魚を釣っていません。水辺へ出かけよう！')}</p>}</div>;
}
