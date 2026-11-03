import {debugRewardsUnlocked} from '../../point-exchange/debug';
import {repairDeployments} from './deployment';
import {selectBanter} from './banter';
import {voyageSite,VOYAGE_REGION_NAMES,VOYAGE_KIND_NAMES} from './voyage';
import {clone,createBattle,distance,living} from './engine';
import {ENDLESS_CAST,recruitLines} from './endlessRoster';
import {ENDLESS_ENEMIES} from './enemyRoster';
import type {Campaign,Battle,EndlessMission,EndlessObjective,Installation,Line,Terrain} from './types';
export const ENDLESS_OBJECTIVES:Record<EndlessObjective,string>={rout:'敵軍を全滅させる',boss:'敵将を撃破する',seize:'星門を制圧する',escape:'全生存部隊を星門周辺へ撤退させる',escort:'旅人を星門へ護送する',defend:'180秒間、本拠を防衛する',beacons:'3基の灯台をすべて確保する',relic:'秘宝を回収し、本拠へ持ち帰る'};
export function endlessUnlocked(s:Campaign){return debugRewardsUnlocked()||s.cleared.includes(17);}
export function startEndless(s:Campaign,seed=Date.now()>>>0){if(!endlessUnlocked(s))return false;s.endless??={active:true,seed,depth:1,wins:0,best:0,history:[]};s.endless.active=true;s.phase='field';s.battle=null;s.checkpoint=null;return true;}
export function leaveEndless(s:Campaign){if(s.endless)s.endless.active=false;s.phase='field';s.battle=null;s.checkpoint=null;s.studyPending=false;}
const log=(b:Battle,message:string)=>{b.log=[message,...b.log].slice(0,50);};
export function makeEndlessBattle(s:Campaign,originalBanter=true):Battle{
 const p=s.endless!,site=voyageSite(p,p.route||0);let seed=(p.seed^Math.imul(p.depth,2654435761)^Math.imul(p.route||0,2246822519))>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const pick=<T,>(a:readonly T[])=>a[Math.floor(random()*a.length)];
 const objective=pick(Object.keys(ENDLESS_OBJECTIVES) as EndlessObjective[]),theme=({emerald:0,glacier:0,ember:2,starlit:3})[site.region],weather=pick(site.region==='glacier'?['clear','rain','fog','storm'] as const:site.region==='ember'?['clear','fog','heat','storm'] as const:['clear','rain','fog','heat','storm'] as const);
 const naval=site.kind==='naval',siege=site.kind==='fortress';
 const b=createBattle(s,17,true,false);b.map=Array.from({length:10},(_,y)=>Array.from({length:12},(_,x):Terrain=>{
 if(naval)return x>=1&&x<=10&&y!==4?'.':'w';
 if(site.kind==='coast'&&x>=10||site.kind==='island'&&(x===0||x===11||(y===0||y===9)&&x<8))return 'w';
 return pick(['.','.','.','f','m'] as Terrain[]);
 }));
 // Every objective and deployment point connects to the same protected road network.
 for(let y=0;y<9;y++)for(const x of [2,9])b.map[y][x]='.';
 for(const y of [1,8])for(let x=2;x<=9;x++)b.map[y][x]='.';
 for(let x=0;x<12;x++)b.map[4][x]=siege?'#':'w';
 if(!siege){b.map[4][2]='b';b.map[4][9]='b';}
 if(site.kind==='ruins')for(const [x,y]of [[4,3],[5,3],[6,5]])b.map[y][x]='#';
 b.map[8][2]='h';b.map[0][9]='g';b.map[0][8]='.';
 const installations:Installation[]=[];
 const add=(kind:Installation['kind'],x:number,y:number,hp=1,team:Installation['team']='enemy')=>{if(kind!=='wall'&&kind!=='bridge'){
 b.map[y][x]='.';
 // Join inland equipment to a road, never cut isolated squares of land into the sea.
 if(!naval)for(let px=x;px<=9&&px>=2;px++)if(y!==4)b.map[y][px]='.';
 }installations.push({id:kind+'-'+installations.length,kind,x,y,hp,maxHp:hp,team,cooldown:6});};
 if(siege){add('wall',9,4,60);add('wall',2,4,90);}
 add('cannon',7,2,55);add('sniper',5,1,35);
 for(const [x,y]of [[3,7],[8,5],[8,2]])add('beacon',x,y,1,'neutral');
 add('relic',9,1,1,'neutral');add('spring',1,8,1,'neutral');add('mine',9,6,1,'enemy');add('mine',2,2,1,'enemy');
 if(siege){b.map[6][6]='w';add('bridge',6,6,25,'neutral');}else add('bridge',6,4,25,'neutral');
 const average=Math.max(1,...s.formations.flatMap(f=>f.slots).filter((id):id is string=>!!id).map(id=>1+Math.floor((s.xp[id]||0)/100)));
 for(const q of b.squads.filter(q=>q.team==='ally'))for(const f of q.members){const buffs=p.blessings;f.atk+=(buffs?.attack||0)*2;f.def+=buffs?.guard||0;f.hp+= (buffs?.vitality||0)*6;f.maxHp=f.hp;}
 const enemyCount=Math.min(10,4+Math.floor(p.depth/3));const enemies=b.squads.filter(q=>q.team==='enemy');
 b.squads=b.squads.filter(q=>q.team==='ally');
 for(let i=0;i<enemyCount;i++){
 const q=clone(enemies[i%enemies.length]);q.id='end-enemy-'+i;q.boss=i===0;q.x=2+i%8;q.y=i<8?1:2;b.map[q.y][q.x]='.';q.name=q.boss?'裂界の旗将':'第'+(i+1)+'混成軍';
 q.kind=Math.floor(random()*6);q.stamina=q.maxStamina=5;q.path=[];
 for(const [j,f]of q.members.entries()){const enemy=pick(ENDLESS_ENEMIES);f.uid=q.id+'-'+j;f.weapon=enemy.weapon;f.hero=enemy.id;f.name=enemy.name;const strength=average+Math.floor(p.depth*.6);f.maxHp=f.hp=28+strength*4;f.atk=10+strength*2;f.def=4+Math.floor(strength*.7);f.speed=6+Math.floor(strength*.4);}
 b.squads.push(q);
 }
 if(objective==='escort'){const civil=clone(b.squads[0]);civil.id='civil';civil.team='civil';civil.name='灯を運ぶ旅人';civil.x=2;civil.y=7;civil.members=[{...civil.members[0],uid:'end-civil',hp:180,maxHp:180}];b.squads.push(civil);}
 const recruit=ENDLESS_CAST[(p.depth-1)%ENDLESS_CAST.length].id;
 const title=VOYAGE_REGION_NAMES[site.region]+' · '+VOYAGE_KIND_NAMES[site.kind];
 const returning=s.recruited.includes(recruit);
 const episodes=[['置き去りにした旗','かつて敵の旗を掲げた人々が、この砦で助けを待っている。','旗の色ではなく、ここで暮らす人を見よう。','ああ。今日は帰還の旗を、共に掲げよう。'],['休息を運ぶ船','薬と食料を積んだ船が、裂け目の向こうで立ち往生している。','戦う力だけでなく、休むための物資も届けたい。','ならば道を開こう。誰かが眠れる夜を守るために。'],['消えかけた道標','前の航路で置いた灯が、遠くの旅人をここまで導いたそうだ。','私たちの小さな勝利は、知らない誰かの帰り道になる。','次の道標も残していこう。終わりのない旅だからこそ。'],['次の世界の朝','救った人々が、今度は自分たちの灯を分けてくれた。','助けた者と助けられた者。その役割は、いつか入れ替わる。','その日を何度でも迎えるために、この航路を越えよう。']][Math.floor((p.depth-1)/4)%4];
 const encounter:Line[]=returning?[
 {who:'narrator',text:episodes[0]+'。'+episodes[1]},
 {who:recruit,text:mottoFor(recruit,weather),reaction:'concern'},
 {who:'$hero',text:episodes[2],reaction:'joy'},
 {who:recruit,text:episodes[3],reaction:'resolve'},
 ]:recruitLines(recruit);
 const story:Line[]=[{who:'narrator',text:`第${p.depth}航路。王冠の向こうに、まだ帰り道を待つ世界があった。`},{who:'$hero',text:`${title}へ進もう。今度の目標は「${ENDLESS_OBJECTIVES[objective]}」。力だけでなく、道を選ぶ戦いだ。`,reaction:'resolve'},...encounter];
 const banter=originalBanter?selectBanter(s):undefined;if(banter)story.push(...clone(banter.lines));
 b.endless={banterId:banter?.id,site,depth:p.depth,title,theme,objective,weather,hold:0,installations,recruit,story,reward:250+p.depth*35,reinforcements:0};
 b.limit=600;b.time=0;b.seed=seed;b.wave=true;b.paused=true;b.result=undefined;b.encounter=null;b.pending=null;b.captured=[];b.treasure=false;
 b.log=[`${title}：${ENDLESS_OBJECTIVES[objective]}`,siege?'城壁は隣接部隊の破城または薬草2個の爆薬で破壊できます。':naval?'船の甲板と乗り込み橋で戦う海上戦。砲撃と狙撃の射線に注意。':'地形と架橋を活かし、拠点を結ぶ道を確保しよう。'];repairDeployments(b);return b;
}
export function beginEndless(s:Campaign,originalBanter=true){if(!s.endless?.active||!endlessUnlocked(s)||s.phase!=='field')return false;s.battle=makeEndlessBattle(s,originalBanter);s.checkpoint=clone(s.battle);s.resultClaimed=false;s.storyKind='intro';s.storyIndex=0;s.phase='story';return true;}
export function claimEndless(s:Campaign){const b=s.battle,m=b?.endless,p=s.endless;if(!m||!p||b?.result!=='win'||s.resultClaimed)return false;s.resultClaimed=true;s.gold+=m.reward;s.supplies+=3;p.chartedRoutes=[...(p.chartedRoutes||[]).filter(v=>v.depth!==m.depth),{depth:m.depth,route:m.site?.route??p.route??0}].slice(-48);delete p.plottedDepth;p.wins++;p.best=Math.max(p.best,p.depth);p.depth++;p.route=0;p.history=[`第${m.depth}航路・${m.title}`, ...p.history].slice(0,30);if(!s.recruited.includes(m.recruit)){s.recruited.push(m.recruit);s.xp[m.recruit]=Math.max(0,...Object.values(s.xp));}s.storyKind='outro';s.storyIndex=0;s.phase='story';return true;}
export function endlessLines(s:Campaign,omitOriginal=false):Line[]{const m=s.battle!.endless!;return s.storyKind==='intro'?(omitOriginal?m.story.filter(l=>!l.banterId):m.story):[{who:m.recruit,text:'この戦場を越えた仲間として、次の航路にも同行する。',reaction:'joy'},{who:'$hero',text:'勝利は終わりではない。休息と編成を済ませたら、次の灯へ。',reaction:'resolve'}];}
function lineClear(b:Battle,a:{x:number;y:number},z:{x:number;y:number}){const n=Math.max(Math.abs(a.x-z.x),Math.abs(a.y-z.y));for(let i=1;i<n;i++)if(b.map[Math.round(a.y+(z.y-a.y)*i/n)]?.[Math.round(a.x+(z.x-a.x)*i/n)]==='#')return false;return true;}
export function interactEndless(s:Campaign,squadId:string,id:string,bomb=false){const b=s.battle,m=b?.endless,q=b?.squads.find(q=>q.id===squadId),o=m?.installations.find(o=>o.id===id);if(!b||!m||!q||q.team!=='ally'||!living(q)||!o||b.result||b.pending||b.encounter||q.wait>0||distance(q,o)>1)return false;
 if(o.kind==='wall'){
 if(o.hp<=0||bomb&&s.supplies<2)return false;
 if(bomb)s.supplies-=2;o.hp=Math.max(0,o.hp-(bomb?o.hp:Math.max(20,...q.members.filter(f=>f.hp>0).map(f=>f.atk))));q.wait=3;
 if(!o.hp){b.map[o.y][o.x]='.';log(b,'城壁を破壊。新しい進軍路が開いた。');}else log(b,'破城攻撃。城壁の耐久 '+o.hp);return true;
 }
 if(o.kind==='bridge'){b.map[o.y][o.x]='b';o.team='ally';log(b,'架橋完了。渡河ルートを確保。');}
 else if(o.kind==='mine'){o.hp=0;log(b,'地雷を解除した。');}
 else if(o.kind==='relic'){o.team='ally';b.treasure=true;log(b,'秘宝を回収。本拠へ帰還せよ。');}
 else if(o.kind==='spring'){if(s.supplies<1)return false;s.supplies--;for(const f of q.members)if(f.hp>0)f.hp=f.maxHp;q.stamina=q.maxStamina;log(b,'泉で補給した。');}
 else{o.team='ally';log(b,o.kind==='beacon'?'灯台を確保した。':'敵の射撃拠点を奪取した。');}
 q.wait=3;return true;
}
export function tickEndless(s:Campaign,dt:number){const b=s.battle!,m=b.endless;if(!m)return;
 const before=Math.floor(b.time/8),after=Math.floor((b.time+dt)/8);
 for(const o of m.installations.filter(o=>o.hp>0)){
 if(o.kind==='mine'){const q=b.squads.find(q=>q.team==='ally'&&living(q)&&distance(q,o)===0);if(q){for(const f of q.members)f.hp=Math.max(0,f.hp-15);o.hp=0;log(b,'地雷が炸裂。隣接して解除すれば安全に通過できます。');}}
 if(o.kind==='beacon'&&b.squads.some(q=>q.team==='enemy'&&living(q)&&distance(q,o)===0))o.team='enemy';
 if(before!==after&&['cannon','sniper'].includes(o.kind)){
 const target=b.squads.filter(q=>q.team===(o.team==='ally'?'enemy':'ally')&&living(q)&&distance(q,o)<=(m.weather==='fog'?3:o.kind==='cannon'?5:7)&&lineClear(b,o,q)).sort((a,z)=>distance(a,o)-distance(z,o))[0];
 if(target){const victims=o.kind==='sniper'?target.members.filter(f=>f.hp>0).slice(-1):target.members.filter(f=>f.hp>0);for(const f of victims)f.hp=Math.max(0,f.hp-(o.kind==='sniper'?16:9));log(b,(o.kind==='sniper'?'狙撃':'砲撃')+' → '+target.name);}
 }
 }
 if(Math.floor(b.time/30)!==Math.floor((b.time+dt)/30)){
 for(const q of b.squads.filter(q=>living(q))){if(m.weather==='heat')q.stamina=Math.max(0,q.stamina-1);if(m.weather==='storm'&&q.team==='ally'&&b.map[q.y][q.x]!=='f')for(const f of q.members)f.hp=Math.max(1,f.hp-5);}
 if(m.weather==='heat'||m.weather==='storm')log(b,m.weather==='heat'?'熱波でスタミナが減少。拠点・休息を活用しよう。':'雷雨。森の中なら落雷を避けられる。');
 }
 if(b.time>60*(m.reinforcements+1)&&m.reinforcements<3){const source=b.squads.find(q=>q.team==='enemy'&&!q.boss);if(source){const wave=clone(source);wave.id='end-wave-'+m.reinforcements;wave.x=9;wave.y=1;wave.path=[];for(const f of wave.members){f.uid=wave.id+f.slot;f.hp=f.maxHp;}b.squads.push(wave);m.reinforcements++;log(b,'裂け目から増援。目標達成を急ごう。');}}
}
export function checkEndless(s:Campaign){const b=s.battle!,m=b.endless!;const a=b.squads.filter(q=>q.team==='ally'&&living(q)),e=b.squads.filter(q=>q.team==='enemy'&&living(q));const end=(win:boolean,reason:string)=>{b.result=win?'win':'lose';b.reason=reason;b.paused=true;s.phase='result';};
 if(!a.length)return end(false,'すべての部隊が倒れた。編成は失われず、同じ航路へ再挑戦できます。');
 if(e.some(q=>q.x===2&&q.y===8))return end(false,'本拠が陥落した。');
 if(m.objective==='escort'&&!b.squads.some(q=>q.team==='civil'&&living(q)))return end(false,'護送隊が倒れた。');
 const gate=(q:{x:number;y:number})=>distance(q,{x:9,y:0})<=1;
 const win=m.objective==='rout'?!e.length:m.objective==='boss'?!e.some(q=>q.boss):m.objective==='defend'?b.time>=180:m.objective==='beacons'?m.installations.filter(o=>o.kind==='beacon').every(o=>o.team==='ally'):m.objective==='relic'?b.treasure&&a.some(q=>q.x===2&&q.y===8):m.objective==='escort'?b.squads.some(q=>q.team==='civil'&&gate(q)):m.objective==='escape'?a.every(gate):a.some(gate)&&!e.some(gate);
 if(win)return end(true,'作戦成功：'+ENDLESS_OBJECTIVES[m.objective]);if(b.time>=b.limit)end(false,'作戦時間が尽きた。');
}

export function chooseBlessing(s:Campaign,kind:'attack'|'guard'|'vitality'){if(!s.endless||s.phase!=='story'||s.storyKind!=='outro'||!s.battle?.endless||!s.resultClaimed||s.storyIndex!==1)return false;const p=s.endless;p.blessings??={attack:0,guard:0,vitality:0};p.blessings[kind]++;s.phase='field';s.battle=null;s.checkpoint=null;return true;}

function mottoFor(id:string,weather:EndlessMission['weather']){return (ENDLESS_CAST.find(h=>h.id===id)?.motto||'次の灯を守ろう。')+({clear:'見晴らしはいい。敵の砲台を先に確保しよう。',rain:'雨で足元が重い。移動の遅れを計算に入れよう。',fog:'霧は射線を隠してくれる。近づく機会を逃さないで。',heat:'熱波が体力を奪う。拠点で休む順番を決めよう。',storm:'雷雨が来る。森を足場に進もう。'})[weather];}
