/** Painted diagonal columns contain inconsistent front/back poses across the
 * eighteen forms. Derive these poses from the reviewed original direction sheet
 * to retain each hero's costume, handedness and actual travel direction. */
export function useCanonicalD2Pose(id:string,transformed:boolean,facing:number){
 return facing>=4||(id==='dungeons2-lyria'&&!transformed&&facing===2);
}
