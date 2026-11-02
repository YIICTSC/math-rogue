import {HIGH_SCHOOL_ENEMY_VARIANTS,HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS,MAGIC_ENEMY_VARIANTS,MAGIC_HUMANOID_ENEMY_VARIANTS} from '../../data/visualThemes';
import {ENDLESS_BOSSES} from '../../data/endlessMode';
import type {Weapon} from './types';

export type EnemyArtAction='idle'|'attack'|'skill';
export interface WarEnemy {
 id:string;name:string;theme:'high-school'|'magic';kind:'monster'|'humanoid'|'special'|'milestone';
 index:number;vacation:boolean;weapon:Weapon;art:Record<EnemyArtAction,string>;
}
const weapons:Weapon[]=['sword','lance','axe','bow','magic','staff'];
function variant(theme:WarEnemy['theme'],kind:'monster'|'humanoid',entry:{name:string;imageIndex:number},vacation=false):WarEnemy{
 const prefix=vacation?'vacation-':'',folder=kind==='monster'?'enemies':'humanoid-enemies',base=`sprites/${theme}/${prefix}${folder}`;
 const major=kind==='humanoid'?(theme==='high-school'?({13:'kocho',14:'true-kocho'} as Record<number,string>):({20:'grand-witch',21:'star-calamity'} as Record<number,string>))[entry.imageIndex]:undefined;
 const idle=`${base}/${entry.imageIndex}.webp`,boss=vacation&&major?`sprites/${theme}/vacation-bosses/${major}.webp`:undefined;
 return {id:`enemy-${theme}-${kind}-${entry.imageIndex}${vacation?'-vacation':''}`,name:entry.name,theme,kind,index:entry.imageIndex,vacation,weapon:weapons[entry.imageIndex%6],art:{idle:boss||idle,attack:boss||(kind==='humanoid'?`${base}-attack/${entry.imageIndex}.webp`:idle),skill:boss||(kind==='humanoid'?`${base}-skill/${entry.imageIndex}.webp`:idle)}};
}
const groups=[
 HIGH_SCHOOL_ENEMY_VARIANTS.map(e=>variant('high-school','monster',e)),
 HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS.map(e=>variant('high-school','humanoid',e)),
 MAGIC_ENEMY_VARIANTS.map(e=>variant('magic','monster',e)),
 MAGIC_HUMANOID_ENEMY_VARIANTS.map(e=>variant('magic','humanoid',e)),
];
// Interleave the four source catalogs so every chapter can show both worlds.
const standard=Array.from({length:Math.max(...groups.map(g=>g.length))},(_,i)=>groups.flatMap(g=>g[i]?[g[i]]:[])).flat();
const specials=(vacation:boolean):WarEnemy[]=>['azuki','dodomedesu','genzo'].map((key,i)=>{
 const idle=vacation?`sprites/high-school/vacation-bosses/${key==='azuki'?'azuki-idle':key}.webp`:key==='azuki'?'sprites/high-school/azuki/idle.webp':`enemy-illustrations/${key==='genzo'?'ゲンゾー':'ドドメデス'}.webp`;
 const pose=(action:'pounce'|'howl')=>vacation?`sprites/high-school/vacation-bosses/azuki-${action}.webp`:`sprites/high-school/azuki/${action}.webp`;
 return {id:`enemy-high-school-special-${key}${vacation?'-vacation':''}`,name:['あずき','ドドメデス','ゲンゾー'][i],theme:'high-school',kind:'special',index:i,vacation,weapon:weapons[i],art:{idle,attack:key==='azuki'?pose('pounce'):idle,skill:key==='azuki'?pose('howl'):idle}};
});
const milestones:WarEnemy[]=ENDLESS_BOSSES.filter(b=>b.arc!=='elementary').map(b=>{
 const root=`sprites/endless-bosses/${b.arc}/${String(b.floor).padStart(2,'0')}`;
 return {id:`enemy-${b.arc}-milestone-${b.floor}`,name:b.name,theme:b.arc as WarEnemy['theme'],kind:'milestone',index:b.floor,vacation:false,weapon:weapons[Math.floor(b.floor/5)%6],art:{idle:root+'-idle.webp',attack:root+'-attack.webp',skill:root+'-skill.webp'}};
});
export const CAMPAIGN_ENEMIES:WarEnemy[]=[...standard,...specials(false),...milestones];
export const VACATION_ENEMIES:WarEnemy[]=[...standard.map(e=>variant(e.theme,e.kind as 'monster'|'humanoid',{name:e.name,imageIndex:e.index},true)),...specials(true)];
export const ENDLESS_ENEMIES:WarEnemy[]=[...CAMPAIGN_ENEMIES,...VACATION_ENEMIES];
const registry=new Map(ENDLESS_ENEMIES.map(e=>[e.id,e]));
export function warEnemy(id:string):WarEnemy|undefined{
 // Old saves retain the six original enemy IDs and their original artwork.
 const old=/^enemy-([0-5])$/.exec(id);
 return old?registry.get(`enemy-magic-humanoid-${old[1]}`):registry.get(id);
}
export function enemyArtSource(id:string,action:'ready'|'windup'|'attack'|'guard'|'hurt'|'ultimate'='ready'){
 return warEnemy(id)?.art[action==='ultimate'?'skill':action==='attack'||action==='windup'?'attack':'idle'];
}
const squadCount=(chapter:number)=>chapter<2?3:4+Math.floor(chapter/7);
const memberCount=(chapter:number)=>chapter<2?1:2+Math.floor(chapter/6);
export function campaignEnemy(chapter:number,squad:number,member:number){
 let offset=0;for(let c=0;c<chapter;c++)offset+=squadCount(c)*memberCount(c);
 return CAMPAIGN_ENEMIES[(offset+squad*memberCount(chapter)+member)%CAMPAIGN_ENEMIES.length];
}
