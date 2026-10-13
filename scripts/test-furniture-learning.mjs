import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {completeFurnitureQuiz,testLesson} from './fixtures/furniture-quiz.mjs';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{const {gameCommand,tickGames,gameKind}=await server.ssrLoadModule('/src/mini-games/gakuro-craft/homeGames.ts');const {GAME_LABELS}=await server.ssrLoadModule('/src/mini-games/gakuro-craft/partyGames.ts');
 for(const kind of Object.keys(GAME_LABELS).filter(k=>gameKind(k)&&k!=='skyadventure')){const home={tile:0,level:3,furniture:[{slot:0,item:kind}]},w={time:1,paused:false,tiles:[{homeOwner:'p'}],games:{},players:{p:{id:'p',name:'p',indoors:true,homeTile:0,progress:{home}}}};const p=w.players.p;gameCommand(w,p,{type:'game_join',slot:0});const g=w.games['0:0'];
  for(let round=1;round<=3;round++){if(g.rhythm)g.rhythm.ready=[true];gameCommand(w,p,{type:'game_start',key:g.key});assert.equal(g.phase,'playing');g.phase='finished';tickGames(w,0);assert.equal(w.learning.p.matches,round);assert.equal(w.learning.p.due,round===3);tickGames(w,0);assert.equal(w.learning.p.matches,round);}
  gameCommand(w,p,{type:'game_start',key:g.key});assert.equal(g.phase,'finished','Learning gate blocks a replay');const l=w.learning.p;gameCommand(w,p,{type:'game_learn_set',key:g.key,batch:l.batch,lesson:{...testLesson,questions:testLesson.questions.slice(0,2)}});assert(!l.lesson);w.paused=true;gameCommand(w,p,{type:'game_learn_set',key:g.key,batch:l.batch,lesson:testLesson});assert(!l.lesson);w.paused=false;
  gameCommand(w,p,{type:'game_leave',key:g.key});assert.equal(Object.keys(w.games).length,0);assert(w.learning.p.due);gameCommand(w,p,{type:'game_join',slot:0});const again=w.games['0:0'];assert(completeFurnitureQuiz(gameCommand,w,again,'p'));if(again.rhythm)again.rhythm.ready=[true];gameCommand(w,p,{type:'game_start',key:again.key});assert.equal(again.phase,'playing');assert.equal(w.learning.p.matches,3);assert.equal(w.learning.p.answers.length,3);
 }
 console.log('PASS: all ten other minigames trigger exactly three questions after three completions, block replay, reject malformed/stale/paused commands, and retain learning through leave/rejoin.');
}finally{await server.close();}
