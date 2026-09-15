import { createServer } from 'vite';
const server = await createServer({ server:{ middlewareMode:true }, appType:'custom', logLevel:'error' });
try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const { getDebugProblemUnitGroups } = await server.ssrLoadModule('/src/components/ProblemChallengeScreen.tsx');
  const groups = getDebugProblemUnitGroups();
  const selected = groups.filter(g => /小[1-6]|中[1-3]/.test(g.name || ''));
  const modes = new Set();
  for (const g of selected) for (const u of g.units) for (const m of (u.modePool?.length ? u.modePool : [u.mode])) modes.add(m);
  let total=0, withVisual=0, withImage=0;
  const visualKinds={};
  const modeRows=[];
  for (const mode of [...modes].sort()) {
    const ps=SUBJECT_DATA[mode]||[];
    total += ps.length;
    const vk={};
    for (const p of ps) {
      if(p.visual){withVisual++; const k=p.visual.kind||p.visual.type||'unknown'; vk[k]=(vk[k]||0)+1; visualKinds[k]=(visualKinds[k]||0)+1;}
      if(p.imageUrl) withImage++;
    }
    modeRows.push({mode,count:ps.length,unitLabels:[...new Set(ps.map(p=>p.unitLabel).filter(Boolean))],visualKinds:vk,sample:ps[0]?.question||''});
  }
  console.log(JSON.stringify({groups:selected.map(g=>({name:g.name,units:g.units.map(u=>({name:u.name,mode:u.mode,modePool:u.modePool}))})), modeCount:modes.size,total,withVisual,withImage,visualKinds,modeRows},null,2));
} finally { await server.close(); }
