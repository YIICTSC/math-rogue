import { createServer } from 'vite';
const server = await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try {
 const {SUBJECT_DATA}=await server.ssrLoadModule('/src/data/subjectData.ts');
 const {getDebugProblemUnitGroups}=await server.ssrLoadModule('/src/components/ProblemChallengeScreen.tsx');
 const groups=getDebugProblemUnitGroups();
 const units=[];
 for(const g of groups){
  for(const u of g.units){
   if(/^(?:小[1-6]|中[1-3])\s*\//.test(u.name||'')) units.push({group:g.name,...u});
  }
 }
 const modes=[...new Set(units.flatMap(u=>u.modePool?.length?u.modePool:[u.mode]))];
 let total=0; const v={}; let visual=0,image=0,audio=0,speech=0;
 for(const m of modes){ for(const p of (SUBJECT_DATA[m]||[])){ total++; if(p.visual){visual++; const k=p.visual.kind||p.visual.type||'unknown';v[k]=(v[k]||0)+1;} if(p.imageUrl)image++; if(p.audioPrompt)audio++; if(p.speechPrompt)speech++; } }
 console.log(JSON.stringify({units:units.length,modes:modes.length,total,visual,image,audio,speech,visualKinds:v,groupCounts:Object.fromEntries([...new Set(units.map(u=>u.group))].map(g=>[g,units.filter(u=>u.group===g).length]))},null,2));
} finally {await server.close();}
