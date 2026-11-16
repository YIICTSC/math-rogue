import {resolveHeroTechnique,clampKochoFocus} from '../techniques';
import type {KochoHeroId} from '../guests';
import {VECTORS,distance,type FieldState,type FieldCard,type FieldEnemy,type FieldAction,type Point,type Direction} from './types';
export const FIELD_RULES={lanes:3,initialWidth:50,stageGrowth:8,wakeDistance:5,forgetDistance:8,maxActive:4,coinChance:.28,fusionPrice:20};
export const STAGE_NAMES=['校門の放課後','階段の踊り場','購買前の補給路','体育館の夕風','図書室の静かな道','屋上への渡り廊下','校長室への最後の道'];
const uid=()=>globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`;
const copy=(s:FieldState):FieldState=>JSON.parse(JSON.stringify(s));
const rand=(s:FieldState)=>{s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;};
const add=(p:Point,d:Direction,n=1):Point=>({x:p.x+VECTORS[d].x*n,y:p.y+VECTORS[d].y*n});
const inside=(s:FieldState,p:Point)=>p.x>=0&&p.x<s.width&&p.y>=0&&p.y<3;
const same=(a:Point,b:Point)=>a.x===b.x&&a.y===b.y;
const occupied=(s:FieldState,p:Point,exclude?:string)=>s.enemies.some(e=>e.hp>0&&e.id!==exclude&&same(e,p));
const log=(s:FieldState,text:string)=>{s.logs=[...s.logs,text].slice(-24);};
export function initialField(hero:KochoHeroId,deck:FieldCard[],seed=(Date.now()>>>0)):FieldState {
 const s:FieldState={version:1,hero,stage:1,width:50,player:{x:0,y:1},facing:'right',hp:20,maxHp:20,shield:0,barrier:0,strength:0,focus:0,hand:deck.map(c=>({...c,currentCooldown:0})),queue:[],enemies:[],buildings:[],drops:[],money:60,relics:[],items:['C_MILK'],specialCD:0,turn:0,status:'play',logs:[],events:[],seed,seen:[],purchased:[]};
 return stageField(s,1);
}
export function stageField(previous:FieldState,stage:number):FieldState {
 const s=copy(previous);s.stage=stage;s.width=50+(stage-1)*8;s.player={x:0,y:1};s.facing='right';s.status='play';s.queue=[];s.specialCD=0;s.drops=[];s.purchased=[];s.events=[];
 s.hp=Math.min(s.maxHp,s.hp+(stage===1?0:7));s.shield=s.relics.includes('R_SHIELD')?4:0;s.hand=s.hand.map(c=>({...c,currentCooldown:0}));
 s.buildings=[{id:'school',name:'放課後の学校',x:7,y:0},{id:'shop',name:'よりみち商店',x:18,y:0},{id:'arcade',name:'夢のゲームセンター',x:30,y:0}];
 s.enemies=[];const names=['不良生徒','熱血教師','用務員','ガリ勉','図書委員長','校庭ランナー'];
 for(let x=11,i=0;x<s.width-7;x+=5,i++) {const art=[0,1,2,3,12,17][(i+stage-1)%6],hp=3+stage+Math.floor(i/3);s.enemies.push({id:`${stage}-e${i}`,name:names[(i+stage-1)%6],x,y:i%3,hp,maxHp:hp,damage:1+Math.floor(stage/3),range:art===3?3:1,awake:false,timer:2,windup:false,boss:false,art,stun:0,facing:'left'});}
 const bossNames=['熱血教師','教頭','理科の先生','体育の先生','音楽の先生','生活指導','校長'];
 s.enemies.push({id:`${stage}-boss`,name:bossNames[stage-1],x:s.width-4,y:1,hp:8+stage*3,maxHp:8+stage*3,damage:2+Math.floor(stage/2),range:1,awake:false,timer:2,windup:false,boss:true,art:[1,4,5,6,7,8,9][stage-1],stun:0,facing:'left'});
 log(s,`第${stage}章：${STAGE_NAMES[stage-1]}。右端のゴールへ！`);return s;
}
const circular=(c:FieldCard)=>c.range.some(x=>x<0)&&c.range.some(x=>x>0)||/回し蹴り|回転|旋風|オービット|校歌|アラーム/.test(c.name);
export function rangeCells(c:FieldCard,p:Point,d:Direction,width:number):Point[]{
 if(c.parts)return c.parts.flatMap(part=>rangeCells(part,p,d,width));
 let cells:Point[]=[];
 if(c.effectType==='FURTHEST'){for(let dx=-6;dx<=6;dx++)for(let dy=-2;dy<=2;dy++)if(dx||dy)cells.push({x:p.x+dx,y:p.y+dy});}
 else if(circular(c)){for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if(dx||dy)cells.push({x:p.x+dx,y:p.y+dy});}
 else cells=c.range.map(n=>add(p,d,n));
 return cells.filter(a=>a.x>=0&&a.x<width&&a.y>=0&&a.y<3);
}
export function fieldDescription(c:FieldCard,en=false):string{
 if(en){if(c.parts)return c.parts.map((p,i)=>`${i+1}. ${p.englishName??p.name}: ${fieldDescription(p,true)}`).join('\n')+`\nOne action. Cooldown ${c.cooldown}`;const max=Math.max(...c.range.map(Math.abs),1);const area=circular(c)?'All 8 adjacent tiles':c.effectType==='FURTHEST'?'Farthest enemy within 6 tiles':c.type==='MOVE'||c.type==='UTILITY'&&c.range.some(n=>n!==0)?`Move ${c.range.every(n=>n<0)?'backward':'forward'} up to ${max} tiles`:c.type==='UTILITY'?'Self':`Facing direction, tiles ${c.range.map(n=>Math.abs(n)).join(', ')}, ${c.effectType==='PIERCE'?'all enemies':'first enemy'}`;const detail=c.effectType==='HEAL'?`Recover ${c.damage||3} HP`:c.damage?`${c.damage} damage`:c.shield?`Shield +${c.shield}`:'';const extra=c.effectType==='STUN'?'Delay the enemy one turn':c.effectType==='PUSH'?'Push 2 tiles':c.effectType==='PULL'?'Pull adjacent':c.effectType==='COUNTER'?'Triple damage against a warning enemy':c.effectType==='DRAIN'?'Restore HP equal to damage':c.effectType==='RECOIL'?'Retreat one tile afterward':'';return `${area}. ${detail}${extra?'. '+extra:''}${c.technique&&c.englishDescription?'. '+c.englishDescription:''}`;}
 if(c.parts)return c.parts.map((p,i)=>`${i+1}. ${p.name}：${fieldDescription(p)}`).join('\n')+`\nまとめて1アクション。CD ${c.cooldown}`;
 const effect=c.effectType;const max=Math.max(...c.range.map(Math.abs),1);
 const area=circular(c)?'周囲8方向の1マスすべて':effect==='FURTHEST'?'周囲6マス内の最も遠い敵':c.type==='MOVE'||(c.type==='UTILITY'&&c.range.some(n=>n!==0))?`向いている方向へ最大${max}マス${c.range.every(n=>n<0)?'後退':'移動'}`:c.type==='UTILITY'?'自分':`向いている方向の${c.range.filter(x=>x!==0).map(x=>Math.abs(x)).join('・')}マス先${effect==='PIERCE'?'すべて':'の最初の敵'}`;
 const detail=effect==='HEAL'?`HPを${c.damage||3}回復`:c.damage?`${c.damage}ダメージ`:c.shield?`シールド+${c.shield}`:'';
 const extra:Partial<Record<NonNullable<FieldCard['effectType']>,string>>={PUSH:'同じ方向へ2マス押す',PULL:'自分の隣へ引き寄せる',STUN:'行動を1ターン遅らせる',COUNTER:'攻撃予告中はダメージ3倍',DRAIN:'与えた分HP回復',RECOIL:'攻撃後に1マス後退',DASH_ATTACK:'敵の手前まで突進',PIERCE_DASH:'敵を貫いて移動'};
 return `${area}。${detail}${extra[effect!]?'。'+extra[effect!]:''}${c.technique?'。'+c.description:''}`;
}
export function fuseCards(state:FieldState,ids:string[]):FieldState{
 if(ids.length!==2||ids[0]===ids[1]||state.money<FIELD_RULES.fusionPrice)return state;
 const cards=ids.map(id=>state.hand.find(c=>c.id===id));if(cards.some(c=>!c||c.currentCooldown>0)||cards.reduce((n,c)=>n+(c?.parts?.length??1),0)>4)return state;
 const s=copy(state),parts=cards.flatMap(c=>c!.parts??[c!]).map(c=>({...c,currentCooldown:0}));
 const fused:FieldCard={...parts[0],id:uid(),name:parts.map(c=>c.name).join('＋'),cooldown:Math.max(...parts.map(c=>c.cooldown)),currentCooldown:0,damage:parts.reduce((n,c)=>n+c.damage,0),parts};
 s.money-=FIELD_RULES.fusionPrice;s.hand=s.hand.filter(c=>!ids.includes(c.id));s.hand.push(fused);s.queue=s.queue.filter(id=>!ids.includes(id));log(s,`${fused.name} が完成！`);return s;
}
function pickup(s:FieldState){s.drops=s.drops.filter(d=>{if(!same(d,s.player))return true;s.money+=d.amount;s.events.push({kind:'coin',at:{...d},value:d.amount});log(s,`${d.amount}Gを拾った`);return false;});}
function movePlayer(s:FieldState,d:Direction,n:number,pass=false){const origin={...s.player};for(let i=1;i<=Math.abs(n);i++){const next=add(origin,d,Math.sign(n)*i);if(!inside(s,next)||(!pass&&occupied(s,next)))break;if(!occupied(s,next)){s.player=next;pickup(s);}}}
function hit(s:FieldState,e:FieldEnemy,damage:number){e.hp=Math.max(0,e.hp-damage);e.awake=true;s.events.push({kind:'hit',at:{x:e.x,y:e.y},value:damage});if(e.hp===0&&e.boss&&s.stage===7&&(e.phase??1)<3){e.phase=(e.phase??1)+1;e.name=e.phase===2?'激怒校長':'真・校長';e.maxHp=e.phase===2?30:50;e.hp=e.maxHp;e.damage+=1;e.windup=false;e.timer=2;log(s,`${e.name}が立ちはだかる！`);return;}if(e.hp===0){log(s,`${e.name}を倒した`);if(e.boss||rand(s)<FIELD_RULES.coinChance)s.drops.push({id:uid(),x:e.x,y:e.y,amount:e.boss?30:12+Math.floor(rand(s)*12)});if(s.relics.includes('R_FANG'))s.hp=Math.min(s.maxHp,s.hp+1);}}
export function cardStep(state:FieldState,card:FieldCard):FieldState{
 const s=copy(state);const technique=resolveHeroTechnique(s.focus,card.technique,card.type==='UTILITY');s.focus=technique.focus;
 let cells=rangeCells(card,s.player,s.facing,s.width),targets=s.enemies.filter(e=>e.hp>0&&cells.some(p=>same(p,e))).sort((a,b)=>distance(a,s.player)-distance(b,s.player));
 if(card.effectType==='FURTHEST')targets=targets.sort((a,b)=>distance(b,s.player)-distance(a,s.player)).slice(0,1);
 else if(!circular(card)&&card.effectType!=='PIERCE'&&card.effectType!=='PIERCE_DASH')targets=targets.slice(0,1);
 if(card.type==='MOVE'||(card.type==='UTILITY'&&card.range.some(x=>x!==0)&&!card.technique)){movePlayer(s,s.facing,card.range.every(n=>n<0)?Math.min(...card.range):Math.max(...card.range));s.events.push({kind:'move',at:{...s.player},name:card.name});}
 else if(card.type==='ATTACK'){
  if(card.effectType==='DASH_ATTACK'||card.effectType==='PIERCE_DASH')movePlayer(s,s.facing,Math.max(...card.range),card.effectType==='PIERCE_DASH');
  s.events.push({kind:'attack',at:{...s.player},name:card.name});
  for(const e of targets){const bonus=(s.relics.includes('R_GLOVES')?1:0)+s.strength+technique.bonusDamage;const damage=Math.max(0,card.damage+bonus)*(card.effectType==='COUNTER'&&e.windup?3:1)*technique.repeat;hit(s,e,damage);
   if(card.effectType==='DRAIN')s.hp=Math.min(s.maxHp,s.hp+damage);
   if(card.effectType==='STUN')e.stun+=1;
   if(card.effectType==='PUSH')for(let k=0;k<2;k++){const p=add(e,s.facing);if(!inside(s,p)||occupied(s,p,e.id)||same(s.player,p))break;Object.assign(e,p);}
   if(card.effectType==='PULL'){for(let k=0;k<6&&distance(e,s.player)>1;k++){const p={x:e.x+Math.sign(s.player.x-e.x),y:e.y+Math.sign(s.player.y-e.y)};if(occupied(s,p,e.id)||same(p,s.player))break;Object.assign(e,p);}}
  }s.strength=0;
  if(card.effectType==='RECOIL')movePlayer(s,s.facing,-1);
 }
 s.shield+=card.shield??0;
 if(card.effectType==='HEAL'){s.hp=Math.min(s.maxHp,s.hp+(card.damage||3));s.events.push({kind:'heal',at:{...s.player},value:card.damage||3});}
 s.hp=Math.min(s.maxHp,s.hp+technique.heal);s.shield+=technique.shield;s.barrier+=technique.barrier;s.strength+=technique.strength;
 if(technique.reduceCooldown)s.hand=s.hand.map(c=>({...c,currentCooldown:Math.max(0,c.currentCooldown-technique.reduceCooldown)}));
 if(technique.retreat)movePlayer(s,s.facing,-technique.retreat);if(technique.reverse)s.facing=({right:'left',left:'right',up:'down',down:'up'}as const)[s.facing];
 log(s,`${card.name}！`);return s;
}
function endTurn(s:FieldState,used?:string){
 s.turn++;s.specialCD=Math.max(0,s.specialCD-1);s.hand=s.hand.map(c=>({...c,currentCooldown:c.id===used?c.currentCooldown:Math.max(0,c.currentCooldown-1)}));pickup(s);
 let active=0;
 const ordered=[...s.enemies].sort((a,b)=>distance(a,s.player)-distance(b,s.player));
 for(const e of ordered){if(e.hp<=0)continue;const dist=distance(e,s.player);if(dist>FIELD_RULES.forgetDistance){e.awake=false;e.windup=false;continue;}
  if((dist>FIELD_RULES.wakeDistance&&!e.awake)||active>=FIELD_RULES.maxActive)continue;active++;e.awake=true;
  if(e.stun>0){e.stun--;continue;}
  if(e.windup){e.windup=false;e.timer=2;const aligned=e.x===s.player.x||e.y===s.player.y||e.boss&&dist===1;
   if(dist<=e.range&&aligned){let dmg=e.damage;if(s.barrier){s.barrier--;dmg=0;}const blocked=Math.min(s.shield,dmg);s.shield-=blocked;s.hp-=dmg-blocked;s.events.push({kind:dmg>blocked?'hit':'guard',at:{...s.player},value:dmg-blocked});if(s.relics.includes('R_THORN'))hit(s,e,1);log(s,`${e.name}の攻撃：${dmg-blocked}`);}continue;}
  if(--e.timer>0)continue;
  if(dist<=e.range&&(e.x===s.player.x||e.y===s.player.y||e.boss&&dist===1)){e.windup=true;e.timer=1;continue;}
  const dx=Math.sign(s.player.x-e.x),dy=Math.sign(s.player.y-e.y);const opts:Point[]=Math.abs(s.player.x-e.x)>=Math.abs(s.player.y-e.y)?[{x:e.x+dx,y:e.y},{x:e.x,y:e.y+dy}]:[{x:e.x,y:e.y+dy},{x:e.x+dx,y:e.y}];
  const dest=opts.find(p=>!same(p,e)&&inside(s,p)&&!occupied(s,p,e.id)&&!same(s.player,p));if(dest){e.facing=dest.x>e.x?'right':dest.x<e.x?'left':dest.y>e.y?'down':'up';Object.assign(e,dest);}e.timer=2;
 }
 if(s.hp<=0){s.hp=0;s.status='lost';log(s,'また放課後に挑戦しよう。');}
 else if(s.player.x===s.width-1&&s.player.y===1){if(s.enemies.some(e=>e.boss&&e.hp>0))log(s,'ゴール前の先生を倒すと次の章へ進めます。');else{s.status=s.stage===7?'won':'clear';s.money+=40;log(s,'マップクリア！ +40G');}}
 return s;
}
export function fieldAction(state:FieldState,action:FieldAction):FieldState{
 if(state.status!=='play')return state;let s=copy(state);s.events=[];
 if(action.type==='face'){s.facing=action.direction;return s;}
 if(action.type==='move'){s.facing=action.direction;const dest=add(s.player,action.direction);if(!inside(s,dest)||occupied(s,dest))return s;s.player=dest;s.focus=s.hero==='original'?s.focus:clampKochoFocus(s.focus+1);return endTurn(s);}
 if(action.type==='special'){
  if(s.specialCD>0)return state;const d=action.direction;s.facing=d;const target=s.enemies.find(e=>e.hp>0&&same(e,add(s.player,d)));if(!target){log(s,'その方向に隣り合う敵がいません。');return s;}
  if(s.hero==='rebel'){const behind=add(target,d);if(!inside(s,behind)||occupied(s,behind)){log(s,'回り込む先が塞がっています。');return s;}s.player=behind;s.facing=({right:'left',left:'right',up:'down',down:'up'}as const)[d];}
  else if(s.hero==='akari'){let dest:Point={...target};for(let i=1;i<=3;i++){const p=add(target,d,i);if(!inside(s,p)||occupied(s,p,target.id))break;dest=p;}if(same(dest,target)){log(s,'押し出す先が塞がっています。');return s;}s.player={x:target.x,y:target.y};Object.assign(target,dest);}
  else {const old={...s.player};s.player={x:target.x,y:target.y};Object.assign(target,old);}
  s.specialCD=4;s.focus=s.hero==='original'?s.focus:clampKochoFocus(s.focus+1);s.events.push({kind:'special',at:{...s.player}});return endTurn(s);
 }
 if(action.type==='card'){
  const card=s.hand.find(c=>c.id===action.id);if(!card||card.currentCooldown)return state;
  for(const part of card.parts??[card])s=cardStep(s,part);
  const cd=Math.max(0,card.cooldown-(card.type==='MOVE'&&s.relics.includes('R_BOOTS')?1:0));s.hand=s.hand.map(c=>c.id===card.id?{...c,currentCooldown:cd}:c);s.queue=s.queue.filter(id=>id!==card.id);return endTurn(s,card.id);
 }
 if(action.type==='item'){
  const i=s.items.indexOf(action.id);if(i<0)return state;if(!(s.relics.includes('R_RECYCLE')&&rand(s)<.2))s.items.splice(i,1);
  if(action.id==='C_MILK')s.hp=Math.min(s.maxHp,s.hp+5);if(action.id==='C_BARRIER')s.barrier++;if(action.id==='C_CURRY')s.strength+=3;
  if(action.id==='C_BATTERY'||action.id==='C_DRINK')s.hand=s.hand.map(c=>({...c,currentCooldown:Math.max(0,c.currentCooldown-(action.id==='C_DRINK'?99:2))}));return endTurn(s);
 }
 return endTurn(s);
}
