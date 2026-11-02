import {vacationFacing} from './vacationArt';
import FACING from './artFacing.json';
import ENEMY_FACING from './enemyArtFacing.json';
import {enemyArtSource} from './enemyRoster';
import type {BattleAction} from './battleSources';
export type Facing='left'|'right';
type Use=BattleAction|'dialogue';
const table=FACING as Record<string,Record<Use,string>>;
/** Reviewed against the source atlases, not inferred from the character's faction. */
export function artFacing(id:string,use:Use,frame=0,vacation=false):Facing{
 if(vacation){const summer=vacationFacing(id,use,frame);if(summer)return summer==='r'?'right':'left';}
 const enemy=use==='dialogue'?undefined:enemyArtSource(id,use);if(enemy)return (ENEMY_FACING as Record<string,string>)[enemy]==='r'?'right':'left';
 const row=table[id]?.[use];
 return row?.[Math.max(0,Math.min(3,frame))]==='r'?'right':'left';
}
export function mirrorArt(id:string,use:Use,frame:number,toward:Facing,vacation=false){return artFacing(id,use,frame,vacation)!==toward;}
