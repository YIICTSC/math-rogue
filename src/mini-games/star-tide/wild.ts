export type Inventory={apple:number;mushroom:number;herb:number;ore:number;meal:number;tonic:number};
export type WildSave={ownedTools:number[];inventory:Inventory;foraged:string[];changes:Record<string,number>;charts:number[];spirit:number;staminaMax:number;weaponRank:number;exploded:string[]};
export const freshWild=():WildSave=>({ownedTools:[0],inventory:{apple:2,mushroom:0,herb:1,ore:0,meal:2,tonic:0},foraged:[],changes:{},charts:[],spirit:0,staminaMax:1,weaponRank:0,exploded:[]});
const count=(n:unknown,max=999)=>Number.isFinite(Number(n))?Math.min(max,Math.max(0,Math.floor(Number(n)))):0;
export function normalizeWild(x:Partial<WildSave>&{unlockedTools?:number}):WildSave{const n=freshWild();n.ownedTools=Array.isArray(x.ownedTools)?[...new Set([0,...x.ownedTools.filter(v=>Number.isInteger(v)&&v>=0&&v<=7)])]:Array.from({length:Math.max(0,Math.min(7,Number(x.unlockedTools)||0))+1},(_,i)=>i);if(x.inventory&&typeof x.inventory==='object')for(const k of Object.keys(n.inventory)as(keyof Inventory)[])n.inventory[k]=count(x.inventory[k]);for(const k of ['foraged','exploded']as const)n[k]=Array.isArray(x[k])?[...new Set(x[k].filter(v=>typeof v==='string'))].slice(0,2000):[];n.charts=Array.isArray(x.charts)?[...new Set(x.charts.filter(v=>Number.isInteger(v)&&v>=0&&v<12))]:[];if(x.changes&&typeof x.changes==='object')for(const[k,v]of Object.entries(x.changes))if(/^\d{1,2}:\d{1,2}:\d{1,2},\d{1,2}$/.test(k)&&[0,1,5].includes(v))n.changes[k]=v;n.spirit=count(x.spirit);n.weaponRank=count(x.weaponRank,3);n.staminaMax=Number.isFinite(Number(x.staminaMax))?Math.max(1,Math.min(2.5,Number(x.staminaMax))):1;return n;}
export const RECIPES=[
 {id:'meal',ja:'焼きりんご',en:'Roasted fruit',cost:{apple:2},output:'meal'},
 {id:'tonic',ja:'風のきのこスープ',en:'Wind mushroom soup',cost:{mushroom:2,herb:1},output:'tonic'},
 {id:'travel',ja:'旅人の煮込み',en:'Traveller’s stew',cost:{apple:1,mushroom:1,herb:1},output:'meal'},
] as const;
export const forageNodes=[{x:5.5,y:3.5},{x:14.5,y:5.5},{x:7.5,y:10.5}];
export const campPosition={x:15.5,y:10.5};
export const towerPosition={x:10.5,y:2.5};
