import { createServer } from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{const {SUBJECT_DATA}=await server.ssrLoadModule('/src/data/subjectData.ts');
for(const [mode,ps] of Object.entries(SUBJECT_DATA).filter(([k,v])=>/^MATH_G\d_U\d+$/.test(k)&&v.length>80)){
 const tail=ps.slice(-12).map(p=>p.question.replaceAll('\n',' '));
 console.log('\n'+mode+' '+ps.length); for(const q of tail)console.log(' - '+q);
}}finally{await server.close()}
