import { createServer } from 'vite';
import fs from 'node:fs';
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{
 const {SUBJECT_DATA}=await server.ssrLoadModule('/src/data/subjectData.ts');
 const screen=fs.readFileSync('src/components/ModeSelectionScreen.tsx','utf8');
 const names={}; for(const m of screen.matchAll(/name:\s*'([^']+)'[^\n]*?mode:\s*'((?:MATH_G\d)_[^']+)'/g))names[m[2]]=m[1];
 for(const [mode,ps] of Object.entries(SUBJECT_DATA).filter(([k])=>/^MATH_G\d_U\d+$/.test(k))){
   const unique=[];const seen=new Set();for(const p of ps){let q=p.question.replace(/\d+(?:\.\d+)?/g,'#').replace(/\s+/g,' '); if(!seen.has(q)){seen.add(q);unique.push(p.question.replaceAll('\n',' '));} if(unique.length>=8)break;}
   console.log(`${mode}\t${names[mode]||''}\t${ps.length}\t${unique.join(' || ')}`)
 }
}finally{await server.close()}
