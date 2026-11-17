import assert from 'node:assert/strict';import {createServer} from 'vite';import {chromium} from 'playwright';
let server,browser;const names=['MathChallengeScreen','KanjiChallengeScreen','EnglishChallengeScreen','GeneralChallengeScreen'];
try{
 server=await createServer({logLevel:'error',cacheDir:'node_modules/.vite-challenge-mount',optimizeDeps:{entries:['scripts/fixtures/challenge-mount-stability.tsx']},server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'challenge-mount-qa',enforce:'pre',configureServer(s){s.middlewares.use('/mount-test',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,'<html><body><div id="root"></div><script type="module" src="/scripts/fixtures/challenge-mount-stability.tsx"></script></body></html>'));});},transform(code,id){
  if(process.env.QA_OLD_LOADER&&id.endsWith('/utils/deferredScreen.tsx'))return code.replace('const Screen = useMemo(() => loaded || (attempt === 0 ? sharedScreen : React.lazy(loadAndCache)), [attempt]);','const LazyScreen = useMemo(() => attempt === 0 ? sharedScreen : React.lazy(loadAndCache), [attempt]); const Screen = loaded || LazyScreen;');
  const name=names.find(n=>id.endsWith('/components/'+n+'.tsx'));if(!name)return;
  return code.replace('  const pointQuestionRef =',`  React.useEffect(()=>{(window as any).__mounts['${name}']=((window as any).__mounts['${name}']??0)+1;},[]);\n  const pointQuestionRef =`).replace(/(const \[feedback, setFeedback\][^\n]*\n)/,`$1  (window as any).__questions['${name}']={problems,index:currentProblemIndex,input:inputAnswer,advance:()=>setCurrentProblemIndex(1),type:setInputAnswer};\n`);
 }}]});await server.listen();browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage();page.setDefaultTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/mount-test`,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.__open);
 for(const [kind,name]of names.entries()){
  await page.evaluate(k=>__open(k),kind);await page.waitForFunction(n=>__questions[n]?.problems.length>=2,name);
  const first=await page.evaluate(n=>({problems:JSON.stringify(__questions[n].problems),mounts:__mounts[n]}),name);
  for(let i=0;i<3;i++){await page.evaluate(()=>__refresh());await page.waitForTimeout(60);}
  assert.equal(await page.evaluate(n=>__mounts[n],name),first.mounts,`${name}: cold loading must not remount on parent updates`);assert.equal(await page.evaluate(n=>JSON.stringify(__questions[n].problems),name),first.problems,`${name}: initial questions stay unchanged`);
  await page.evaluate(n=>{__questions[n].advance();__questions[n].type('途中の回答');},name);await page.waitForTimeout(30);await page.evaluate(()=>__refresh());await page.waitForTimeout(60);assert.deepEqual(await page.evaluate(n=>({index:__questions[n].index,input:__questions[n].input}),name),{index:1,input:'途中の回答'});
  await page.evaluate(()=>__open(-1));await page.waitForTimeout(50);await page.evaluate(k=>__open(k),kind);await page.waitForFunction(({n,m})=>__mounts[n]===m+1&&__questions[n].problems.length>=2,{n:name,m:first.mounts});assert.equal(await page.evaluate(n=>__questions[n].index,name),0);const warm=await page.evaluate(n=>JSON.stringify(__questions[n].problems),name);await page.evaluate(()=>__refresh());await page.waitForTimeout(60);assert.equal(await page.evaluate(n=>JSON.stringify(__questions[n].problems),name),warm);
  console.log('PASS',name,'cold/warm visits, parent updates, question order and in-progress answer preservation.');
 }
 assert.deepEqual(errors,[]);
}finally{await browser?.close();await server?.close();}
