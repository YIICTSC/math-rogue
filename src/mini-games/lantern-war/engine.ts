import {HEROES,heroById,pairKey} from './roster';
import {CHAPTERS,TERRAIN_INFO} from './story';
import {resolveEncounter} from './combat';
import type {Battle,Campaign,Fighter,Squad,Terrain,Weapon} from './types';
export const SAVE_KEY='learning-rogue:lantern-war:v1';
export const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v));
export const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export const level=(s:Campaign,id:string)=>1+Math.floor((s.xp[id]||0)/100);
export const living=(q:Squad)=>q.members.some(f=>f.hp>0);
export const capacity=(s:Campaign)=>s.chapter<6?3:s.chapter<12?4:6;
export function newCampaign(hero:Campaign['hero'],difficulty:Campaign['difficulty']='story'):Campaign{
 const recruited=[hero,...CHAPTERS[0].recruit],slots:(string|null)[]=Array(6).fill(null);slots[0]=hero;slots[3]=recruited[1];
 return {version:1,hero,difficulty,phase:'field',chapter:0,cleared:[],sideCleared:[],recruited,formations:[{slots},{slots:Array(6).fill(null)},{slots:Array(6).fill(null)}],tactics:{},xp:{},forge:{},gold:500,supplies:6,bonds:{},supports:[],choices:{},storyIndex:0,storyKind:'intro',battle:null,checkpoint:null,medals:{},resultClaimed:false,savedAt:Date.now()};
}
export function saveCampaign(s:Campaign){try{localStorage.setItem(SAVE_KEY,JSON.stringify({...s,savedAt:Date.now()}));return true;}catch{return false;}}
export function loadCampaign():Campaign|null{
 try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
 if(!s||s.version!==1||!['aster','lyra'].includes(s.hero)||!['story','tactician'].includes(s.difficulty)||!['field','camp','story','battle','result','ending'].includes(s.phase)||!Number.isInteger(s.chapter)||s.chapter<0||s.chapter>17||!['recruited','formations','cleared','sideCleared','supports'].every(k=>Array.isArray(s[k]))||!['xp','forge','tactics','bonds','choices','medals'].every(k=>s[k]&&typeof s[k]==='object')||!Number.isFinite(s.gold)||!Number.isFinite(s.supplies))return null;
 const ids=s.formations.flatMap((f:any)=>f.slots?.filter(Boolean)||[]);
 if(s.formations.length!==3||s.formations.some((f:any)=>f.slots?.length!==6)||ids.length!==new Set(ids).size||!ids.includes(s.hero)||ids.some((id:string)=>!s.recruited.includes(id))||s.recruited.some((id:string)=>!HEROES.some(h=>h.id===id)))return null;
 if(['battle','result'].includes(s.phase)&&(!s.battle||!Array.isArray(s.battle.squads)||s.battle.map?.length!==10||s.battle.map.some((row:any)=>!Array.isArray(row)||row.length!==12||row.some((t:string)=>!TERRAIN_INFO[t]))))return null;
 if(s.battle)s.battle.paused=true;return s;
 }catch{return null;}
}
export function recruitFor(s:Campaign,chapter:number){
 for(const id of CHAPTERS[chapter].recruit){if(s.recruited.includes(id))continue;s.recruited.push(id);s.xp[id]??=Math.max(0,chapter-1)*55;
 const f=s.formations.find(f=>f.slots.filter(Boolean).length<capacity(s)),h=heroById(id);if(f){const row=['bow','magic','staff'].includes(h.weapon)?3:0,index=f.slots.findIndex((v,i)=>!v&&i>=row);if(index>=0)f.slots[index]=id;else{const i=f.slots.indexOf(null);if(i>=0)f.slots[i]=id;}}}
}
export function assign(s:Campaign,id:string,squad:number,slot:number){
 if(!s.recruited.includes(id)||!s.formations[squad]||slot<0||slot>5)return false;
 const target=s.formations[squad],old=s.formations.flatMap((f,si)=>f.slots.map((v,i)=>({v,si,i}))).find(v=>v.v===id),displaced=target.slots[slot];
 if(!old&&!displaced&&target.slots.filter(Boolean).length>=capacity(s))return false;
 if(old&&old.si!==squad&&!displaced&&target.slots.filter(Boolean).length>=capacity(s))return false;
 if(old)s.formations[old.si].slots[old.i]=displaced;target.slots[slot]=id;return true;
}
function fighter(s:Campaign,id:string,slot:number,team:'ally'|'enemy',index=0):Fighter{
 const h=heroById(id),lv=team==='ally'?level(s,id):1+Math.floor(index/2),weapon:Weapon=team==='ally'?h.weapon:(['sword','lance','axe','bow','magic','staff'] as Weapon[])[Number(id.slice(6))%6];
 const hp=(team==='ally'?h.hp:26)+(lv-1)*4+(team==='ally'&&s.difficulty==='story'?12:0);
 return {uid:team+'-'+id+'-'+slot,hero:id,name:team==='ally'?h.name:['灰鎧兵','封門兵','熾火兵','夜渡りの射手','裂界術師','灰灯の司祭'][index%6],team,slot,hp,maxHp:hp,atk:(team==='ally'?h.atk:10)+(lv-1)*2+(s.forge[id]||0)*2,def:(team==='ally'?h.def:4)+Math.floor(lv*.8),speed:(team==='ally'?h.speed:6)+Math.floor(lv/2),weapon,ap:2,pp:2};
}
export function createBattle(s:Campaign,chapter=s.chapter,replay=false,sideQuest=false):Battle{
 const c=CHAPTERS[chapter],map=c.map.map(row=>row.split('') as Terrain[]);map[6][10]='t';
 const squads:Squad[]=s.formations.map((f,i)=>({id:'ally-'+i,team:'ally' as const,name:'第'+(i+1)+'部隊',x:1+i,y:8,members:f.slots.flatMap((id,slot)=>id?[fighter(s,id,slot,'ally')]:[]),stamina:5,maxStamina:5,rest:0,wait:0,path:[],kind:0,facing:2,moving:false})).filter(q=>q.members.length);
 const positions=[[9,0],[7,2],[9,4],[5,3],[10,6],[6,0]],count=chapter<2?3:4+Math.floor(chapter/7);
 for(let i=0;i<count;i++){let [x,y]=positions[i];if(TERRAIN_INFO[map[y][x]].cost>=99){x=10;y=i+1;}
 const members=Array.from({length:chapter<2?1:2+Math.floor(chapter/6)},(_,j)=>fighter(s,'enemy-'+((i+j+chapter)%6),j<2?j:j+1,'enemy',chapter+(i+j)%4));
 if(i===0)for(const f of members){f.hp+=14;f.maxHp+=14;}
 squads.push({id:'enemy-'+i,team:'enemy',name:i===0?(chapter===16?'灯守ヴェスパー':chapter===17?'忘却の王冠':'境界の守備隊'):'境界の第'+i+'隊',x,y,members,stamina:5,maxStamina:5,rest:0,wait:0,path:[],boss:i===0,kind:(i+chapter)%6,facing:3,moving:false});}
 if(c.objective==='escort')squads.push({id:'civil',team:'civil',name:'種を運ぶ旅人',x:0,y:8,members:[{...fighter(s,'high-school-caretaker',0,'ally'),hp:80,maxHp:80}],stamina:9,maxStamina:9,rest:0,wait:0,path:[],kind:0,facing:2,moving:false});
 return {chapter,map,squads,time:0,limit:360+chapter*12,paused:true,brave:3,log:['作戦を確認して進軍開始。タップで部隊を選び、目的地を指定。'],seed:20261028+chapter,encounter:null,pending:null,treasure:false,replay,sideQuest,wave:false,captured:[]};
}
export function pathTo(b:Battle,q:{x:number;y:number},goal:{x:number;y:number}){
 const queue=[{x:q.x,y:q.y,cost:0,path:[] as {x:number;y:number}[]}],costs=new Map<string,number>([[q.x+','+q.y,0]]);
 while(queue.length){queue.sort((a,b)=>a.cost-b.cost);const p=queue.shift()!;if(distance(p,goal)===0)return p.path;
 for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const x=p.x+dx,y=p.y+dy,t=b.map[y]?.[x];if(!t)continue;const cost=p.cost+TERRAIN_INFO[t].cost,k=x+','+y;if(TERRAIN_INFO[t].cost>=99||cost>=(costs.get(k)??Infinity))continue;costs.set(k,cost);queue.push({x,y,cost,path:[...p.path,{x,y}]});}}
 return [];
}
export function orderMove(s:Campaign,id:string,x:number,y:number){const b=s.battle,q=b?.squads.find(q=>q.id===id);if(!b||b.result||b.encounter||b.pending||!q||q.team!=='ally'||!living(q)||q.stamina<=0||q.rest>0||q.wait>0||!b.map[y]?.[x]||TERRAIN_INFO[b.map[y][x]].cost>=99)return false;q.path=pathTo(b,q,{x,y});return q.path.length>0;}
export function restSquad(s:Campaign,id:string){const q=s.battle?.squads.find(q=>q.id===id);if(!q||q.team!=='ally'||!living(q)||s.battle?.encounter||s.battle?.pending)return false;q.rest=8;q.path=[];return true;}
export function braveSkill(s:Campaign,id:string,kind:'heal'|'rally'){const b=s.battle,q=b?.squads.find(q=>q.id===id);if(!b||b.encounter||b.pending||b.brave<1||!q||q.team!=='ally')return false;b.brave--;if(kind==='heal')for(const f of q.members)f.hp=Math.min(f.maxHp,f.hp+25);else{q.stamina=Math.min(q.maxStamina,q.stamina+2);q.wait=0;}b.log.unshift(kind==='heal'?'ブレイブ・癒しの旗を使用。':'ブレイブ・進軍の号令を使用。');return true;}


