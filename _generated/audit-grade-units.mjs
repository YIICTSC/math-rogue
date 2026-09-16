import { createServer } from 'vite';
import fs from 'node:fs';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const screen = fs.readFileSync('src/components/ModeSelectionScreen.tsx','utf8');
  const nameMap = {};
  for (const m of screen.matchAll(/name:\s*'([^']+)'[^\n]*?mode:\s*'((?:MATH_G\d|KOKUGO_G\d)_[^']+)'/g)) nameMap[m[2]] = m[1];
  for (const cfgPath of ['/src/englishUnitConfig.ts','/src/scienceUnitConfig.ts','/src/socialUnitConfig.ts']) {
    const mod = await server.ssrLoadModule(cfgPath);
    const cfg = mod.ENGLISH_GRADE_UNITS || mod.SCIENCE_GRADE_UNITS || mod.SOCIAL_GRADE_UNITS;
    for (const units of Object.values(cfg)) for (const u of units) nameMap[u.mode] = u.name;
  }
  const unitEntries = Object.entries(SUBJECT_DATA).filter(([k]) => /^(?:MATH_G\d|KOKUGO_G\d|ENGLISH_G\d|LIFE_\d|SCIENCE_\d|SOCIAL_\d)_U\d+$/.test(k));
  const issues=[]; const rows=[]; const cross = new Map();
  for (const [mode, ps] of unitEntries) {
    const sigs=new Map(), qs=new Map(); let dupOpts=0, ansMissing=0, exactDup=0, sameQMultiAns=0, empty=0;
    const labelCounts={};
    ps.forEach((p,i)=>{
      if (!p.question?.trim() || !p.answer?.trim()) { empty++; issues.push({kind:'empty',mode,i,p}); }
      if (!Array.isArray(p.options) || !p.options.includes(p.answer)) {ansMissing++; issues.push({kind:'answer-not-option',mode,i,q:p.question,a:p.answer,o:p.options});}
      if (Array.isArray(p.options) && new Set(p.options).size!==p.options.length) {dupOpts++; issues.push({kind:'duplicate-options',mode,i,q:p.question,a:p.answer,o:p.options});}
      const sig=JSON.stringify({
        question:p.question,
        answer:p.answer,
        options:p.options,
        passage:p.passage||'',
        passageTitle:p.passageTitle||'',
        visual:p.visual||null,
        audioPrompt:p.audioPrompt||null,
        speechPrompt:p.speechPrompt||null,
      });
      if(sigs.has(sig)){exactDup++; if(exactDup<=3) issues.push({kind:'exact-duplicate',mode,i,first:sigs.get(sig),q:p.question,a:p.answer});} else sigs.set(sig,i);
      const prev=qs.get(p.question); if(prev && !prev.has(p.answer)){sameQMultiAns++; issues.push({kind:'same-question-multiple-answers',mode,i,q:p.question,answers:[...prev,p.answer],o:p.options});} (qs.get(p.question)??(qs.set(p.question,new Set()),qs.get(p.question))).add(p.answer);
      if(p.unitLabel) labelCounts[p.unitLabel]=(labelCounts[p.unitLabel]||0)+1;
      const xkey=JSON.stringify([p.question,p.answer]); if(!cross.has(xkey)) cross.set(xkey,[]); cross.get(xkey).push({mode,i});
      rows.push([mode,nameMap[mode]||'',i,p.question,p.answer,(p.options||[]).join(' | '),p.unitLabel||'',p.passageTitle||'']);
    });
    issues.push({kind:'unit-summary',mode,name:nameMap[mode]||'',count:ps.length,exactDup,dupOpts,ansMissing,sameQMultiAns,empty,labels:labelCounts});
  }
  const crossIssues=[];
  for(const [sig,locs] of cross){ const modes=[...new Set(locs.map(x=>x.mode))]; if(modes.length>1) crossIssues.push({sig:JSON.parse(sig),modes,occurrences:locs.length}); }
  fs.writeFileSync('_generated/grade-unit-audit.json', JSON.stringify({issues,crossIssues},null,2));
  fs.writeFileSync('_generated/grade-unit-problems.tsv', ['mode\tunit\tindex\tquestion\tanswer\toptions\tunitLabel\tpassageTitle',...rows.map(r=>r.map(x=>String(x).replaceAll('\t',' ').replaceAll('\n','\\n')).join('\t'))].join('\n'));
  const summaries=issues.filter(x=>x.kind==='unit-summary');
  console.log('UNITS',summaries.length,'PROBLEMS',rows.length);
  for(const key of ['ansMissing','dupOpts','sameQMultiAns','exactDup','empty']) console.log(key, summaries.reduce((n,x)=>n+x[key],0), 'units', summaries.filter(x=>x[key]>0).length);
  console.log('CROSS_DUP_PAIRS',crossIssues.length,'instances',crossIssues.reduce((n,x)=>n+x.occurrences,0));
  for(const kind of ['answer-not-option','duplicate-options','same-question-multiple-answers']){
    const arr=issues.filter(x=>x.kind===kind); console.log('\n'+kind,arr.length); console.log(JSON.stringify(arr.slice(0,20),null,2));
  }
  console.log('\nTOP EXACT DUP UNITS');
  for(const x of summaries.filter(x=>x.exactDup).sort((a,b)=>b.exactDup-a.exactDup).slice(0,25)) console.log(x.mode,x.name,x.count,'dup',x.exactDup,'labels',JSON.stringify(x.labels));
} finally { await server.close(); }
