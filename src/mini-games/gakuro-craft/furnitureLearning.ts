import {validLesson,type KartLesson} from '../gakuro-kart/learning';
import type {HomeGame,HomeGameWorld} from './homeGames';
export type FurnitureLearner={matches:number;batch:number;due:boolean;reason:'stages'|'matches';answers:number[];lesson?:KartLesson;at:number};
export type FurnitureLearningCommand={type:'game_learn_set';key:string;batch:number;lesson:KartLesson}|{type:'game_learn_answer';key:string;batch:number;index:number;option:number}|{type:'game_learn_finish';key:string;batch:number};
export function learner(w:HomeGameWorld,id:string){w.learning??={};return w.learning[id]??={matches:0,batch:0,due:false,reason:'matches',answers:[],at:w.time};}
export function queueLearning(w:HomeGameWorld,id:string,reason:'stages'|'matches'){const l=learner(w,id);if(l.due)return;l.batch++;l.due=true;l.reason=reason;l.answers=[];delete l.lesson;l.at=w.time;}
export function learningCommand(w:HomeGameWorld,g:HomeGame,id:string,c:FurnitureLearningCommand){const l=learner(w,id);if(!l.due||l.batch!==c.batch||w.paused)return false;
 if(c.type==='game_learn_set'){if(l.lesson||!validLesson(c.lesson,3)||c.lesson.questions.length!==3||JSON.stringify(c.lesson).length>100000)return false;l.lesson=JSON.parse(JSON.stringify(c.lesson));l.at=w.time;return true;}
 if(c.type==='game_learn_answer'){if(!l.lesson||c.index!==l.answers.length||!Number.isInteger(c.option)||c.option<0||c.option>3||l.answers.length>=3)return false;l.answers.push(c.option);l.at=w.time;return true;}
 if(l.answers.length!==3)return false;l.due=false;return true;
}
export function countFurnitureMatch(w:HomeGameWorld,g:HomeGame){if(g.kind==='skyadventure'||g.phase!=='finished'||g.learningCounted)return;g.learningCounted=true;for(const id of g.players){const l=learner(w,id);l.matches++;if(l.matches%3===0)queueLearning(w,id,'matches');}}
