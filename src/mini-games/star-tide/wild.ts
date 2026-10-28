export type Inventory={apple:number;mushroom:number;herb:number;ore:number;meal:number;tonic:number};
export type MealBuff={kind: 'speed'|'attack'|'guard';seconds:number};
export type WildSave={dishes:Record<string,number>;mealBuff:MealBuff|null;ownedTools:number[];inventory:Inventory;foraged:string[];changes:Record<string,number>;charts:number[];spirit:number;staminaMax:number;weaponRank:number;exploded:string[]};
export const freshWild=():WildSave=>({dishes:{},mealBuff:null,ownedTools:[0],inventory:{apple:2,mushroom:0,herb:1,ore:0,meal:2,tonic:0},foraged:[],changes:{},charts:[],spirit:0,staminaMax:1,weaponRank:0,exploded:[]});
const count=(n:unknown,max=999)=>Number.isFinite(Number(n))?Math.min(max,Math.max(0,Math.floor(Number(n)))):0;
export function normalizeWild(x:Partial<WildSave>&{unlockedTools?:number}):WildSave{const n=freshWild();n.ownedTools=Array.isArray(x.ownedTools)?[...new Set([0,...x.ownedTools.filter(v=>Number.isInteger(v)&&v>=0&&v<=7)])]:Array.from({length:Math.max(0,Math.min(7,Number(x.unlockedTools)||0))+1},(_,i)=>i);if(x.inventory&&typeof x.inventory==='object')for(const k of Object.keys(n.inventory)as(keyof Inventory)[])n.inventory[k]=count(x.inventory[k]);for(const k of ['foraged','exploded']as const)n[k]=Array.isArray(x[k])?[...new Set(x[k].filter(v=>typeof v==='string'))].slice(0,2000):[];n.charts=Array.isArray(x.charts)?[...new Set(x.charts.filter(v=>Number.isInteger(v)&&v>=0&&v<12))]:[];if(x.changes&&typeof x.changes==='object')for(const[k,v]of Object.entries(x.changes))if(/^\d{1,2}:\d{1,2}:\d{1,2},\d{1,2}$/.test(k)&&[0,1,5].includes(v))n.changes[k]=v;n.spirit=count(x.spirit);n.weaponRank=count(x.weaponRank,3);n.staminaMax=Number.isFinite(Number(x.staminaMax))?Math.max(1,Math.min(2.5,Number(x.staminaMax))):1;if(x.dishes&&typeof x.dishes==='object')for(const recipe of RECIPES)n.dishes[recipe.id]=count(x.dishes[recipe.id]);if(x.mealBuff&&['speed','attack','guard'].includes(x.mealBuff.kind)&&Number.isFinite(x.mealBuff.seconds)&&x.mealBuff.seconds>0)n.mealBuff={kind:x.mealBuff.kind,seconds:Math.min(180,x.mealBuff.seconds)};return n;}
export type Recipe={id:string;ja:string;en:string;cost:Partial<Inventory>;output:'meal'|'tonic';heal:number;stamina?:boolean;buff?:MealBuff['kind']};
export const RECIPES:readonly Recipe[]=[
 {id:'meal',ja:'焼きりんご',en:'Roasted apple',cost:{apple:2},output:'meal',heal:4},
 {id:'tonic',ja:'風のきのこスープ',en:'Wind mushroom soup',cost:{mushroom:2,herb:1},output:'tonic',heal:2,stamina:true},
 {id:'travel',ja:'旅人の煮込み',en:'Traveller stew',cost:{apple:1,mushroom:1,herb:1},output:'meal',heal:6},
 {id:'grilled',ja:'焼ききのこ',en:'Grilled mushrooms',cost:{mushroom:2},output:'meal',heal:4},
 {id:'herbSoup',ja:'薬草のポタージュ',en:'Herb potage',cost:{herb:3},output:'tonic',heal:3,stamina:true},
 {id:'compote',ja:'りんごのコンポート',en:'Apple compote',cost:{apple:3},output:'meal',heal:6},
 {id:'omelet',ja:'きのこのふわ焼き',en:'Fluffy mushroom bake',cost:{mushroom:3,herb:1},output:'meal',heal:6,buff:'attack'},
 {id:'salad',ja:'りんごと薬草のサラダ',en:'Apple herb salad',cost:{apple:1,herb:2},output:'meal',heal:3,buff:'speed'},
 {id:'risotto',ja:'森のきのこリゾット',en:'Forest mushroom risotto',cost:{mushroom:4,herb:1},output:'meal',heal:8,buff:'guard'},
 {id:'pie',ja:'りんごのパイ',en:'Apple pie',cost:{apple:4,herb:1},output:'meal',heal:8,stamina:true},
 {id:'skewer',ja:'旅立ちの串焼き',en:'Voyager skewers',cost:{apple:2,mushroom:2},output:'meal',heal:5,buff:'attack'},
 {id:'feast',ja:'星潮のごちそう',en:'Star Tide feast',cost:{apple:3,mushroom:3,herb:3},output:'meal',heal:12,stamina:true,buff:'guard'},
];
export const dishArt=(id:string)=>`sprites/star-tide/food/${RECIPES.findIndex(r=>r.id===id)}.webp`;
export const forageNodes=[{x:5.5,y:3.5},{x:14.5,y:5.5},{x:7.5,y:10.5}];
export const campPosition={x:15.5,y:10.5};
export const towerPosition={x:10.5,y:2.5};
