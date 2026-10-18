/** Versioned elevation for new adventures. Saved worlds without terrainStyle retain their ground. */
export const ADVENTURE_PEAKS=[
 {x:171,z:74,radius:21,height:38},
 {x:177,z:13,radius:14,height:28},
 {x:12,z:12,radius:15,height:22},
] as const;
export function adventureElevation(x:number,z:number,peaks:readonly AdventurePeak[]=ADVENTURE_PEAKS){
 return Math.max(0,...peaks.map(p=>{
  const r=Math.hypot(x-p.x,z-p.z),cone=Math.max(0,1-r/p.radius);
  return p.height*cone**.8;
 }));
}
/** Manhattan distance field gives roads and shores continuous verges in every direction.
 * Recomputed once per world revision, not for each block/ray sample. */
export function adventureRoadGrades(tiles:readonly string[],width:number,height:number){
 const distances=new Uint8Array(width*height);distances.fill(32);
 for(let z=0;z<height;z++)for(let x=0;x<width;x++){
  const i=z*width+x;
  if(tiles[i]==='road'||tiles[i]==='water')distances[i]=0;
  else {if(x)distances[i]=Math.min(distances[i],distances[i-1]+1);if(z)distances[i]=Math.min(distances[i],distances[i-width]+1);}
 }
 for(let z=height-1;z>=0;z--)for(let x=width-1;x>=0;x--){const i=z*width+x;if(x<width-1)distances[i]=Math.min(distances[i],distances[i+1]+1);if(z<height-1)distances[i]=Math.min(distances[i],distances[i+width]+1);}
 return distances;
}
export interface AdventurePeak {x:number;z:number;radius:number;height:number}
/** Choose spacious sites before play begins, then save them so building never relocates a mountain. */
export function planAdventurePeaks(tiles:readonly string[],sites:readonly {x:number;y:number;kind:string}[],width:number,height:number):AdventurePeak[]{
 const grades=adventureRoadGrades(tiles,width,height),candidates:{x:number;z:number;clearance:number}[]=[];
 const foundations=sites.filter(s=>s.kind!=='npc');
 for(let z=3;z<height-3;z++)for(let x=3;x<width-3;x++){
  let clearance=Math.min(grades[z*width+x]-1,x,z,width-1-x,height-1-z);
  for(const s of foundations)clearance=Math.min(clearance,Math.max(0,Math.abs(x-s.x)+Math.abs(z-s.y)-2));
  if(clearance>=7)candidates.push({x,z,clearance});
 }
 candidates.sort((a,b)=>b.clearance-a.clearance);
 const peaks:AdventurePeak[]=[];
 for(const c of candidates){if(peaks.some(p=>Math.hypot(p.x-c.x,p.z-c.z)<38))continue;peaks.push({x:c.x,z:c.z,radius:Math.min(30,c.clearance*2),height:Math.min(48,c.clearance*3)});if(peaks.length===3)break;}
 return peaks.length?peaks:ADVENTURE_PEAKS.map(p=>({...p}));
}
