import { EMOTE_COSTS, type StudyStats, type View } from './rules';
const KEY='gakuro-secret-mission-profile-v1';
export type ExtraEmote=keyof typeof EMOTE_COSTS;
export interface MissionProfile { xp:number; tokens:number; wins:number; tasks:number; repairs:number; receipts:string[]; emotes:ExtraEmote[] }
const fresh:MissionProfile={xp:0,tokens:0,wins:0,tasks:0,repairs:0,receipts:[],emotes:[]};
export function readProfile():MissionProfile{
  try{
    const p=JSON.parse(localStorage.getItem(KEY)??'null') as MissionProfile|null;
    if(p&&Array.isArray(p.receipts)&&[p.xp,p.tokens,p.wins,p.tasks,p.repairs].every(n=>Number.isFinite(n)&&n>=0)){
      return {...p,emotes:Array.isArray(p.emotes)?p.emotes.filter(key=>Object.hasOwn(EMOTE_COSTS,key)):[]};
    }
  }catch{}
  return fresh;
}
export const missionLevel=(p:MissionProfile)=>1+Math.floor(p.xp/100);
export function awardSize(stats:StudyStats,won:boolean){
  const xp=Math.min(160,12+stats.correct*5+stats.tasks*8+stats.repairs*10+stats.cooperation*12+(won?20:0));
  return {xp,tokens:Math.floor(xp/12)};
}
export function recordMission(view:View){
  const p=readProfile();
  if(!view.report||view.winner?.side==='ended'||!view.winner||p.receipts.includes(view.round))return p;
  const {xp,tokens}=awardSize(view.report,!!view.won);
  const next={...p,xp:p.xp+xp,tokens:p.tokens+tokens,wins:p.wins+Number(view.won),tasks:p.tasks+view.report.tasks,repairs:p.repairs+view.report.repairs,
    receipts:[...p.receipts.slice(-399),view.round]};
  try{localStorage.setItem(KEY,JSON.stringify(next));}catch{}
  return next;
}
export function unlockEmote(emote:ExtraEmote){
  const p=readProfile(),cost=EMOTE_COSTS[emote];
  if(p.tokens<cost||p.emotes.includes(emote))return p;
  const next={...p,tokens:p.tokens-cost,emotes:[...p.emotes,emote]};
  try{localStorage.setItem(KEY,JSON.stringify(next));}catch{}
  return next;
}
export function badge(p:MissionProfile,en:boolean){
  if(p.repairs>=10)return en?'Master Engineer':'修理の達人';
  if(p.wins>=5)return en?'Academy Detective':'名探偵';
  if(p.tasks>=10)return en?'Trusted Crew':'頼れる仲間';
  return en?'Cadet':'見習いクルー';
}
