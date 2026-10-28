import {heroById,pairKey} from './roster';
import type {Campaign,Squad,Fighter,Encounter,CombatEvent,Tactic} from './types';
export const DEFAULT_TACTICS:Tactic[]=[{skill:'heal',condition:'wounded',target:'lowest'},{skill:'ultimate',condition:'many',target:'healer'},{skill:'strike',condition:'always',target:'front'}];
export const RULE_LABELS={strike:'通常攻撃（1AP）',ultimate:'固有必殺（2AP）',heal:'味方を回復（1AP・杖）',row:'一列攻撃（2AP）'};
export const CONDITION_LABELS={always:'常に',wounded:'味方HPが50%以下',many:'敵が2人以上',armored:'重装の敵がいる'};
export const TARGET_LABELS={lowest:'HPが低い相手',front:'前衛を優先',back:'後衛を優先',healer:'回復役を優先'};
export function resolveEncounter(s:Campaign,ally:Squad,enemy:Squad,supports:Squad[]=[]):Encounter{
 const fighters=JSON.parse(JSON.stringify([...ally.members,...enemy.members])) as Fighter[];
 const events:CombatEvent[]=[],support:string[]=[];let seed=s.battle?.seed??20261028;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%100;};
 const alive=(team:string)=>fighters.filter(f=>f.team===team&&f.hp>0);
 const record=(a:Fighter,z:Fighter,damage:number,name:string,skill=false,passive=false,crit=false)=>{
 z.hp=Math.max(0,Math.min(z.maxHp,z.hp-damage));events.push({actor:a.uid,target:z.uid,actorHero:a.hero,targetHero:z.hero,damage,crit,skill,heal:damage<0,passive,name,hp:z.hp});};
 for(const f of fighters){f.ap=2+(s.xp[f.hero]>=800?1:0);f.pp=2;f.status=undefined;
 const sq=f.team==='ally'?ally:enemy;if(sq.rest>0){f.ap=0;f.pp=0;}}
 for(const squad of supports.filter(q=>q.stamina>0)){
 const helper=squad.members.find(f=>f.hp>0&&['bow','magic','staff'].includes(f.weapon));if(!helper)continue;
 const targets=alive(helper.weapon==='staff'?squad.team:squad.team==='ally'?'enemy':'ally');if(!targets.length)continue;
 const z=targets.sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
 record(helper,z,helper.weapon==='staff'?-10:7,'援護・'+heroById(helper.hero).role,false,true);support.push(squad.id);
 }
 const order=[...fighters].sort((a,b)=>b.speed-a.speed||(a.team==='ally'?-1:1));
 for(let round=0;round<4;round++){
 for(const a of order){
 if(a.hp<=0||a.ap<=0||!alive(a.team==='ally'?'enemy':'ally').length)continue;
 if(a.status==='stun'){a.status=undefined;a.ap--;events.push({actor:a.uid,target:a.uid,actorHero:a.hero,targetHero:a.hero,damage:0,hp:a.hp,crit:false,skill:false,heal:false,passive:true,name:'氷縛で行動中断'});continue;}
 const friends=alive(a.team),foes=alive(a.team==='ally'?'enemy':'ally');
 const tactics=a.team==='ally'?(s.tactics[a.hero]||DEFAULT_TACTICS):DEFAULT_TACTICS;
 let acted=false;
 for(const rule of tactics){
 if(rule.condition==='wounded'&&!friends.some(f=>f.hp/f.maxHp<=.5)||rule.condition==='many'&&foes.length<2||rule.condition==='armored'&&!foes.some(f=>f.weapon==='lance'))continue;
 const cost=rule.skill==='ultimate'||rule.skill==='row'?2:1;if(a.ap<cost)continue;
 if(rule.skill==='heal'){
 if(a.weapon!=='staff')continue;const z=[...friends].filter(f=>f.hp<f.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(!z)continue;
 a.ap--;record(a,z,-(16+a.atk*.3|0),'癒しの灯');acted=true;break;
 }
 const front=foes.filter(f=>f.slot<3),ranged=['bow','magic'].includes(a.weapon),eligible=ranged||!front.length?[...foes]:[...front];
 eligible.sort((x,y)=>rule.target==='lowest'?x.hp/x.maxHp-y.hp/y.maxHp:rule.target==='healer'?Number(y.weapon==='staff')-Number(x.weapon==='staff'):rule.target==='back'?y.slot-x.slot:x.slot-y.slot);
 let z=eligible[0];if(!z)continue;
 // A shield bearer spends PP to cover a wounded rear-line ally.
 const cover=foes.find(f=>f.uid!==z.uid&&f.slot<3&&f.weapon==='lance'&&f.pp>0);
 if(cover&&z.slot>=3&&!['magic'].includes(a.weapon)){cover.pp--;z=cover;record(cover,cover,0,'庇う・前衛の誓い',false,true);}
 a.ap-=cost;const skill=rule.skill==='ultimate',crit=skill||random()<10;
 const bond=a.team==='ally'?Math.min(3,friends.filter(f=>(s.bonds[pairKey(a.hero,f.hero)]||0)>=2).length):0;
 const guarded=z.pp>0&&['lance','sword'].includes(z.weapon);if(guarded)z.pp--;
 const def=a.weapon==='magic'?Math.floor(z.def*.4):z.def;
 const damage=Math.max(1,Math.floor((a.atk+bond+(cost===2?9:0)-def-(guarded?5:0))*(crit?1.5:1)));
 record(a,z,damage,skill?(a.team==='ally'?heroById(a.hero).skill:'裂界の奥義'):rule.skill==='row'?'横列掃討':guarded?'攻撃・ガード':'攻撃',skill,false,crit);
 if(rule.skill==='row'||skill&&a.weapon==='magic')for(const other of foes.filter(f=>f.uid!==z.uid&&Math.floor(f.slot/3)===Math.floor(z.slot/3)&&f.hp>0))record(a,other,Math.floor(damage*.55),'波及する光',false,true);
 if(z.hp>0&&a.weapon==='magic'&&/celis|shizuku/.test(a.hero))z.status='stun';
 if(z.hp>0&&/ignis|tsubasa/.test(a.hero))z.status='burn';
 if(z.hp>0&&z.pp>0&&['axe','sword'].includes(z.weapon)){z.pp--;record(z,a,Math.max(1,Math.floor(z.atk*.65-a.def*.5)),'反応・反撃',false,true);}
 const medic=friends.find(f=>f.weapon==='staff'&&f.pp>0&&f.hp>0),wounded=friends.filter(f=>f.hp>0&&f.hp<f.maxHp*.5).sort((x,y)=>x.hp-y.hp)[0];
 if(medic&&wounded){medic.pp--;record(medic,wounded,-12,'反応・応急手当',false,true);}
 acted=true;break;
 }
 if(!acted)a.ap=0;
 if(a.status==='burn'&&a.hp>0)record(a,a,4,'熾火の継続ダメージ',false,true);
 }
 if(!alive('ally').length||!alive('enemy').length||!fighters.some(f=>f.hp>0&&f.ap>0))break;
 }
 const ratio=(team:string)=>{const fs=fighters.filter(f=>f.team===team);return fs.reduce((v,f)=>v+f.hp,0)/fs.reduce((v,f)=>v+f.maxHp,0);};
 const before=(squad:Squad)=>squad.members.reduce((n,f)=>n+f.hp,0),after=(team:string)=>fighters.filter(f=>f.team===team).reduce((n,f)=>n+f.hp,0);
 return {ally:ally.id,enemy:enemy.id,events,index:0,final:fighters,winner:ratio('ally')>=ratio('enemy')?'ally':'enemy',allyLoss:before(ally)-after('ally'),enemyLoss:before(enemy)-after('enemy'),support};
}
