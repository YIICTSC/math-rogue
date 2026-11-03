export type Difficulty='story'|'voyage'|'heroic';
export type GrowthSave={postgame:boolean;xp:number;talents:string[];relics:string[];relicRanks:Record<string,number>;equippedRelics:string[];dust:number;cycle:number;difficulty:Difficulty;energy:number;bestiary:Record<string,number>;trials:string[];trialBest:Record<string,number>};
export const TALENTS=[
 {id:'edge',branch:'blade',name:['剣の心得','Blade craft'],description:['与ダメージ＋12％','Damage +12%'],cost:1},
 {id:'finish',branch:'blade',name:['潮の追撃','Tide finisher'],description:['連撃の締めと反撃の威力＋25％','Finishers and counters +25%'],cost:2,requires:'edge'},
 {id:'breaker',branch:'blade',name:['星砕き','Star breaker'],description:['ため技のスタミナ消費を0.1軽減','Charged skills cost 0.1 less stamina'],cost:3,requires:'finish'},
 {id:'step',branch:'wind',name:['風の足','Wind stride'],description:['歩行速度＋8％','Walking speed +8%'],cost:1},
 {id:'breath',branch:'wind',name:['潮の呼吸','Tidal breath'],description:['スタミナ回復速度＋30％','Stamina recovery +30%'],cost:2,requires:'step'},
 {id:'insight',branch:'wind',name:['見切りの極意','Perfect insight'],description:['回避後の反撃猶予を0.3秒延長','Counter window +0.3 seconds'],cost:3,requires:'breath'},
 {id:'resolve',branch:'heart',name:['灯守の決意','Keeper resolve'],description:['受けるダメージを10％軽減','Damage taken -10%'],cost:1},
 {id:'renew',branch:'heart',name:['命の巡り','Renewal'],description:['敵を倒すと体力を0.25回復','Restore 0.25 health per defeat'],cost:2,requires:'resolve'},
 {id:'resonance',branch:'heart',name:['星潮の共鳴','Star resonance'],description:['必殺技ゲージの獲得量＋30％','Starburst charge gained +30%'],cost:3,requires:'renew'}
] as const;
export const RELICS=[
 {id:'shell',set:'tide',name:['潮騎士の貝盾','Tide knight shell'],description:['被ダメージを8％軽減','Damage taken -8%']},
 {id:'conch',set:'tide',name:['息吹の巻貝','Breathing conch'],description:['スタミナ回復＋15％','Stamina recovery +15%']},
 {id:'crescent',set:'tide',name:['逆波の三日月','Riptide crescent'],description:['反撃ダメージ＋20％','Counter damage +20%']},
 {id:'fang',set:'ember',name:['熾火の牙','Ember fang'],description:['与ダメージ＋8％','Damage +8%']},
 {id:'sun',set:'ember',name:['火輪の紋章','Sunwheel crest'],description:['ため技ダメージ＋18％','Charged skill damage +18%']},
 {id:'bloom',set:'ember',name:['灯火の花','Lantern bloom'],description:['命中で敵を3秒間燃やす','Hits burn enemies for 3 seconds']},
 {id:'feather',set:'star',name:['風渡りの羽','Windsail feather'],description:['歩行速度＋8％','Walking speed +8%']},
 {id:'compass',set:'star',name:['星の羅針盤','Star compass'],description:['必殺技ゲージ獲得量＋20％','Starburst charge gained +20%']},
 {id:'lens',set:'star',name:['星晶のレンズ','Star crystal lens'],description:['会心率＋12％・会心威力1.6倍','Critical chance +12%; critical damage 1.6x']},
 {id:'leaf',set:'wild',name:['命つなぎの葉','Renewal leaf'],description:['敵を倒すと体力を0.3回復','Restore 0.3 health per defeat']},
 {id:'knot',set:'wild',name:['雷結び','Thunder knot'],description:['命中時、近くの敵へ雷が連鎖','Hits chain lightning to a nearby enemy']},
 {id:'mirror',set:'wild',name:['月映しの鏡','Moon mirror'],description:['回避のスタミナ消費を0.1軽減','Dodges cost 0.1 less stamina']}
] as const;
export const freshGrowth=():GrowthSave=>({postgame:false,xp:0,talents:[],relics:[],relicRanks:{},equippedRelics:[],dust:0,cycle:0,difficulty:'voyage',energy:0,bestiary:{},trials:[],trialBest:{}});
const amount=(v:unknown,max=1e8)=>Number.isFinite(Number(v))?Math.max(0,Math.min(max,Math.floor(Number(v)))):0;
export function normalizeGrowth(value:Partial<GrowthSave>&{cleared?:string[];quests?:string[]}):GrowthSave{
 const n=freshGrowth();n.postgame=value.postgame===true;n.xp=value.xp===undefined?(value.cleared?.length||0)*12+(value.quests?.length||0)*20:amount(value.xp);n.cycle=amount(value.cycle,99);n.dust=amount(value.dust,9999);n.energy=amount(value.energy,100);
 n.difficulty=['story','voyage','heroic'].includes(value.difficulty||'')?value.difficulty!:'voyage';
 n.relics=RELICS.filter(r=>Array.isArray(value.relics)&&value.relics.includes(r.id)).map(r=>r.id);n.equippedRelics=Array.isArray(value.equippedRelics)?[...new Set(value.equippedRelics.filter(r=>n.relics.includes(r)))].slice(0,2):[];
 for(const id of n.relics)n.relicRanks[id]=Math.max(1,amount(value.relicRanks?.[id],3));
 let spent=0;for(const t of TALENTS)if(Array.isArray(value.talents)&&value.talents.includes(t.id)&&(!('requires'in t)||n.talents.includes(t.requires))&&spent+t.cost<=levelFor(n.xp)-1){n.talents.push(t.id);spent+=t.cost;}
 for(const [id,count]of Object.entries(value.bestiary||{}))if(/^\d+$/.test(id)&&Number(id)<24)n.bestiary[id]=amount(count);
 n.trials=Array.isArray(value.trials)?[...new Set(value.trials.filter(k=>typeof k==='string'&&/^\d+:\d+:(17|21)$/.test(k)))]:[];
 for(const[k,time]of Object.entries(value.trialBest||{}))if(/^\d+:(17|21)$/.test(k)&&Number.isFinite(time)&&time>0)n.trialBest[k]=time;
 return n;
}
export const levelFor=(xp:number)=>1+Math.floor(Math.sqrt(Math.max(0,xp)/25));
export const nextLevelXp=(xp:number)=>25*levelFor(xp)**2;
export const talentPoints=(s:GrowthSave)=>Math.max(0,levelFor(s.xp)-1-TALENTS.filter(t=>s.talents.includes(t.id)).reduce((sum,t)=>sum+t.cost,0));
export function combatStats(s:GrowthSave){
 const has=(id:string)=>s.talents.includes(id),rank=(id:string)=>s.equippedRelics.includes(id)?1+((s.relicRanks[id]||1)-1)*.35:0;
 const count=(set:string)=>RELICS.filter(r=>r.set===set&&s.equippedRelics.includes(r.id)).length;
 return {damage:1+(has('edge')?.12:0)+rank('fang')*.08,guard:Math.max(.55,1-(has('resolve')?.1:0)-rank('shell')*.08),speed:1+(has('step')?.08:0)+rank('feather')*.08,regen:1+(has('breath')?.3:0)+rank('conch')*.15,counter:1+(has('finish')?.25:0)+rank('crescent')*.2,charged:1+rank('sun')*.18,chargeCost:has('breaker')?.35:.45,dodgeCost:Math.max(.45,.7-rank('mirror')*.1),counterTime:has('insight')?.3:0,heal:(has('renew')?.25:0)+rank('leaf')*.3,energy:1+(has('resonance')?.3:0)+rank('compass')*.2,crit:rank('lens')*.12,burn:Math.max(rank('bloom'),count('ember')>=2?1:0),chain:rank('knot'),tideSet:count('tide')>=2,driveDuration:count('star')>=2?8:6};
}

