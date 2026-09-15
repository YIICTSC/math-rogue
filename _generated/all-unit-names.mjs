import { createServer } from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{const {getDebugProblemUnitGroups}=await server.ssrLoadModule('/src/components/ProblemChallengeScreen.tsx'); for(const g of getDebugProblemUnitGroups()){const us=g.units.filter(u=>/^(?:小[1-6]|中[1-3])\s*\//.test(u.name||'')); if(!us.length)continue; console.log('\n## '+g.name+' ('+us.length+')'); us.forEach(u=>console.log(u.name+'\t'+u.mode));}}finally{await server.close();}
