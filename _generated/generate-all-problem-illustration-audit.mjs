import { createServer } from 'vite';
import fs from 'node:fs';

const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
const OUT='docs/problem-illustration-priority.md';

const stop = new Set(`これ それ あれ どれ もの こと とき ため よう どの 何 なに どれ 正しい 最も ひとつ 一つ ものは ことは どう どんな 次 次の 選ぼう 選ぶ いう いいます あります ある ない なる なりやすい 使う つかう 使われる 学習 基本 確認 復習 問題 答え どちら もっとも 近い 関係 できる する した して される という どれか あてはまる 一番 いちばん ひとつ選ぼう 1つ選ぼう 1つ 2つ 3つ について についての の は が を に で と へ から まで より も や など として である です ます いる いるもの をする`.split(/\s+/));
const segJa = new Intl.Segmenter('ja',{granularity:'word'});
function topTerms(problems, max=12){
  const c=new Map();
  for(const p of problems){
    const text=[p.question,p.unitLabel].filter(Boolean).join(' ');
    for(const s of segJa.segment(text)){
      const t=s.segment.trim();
      if(!s.isWordLike || t.length<2 || stop.has(t) || /^\d+$/.test(t) || /^[A-Za-z]$/.test(t)) continue;
      c.set(t,(c.get(t)||0)+1);
    }
  }
  return [...c.entries()].sort((a,b)=>b[1]-a[1]||b[0].length-a[0].length).slice(0,max).map(([x])=>x);
}
function conceptExamples(problems,max=12){
  const counts=new Map();
  for(const p of problems){
    const a=(p.answer||'').trim().replace(/\s+/g,' ');
    if(!a || a.length>32) continue;
    counts.set(a,(counts.get(a)||0)+1);
  }
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].length-b[0].length).slice(0,max).map(([x])=>x);
}
function gradeOf(name){return name.match(/^((?:小|中)\d)/)?.[1]||'';}
function topicOf(name){return name.replace(/^(?:小|中)\d\s*\/\s*/,'').trim();}
function policyFor(group,name,mode){
  const topic=topicOf(name);
  if(group==='算数・数学（単元）' || group==='英語圏 Math（単元）'){
    if(/時計|時こく|時刻|かたち|形|図形|角|円|立方体|直方体|はこ|柱|体積|面積|長さ|かさ|重さ|ものさし|そろばん|グラフ|表|資料|データ|分数|割合|比例|反比例|関数|座標|相似|三平方|確率|場合の数|測定|Measurement|Shapes|Geometry|Fractions|Volume|Coordinate|Statistics|Data|Probability|Transformations|Pythagorean|Functions/i.test(topic)) return 'DYNAMIC';
    return 'NONE';
  }
  if(group==='国語（単元）'){
    if(/ことばあつめ|かたかな|おはなしをつくる|ばめんをそうぞう|発表|報告文|スピーチ/.test(topic)) return 'IMAGEGEN_OPTIONAL';
    if(/図|表|グラフ|資料/.test(topic)) return 'DYNAMIC';
    return 'NONE';
  }
  if(group==='英語（単元）'){
    if(/リスニング|発声|復唱|応答/.test(topic)) return 'NONE';
    if(/どうぶつ|くだもの|たべもの|食べ物|いろ|色|きぶん|からだ|家族|かぞく|天気|文ぼうぐ|文房具|場所|学校の中|学校生活|教科|一日の生活|日常生活|行きたい場所|行きたい国|文化|英単語総合|好きなもの|すきなもの|世界の文化/.test(topic)) return 'IMAGEGEN';
    if(/前置詞|比較/.test(topic)) return 'DYNAMIC';
    return 'NONE';
  }
  if(group==='生活（単元）') return 'IMAGEGEN';
  if(group==='理科（単元）'){
    if(/こん虫|しょくぶつ|植物|生き物|生物|季節|観察|メダカ|人のたんじょう|人の体|動物の体|細胞|火山|地層|化石/.test(topic)) return 'IMAGEGEN';
    if(/太陽|光|音|風とゴム|電気|重さ|じしゃく|天気|星|月|空気|水|あたたまり|台風|流れる水|とけ方|電磁石|燃え方|てこ|水よう液|土地|物質|気体|水溶液|力|圧力|地震|化学|原子|分子|電流|磁界|気象|前線|遺伝|イオン|酸とアルカリ|中和|運動|仕事|エネルギー|宇宙|太陽系|星の動き/.test(topic)) return 'DYNAMIC';
    return 'IMAGEGEN_OPTIONAL';
  }
  if(group==='社会（単元）'){
    if(/地図|都道府県|地形|気候|国土|世界の地域|世界の気候|人口|アジア|ヨーロッパ|アフリカ|北アメリカ|南アメリカ|オセアニア|日本の地域|日本の自然/.test(topic)) return 'REFERENCE';
    if(/町|はたらく人|商店|農家|工場|交通|水のしごと|ごみ|災害|伝統文化|農業|水産業|工業|貿易|情報産業|環境問題|食料問題/.test(topic)) return 'IMAGEGEN';
    if(/時代|歴史|文明|ギリシャ|ローマ|維新|世界大戦|古代|中世|近世|近代化/.test(topic)) return 'REFERENCE';
    if(/憲法|国会|内閣|裁判所|自治|人権|民主|選挙|税金|市場|金融|労働|社会保障|国際/.test(topic)) return 'DYNAMIC';
    return 'IMAGEGEN_OPTIONAL';
  }
  if(group==='英語圏 ELA（単元）'){
    if(/Phonics|Sight Words|Vocabulary|Word Study|Long Vowels/i.test(topic)) return 'IMAGEGEN_OPTIONAL';
    return 'NONE';
  }
  if(group==='英語圏 Science（単元）'){
    if(/Living Things|Plants|Animals|Habitats|Life Cycles|Organisms|Ecosystems|Cells|Body Systems|Genetics|Space|Earth History/i.test(topic)) return 'IMAGEGEN';
    return 'DYNAMIC';
  }
  if(group==='英語圏 Social Studies（単元）'){
    if(/Maps|Map Skills|Geography/i.test(topic)) return 'REFERENCE';
    if(/Community|Jobs|Culture|History|Civilizations|Career/i.test(topic)) return 'IMAGEGEN_OPTIONAL';
    return 'DYNAMIC';
  }
  if(group==='英語圏 Japanese（単元）'){
    if(/First Words|Greetings|Numbers and Colors|Family|Shopping|School Life|Travel|Culture/i.test(topic)) return 'IMAGEGEN_OPTIONAL';
    if(/Time and Schedules|Signs/i.test(topic)) return 'DYNAMIC';
    return 'NONE';
  }
  if(group==='漢字') return 'NONE';
  if(group==='地図・日本') return 'REFERENCE';
  if(group==='ICT・情報') return 'REFERENCE';
  return 'NONE';
}
function categoryLabel(p){return ({IMAGEGEN:'A: ImageGen固定教材絵',IMAGEGEN_OPTIONAL:'B: ImageGen補助絵',DYNAMIC:'A: SVG/Canvas等の動的図',REFERENCE:'B: 正確な地図・写真・資料優先',NONE:'C: 原則画像不要'})[p];}
function meaningFor(group,name,policy){
 const topic=topicOf(name);
 if(policy==='IMAGEGEN') return `「${topic}」で扱う実物・生き物・場面を視覚的に識別し、文章だけでは想像しにくい対象を具体化する。`;
 if(policy==='IMAGEGEN_OPTIONAL') return `「${topic}」の語彙・場面理解を補助する。正答を直接描かず、問題の主題や状況を示す補助絵として使う。`;
 if(policy==='DYNAMIC') return `「${topic}」の値・位置・関係が問題ごとに変わるため、固定画像ではなく問題データに連動した正確な図を表示する。`;
 if(policy==='REFERENCE') return `「${topic}」は地理的位置・史実・実在資料・UIなどの正確さが重要。ImageGenより正確な地図・写真・公的資料・実画面を優先する。`;
 return `「${topic}」は文字・計算・文法・読解そのものが学習対象で、固定イラストを追加しても学習効果が上がりにくい。`;
}
function promptFor(group,name,terms,policy){
 const topic=topicOf(name); const termText=terms.slice(0,12).join('、');
 const common='5×5の教育用スプライトシート。25セルを等間隔のグリッドに配置し、各セルは独立して切り抜ける。文字、数字、ロゴ、透かしなし。各対象は中央配置、十分な余白、背景は透明または完全な単色。';
 if(policy==='IMAGEGEN'){
   if(group.includes('英語')) return `${common} 単元「${topic}」の語彙学習用。実際の問題に頻出する「${termText}」を中心に、子どもが一目で意味を判別できる単体物・人物・場面のアイコンを25種。明るく親しみやすい2D教材イラスト。答えとなる英単語や日本語ラベルは描かない。`;
   if(group.includes('理科')||group.includes('Science')) return `${common} 単元「${topic}」の理科学習用。実際の問題に頻出する「${termText}」を中心に、観察対象・生物・器官・地学対象を科学的に不自然にならない教材イラストとして25種。小学生はやさしく、中学生は少し模式図寄り。正答文字は描かない。`;
   if(group==='生活（単元）') return `${common} 単元「${topic}」の生活科学習用。実際の問題に頻出する「${termText}」を中心に、学校・町・季節・生き物・栽培・遊び・成長の場面や物を25種。低学年向けの分かりやすい2D教材イラスト。`;
   if(group.includes('社会')) return `${common} 単元「${topic}」の社会科学習用。実際の問題に頻出する「${termText}」を中心に、仕事・産業・生活場面・道具を25種。事実関係を誤解させない一般的な教材場面。特定の地図形状や歴史人物の顔を正解として描かない。`;
   return `${common} 単元「${topic}」。頻出概念「${termText}」を中心に25種の教材イラスト。`;
 }
 if(policy==='IMAGEGEN_OPTIONAL') return `${common} 単元「${topic}」の補助絵。頻出語「${termText}」を中心に、正答を直接示さず文脈理解だけを助ける場面・物・人物を25種。シンプルな2D教材イラスト。`;
 if(policy==='DYNAMIC') return `ImageGenは原則使わない。単元「${topic}」について、問題パラメータからSVG/Canvasで正確に描画する。頻出要素: ${termText}。目盛り・角度・位置・数量・接続関係・軌道などは問題値に連動させる。`;
 if(policy==='REFERENCE') return `ImageGenは問題の正解判定に使わない。単元「${topic}」では正確な地図・公的資料・実物写真・一次資料・実UIを優先する。補助装飾を生成する場合のみ、頻出要素「${termText}」を題材に、事実を断定しない一般的な教材アイコンとして生成する。`;
 return 'ImageGen生成なし。文章・音声・既存UIを優先する。';
}
function classifyProblem(p,policy){
 if(p.visual) return 'dynamicExisting';
 if(p.audioPrompt||p.speechPrompt) return 'audioNoImage';
 if(p.imageUrl) return 'imageCurrent';
 if(policy==='IMAGEGEN'||policy==='IMAGEGEN_OPTIONAL') return 'imageCandidate';
 if(policy==='DYNAMIC') return 'dynamicCandidate';
 if(policy==='REFERENCE') return 'referenceCandidate';
 return 'noImage';
}
function sample(arr,n=3){return arr.slice(0,n).map(p=>p.question.replace(/\|/g,'\\|'));}
try{
 const {SUBJECT_DATA}=await server.ssrLoadModule('/src/data/subjectData.ts');
 const {getDebugProblemUnitGroups}=await server.ssrLoadModule('/src/components/ProblemChallengeScreen.tsx');
 const groups=getDebugProblemUnitGroups();
 const core=[];
 for(const g of groups) for(const u of g.units) if(/^(?:小[1-6]|中[1-3])\s*\//.test(u.name||'')) core.push({group:g.name,...u,scope:'core'});
 const supplements=[];
 const gKanji=groups.find(g=>g.name==='漢字'); if(gKanji) for(const u of gKanji.units.filter(u=>/^(小学[1-6]年|中学[1-3]年)$/.test(u.name))) supplements.push({group:gKanji.name,...u,scope:'supp'});
 for(const gn of ['地図・日本','ICT・情報']){const g=groups.find(x=>x.name===gn); if(g) for(const u of g.units) supplements.push({group:g.name,...u,scope:'supp'});}
 const all=[...core,...supplements];
 const rows=[]; const overall={dynamicExisting:0,audioNoImage:0,imageCurrent:0,imageCandidate:0,dynamicCandidate:0,referenceCandidate:0,noImage:0,total:0};
 for(const u of all){
   const modes=u.modePool?.length?u.modePool:[u.mode];
   const probs=modes.flatMap(m=>(SUBJECT_DATA[m]||[]).map(p=>({...p,__mode:m})));
   const policy=policyFor(u.group,u.name,u.mode);
   const counts={dynamicExisting:0,audioNoImage:0,imageCurrent:0,imageCandidate:0,dynamicCandidate:0,referenceCandidate:0,noImage:0};
   const buckets={dynamicExisting:[],audioNoImage:[],imageCurrent:[],imageCandidate:[],dynamicCandidate:[],referenceCandidate:[],noImage:[]};
   for(const p of probs){const k=classifyProblem(p,policy); counts[k]++; buckets[k].push(p); overall[k]++; overall.total++;}
   rows.push({...u,modes,probs,policy,counts,buckets,terms:topTerms(probs),concepts:conceptExamples(probs)});
 }
 const coreCount=rows.filter(r=>r.scope==='core').reduce((s,r)=>s+r.probs.length,0);
 const suppCount=rows.filter(r=>r.scope==='supp').reduce((s,r)=>s+r.probs.length,0);
 const coreUnits=rows.filter(r=>r.scope==='core').length;
 const suppUnits=rows.filter(r=>r.scope==='supp').length;
 const visualKinds={};
 for(const r of rows) for(const p of r.probs) if(p.visual){const k=p.visual.kind||'unknown';visualKinds[k]=(visualKinds[k]||0)+1;}
 const lines=[];
 lines.push('# 学習ローグ 問題イラスト総合監査・ImageGen生成仕様（小1〜中3 全単元・全問題）','');
 lines.push(`更新日: 2026-09-15`,'');
 lines.push('## 監査範囲','');
 lines.push(`- **通常カリキュラム**: ${coreUnits}単元 / ${coreCount.toLocaleString()}問`);
 lines.push(`- **補助問題バンク**（小学1〜中学3の漢字、地図・日本、ICT・情報）: ${suppUnits}単元 / ${suppCount.toLocaleString()}問`);
 lines.push(`- **合計**: ${rows.length}単元 / ${overall.total.toLocaleString()}問を実データから走査`);
 lines.push('- 高校、趣味、超難読・高校向け発展バンクは今回の「小1〜中3」対象外。','');
 lines.push('## 問題単位の判定結果','');
 lines.push('| 判定 | 問題数 | 方針 |','|---|---:|---|');
 lines.push(`| 既存の動的visual | ${overall.dynamicExisting.toLocaleString()} | 既存SVG/Canvas系を維持 |`);
 lines.push(`| 現在画像割り当て済み | ${overall.imageCurrent.toLocaleString()} | 問題との意味一致を維持・再確認 |`);
 lines.push(`| ImageGen固定絵候補 | ${overall.imageCandidate.toLocaleString()} | 5×5シート→セル切り抜きWebP |`);
 lines.push(`| 動的図の追加候補 | ${overall.dynamicCandidate.toLocaleString()} | SVG/Canvasで問題値に連動 |`);
 lines.push(`| 正確な資料・地図・写真候補 | ${overall.referenceCandidate.toLocaleString()} | ImageGenより正確な資料を優先 |`);
 lines.push(`| 音声/発話優先 | ${overall.audioNoImage.toLocaleString()} | 答え漏れ防止のため固定絵を原則出さない |`);
 lines.push(`| 原則画像不要 | ${overall.noImage.toLocaleString()} | 文章・計算・文法を優先 |`,'');
 lines.push('## 既存動的visualの実数','');
 lines.push('| visual kind | 問題数 |','|---|---:|');
 for(const [k,v] of Object.entries(visualKinds).sort((a,b)=>a[0].localeCompare(b[0]))) lines.push(`| \`${k}\` | ${v.toLocaleString()} |`);
 lines.push('','### 固定画像にしないもの','', '- 時計、角度、図形、グラフ、分数図、関数グラフ、地図記号など、**問題値や位置が変化する図は固定画像化しない**。','- 正確な地図・県形・歴史資料・現行OS/UIは、ImageGenではなく正確なデータ・公的資料・実画面を使う。','- 音声・発話問題は、画像が聞き取りや発話の答えを先に示す場合は表示しない。','');
 lines.push('## ImageGen共通生成ルール','', '- 基本は **5×5スプライトシート → 必要セルを切り抜き → WebP化**。','- 25セルは等間隔、各セル内に対象を完全に収める。上下左右に十分な余白を置き、見切れを防ぐ。','- 文字、数字、ラベル、透かし、ロゴは画像内に入れない。','- 背景は透明または完全な単色。セル間で背景をつなげない。','- 問題の正答そのものを露骨に示す絵は避け、**問題の主題・対象・場面**を描く。','- 理科は科学的な誤りを避ける。正確な接続、角度、軌道、粒子数などが正答に関係する問題はSVG/Canvasへ回す。','');
 const scopes=[['通常カリキュラム','core'],['補助問題バンク','supp']];
 for(const [scopeTitle,scope] of scopes){
   lines.push(`## ${scopeTitle}：全単元監査`,'');
   const groupNames=[...new Set(rows.filter(r=>r.scope===scope).map(r=>r.group))];
   for(const gn of groupNames){
     lines.push(`### ${gn}`,'');
     const rs=rows.filter(r=>r.scope===scope&&r.group===gn);
     lines.push('| 単元 | mode | 全問 | 既存動的 | 現画像 | ImageGen候補 | 動的追加 | 資料優先 | 音声/発話 | 不要 | 推奨 |','|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|');
     for(const r of rs) lines.push(`| ${r.name.replace(/^.*?\/\s*/,'')} | \`${r.modes.join(', ')}\` | ${r.probs.length} | ${r.counts.dynamicExisting} | ${r.counts.imageCurrent} | ${r.counts.imageCandidate} | ${r.counts.dynamicCandidate} | ${r.counts.referenceCandidate} | ${r.counts.audioNoImage} | ${r.counts.noImage} | ${categoryLabel(r.policy)} |`);
     lines.push('');
     for(const r of rs){
       lines.push(`<details>`,`<summary><strong>${r.name}</strong> — ${categoryLabel(r.policy)} / ${r.probs.length}問</summary>`,'');
       lines.push(`- mode: \`${r.modes.join('`, `')}\``);
       lines.push(`- 全問題走査: 既存動的 ${r.counts.dynamicExisting} / 現画像 ${r.counts.imageCurrent} / ImageGen候補 ${r.counts.imageCandidate} / 動的追加 ${r.counts.dynamicCandidate} / 資料優先 ${r.counts.referenceCandidate} / 音声・発話 ${r.counts.audioNoImage} / 不要 ${r.counts.noImage}`);
       lines.push(`- イラストの意味: ${meaningFor(r.group,r.name,r.policy)}`);
       lines.push(`- 素材候補（実問題の代表的な答え・概念）: ${r.concepts.length?r.concepts.join('、'):(r.terms.length?r.terms.join('、'):'（抽出なし）')}`);
       lines.push(`- **生成/実装プロンプト**: ${promptFor(r.group,r.name,(r.concepts.length?r.concepts:r.terms),r.policy)}`);
       const preferred=[...r.buckets.imageCurrent,...r.buckets.imageCandidate,...r.buckets.dynamicCandidate,...r.buckets.referenceCandidate];
       const reps=sample(preferred.length?preferred:r.probs,3);
       if(reps.length){lines.push('- 代表問題:'); reps.forEach(q=>lines.push(`  - ${q}`));}
       lines.push('',`</details>`,'');
     }
   }
 }
 lines.push('## 実装優先順位','', '1. **A: ImageGen固定教材絵** — 生活、具体的な生物・植物、英語語彙など。','2. **A: 動的SVG/Canvas** — 時計、図形、数量図、回路、力学、天体、化学模式図など正確さが必要なもの。','3. **B: ImageGen補助絵** — 国語の場面想像、語彙補助、社会の一般的な仕事・生活場面。','4. **B: 正確な資料優先** — 地図、都道府県形、歴史資料、現行UI。','5. **C: 画像不要** — 純計算、文法、漢字読み書き、抽象的な読解。','');
 lines.push('## 既存実装との接続','', '- 自動割り当ては `src/data/problemIllustrations.ts` で管理。','- `problem.visual` がある問題では `imageUrl` を追加しない。','- `audioPrompt` / `speechPrompt` がある問題は、答え漏れ防止のため固定イラストを原則抑止する。','- デバッグメニューの「イラスト問題」で、対応問題と実際の表示を確認する。','');
 fs.writeFileSync(OUT,lines.join('\n'),'utf8');
 console.log(JSON.stringify({out:OUT,coreUnits,coreCount,suppUnits,suppCount,totalUnits:rows.length,totalProblems:overall.total,overall,bytes:fs.statSync(OUT).size},null,2));
}finally{await server.close();}

