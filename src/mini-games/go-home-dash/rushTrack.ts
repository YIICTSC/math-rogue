/** Recycle each scenery object only after it passes behind the chase camera. */
export const trackDepth=(index:number,spacing:number,count:number,phase:number,near=30)=>near-((index*spacing-phase+near)%(spacing*count)+spacing*count)%(spacing*count);
