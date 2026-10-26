export type Corner = 'outer' | 'inner' | 'flat';
export const CORNER_OFFSETS = [[-1,-1],[1,-1],[-1,1],[1,1]] as const;
/** NW, NE, SW, SE. A missing diagonal creates a concave corner, not a seam. */
export function corners(map: number[][], x: number, y: number, code: number): Corner[] {
  const same = (x: number, y: number) => map[y]?.[x] === code;
  return CORNER_OFFSETS.map(([dx,dy]) => {
    const h=same(x+dx,y),v=same(x,y+dy);
    return !h&&!v ? 'outer' : h&&v&&!same(x+dx,y+dy) ? 'inner' : 'flat';
  });
}

/** Field collision uses the same convex/concave curves as the displayed terrain. */
export function roundedSolid(map: number[][], x: number, y: number, code: number) {
  const tx=Math.floor(x),ty=Math.floor(y),u=x-tx,v=y-ty;
  if(map[ty]?.[tx]!==code)return false;
  const shape=corners(map,tx,ty,code);
  for(let i=0;i<4;i++){
    const a=i%2?1-u:u,b=i>=2?1-v:v;
    if(shape[i]==='outer'&&a<.4&&b<.4&&Math.hypot(a-.4,b-.4)>.4)return false;
    if(shape[i]==='inner'&&Math.hypot(a,b)<.22)return false;
  }
  return true;
}

export function roundedPath(x: number, y: number, shape: Corner[], radius=6.4) {
  const r=shape.map(c=>c==='outer'?radius:0),p=new Path2D();
  p.moveTo(x+r[0],y);p.lineTo(x+16-r[1],y);p.quadraticCurveTo(x+16,y,x+16,y+r[1]);
  p.lineTo(x+16,y+16-r[3]);p.quadraticCurveTo(x+16,y+16,x+16-r[3],y+16);
  p.lineTo(x+r[2],y+16);p.quadraticCurveTo(x,y+16,x,y+16-r[2]);
  p.lineTo(x,y+r[0]);p.quadraticCurveTo(x,y,x+r[0],y);p.closePath();
  for(let i=0;i<4;i++)if(shape[i]==='inner'){
    const cx=x+(i%2?16:0),cy=y+(i>=2?16:0),a=[0,Math.PI/2,Math.PI*1.5,Math.PI][i],r=3.52;
    p.moveTo(cx,cy);p.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);p.arc(cx,cy,r,a,a+Math.PI/2);p.closePath();
  }
  return p;
}
