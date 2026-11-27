import { REGIONS, type Copy } from './campaign';
import { HEROES, JOBS, COMBOS, ITEMS, LINK_MAX, type Combo, type DeckCard, type Element, type ItemId, type Skill, type Target, type Technique } from './catalog';
import { battleDeck, inRange, randomState, resolveParts, stats, type Adventure, type Encounter, type HeroState, type Win } from './adventure';

export type Intent = 'attack'|'charge'|'ward'|'venom'|'mirror'|'seal'|'summon'|'shift'|'jam'|'heal';
type Species = 'slime'|'moth'|'hound'|'sentinel'|'wisp'|'drake'|'ray'|'squid'|'roc'|'machine'|'lantern'|'book';
export type Enemy = { id:string; name:Copy; hp:number; power:number; first:Intent[]; second?:Intent[]; weakTo:Element; color:string; art:Species; region:number; boss?:boolean; part?:boolean };
const FOE_NAMES: readonly (readonly Copy[])[] = [
  [['露つむり','Dewsnail'],['灯羽ガ','Lamplight Moth'],['土すずの山犬','Claybell Hound'],['夜光露つむり','Glowcap Dewsnail']],
  [['書庫ネズミ','Archive Rat'],['帳簿の歯車兵','Ledger Cog'],['振り子の火','Pendulum Wisp'],['ぜんまいの公爵','Clockwork Duke']],
  [['雨晶の鬼火','Rainshard Wisp'],['鏡羽の蛾','Mirror Moth'],['小晶竜','Shardling Drake'],['七彩の種竜','Seed of Seven Colors']],
  [['手紙を飲むエイ','Letter Ray'],['行灯イカ','Lantern Squid'],['泥鐘の番兵','Mirebell Sentry'],['インクを吐く大墨魚','Inky Colossus']],
  [['雲糸のハチ','Cloudthread Hornet'],['気流鳥','Aircurrent Bird'],['風見の小竜','Weathervane Drake'],['瓶底の嵐','Bottled Storm']],
  [['文字のない本','Blank Volume'],['余白の衛兵','Margin Guard'],['書き直しの影','Revision Wraith'],['無銘の前触れ','Nameless Herald']],
  [['星砂の雫','Star-Sand Drop'],['余韻の見張り','Aftertone Watcher'],['月裏の翼','Far-Moon Wing'],['星砂の玉座','Star-Sand Throne']],
];
const SPECIES: Species[][]=[['slime','moth','hound','slime'],['hound','sentinel','wisp','machine'],['wisp','moth','drake','drake'],
  ['ray','squid','sentinel','squid'],['moth','roc','drake','wisp'],['book','sentinel','wisp','machine'],['slime','lantern','roc','machine']];
