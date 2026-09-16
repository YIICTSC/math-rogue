import { createServer } from 'vite';
const v=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
const {SUBJECT_DATA}=await v.ssrLoadModule('/src/data/subjectData.ts');
const {getUnitBoardSummary}=await v.ssrLoadModule('/src/data/unitBoardSummaries.ts');
const SCHOOL=/^(?:(?:MATH|KOKUGO|ENGLISH)_G\d+|(?:SCIENCE|SOCIAL|LIFE)_\d+)_U\d+$/;
const modes=Object.keys(SUBJECT_DATA).filter(m=>SCHOOL.test(m)).sort();
for(const mode of modes){const ps=SUBJECT_DATA[mode]||[];const vis=ps.filter(p=>p.visual);const s=getUnitBoardSummary(mode);console.log([mode,s?.title||'',vis.length,ps.length,[...new Set(vis.map(p=>p.visual.kind))].join(',')].join('\t'));}
await v.close();
