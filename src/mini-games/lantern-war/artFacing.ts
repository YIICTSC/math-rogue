import FACING from './artFacing.json';
import type {BattleAction} from './battleSources';
export type Facing='left'|'right';
type Use=BattleAction|'dialogue';
const table=FACING as Record<string,Record<Use,string>>;
/** Reviewed against the source atlases, not inferred from the character's faction. */
export function artFacing(id:string,use:Use,frame=0):Facing{
 const row=table[id]?.[use];
 return row?.[Math.max(0,Math.min(3,frame))]==='r'?'right':'left';
}
export function mirrorArt(id:string,use:Use,frame:number,toward:Facing){return artFacing(id,use,frame)!==toward;}
