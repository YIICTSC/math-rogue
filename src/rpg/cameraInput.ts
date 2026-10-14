import type {RpgPreferences} from './preferences';
export function cameraDelta(x:number,y:number,p:Pick<RpgPreferences,'lookInvertX'|'lookInvertY'|'lookSensitivity'>,seconds?:number){
 const scale=seconds===undefined?1:Math.max(0,Math.min(.05,seconds));
 return {yaw:x*(seconds===undefined?-1:1)*(seconds===undefined?.004:1)*p.lookSensitivity*(p.lookInvertX?-1:1)*scale,pitch:-y*(seconds===undefined?.006:1.5)*p.lookSensitivity*(p.lookInvertY?-1:1)*scale};
}
export function cameraStick(x:number,y:number,deadZone:number){const length=Math.hypot(x,y);if(length<=deadZone)return {x:0,y:0};const force=Math.min(1,(length-deadZone)/(1-deadZone));return {x:x/length*force,y:y/length*force};}
