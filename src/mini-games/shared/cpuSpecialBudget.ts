/** Authoritative per-team budget, independent of energy refills and frame rate.
 * Stored on the match so host snapshots preserve it; human actions never spend it. */
export interface CpuSpecialBudget {cpuSpecialAt?:[number,number]}
export const CPU_SPECIAL_INTERVAL=24;
export const initialCpuSpecialBudget=(clock:number):[number,number]=>[clock-12,clock-12];
export function cpuSpecialReady(match:CpuSpecialBudget,side:0|1,clock:number){return clock-(match.cpuSpecialAt?.[side]??0)>=CPU_SPECIAL_INTERVAL;}
export function spendCpuSpecial(match:CpuSpecialBudget,side:0|1,clock:number){match.cpuSpecialAt??=[0,0];match.cpuSpecialAt[side]=clock;}
