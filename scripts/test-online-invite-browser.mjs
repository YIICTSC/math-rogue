import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {WebSocket} from 'ws';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
const port=10112,clients=[];
const backend=spawn(process.execPath,['server/dist/index.mjs'],{env:{...process.env,PORT:String(port),ALLOWED_ORIGINS:''},stdio:['ignore','pipe','pipe']});
backend.stderr.on('data',d=>process.stderr.write(d));
await new Promise((resolve,reject)=>{backend.stdout.once('data',resolve);backend.once('exit',code=>reject(Error('Server exit '+code)));});
const server=await createServer({cacheDir:'node_modules/.vite-invite-qa',optimizeDeps:{entries:['index.html']},define:{'import.meta.env.VITE_ONLINE_SERVER_URL':JSON.stringify(`http://127.0.0.1:${port}`),'import.meta.env.VITE_ENABLE_DEBUG_FEATURES':'"false"'},server:{host:'127.0.0.1',port:5192,strictPort:true,hmr:false,watch:null},plugins:[{name:'invite-observation',enforce:'pre',async load(id){if(!id.endsWith('/src/App.tsx'))return;const s=await readFile(id,'utf8'),at=s.lastIndexOf('\n    return (');return s.slice(0,at)+'\n window.__inviteApp={screen:gameState.screen,theme:visualTheme,player:gameState.player,snapshot:rpgSnapshot};\n'+s.slice(at);}}]});
await server.listen();let browser;
async function until(fn){const end=Date.now()+20000;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw Error('Server state timeout');}
async function host(game){const ws=new WebSocket(`ws://127.0.0.1:${port}/${game==='rpg'?'online':game}`),packets=[];clients.push(ws);ws.on('message',(raw,binary)=>{if(!binary)packets.push(JSON.parse(raw.toString()));});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});ws.send(JSON.stringify({type:'connect',protocol:game==='golf'?3:1,create:true,name:'Host',hero:0,course:0,avatar:(await server.ssrLoadModule('/src/mini-games/gakuro-kart/avatar.ts')).defaultAvatar(),setup:{visualTheme:'elementary',mode:'ADDITION',answerMode:'CHOICE',difficultyLevel:1},minutes:0}));await until(()=>{const error=packets.find(p=>p.type==='error');if(error)throw Error(error.message);return packets.some(p=>p.type==='connected');});const code=packets.find(p=>p.type==='connected').code;if(game==='golf')ws.send(JSON.stringify({type:'lesson',selection:{mode:'ADDITION'}}));if(game==='kart')ws.send(JSON.stringify({type:'lesson',lesson:{title:'Test',questions:[{id:'q',mode:'ADDITION',question:'1+1',options:['2','3','4','5'],correct:0}]}}));return{ws,packets,code};}
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const game of (process.env.TEST_GAMES||'golf,kart,rpg').split(',')){
  const h=await host(game),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.setDefaultTimeout(90000);page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',game,e.message);});
  await page.addInitScript(()=>localStorage.setItem('pixel_spire_language_mode_v1','JAPANESE'));
  await page.goto(`http://127.0.0.1:5192/?${game==='rpg'?'rpgRoom':game+'Room'}=S-${h.code}`,{waitUntil:'domcontentloaded',timeout:120000});
  const entry=page.locator('[data-invite-entry]');try{await entry.waitFor({timeout:30000});}catch(e){console.log('DIAGNOSTIC',game,errors,await page.evaluate(()=>({screen:window.__inviteApp?.screen,theme:window.__inviteApp?.theme})),await page.locator('body').innerText());throw e;}assert.equal(await entry.locator('input').count(),1);assert.equal(await entry.getByRole('button',{name:'参加する',exact:true}).isDisabled(),true);assert.equal(await page.locator('[data-gamepad-initial-scope="online-profile-register"]').isVisible(),false);
  for(const size of [{width:390,height:844},{width:568,height:320},{width:320,height:568}]){await page.setViewportSize(size);const b=await entry.locator('form').boundingBox();assert(b&&b.x>=0&&b.y>=0&&b.x+b.width<=size.width+1&&b.y+b.height<=size.height+1,game+' invitation clipped');}
  await page.setViewportSize({width:844,height:390});await entry.getByRole('textbox',{name:'参加名'}).fill('Guest '+game);await entry.getByRole('button',{name:'参加する',exact:true}).click();
  if(game==='rpg'){
   await page.locator('.rpg-invite-theme').waitFor();await page.getByRole('combobox',{name:'開始する編',exact:true}).selectOption('high-school');await page.waitForFunction(()=>window.__inviteApp.theme==='high-school');
   await page.getByRole('button',{name:/敵キャラクターで冒険/}).click();await page.locator('.rpg-hero-confirm').click();await page.locator('.rpg-waiting-lobby').waitFor();
   await page.waitForFunction(()=>window.__inviteApp.snapshot?.world.players[window.__inviteApp.snapshot.selfId]?.profile?.visualTheme==='high-school');
   assert.match(await page.evaluate(()=>window.__inviteApp.player.id),/^RPG_ENEMY:/);
   await page.getByRole('button',{name:'編と主人公を選び直す',exact:true}).click();await page.getByRole('combobox',{name:'開始する編',exact:true}).selectOption('magic');await page.getByRole('button',{name:/敵キャラクターで冒険/}).click();await page.locator('.rpg-hero-confirm').click();await page.locator('.rpg-waiting-lobby').waitFor();
  }else if(game==='golf'){
   const creator=page.getByRole('dialog',{name:'キャラクタークリエイト',exact:true});await creator.waitFor();assert.equal(await creator.locator('canvas').count(),1);await creator.getByRole('button',{name:'ウサギ',exact:true}).click();await creator.getByRole('button',{name:'確定',exact:true}).click();await page.locator('.gg-lobby').waitFor();
  }else{
   await page.locator('.gk-ready-card').waitFor();assert.equal(await page.locator('.online-avatar-preview canvas').count(),1);await page.getByRole('button',{name:'ウサギ',exact:true}).click();
  }
  const dash=page.locator(game==='rpg'?'.rpg-waiting-mini-game':'.online-waiting-dash');await dash.locator('summary').click();await dash.getByRole('button',{name:'START DASH',exact:true}).waitFor();assert.match(await dash.innerText(),/HP 1/);await dash.getByRole('button',{name:'START DASH',exact:true}).click();
  h.ws.send(JSON.stringify(game==='rpg'?{type:'action',action:{type:'rpg-start'}}:{type:'start',fill:false}));await dash.waitFor({state:'detached'});assert.equal(await page.getByRole('dialog',{name:'キャラクタークリエイト',exact:true}).count(),0);assert.deepEqual(errors,[]);console.log('PASS:',game,'name-only invitation, customization, one-hit dash and host start');await page.close();h.ws.terminate();
 }
 const golf=await server.ssrLoadModule('/src/mini-games/gakuro-golf/invite.ts');for(const prefix of ['H','S']){const u=golf.golfInviteUrl('https://example.test/math-rogue/?kartRoom=H-ABC234#old',prefix+'-ABC234');assert.equal(golf.golfInviteCode(u),prefix+'-ABC234');assert(!u.includes('kartRoom'));}assert.equal(golf.golfInviteCode('https://x/?golfRoom=bad'),'');
 console.log('PASS: golf invite URLs preserve host/server communication and remove conflicting game parameters.');
}finally{for(const s of clients)s.terminate();await browser?.close();await server.close();backend.kill();}
