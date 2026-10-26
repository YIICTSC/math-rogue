import type {Match,Side} from './types';
export function pointLabel(points:readonly number[],side:Side,tiebreak=false){if(tiebreak)return String(points[side]);if(points[0]>=3&&points[1]>=3)return points[0]===points[1]?'40':points[side]>points[1-side]?'AD':'40';return ['0','15','30','40'][Math.min(3,points[side])]||'0';}
/** A normal game needs four points and a two-point lead; a tie-break needs seven. */
export function scorePoint(m:Match,side:Side,target:1|3|6):{game:boolean;match:boolean}{
 m.points[side]++;
 const other=(1-side) as Side,won=m.points[side]>=(m.tiebreak?7:4)&&m.points[side]-m.points[other]>=2;
 if(!won)return {game:false,match:false};
 m.games[side]++;m.points=[0,0];
 const match=m.tiebreak||target===1||m.games[side]>=target&&m.games[side]-m.games[other]>=2;
 if(!match&&m.games[0]===target&&m.games[1]===target)m.tiebreak=true;
 return {game:true,match};
}
/** Standard seeded bracket keeps byes distributed instead of grouping empty slots. */
export function bracketSeeds(count:number){let size=2;while(size<count)size*=2;let seeds=[1,2];while(seeds.length<size){const sum=seeds.length*2+1;seeds=seeds.flatMap(n=>[n,sum-n]);}return seeds.map(n=>n<=count?n-1:null);}
