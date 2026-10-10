import React,{useState} from 'react';
import type {World,Action} from './engine';
import type {LanguageMode} from '../types';
import {calendar} from './town/model';
import {farmBusy} from './farm/model';
import FarmSprite from './farm/Sprite';
import {PET_TRICKS,trickCopy} from './lifestyle/catalog';
import {copy} from './town/catalog';
export default function HomePetActions({world,selfId,languageMode,send}:{world:World;selfId:string;languageMode:LanguageMode;send:(a:Action)=>void}){
 const [selected,setSelected]=useState(''),p=world.players[selfId],f=world.farm?.people[selfId],pos=p.life?.roomPos;
 const pets=f?.pets.filter(pet=>pet.homeId===p.life?.indoors&&pet.awayUntil<=world.life.time&&pet.roomPos&&pos&&Math.abs(pet.roomPos.x-pos.x)+Math.abs(pet.roomPos.y-pos.y)<=2)||[];
 const pet=pets.find(p=>p.id===selected)||pets[0];if(!pet||!f)return null;
 const L=(ja:string,en:string,hi:string)=>languageMode==='ENGLISH'?en:languageMode==='HIRAGANA'?hi:ja,day=calendar(world).day,busy=world.ended||farmBusy(world,p);
 return <section className="rpg-home-pet-actions" aria-label={L('近くのペット','Nearby pets','ちかくのペット')}><div className="rpg-home-pet-targets">{pets.map(v=><button key={v.id} aria-pressed={v===pet} onClick={()=>setSelected(v.id)}><FarmSprite kind="pet" id={v.kind}/>{v.name}</button>)}</div><div className="rpg-home-pet-buttons">{(['feed','pat','play','train'] as const).map(care=><button key={care} disabled={busy||pet.cares[care]===day||(care==='feed'?!f.feed:pet.hunger<20)} onClick={()=>send({type:'farm-pet-care',id:pet.id,care})}>{({feed:L('えさ','Feed','えさ'),pat:L('なでる','Pat','なでる'),play:L('遊ぶ','Play','あそぶ'),train:L('しつけ','Train','しつけ')})[care]}</button>)}{PET_TRICKS.filter(t=>pet.trained>=t[4]&&pet.bond>=10+t[4]/2).slice(0,2).map(t=><button key={t[0]} disabled={busy||pet.hunger<15||world.life.time<(pet.lastTrick??-100)+8} onClick={()=>send({type:'farm-pet-trick',id:pet.id,trick:t[0]})}>★ {copy(trickCopy(t),languageMode)}</button>)}</div></section>;
}
