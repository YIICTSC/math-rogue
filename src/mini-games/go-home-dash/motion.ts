import { floorAt } from './routes';
export interface MovingObstacle {
 type:string;x:number;y:number;vy:number;width:number;height:number;speedMult:number;
 phase?:number;baseY?:number;hopCooldown?:number;
}
/** Advance once, before player contacts. Rendering and collision use these same positions. */
export function advanceObstacleMotion(o:MovingObstacle,seed:number,distance:number,speed:number,frame:number,random:()=>number){
 o.x-=speed*o.speedMult;
 const floor=floorAt(seed,distance+o.x),ground=floor-o.height/2;
 if(o.type==='HOLE'){o.y=floor;return false;}
 if(o.type==='FLIGHT_GATE')return false;
 if(o.type==='ELEVATOR'){
  const next=floor-56-(1+Math.sin(frame*.025+(o.phase??0)))*24;o.vy=next-o.y;o.y=next;return false;
 }
 if(o.type==='SPRING'){o.y=ground;return false;}
 if(['PAPER_WYVERN','FIRE_FLY','WIND_SPIRIT'].includes(o.type)){
  o.baseY??=o.y;o.y=o.baseY+Math.sin(frame*(o.type==='FIRE_FLY'?.09:.035)+(o.phase??0))*(o.type==='WIND_SPIRIT'?28:16);return false;
 }
 const hopper=o.type==='JUMPING_SLIME'||o.type==='WATER_SLIME';
 if(hopper){
  o.hopCooldown=Math.max(0,(o.hopCooldown??0)-1);
  // Zero velocity at the apex is airborne, not a signal to snap to the floor.
  const grounded=o.y>=ground-.01&&o.vy>=0;
  if(grounded){o.y=ground;o.vy=0;if(o.hopCooldown===0&&o.x<500&&random()<.05)o.vy=-12;else return false;}
  o.vy+=.5;o.y+=o.vy;
  if(o.vy>=0&&o.y>=ground){o.y=ground;o.vy=0;o.hopCooldown=32;return true;}
  return false;
 }
 if(o.vy!==0){o.vy+=.5;o.y+=o.vy;if(o.y>=ground&&o.vy>=0){o.y=ground;o.vy=0;return true;}}
 else if(!['BIRD','DRONE','CLOCK_GHOST'].includes(o.type))o.y=ground;
 return false;
}
