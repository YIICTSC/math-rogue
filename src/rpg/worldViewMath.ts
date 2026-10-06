/** Rotate continuous analog movement by the first-person camera heading. */
export function relativeMove(dx:number,dy:number,facing:number){
  const angle=facing*Math.PI/2,c=Math.cos(angle),s=Math.sin(angle);
  const clean=(n:number)=>Math.abs(n)<1e-10?0:n;
  return {dx:clean(dx*c-dy*s),dy:clean(dx*s+dy*c)};
}
export const compassAngle = (facing: number) =>
  ((((facing % 4) + 4) % 4) * Math.PI) / 2;
export function shortestTurn(from: number, to: number) {
  return (
    ((((to - from + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) -
    Math.PI
  );
}
