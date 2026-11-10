import {normalizeInput,type Config,type Input,type Action} from './core';
import {createBaseball,stepBaseball,baseballAction,type Baseball} from './baseball';
import {createSoccer,stepSoccer,soccerAction,type Soccer} from './soccer';
import {createVolleyball,stepVolleyball,volleyballAction,type Volleyball} from './volleyball';
import {createFestival,stepFestival,festivalAction,type Festival} from './festival';
export type Match=Baseball|Soccer|Volleyball|Festival;
export function createMatch(c:Config):Match{return c.sport==='baseball'?createBaseball(c):c.sport==='soccer'?createSoccer(c):c.sport==='volleyball'?createVolleyball(c):createFestival(c);}
export function stepMatch(s:Match,input:Input,dt:number){if(!Number.isFinite(dt)||dt<=0)return;input=normalizeInput(input);const bounded=Math.min(.1,dt),count=Math.max(1,Math.ceil(bounded/(1/60))),step=bounded/count;for(let i=0;i<count;i++){if(s.sport==='baseball')stepBaseball(s,input,step);else if(s.sport==='soccer')stepSoccer(s,input,step);else if(s.sport==='volleyball')stepVolleyball(s,input,step);else stepFestival(s,input,step);}}
export function matchAction(s:Match,action:Action,input:Input){input=normalizeInput(input);if(s.sport==='baseball')baseballAction(s,action,input);else if(s.sport==='soccer')soccerAction(s,action);else if(s.sport==='volleyball')volleyballAction(s,action,input);else festivalAction(s,action,input);}
