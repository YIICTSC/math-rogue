import { createServer } from 'vite';
const v=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
const {SUBJECT_DATA}=await v.ssrLoadModule('/src/data/subjectData.ts');
const counts={}; let total=0, vis=0; const modes=new Set(), units=new Map();
for (const [mode,ps] of Object.entries(SUBJECT_DATA)) { for(const p of ps){ total++; const key=`${mode}\u0000${p.unitLabel||''}`; if(!units.has(key)) units.set(key,{mode,label:p.unitLabel||'',total:0,visual:0,kinds:new Set()}); const u=units.get(key);u.total++; if(p.visual){vis++;modes.add(mode);counts[p.visual.kind]=(counts[p.visual.kind]||0)+1;u.visual++;u.kinds.add(p.visual.kind);} } }
console.log('TOTAL',total,'VIS',vis,'RATE', (vis/total*100).toFixed(1)+'%'); console.log('KINDS',counts); console.log('VIS_MODES',modes.size,'UNIT_GROUPS',units.size,'WITH_VIS',[...units.values()].filter(u=>u.visual).length);
const no=[...units.values()].filter(u=>!u.visual && u.label).slice(0,30); console.log('NO_VIS_SAMPLE',no);
await v.close();
