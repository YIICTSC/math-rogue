import type {HomeGame,HomeGameWorld} from './homeGames';
export type ExpeditionCommand={type:'game_rules';key:string;arranged:boolean}|{type:'game_expedition';key:string;enabled:boolean}|{type:'game_relic';key:string;relic:string;floor:number};
export type Expedition={seed:number;floor:number;hp:number;complete:boolean;settled:boolean;cleared:boolean;goal:number;hazard:number;renown:Record<string,number>;relics:Record<string,string[]>;choices:Record<string,string[]>;picked:string[];endsAt?:number;average?:number};
export const RELICS=[
 {id:'hourglass',name:'時の砂時計',detail:'手番の制限時間を8秒延長。冒険点も5%増加。',icon:'⌛'},
 {id:'crest',name:'勝負師の紋章',detail:'各階層の冒険点が20%増加。',icon:'♜'},
 {id:'feather',name:'守りの羽',detail:'未達成時に一度だけ共有ライフの減少を防ぐ。',icon:'🪶'},
 {id:'lantern',name:'癒しの灯',detail:'獲得すると共有ライフを1回復。最大3。',icon:'✦'},
 {id:'crown',name:'連勝の王冠',detail:'その階層で勝者になると冒険点が30%増加。',icon:'♛'},
 {id:'compass',name:'星読みの羅針盤',detail:'毎階層の冒険点に120点を加算。',icon:'✧'}
] as const;
export const HAZARDS=['静かな階層','急ぐ階層','試練の階層'] as const;
function rand(e:Expedition,n:number){e.seed=(Math.imul(e.seed,1664525)+1013904223)>>>0;return Math.floor(e.seed/4294967296*n);}
export function newExpedition(w:HomeGameWorld,g:HomeGame):Expedition{return {seed:(Math.round(w.time*1000)^Math.imul(g.revision+1,2654435761))>>>0,floor:1,hp:3,complete:false,settled:false,cleared:false,goal:450,hazard:0,renown:{},relics:{},choices:{},picked:[]};}
export const hasRelic=(g:HomeGame,id:string,relic:string)=>g.expedition?.relics[id]?.filter(r=>r===relic).length||0;
export function turnSeconds(g:HomeGame,base:number){const e=g.expedition;return Math.max(18,base-(e?.hazard===1?12:e?.hazard===2?6:0))+hasRelic(g,g.players[g.turn],'hourglass')*8;}
export function prepareExpedition(g:HomeGame){const e=g.expedition;if(!e)return;if(e.settled){e.floor++;e.settled=false;e.choices={};e.picked=[];}e.hazard=rand(e,3);e.goal=450+(e.floor-1)*65+(e.hazard===2?100:0);}
export function offerRelics(e:Expedition,id:string){const options=RELICS.map(r=>r.id);e.choices[id]=[];for(let i=0;i<3;i++)e.choices[id].push(options.splice(rand(e,options.length),1)[0]);}
function performance(g:HomeGame,i:number){const s=g.scores[i]||0;switch(g.kind){case'darts':return g.arranged?s/450:(301-s)/301;case'billiards':return s/5;case'arcade':return s/450;case'reversi':return s/24;case'connectfour':return g.winner.includes(i)?1:s/12;case'memory':return s/8;case'race':return s/40;case'bowling':return s/(g.arranged?90:180);case'reaction':return s/900;case'rhythm':return s/700000;}}
export function settleExpedition(g:HomeGame){const e=g.expedition;if(!e||e.settled||g.phase!=='finished')return;e.settled=true;let total=0;for(const [i,id]of g.players.entries()){const value=Math.round(Math.min(1.5,Math.max(0,performance(g,i)))*1000*(1+hasRelic(g,id,'crest')*.2+hasRelic(g,id,'hourglass')*.05+(g.winner.includes(i)?hasRelic(g,id,'crown')*.3:0))+hasRelic(g,id,'compass')*120);e.renown[id]=(e.renown[id]||0)+value;total+=value;}e.average=Math.round(total/Math.max(1,g.players.length));e.cleared=e.average>=e.goal;if(!e.cleared){const owner=g.players.find(id=>hasRelic(g,id,'feather'));if(owner)e.relics[owner].splice(e.relics[owner].indexOf('feather'),1);else e.hp--;}
 e.complete=e.hp<=0||e.floor>=5;if(e.complete){const best=Math.max(...g.players.map(id=>e.renown[id]||0));g.winner=g.players.map((id,i)=>e.renown[id]===best?i:-1).filter(i=>i>=0);g.message=e.hp>0?'冒険を踏破しました！':'冒険はここまで。もう一度挑戦！';}else{g.message=e.cleared?'階層クリア！レリックを選んで次へ。':'目標未達成。レリックを選んで立て直そう。';for(const id of g.players){offerRelics(e,id);}}g.revision++;
}
export function expeditionCommand(w:HomeGameWorld,g:HomeGame,id:string,c:ExpeditionCommand){if(w.paused||g.phase==='playing')return false;if(c.type==='game_rules'){if(g.players[0]!==id||typeof c.arranged!=='boolean')return false;g.arranged=c.arranged;g.expedition=undefined;g.phase='lobby';g.revision++;return true;}if(c.type==='game_expedition'){if(g.players[0]!==id||typeof c.enabled!=='boolean'||c.enabled===!!g.expedition)return false;g.expedition=c.enabled?newExpedition(w,g):undefined;if(c.enabled)g.arranged=true;g.phase='lobby';g.revision++;return true;}const e=g.expedition;if(!e||!e.settled||e.complete||c.floor!==e.floor||e.picked.includes(id)||!e.choices[id]?.includes(c.relic))return false;(e.relics[id]??=[]).push(c.relic);e.picked.push(id);if(c.relic==='lantern')e.hp=Math.min(3,e.hp+1);g.revision++;return true;}
export function canStartExpedition(g:HomeGame){const e=g.expedition;return !e||e.complete||!e.settled||g.players.every(id=>e.picked.includes(id));}
