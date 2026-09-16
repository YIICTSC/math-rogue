import { createServer } from 'vite';
const server = await createServer({ server:{middlewareMode:true}, appType:'custom', logLevel:'error' });
try {
 const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
 const units=Object.entries(SUBJECT_DATA).filter(([k])=>/^(?:MATH_G\d|KOKUGO_G\d|ENGLISH_G\d|LIFE_\d|SCIENCE_\d|SOCIAL_\d)_U\d+$/.test(k));
 const bad=[]; const low=[];
 for(const [mode,ps] of units){
   const groups=new Map();
   // 同じ問題文でも、図・本文・音声・選択肢が違えば別の出題として扱う。
   // 「同じ表示内容なのに正答だけ違う」ケースだけを曖昧問題として検出する。
   const stimulus=p=>JSON.stringify({
     q:p.question,
     options:p.options||[],
     passage:p.passage||'',
     passageTitle:p.passageTitle||'',
     visual:p.visual||null,
     audio:p.audioPrompt||null,
     speech:p.speechPrompt||null,
   });
   for(let i=0;i<ps.length;i++){
      const p=ps[i], key=stimulus(p), correct=p.answer;
      if(!groups.has(key))groups.set(key,{answers:new Map(),items:[]});
      const g=groups.get(key); g.items.push({i,q:p.question,a:p.answer,c:correct,o:p.options,v:p.visual,passage:p.passage});
      if(!g.answers.has(correct))g.answers.set(correct,[]); g.answers.get(correct).push(i);
   }
   for(const g of groups.values()) if(g.answers.size>1) bad.push({mode,answers:[...g.answers.keys()],items:g.items.slice(0,8)});
   const unique=groups.size; const ratio=unique/ps.length;
   if(ratio<0.8) low.push({mode,count:ps.length,unique,ratio:+ratio.toFixed(3)});
 }
 console.log('TRUE_MULTI_ANSWER_SAME_STIMULUS',bad.length);
 console.log(JSON.stringify(bad.slice(0,80),null,2));
 console.log('\nLOW_UNIQUENESS',low.length);
 for(const x of low.sort((a,b)=>a.ratio-b.ratio).slice(0,120)) console.log(x.mode,'count',x.count,'unique',x.unique,'ratio',x.ratio);
} finally {await server.close()}
