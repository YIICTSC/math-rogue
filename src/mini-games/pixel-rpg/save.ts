import { GameMode } from '../../types';
import { validKartQuestion } from '../gakuro-kart/learning';
import { maxHp, restoreAdventure, type Adventure, type HeroState } from './adventure';
import { CARDS, ELEMENTS, GEAR, HEROES, ITEMS, JOBS, LINK_MAX, RELICS, SLOTS, type DeckCard } from './catalog';
import { REGIONS, VEHICLES } from './campaign';
import { DUNGEON_LAYOUT_VERSION, OFFSETS, area, type Point } from './world';

export const SAVE_SLOTS=[1,2,3] as const;
export type Slot=typeof SAVE_SLOTS[number];
const baseKey='learning-rogue:pixel-rpg:v1';
const key=(slot:Slot,kind:'auto'|'manual')=>`${baseKey}:${slot}:${kind}`;
export type SlotData={savedAt:number;state:Adventure;kind:'auto'|'manual'};
const isRecord=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const isNumber=(n:unknown,min=0,max=Number.MAX_SAFE_INTEGER):n is number=>Number.isSafeInteger(n)&&Number(n)>=min&&Number(n)<=max;
const isIn=(v:unknown,o:object):v is string=>typeof v==='string'&&Object.prototype.hasOwnProperty.call(o,v);
const list=(v:unknown,test:(k:unknown)=>boolean,length:number)=>Array.isArray(v)&&v.length<=length&&v.every(test);
const strings=(v:unknown,n:number)=>list(v,k=>typeof k==='string'&&k.length<=160,n);
const point=(p:unknown, map:string):p is Point=>isRecord(p)&&isNumber(p.x,0,area(map).width-1)&&isNumber(p.y,0,area(map).height-1);
const map=(m:unknown):m is string=>typeof m==='string'&&area(m).id===m;
const modeList=new Set<string>(Object.values(GameMode));
const questionText=(value:unknown,limit:number)=>typeof value==='string'&&value.length>0&&value.length<=limit;
const validMissed=(q:unknown)=>validKartQuestion(q)||(isRecord(q)&&questionText(q.mode,120)&&questionText(q.problemKey,16000)&&
  questionText(q.question,12000)&&questionText(q.correctAnswer,3000)&&(q.problemId===undefined||questionText(q.problemId,300))&&
  (q.unitName===undefined||questionText(q.unitName,300))&&(q.options===undefined||list(q.options,value=>questionText(value,3000),12)));
