import {techniqueFor,defaultHeroTactics} from './techniques';
import {heroById,pairKey} from './roster';
import type {Campaign,Squad,Fighter,Encounter,CombatEvent,Tactic} from './types';
export const DEFAULT_TACTICS:Tactic[]=[{skill:'heal',condition:'wounded',target:'lowest'},{skill:'ultimate',condition:'many',target:'healer'},{skill:'strike',condition:'always',target:'front'}];
export const RULE_LABELS={strike:'通常攻撃（1AP）',ultimate:'固有必殺（2AP）',heal:'味方を回復（1AP・杖）',row:'一列攻撃（2AP）',guard:'守りを固める（1AP）',rally:'戦意を高める（1AP）',cleanse:'状態を整える（1AP）',break:'防具を崩す（1AP）',quick:'連続攻撃（2AP）',execute:'好機を仕留める（2AP）'};
export const CONDITION_LABELS={always:'常に',wounded:'味方HPが50%以下',many:'敵が2人以上',armored:'重装の敵がいる',selfwounded:'自分HPが50%以下',critical:'自分HPが25%以下',allycritical:'味方HPが25%以下',single:'敵が1人',first:'最初の行動巡',later:'2巡目以降',rear:'敵の後衛がいる',caster:'敵の術師がいる',enemywounded:'敵HPが50%以下',afflicted:'味方が状態異常',reserve:'自分APが3以上',healthy:'自分HPが75%以上'};
export const TARGET_LABELS={lowest:'HPが低い相手',front:'前衛を優先',back:'後衛を優先',healer:'回復役を優先',strongest:'攻撃が高い相手',fastest:'素早い相手',softest:'防御が低い相手',armored:'重装を優先',caster:'術師を優先',mosthp:'最大HPが高い相手',mostap:'APが多い相手',self:'自分（支援技）'};
export function resolveEncounter(s:Campaign,ally:Squad,enemy:Squad,supports:Squad[]=[]):Encounter{
 const fighters=JSON.parse(JSON.stringify([...ally.members,...enemy.members])) as Fighter[];
 const mods=new Map<string,{atk:number;def:number}>();
 const mod=(f:Fighter)=>{if(!mods.has(f.uid))mods.set(f.uid,{atk:0,def:0});return mods.get(f.uid)!;};
 const atk=(f:Fighter)=>Math.max(1,f.atk+mod(f).atk),defense=(f:Fighter)=>Math.max(0,f.def+mod(f).def);
 const choose=(fs:Fighter[],rule:Tactic,a:Fighter)=>[...fs].filter(f=>rule.target!=='self'||f.uid===a.uid).sort((x,y)=>rule.target==='lowest'?x.hp/x.maxHp-y.hp/y.maxHp:rule.target==='strongest'?atk(y)-atk(x):rule.target==='fastest'?y.speed-x.speed:rule.target==='softest'?defense(x)-defense(y):rule.target==='mosthp'?y.maxHp-x.maxHp:rule.target==='mostap'?y.ap-x.ap:rule.target==='armored'?Number(y.weapon==='lance')-Number(x.weapon==='lance'):rule.target==='caster'?Number(y.weapon==='magic')-Number(x.weapon==='magic'):rule.target==='healer'?Number(y.weapon==='staff')-Number(x.weapon==='staff'):rule.target==='back'?y.slot-x.slot:x.slot-y.slot);
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
 if(a.status==='stun'){a.status=undefined;a.ap--;events.push({actor:a.uid,target:a.uid,actorHero:a.hero,targetHero:a.hero,damage:0,hp:a.hp,crit:false,skill:false,heal:false,passive:true,name:'妨害による行動中断'});continue;}
 const friends=alive(a.team),foes=alive(a.team==='ally'?'enemy':'ally');
 const lv=1+Math.floor((s.xp[a.hero]||0)/100);
 const tactics=a.team==='ally'?(s.tactics[a.hero]||defaultHeroTactics(a.hero,lv)):DEFAULT_TACTICS;
 let acted=false;
 for(const rule of tactics){
 if(rule.condition==='wounded'&&!friends.some(f=>f.hp/f.maxHp<=.5)||rule.condition==='many'&&foes.length<2||rule.condition==='armored'&&!foes.some(f=>f.weapon==='lance')||rule.condition==='selfwounded'&&a.hp>a.maxHp*.5||rule.condition==='critical'&&a.hp>a.maxHp*.25||rule.condition==='allycritical'&&!friends.some(f=>f.hp<=f.maxHp*.25)||rule.condition==='single'&&foes.length!==1||rule.condition==='first'&&round!==0||rule.condition==='later'&&round===0||rule.condition==='rear'&&!foes.some(f=>f.slot>=3)||rule.condition==='caster'&&!foes.some(f=>f.weapon==='magic')||rule.condition==='enemywounded'&&!foes.some(f=>f.hp<=f.maxHp*.5)||rule.condition==='afflicted'&&!friends.some(f=>f.status)||rule.condition==='reserve'&&a.ap<3||rule.condition==='healthy'&&a.hp<a.maxHp*.75)continue;
 const tech=techniqueFor(a.hero,rule.skill);
 if(tech){
  if(a.team==='ally'&&lv<tech.level||a.ap<tech.cost)continue;
  const personal=rule.skill.startsWith('art'),effect=tech.effect;
  if(['mend','renew','guard','rally','cleanse'].includes(effect)){
   const eligible=friends.filter(f=>effect==='mend'||effect==='renew'?f.hp<f.maxHp:effect==='cleanse'?!!f.status:effect==='guard'?mod(f).def<8||f.pp<3:mod(f).atk<6);
   const z=choose(eligible,rule,a)[0];if(!z)continue;a.ap-=tech.cost;
   const targets=effect==='renew'?friends.filter(f=>Math.floor(f.slot/3)===Math.floor(z.slot/3)&&f.hp<f.maxHp):[z];
   for(const target of targets){
    if(effect==='guard'){mod(target).def=Math.min(8,mod(target).def+4);target.pp=Math.min(3,target.pp+1);record(a,target,0,tech.name,personal);}
    else if(effect==='rally'){mod(target).atk=Math.min(6,mod(target).atk+3);record(a,target,0,tech.name,personal);}
    else{if(effect==='cleanse')target.status=undefined;record(a,target,-(effect==='cleanse'?6:effect==='renew'?14+Math.floor(atk(a)*.35):20+Math.floor(atk(a)*.35)),tech.name,personal);}
   }
  }else{
   const front=foes.filter(f=>f.slot<3),ranged=['bow','magic'].includes(a.weapon)||effect==='snipe';
   let z=choose(ranged||!front.length?foes:front,rule,a)[0];if(!z)continue;
   const cover=effect!=='sweep'&&z.slot>=3&&a.weapon!=='magic'?foes.find(f=>f.uid!==z.uid&&f.slot<3&&f.weapon==='lance'&&f.pp>0):undefined;
   if(effect==='stun'&&z.status==='stun'||effect==='burn'&&z.status==='burn'||effect==='sunder'&&mod(z).def<=-6||effect==='weaken'&&mod(z).atk<=-6)continue;
   if(cover){cover.pp--;z=cover;record(cover,cover,0,'庇う・前衛の誓い',false,true);}
   a.ap-=tech.cost;const targets=effect==='sweep'?foes.filter(f=>Math.floor(f.slot/3)===Math.floor(z.slot/3)):[z];
   for(const target of targets)for(let hit=0;hit<(effect==='flurry'?2:1)&&target.hp>0&&a.hp>0;hit++){
    const power=effect==='assault'?1.25:effect==='sweep'?.85:effect==='snipe'?1.15:effect==='flurry'?.70:effect==='execute'?(target.hp<=target.maxHp*.5?1.75:1.05):effect==='weaken'?.8:1;
    const guarded=target.pp>0&&['lance','sword'].includes(target.weapon);if(guarded)target.pp--;
    const armor=defense(target)*(effect==='pierce'?.25:a.weapon==='magic'?.4:1),damage=Math.max(1,Math.floor((atk(a)+2+(tech.cost===2?4:0)-armor-(guarded?5:0))*power));
    record(a,target,damage,tech.name,personal);
    if(effect==='drain'&&a.hp<a.maxHp)record(a,a,-Math.max(1,Math.floor(damage*.5)),tech.name,false,true);
    if(target.hp>0){if(effect==='stun')target.status='stun';if(effect==='burn')target.status='burn';if(effect==='sunder')mod(target).def=Math.max(-6,mod(target).def-3);if(effect==='weaken')mod(target).atk=Math.max(-6,mod(target).atk-3);
     if(target.pp>0&&['axe','sword'].includes(target.weapon)){target.pp--;record(target,a,Math.max(1,Math.floor(atk(target)*.65-defense(a)*.5)),'反応・反撃',false,true);}
    }
   }
  }
  acted=true;break;
 }
 const cost=rule.skill==='ultimate'||rule.skill==='row'?2:1;if(a.ap<cost)continue;
 if(rule.skill==='heal'){
 if(a.weapon!=='staff')continue;const z=choose(friends.filter(f=>f.hp<f.maxHp),rule,a)[0];if(!z)continue;
 a.ap--;record(a,z,-(16+a.atk*.3|0),'癒しの灯');acted=true;break;
 }
 const front=foes.filter(f=>f.slot<3),ranged=['bow','magic'].includes(a.weapon),eligible=ranged||!front.length?[...foes]:[...front];

 let z=choose(eligible,rule,a)[0];if(!z)continue;
 // A shield bearer spends PP to cover a wounded rear-line ally.
 const cover=foes.find(f=>f.uid!==z.uid&&f.slot<3&&f.weapon==='lance'&&f.pp>0);
 if(cover&&z.slot>=3&&!['magic'].includes(a.weapon)){cover.pp--;z=cover;record(cover,cover,0,'庇う・前衛の誓い',false,true);}
 a.ap-=cost;const skill=rule.skill==='ultimate',crit=skill||random()<10;
 const bond=a.team==='ally'?Math.min(3,friends.filter(f=>(s.bonds[pairKey(a.hero,f.hero)]||0)>=2).length):0;
 const guarded=z.pp>0&&['lance','sword'].includes(z.weapon);if(guarded)z.pp--;
 const def=a.weapon==='magic'?Math.floor(defense(z)*.4):defense(z);
 const damage=Math.max(1,Math.floor((atk(a)+bond+(cost===2?9:0)-def-(guarded?5:0))*(crit?1.5:1)));
 record(a,z,damage,skill?(a.team==='ally'?heroById(a.hero).skill:'裂界の奥義'):rule.skill==='row'?'横列掃討':guarded?'攻撃・ガード':'攻撃',skill,false,crit);
 if(rule.skill==='row'||skill&&a.weapon==='magic')for(const other of foes.filter(f=>f.uid!==z.uid&&Math.floor(f.slot/3)===Math.floor(z.slot/3)&&f.hp>0))record(a,other,Math.floor(damage*.55),'波及する光',false,true);
 if(z.hp>0&&a.weapon==='magic'&&/celis|shizuku/.test(a.hero))z.status='stun';
 if(z.hp>0&&/ignis|tsubasa/.test(a.hero))z.status='burn';
 if(z.hp>0&&z.pp>0&&['axe','sword'].includes(z.weapon)){z.pp--;record(z,a,Math.max(1,Math.floor(atk(z)*.65-defense(a)*.5)),'反応・反撃',false,true);}
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
