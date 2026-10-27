import type {Match,Unit,TutorialStage} from './types';
export type CourtAction='shoot'|'steal'|'dash'|'pass'|'block'|'rebound'|'screen'|'call'|'special';
export interface ActionButton {id:CourtAction;label:string;key:string;icon:string;main?:boolean;}
export const actionLabel:Record<CourtAction,string>={shoot:'シュート',steal:'スティール',dash:'ドライブ',pass:'パス',block:'ブロック',rebound:'リバウンド',screen:'スクリーン',call:'パス要求',special:'スキル'};
export function actionButtons(m:Match,u:Unit):ActionButton[]{
 const held=m.ball.holder===u.id,attack=m.possession===u.side;
 const primary:CourtAction=held?'shoot':m.ball.flight&&!m.ball.pass&&m.ball.side!==u.side&&m.ball.age<.6?'block':!m.ball.holder?'rebound':attack?'call':'block';
 return [{id:primary,label:actionLabel[primary],key:'Z',icon:primary,main:true},{id:held?'pass':attack?'screen':'steal',label:actionLabel[held?'pass':attack?'screen':'steal'],key:'C',icon:held?'pass':attack?'screen':'steal'},{id:'dash',label:held?'ドライブ':'ダッシュ',key:'Space',icon:'dash'},...(primary!=='rebound'?[{id:'rebound' as CourtAction,label:'リバウンド',key:'V',icon:'rebound'}]:[{id:'block' as CourtAction,label:'ブロック',key:'B',icon:'block'}]),{id:'special',label:'スキル',key:'Shift',icon:'special'}];
}
export const tutorialExpected:Partial<Record<TutorialStage,CourtAction>>={dash:'dash',pass:'pass',steal:'steal',shoot:'shoot'};
export function actionDisabled(action:CourtAction,m:Match,u:Unit,active:boolean){
 if(!active||m.inbound>0||m.tutorial&&tutorialExpected[m.tutorial.stage]!==action)return true;
 if(action==='shoot')return m.ball.holder!==u.id||m.mustClear;
 if(action==='pass')return m.ball.holder!==u.id;
 if(action==='dash')return u.dashCooldown>0||u.stamina<.2||u.charging;
 if(action==='special')return u.energy<.999||u.skillCooldown>0||u.charging||!!m.tutorial||['PF','C'].includes(u.role)&&(m.ball.holder===u.id||u.stamina<.13)||['PG','SG','SF'].includes(u.role)&&m.ball.holder!==u.id;
 if(action==='call')return !m.units.some(v=>v.id===m.ball.holder&&v.side===u.side&&v.cpu);
 return m.ball.holder===u.id||u.cooldown>0||u.stamina<.13;
}
