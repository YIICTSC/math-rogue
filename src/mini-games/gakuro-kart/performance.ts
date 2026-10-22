import type {Quality} from '../../three/storybookStyle';
export type KartQuality=Quality|'minimal';
export type ConnectionHints={saveData?:boolean;effectiveType?:string;downlink?:number;rtt?:number};
export function slowConnectionHint(hints?:ConnectionHints){
 return !!hints&&(!!hints.saveData||['slow-2g','2g'].includes(hints.effectiveType??'')||(!!hints.downlink&&hints.downlink<1.5)||(hints.rtt??0)>=350);
}
/** The server normally sends 10 snapshots/sec. Latch once, avoiding repeated
 * renderer rebuilds as a congested network alternates between fast and slow. */
export class KartConnectionHealth{
 slow=false;
 private lastPacket?:number;
 private delayed=0;
 private backlogAt?:number;
 packet(now:number){
  if(this.lastPacket!==undefined){const gap=now-this.lastPacket;this.delayed=gap>350?this.delayed+1:Math.max(0,this.delayed-1);if(gap>=1200||this.delayed>=3)this.slow=true;}
  this.lastPacket=now;
 }
 sample(now:number,buffered:number,expectSnapshots:boolean){
  if(expectSnapshots&&this.lastPacket!==undefined&&now-this.lastPacket>=1200)this.slow=true;
  if(buffered>=4096){this.backlogAt??=now;if(now-this.backlogAt>=1000)this.slow=true;}else this.backlogAt=undefined;
  return this.slow;
 }
 resume(now:number){this.lastPacket=now;this.delayed=0;this.backlogAt=undefined;}
}
export const kartRenderProfile=(quality:KartQuality)=>quality==='minimal'
 ?{minimal:true,pixelRatio:.65,maxPixels:640*360,fps:30,roadSegments:512}
 :{minimal:false,pixelRatio:quality==='low'?1:1.6,maxPixels:Infinity,fps:60,roadSegments:1024};
