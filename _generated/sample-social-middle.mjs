import { createServer } from 'vite'; import { SOCIAL_GRADE_UNITS } from '../src/socialUnitConfig.ts';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{const {SUBJECT_DATA}=await server.ssrLoadModule('/src/data/subjectData.ts');const names={}; for(const units of Object.values(SOCIAL_GRADE_UNITS)) for(const u of units) names[u.mode]=u.name;
for(const [mode,ps] of Object.entries(SUBJECT_DATA).filter(([k])=>/^SOCIAL_[789]_U\d+$/.test(k))){console.log(`\n## ${mode} ${names[mode]} (${ps.length})`);for(const p of [...ps.slice(0,8),...ps.slice(-8)])console.log(`- ${p.question} => ${p.options?.[0]}`)}}finally{await server.close()}