const PATTERNS: Intent[][][] = [
  [['attack','ward'],['venom','attack'],['attack','attack','charge'],['heal','mirror','venom']],
  [['attack','jam'],['ward','charge','attack'],['seal','attack'],['summon','attack','charge']],
  [['shift','attack'],['mirror','attack'],['venom','charge','attack'],['shift','mirror','seal']],
  [['attack','seal'],['venom','attack','jam'],['ward','attack','charge'],['jam','venom','heal']],
  [['attack','ward'],['seal','charge','attack'],['shift','attack','venom'],['charge','summon','shift']],
  [['ward','jam'],['mirror','attack','charge'],['seal','attack','venom'],['summon','charge','shift']],
  [['venom','heal'],['ward','mirror','charge'],['seal','venom','attack'],['shift','charge','summon']],
];
const BOSS_PHASES: [Species,Intent[],Intent[],Element,string][] = [
  ['lantern',['ward','attack','charge'],['mirror','charge','attack'],'storm','#cfa666'],
  ['machine',['summon','ward','charge'],['jam','attack','seal','charge'],'storm','#b69066'],
  ['drake',['shift','mirror','attack'],['shift','charge','venom','attack'],'dark','#9b92f2'],
  ['squid',['venom','seal','attack'],['venom','heal','charge','jam'],'storm','#59c2b3'],
  ['roc',['ward','shift','charge'],['charge','seal','summon','charge'],'ice','#6ba7df'],
  ['book',['summon','jam','mirror','charge'],['shift','charge','seal','venom','charge'],'light','#c697de'],
  ['machine',['shift','summon','jam','charge'],['mirror','charge','heal','charge','seal'],'fire','#e4c38d'],
];
const COLORS=['#8cbd6c','#c8ae77','#a78ed4','#65b9b6','#a0c9e1','#947a9f','#edb98b'];
const WEAKNESSES: Element[]=['fire','storm','dark','storm','ice','light','fire'];
export const FOES: Record<string,Enemy> = Object.fromEntries(REGIONS.flatMap((r,i)=>{
  const [art,first,second,weakTo,color]=BOSS_PHASES[i];
  const regular=FOE_NAMES[i].map((name,j):Enemy=>({
    id:`r${i}foe${j}`,name,region:i,hp:16+i*8+j*4,power:5+i*3+j,first:PATTERNS[i][j],
    weakTo:j===2?'light':WEAKNESSES[i],color:COLORS[i],art:SPECIES[i][j],
  }));
  regular.push({id:`r${i}boss`,name:r.boss,region:i,hp:94+i*52,power:9+i*4,first,second,weakTo,color,art,boss:true});
  if(i>=2)regular.push({id:`r${i}part`,name:[
    ['','','反照竜の鏡片','深潮の小鐘','災翼の張り弦','忘却機関の制御書','星喰いの星砂'][i],
    ['','','Drake’s Mirror Scale','Undertone Bell','Cloudstring Rig','Engine’s Control Volume','Star-Eater’s Crown'][i],
  ],region:i,hp:30+i*9,power:5+i*2,first:['ward','seal','attack'],weakTo:i%2===0?'storm':'wind',color,art:i===3?'lantern':i===5?'book':'sentinel',part:true});
  return regular.map(enemy=>[enemy.id,enemy]);
}));
export type Status = { block:number; poison:number; weak:number; expose:number; reflect:number; power:number; sealed:number; };
type Gauge = { energy:number; limit:number; nextDraw:number; nextEnergy:number; focus:number; transformed:boolean; played:number; recalled:boolean; actions:number; freeItem:boolean };
export type PlayedCard = { id:number; value:DeckCard; temporary?:boolean; jam?:boolean };
export type Fighter = Status & Gauge & { id:string; hp:number; max:number; hero:HeroState; hand:PlayedCard[]; draw:PlayedCard[]; discard:PlayedCard[] };
export type Opponent = Status & { id:string; spec:Enemy; hp:number; max:number; ordinal:number; phase:number; intent:Intent; target:string; weakness:Element };
export type Pulse = { id:number; from?:string; to:string; art:'blade'|'cast'|'block'|'heal'|'status'|'critical'|'summon'|'transform'|'phase'|'hit'|'victory'|'gesture'; element:Element; value?:number };
export type ActionCue = { name:Copy; parts:Technique[]; actor:string; kind:'card'|'link'|'finale' };
export type Battle = {
  encounter:Encounter; party:Fighter[]; enemies:Opponent[]; turn:number; link:number; spentStudy:boolean; outcome?:'win'|'loss'|'escape';
  serial:number; rng:number; pulses:Pulse[]; history:Copy[]; learnedHelped:boolean; items:Adventure['items']; relics:string[]; cycle:number; comboActors?:string[]; cue?:ActionCue;
};
const zeroStatus: Status={block:0,poison:0,weak:0,expose:0,reflect:0,power:0,sealed:0};
export { LINK_MAX } from './catalog';
export const LIMIT_MAX=9;
const MAX_ACTIONS=8;
const ALIVE= (unit:{hp:number})=>unit.hp>0;
const elementCycle:Element[]=['fire','ice','storm','wind','light','dark'];
export const orderOf = (b:Battle, id:string)=>b.party.find(p=>p.id===id);
export const fighter = (b:Battle, id:string)=>b.party.find(p=>p.id===id&&p.hp>0);
export const opponent = (b:Battle, id:string)=>b.enemies.find(e=>e.id===id&&e.hp>0);
export const living = (b:Battle)=>b.enemies.filter(ALIVE);
function tell(b:Battle,line:Copy){b.history=[line,...b.history].slice(0,12);}
function animate(b:Battle,to:string,art:Pulse['art'],element:Element,from?:string,value?:number){b.pulses.push({id:++b.serial,from,to,art,element,value});}
function random(b: Battle){const [next,value]=randomState(b.rng);b.rng=next;return value;}
function shuffled<T>(b:Battle,list:T[]){
  const values=list.slice();
  for(let i=values.length-1;i>0;i--){ const j=Math.floor(random(b)*(i+1));[values[i],values[j]]=[values[j],values[i]]; }
  return values;
}
function draw(b:Battle,p:Fighter,count:number){
  for(let i=0;i<count&&p.hand.length<7;i++){
    if(!p.draw.length){p.draw=shuffled(b,p.discard);p.discard=[];}
    const card=p.draw.shift();
    if(!card)break;
    p.hand.push(card);
  }
}
const hasRelic=(b:Battle,p:Fighter,id:string)=>b.relics.includes(id)||p.hero.relic===id;
function addBlock(b:Battle,p:Fighter,amount:number,witness=p){
  p.block=inRange(p.block+amount,0,80);
  const passive=HEROES[p.id].passive;
  if(passive==='moon')p.reflect=Math.min(20,p.reflect+Math.ceil(amount/3));
  if(passive==='echo'||passive==='riposte')p.reflect=Math.min(20,p.reflect+2);
  animate(b,p.id,'block','ice',witness.id,amount);
}
function heal(b:Battle,p:Fighter,amount:number,caster:Fighter){
  const passive=HEROES[caster.id].passive;
  const n=amount+(passive==='hearty'?3:0)+(hasRelic(b,caster,'moonstone')?3:0);
  const restored=Math.max(0,Math.min(p.max-p.hp,n));
  p.hp+=restored;
  if(restored)animate(b,p.id,'heal','light',caster.id,restored);
  if((passive==='bloom'||hasRelic(b,caster,'moonstone'))&&n>restored)addBlock(b,p,Math.ceil((n-restored)/2),caster);
}
function harmful(p:Status){
  return p.poison>0||p.weak>0||p.expose>0||p.sealed>0;
}
const cleanse=(p:Status)=>{p.poison=0;p.weak=0;p.expose=0;p.sealed=0;};
function createEnemy(b:Battle,region:number,variant:number,boss=false,part=false):Opponent {
  const spec=FOES[`r${region}${part?'part':boss?'boss':`foe${variant}`}`];
  const hp=spec.hp+(b.cycle?Math.round(spec.hp*.18*Math.min(5,b.cycle)):0)+(b.encounter.hidden?23:0);
  return {...zeroStatus,id:`${spec.id}:${++b.serial}`,spec,hp,max:hp,ordinal:0,phase:1,intent:spec.first[0],target:'',weakness:spec.weakTo};
}
function plan(b:Battle,e:Opponent){
  const pattern=e.phase===2&&e.spec.second?e.spec.second:e.spec.first;
  e.intent=pattern[e.ordinal%pattern.length];
  if(e.intent==='summon'&&living(b).length>=4)e.intent='attack';
  if(e.intent==='heal'&&e.hp>e.max*.85)e.intent='attack';
  const members=b.party.filter(ALIVE);
  const front=members.filter(p=>!p.hero.rear);
  const focus=e.intent==='jam'||e.intent==='seal'?members:front.length?front:members;
  e.target=focus[Math.floor(random(b)*focus.length)]?.id??'';
}
export function createBattle(s:Adventure,encounter:Encounter):Battle {
  const b:Battle={encounter,party:[],enemies:[],turn:1,link:s.link??0,spentStudy:false,serial:0,rng:s.rng||1,pulses:[],history:[],
    learnedHelped:false,items:{...s.items},relics:s.partyRelic?[s.partyRelic]:[],cycle:s.cycle};
  b.party=s.party.map(id=>{
    const hero=s.heroes[id], base=stats(hero), d=battleDeck(hero).map(value=>({value:{...value},id:++b.serial}));
    // The opener always has one attack and one defensive card when available.
    const attacks = d.find(c=>resolveParts(c.value)[0]?.skill.damage);
    const guard = d.find(c=>resolveParts(c.value)[0]?.skill.block&&!resolveParts(c.value)[0].skill.damage);
    const prepared=[attacks,guard].filter((c):c is PlayedCard=>Boolean(c));
    const deck=shuffled(b,d.filter(c=>!prepared.includes(c)));
    deck.unshift(...prepared);
    const startHp=Math.max(1,hero.hp);
    return {...zeroStatus, id,hero,hp:startHp,max:base.hp,energy:0,limit:0,nextDraw:0,nextEnergy:0,focus:0,
      transformed:false,played:0,recalled:false,actions:0,freeItem:true,hand:[],draw:deck,discard:[]};
  });
  b.enemies=[createEnemy(b,encounter.region,encounter.variant,encounter.boss)];
  if(encounter.boss&&encounter.region>=2)b.enemies.push(createEnemy(b,encounter.region,0,false,true));
  else if(!encounter.boss&&b.party.length>=2&&(encounter.region>=1||encounter.variant>=2))b.enemies.push(createEnemy(b,encounter.region,(encounter.variant+1)%3));
  if(!encounter.boss&&b.party.length===4&&encounter.region>=3&&random(b)>.3)b.enemies.push(createEnemy(b,encounter.region,2));
  b.enemies.forEach(e=>plan(b,e));
  if(encounter.surprise==='party'){
    b.link=Math.min(LINK_MAX,b.link+3);
    tell(b,['先制攻撃！ 初手のエナジーと連携が増えた。','Preemptive strike! Opening energy and Link increased.']);
  }
  if(encounter.surprise==='foe'){
    for(const e of b.enemies)e.block=5;
    tell(b,['不意打ち！ 敵はブロックを得た。','Ambush! Foes start with block.']);
  }
  resetParty(b);
  b.pulses=[];
  return b;
}
function resetParty(b:Battle){
  for(const p of b.party.filter(ALIVE)){
    const hero=HEROES[p.id],r=stats(p.hero);
    p.discard.push(...p.hand.filter(c=>!c.temporary));
    p.hand=[];
    p.block=hero.passive==='guard'?3:0;
    if(hasRelic(b,p,'feather'))p.block+=3;
    p.energy=inRange(2+p.nextEnergy+r.energy+Number(b.turn===1&&(hero.passive==='tempo'||hasRelic(b,p,'hourglass')||b.encounter.surprise==='party')),0,5);
    const extra=Number(b.turn===1&&(hero.passive==='focus'||hasRelic(b,p,'bookmark')));
    draw(b,p,3+r.draw+extra+p.nextDraw);
    p.actions=0;p.freeItem=true;p.nextDraw=0;p.nextEnergy=0;p.focus=0;
  }
}
function updateResult(b:Battle){
  if(!b.enemies.some(ALIVE)){
    b.outcome='win';
    for(const p of b.party.filter(ALIVE))animate(b,p.id,'victory','light');
  }else if(!b.party.some(ALIVE))b.outcome='loss';
}
function withFreshEffects(source:Battle){
  // Render state is immutable between commands; catalog definitions stay shared.
  return {
    ...source,pulses:[] as Pulse[],comboActors:undefined as string[]|undefined,cue:undefined as ActionCue|undefined,history:source.history.slice(),items:{...source.items},
    party:source.party.map(p=>({...p,hand:p.hand.map(c=>({...c})),draw:p.draw.slice(),discard:p.discard.slice()})),
    enemies:source.enemies.map(e=>({...e})),
  };
}
export type ResolvedCard = { name:Copy; parts:Technique[]; cost:number; target:Target; rank:number; element?:Element; blocked?:boolean };
export function inspect(card:PlayedCard):ResolvedCard {
  const parts=resolveParts(card.value);
  if(card.jam||!parts.length)return {name:['空白札','Blank Card'],parts:[],cost:1,target:'self',rank:0,blocked:false};
  const target=parts.some(t=>t.target==='foe')?'foe':parts.some(t=>t.target==='ally')?'ally':parts[0].target;
  const name:Copy=parts.length===1?parts[0].name:[parts.map(t=>t.name[0]).join('・'),parts.map(t=>t.name[1]).join(' / ')];
  return {name,parts,cost:card.temporary?0:Math.max(...parts.map(t=>t.cost)),target,rank:card.value.rank??0,element:card.value.element};
}
export function explain(t:Technique,i:0|1,rank=0,element=t.element){
  function term(ja:string,en:string,n?:number) {return n?(i===0?`${ja}${n}`:`${en} ${n}`):'';}
  function flag(ja:string,en:string,val?:boolean){return val?(i===0?ja:en):'';}
  const s=t.skill;
  const effects=[
    term('威力','Power',s.damage?s.damage+rank*2:0)+(s.repeats?(i===0?` ×${s.repeats}`:` ×${s.repeats}`):''),
    term('防御','Block',s.block?s.block+rank*2:0),term('回復','Heal',s.heal?s.heal+rank*2:0),
    term('引く','Draw',s.draw),term('エナジー＋','Energy +',s.energy),term('毒','Poison',s.poison),term('弱体','Weak',s.weak),
    term('脆弱','Expose',s.expose),term('強化','Might',s.strength),term('反射','Reflect',s.reflect),term('次のドロー＋','Next draw +',s.nextDraw),
    term('次のエナジー＋','Next energy +',s.nextEnergy),term('捨て札を回収','Recall',s.recall),
    flag('結界を貫通','Piercing',s.pierce),flag('浄化','Cleanse',s.cleanse),flag('次の札を複製','Copy last card',s.copy),
    flag('手札強化','Upgrade hand',s.upgrade),flag('変身','Transform',s.transform),flag('召喚','Summon',s.summon),flag('戦闘中1回','Exhaust',s.exhaust),
  ].filter(Boolean).join(' · ');
  const labels:Record<Target,Copy>={foe:['敵単体','One enemy'],foes:['敵全体','All enemies'],self:['自分','Self'],ally:['味方単体','One ally'],party:['味方全体','All allies']};
  return `${labels[t.target][i]} · ${element==='steel'?'':elementLabel(element)[i]+' · '}${effects}`;
}
export const elementLabel=(element:Element):Copy=>({
  steel:['物理','Physical'],fire:['炎','Fire'],ice:['氷','Ice'],storm:['雷','Lightning'],wind:['風','Wind'],light:['光','Light'],dark:['闇','Dark'],
} satisfies Record<Element,Copy>)[element];

