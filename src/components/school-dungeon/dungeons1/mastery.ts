import {LEGACY_WEAPON_KINDS} from './weaponCatalog';
/** Dungeons 1 martial progression. Plain serializable data; no rendering or storage side effects. */
export const WEAPON_KINDS=['fist','sword','greatsword','rapier','axe','spear','staff','hammer','bow','whip','chakram'] as const;
export type WeaponKind=typeof WEAPON_KINDS[number];
export type CombatPose='slash'|'cleave'|'thrust'|'kick';
export const WEAPONS:Record<WeaponKind,{ja:string;en:string;color:string;pose:CombatPose}>={
 fist:{ja:'素手',en:'Unarmed',color:'#ffbb76',pose:'kick'},sword:{ja:'剣',en:'Sword',color:'#7edcff',pose:'slash'},greatsword:{ja:'大剣',en:'Greatsword',color:'#9eaaff',pose:'cleave'},rapier:{ja:'細剣',en:'Rapier',color:'#f5bfff',pose:'thrust'},axe:{ja:'斧',en:'Axe',color:'#ff956b',pose:'cleave'},spear:{ja:'槍',en:'Spear',color:'#80efcb',pose:'thrust'},staff:{ja:'杖',en:'Staff',color:'#98c7ff',pose:'slash'},hammer:{ja:'槌',en:'Hammer',color:'#ffd76e',pose:'cleave'},bow:{ja:'弓',en:'Bow',color:'#b8f68c',pose:'thrust'},whip:{ja:'鞭',en:'Whip',color:'#dbabff',pose:'slash'},chakram:{ja:'輪刃',en:'Chakram',color:'#8df1ee',pose:'slash'},
};
const names:Record<WeaponKind,readonly [string,string][]>= {
 fist:[['踏風掌','Windstep Palm'],['昇陽連脚','Sunrise Kicks'],['空鳴り拳','Skyresonance Fist'],['天環無拍','Heavenring Silence']],
 sword:[['朝露払い','Dewfall Cut'],['双葉返し','Twinleaf Reversal'],['宵星の輪舞','Eveningstar Waltz'],['黎明一文字','Dawn Horizon']],
 greatsword:[['雲割り','Cloud Parting'],['夕凪おろし','Duskfall Cleave'],['月稜断','Moonridge Sever'],['蒼天境界斬','Azure Boundary']],
 rapier:[['針雨','Needle Rain'],['星縫い','Star Stitch'],['銀糸の螺旋','Silverthread Spiral'],['流星点描','Meteor Pointillism']],
 axe:[['木霊打ち','Echo Hew'],['朱葉落とし','Crimsonleaf Fall'],['岩戸裂き','Stonegate Split'],['天樹崩し','Worldtree Sundering']],
 spear:[['風見突き','Windvane Thrust'],['燕渡り','Swallow Crossing'],['碧雷穿','Jade Thunderpierce'],['星河貫き','Starstream Impalement']],
 staff:[['小枝払い','Twig Sweep'],['水鏡返し','Watermirror Turn'],['天秤回し','Celestial Balance'],['万象の円','Circle of All Things']],
 hammer:[['鐘ひとつ','First Bell'],['地響き拍子','Earthbeat'],['砕月の鼓動','Moonbreak Pulse'],['暁鐘轟天','Dawnbell Thunder']],
 bow:[['風糸射ち','Windthread Shot'],['双虹の矢','Twinrainbow Arrow'],['星屑時雨','Stardust Shower'],['天弧七彩','Sevenhue Skybow']],
 whip:[['草波打ち','Grasswave Lash'],['紫電の結び','Violet Lightning Knot'],['風花乱れ','Windblossom Flurry'],['星環の舞','Starring Dance']],
 chakram:[['弧月投げ','Crescent Cast'],['双輪巡り','Twinring Orbit'],['風輪連華','Windwheel Lotus'],['天輪帰航','Skywheel Homecoming']],
};
export interface Technique {id:string;kind:WeaponKind;ja:string;en:string;tier:number;power:number;pattern:'single'|'sweep'|'pierce'|'burst';pose:CombatPose;requires?:readonly WeaponKind[];}
export const TECHNIQUES:Technique[]=WEAPON_KINDS.flatMap(kind=>names[kind].map(([ja,en],i)=>({id:`${kind}-${i+1}`,kind,ja,en,tier:i+1,power:[1.15,1.4,1.7,2.1][i],pattern:(i===3?'burst':i===2?'sweep':i===1&&['spear','rapier','bow'].includes(kind)?'pierce':'single') as Technique['pattern'],pose:kind==='fist'&&i%2===0?'thrust':WEAPONS[kind].pose}))).concat([
 {id:'ultimate-dawn',kind:'sword',ja:'奥義・万彩黎明',en:'Secret Art: Prismatic Dawn',tier:5,power:2.7,pattern:'burst',pose:'slash',requires:['sword','greatsword','rapier']},
 {id:'ultimate-earth',kind:'hammer',ja:'奥義・地天共鳴',en:'Secret Art: Earthsky Resonance',tier:5,power:2.7,pattern:'burst',pose:'cleave',requires:['axe','hammer','staff']},
 {id:'ultimate-sky',kind:'spear',ja:'奥義・星巡天翔',en:'Secret Art: Starbound Flight',tier:5,power:2.7,pattern:'burst',pose:'thrust',requires:['spear','bow','chakram']},
 {id:'ultimate-heart',kind:'fist',ja:'奥義・無窮心輪',en:'Secret Art: Boundless Heart',tier:5,power:2.7,pattern:'burst',pose:'kick',requires:['fist','whip','staff']},
] as Technique[]);
export interface MartialProgress {weaponXp:Partial<Record<WeaponKind,number>>;techniqueUses:Record<string,number>;learned:string[];selected:Partial<Record<WeaponKind,string>>;}
export function newMartialProgress():MartialProgress{return {weaponXp:{},techniqueUses:{},learned:[],selected:{}};}
const bounded=(v:unknown,max=1000000)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):0;
/** Migrate absent/partial legacy saves, and reject unknown IDs rather than breaking combat. */
export function normalizeMartialProgress(raw?:Partial<MartialProgress>|null):MartialProgress{
 const p=newMartialProgress();for(const k of WEAPON_KINDS)p.weaponXp[k]=bounded(raw?.weaponXp?.[k],330);
 for(const t of TECHNIQUES)if(Array.isArray(raw?.learned)&&raw.learned.includes(t.id)){p.learned.push(t.id);p.techniqueUses[t.id]=bounded(raw?.techniqueUses?.[t.id]);}
 for(const k of WEAPON_KINDS){const t=TECHNIQUES.find(t=>t.id===raw?.selected?.[k]&&t.kind===k);if(t&&p.learned.includes(t.id))p.selected[k]=t.id;}return p;
}
export const weaponThreshold=(level:number)=>3*level*(level+1);
export function weaponLevel(p:MartialProgress,kind:WeaponKind){let level=0;while(level<10&&(p.weaponXp[kind]||0)>=weaponThreshold(level+1))level++;return level;}
export function techniqueRank(p:MartialProgress,id:string){return Math.min(5,Math.floor((p.techniqueUses[id]||0)/5));}
export function equippedWeaponKind(item?:{type?:string;name?:string;weaponKind?:string}|null):WeaponKind{
 if(!item)return 'fist';const legacy=LEGACY_WEAPON_KINDS[item.type||''];if(legacy)return legacy;
 const training=TRAINING_WEAPONS[item.type||'']?.weaponKind;if(training)return training;
 if(WEAPON_KINDS.includes(item.weaponKind as WeaponKind))return item.weaponKind as WeaponKind;
 // Preserve playability for imported/custom supplies; all shipped weapons are explicitly classified.
 return 'sword';
}
export function selectedTechnique(p:MartialProgress,kind:WeaponKind){return TECHNIQUES.find(t=>t.id===p.selected[kind]&&t.kind===kind&&p.learned.includes(t.id));}
export function canSpark(p:MartialProgress,t:Technique){
 if(p.learned.includes(t.id)||weaponLevel(p,t.kind)<[0,1,3,5,7,8][t.tier])return false;
 if(t.requires)return t.requires.every(k=>weaponLevel(p,k)>=8&&TECHNIQUES.some(s=>s.kind===k&&s.tier===4&&p.learned.includes(s.id)&&techniqueRank(p,s.id)>=3));
 if(t.tier===1)return true;const previous=`${t.kind}-${t.tier-1}`;return p.learned.includes(previous)&&techniqueRank(p,previous)>=2;
}
/** One award per real attack, regardless of targets or hits. Empty swings never call this. */
export function practiceAttack(current:MartialProgress,kind:WeaponKind,random= Math.random){
 const p=normalizeMartialProgress(current),before=weaponLevel(p,kind),used=selectedTechnique(p,kind);
 p.weaponXp[kind]=Math.min(330,(p.weaponXp[kind]||0)+1);if(used)p.techniqueUses[used.id]=(p.techniqueUses[used.id]||0)+1;
 const candidates=TECHNIQUES.filter(t=>t.kind===kind&&canSpark(p,t)).sort((a,b)=>a.tier-b.tier);
 const sparked=candidates.length&&random()<.22?candidates[0]:undefined;
 if(sparked){p.learned.push(sparked.id);p.selected[kind]=sparked.id;}
 return {progress:p,technique:sparked||used,sparked,leveled:weaponLevel(p,kind)>before};
}
export const TRAINING_WEAPONS=Object.fromEntries(WEAPON_KINDS.filter(k=>k!=='fist').map((kind,i)=>{
 const label=['','青芯の練習剣','黒板の大剣','星図の細剣','木霊の手斧','風見の長槍','天文の杖','予鈴の大槌','若葉の弓','紫苑のリボン鞭','銀月の輪刃'][i+1];
 const type=`D1_TRAINING_${kind.toUpperCase()}`;return [type,{type,category:'WEAPON',weaponKind:kind,name:label,en:`${WEAPONS[kind].en} of practice`,desc:`${WEAPONS[kind].ja}。攻撃+4。実戦で武器熟練度と技を育てる。`,englishDesc:`${WEAPONS[kind].en}. Attack +4. Practice against foes to master techniques.`,power:4,value:200}];
}));
