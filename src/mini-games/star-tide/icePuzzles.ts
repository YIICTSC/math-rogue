/** Slide chambers use bounded authored geometry and a reversible, solver-checked objective. */
export const ICE_LAYOUTS=[
 ['#########','#   #   #','# #   # #','#   #   #','##     ##','#   #   #','# #   # #','#S     G#','#########'],
 ['#########','#   #   #','#       #','#   ## ##','#      ##','#     # #','##      #','#S   #  #','#########'],
 ['#########','#  #  # #','##  #   #','### #   #','##      #','# #    ##','#    #  #','#S      #','#########'],
] as const;
export type Ice={x:number;y:number;goal:{x:number;y:number};walls:Set<string>;steps:number};
export function iceChamber(seed:number):Ice{const rows=ICE_LAYOUTS[seed%3],walls=new Set<string>();let x=1,y=7,goal={x:7,y:7};rows.forEach((r,py)=>Array.from(r).forEach((c,px)=>{if(c==='#')walls.add(`${px},${py}`);if(c==='S'){x=px;y=py;}if(c==='G')goal={x:px,y:py};}));const base={x,y,goal,walls,steps:0};const q=[{x,y,distance:0}],seen=new Set([`${x},${y}`]);for(const v of q)for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const t={...base,x:v.x,y:v.y};if(!slideIce(t,dx,dy))continue;const k=t.x+','+t.y;if(!seen.has(k)){seen.add(k);q.push({x:t.x,y:t.y,distance:v.distance+1});}}const goals=q.filter(v=>v.distance>=5),chosen=(goals.length?goals:q.slice(1))[(seed*7)%Math.max(1,goals.length||q.length-1)];return{...base,goal:{x:chosen.x,y:chosen.y}};}
export function slideIce(p:Ice,dx:number,dy:number){if(Math.abs(dx)+Math.abs(dy)!==1)return false;let x=p.x,y=p.y;while(!p.walls.has(`${x+dx},${y+dy}`)&&x+dx>=0&&x+dx<9&&y+dy>=0&&y+dy<9){x+=dx;y+=dy;}if(x===p.x&&y===p.y)return false;p.x=x;p.y=y;p.steps++;return true;}
export function solveIce(p:Ice){const q=[{x:p.x,y:p.y,path:[] as number[]}],seen=new Set<string>();for(const s of q){if(s.x===p.goal.x&&s.y===p.goal.y)return s.path;for(let d=0;d<4;d++){const t={...p,x:s.x,y:s.y},[dx,dy]=[[0,-1],[1,0],[0,1],[-1,0]][d];if(!slideIce(t,dx,dy))continue;const k=t.x+','+t.y;if(seen.has(k))continue;seen.add(k);q.push({x:t.x,y:t.y,path:[...s.path,d]});}}return null;}
