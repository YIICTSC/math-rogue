import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const {buildLesson}=await server.ssrLoadModule('/src/mini-games/gakuro-kart/questions.ts');
 const {lapQuestion,validLesson}=await server.ssrLoadModule('/src/mini-games/gakuro-kart/learning.ts');
 const race=buildLesson({mode:'ADDITION'},15);assert(validLesson(race));assert.equal(new Set(race.questions.map(q=>q.question)).size,15);
 for(let lap=0;lap<5;lap++)for(let i=0;i<3;i++)assert.equal(lapQuestion(race,lap,i),race.questions[lap*3+i]);
 const engine=await server.ssrLoadModule('/src/mini-games/gakuro-kart/engine.ts');
 const track=await server.ssrLoadModule('/src/mini-games/gakuro-kart/track.ts');
 const learning=await server.ssrLoadModule('/src/mini-games/gakuro-kart/learning.ts');
 const kart=engine.createRace();kart.lesson=race;engine.addRacer(kart,'p','Player');kart.phase='race';
 // Force different correct lanes to detect accidental first-lap grading.
 race.questions[0].correct=0;race.questions[3].correct=2;
 const driver=kart.players.p;driver.distance=track.getTrack(0).length+learning.QUIZ_GATES[0]-.2;driver.speed=20;driver.x=learning.laneCenter(2);
 engine.tick(kart,.05);assert.equal(driver.quizLap,1);assert.equal(driver.quizCorrect,1);assert.equal(driver.quizAnswers[0],2);
 const golf=await server.ssrLoadModule('/src/mini-games/gakuro-golf/engine.ts');
 const w=golf.createGolf(42);golf.addPlayer(w,'a','Alice');golf.addPlayer(w,'b','Bob');golf.startGolf(w,'Math');
 const seen=new Set();for(let round=0;round<12;round++){const p=w.players.a;p.phase='ready';assert(golf.command(w,'a',{type:'quiz'},history=>buildLesson({mode:'ADDITION'},3,history)));for(const q of p.lesson.questions){assert(!seen.has(q.question));seen.add(q.question);}p.hole=round%18;}
 assert.equal(w.players.b.questionHistory,undefined);assert(golf.command(w,'b',{type:'quiz'},history=>buildLesson({mode:'ADDITION'},3,history)));assert.equal(w.players.b.questionHistory.length,3);
 const assignment={title:'Custom',units:[],customProblems:Array.from({length:5},(_,i)=>({id:String(i),question:'Unique '+i,answer:'answer '+i,options:['x','y','z']}))};
 const history=[];const first=buildLesson({mode:'ADDITION',assignment},3,history),next=buildLesson({mode:'ADDITION',assignment},3,history);assert.equal(new Set([...first.questions,...next.questions.slice(0,2)].map(q=>q.question)).size,5);assert.equal(history.length,1);
 const duplicate={...assignment,customProblems:[...assignment.customProblems,assignment.customProblems[0]]};assert.equal(new Set(buildLesson({mode:'ADDITION',assignment:duplicate},15).questions.slice(0,5).map(q=>q.question)).size,5);
 console.log('PASS: distinct questions across five kart laps, twelve golf quizzes/holes, independent player history, custom deduplication and exhaustion rollover.');
}finally{await server.close();}
