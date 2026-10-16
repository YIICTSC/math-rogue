import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const viewport = JSON.parse(process.env.LANDSCAPE_AUDIT_VIEWPORT || '{"width":844,"height":390}');
const insets = JSON.parse(process.env.LANDSCAPE_AUDIT_INSETS || '{"top":0,"left":44,"right":44,"bottom":21}');
const ios = process.env.LANDSCAPE_AUDIT_PLATFORM !== 'android';
const out = process.env.LANDSCAPE_AUDIT_DIR || 'tmp/landscape-audit';
await mkdir(out, {recursive:true});
let server, browser;
const rows = [], errors = [];

// Inspect the actual App and its existing preview fixtures. The instrumented
// functions and hidden preview toolbar exist only in this Vite test server.
try {
  server = await createServer({
    cacheDir:'node_modules/.vite-landscape-audit', logLevel:'error',
    define:{'import.meta.env.VITE_ENABLE_DEBUG_FEATURES':'"true"'},
    server:{host:'127.0.0.1',port:0,hmr:false,watch:null},
    plugins:[{name:'layout-audit-only',enforce:'pre',async load(id) {
      if (!id.endsWith('/src/App.tsx')) return;
      let source = await readFile(id,'utf8');
      source = source.replace('import { BATTLE_MODAL_PREVIEWS,','import { APP_MODAL_PREVIEWS, BATTLE_MODAL_PREVIEWS,');
      const at = source.lastIndexOf('\n    return (');
      assert(at > 0);
      source = source.slice(0,at) + `\nwindow.layoutQA={
        screens:[...UI_PREVIEW_SCREENS,
          ...Object.values(GameScreen).filter(screen=>!UI_PREVIEW_SCREENS.some(x=>x.screen===screen)&&!['RPG_ONLINE','GAKURO_CRAFT','VICTORY'].includes(screen)).map(screen=>({id:'EXTRA-'+screen,screen})),
          ...APP_MODAL_PREVIEWS.map(x=>({...x,id:'MODAL-'+x.id,modal:x.id})),
          ...BATTLE_MODAL_PREVIEWS.map(x=>({...x,id:'BATTLE-MODAL-'+x.id,battleModal:x.id}))],
        show:(screen,outcome)=>{
          setGameState(s=>({...s,rpgOnline:false}));
          if(screen===GameScreen.DEBUG_MENU)setIsDebugMode(true);
          if(screen===GameScreen.EVENT)return handleStartEventUiPreview('elementary','忘れ物');
          if(screen===GameScreen.ENDLESS_OPENING)return handleStartEndlessSequencePreview('OPENING');
          if(screen===GameScreen.ENDLESS_TRUE_ENDING)return handleStartEndlessSequencePreview('TRUE');
          if(screen===GameScreen.KANJI_CHALLENGE)return handleStartProblemUiPreview(GameMode.KANJI_1);
          if(screen===GameScreen.ENGLISH_CHALLENGE)return handleStartProblemUiPreview(GameMode.ENGLISH_G3_1);
          if(screen===GameScreen.GENERAL_CHALLENGE)return handleStartProblemUiPreview(GameMode.SCIENCE_3_1);
          handleStartUiPreview(screen,outcome);
          if(screen===GameScreen.RPG_DEFEAT_CHALLENGE)setGameState(s=>({...s,rpgOnline:true}));
        },appModal:handleStartAppModalPreview,
        battleModal:handleStartBattleModalPreview,state:gameState};\n` + source.slice(at);
      return source.replace('{isUiPreviewMode && (\n                    <div className="fixed right-2 top-2',
        '{false && (\n                    <div className="fixed right-2 top-2');
    }}],
  });
  await server.listen();
  browser = await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page = await browser.newPage({viewport,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  page.setDefaultTimeout(90000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    localStorage.setItem('pixel_spire_language_mode_v1','JAPANESE');
    localStorage.setItem('pixel_spire_seen_battle_tutorial_v1','true');
    localStorage.setItem('pixel_spire_seen_parry_tutorial_v1','true');
    localStorage.setItem('pixel_spire_student_profile_v1',JSON.stringify({grade:'小学1年',schoolYear:'2026',dailyAssignmentLanguageMode:'JAPANESE'}));
    localStorage.setItem('learning_rogue_online_ranking_initial_prompt_declined_v1','1');
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets});
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`,{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>!!window.layoutQA);
  await page.evaluate(ios=>document.documentElement.classList.toggle('app-platform-ios',ios),ios);
  const all = await page.evaluate(()=>layoutQA.screens);
  const filter = process.env.LANDSCAPE_AUDIT_SCREENS?.split(',');
  for (const item of all.filter(s=>(process.env.LANDSCAPE_AUDIT_EXTRA_ONLY!=='1'||s.id.startsWith('EXTRA-'))&&(!filter||filter.includes(s.id)))) {
    const count = errors.length;
    try {
      await page.bringToFront();
      await page.evaluate(item=>item.modal?layoutQA.appModal(item.modal):item.battleModal?layoutQA.battleModal(item.battleModal):layoutQA.show(item.screen,item.miniGameOutcome),item);
      await page.waitForTimeout(200);
      const info = await page.evaluate(({top,left,right,bottom})=>{
        const W=innerWidth,H=innerHeight;
        const visible=e=>{
          const b=e.getBoundingClientRect(),s=getComputedStyle(e);
          if (!b.width||!b.height||s.visibility==='hidden'||s.display==='none'||b.right<=0||b.left>=W||b.bottom<=0||b.top>=H) return false;
          for(let p=e.parentElement;p;p=p.parentElement){
            const ps=getComputedStyle(p),pb=p.getBoundingClientRect();
            if(ps.overflowY!=='visible'&&(b.bottom<=pb.top||b.top>=pb.bottom))return false;
            if(ps.overflowX!=='visible'&&(b.right<=pb.left||b.left>=pb.right))return false;
          }
          const hit=document.elementFromPoint(Math.min(W-1,Math.max(1,b.x+b.width/2)),Math.min(H-1,Math.max(1,b.y+b.height/2)));
          return hit===e||e.contains(hit);
        };
        const controls=[...document.querySelectorAll('.app-screen-stage button,.app-screen-stage select,.app-screen-stage input')].filter(visible);
        const boxes=controls.map(e=>{
          const b=e.getBoundingClientRect();
          let scrollDeferred=false;
          for(let p=e.parentElement;p;p=p.parentElement){
            const s=getComputedStyle(p),r=p.getBoundingClientRect();
            if(['auto','scroll'].includes(s.overflowY)&&p.scrollHeight>p.clientHeight+1&&(b.bottom>r.bottom+1||b.top<r.top-1)&&r.bottom<=H-bottom+1&&r.top>=top-1)scrollDeferred=true;
            if(['auto','scroll'].includes(s.overflowX)&&p.scrollWidth>p.clientWidth+1&&(b.right>r.right+1||b.left<r.left-1)&&r.right<=W-right+1&&r.left>=left-1)scrollDeferred=true;
          }
          return {text:(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,65),class:e.className,box:b.toJSON(),scrollDeferred};
        });
        return {state:layoutQA.state.screen,
          rootOverflow:document.documentElement.scrollWidth>W+1||document.documentElement.scrollHeight>H+1,
          controls:controls.length,scrollDeferred:boxes.filter(e=>e.scrollDeferred),
          unsafe:boxes.filter(e=>!e.scrollDeferred&&(e.box.x<left-1||e.box.x+e.box.width>W-right+1||e.box.y<top-1||e.box.y+e.box.height>H-bottom+1)),
          layers:[...document.querySelector('.app-screen-stage').children].filter(e=>e.getBoundingClientRect().height>H/2).map(e=>({class:e.className,box:e.getBoundingClientRect().toJSON()}))};
      },insets);
      if(item.id==='START_MENU'&&viewport.width>viewport.height&&viewport.height<=600){
        const title=await page.evaluate(()=>Object.fromEntries(['panel','banner','time'].map((k,i)=>[k,document.querySelector(['.start-menu-button-panel','.start-menu-ios-launch-banner','.start-menu-playtime'][i])?.getBoundingClientRect().toJSON()])));
        assert(title.panel.x>=viewport.width*.48,'Title actions occupy the right column');
        if(title.banner){assert(title.banner.x>=insets.left&&title.banner.right<=title.panel.left,'iOS promotion occupies the safe left column');assert(title.banner.bottom<=title.time.top-4,'iOS promotion sits above playtime');}
        info.title=title;
      }
      // Capture the compositor directly: no font-loading wait can stall an
      // otherwise rendered canvas/WebGL game during this broad screenshot pass.
      const capture = await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
      await writeFile(`${out}/${item.id.replaceAll(':','-')}.png`,Buffer.from(capture.data,'base64'));
      rows.push({...item,...info,errors:errors.slice(count)});
      console.log(item.id,'unsafe',info.unsafe.length,'errors',errors.length-count);
    } catch(e) {
      rows.push({...item,failure:String(e),errors:errors.slice(count)});
      console.log(item.id,'FAIL',String(e).slice(0,180));
    }
  }
  await writeFile(`${out}/report.json`,JSON.stringify({viewport,insets,rows},null,2));
  assert.equal(rows.filter(r=>r.failure||r.errors?.length||r.rootOverflow).length,0,'Rendering errors or document overflow; inspect report.json');
  console.log('PASS audit:',rows.length,'screens/states; no rendering errors or document overflow. Unsafe candidates are recorded for visual review.');
} finally {
  await browser?.close();
  await server?.close();
}
