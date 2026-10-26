/** Logical order: S N E W SE SW NE NW. Authored D2 idle sheets store SW before SE.
 * Action sheets already use logical order and must never use this remapping. */
export const D2_IDLE_SOURCE_COLUMNS=[0,1,2,3,5,4,6,7] as const;
export function idleSourceFacing(id:string,facing:number){return id.startsWith('dungeons2-')?D2_IDLE_SOURCE_COLUMNS[facing]??0:facing;}