export function legalTarget(b:Battle,actor:string,target:Target,id:string){
  if(target==='foe')return Boolean(opponent(b,id));
  if(target==='ally')return Boolean(fighter(b,id));
  return target==='foes'?living(b).length>0:target==='self'?Boolean(fighter(b,actor)):b.party.some(ALIVE);
}
export function cursorTarget(b:Battle,actor:string,target:Target,enemy?:string,ally?:string){
  if(target==='foe'||target==='foes')return enemy&&opponent(b,enemy)?enemy:living(b)[0]?.id;
  if(target==='ally'&&ally&&fighter(b,ally))return ally;
  return fighter(b,actor)?.id;
}
export function canPlay(b:Battle,p:Fighter,card:PlayedCard){
  if(b.outcome||p.hp<=0||p.actions>=MAX_ACTIONS)return false;
  const resolved=inspect(card);
  return p.energy>=resolved.cost&&!(p.sealed>0&&resolved.parts.some(t=>t.element!=='steel'));
}
export const canAct = (b:Battle,p:Fighter)=>p.hand.some(c=>canPlay(b,p,c));
export function nextActingHero(b:Battle,id:string){
  const index=b.party.findIndex(p=>p.id===id), current=b.party[index];
  if(current&&canAct(b,current))return id;
  const ordered=[...b.party.slice(index+1),...b.party.slice(0,Math.max(0,index))];
  const energized=ordered.find(p=>p.energy>0&&canAct(b,p));
  if(energized)return energized.id;
  return ordered.find(p=>canAct(b,p))?.id??(current?.hp?id:b.party.find(ALIVE)?.id??id);
}
function rawEnemyDamage(b:Battle,e:Opponent,amount:number){
  const absorbed=Math.min(e.block,amount);e.block-=absorbed;
  e.hp=Math.max(0,e.hp-amount+absorbed);
}
function damage(b:Battle,p:Fighter,e:Opponent,s:Skill,element:Element,rank:number){
  const r=stats(p.hero),hero=HEROES[p.id],passive=hero.passive;
  const computedElement=element==='steel'&&JOBS[p.hero.job].style==='arcana'&&r.element?r.element:element;
  let base=(s.damage??0)+rank*2+(computedElement==='steel'?r.attack:r.magic)+p.power+p.focus;
  if(p.transformed)base+=3;
  if(passive==='resolve'&&p.actions<=1)base+=2;
  if(passive==='link'&&b.party.some(a=>a.id!==p.id&&a.actions>0))base+=3;
  if(passive==='heat'&&p.hp*2<=p.max)base+=4;
  if(passive==='spark'&&computedElement==='storm'||passive==='precision'&&computedElement==='ice')base+=3;
  if(passive==='gale'&&p.hero.rear&&(computedElement==='wind'||JOBS[p.hero.job].style==='flow'))base+=4;
  if(p.hero.rear&&computedElement==='steel'&&JOBS[p.hero.job].style!=='flow')base*=.88;
  if(p.weak>0)base*=.72;
  if(e.expose>0)base*=1.32;
  if(e.weakness===computedElement)base*=1.3;
  if(e.spec.boss&&!s.pierce&&b.enemies.some(ally=>ally.hp>0&&ally.spec.part))base*=.76;
  const critical=random(b)<(r.luck*.012+(p.focus>0?.22:0));
  if(critical)base*=1.5;
  for(let i=0;i<(s.repeats??1)&&e.hp>0;i++){
    const dealt=Math.max(1,Math.floor(base));
    const before=e.hp;
    if(s.pierce)e.hp=Math.max(0,e.hp-dealt);else rawEnemyDamage(b,e,dealt);
    animate(b,e.id,s.summon?'summon':critical?'critical':computedElement==='steel'?'blade':'cast',computedElement,p.id,before-e.hp);
    if(e.reflect>0 && !s.pierce){
      const reflected=Math.min(12,e.reflect);
      p.hp=Math.max(0,p.hp-reflected);
      e.reflect=0;
      animate(b,p.id,'hit','ice',e.id,reflected);
    }
  }
  maybePhase(b,e);
}
function maybePhase(b:Battle,e:Opponent){
  if(e.hp>0&&e.spec.boss&&e.phase===1&&e.hp<=e.max*.5){
    e.phase=2;e.ordinal=0;e.block=8;e.weakness=elementCycle[(e.spec.region+2)%elementCycle.length];
    animate(b,e.id,'phase','dark');
    tell(b,[`${e.spec.name[0]}が第二形態になった！`,`${e.spec.name[1]} shifts into its second phase!`]);
    plan(b,e);
  }
}
function applyTechnique(b:Battle,p:Fighter,t:Technique,chosen:string,rank=0,infusion?:Element){
  const s=t.skill, element=infusion??t.element;
  const targets=t.target==='foes'?living(b):t.target==='foe'?[opponent(b,chosen)??living(b)[0]].filter(Boolean):[];
  const allies=t.target==='party'?b.party.filter(ALIVE):t.target==='ally'?[fighter(b,chosen)??p]:[p];
  for(const e of targets){
    if(s.damage)damage(b,p,e,s,element,rank);
    if(s.poison)e.poison=Math.min(36,e.poison+s.poison+(HEROES[p.id].passive==='venom'?2:0));
    if(s.weak)e.weak=Math.min(5,e.weak+s.weak);
    if(s.expose)e.expose=Math.min(5,e.expose+s.expose);
    if(!s.damage&&(s.weak||s.poison||s.expose))animate(b,e.id,'status',element,p.id);
  }
  for(const ally of allies){
    if(s.block)addBlock(b,ally,s.block+rank*2,p);
    if(s.heal)heal(b,ally,s.heal+rank*2,p);
    if(s.cleanse&&harmful(ally)){cleanse(ally);animate(b,ally.id,'heal','light',p.id);}
    if(s.strength)ally.power=Math.min(18,ally.power+s.strength);
    if(s.reflect)ally.reflect=Math.min(20,ally.reflect+s.reflect);
    if(s.nextDraw)ally.nextDraw=Math.min(3,ally.nextDraw+s.nextDraw);
    if(s.nextEnergy)ally.nextEnergy=Math.min(3,ally.nextEnergy+s.nextEnergy);
  }
  if(s.block&&HEROES[p.id].passive==='ward'&&targets.some(e=>e.weak||e.poison))p.block+=3;
  if(!s.block&&HEROES[p.id].passive==='ward'&&targets.some(e=>e.weak||e.poison))addBlock(b,p,3);
  if(s.draw)draw(b,p,s.draw);
  if(s.energy)p.energy=Math.min(5,p.energy+s.energy);
  if(s.recall){
    for(let n=0;n<s.recall&&p.hand.length<7;n++){
      const index=p.discard.map(c=>inspect(c).parts.every(part=>!part.skill.recall&&!part.skill.copy)).lastIndexOf(true);
      if(index<0)break;
      const [card]=p.discard.splice(index,1);
      p.hand.push(card);
    }
  }
  if(s.copy){
    const last=p.discard.slice().reverse().find(c=>!c.temporary&&inspect(c).parts.every(part=>!part.skill.copy&&!part.skill.recall&&!part.skill.energy));
    if(last&&p.hand.length<7)p.hand.push({id:++b.serial,temporary:true,value:{...last.value}});
  }
  if(s.upgrade)p.hand=p.hand.map(card=>({...card,value:{...card.value,rank:Math.min(2,(card.value.rank??0)+1)}}));
  if(s.transform){p.transformed=true;p.power=Math.min(18,p.power+2);animate(b,p.id,'transform',element,p.id);}
  if(s.summon&&t.target==='foes')tell(b,['召喚が敵の陣形を襲った。','A summoning sweeps across the enemy formation.']);
  if(p.focus>0&&s.damage)p.focus=0;
  if(p.hp<=0)p.energy=0;
}
export function playCard(b:Battle,actor:string,cardId:number,target:string):Battle {
  const p=fighter(b,actor), c=p?.hand.find(card=>card.id===cardId);
  if(!p||!c||!canPlay(b,p,c))return b;
  const resolved=inspect(c);
  if(!legalTarget(b,actor,resolved.target,target))return b;
  const next=withFreshEffects(b),unit=fighter(next,actor)!;
  unit.hand=unit.hand.filter(card=>card.id!==cardId);
  unit.energy-=resolved.cost;unit.actions++;unit.played++;
  if(c.jam){tell(next,['空白札を処分した。','Discarded a blank card.']);return next;}
  next.cue={name:resolved.name,parts:resolved.parts,actor,kind:'card'};
  for(const part of resolved.parts)applyTechnique(next,unit,part,target,resolved.rank,resolved.element);
  if(next.pulses.length===0)animate(next,actor,'gesture',resolved.element??resolved.parts[0]?.element??'steel',actor);
  unit.limit=Math.min(LIMIT_MAX,unit.limit+1+Number(resolved.cost>=2));
  next.link=Math.min(LINK_MAX,next.link+1+Number(HEROES[actor].passive==='code')+Number(hasRelic(next,unit,'whistle'))+stats(unit.hero).link);
  const exhausted=c.temporary||resolved.parts.some(t=>t.skill.exhaust);
  if(HEROES[actor].passive==='recall'&&!unit.recalled&&!exhausted&&unit.hand.length<7){
    unit.recalled=true;unit.hand.push({...c,id:++next.serial});
  }else if(!exhausted)unit.discard.push(c);
  if(HEROES[actor].passive==='refrain'&&unit.played%3===0)draw(next,unit,1);
  tell(next,[`${HEROES[actor].name[0]} · ${resolved.name[0]}`,`${HEROES[actor].name[1]} · ${resolved.name[1]}`]);
  updateResult(next);
  return next;
}
export function availableCombos(b:Battle):Combo[]{
  return COMBOS.filter(c=>comboMembers(b,c).length>=2);
}
export function comboMembers(b:Battle,c:Combo) {
  const party=b.party.filter(ALIVE);
  if(c.full&&party.length!==4)return [];
  const needed=c.origins??c.jobs;
  if(!needed)return party.slice(0,2);
  const matched=new Set<Fighter>();
  for(const slot of needed){
    const hero=party.find(p=>!matched.has(p)&&(c.origins?HEROES[p.id].origin:p.hero.job)===slot);
    if(!hero)return [];
    matched.add(hero);
  }
  return c.full?party:party.filter(p=>matched.has(p));
}
export function useCombo(b:Battle,key:string,target:string):Battle {
  if(b.outcome||b.link<LINK_MAX)return b;
  const c=availableCombos(b).find(c=>c.id===key);
  if(!c)return b;
  const members=comboMembers(b,c);
  if(!members[0]||!legalTarget(b,members[0].id,c.tech.target,target))return b;
  const next=withFreshEffects(b);
  next.link=0;next.comboActors=members.map(p=>p.id);
  next.cue={name:c.name,parts:[c.tech],actor:members[0].id,kind:'link'};
  applyTechnique(next,fighter(next,members[0].id)!,c.tech,target);
  for(const member of members)animate(next,member.id,'transform',c.tech.element,member.id);
  tell(next,[`連携 · ${c.name[0]}`,`Link · ${c.name[1]}`]);updateResult(next);
  return next;
}
export function useLimit(b:Battle,actor:string,target:string):Battle {
  const p=fighter(b,actor),t=HEROES[actor]?.limit;
  if(!p||!t||b.outcome||p.limit<LIMIT_MAX||!legalTarget(b,actor,t.target,target))return b;
  const next=withFreshEffects(b),unit=fighter(next,actor)!;
  unit.limit=0;next.comboActors=[actor];
  next.cue={name:t.name,parts:[t],actor,kind:'finale'};
  applyTechnique(next,unit,t,target);
  animate(next,actor,'transform',t.element,actor);
  tell(next,[`決め技 · ${t.name[0]}`,`Finale · ${t.name[1]}`]);updateResult(next);
  return next;
}
export function battleItem(b:Battle,id:ItemId,actor:string,target:string):Battle {
  const p=fighter(b,actor),t=orderOf(b,target);
  if(!p||!t||b.outcome||!p.freeItem||b.items[id]<1||id==='oil'||(id==='dew'?t.hp>0:t.hp<=0))return b;
  if(t.hp===t.max&&(id==='tonic'||id==='salve'&&!harmful(t)))return b;
  const next=withFreshEffects(b),caster=fighter(next,actor)!,ally=orderOf(next,target)!;
  const craft=caster.hero.job==='alchemist';
  next.items[id]--;caster.freeItem=false;
  if(id==='dew'){ally.hp=Math.ceil(ally.max*.5);animate(next,ally.id,'heal','light',caster.id,ally.hp);}
  if(id==='tonic')heal(next,ally,craft?32:24,caster);
  if(id==='salve'){heal(next,ally,craft?16:10,caster);cleanse(ally);}
  tell(next,ITEMS[id].name);return next;
}
export function studyBonus(b:Battle,actor:string,correct:boolean):Battle {
  const p=fighter(b,actor);
  if(b.outcome||b.spentStudy||!p)return b;
  const next=withFreshEffects(b),unit=fighter(next,actor)!;
  next.spentStudy=true;
  if(correct){
    unit.energy=Math.min(5,unit.energy+1);unit.focus=3;unit.limit=Math.min(LIMIT_MAX,unit.limit+2);
    next.learnedHelped=true;next.link=Math.min(LINK_MAX,next.link+(unit.hero.job==='scholar'?4:3));draw(next,unit,1);
    cleanse(unit);
    animate(next,actor,'transform','light');
    tell(next,['知識のひらめき · エナジー＋1、ドロー＋1、次の攻撃を強化','Insight · +1 energy, draw +1, next attack strengthened']);
  }else tell(next,['解き直しに記録した。戦闘はそのまま続く。','Saved for review. Continue the fight.']);
  return next;
}
const intentBase: Record<Intent,Copy> = {
  attack:['狙い撃ち','Attack'],charge:['大技の予兆','Heavy attack'],ward:['防御を固める','Builds a ward'],venom:['毒をまく','Spreads venom'],mirror:['反射を構える','Raises a mirror'],
  seal:['属性札を封じる','Seals elemental cards'],summon:['仲間を呼ぶ','Calls allies'],shift:['弱点を切り替える','Shifts weakness'],jam:['手札に空白を混ぜる','Adds blanks to the deck'],heal:['修復する','Repairs itself'],
};
export function describeIntent(e:Opponent):Copy{
  if(e.spec.boss&&e.intent==='charge')return REGIONS[e.spec.region].signature;
  return intentBase[e.intent];
}
function hitParty(b:Battle,e:Opponent,p:Fighter,multiplier:number,kind:'steel'|'dark'){
  const base=stats(p.hero), raw=Math.max(1,Math.floor((e.spec.power+e.power+Math.min(6,b.cycle)*(e.spec.region+1))*multiplier*(e.weak?.72:1)*(p.expose?1.25:1)));
  const armor=(kind==='steel'?base.ward:base.resist)+Number(hasRelic(b,p,'atlas'))*2+(p.hero.rear&&kind==='steel'?1:0);
  const amount=Math.max(1,raw-Math.floor(armor*.6)), absorb=Math.min(p.block,amount);
  p.block-=absorb;p.hp=Math.max(0,p.hp-(amount-absorb));
  if(absorb&&p.reflect){
    rawEnemyDamage(b,e,p.reflect);animate(b,e.id,'cast','ice',p.id,p.reflect);p.reflect=0;
  }
  if(HEROES[p.id].passive==='gale'&&p.hp===p.max&&absorb) {p.nextDraw=Math.min(3,p.nextDraw+1);rawEnemyDamage(b,e,2);}
  p.limit=Math.min(LIMIT_MAX,p.limit+Number(amount-absorb>0));
  animate(b,p.id,amount-absorb>0?'hit':'block',kind,e.id,amount-absorb);
}
function actEnemy(b:Battle,e:Opponent){
  const target=fighter(b,e.target)??b.party.filter(ALIVE)[0];
  if(!target)return;
  if(e.intent==='attack')hitParty(b,e,target,1,'steel');
  if(e.intent==='charge'){
    if(e.spec.boss&&e.phase===2){for(const p of b.party.filter(ALIVE))hitParty(b,e,p,.85,'dark');}
    else hitParty(b,e,target,1.8,'steel');
  }
  if(e.intent==='ward'){e.block=Math.min(30,e.block+e.spec.power+4);animate(b,e.id,'block','ice');}
  if(e.intent==='mirror'){e.reflect=6+e.spec.region;e.block+=3;animate(b,e.id,'block','ice');}
  if(e.intent==='venom'){
    hitParty(b,e,target,.52,'dark');target.poison=Math.min(16,target.poison+3+Math.floor(e.spec.region/2));
    animate(b,target.id,'status','dark',e.id);
  }
  if(e.intent==='seal'){target.sealed=1;target.weak=Math.max(target.weak,1);animate(b,target.id,'status','dark',e.id);}
  if(e.intent==='jam'){
    target.draw.splice(1,0,{id:++b.serial,value:{key:'field-note'},jam:true,temporary:true});animate(b,target.id,'status','dark',e.id);
  }
  if(e.intent==='shift'){
    const index=elementCycle.indexOf(e.weakness);
    e.weakness=elementCycle[(index+1)%elementCycle.length];e.power=Math.min(16,e.power+2);animate(b,e.id,'phase',e.weakness);
  }
  if(e.intent==='summon'&&living(b).length<4){
    const newcomer=createEnemy(b,e.spec.region,0);
    b.enemies.push(newcomer);animate(b,newcomer.id,'summon','dark',e.id);
  }
  if(e.intent==='heal'){
    const old=e.hp;e.hp=Math.min(e.max,e.hp+8+e.spec.region*2);animate(b,e.id,'heal','light',undefined,e.hp-old);
  }
  const move=describeIntent(e);
  tell(b,[`${e.spec.name[0]} · ${move[0]}`,`${e.spec.name[1]} · ${move[1]}`]);
  e.ordinal++;
}
function tickPoison(b:Battle,u:Fighter|Opponent){
  if(u.poison<=0||!ALIVE(u))return;
  const old=u.hp;u.hp=Math.max(0,u.hp-u.poison);u.poison=Math.max(0,u.poison-1);
  animate(b,u.id,'status','dark',undefined,old-u.hp);
}
export function endTurn(b:Battle):Battle {
  if(b.outcome)return b;
  const next=withFreshEffects(b);
  for(const p of next.party){
    if(p.sealed>0)p.sealed--;
    if(p.weak>0)p.weak--;
    if(p.expose>0)p.expose--;
  }
  const current=living(next);
  for(const e of current){
    tickPoison(next,e);
    maybePhase(next,e);
    if(e.hp>0&&next.party.some(ALIVE))actEnemy(next,e);
    if(e.weak>0)e.weak--;if(e.expose>0)e.expose--;
  }
  for(const p of next.party)tickPoison(next,p);
  updateResult(next);
  if(!next.outcome){
    next.turn++;next.spentStudy=false;
    resetParty(next);
    for(const e of living(next))plan(next,e);
  }
  return next;
}
export function flee(b:Battle):Battle{
  if(b.outcome||b.encounter.boss)return b;
  return {...withFreshEffects(b),outcome:'escape'};
}
export function victory(b:Battle):Win {
  const r=b.encounter.region,boss=b.encounter.boss, rare=b.encounter.variant===3||b.encounter.hidden;
  const xp=(boss?65+r*32:18+r*7+(rare?13:0))+(b.encounter.rush===6?80:0);
  const names=[...new Set(b.enemies.map(e=>e.spec.id))];
  return {xp,mastery:boss?4:rare?3:2,gold:boss?64+r*36:13+r*6+(rare?19:0),enemyIds:names,
    hp:Object.fromEntries(b.party.map(p=>[p.id,p.hp])),
    card:boss&&r>=5?'remnant':boss?'artifact':rare?r>=4?'transfigure':'turnpage':undefined};
}
