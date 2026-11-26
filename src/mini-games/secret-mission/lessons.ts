import { GameMode, type AssignmentPayload } from '../../types';
import { buildLesson, type LessonSelection } from '../gakuro-kart/questions';
import type { Settings } from './rules';

const key=(value:unknown):value is string=>typeof value==='string'&&/^[A-Z0-9_]{1,80}$/.test(value);
const label=(value:unknown,max=160)=>typeof value==='string'?value.trim().slice(0,max):'';
const object=(raw:unknown)=>raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
const strings=(raw:unknown,max:number)=>Array.isArray(raw)?raw.filter((s):s is string=>typeof s==='string').slice(0,max):[];

function sanitizeSelection(raw:unknown):LessonSelection|undefined {
  if(raw===undefined||raw===null)return;
  const input=object(raw);
  if(!key(input.mode))throw new Error('この単元を選べません。');
  const assignment=object(input.assignment);
  let safe:AssignmentPayload|undefined;
  if(input.assignment){
    const units=(Array.isArray(assignment.units)?assignment.units:[]).slice(0,40).map((input,i)=>{
      const u=object(input), filter=object(u.filters), kind=label(filter.kind,40), values=strings(filter.values,100).map(s=>s.slice(0,64));
      return {id:String(i),name:label(u.name),modes:strings(u.modes,40).filter(key),targetCorrect:1,filters:kind?{kind,values}:null};
    });
    const customProblems=(Array.isArray(assignment.customProblems)?assignment.customProblems:[]).slice(0,48).map((input,i)=>{
      const q=object(input);
      return {id:'custom-'+i,question:label(q.question,800),answer:label(q.answer,180),options:strings(q.options,3).map(answer=>label(answer,180))};
    }).filter(q=>q.question&&q.answer);
    safe={
      id:'mission',title:label(assignment.title)||'Custom quiz',units,customProblems,
      dueAt:'',createdAt:'',gameMode:'FREE',answerMode:'CHOICE',
    };
  }
  return {mode:input.mode as GameMode,modes:strings(input.modes,40).filter(key),title:label(input.title)||undefined,assignment:safe};
}
export function missionLesson(source:unknown,difficulty:Settings['difficulty'],english=false){
  const selected=sanitizeSelection(source);
  const fallback=difficulty==='easy'?GameMode.ADDITION:difficulty==='hard'?'MATH_G7_U01' as GameMode:GameMode.MIXED;
  const title=difficulty==='easy'?(english?'Addition':'たし算'):difficulty==='hard'?(english?'Positive and negative numbers':'正の数・負の数'):(english?'Mixed arithmetic':'算数ミックス');
  return buildLesson(selected??{mode:fallback,title},240);
}

export function customMissionLesson(title:string,questions:{question:string;answer:string;options:string[]}[]):LessonSelection{
  return {mode:GameMode.ADDITION,assignment:{
    id:'mission',title,units:[],customProblems:questions.map((q,i)=>({...q,id:'custom-'+i})),dueAt:'',createdAt:'',gameMode:'FREE',answerMode:'CHOICE',
  }};
}
