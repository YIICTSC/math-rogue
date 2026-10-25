/** Orthogonal light circuits: press a plate to toggle itself and its neighbours. */
export type Circuit={bits:number;initial:number;moves:number};
export function toggle(bits:number,cell:number){const x=cell%4,y=Math.floor(cell/4);for(const[dx,dy]of[[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<4&&ny>=0&&ny<4)bits^=1<<(ny*4+nx);}return bits;}
export function circuitChamber(seed:number):Circuit{let bits=65535;let state=(seed+31)*7919;for(let i=0;i<7+seed%5;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;bits=toggle(bits,state%16);}if(bits===65535)bits=toggle(bits,seed%16);return{bits,initial:bits,moves:0};}
export function solveCircuit(bits:number){for(let mask=0;mask<65536;mask++){let state=bits;for(let i=0;i<16;i++)if(mask&(1<<i))state=toggle(state,i);if(state===65535)return Array.from({length:16},(_,i)=>i).filter(i=>mask&(1<<i));}return null;}
export const circuitTargets=Array.from({length:16},(_,i)=>({x:7.5+i%4*2,y:3.5+Math.floor(i/4)*2}));
