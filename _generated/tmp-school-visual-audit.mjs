import { createServer } from 'vite';
const v=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
const {SUBJECT_DATA}=await v.ssrLoadModule('/src/data/subjectData.ts');
const SCHOOL=/^(?:(?:MATH|KOKUGO|ENGLISH)_G\d+|(?:SCIENCE|SOCIAL|LIFE)_\d+)_U\d+$/;
const modes=Object.keys(SUBJECT_DATA).filter(m=>SCHOOL.test(m)).sort();
const rows=modes.map(mode=>{const ps=SUBJECT_DATA[mode]||[];const vis=ps.filter(p=>p.visual);const labels=[...new Set(ps.map(p=>p.unitLabel).filter(Boolean))];return {mode,label:labels[0]||'',total:ps.length,visual:vis.length,kinds:[...new Set(vis.map(p=>p.visual.kind))]};});
const bySubject={}; for(const r of rows){const s=r.mode.split('_')[0];bySubject[s]??={units:0,withVisual:0,problems:0,visualProblems:0};bySubject[s].units++;bySubject[s].problems+=r.total;if(r.visual)bySubject[s].withVisual++;bySubject[s].visualProblems+=r.visual;}
console.log('SCHOOL_UNITS',rows.length,'WITH_VISUAL_UNITS',rows.filter(r=>r.visual).length,'VISUAL_PROBLEMS',rows.reduce((a,r)=>a+r.visual,0),'TOTAL_PROBLEMS',rows.reduce((a,r)=>a+r.total,0));console.log('BY_SUBJECT',JSON.stringify(bySubject));
console.log('WITH_VISUAL'); for(const r of rows.filter(r=>r.visual)) console.log(r.mode,'|',r.label,'|',r.visual+'/'+r.total,'|',r.kinds.join(','));
await v.close();