function validCard(c:unknown):c is DeckCard{
  return isRecord(c)&&isIn(c.key,CARDS)&&(c.rank===undefined||isNumber(c.rank,0,2))&&(c.element===undefined||isIn(c.element,ELEMENTS))&&
    (c.parts===undefined||Array.isArray(c.parts)&&c.parts.length>=2&&list(c.parts,k=>isIn(k,CARDS),3));
}
function validHero(v:unknown, id:string):v is HeroState {
  if(!isRecord(v)||v.id!==id||!isIn(id,HEROES)||!isNumber(v.level,1,60)||!isNumber(v.xp)||!isNumber(v.hp,1,9999)||!isIn(v.job,JOBS)||
    typeof v.rear!=='boolean'||!isRecord(v.mastery)||!Object.entries(v.mastery).every(([k,n])=>isIn(k,JOBS)&&isNumber(n))||
    !list(v.learned,k=>isIn(k,CARDS),500)||!list(v.deck,validCard,20)||!Array.isArray(v.deck)||v.deck.length<10)return false;
  if(v.inherited!==undefined&&!isIn(v.inherited,CARDS)||v.relic!==undefined&&!isIn(v.relic,RELICS))return false;
  if(!isRecord(v.equipment)||!Object.entries(v.equipment).every(([slot,item])=>isIn(slot,SLOTS)&&(item===undefined||isIn(item,GEAR)&&GEAR[item].slot===slot)))return false;
  return v.hp<=maxHp(v as HeroState);
}
export function validAdventure(v:unknown):v is Adventure {
  if(!isRecord(v)||v.version!==1||!map(v.map)||!point(v.at,v.map)||!isIn(v.direction,OFFSETS)||!isIn(v.vehicle,VEHICLES)||!isIn(v.leader,HEROES))return false;
  if(v.dungeonLayout!==undefined&&v.dungeonLayout!==DUNGEON_LAYOUT_VERSION)return false;
  const heroes=v.heroes;
  if(!isRecord(heroes)||!heroes[v.leader]||!Object.entries(heroes).every(([id,h])=>validHero(h,id))||
    !Array.isArray(v.party)||v.party.length<1||!list(v.party,p=>isIn(p,heroes),4)||new Set(v.party).size!==v.party.length)return false;
  if(!isRecord(v.checkpoint)||!map(v.checkpoint.map)||!point(v.checkpoint.at,v.checkpoint.map)||!list(v.trail,p=>point(p,v.map as string),8)||
    !list(v.parent,l=>isRecord(l)&&map(l.map)&&point(l.at,l.map)&&isIn(l.vehicle,VEHICLES),8))return false;
  if(!isRecord(v.rocks)||!Object.entries(v.rocks).every(([id,p])=>map(id)&&point(p,id))||
    !list(v.licenses,l=>isIn(l,VEHICLES),6)||!(v.licenses as string[]).includes(String(v.vehicle)))return false;
  if(!isNumber(v.stage,0,REGIONS.length)||typeof v.ending!=='boolean'||!isNumber(v.cycle,0,200)||!isNumber(v.gold)||
    !isNumber(v.steps)||!isNumber(v.minutes)||!isNumber(v.elapsed)||!isNumber(v.rng,0,4294967295)||!isNumber(v.streak)||!isNumber(v.repellent,0,64)||!isNumber(v.rank,0,200)||
    v.link!==undefined&&!isNumber(v.link,0,LINK_MAX))return false;
  if(!strings(v.completed,10000)||!strings(v.quests,200)||!strings(v.flags,2000)||!strings(v.open,1500)||!list(v.visits,map,1000)||!strings(v.monsters,200)||
    !list(v.books,n=>isNumber(n,0,REGIONS.length-1),REGIONS.length)||!list(v.gear,k=>isIn(k,GEAR),500)||!list(v.unlockedCards,k=>isIn(k,CARDS),500)||
    !list(v.relics,k=>isIn(k,RELICS),50)||v.partyRelic!==undefined&&!isIn(v.partyRelic,RELICS))return false;
  const items=v.items;
  if(!isRecord(items)||!Object.keys(ITEMS).every(k=>isNumber(items[k],0,999)))return false;
  const q=v.learned;
  if(!isRecord(q)||!isNumber(q.attempts)||!isNumber(q.correct,0,q.attempts)||!list(q.missed,validMissed,48)||!isRecord(q.units)||
    !Object.values(q.units).every(u=>isRecord(u)&&isNumber(u.attempts)&&isNumber(u.correct,0,u.attempts)))return false;
  const settings=v.settings;
  return isRecord(settings)&&['random','symbol'].includes(String(settings.encounters))&&['normal','low'].includes(String(settings.rate))&&
    ['choice','typing','writing'].includes(String(settings.answer))&&['turn','battle','off'].includes(String(settings.quizHints))&&['normal','quick','instant'].includes(String(settings.rateFx))&&
    typeof settings.reduceFx==='boolean'&&typeof settings.read==='boolean'&&(settings.avoidWeak===undefined||typeof settings.avoidWeak==='boolean')&&
    (settings.language===undefined||['JAPANESE','HIRAGANA','ENGLISH'].includes(String(settings.language)))&&list(settings.modes,m=>typeof m==='string'&&modeList.has(m),400);
}
export function writeSave(slot:Slot,state:Adventure,kind:'auto'|'manual',storage?:Storage):boolean {
  try{
    const data: SlotData={state,savedAt:Date.now(),kind};
    (storage??localStorage).setItem(key(slot,kind),JSON.stringify(data));
    return true;
  }catch{return false;}
}
export function readSave(slot:Slot,storage?:Storage):SlotData[] {
  const copies:SlotData[]=[];
  for(const kind of ['auto','manual'] as const){
    try {
      const raw=(storage??localStorage).getItem(key(slot,kind));if(!raw||raw.length>4_000_000)continue;
      const p:unknown=JSON.parse(raw);
      if(isRecord(p)&&isNumber(p.savedAt,1)&&validAdventure(p.state))copies.push({savedAt:p.savedAt,state:restoreAdventure(p.state),kind});
    }catch{/* The alternate save may still be readable after a partial browser restore. */}
  }
  return copies.sort((a,b)=>b.savedAt-a.savedAt);
}
export function clearSlot(slot:Slot,storage?:Storage,kind?:SlotData['kind']){
  try {
    const local=storage??localStorage;
    if(!kind||kind==='auto')local.removeItem(key(slot,'auto'));
    if(!kind||kind==='manual')local.removeItem(key(slot,'manual'));
    return true;
  }catch {return false;}
}
export function clearPixelRpgSaves(){for(const slot of SAVE_SLOTS)clearSlot(slot);}
