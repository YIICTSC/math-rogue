import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'invitation-entry-qa',configureServer(s){s.middlewares.use('/invitation-qa',async(req,res)=>{
 res.setHeader('Content-Type','text/html');
 res.end(await s.transformIndexHtml(req.url,'<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/invitation-entry.tsx"></script></body></html>'));
});}}]});
await server.listen();
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||(process.platform==='darwin'?'chrome':undefined),args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const base=`http://127.0.0.1:${server.httpServer.address().port}/invitation-qa`, errors=[];
try{
 for(const kind of (process.argv.includes('--languages-only')?[]:['kart','golf','vr','rpg'])){
  const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',route=>route.abort());
  await page.goto(`${base}?kind=${kind}`);
  await page.getByRole('button',{name:'招待に参加する',exact:true}).click();
  const form=page.locator('[data-invite-entry]');await form.waitFor();
  assert.equal(await form.locator('input').count(),2);
  assert.equal(await form.locator('select,canvas').count(),0);
  const name=form.getByLabel('参加名',{exact:true}),code=form.getByLabel('招待コード',{exact:true}),submit=form.getByRole('button',{name:'参加する',exact:true});
  await name.fill('');await code.fill('501234');assert(await submit.isDisabled());
  await name.fill('Guest');await code.fill('123');assert(await submit.isDisabled());
  await code.fill('s-abc234');assert.equal(await code.inputValue(),'S-ABC234');assert(await submit.isEnabled());
  await code.fill('５０1２３４');assert.equal(await code.inputValue(),'501234');await code.press('Enter');
  await form.getByRole('alert').waitFor();assert.deepEqual(await page.evaluate(()=>window.joins),[{code:'501234',name:'Guest'}]);
  assert.equal(await code.inputValue(),'501234');assert.equal(await name.inputValue(),'Guest');
  for(const viewport of [{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(viewport);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await submit.scrollIntoViewIfNeeded();assert(await submit.isVisible());
  }
  await form.getByRole('button',{name:'タイトルへ戻る',exact:true}).click();
  await page.getByRole('button',{name:'招待に参加する',exact:true}).waitFor();
  await page.goto(`${base}?kind=${kind}&invite=1&rpgRoom=501234`);
  await page.locator('[data-invite-entry]').waitFor();assert.equal(await page.locator('[data-invite-entry] input').count(),1);
  await page.getByLabel('参加名',{exact:true}).fill('URL guest');await page.getByRole('button',{name:'参加する',exact:true}).click();
  await page.getByRole('alert').waitFor();assert.deepEqual(await page.evaluate(()=>window.joins),[{code:'501234',name:'URL guest'}]);
  await page.close();console.log(`PASS: ${kind} title → name/code only, Enter join, validation, error recovery, back navigation, URL name-only and portrait/landscape.`);
 }
 for(const [language,entryLabel,nameLabel,codeLabel] of [['ENGLISH','Join invitation','Player name','Invitation code'],['HIRAGANA','しょうたいにさんかする','さんかなまえ','しょうたいコード']]){
  const page=await browser.newPage();page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',route=>route.abort());
  await page.goto(`${base}?kind=vr&language=${language}`);
  // The title uses the existing translation tree; entry copy is self-contained.
  await page.getByRole('button',{name:language==='ENGLISH'?entryLabel:/しょうたいに\s*さんかする/,exact:true}).click();
  await page.getByLabel(nameLabel,{exact:true}).waitFor();await page.getByLabel(codeLabel,{exact:true}).waitFor();
  assert.equal(await page.locator('[data-invite-entry] h2').textContent(),entryLabel);await page.close();console.log(`PASS: ${language} invitation labels.`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();await server.close();}
