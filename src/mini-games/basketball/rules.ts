import type {Position,Stats,Unit,Match} from './types';
export const COURT={width:7.5,back:8,front:-7.5,hoopX:0,hoopY:6.6,three:6.4,clear:6.65};
export const MATCH_SECONDS=180,SHOT_SECONDS=24,CHARGE_MAX=1.25;
export const POSITIONS:Position[]=['PG','SG','SF','PF','C'];
export const ROLES:Record<Position,{name:string;tag:string;speed:number;shot:number;three:number;steal:number;reach:number;skill:string;description:string}>={
 PG:{name:'ポイントガード',tag:'パスと突破',speed:6.5,shot:.74,three:.64,steal:.64,reach:1.65,skill:'流星クロス',description:'高速ドライブで守備を抜き、パスでチャンスを作る。'},
 SG:{name:'シューティングガード',tag:'長距離シュート',speed:5.9,shot:.8,three:.84,steal:.43,reach:1.7,skill:'星弧スナイプ',description:'外からのシュートが得意。スキルで次の一投の精度を高める。'},
 SF:{name:'スモールフォワード',tag:'万能フィニッシャー',speed:6.1,shot:.79,three:.7,steal:.5,reach:1.8,skill:'蒼天フィニッシュ',description:'ドライブとダンクで得点。攻守のバランスに優れる。'},
 PF:{name:'パワーフォワード',tag:'リバウンドと連携',speed:5.5,shot:.78,three:.5,steal:.4,reach:2.05,skill:'轟天リバウンド',description:'広い範囲のリバウンドと力強いスクリーンが得意。'},
 C:{name:'センター',tag:'ゴール下の守護者',speed:5.1,shot:.85,three:.35,steal:.35,reach:2.3,skill:'鉄壁ガーディアン',description:'高いブロックとリバウンドでゴール下を守る。'}
};
export const emptyStats=():Stats=>({points:0,assists:0,rebounds:0,blocks:0,steals:0});
export const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
export const rimDistance=(u:{x:number;y:number})=>Math.hypot(u.x,COURT.hoopY-u.y);
export const shotQuality=(charge:number)=>clamp(1-Math.abs(charge-.72)/.65,.1,1);
export function contest(m:Match,u:Unit){const dx=-u.x,dy=COURT.hoopY-u.y,d=Math.max(.1,Math.hypot(dx,dy));return m.units.filter(v=>v.side!==u.side&&v.hurt<=0&&distance(v,u)<2.8&&((v.x-u.x)*dx+(v.y-u.y)*dy)/d>-.25).reduce((n,v)=>Math.max(n,clamp((2.8-distance(v,u))/2.6+(v.jump>0?.25:0),0,1)),0);}
export function shotChance(m:Match,u:Unit,quality=.65){const d=rimDistance(u),role=ROLES[u.role],base=d>COURT.three?role.three:role.shot;return clamp(base+quality*.22+(u.focus-.5)*.16-(Math.max(0,d-4))*.022-contest(m,u)*.48+(u.buff>0?.2:0)-(u.stamina<.18?.12:0),.12,.98);}
