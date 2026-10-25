/** Fixed authored push-block chambers. The release check searches for a solution to every layout. */
export const BLOCK_LAYOUTS=[
 ['#######','# . . #','# $ $ #','#     #','#  #  #','#  @  #','### ###'],
 ['#######','#  .  #','# #$  #','# . $ #','#  #  #','#  @  #','### ###'],
 ['#######','# ..  #','# $$# #','#     #','# #   #','#  @  #','### ###'],
 ['#######','#  .  #','# $   #','# #$. #','#     #','#  @  #','### ###'],
 ['#######','# . . #','#  #  #','# $ $ #','#     #','#  @  #','### ###'],
 ['#######','# .   #','# $ # #','#  $. #','#     #','#  @  #','### ###'],
] as const;
export type BlockState={walls:{x:number;y:number}[];boxes:{x:number;y:number}[];goals:{x:number;y:number}[]};
export function blockChamber(index:number):BlockState{const rows=BLOCK_LAYOUTS[index%BLOCK_LAYOUTS.length],out:BlockState={walls:[],boxes:[],goals:[]};rows.forEach((row,y)=>Array.from(row).forEach((c,x)=>{const p={x:x+7,y:y+3};if(c==='#')out.walls.push(p);if(c==='$')out.boxes.push(p);if(c==='.')out.goals.push(p);}));return out;}
export const blocksSolved=(p:BlockState)=>p.goals.every(g=>p.boxes.some(b=>b.x===g.x&&b.y===g.y));
/** Solver is used by content QA only; the shipped simulation never imports it. */
export function solveBlocks(index:number){const p=blockChamber(index),walls=new Set(p.walls.map(p=>p.x+','+p.y)),goals=new Set(p.goals.map(p=>p.x+','+p.y)),dirs=[[0,-1],[1,0],[0,1],[-1,0]],todo=[{x:10,y:8,boxes:p.boxes.map(p=>p.x+','+p.y).sort(),path:[] as number[]}],seen=new Set<string>();
 for(let at=0;at<todo.length&&at<150000;at++){const s=todo[at];if(s.boxes.every(b=>goals.has(b)))return s.path;for(let i=0;i<4;i++){const [dx,dy]=dirs[i],x=s.x+dx,y=s.y+dy,k=x+','+y;if(x<7||x>13||y<3||y>9||walls.has(k))continue;const boxes=[...s.boxes],b=boxes.indexOf(k);if(b>=0){const next=(x+dx)+','+(y+dy);if(walls.has(next)||boxes.includes(next)||x+dx<7||x+dx>13||y+dy<3||y+dy>9)continue;boxes[b]=next;boxes.sort();}const hash=x+','+y+':'+boxes.join(';');if(seen.has(hash))continue;seen.add(hash);todo.push({x,y,boxes,path:[...s.path,i]});}}return null;}
