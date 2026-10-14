import type {OnlineWorld,OnlineMode} from './onlineEngine';
import type {KartLesson} from '../gakuro-kart/learning';
import {validLesson} from '../gakuro-kart/learning';
import {MISSIONS} from './engine';
export type VrSettings={mode?:OnlineMode;missionId?:number;bombMap?:number;limit?:number;lesson?:KartLesson};
export function updateVrSettings(w:OnlineWorld,value:unknown){
 if(w.phase!=='lobby'||!value||typeof value!=='object'||Array.isArray(value))return false;
 const s=value as VrSettings;
 if(s.mode!==undefined&&!['coop','royale','bomb'].includes(s.mode))return false;
 if(s.missionId!==undefined&&(!Number.isInteger(s.missionId)||s.missionId<1||s.missionId>MISSIONS.length))return false;
 if(s.bombMap!==undefined&&(!Number.isInteger(s.bombMap)||s.bombMap<0||s.bombMap>2))return false;
 if(s.limit!==undefined&&(!Number.isInteger(s.limit)||s.limit<60||s.limit>900))return false;
 if(s.lesson!==undefined&&!validLesson(s.lesson,120))return false;
 if(s.mode!==undefined)w.mode=s.mode;
 if(s.missionId!==undefined){w.missionId=s.missionId;w.mission=structuredClone(MISSIONS[s.missionId-1]);}
 if(s.bombMap!==undefined)w.bombMap=s.bombMap;
 if(s.limit!==undefined)w.limit=s.limit;
 if(s.lesson!==undefined){w.lesson=structuredClone(s.lesson);for(const p of Object.values(w.players)){p.quizDeck=[];p.quizQuestions=[];p.quizCycle=0;p.lastQuestion=-1;p.answers=[];p.quiz=false;}}
 return true;
}