export function relicEffectText(id:string,rank:number,en:boolean){
 const p=1+(Math.max(1,rank)-1)*.35,n=(v:number)=>Number(v.toFixed(2)).toString(),l=(ja:string,english:string)=>en?english:ja;
 const values:Record<string,string>={shell:l(`被ダメージ −${n(8*p)}％`,`Damage taken −${n(8*p)}%`),conch:l(`スタミナ回復 ＋${n(15*p)}％`,`Stamina recovery +${n(15*p)}%`),crescent:l(`反撃ダメージ ＋${n(20*p)}％`,`Counter damage +${n(20*p)}%`),fang:l(`与ダメージ ＋${n(8*p)}％`,`Damage +${n(8*p)}%`),sun:l(`ため技ダメージ ＋${n(18*p)}％`,`Charged skill damage +${n(18*p)}%`),bloom:l(`炎上：毎秒${n(1.2*p)}ダメージ・3秒`,`Burn: ${n(1.2*p)} damage/second for 3s`),feather:l(`歩行速度 ＋${n(8*p)}％`,`Walking speed +${n(8*p)}%`),compass:l(`必殺ゲージ獲得 ＋${n(20*p)}％`,`Starburst charge +${n(20*p)}%`),lens:l(`会心率 ＋${n(12*p)}％・威力1.6倍`,`Critical chance +${n(12*p)}%; damage 1.6x`),leaf:l(`撃破時の体力回復 ${n(.3*p)}`,`Health per defeat: ${n(.3*p)}`),knot:l(`連鎖雷：元の${n((.35+.1*p)*100)}％のダメージ`,`Chain lightning: ${n((.35+.1*p)*100)}% damage`),mirror:l(`回避スタミナ消費 −${n(.1*p)}`,`Dodge stamina cost −${n(.1*p)}`)};return values[id]||'';
}
