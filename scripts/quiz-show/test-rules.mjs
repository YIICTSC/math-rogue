import assert from 'node:assert/strict';
import { build } from 'esbuild';
const out = await build({ stdin: { contents: "export * from './src/quiz-show/engine';export * from './src/quiz-show/authority';export * from './src/quiz-show/wolf';", resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const E = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
const H = {id:'host',role:'host'}, player = id => ({id,role:'player'}), screen = {id:'screen',role:'screen'};
const q = (extra={}) => ({id:'q1',prompt:'A secret question',answer:'Moon',aliases:['月','つき'],options:[],format:'TEXT',seconds:30,points:100,...extra});
const good = (w,a,actor=H,now=1000) => assert.equal(E.act(w,actor,a,now),null,JSON.stringify(a));
function setup(mode='STANDARD',n=4,question=q()) {
 const w=E.createShow('Test',0);for(let i=0;i<n;i++)assert.equal(E.addAnswerer(w,'p'+i,'Player '+i),null);
 good(w,{type:'configure',title:'Test',mode,teamCount:2});good(w,{type:'bank',questions:[question]});good(w,{type:'start'});good(w,{type:'open',roundId:w.round.id});return w;
}
const answer=(w,id,text,extra={})=>good(w,{type:'answer',roundId:w.round.id,text,ink:[],submit:true,...extra},player(id));
const close=w=>good(w,{type:'close',roundId:w.round.id});const score=w=>{if(w.phase!=='voting')good(w,{type:'autoJudge',roundId:w.round.id});good(w,{type:'score',roundId:w.round.id});};
// Admission and authorization: host is never an answerer; 40 is an actual roster cap.
{
 const a=new E.ShowAuthority('private_host_secret_123456');assert.equal(a.join({protocol:1,role:'host',key:'wrong_secret_123456'}).error,'AUTH');
 for(let i=0;i<40;i++)assert(a.join({protocol:1,role:'player',key:'player_secret_'+String(i).padStart(8,'0'),name:'Name'+i}).actor);
 assert.equal(Object.keys(a.world.players).length,40);assert.equal(a.join({protocol:1,role:'player',key:'player_secret_overflow',name:'41st'}).error,'FULL');
 const re=a.join({protocol:1,role:'player',key:'player_secret_00000000',name:'Changed'});assert(re.actor);assert.equal(Object.keys(a.world.players).length,40);
 assert.equal(a.command(re.actor,{type:'finish'}),'AUTH');assert.equal(a.command(screen,{type:'adjust',playerId:re.actor.id,delta:100}),'AUTH');
 for(let i=0;i<4;i++)assert(a.join({protocol:1,role:'screen',key:'screen_secret_'+i+'xxxxxxxx'}).actor);
 assert.equal(a.join({protocol:1,role:'screen',key:'screen_secret_overflow'}).error,'FULL');
 console.log('PASS 40 seats, four screens, keyed resume and host/screen authority');
}
// Private answers, future questions, board fetch authorization, stale and duplicate packets.
{
 const w=setup();answer(w,'p0','つき');const other=E.viewFor(w,player('p1'));
 assert.equal(other.round.tiles[0].text,undefined);assert.equal(other.round.answer,undefined);assert.equal(other.host,undefined);assert(!JSON.stringify(other).includes('Moon'));
 assert.equal(E.inkFor(w,player('p1'),w.round.id,'p0'),null);assert.equal(E.inkFor(w,screen,w.round.id,'p0'),null);
 assert.equal(E.act(w,player('p0'),{type:'answer',roundId:w.round.id,text:'X',ink:[],submit:true},1000),'ANSWER');
 assert.equal(E.act(w,player('p1'),{type:'answer',roundId:'old',text:'X',ink:[],submit:true},1000),'LATE');
 assert.equal(E.act(w,player('p1'),{type:'configure',title:'bad',mode:'TEAMS',teamCount:2},1000),'AUTH');
 close(w);good(w,{type:'reveal',roundId:w.round.id,playerId:'p0'});assert.equal(E.viewFor(w,screen).round.tiles[0].text,'つき');assert.equal(E.viewFor(w,screen).round.answer,undefined);
 score(w);assert.equal(w.players.p0.score,100);score(w);assert.equal(w.players.p0.score,100);
 good(w,{type:'grade',roundId:w.round.id,playerId:'p0',correct:false});assert.equal(w.players.p0.score,0);good(w,{type:'grade',roundId:w.round.id,playerId:'p0',correct:true});assert.equal(w.players.p0.score,100);
 console.log('PASS answer/ink secrecy, one-by-one reveal, stale and duplicate rejection, idempotent regrading');
}
{
 const w=setup('STANDARD',2,q({format:'FLIP'})),ink=[{c:0,w:7,p:[10,20,30,40]}];answer(w,'p0','',{ink});assert.equal(E.inkFor(w,player('p1'),w.round.id,'p0'),null);close(w);
 assert.equal(E.act(w,H,{type:'score',roundId:w.round.id},1000),'ANSWER');good(w,{type:'grade',roundId:w.round.id,playerId:'p0',correct:true});score(w);assert.equal(w.players.p0.score,100);
 assert.deepEqual(E.inkFor(w,screen,w.round.id,'p0').ink,ink);
 assert(!E.validInk([{c:0,w:7,p:[Infinity,0]}]));assert(!E.validInk([{c:0,w:7,p:Array(3602).fill(0)}]));assert(!E.validInk([{c:99,w:7,p:[0,0]}]));
 console.log('PASS bounded vector panels, private board fetching and mandatory handwriting judgment');
}
{
 const w=setup('BUZZER');good(w,{type:'buzz',roundId:w.round.id},player('p0'));assert.equal(E.act(w,player('p1'),{type:'buzz',roundId:w.round.id},1000),'BUZZ');
 answer(w,'p0','wrong');good(w,{type:'grade',roundId:w.round.id,playerId:'p0',correct:false});assert.equal(w.round.buzzer,null);assert(w.round.locked.includes('p0'));
 good(w,{type:'buzz',roundId:w.round.id},player('p1'));answer(w,'p1','Moon');close(w);score(w);assert.equal(w.players.p1.score,100);assert.equal(w.players.p0.score,0);
 console.log('PASS buzzer arrival order, exclusive answer, lockout and reopened chance');
}
{
 const w=setup('SURVIVAL');answer(w,'p0','Moon');answer(w,'p1','wrong');close(w);score(w);assert.equal(w.players.p0.lives,3);assert.equal(w.players.p1.lives,2);score(w);assert.equal(w.players.p1.lives,2);
 good(w,{type:'grade',roundId:w.round.id,playerId:'p1',correct:true});assert.equal(w.players.p1.lives,3);
 console.log('PASS life loss and regrade recovery without duplicate penalties');
}
{
 const w=setup('TEAMS');assert.deepEqual(Object.values(w.players).map(p=>p.team),[0,1,0,1]);answer(w,'p0','Moon');answer(w,'p2','Moon');close(w);score(w);assert.equal(Object.values(w.players).filter(p=>p.team===0).reduce((n,p)=>n+p.score,0),200);
 console.log('PASS team balancing and member-score aggregation');
}
{
 const w=setup('CONSENSUS');for(let i=0;i<4;i++)answer(w,'p'+i,i%2?'リンゴ':'りんご');close(w);score(w);assert(Object.values(w.players).every(p=>p.score===100));
 const f=setup('CONSENSUS',2,q({format:'FLIP',answer:''}));for(let i=0;i<2;i++)answer(f,'p'+i,'',{ink:[{c:0,w:4,p:[0,0]}]});close(f);assert.equal(E.act(f,H,{type:'score',roundId:f.round.id},1000),'ANSWER');good(f,{type:'consensus',roundId:f.round.id,agree:true});score(f);assert.equal(f.players.p0.score,100);
 console.log('PASS normalized text and manually judged picture consensus');
}
{
 const w=setup('MAJORITY');answer(w,'p0','A');answer(w,'p1','A');answer(w,'p2','B');answer(w,'p3','B');close(w);score(w);assert(Object.values(w.players).every(p=>p.score===100));
 const s=setup('MAJORITY',3);answer(s,'p0','A');answer(s,'p1','B');answer(s,'p2','C');close(s);score(s);assert(Object.values(s.players).every(p=>p.score===0));
 console.log('PASS majority ties and no singleton wins');
}
{
 const w=setup('NEAREST',4,q({answer:'100'}));['９０','110','1,000',''].forEach((s,i)=>{if(s)answer(w,'p'+i,s)});close(w);score(w);assert.equal(w.players.p0.score,100);assert.equal(w.players.p1.score,100);assert.equal(w.players.p2.score,70);assert.equal(w.players.p3.score,0);
 assert.equal(E.numericAnswer(''),null);assert.equal(E.numericAnswer('Infinity'),null);assert.equal(E.numericAnswer('１２，３４５'),12345);
 console.log('PASS nearest-number ranking, equal distances, full-width normalization and unanswered exclusion');
}
{
 const w=setup('DRAW',3,q({format:'TEXT',answer:'penguin'})),artist=w.round.artist;assert.equal(artist,'p0');const guest=E.viewFor(w,player('p1'));assert.equal(guest.round.prompt,'');assert(!JSON.stringify(guest).includes('penguin'));
 good(w,{type:'answer',roundId:w.round.id,text:'',ink:[{c:0,w:7,p:[0,0,20,30]}],submit:false},player(artist));assert(E.inkFor(w,screen,w.round.id,artist));answer(w,'p1','penguin');close(w);score(w);assert.equal(w.players.p1.score,100);assert.equal(w.players[artist].score,50);
 console.log('PASS secret artist topic, live public ink, guesses and artist bonus');
}
{
 const w=setup('VOTE',3,q({answer:''}));for(let i=0;i<3;i++)answer(w,'p'+i,'Funny '+i);close(w);good(w,{type:'voting',roundId:w.round.id});assert.equal(E.act(w,player('p0'),{type:'vote',roundId:w.round.id,playerId:'p0'},1000),'VOTE');
 good(w,{type:'vote',roundId:w.round.id,playerId:'p1'},player('p0'));good(w,{type:'vote',roundId:w.round.id,playerId:'p1'},player('p2'));good(w,{type:'vote',roundId:w.round.id,playerId:'p0'},player('p1'));score(w);assert.equal(w.players.p1.score,20);score(w);assert.equal(w.players.p1.score,20);
 console.log('PASS creative voting, no self-vote, per-voter deduplication and counted results');
}
{
 const w=setup();good(w,{type:'pause',roundId:w.round.id},H,2000);assert.equal(w.round.remaining,29000);E.tickShow(w,500000);assert.equal(w.phase,'open');assert.equal(E.act(w,player('p0'),{type:'answer',roundId:w.round.id,text:'Moon',ink:[],submit:true},500000),'LATE');
 good(w,{type:'pause',roundId:w.round.id},H,500000);assert.equal(w.round.deadline,529000);good(w,{type:'extraTime',roundId:w.round.id},H,500000);assert.equal(w.round.deadline,539000);
 assert.equal(E.act(w,player('p0'),{type:'answer',roundId:w.round.id,text:'Moon',ink:[],submit:true},539000),'LATE');assert.equal(w.phase,'closed');
 console.log('PASS wall-clock deadline races, pause, extension and resume');
}
// Hidden-role mode follows the published 3–15 player distribution and extends to 40.
{
 const expected={3:[2,0,0,0,0,1],5:[3,1,0,0,0,1],7:[3,1,0,1,0,2],8:[3,1,1,1,0,2],9:[3,1,1,1,1,2],11:[5,1,1,1,0,3],15:[8,1,1,1,1,3]};
 for(const[n,values]of Object.entries(expected)){const d=E.wolfDistribution(+n);assert.deepEqual(['HUMAN','SEER','MEDIUM','GUARD','MAD','WOLF'].map(r=>d[r]),values);}
 for(let n=3;n<=40;n++){const d=E.wolfDistribution(n);assert.equal(Object.values(d).reduce((a,b)=>a+b,0),n);assert(d.HUMAN>=1&&d.WOLF*2<n);}
 const w=setup('WOLF',9,q({answer:''})),g=w.wolf;assert.equal(w.accepting,false);assert.equal(E.addAnswerer(w,'late','Late'),'CLOSED');
 const wolfIds=Object.keys(g.seats).filter(id=>g.seats[id].role==='WOLF'),mad=Object.keys(g.seats).find(id=>g.seats[id].role==='MAD');
 for(const id of Object.keys(g.seats)){const v=E.viewFor(w,player(id));assert(v.wolf.mine);assert.equal(v.wolf.roles,undefined);if(id===mad)assert.equal(v.wolf.allies,undefined);}
 assert.equal(E.viewFor(w,screen).wolf.mine,undefined);assert.equal(E.viewFor(w,screen).wolf.roles,undefined);assert.deepEqual(E.viewFor(w,player(wolfIds[0])).wolf.allies.sort(),wolfIds.sort());
 for(let round=0;round<5;round++){
  if(round)good(w,{type:'open',roundId:w.round.id});for(const id of Object.keys(g.seats))answer(w,id,id===wolfIds[0]?'B':'A');close(w);score(w);good(w,{type:'next',roundId:w.round.id});
 }
 assert.equal(w.phase,'review');assert.equal(w.index,4);good(w,{type:'wolfReview',value:true},player('p0'));good(w,{type:'wolfResolve'});assert.equal(w.phase,'trial');
 for(const id of Object.keys(g.seats))good(w,{type:'wolfVote',playerId:id===wolfIds[0]?'':wolfIds[0]},player(id));good(w,{type:'wolfResolve'});assert.equal(w.phase,'night');assert.equal(g.seats[wolfIds[0]].active,false);assert.equal(g.seats[wolfIds[0]].role,'HUMAN');
 const seer=Object.keys(g.seats).find(id=>g.seats[id].role==='SEER'),guard=Object.keys(g.seats).find(id=>g.seats[id].role==='GUARD'),medium=Object.keys(g.seats).find(id=>g.seats[id].role==='MEDIUM');
 assert(g.seats[medium].reports.at(-1).wolf);const target=Object.keys(g.seats).find(id=>g.seats[id].role==='HUMAN'&&g.seats[id].active);
 good(w,{type:'wolfNight',playerId:target},player(wolfIds[1]));good(w,{type:'wolfNight',playerId:target},player(guard));good(w,{type:'wolfNight',playerId:wolfIds[1]},player(seer));
 assert.equal(E.act(w,player(guard),{type:'wolfNight',playerId:guard},1000),'VOTE');good(w,{type:'wolfResolve'});assert.equal(w.phase,'dawn');assert(g.seats[target].active);assert(g.seats[seer].reports.at(-1).wolf);assert.equal(g.event.kind,'safe');
 good(w,{type:'next',roundId:w.round.id});good(w,{type:'open',roundId:w.round.id});assert(w.round.eligible.includes(wolfIds[0]),'Converted humans continue answering');
 w.phase='night';g.night={};assert.equal(E.act(w,player(guard),{type:'wolfNight',playerId:target},1000),'VOTE');
 console.log('PASS hidden roles, role privacy, 5-question deliberation, banishment conversion, medium/seer and guard protection');
}
{
 const w=setup('WOLF',4,q({answer:''}));for(let i=0;i<10;i++){
  for(const id of Object.keys(w.wolf.seats))answer(w,id,'A');close(w);score(w);if(i===9)break;good(w,{type:'next',roundId:w.round.id});if(w.phase==='review'){for(const id of Object.keys(w.wolf.seats))good(w,{type:'wolfReview',value:false},player(id));good(w,{type:'wolfResolve'});}good(w,{type:'open',roundId:w.round.id});
 }
 assert.equal(w.wolf.matches,10);assert.equal(w.phase,'finished');assert.equal(w.wolf.winner,'HUMAN');assert(E.viewFor(w,screen).wolf.roles);
 const g=E.startWolves(['a','b','c']);const wolf=Object.keys(g.seats).find(id=>g.seats[id].role==='WOLF');for(const id of Object.keys(g.seats))if(id!==wolf){g.seats[id].active=false;break;}assert.equal(E.checkWolfWinner(g),'WOLF');g.seats[wolf].role='HUMAN';g.seats[wolf].active=false;g.winner=null;assert.equal(E.checkWolfWinner(g),'HUMAN');
 console.log('PASS 10-agreement victory, skipped nights, repeating packs, wolf parity and all-wolves-converted victory');
}
console.log('All quiz show rule tests passed.');
// Explicit basic-show flow requested by the host: live manual judgment and public results only after closure.
{
 const w=setup('STANDARD',3,q());answer(w,'p0','Moon');assert.equal(E.act(w,H,{type:'score',roundId:w.round.id},1000),'PHASE');
 good(w,{type:'grade',roundId:w.round.id,playerId:'p0',correct:true});assert.equal(E.viewFor(w,player('p1')).round.tiles[0].correct,undefined);answer(w,'p1','Wrong');close(w);
 assert.equal(E.act(w,H,{type:'publish',roundId:w.round.id},1000),'ANSWER','Unjudged free input blocks the all-results reveal');good(w,{type:'grade',roundId:w.round.id,playerId:'p1',correct:false});good(w,{type:'publish',roundId:w.round.id});
 const publicView=E.viewFor(w,screen);assert(publicView.round.showJudgments);assert.equal(publicView.round.tiles[0].correct,true);assert.equal(publicView.round.tiles[1].correct,false);assert.equal(publicView.round.tiles[2].correct,false);assert(publicView.round.tiles.every(t=>t.visible));assert.equal(publicView.round.answer,'Moon');
 console.log('PASS live host checks for free input, incomplete-check gate, manual deadline and all-answer/correctness publication');
}
{
 const w=setup('STANDARD',2,q({format:'CHOICE',options:['1.5','15','5!','5'],answer:'1.5'}));answer(w,'p0','15');answer(w,'p1','1.5');assert.equal(w.round.grades.p0,false);assert.equal(w.round.grades.p1,true);assert.equal(E.viewFor(w,screen).round.tiles[1].correct,undefined);close(w);good(w,{type:'publish',roundId:w.round.id});good(w,{type:'score',roundId:w.round.id});assert.equal(w.players.p1.score,100);
 assert.notEqual(E.normalizeAnswer('1.5'),E.normalizeAnswer('15'));assert.notEqual(E.normalizeAnswer('5!'),E.normalizeAnswer('5'));
 console.log('PASS immediate automatic multiple-choice judgment without decimal or factorial false matches');
}
{
 const w=E.createShow();for(let i=0;i<2;i++)E.addAnswerer(w,'p'+i,'P'+i);const bank=Array.from({length:12},(_,i)=>q({id:'q'+i,prompt:'Question '+i,answer:'A'+i,format:'CHOICE',options:['A'+i,'B'+i,'C'+i,'D'+i]}));good(w,{type:'bank',questions:bank});good(w,{type:'plan',order:'RANDOM',limit:4,shuffleChoices:true});good(w,{type:'start'});assert.equal(w.queue.length,4);assert.equal(new Set(w.queue).size,4);assert.equal(E.viewFor(w,H).questionCount,4);
 for(let i=0;i<4;i++){good(w,{type:'open',roundId:w.round.id});assert.equal(w.round.question.id,bank[w.queue[i]].id);assert.equal(w.round.question.answer,bank[w.queue[i]].answer);assert.deepEqual([...w.round.question.options].sort(),[...bank[w.queue[i]].options].sort());close(w);good(w,{type:'publish',roundId:w.round.id});good(w,{type:'score',roundId:w.round.id});good(w,{type:'next',roundId:w.round.id});}assert.equal(w.phase,'finished');
 const positions=new Set();for(let i=0;i<40;i++){const s=setup('STANDARD',1,q({format:'CHOICE',answer:'A',options:['A','B','C','D']}));positions.add(s.round.question.options.indexOf('A'));}assert(positions.size>1);
 console.log('PASS ordered/random plans, distinct limited questions, correct-answer position shuffle and exact end count');
}
{
 const w=setup('BUZZER',2,q({format:'CHOICE',answer:'A',options:['A','B']}));good(w,{type:'buzz',roundId:w.round.id},player('p0'));answer(w,'p0','B');assert.equal(w.round.grades.p0,false);assert.equal(w.round.buzzer,null);good(w,{type:'buzz',roundId:w.round.id},player('p1'));
 const s=setup('SURVIVAL',3);for(const id of Object.keys(s.players)){s.players[id].lives=1;s.round.startLives[id]=1;}answer(s,'p0','Moon');close(s);score(s);assert.equal(s.phase,'finished');assert.equal(s.players.p0.lives,1);assert.equal(s.players.p1.lives,0);console.log('PASS automatic choice-buzzer reopening and survival final-standing finish');
}

// Shared curriculum choice answers are public to every participant only after close.
for(const timeout of [false,true]){
 const w=E.createShow();E.addAnswerer(w,'one','One');E.addAnswerer(w,'two','Two');E.addAnswerer(w,'three','No answer');
 good(w,{type:'bank',questions:[q({format:'CHOICE',answer:'A',options:['A','a','B','C']})]});good(w,{type:'start'});good(w,{type:'open',roundId:w.round.id});
 good(w,{type:'answer',roundId:w.round.id,text:'A',ink:[],submit:true},player('one'));good(w,{type:'answer',roundId:w.round.id,text:'a',ink:[],submit:true},player('two'));
 assert.equal(E.viewFor(w,player('one')).round.tiles.find(t=>t.id==='two').visible,false);
 if(timeout)E.tickShow(w,w.round.deadline+1);else good(w,{type:'close',roundId:w.round.id});
 for(const actor of [H,player('one'),player('two'),screen]){const v=E.viewFor(w,actor);assert.equal(v.phase,'reveal');assert(v.round.tiles.every(t=>t.visible));assert.deepEqual(v.round.tiles.map(t=>t.correct),[true,false,false]);assert.equal(v.round.answer,'A');}
}
console.log('PASS exact curriculum-choice grading and automatic full answer/judgment list on manual and timed close');
