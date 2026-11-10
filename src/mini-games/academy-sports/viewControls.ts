import type {Input} from './core';
import type {Match} from './engine';
/** Convert screen-space controls once at the UI boundary; network commands use world axes. */
export function screenToWorld(s:Match,input:Input,landscape:boolean):Input {
 if(s.sport==='baseball'&&s.half!==s.config.team&&['set','meter','windup','pitch'].includes(s.stage))return {...input,x:-input.x,aimX:-input.aimX};
 if(s.sport==='soccer'&&landscape)return {...input,x:input.z,z:-input.x,aimX:input.aimZ,aimZ:-input.aimX};
 return {...input};
}
