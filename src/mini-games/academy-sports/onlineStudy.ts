import {validLesson,type KartLesson,type KartQuestion} from '../gakuro-kart/learning';
export type LessonFactory=(history:string[])=>KartLesson;
export interface StudyView {id:number;index:number;question:Omit<KartQuestion,'correct'>;selected:number|null;answer:number|null;}
export type StudyCommand={type:'answer';quizId:number;index:number;option:number}|{type:'continue';quizId:number;index:number};
/** The host owns the full lessons; each peer sees only its current question and revealed feedback. */
export class OnlineStudy {
 private factory:LessonFactory|undefined;
 private serial=0;
 private quizzes=new Map<string,{id:number;index:number;lesson:KartLesson;selected:number|null;answer:number|null}>();
 private histories=new Map<string,string[]>();
 title='';
 constructor(factory?:LessonFactory){if(factory)this.setFactory(factory);}
 setFactory(factory:LessonFactory){const sample=factory([]);if(!validLesson(sample)||sample.questions.length!==3)throw Error('出題できる単元を選んでください。');this.factory=factory;this.title=sample.title;}
 begin(ids:string[]){
  if(!this.factory)return false;
  const drafts=ids.map(id=>{const history=[...(this.histories.get(id)||[])],lesson=this.factory!(history);if(!validLesson(lesson)||lesson.questions.length!==3)throw Error('問題を準備できませんでした。');return{id,history,lesson:structuredClone(lesson)};});
  this.quizzes.clear();for(const d of drafts){this.histories.set(d.id,d.history.slice(-120));this.quizzes.set(d.id,{id:++this.serial,index:0,lesson:d.lesson,selected:null,answer:null});}return true;
 }
 get pending(){return this.quizzes.size>0;}
 has(id:string){return this.quizzes.has(id);}
 drop(id:string){this.quizzes.delete(id);}
 reset(){this.quizzes.clear();this.histories.clear();}
 command(id:string,c:StudyCommand){const q=this.quizzes.get(id);if(!q||c.quizId!==q.id||c.index!==q.index)return {accepted:false,correct:false};
  if(c.type==='answer'){if(q.selected!==null||!Number.isInteger(c.option)||c.option<0||c.option>3)return {accepted:false,correct:false};q.selected=c.option;q.answer=q.lesson.questions[q.index].correct;return {accepted:true,correct:q.answer===c.option};}
  if(c.type!=='continue'||q.answer===null)return {accepted:false,correct:false};
  if(++q.index===3)this.quizzes.delete(id);else{q.selected=null;q.answer=null;}return {accepted:true,correct:false};
 }
 view(id:string):StudyView|null {const q=this.quizzes.get(id);if(!q)return null;const {correct,...question}=q.lesson.questions[q.index];return {id:q.id,index:q.index,question:structuredClone(question),selected:q.selected,answer:q.answer};}
}
export function studyBreakKey(s:{sport:string;inning?:number;half?:number;setNumber?:number;contest?:number}){return s.sport+':'+(s.sport==='baseball'?s.inning:s.sport==='soccer'?s.half:s.sport==='volleyball'?s.setNumber:s.contest);}
