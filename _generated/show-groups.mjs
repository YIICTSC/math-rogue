import { createServer } from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{const m=await server.ssrLoadModule('/src/components/ProblemChallengeScreen.tsx'); const groups=m.getDebugProblemUnitGroups(); console.log(JSON.stringify(groups.map(g=>({name:g.name,units:g.units.slice(0,3).map(u=>({name:u.name,mode:u.mode,grade:u.grade,subject:u.subject}))})),null,2));}finally{await server.close();}
