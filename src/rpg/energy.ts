export const GATHER_ENERGY_MAX=6;
export const GATHER_ENERGY_COST=1;
export const LEARNING_ENERGY_GAIN=2;
export function energyOf(life?:{energy?:number}){return Number.isFinite(life?.energy)?Math.max(0,Math.min(GATHER_ENERGY_MAX,Math.round(life!.energy!*100)/100)):GATHER_ENERGY_MAX;}
export function recoverGatherEnergy(life:{energy?:number},correctDelta:number){if(correctDelta>0)life.energy=Math.min(GATHER_ENERGY_MAX,energyOf(life)+correctDelta*LEARNING_ENERGY_GAIN);}
