import type {FieldState} from './types';
const SAVE='learning-rogue.kocho-field.v1',PROFILE='learning-rogue.dream-bowl.v1';
export interface ArcadeScore {strokes:number;medal:'gold'|'silver'|'bronze'}
export interface ArcadeProfile {scores:Record<string,ArcadeScore>;claimed:number[];pendingItems:string[];pendingRelics:string[]}
const empty=():ArcadeProfile=>({scores:{},claimed:[],pendingItems:[],pendingRelics:[]});
export function loadArcadeProfile():ArcadeProfile {try{const p=JSON.parse(localStorage.getItem(PROFILE)??'null');return p&&p.scores&&Array.isArray(p.claimed)?{...empty(),...p}:empty();}catch{return empty();}}
function saveProfile(p:ArcadeProfile){try{localStorage.setItem(PROFILE,JSON.stringify(p));}catch{}}
export const ARCADE_PRIZES=[
 {card:'花壇ジャンプ'}, {item:'C_MILK'}, {relic:'R_SHIELD'}, {card:'校章ブーメラン'},
 {item:'C_BATTERY'}, {relic:'R_BOOTS'}, {card:'金管アラーム'}, {item:'C_BARRIER'},
 {relic:'R_GLOVES'}, {card:'ロープウェイ'}, {item:'C_DRINK'}, {relic:'R_FANG'},
] as const;
export function recordArcadeClear(course:number,strokes:number,par:number){
 const p=loadArcadeProfile(),key=String(course);const score:ArcadeScore={strokes,medal:strokes<=par?'gold':strokes<=par+2?'silver':'bronze'};
 if(!p.scores[key]||strokes<p.scores[key].strokes)p.scores[key]=score;
 const fresh=!p.claimed.includes(course),prize=ARCADE_PRIZES[course%ARCADE_PRIZES.length];
 if(fresh){p.claimed.push(course);if('item'in prize)p.pendingItems.push(prize.item);if('relic'in prize&&!p.pendingRelics.includes(prize.relic))p.pendingRelics.push(prize.relic);}
 saveProfile(p);return{profile:p,prize,fresh,score};
}
/** Delivered once, only when a new normal campaign is started. */
export function takeNormalArcadePrizes(){const p=loadArcadeProfile();const items=p.pendingItems.slice(0,3),relics=[...new Set(p.pendingRelics)];p.pendingItems=p.pendingItems.slice(3);p.pendingRelics=[];saveProfile(p);return{items,relics};}
export function saveField(s:FieldState){try{localStorage.setItem(SAVE,JSON.stringify(s));}catch{}}
export function loadField():FieldState|null{
 try{const s=JSON.parse(localStorage.getItem(SAVE)??'null');if(!s||s.version!==1||!['original','rebel','akari'].includes(s.hero)||!Number.isInteger(s.stage)||s.stage<1||s.stage>7||s.width!==50+(s.stage-1)*8||!s.player||!Number.isInteger(s.player.x)||s.player.x<0||s.player.x>=s.width||!Number.isInteger(s.player.y)||s.player.y<0||s.player.y>2||!Array.isArray(s.hand)||!Array.isArray(s.enemies)||!Array.isArray(s.seen)||!Array.isArray(s.items)||!Array.isArray(s.relics)||!Number.isFinite(s.hp)||!Number.isFinite(s.money))return null;return s;}catch{return null;}
}
export function clearField(){try{localStorage.removeItem(SAVE);}catch{}}
