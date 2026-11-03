import assert from 'node:assert/strict';
/** Drive the same public movement/action methods used by the browser. */
export function solveStarMechanism(w,M){
 if(!w.mechanismInfo)return;
 const press=(x,y,tool=false)=>{w.x=x;w.y=y;w.attack=0;w.cancelCombo();w.stamina=2;w.swing(tool);};
 if(w.circuit){for(const i of M.solveCircuit(w.circuit.bits)){const p=M.circuitTargets[i];press(p.x,p.y);}}
 else if(w.ice){for(const d of M.solveIce(w.ice)){[w.dx,w.dy]=[[0,-1],[1,0],[0,1],[-1,0]][d];press(4.5,6.5);}}
 else if(w.beam){const solution=M.solveBeam(w.beam);w.beam.mirrors.forEach((m,i)=>{if(m.slash!==solution[i])press(m.x+.5,m.y+.5);});}
 else if(w.blocks){let x=10,y=8;for(const d of M.solveBlocks(w.s.chapter+w.s.room)){const[dx,dy]=[[0,-1],[1,0],[0,1],[-1,0]][d];w.x=x+.5;w.y=y+.5;w.pushCooldown=0;w.move(dx,dy,.3);x+=dx;y+=dy;}}
 else switch(w.mechanismInfo.kind){
  case 'forge':w.s.tool=Math.min(7,w.s.chapter);press(10.5,6.5,true);break;
  case 'bells':for(const[x,y]of w.targets)press(x,y);break;
  case 'wind':w.dx=1;w.dy=0;press(8.5,6.5);w.dx=0;w.dy=-1;press(12.5,6.5);break;
  case 'tide':press(8.5,6.5);assert(w.can(10.5,6.5),'Drained channel must be traversable');press(12.5,6.5);break;
  case 'lens':press(8.5,6.5);press(12.5,6.5);break;
  case 'balance':case 'memory':for(const[x,y]of w.targets){w.x=x;w.y=y;w.tick(.01,0,0);}break;
  case 'relay':press(8.5,6.5);w.tick(.01,0,0);press(12.5,6.5);break;
  case 'pulse':for(let i=0;i<3;i++){w.time=Math.PI/4+i*Math.PI;press(10.5,6.5);}break;
 }
 assert(w.s.solved.includes(M.key(w.s)),'Unsolved '+M.key(w.s)+' '+w.mechanismInfo.kind);
}
