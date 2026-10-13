import type {HomeGame,HomeGameWorld,GameKind} from './homeGames';
export type ExpeditionCommand={type:'game_rules';key:string;arranged:boolean}|{type:'game_expedition';key:string;enabled:boolean}|{type:'game_relic';key:string;relic:string;floor:number}|{type:'game_route';key:string;route:string;floor:number}|{type:'game_camp';key:string;action:'heal'|'relic'|'reroll'|'risk';floor:number};
export type Route='garden'|'treasury'|'elite';
export type Expedition={seed:number;floor:number;hp:number;complete:boolean;settled:boolean;cleared:boolean;goal:number;hazard:number;renown:Record<string,number>;relics:Record<string,string[]>;choices:Record<string,string[]>;picked:string[];endsAt?:number;average?:number;version?:number;floors?:number;route?:Route;routeChosen?:boolean;gold?:number;campUsed?:boolean;bonus?:Record<string,number>;marks?:number[];history?:Route[]};
type Relic={id:string;name:string;detail:string;icon:string;kinds?:GameKind[]};
export const RELICS:Relic[]=[
 {id:'hourglass',name:'時の砂時計',detail:'手番の制限時間を8秒延長。冒険点も5%増加。',icon:'⌛'},
 {id:'crest',name:'勝負師の紋章',detail:'各階層の冒険点が20%増加。',icon:'♜'},
 {id:'feather',name:'守りの羽',detail:'未達成時に一度だけ共有ライフの減少を防ぐ。',icon:'🪶'},
 {id:'lantern',name:'癒しの灯',detail:'獲得すると共有ライフを1回復。最大3。',icon:'✦'},
 {id:'crown',name:'連勝の王冠',detail:'その階層で勝者になると冒険点が30%増加。',icon:'♛'},
 {id:'compass',name:'星読みの羅針盤',detail:'毎階層の冒険点に120点を加算。',icon:'✧'},
 {id:'eagle',name:'鷹の照準',detail:'照準の揺れを半減。ダブルとブルの得点が25%増加。',icon:'🦅',kinds:['darts']},
 {id:'chalk',name:'星屑のチョーク',detail:'ポケット得点が1点増加。ファウル減点を防ぐ。',icon:'🎱',kinds:['billiards']},
 {id:'paddle',name:'巨人のパドル',detail:'パドルが広がり、開始ライフが1増加。',icon:'🛡',kinds:['arcade']},
 {id:'lens',name:'記憶のレンズ',detail:'不一致カードを長く確認でき、ペア得点が1増加。',icon:'🔎',kinds:['memory']},
 {id:'boots',name:'旅人のブーツ',detail:'移動が1増加。後退マスの損失を2軽減。',icon:'👢',kinds:['race']},
 {id:'territory',name:'領地の旗',detail:'宝石マスで得る冒険ボーナスが2倍。',icon:'🚩',kinds:['reversi','connectfour']},
 {id:'spark',name:'稲妻の手袋',detail:'反応受付を0.25秒延長。成功時に15点追加。',icon:'⚡',kinds:['reaction']},
 {id:'metronome',name:'星のメトロノーム',detail:'音ゲーの到達コンボに応じて冒険点を追加。',icon:'🎵',kinds:['rhythm']},
 {id:'harmony',name:'調和の楽譜',detail:'音ゲーの精度に応じて最大300冒険点を追加。',icon:'🎼',kinds:['rhythm']},
 {id:'purse',name:'探検家の財布',detail:'階層終了時の共有コインが2増加。',icon:'👛'},
 {id:'risk',name:'深紅の契約',detail:'冒険点が40%増加。未達成時のライフ損失が1増加。',icon:'♦'},
 {id:'collection',name:'収集家の印',detail:'異なるレリック1種類につき冒険点を3%増加。',icon:'📚'}
];
export const ROUTES=[{id:'garden',name:'癒しの庭',detail:'低めの目標。クリアで共有ライフを1回復。',icon:'🌿'},{id:'treasury',name:'宝石の回廊',detail:'標準の目標。獲得コインが3増加。',icon:'💎'},{id:'elite',name:'王者の試練',detail:'目標と時間制限が厳しい。冒険点30%・コイン5増加。',icon:'♛'}] as const;
export const HAZARDS=['静かな階層','急ぐ階層','試練の階層'] as const;
export const expeditionFloors=(e:Expedition)=>e.floors??5;
export const bossFloor=(e:Expedition)=>e.version===2&&(e.floor===4||e.floor===8);
export function expeditionRandom(e:Expedition,n:number){e.seed=(Math.imul(e.seed,1664525)+1013904223)>>>0;return Math.floor(e.seed/4294967296*n);}
export function newExpedition(w:HomeGameWorld,g:HomeGame):Expedition{return {version:2,floors:8,seed:(Math.round(w.time*1000)^Math.imul(g.revision+1,2654435761))>>>0,floor:1,hp:3,complete:false,settled:false,cleared:false,goal:400,hazard:0,renown:{},relics:{},choices:{},picked:[],gold:0,route:'garden',routeChosen:false,campUsed:false,history:[],bonus:{},marks:[]};}
export const hasRelic=(g:HomeGame,id:string,relic:string)=>g.expedition?.relics[id]?.filter(r=>r===relic).length||0;
export const paddleHalfWidth=(g:HomeGame,id:string)=>.13+Math.min(2,hasRelic(g,id,'paddle'))*.035;
export function turnSeconds(g:HomeGame,base:number){const e=g.expedition;return Math.max(18,base-(e?.hazard===1?12:e?.hazard===2?6:0))+hasRelic(g,g.players[g.turn],'hourglass')*8;}
export function prepareExpedition(g:HomeGame){const e=g.expedition;if(!e)return;if(e.settled){e.floor++;e.settled=false;e.choices={};e.picked=[];}e.hazard=e.route==='elite'?1:expeditionRandom(e,3);e.goal=450+(e.floor-1)*45+(e.hazard===2?70:0)+(e.route==='elite'?100:e.route==='garden'?-80:0)+(bossFloor(e)?120:0);e.bonus={};e.marks=[];e.history??=[];if(e.route)e.history.push(e.route);const size=g.kind==='reversi'?64:42;while(e.marks.length<5){const n=expeditionRandom(e,size);if(!e.marks.includes(n)&&![27,28,35,36].includes(n))e.marks.push(n);}e.campUsed=false;}
export function offerRelics(e:Expedition,id:string,kind?:GameKind){const options=RELICS.filter(r=>(!r.kinds||!!kind&&r.kinds.includes(kind))&&(e.relics[id]?.filter(x=>x===r.id).length||0)<3).map(r=>r.id);e.choices[id]=[];for(let i=0;i<3&&options.length;i++)e.choices[id].push(options.splice(expeditionRandom(e,options.length),1)[0]);}
export function expeditionBonus(g:HomeGame,seat:number,amount:number){const e=g.expedition;if(e?.version!==2)return;const id=g.players[seat];e.bonus??={};e.bonus[id]=Math.min(600,(e.bonus[id]||0)+amount);}
function performance(g:HomeGame,i:number){const s=g.scores[i]||0;switch(g.kind){case'coindozer':return s/2000;case'darts':return g.arranged?s/450:(301-s)/301;case'billiards':return s/5;case'arcade':return s/450;case'reversi':return s/24;case'connectfour':return g.winner.includes(i)?1:s/12;case'memory':return s/8;case'race':return s/40;case'bowling':return s/(g.arranged?90:180);case'reaction':return s/900;case'rhythm':return s/700000;}}
export function settleExpedition(g:HomeGame){const e=g.expedition;if(!e||e.settled||g.phase!=='finished')return;e.settled=true;let total=0;for(const [i,id]of g.players.entries()){const collection=new Set(e.relics[id]||[]).size*hasRelic(g,id,'collection')*.03;const value=Math.round(Math.min(1.5,Math.max(0,performance(g,i)))*1000*(1+hasRelic(g,id,'crest')*.2+hasRelic(g,id,'hourglass')*.05+hasRelic(g,id,'risk')*.4+collection+(g.winner.includes(i)?hasRelic(g,id,'crown')*.3:0)+(e.route==='elite'?.3:0))+hasRelic(g,id,'compass')*120+(e.bonus?.[id]||0)+(g.kind==='rhythm'?Math.min(300,(g.rhythm?.results[i]?.maxCombo||0)*2)*hasRelic(g,id,'metronome')+Math.round(Math.min(1,(g.scores[i]||0)/1000000)*300)*hasRelic(g,id,'harmony'):0));e.renown[id]=(e.renown[id]||0)+value;total+=value;}e.average=Math.round(total/Math.max(1,g.players.length));e.cleared=e.average>=e.goal;
 if(!e.cleared){const owner=g.players.find(id=>hasRelic(g,id,'feather'));if(owner)e.relics[owner].splice(e.relics[owner].indexOf('feather'),1);else e.hp=Math.max(0,e.hp-1-(g.players.some(id=>hasRelic(g,id,'risk'))?1:0));}else if(e.route==='garden')e.hp=Math.min(3,e.hp+1);
 e.gold=(e.gold||0)+(e.cleared?4:2)+(e.route==='treasury'?3:e.route==='elite'?5:0)+(bossFloor(e)?3:0)+g.players.reduce((n,id)=>n+hasRelic(g,id,'purse')*2,0);e.complete=e.hp<=0||e.floor>=expeditionFloors(e);e.routeChosen=false;if(e.complete){const best=Math.max(...g.players.map(id=>e.renown[id]||0));g.winner=g.players.map((id,i)=>e.renown[id]===best?i:-1).filter(i=>i>=0);g.message=e.hp>0?'冒険を踏破しました！':'冒険はここまで。もう一度挑戦！';}else{g.message=e.cleared?'階層クリア！レリックを選んで次へ。':'目標未達成。レリックを選んで立て直そう。';for(const id of g.players)offerRelics(e,id,g.kind);}g.revision++;
}
export function expeditionCommand(w:HomeGameWorld,g:HomeGame,id:string,c:ExpeditionCommand){if(w.paused||g.phase==='playing'||!g.players.includes(id))return false;if(c.type==='game_rules'){if(g.players[0]!==id||typeof c.arranged!=='boolean')return false;g.arranged=c.arranged;g.expedition=undefined;g.phase='lobby';g.revision++;return true;}if(c.type==='game_expedition'){if(g.players[0]!==id||typeof c.enabled!=='boolean'||c.enabled===!!g.expedition)return false;g.expedition=c.enabled?newExpedition(w,g):undefined;if(c.enabled)g.arranged=true;g.phase='lobby';g.revision++;return true;}const e=g.expedition;if(!e||e.complete||c.floor!==e.floor)return false;
 if(c.type==='game_route'){if(e.version!==2||g.players[0]!==id||!ROUTES.some(r=>r.id===c.route))return false;e.route=c.route as Route;e.routeChosen=true;g.revision++;return true;}
 if(c.type==='game_camp'){if(e.version!==2||g.players[0]!==id||!e.settled||e.campUsed)return false;const cost=c.action==='heal'?3:c.action==='relic'?6:c.action==='reroll'?2:0;if((e.gold||0)<cost||c.action==='heal'&&e.hp>=3||c.action==='reroll'&&e.picked.length>0||!['heal','relic','reroll','risk'].includes(c.action))return false;e.gold=(e.gold||0)-cost;e.campUsed=true;if(c.action==='heal')e.hp=Math.min(3,e.hp+1);if(c.action==='reroll')for(const player of g.players)offerRelics(e,player,g.kind);if(c.action==='relic')for(const player of g.players){const choices=RELICS.filter(r=>!r.kinds||r.kinds.includes(g.kind));const relic=choices[expeditionRandom(e,choices.length)].id;(e.relics[player]??=[]).push(relic);if(relic==='lantern')e.hp=Math.min(3,e.hp+1);}if(c.action==='risk'){if(expeditionRandom(e,2))e.gold+=7;else e.hp=Math.max(1,e.hp-1);}g.revision++;return true;}
 if(!e.settled||e.picked.includes(id)||!e.choices[id]?.includes(c.relic))return false;(e.relics[id]??=[]).push(c.relic);e.picked.push(id);if(c.relic==='lantern')e.hp=Math.min(3,e.hp+1);g.revision++;return true;
}
export function canStartExpedition(g:HomeGame){const e=g.expedition;return !e||e.complete||((e.version!==2||e.routeChosen)&&(!e.settled||g.players.every(id=>e.picked.includes(id))));}
