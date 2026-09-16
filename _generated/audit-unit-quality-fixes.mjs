import { createServer } from 'vite';
const server = await createServer({ server:{middlewareMode:true}, appType:'custom', logLevel:'error' });
try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const failures=[];
  const unitEntries=Object.entries(SUBJECT_DATA).filter(([k])=>/^(?:MATH_G\d|KOKUGO_G\d|ENGLISH_G\d|LIFE_\d|SCIENCE_\d|SOCIAL_\d)_U\d+$/.test(k));
  for(const [mode, ps] of unitEntries){
    for(const [i,p] of ps.entries()){
      if(!p.options?.includes(p.answer)) failures.push(`${mode}[${i}] answer missing: ${p.question}`);
      if(new Set(p.options||[]).size!==(p.options||[]).length) failures.push(`${mode}[${i}] duplicate options: ${p.question}`);
    }
  }
  const social=unitEntries.filter(([m])=>m.startsWith('SOCIAL_'));
  for(const [mode,ps] of social){ if(ps.length!==50) failures.push(`${mode} social count ${ps.length}`); }
  const forbidden={
    SOCIAL_7_U05:/鳥取砂丘|中国地方|出雲大社|後楽園|本州四国連絡橋/,
    SOCIAL_7_U11:/大宝律令|国風文化|遣唐使|古墳時代/,
    SOCIAL_8_U01:/唐人屋敷|豊臣秀吉.*朝鮮/,
    SOCIAL_8_U02:/武家諸法度|分国法/,
    SOCIAL_8_U05:/満州事変|日清戦争|日露戦争|韓国併合|大日本帝国憲法/,
  };
  for(const [mode,re] of Object.entries(forbidden)) for(const p of SUBJECT_DATA[mode]||[]) if(re.test(p.question)) failures.push(`${mode} contamination: ${p.question}`);

  // 英語は「選択肢に語が共存する」だけでは曖昧とは限らない。
  // promptJp 等で意味を文脈化した問題は正常なので、実際に曖昧な
  // 日本語プロンプトが残っている場合だけを検出する。
  const ambiguousPromptChecks=[
    ['ENGLISH_G3_U01',/「こんにちは」|^こんにちは に|「こんにちは」は/],
    ['ENGLISH_G3_U10',/「あし」|^あし に|「あし」は/],
    ['ENGLISH_G6_U07',/「見た」|^見た に|「見た」は/],
  ];
  for(const [mode,re] of ambiguousPromptChecks){
    for(const p of SUBJECT_DATA[mode]||[]) if(re.test(p.question)) failures.push(`${mode} ambiguous prompt: ${p.question}`);
  }
  for(const mode of ['ENGLISH_G4_U07','ENGLISH_G4_U08']){
    for(const p of SUBJECT_DATA[mode]||[]) if(p.question.includes('「library」')) failures.push(`${mode} plain library prompt: ${p.question}`);
  }
  const englishMid=unitEntries.filter(([m])=>/^ENGLISH_G[789]_U/.test(m));
  const exactEnglish=[];
  for(const [mode,ps] of englishMid){
    const sigs=new Set(); let dup=0;
    for(const p of ps){ const sig=JSON.stringify([p.question,p.answer,p.options,p.audioPrompt?.text||'',p.speechPrompt?.expected||'']); if(sigs.has(sig))dup++; else sigs.add(sig); }
    if(dup) exactEnglish.push([mode,dup,ps.length,sigs.size]);
  }
  const mathCounts=unitEntries.filter(([m])=>m.startsWith('MATH_G')).map(([m,p])=>[m,p.length]).sort((a,b)=>a[1]-b[1]);
  console.log('UNITS',unitEntries.length);
  console.log('SOCIAL_UNITS',social.length,'ALL_50',social.every(([,p])=>p.length===50));
  console.log('MATH_MIN_COUNT',mathCounts[0]);
  console.log('ENGLISH_MIDDLE_EXACT_DUP_UNITS',JSON.stringify(exactEnglish));
  console.log('KNOWN_AMBIGUITY_FAILURES',failures.filter(x=>x.includes('ambiguous prompt')||x.includes('plain library prompt')).length);
  console.log('FAILURES',failures.length);
  if(failures.length){ console.log(failures.slice(0,50).join('\n')); process.exitCode=1; }
} finally { await server.close(); }