const addLog=(b:Battle,t:string)=>{b.log=[t,...b.log].slice(0,50);};
export function encounterPreview(s:Campaign){const b=s.battle;if(!b?.pending)return null;const a=b.squads.find(q=>q.id===b.pending![0])!,e=b.squads.find(q=>q.id===b.pending![1])!;return resolveEncounter(s,a,e,b.squads.filter(q=>q.id!==a.id&&q.id!==e.id&&q.team!=='civil'&&living(q)&&distance(q,q.team==='ally'?a:e)<=3));}
export function startEncounter(s:Campaign){const b=s.battle,e=encounterPreview(s);if(!b||!e)return false;b.encounter=e;b.pending=null;b.paused=true;return true;}
export function finishEncounter(s:Campaign){
 const b=s.battle,e=b?.encounter;if(!b||!e)return false;
 const a=b.squads.find(q=>q.id===e.ally)!,z=b.squads.find(q=>q.id===e.enemy)!;
 for(const q of [a,z]){for(const f of q.members){const final=e.final.find(v=>v.uid===f.uid);if(final)Object.assign(f,final);}q.path=[];q.stamina=Math.max(0,q.stamina-(b.map[q.y][q.x]==='h'?0:1));q.rest=0;}
 for(const id of e.support){const helper=b.squads.find(q=>q.id===id);if(helper)helper.stamina=Math.max(0,helper.stamina-1);}
 const winner=e.winner==='ally'?a:z,loser=e.winner==='ally'?z:a;loser.wait=5;
 const retreat=pathTo(b,loser,loser.team==='ally'?{x:1,y:8}:{x:11,y:0})[0];if(retreat){loser.x=retreat.x;loser.y=retreat.y;}
 if(e.winner==='ally'){b.brave=Math.min(9,b.brave+1);for(const f of a.members){const old=level(s,f.hero);s.xp[f.hero]=(s.xp[f.hero]||0)+(living(z)?20:45);const growth=level(s,f.hero)-old;if(growth){f.maxHp+=growth*4;f.hp=Math.min(f.maxHp,f.hp+8);f.atk+=growth*2;f.def+=growth;addLog(b,f.name+' Lv.'+level(s,f.hero));}}
 for(const f of a.members)for(const partner of a.members.filter(p=>p.uid!==f.uid)){const k=pairKey(f.hero,partner.hero);s.bonds[k]=Math.min(15,(s.bonds[k]||0)+1);}}
 addLog(b,winner.name+'が交戦に勝利。'+loser.name+'は後退。');b.encounter=null;checkResult(s);return true;
}
export function checkResult(s:Campaign){
 const b=s.battle;if(!b||b.result)return;const allies=b.squads.filter(q=>q.team==='ally'&&living(q)),enemies=b.squads.filter(q=>q.team==='enemy'&&living(q)),c=CHAPTERS[b.chapter],goal={x:9,y:0};
 const end=(result:'win'|'lose',reason:string)=>{b.result=result;b.reason=reason;b.paused=true;s.phase='result';};
 if(!allies.length){end('lose','全味方部隊が戦闘不能。編成と作戦を見直して再挑戦しよう。');return;}
 if(enemies.some(q=>q.x===2&&q.y===8)){end('lose','味方本拠点を制圧された。');return;}
 if(b.time>=b.limit){end('lose','制限時間を超えた。');return;}
 if(b.sideQuest){if(!enemies.length)end('win','周辺の脅威を一掃した。');return;}
 if(c.objective==='escort'&&!b.squads.some(q=>q.team==='civil'&&living(q))){end('lose','護衛対象が倒れた。');return;}
 if(c.objective==='rout'&&!enemies.length)end('win','すべての敵部隊を退けた。');
 if(c.objective==='boss'&&!enemies.some(q=>q.boss))end('win','敵将を撃破した。');
 if(['seize','escape'].includes(c.objective)&&allies.some(q=>distance(q,goal)===0)&&!enemies.some(q=>distance(q,goal)===0))end('win',c.objective==='seize'?'星門を制圧した。':'星門への退路を確保した。');
 if(c.objective==='defend'&&b.time>=60+c.turns*6)end('win','本拠点と灯を守り抜いた。');
 if(c.objective==='escort'&&b.squads.some(q=>q.team==='civil'&&distance(q,goal)===0))end('win','種と旅人を星門へ届けた。');
}
export function tick(s:Campaign,dt=.5){
 const b=s.battle;if(!b||b.paused||b.result||b.encounter||b.pending)return false;
 const prev=Math.floor(b.time/1.5);b.time+=Math.min(1,dt);const step=Math.floor(b.time/1.5)!==prev;
 for(const q of b.squads.filter(living)){
 q.moving=false;q.wait=Math.max(0,q.wait-dt);
 if(q.rest>0){q.rest=Math.max(0,q.rest-dt);if(q.rest===0){q.stamina=q.maxStamina;for(const f of q.members)if(f.hp>0)f.hp=Math.min(f.maxHp,f.hp+8);addLog(b,q.name+'が休息を終えた。');}continue;}
 if(!step||q.wait>0)continue;
 if(q.team==='enemy'&&!q.boss&&b.time>8&&!q.path.length){const targets=b.squads.filter(t=>t.team!=='enemy'&&living(t));targets.sort((a,z)=>distance(a,q)-distance(z,q));if(targets[0])q.path=pathTo(b,q,targets[0]);}
 if(q.team==='civil'&&!q.path.length)q.path=pathTo(b,q,{x:9,y:0});
 if(q.path.length&&q.stamina>0&&Math.floor(b.time/1.5)%TERRAIN_INFO[b.map[q.y][q.x]].cost===0){const next=q.path.shift()!,dx=next.x-q.x,dy=next.y-q.y;q.facing=dy>0?0:dy<0?1:dx>0?2:3;q.x=next.x;q.y=next.y;q.moving=true;}
 if(q.team==='ally'&&['h','t'].includes(b.map[q.y][q.x])){
 const key=q.x+','+q.y;
 if(!b.captured.includes(key)){b.captured.push(key);b.brave=Math.min(9,b.brave+1);addLog(b,'拠点を解放。ブレイブ+1。');if(b.map[q.y][q.x]==='t'){s.gold+=150;s.supplies+=2;b.treasure=true;}}
 if(!q.path.length){q.stamina=q.maxStamina;for(const f of q.members)if(f.hp>0)f.hp=Math.min(f.maxHp,f.hp+2);}
 }
 }
 for(const e of b.squads.filter(q=>q.team==='enemy'&&living(q))){
 const civil=b.squads.find(q=>q.team==='civil'&&living(q)&&distance(e,q)<=1);if(civil){civil.members[0].hp=Math.max(0,civil.members[0].hp-8);}
 const a=b.squads.find(q=>q.team==='ally'&&living(q)&&distance(e,q)<=1);
 if(a){b.pending=[a.id,e.id];b.paused=true;break;}
 }
 if(b.time>=45&&!b.wave&&b.chapter>=5){b.wave=true;const template=b.squads.find(q=>q.team==='enemy'&&!q.boss);if(template){const wave=clone(template);wave.id='enemy-wave';wave.name='東方の増援';wave.x=11;wave.y=6;wave.path=[];for(const f of wave.members){f.uid+='-wave';f.hp=f.maxHp;}b.squads.push(wave);addLog(b,'東側の裂け目から敵増援！');}}
 checkResult(s);return true;
}
export function beginChapter(s:Campaign,chapter=s.chapter,sideQuest=false){
 if(chapter>s.chapter||chapter<0||chapter>17)return false;
 const replay=s.cleared.includes(chapter);recruitFor(s,chapter);s.resultClaimed=false;s.battle=createBattle(s,chapter,replay,sideQuest);s.checkpoint=clone(s.battle);s.storyIndex=0;s.storyKind='intro';s.phase=replay||sideQuest?'battle':'story';return true;
}
export function claimResult(s:Campaign){
 const b=s.battle;if(!b||b.result!=='win'||s.resultClaimed)return false;s.resultClaimed=true;
 const first=!b.replay&&!b.sideQuest,c=CHAPTERS[b.chapter];s.gold+=first?c.reward:b.sideQuest&&!s.sideCleared.includes(b.chapter)?Math.floor(c.reward*.65):60;s.supplies+=first?3:1;
 if(b.sideQuest&&!s.sideCleared.includes(b.chapter))s.sideCleared.push(b.chapter);
 if(first){s.cleared.push(b.chapter);s.medals[b.chapter]=Math.max(1,3-(b.squads.some(q=>q.team==='ally'&&!living(q))?1:0)-(b.time>b.limit*.7?1:0));s.storyKind='outro';s.storyIndex=0;s.phase='story';}
 else{s.phase='camp';s.battle=null;}return true;
}
export function advanceStory(s:Campaign,length:number,choice?:number){
 if(s.phase!=='story')return false;if(s.storyIndex<length-1){s.storyIndex++;return true;}
 if(s.storyKind==='intro'){s.phase='battle';return true;}if(s.storyKind==='support'){s.phase='camp';return true;}
 const c=s.battle?.chapter??s.chapter;if(CHAPTERS[c].dilemma){s.choices[c]=choice??0;if(choice===1)s.supplies+=2;else s.gold+=80;}
 if(c===17){s.phase='ending';return true;}s.chapter=c+1;recruitFor(s,s.chapter);s.phase='field';s.battle=null;s.checkpoint=null;return true;
}
export function retryBattle(s:Campaign){if(!s.checkpoint)return false;s.battle=clone(s.checkpoint);s.battle.paused=true;s.phase='battle';s.resultClaimed=false;return true;}
export function train(s:Campaign,id:string){if(!s.recruited.includes(id)||s.gold<100||level(s,id)>=20)return false;s.gold-=100;s.xp[id]=(s.xp[id]||0)+50;return true;}
export function forge(s:Campaign,id:string){const rank=s.forge[id]||0,cost=150+rank*150;if(!s.recruited.includes(id)||s.gold<cost||rank>=4)return false;s.gold-=cost;s.forge[id]=rank+1;return true;}
export function useItem(s:Campaign,id:string){const q=s.battle?.squads.find(q=>q.id===id);if(!q||s.supplies<1||s.battle?.encounter||s.battle?.pending)return false;s.supplies--;for(const f of q.members)f.hp=Math.min(f.maxHp,f.hp+20);return true;}
