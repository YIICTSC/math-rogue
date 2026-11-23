import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium,webkit} from 'playwright';
import {spawn} from 'node:child_process';
import {createServer as createTcpServer} from 'node:net';
const file=`.card-club-qa-${process.pid}.tsx`,dir=process.env.CARD_CLUB_SCREENSHOT_DIR||'build/card-club-qa';let server,browser,signaling,turn;
const lobbyTest=process.argv.includes('--lobby')||process.env.CLUB_NETWORK==='1';
try{
 if(lobbyTest){
  signaling=spawn(process.execPath,['--input-type=module','-e',`import {PeerServer} from 'peer'; PeerServer({host:'127.0.0.1',port:0,path:'/club'}, server=>process.send(server.address().port));`],{stdio:['ignore','ignore','inherit','ipc']});
  const port=await new Promise((resolve,reject)=>{
   signaling.once('message',resolve);signaling.once('error',reject);
   signaling.once('exit',code=>reject(Error('PeerServer exited '+code)));
  });
  let ice=[];
  if(process.env.CARD_CLUB_TEST_TURN_MODULE){
   const {createServer:makeTurn}=await import(process.env.CARD_CLUB_TEST_TURN_MODULE);
   const turnPort=await new Promise(resolve=>{
    const socket=createTcpServer();
    socket.listen(0,'127.0.0.1',()=>{const address=socket.address();socket.close(()=>resolve(address.port));});
   });
   turn=makeTurn({auth:{mechanism:'long-term',realm:'club.local',credentials:{club:'local-test-only'}},
     allowPrivatePeers:true,allowLoopback:true,relay:{ip:'127.0.0.1',externalIp:'127.0.0.1'}});
   await new Promise((resolve,reject)=>{
    turn.on('listening',resolve);turn.on('error',reject);turn.listen({port:turnPort,address:'127.0.0.1',transport:'tcp'});
   });
   ice=[{urls:`turn:127.0.0.1:${turnPort}?transport=tcp`,username:'club',credential:'local-test-only'}];
  }
  Object.assign(process.env,{VITE_RPG_PEER_HOST:'127.0.0.1',VITE_RPG_PEER_PORT:String(port),VITE_RPG_PEER_PATH:'/club',VITE_RPG_PEER_SECURE:'false',VITE_KART_ICE_SERVERS:JSON.stringify(ice)});
 }
 await fs.mkdir(dir,{recursive:true});
 await fs.writeFile(file,`import {CARD_CLUB_VOICE_HEROES,CARD_CLUB_VOICE_MS} from './src/data/cardClubVoices';import React from 'react';import {createRoot} from 'react-dom/client';import CardClub from './src/mini-games/card-club/CardClub';import * as engine from './src/mini-games/card-club/engine';import {DIVERSITY_IDS} from './src/mini-games/card-club/diversityCatalog';import {TRADITIONAL_IDS} from './src/mini-games/card-club/traditionalCatalog';import {WORLD_IDS} from './src/mini-games/card-club/worldCatalog';import {POPULAR_IDS} from './src/mini-games/card-club/popularCatalog';import {definition,CLUB_GAMES} from './src/mini-games/card-club/catalog';import {audioService} from './src/services/audioService';audioService.playBGM=async()=>{};if(!location.search.includes('voiceTest')){audioService.playCardClubVoice=async()=>false;audioService.playCardClubScoreVoice=async()=>false;}Object.assign(window,{CARD_CLUB_VOICE_HEROES,CARD_CLUB_VOICE_MS,audioService,engine,popular:[...POPULAR_IDS,...WORLD_IDS,...TRADITIONAL_IDS,...DIVERSITY_IDS],games:CLUB_GAMES,implemented:CLUB_GAMES.length,world:WORLD_IDS,definition});createRoot(document.getElementById('root')).render(<CardClub languageMode={new URLSearchParams(location.search).get('lang')||'JAPANESE'} onBack={()=>{}}/>);`);
 const hook=`(window as any).__club={room:()=>room.current,choose,setHero,load:(id:GameId,n:number)=>{room.current?.close();const client=new CardClubRoom(p=>setPacket(p),m=>setError(m));room.current=client;client.practice(profile());client.configure(id,n);client.start();clearInterval((client as any).cpuTimer);const session=(client as any).session;session.state=(window as any).engine.createClubGame(id,session.state.players,42);session.publish();}};`;
 server=await createServer({cacheDir:process.env.CARD_CLUB_VITE_CACHE||'node_modules/.vite-card-club-qa',optimizeDeps:{noDiscovery:true,include:['react','react-dom/client','react/jsx-runtime','peerjs']},server:{host:'127.0.0.1',port:5243,hmr:false},plugins:[{name:'card-club-qa',enforce:'pre',transform(code,id){if(id.endsWith('/card-club/CardClub.tsx'))return code.replace('  return <main',hook+'\n  return <main');},configureServer(s){s.middlewares.use('/__club',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__club',`<html><head><link rel="icon" href="data:,"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>body{margin:0}</style></head><body><div id="root"></div><script type="module" src="/${file}"></script></body></html>`));});}}],logLevel:'error'});
 await server.listen();
 browser=process.env.CARD_CLUB_BROWSER==='webkit'?await webkit.launch():await chromium.launch({
  headless:true,executablePath:process.env.CHROMIUM_PATH||await fs.access('/usr/bin/chromium').then(()=>'/usr/bin/chromium',()=>undefined),
  args:['--no-sandbox','--disable-features=WebRtcHideLocalIpsWithMdns'],
 });
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message);});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.error('CONSOLE',m.text());}});
 if(lobbyTest){
  const entry='http://127.0.0.1:5243/__club';
  const host=page,guest=await browser.newPage({viewport:{width:390,height:844}}),third=await browser.newPage();
  for(const tab of [guest,third])tab.on('pageerror',e=>errors.push(e.message));
  const recordVoices=async tab=>tab.evaluate(()=>{
   window.turnVoices=[];
   window.audioService.playCardClubVoice=async (hero,event)=>{window.turnVoices.push({hero,event});return true;};
  });
  await host.setViewportSize({width:390,height:844});
  await host.goto(entry+'?lang=ENGLISH');await recordVoices(host);
  await host.getByRole('button',{name:'Create room',exact:true}).click();
  assert.equal(await host.locator('.cc-games').count(),0,'Host creates a room before selecting a game');
  await host.getByLabel('Player name').fill('Host A');
  await host.getByRole('button',{name:'Change character'}).click();
  await host.locator('.cc-heroes').getByRole('button',{name:'dodgeball',exact:true}).click();
  await host.getByRole('button',{name:'Create room',exact:true}).click();
  await host.locator('.cc-code').waitFor();
  const code=(await host.locator('.cc-code').innerText()).trim();
  assert.match(code,/^\d{6}$/);
  const invite=await host.getByLabel('Invitation link').inputValue();
  assert.equal(invite,`${entry}?cardClubRoom=${code}`);
  await host.getByRole('button',{name:'Copy invite link'}).click();
  await host.getByRole('button',{name:'Copied',exact:true}).waitFor();
  for(const [width,height] of [[390,844],[844,390]]){
   await host.setViewportSize({width,height});
   const actions=await host.locator('.cc-start-row button').boundingBox();
   assert(actions&&actions.y+actions.height<=height,'Start button is visible at '+width+'×'+height);
   for(const recommendation of await host.locator('.cc-recommendations button').all()){
    const box=await recommendation.boundingBox();
    assert(box&&box.y+box.height<=actions.y,'Recommended games and the start button stay separate');
   }
   await host.screenshot({path:`${dir}/room-${width}x${height}.png`});
  }
  await host.getByRole('button',{name:'Browse games'}).click();
  await host.getByRole('searchbox').fill('gin rummy');
  await host.locator('.cc-games>button').first().click();
  await host.waitForFunction(()=>window.__club.room().last.game==='ginrummy');

  const opened=new URL(invite);opened.searchParams.set('lang','ENGLISH');
  await guest.goto(opened.href);await recordVoices(guest);
  await guest.getByRole('heading',{name:'Join invitation'}).waitFor();
  assert.equal(await guest.getByLabel('Invitation code').inputValue(),code);
  await guest.getByLabel('Player name').fill('Guest B');
  await guest.getByRole('button',{name:'Change character'}).click();
  await guest.locator('.cc-heroes').getByRole('button',{name:'akari',exact:true}).click();
  await guest.getByRole('button',{name:'Join room',exact:true}).click();
  try{await host.waitForFunction(()=>window.__club.room().last.members.length===2);}
  catch(error){
   for(const [name,tab] of [['host',host],['guest',guest]])console.error(name,await tab.evaluate(()=>{
    const client=window.__club.room();
    return {message:document.querySelector('.cc-notice')?.textContent,phase:client?.last?.phase,
     connected:[...(client?.channels.values()??[])].map(c=>[c.open,c.peerConnection?.connectionState,c.peerConnection?.iceConnectionState])};
   }));
   throw error;
  }

  await third.goto(entry+'?lang=ENGLISH');await recordVoices(third);
  await third.getByRole('button',{name:'Join invitation',exact:true}).click();
  await third.getByLabel('Player name').fill('Guest C');
  await third.getByLabel('Invitation code').fill(code.replace(/[0-9]/g,n=>String.fromCharCode(n.charCodeAt(0)+0xff10-48)));
  await third.getByRole('button',{name:'Join room',exact:true}).click();
  await host.waitForFunction(()=>window.__club.room().last.members.length===3);
  assert.equal(await host.locator('.cc-seat-list li').count(),3);
  assert.notEqual(await host.evaluate(()=>window.__club.room().last.game),'ginrummy');
  assert.equal(await host.getByLabel('Match seats').inputValue(),'3');
  assert(await host.locator('.cc-recommendations button').count()>=3);
  await host.getByRole('button',{name:'Browse games'}).click();
  const playerCount=host.getByLabel('Player count');
  assert.equal(await playerCount.locator('option[value="2"]').count(),0);
  await host.getByRole('searchbox').fill('gin rummy');
  await host.locator('.cc-empty-search').waitFor();
  await playerCount.selectOption('4');
  await host.getByRole('searchbox').fill('old maid');
  await host.locator('.cc-games>button').first().click();
  assert.equal(await host.getByLabel('Match seats').inputValue(),'4');
  await host.getByRole('button',{name:'Start this table',exact:true}).click();
  await Promise.all([host,guest,third].map(tab=>tab.locator('.cc-match').waitFor()));
  const first=await host.evaluate(()=>window.__club.room().last.view.turn);
  const tabs=[host,guest,third];
  await tabs[first].evaluate(()=>{const room=window.__club.room();room.command(room.last.view.actions[0]);});
  await host.waitForFunction(first=>window.__club.room().last.view.turn!==first,first);
  for(const tab of tabs) {
   assert.deepEqual(await tab.evaluate(()=>window.turnVoices.map(call=>call.event)), ['start'], 'Each seat hears its own welcome once, with no chatter on the first turn change');
  }
  await host.evaluate(()=>window.__club.room().finish());
  await guest.getByText('When the host chooses another game', {exact:false}).waitFor();
  await host.getByRole('button',{name:'Choose another game',exact:true}).click();
  await Promise.all(tabs.map(tab=>tab.locator('.cc-lobby').waitFor()));
  assert.equal(await guest.locator('.cc-code').innerText(),code);
  assert.equal(await guest.locator('.cc-seat-list li').count(),3);
  await host.locator('.cc-recommendations').getByRole('button',{name:/Yaniv/}).click();
  await host.getByRole('button',{name:'Start this table',exact:true}).click();
  await guest.locator('[data-club-game=yaniv]').waitFor();
  assert.equal(await guest.evaluate(()=>window.__club.room().last.view.players.find(p=>p.name==='Guest B').hero),'magic-akari');
  await host.evaluate(()=>{
   const room=window.__club.room();
   clearInterval(room.cpuTimer);
   const state=room.session.state;
   state.turn=1;
   state.players.forEach((player,seat)=>{player.hand=[seat===0?0:seat===1?13:seat+8];});
   state.revision++;
   room.session.publish();
  });
  await guest.getByRole('button',{name:'Yaniv!',exact:true}).click();
  for(const tab of tabs){
   await tab.waitForFunction(()=>window.turnVoices.some(call=>call.event==='assaf'));
   assert.deepEqual(await tab.evaluate(()=>window.turnVoices.filter(call=>['yaniv','assaf'].includes(call.event))),[
    {hero:'magic-akari',event:'yaniv'}, {hero:'high-school-dodgeball',event:'assaf'},
   ]);
  }
  await host.getByRole('button',{name:'Next deal',exact:true}).click();
  await third.waitForFunction(()=>window.__club.room().last.view.phase==='play');
  await host.evaluate(()=>{
   const room=window.__club.room(), state=room.session.state;
   state.turn=1;
   state.players[1].hand=[33,0];
   state.revision++;
   room.session.publish();
  });
  await guest.locator('.cc-actions').getByRole('button',{name:'Discard: ♥8',exact:true}).click();
  for(const [self,tab] of tabs.entries()){
   await tab.locator('[data-club-play-seat="1"] [data-card="33"]').waitFor();
   const seats=await tab.locator('.cc-seat-table').evaluate(board=>{
    const mid=board.getBoundingClientRect();
    const own=board.querySelector('[data-own-seat]');
    return {own:Number(own.dataset.clubSeat),near:own.getBoundingClientRect().top>mid.top+mid.height/2,
     angle:Number(board.querySelector('[data-club-play-seat="1"]').dataset.cardAngle)};
   });
   assert.deepEqual(seats,{own:self,near:true,angle:((1-self+tabs.length)%tabs.length)*120});
  }
  await third.getByRole('button',{name:'Leave room',exact:true}).click();
  await host.waitForFunction(()=>window.__club.room().last.view.players.find(p=>p.name.startsWith('Guest C'))?.cpu);
  assert.deepEqual(errors,[]);
  console.log('PASS: 3-browser WebRTC, host-first selection, URL/code entry, per-player table perspective, public play attribution, confirmed declarations, and switching games in the same room.');
  process.exitCode=0;
 }else{
 await page.goto('http://127.0.0.1:5243/__club'+((process.argv.includes('--voices')||process.argv.includes('--declaration-voices'))?'?voiceTest=1':''));await page.locator('.cc-title-copy').waitFor();
 for(const [width,height] of [[1280,900],[390,844],[844,390]]) {
  await page.setViewportSize({width,height});
  await page.locator('.cc-title-art').evaluate(img=>img.decode());
  assert(await page.locator('.cc-title-art').evaluate(img=>img.naturalWidth>0));
  const art=await page.locator('.cc-title-art').boundingBox();
  assert(art && art.width>=width && art.height>=height,'Dedicated title image fills the viewport');
  await page.screenshot({path:`${dir}/title-${width}x${height}.png`});
  if(process.argv.includes('--titles')){
   const menu=await page.locator('.cc-title-modes').boundingBox();
   assert(menu&&menu.y>height*.65&&menu.y+menu.height<=height,`Title actions stay in view near the bottom at ${width}×${height}: ${JSON.stringify(menu)}`);
  }
 }
 await page.setViewportSize({width:1280,height:900});await page.getByRole('button',{name:'CPUと遊ぶ'}).click();await page.getByRole('button',{name:'このキャラクターでゲーム選択'}).click();const implemented=await page.evaluate(()=>window.implemented);assert.match(await page.locator('.cc-search-count').innerText(),new RegExp(String(implemented)));assert.equal(await page.locator('.cc-games>button').count(),implemented);
 assert.equal(await page.locator('.cc-reference').count(),0);assert(!/467|未対応|Reference entries/.test(await page.locator('.cc-search-count').innerText()));await page.locator('input[type=search]').fill('faro');await page.locator('.cc-empty-search').waitFor();assert.equal(await page.locator('.cc-games>button').count(),0);assert.equal(await page.locator('a[href*=faro]').count(),0);await page.locator('input[type=search]').fill('');
 const load=async(game,n)=>{await page.evaluate(({game,n})=>window.__club.load(game,n||window.definition(game).defaultPlayers),{game,n});await page.waitForFunction(g=>document.querySelector('[data-club-game]')?.getAttribute('data-club-game')===g,game);};
 const snapshot=async(path)=>{await page.waitForFunction(()=>!document.querySelector('.cc-flight-layer'));await page.screenshot({path});};
 const mutate=async(fn,arg)=>{await page.evaluate(({fn,arg})=>{const session=window.__club.room().session;new Function('s','arg',fn)(session.state,arg);session.publish();},{fn:fn.toString().replace(/^.*?\{([\s\S]*)\}$/,'$1'),arg});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));};
 if(process.argv.includes('--hand-layout')){
  await page.emulateMedia({reducedMotion:'reduce'});
  const layout=()=>page.evaluate(()=>{
   const box=(selector)=>{
    const r=document.querySelector(selector)?.getBoundingClientRect();
    return r&&[r.x,r.y,r.width,r.height].map(Math.round);
   };
   return {
    table:box('.cc-playfield'),tray:box('.cc-hand-area'),cards:box('.cc-hand'),actions:box('.cc-actions'),
   };
  });
  const passOnly=s=>{
   s.players[0].hand=[44,48];
   s.turn=0;s.table=[49];Object.assign(s.ladder,{count:1,form:'set',rank:11,last:1});
   s.pilePlays=[{seat:1,cards:[49]}];s.revision++;
  };
  for(const [width,height] of [[320,568],[390,844],[768,1024]]){
   await page.setViewportSize({width,height});
   await load('daihinmin',5);await mutate(passOnly);
   const pass=page.locator('.cc-actions').getByRole('button',{name:'パス',exact:true});
   const playerTurn=await layout();
   const card=await page.locator('.cc-hand .cc-card').first().boundingBox();
   assert(card.y+card.height<=playerTurn.cards[1]+playerTurn.cards[3]+1,'The portrait tray fits the whole card');
   await snapshot(`${dir}/hand-layout-pass-${width}x${height}.png`);
   await pass.click();
   assert.equal(await page.locator('.cc-actions button').count(),0);
   assert.deepEqual(await layout(),playerTurn,'The table and hand stay fixed when Pass disappears');
   await snapshot(`${dir}/hand-layout-wait-${width}x${height}.png`);
   await mutate(s=>{
    s.turn=0;s.ladder.count=0;s.table=[];s.pilePlays=[];
    s.players[0].hand=Array.from({length:12},(_,i)=>i+1);
    s.revision++;
   });
   const buttons=page.locator('.cc-actions button');
   assert(await buttons.count()>8);
   assert.deepEqual(await layout(),playerTurn,'Scrolling through multiple rows does not resize the table');
   const firstCard=page.locator('.cc-hand [data-card="1"]');
   await firstCard.click({position:{x:11,y:18}});
   assert.equal(await firstCard.getAttribute('aria-pressed'),'true');
   assert.deepEqual(await layout(),playerTurn,'Selecting a hand card preserves geometry while actions are filtered');
   await mutate(s=>{s.turn=1;s.players[0].hand=[];s.revision++;});
   assert.equal(await page.locator('.cc-hand .cc-card').count(),0);
   assert.deepEqual(await layout(),playerTurn,'An empty hand retains its display area until the result');

   await load('war',2);await mutate(s=>{s.turn=0;s.revision++;});
   const noHand=await layout();
   await page.locator('.cc-actions button').click();
   assert.equal(await page.locator('.cc-actions button').count(),0);
   assert.deepEqual(await layout(),noHand,'A face-down deck also keeps its action area while waiting');

   await load('rummy',2);await mutate(s=>{s.turn=0;s.extra.step='draw';s.revision++;});
   const rummyTurn=await layout();
   await mutate(s=>{s.turn=1;s.revision++;});
   assert.equal(await page.locator('.cc-actions button').count(),0);
   assert.deepEqual(await layout(),rummyTurn,'Rummy preserves its grouping tray and action area');
  }
  for(const [width,height] of [[568,320],[667,375],[844,390]]){
   await page.setViewportSize({width,height});await load('daihinmin',5);await mutate(passOnly);
   const pass=await page.locator('.cc-actions button').boundingBox();
   const hand=await page.locator('.cc-hand').boundingBox();
   const card=await page.locator('.cc-hand .cc-card').first().boundingBox();
   assert(pass.width>=120&&pass.height>=44,'Pass fills a wider touch target in landscape');
   assert(hand.height>=76&&card.height>=60&&card.y+card.height<=hand.y+hand.height,'The landscape hand and card grow vertically');
   assert(pass.y+pass.height<=height&&hand.y+hand.height<=height,'The hand and actions fit entirely in the viewport');
   await snapshot(`${dir}/hand-layout-wide-${width}x${height}.png`);
   await mutate(s=>{s.table=[];s.ladder.count=0;s.pilePlays=[];s.revision++;});
   const play=page.locator('.cc-actions').getByRole('button',{name:'♠6',exact:true});
   assert((await play.boundingBox()).width>=94,'Options remain wide when more than one action is shown');
   await play.click();
   await page.waitForFunction(()=>window.__club.room().session.state.table[0]===44);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS stable portrait layout when actions or cards appear/disappear, and larger clickable landscape cards and actions.');
 }else if(process.argv.includes('--seating')){
  await page.emulateMedia({reducedMotion:'reduce'});
  const fixture=[33,46,20,41,28,29,31,27];
  for(const [width,height] of [[1280,900],[390,844],[844,390],[568,320],[320,568]]){
   await page.setViewportSize({width,height});
   for(const count of [2,3,4,5,6,7,8]){
    await load('trumpcrew',count);
    await mutate((s,arg)=>{
     s.turn=0;s.phase='play';s.extra.step='play';s.trump=-1;
     s.players.forEach((p,i)=>{p.hand=[arg[i],i];});
     for(let i=0;i<s.players.length;i++){
      const action=window.engine.legalActions(s).find(a=>a.cards?.[0]===arg[i]);
      if(!action||!window.engine.applyAction(s,i,action))throw Error('Could not play fixture card');
     }
    },fixture);
    const seats=await page.locator('.cc-seat-table').evaluate(board=>{
     const bounds=board.getBoundingClientRect(), cx=bounds.x+bounds.width/2, cy=bounds.y+bounds.height/2;
     const safe=rect=>rect.left>=bounds.left-1&&rect.top>=bounds.top-1&&rect.right<=bounds.right+1&&rect.bottom<=bounds.bottom+1;
     return [...board.querySelectorAll('[data-club-seat]')].map(el=>{
      const seat=Number(el.dataset.clubSeat);
      const group=board.querySelector('[data-club-play-seat="'+seat+'"]');
      const card=group.querySelector('.cc-card');
      const from=el.getBoundingClientRect(), to=card.getBoundingClientRect();
      const distance=rect=>Math.hypot(rect.x+rect.width/2-cx,rect.y+rect.height/2-cy);
      return {seat,angle:Number(group.dataset.cardAngle),card:Number(card.dataset.card),inside:safe(to)&&safe(from),
       inward:distance(to)<distance(from),near:seat===0?from.y>to.bottom:true,visible:getComputedStyle(card).opacity==='1'};
     });
    });
    assert.deepEqual(seats,fixture.slice(0,count).map((card,seat)=>({seat,angle:seat*360/count,card,inside:true,inward:true,near:true,visible:true})),
     'Trick is placed at its original seats with the local card nearest at '+width+'×'+height);
    assert.equal(await page.locator('.cc-player-ring .table-hand-count').count(),count);
    if(count===8)await snapshot(`${dir}/seated-trick-${width}x${height}.png`);
   }
  }
  await page.setViewportSize({width:390,height:844});
  await load('daihinmin',3);
  await mutate(s=>{
   s.turn=0;s.players[0].hand=[2,15,10];s.players[1].hand=[3,16,11];s.players[2].hand=[4,17,12];
   for(const [seat,cards] of [[0,[2,15]],[1,[3,16]]]){
    const action=window.engine.legalActions(s).find(a=>a.cards?.join()===cards.join());
    if(!action||!window.engine.applyAction(s,seat,action))throw Error('Could not play set');
   }
  });
  assert.equal(await page.locator('[data-club-play-seat="0"] .cc-card').count(),2);
  assert.equal(await page.locator('[data-club-play-seat="1"].cc-active-pile .cc-card').count(),2);
  assert.equal(await page.locator('.cc-active-pile').count(),1);
  await snapshot(`${dir}/seated-going-out-390x844.png`);
  await page.setViewportSize({width:844,height:390});
  await snapshot(`${dir}/seated-going-out-844x390.png`);
  await mutate(s=>{
   for(let i=0;i<2;i++)if(!window.engine.applyAction(s,s.turn,{type:'pass'}))throw Error('Could not pass');
  });
  assert.equal(await page.locator('[data-table-play="cleared-pile"]').count(),1);
  assert.equal(await page.locator('.cc-active-pile').count(),0);

  await load('fantan',8);
  await mutate(s=>{
   s.table=Array.from({length:52},(_,card)=>card).filter(card=>card%13>=2&&card%13<=10);
   s.players.forEach(p=>{p.hand=p.hand.filter(card=>!s.table.includes(card));});
   s.turn=0;s.revision++;
  });
  for(const [width,height] of [[320,568],[568,320]]){
   await page.setViewportSize({width,height});
   assert.equal(await page.locator('.cc-fantan-row .cc-card').count(),36);
   assert(await page.locator('.cc-fantan-table').evaluate(grid=>{
    const bounds=grid.closest('.cc-seat-table').getBoundingClientRect();
    return [...grid.querySelectorAll('.cc-card')].every(card=>{
     const r=card.getBoundingClientRect();
     return r.width>8&&r.height>12&&r.left>=bounds.left&&r.right<=bounds.right&&r.top>=bounds.top&&r.bottom<=bounds.bottom;
    });
   }), 'Seven rows fit their shared center at '+width+'×'+height);
   await snapshot(`${dir}/seated-fantan-${width}x${height}.png`);
  }
  await page.setViewportSize({width:844,height:390});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await load('crazyeight',4);
  await mutate(s=>{s.turn=1;s.players[1].hand=[33,0];s.table=[];});
  const rival=await page.locator('[data-club-seat="1"]').boundingBox();
  await mutate(s=>{
   const action=window.engine.legalActions(s).find(a=>a.cards?.[0]===33&&a.suit===3);
   if(!window.engine.applyAction(s,1,action))throw Error('Could not play eight');
  });
  const flight=page.locator('.cc-flight-layer .cc-flying-card[data-seated]');
  assert.equal(await flight.count(),1);
  const path=await flight.evaluate(card=>{
   const frames=card.getAnimations()[0].effect.getKeyframes();
   const first=new DOMMatrix(frames[0].transform);
   return {x:parseFloat(card.style.left)+parseFloat(card.style.width)/2+first.e,
    y:parseFloat(card.style.top)+parseFloat(card.style.height)/2+first.f,last:frames.at(-1).transform};
  });
  assert(Math.abs(path.x-rival.x-rival.width/2)<2&&Math.abs(path.y-rival.y-rival.height/2)<2,'Play starts from the actual opponent');
  assert.match(path.last,/rotate\(90deg\)/,'Card lands rotated toward that seat');
  assert.match(await page.locator('.cc-table-state').innerText(),/♠/,'Crazy Eights keeps the called suit visible');
  await snapshot(`${dir}/seated-eights-844x390.png`);
  assert.deepEqual(errors,[]);
  console.log('PASS seated tables for 2–8 seats across five sizes, public trick/group placement and exact flight origin and rotation.');
 }else if(process.argv.includes('--declaration-voices')){
  const statuses=[];
  page.on('response',r=>{
   if(r.url().includes('/sfx/table-declarations/'))statuses.push([new URL(r.url()).pathname,r.status()]);
  });
  await page.evaluate(()=>{
   window.declarationVoices=[];
   window.audioService.setSfxVolume(0);window.audioService.setVoiceVolume(.5);
   const play=window.audioService.playCardClubVoice.bind(window.audioService);
   window.audioService.playCardClubVoice=async(hero,event)=>{
    const played=await play(hero,event);window.declarationVoices.push({hero,event,played});return played;
   };
  });
  await load('yaniv',3);
  await mutate(s=>{s.turn=0;s.players.forEach((p,i)=>{p.hand=[[0],[13],[10]][i];});});
  const heroes=await page.evaluate(()=>window.__club.room().session.state.players.slice(0,2).map(p=>p.hero));
  await page.getByRole('button',{name:'ヤニブ！',exact:true}).click();
  await page.waitForFunction(()=>window.declarationVoices.some(v=>v.event==='assaf'));
  const declarations=()=>page.evaluate(()=>window.declarationVoices.filter(v=>v.event==='yaniv'||v.event==='assaf'));
  assert.deepEqual(await declarations(),[
   {hero:heroes[0],event:'yaniv',played:true},{hero:heroes[1],event:'assaf',played:true},
  ]);
  await page.evaluate(()=>window.__club.room().session.publish());
  assert.equal((await declarations()).length,2);
  for(const [index,line] of ['yaniv','assaf'].entries()){
   assert(statuses.some(([path,status])=>path.endsWith('/'+heroes[index]+'/'+line+'.mp3')&&(status===206||status===200)),line);
  }
  console.log('PASS browser replays Yaniv and Assaf once, from both participants');
 }else if(process.argv.includes('--declarations')){
  await load('pokerbull',3);
  await mutate(s=>{
   s.players.forEach((p,i)=>p.hand=[[9,10],[11,12],[0,14]][i]);
   s.turn=2;
   window.engine.applyAction(s,2,{type:'bid',value:25}); // Pair of aces
  });
  const reveal=page.getByRole('region',{name:'公開された手札'});
  assert.equal(await reveal.count(),0);
  assert.deepEqual(await page.evaluate(()=>window.__club.room().last.view.players.slice(1).map(p=>p.hand)),[[],[]]);
  await page.getByRole('button',{name:'ダウト！',exact:true}).click();
  await reveal.waitFor();
  assert.match(await reveal.innerText(),/ワンペア A.*不成立/);
  assert.match(await reveal.locator('.cc-bull-best').innerText(),/ストレートフラッシュ A♣/);
  assert.deepEqual(await reveal.locator('article').evaluateAll(rows=>rows.map(row=>[...row.querySelectorAll('[data-card]')].map(c=>Number(c.dataset.card)))),[[9,10],[11,12],[0,14]]);
  assert.match(await reveal.locator('article').nth(2).innerText(),/CPU.*ライフ−1/);
  assert(await page.evaluate(()=>{const s=window.__club.room().session.state;return s.players.every((_,i)=>window.engine.viewFor(s,i).players.every((p,j)=>p.hand.join()===s.players[j].hand.join()));}));
  for(const [width,height] of [[390,844],[844,390]]){
   await page.setViewportSize({width,height});
   const next=await page.getByRole('button',{name:'次の配札へ',exact:true}).boundingBox();
   assert(next&&next.y>=0&&next.y+next.height<=height);
   await page.screenshot({path:`${dir}/pokerbull-reveal-${width}x${height}.png`});
  }
  await page.getByRole('button',{name:'次の配札へ',exact:true}).click();
  await reveal.waitFor({state:'detached'});
  await mutate(s=>{
   s.players[0].hand=[0];s.players[0].lives=1;
   s.players[1].hand=[13];s.players[2].hand=[];s.players[2].out=true;
   s.turn=1;window.engine.applyAction(s,1,{type:'bid',value:25});
  });
  await page.getByRole('button',{name:'ダウト！',exact:true}).click();
  await page.getByRole('button',{name:'別のゲームを選ぶ',exact:true}).waitFor();
  assert.match(await reveal.innerText(),/ワンペア A · 成立/);
  assert.match(await reveal.locator('article').nth(2).innerText(),/この配札には不参加/);

  await load('trumpcrew',4);
  const bids=page.locator('.cc-crew-bid');
  assert.deepEqual(await bids.allTextContents(),Array(4).fill('未宣言 · 獲得 0'));
  await page.getByRole('button',{name:'中位',exact:true}).click();
  await mutate(s=>{
   [0,1,0].forEach(value=>window.engine.applyAction(s,s.turn,{type:'bid',value}));
  });
  assert.deepEqual(await bids.allTextContents(),['未宣言 · 獲得 0','宣言 0 · 獲得 0','宣言 1 · 獲得 0','宣言 0 · 獲得 0']);
  await page.getByRole('button',{name:'宣言 0',exact:true}).click();
  assert.equal(await bids.first().innerText(),'宣言 0 · 獲得 0');
  await mutate(s=>{s.players.forEach(()=>window.engine.applyAction(s,s.turn,window.engine.legalActions(s)[0]));});
  assert.equal(await bids.filter({hasText:'獲得 1'}).count(),1);
  await page.setViewportSize({width:390,height:844});
  await snapshot(`${dir}/trumpcrew-bids-390x844.png`);
  await page.getByRole('button',{name:'次の配札へ',exact:true}).click();
  assert.deepEqual(await bids.allTextContents(),Array(4).fill('未宣言 · 獲得 0'));
  assert.deepEqual(errors,[]);
  console.log('PASS: Poker Bull reveal, exact challenge and strongest combination; Trump Crew human and CPU bids and trick wins');
 }else if(process.argv.includes('--polish')){
  await page.setViewportSize({width:390,height:844});await load('royalcassino',2);
  await mutate(s=>{s.turn=0;s.players[0].hand=[45];s.table=[47];s.extra.classic.rows=[];s.revision++;});await page.locator('.cc-hand [data-card="45"]').click();assert.equal(await page.getByRole('button',{name:'選んだ場札を獲得',exact:true}).count(),0);assert(await page.getByRole('button',{name:/場に置く/}).count());
  await mutate(s=>{s.turn=0;s.players[0].hand=[6,14];s.table=[19];s.players[0].score=0;s.revision++;});await page.locator('.cc-hand [data-card="6"]').click();await page.locator('.cc-table-cards [data-card="19"]').click();await page.getByRole('button',{name:'選んだ場札を獲得',exact:true}).click();await page.locator('[data-score-reward]').waitFor();assert.match(await page.locator('[data-score-reward]').first().innerText(),/スイープ.*1/);
  await load('mitch',4);await mutate(s=>{s.extra.classic.passes=2;s.extra.classic.rows[0]=[12,11,10,9];s.players[0].hand=Array.from({length:22},(_,i)=>i);s.revision++;});await page.waitForTimeout(200);assert.match(await page.locator('.cc-ace-counter').innerText(),/2\/3/);assert.equal(await page.locator('.cc-mitch-row').first().locator('.cc-card').count(),4);assert(await page.locator('.cc-hand.cc-auto-stack').count());await page.screenshot({path:dir+'/polish-mitch-portrait.png'});
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(150);await page.screenshot({path:dir+'/polish-mitch-landscape.png'});
  await load('daihinmin',4);await page.evaluate(()=>window.__club.room().rematch());await page.locator('.cc-local-rules').waitFor();await page.locator('.cc-local-rules select').selectOption('3');await page.locator('.cc-local-rules input').first().check();await page.getByRole('button',{name:'このメンバーで開始',exact:true}).click();await page.waitForFunction(()=>window.__club.room().session.state?.ladderOptions.rounds===3);assert(await page.evaluate(()=>window.__club.room().session.state.ladderOptions.eightCut));assert.deepEqual(errors,[]);console.log('PASS casino place/capture labels and score FX, Mitch ace counter, long-hand stacking, local-rule lobby and round settings.');
 }else if(process.argv.includes('--titles')){
  await page.setViewportSize({width:390,height:844});
  const playerCount=page.getByLabel('対応人数');
  const sort=page.getByLabel('並べ替え');
  const gameCards=page.locator('.cc-games > button');
  const gameSeats=()=>gameCards.evaluateAll(cards=>cards.map(card=>window.definition(card.dataset.gameId).players));
  await sort.selectOption('fewest');
  const fewest=(await gameSeats()).map(seats=>Math.min(...seats));
  assert.deepEqual(fewest,[...fewest].sort((a,b)=>a-b));
  await sort.selectOption('most');
  const most=(await gameSeats()).map(seats=>Math.max(...seats));
  assert.deepEqual(most,[...most].sort((a,b)=>b-a));
  await playerCount.selectOption('4');
  const matching=await gameSeats();
  assert(matching.length>0&&matching.length<implemented&&matching.every(seats=>seats.includes(4)));
  await page.screenshot({path:`${dir}/catalog-390x844.png`});
  await page.getByRole('searchbox').fill('gin rummy');
  assert.equal(await gameCards.count(),0);
  await page.getByRole('button',{name:'絞り込みを解除'}).click();
  assert.equal(await gameCards.count(),implemented);
  await playerCount.selectOption('4');
  await gameCards.first().click();
  assert.equal(await page.getByLabel('プレイ人数（空席はCPU）').inputValue(),'4');
  await page.locator('.cc-header button').first().click();await gameCards.first().waitFor();
  await page.locator('.cc-header button').first().click();await page.locator('.cc-heroes').waitFor();
  await page.locator('.cc-header button').first().click();await page.locator('.cc-title-copy').waitFor();
  for(const [width,height] of [[390,844],[844,390],[667,320]]){
   await page.setViewportSize({width,height});
   for(const [mode,entry] of [['host','部屋を作る'],['join','招待に参加する']]){
    await page.getByRole('button',{name:entry,exact:true}).click();
    const form=page.locator('.cc-online-entry');
    const header=await page.locator('.cc-header').boundingBox();
    const panel=await form.boundingBox();
    const submit=await form.locator('button[type=submit]').boundingBox();
    const spaceAbove=panel.y-header.y-header.height;
    const spaceBelow=height-panel.y-panel.height;
    await page.screenshot({path:`${dir}/${mode}-${width}x${height}.png`});
    assert(spaceAbove>=0&&Math.abs(spaceAbove-spaceBelow)<=28,`${mode} form is centered at ${width}×${height} (${spaceAbove}px above, ${spaceBelow}px below)`);
    assert(submit.y+submit.height<=height,'Submit is in view at '+width+'×'+height);
    await page.locator('.cc-header button').first().click();
   }
  }
  assert.deepEqual(errors,[]);console.log('PASS: title art, centered online entry, player-count filtering and sorting, and back navigation');
 }else if(process.argv.includes('--rummy-groups')){
  for(const game of ['ginrummy','rummy']){
   await load(game,2);await mutate(s=>{s.turn=0;s.extra.step=s.game==='ginrummy'?'ginDraw':'draw';s.players[0].hand=[0,1,2,13,14,15,26,27,28,35];});
   const before=await page.evaluate(()=>JSON.stringify(window.__club.room().session.state));
   for(const card of [0,1,2])await page.locator(`.cc-hand [data-card="${card}"]`).click();await page.getByRole('button',{name:'選択札を組にする',exact:true}).click();assert.equal(await page.locator('.cc-rummy-group').count(),1);assert.equal(await page.locator('.cc-rummy-group .cc-card').count(),3);
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__club.room().session.state)),before,'Grouping is private and does not publish a meld');
   await page.getByRole('button',{name:'ランク順',exact:true}).click();assert.equal(await page.locator('.cc-rummy-group .cc-card').count(),3);
   await mutate(s=>{s.players[0].hand.push(51);s.extra.step=s.game==='ginrummy'?'ginDiscard':'meld';});assert.equal(await page.locator('.cc-rummy-group .cc-card').count(),3,'Group survives a new draw');
   await page.getByRole('button',{name:'組を自動整理',exact:true}).click();assert(await page.locator('.cc-rummy-group').count()>=2);assert.equal(await page.locator('.cc-hand .cc-card').count(),11);
   for(const [width,height]of[[1280,900],[390,844],[844,390],[320,568],[568,320]]){await page.setViewportSize({width,height});for(const selector of ['.cc-rummy-tools','.cc-actions']){if(width>1000)await page.locator(selector).scrollIntoViewIfNeeded();const r=await page.locator(selector).boundingBox();assert(r.y>=0&&r.y+r.height<=height+1,JSON.stringify({game,width,height,selector,r}));assert(r.height>=44);}await snapshot(`${dir}/rummy-groups-${game}-${width}x${height}.png`);}
   const count=await page.locator('.cc-rummy-group').count();await page.getByRole('button',{name:'組を解除 1',exact:true}).click();assert.equal(await page.locator('.cc-rummy-group').count(),count-1);assert.equal(await page.locator('.cc-hand .cc-card').count(),11);
   await page.getByRole('button',{name:'組を自動整理',exact:true}).click();const removed=Number(await page.locator('.cc-rummy-group .cc-card').first().getAttribute('data-card'));await mutate((s,arg)=>{s.players[0].hand=s.players[0].hand.filter(c=>c!==arg);},removed);assert.equal(await page.locator('.cc-hand .cc-card').count(),10);assert.equal(await page.locator(`.cc-hand [data-card="${removed}"]`).count(),0);
   if(game==='rummy'){const held=await page.locator('.cc-hand .cc-card').count(),size=await page.locator('.cc-rummy-group').first().locator('.cc-card').count();await page.getByRole('button',{name:'組を選択 1',exact:true}).click();await page.getByRole('button',{name:/^組を公開:/}).first().click();await page.waitForFunction(n=>document.querySelectorAll('.cc-hand .cc-card').length===n,held-size);}

  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({games:2,manualGroups:true,automaticGroups:true,drawKeepsGroups:true,ungroup:true,removedCards:true,privateState:true,viewports:5,browserErrors:0}));
 }else if(process.argv.includes('--rule-audit')){
  await load('ginrummy',2);await mutate(s=>{s.turn=0;s.extra.step='ginDiscard';s.extra.classic.drawnFromDiscard=false;s.players[0].hand=[1,2,3,4,5,14,15,16,17,35,51];s.players[1].hand=[0,6,7,8,13,19,20,21,26,39];});
  assert.equal(await page.locator('.cc-gin-reveal').count(),0,'Opponent stays private before the knock');
  await page.locator('.cc-hand [data-card="51"]').click();assert.match(await page.locator('.cc-classic').innerText(),/選択札を捨てた後: 10/);
  const knock=page.getByRole('button',{name:/ノックして捨てる.*未組合せ点: 10/});assert.equal(await knock.count(),1);await knock.click();await page.locator('.cc-gin-reveal').waitFor();assert.equal(await page.locator('.cc-gin-reveal article').count(),2);
  assert.match(await page.locator('.cc-gin-reveal article').first().innerText(),/未組合せ点: 10/);assert(await page.locator('.cc-gin-reveal .cc-card').count()===20);
  for(const [width,height]of[[1280,900],[390,844],[844,390],[320,568],[568,320]]){await page.setViewportSize({width,height});assert(await page.locator('.cc-classic').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await snapshot(`${dir}/gin-audit-${width}x${height}.png`);}
  assert.deepEqual(errors,[]);console.log(JSON.stringify({ginDiscardPreview:true,knockScore:true,revealedMelds:true,privateBeforeKnock:true,viewports:5,browserErrors:0}));
 }else if(process.argv.includes('--hand-sort')){
  await load('doubt',4);await mutate(s=>{s.turn=0;s.players[0].hand=[40,12,0,14,39,25,52];});
  const hand=()=>page.locator('.cc-hand>.cc-card').evaluateAll(es=>es.map(e=>Number(e.dataset.card)));
  await page.locator('.cc-hand [data-card="14"]').click();
  const before=await page.evaluate(()=>JSON.stringify(window.__club.room().session.state));
  await page.getByRole('button',{name:'スート順',exact:true}).click();assert.deepEqual(await hand(),[0,12,14,25,39,40,52]);
  assert.equal(await page.locator('.cc-hand [data-card="14"]').getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'ランク順',exact:true}).click();assert.deepEqual(await hand(),[0,39,14,40,12,25,52]);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__club.room().session.state)),before,'Sorting must not mutate game state');
  for(const [width,height]of[[1280,900],[390,844],[844,390],[320,568],[568,320]]){
   await page.setViewportSize({width,height});for(const b of await page.locator('.cc-hand-sort button').all()){const r=await b.boundingBox();assert(r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height,JSON.stringify({width,height,r}));assert(r.height>=44);}
   await snapshot(`${dir}/hand-sort-${width}x${height}.png`);
  }
  await page.evaluate(()=>window.__club.room().session.publish());assert.deepEqual(await hand(),[0,39,14,40,12,25,52]);
  await load('daihinmin',5);await mutate(s=>{s.turn=0;s.players[0].hand=[0,1,2,12,52];});
  assert.deepEqual(await hand(),[2,12,0,1,52]);await mutate(s=>{s.ladder.reversed=true;});assert.deepEqual(await hand(),[1,0,12,2,52],'Re-sort automatically after revolution');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({handSorting:true,suit:true,rank:true,jokerLast:true,selectionPreserved:true,stateUnchanged:true,viewports:5,browserErrors:0}));
 }else if(process.argv.includes('--voices')){
  await page.evaluate(()=>{window.voiceEvents=[];const original=window.audioService.playCardClubVoice.bind(window.audioService);window.audioService.playCardClubVoice=(hero,event)=>{window.voiceEvents.push({hero,event});return original(hero,event);};});
  const metadata=await page.evaluate(async()=>{
   const heroes=window.CARD_CLUB_VOICE_HEROES,durations=window.CARD_CLUB_VOICE_MS;let clips=0;
   for(const hero of heroes)for(const event of ['start','play','win','lose']){
    const seconds=await new Promise((resolve,reject)=>{const a=new Audio('/sfx/card-club-voices/'+hero+'/'+event+'.ogg');a.preload='metadata';a.onloadedmetadata=()=>{const d=a.duration;a.removeAttribute('src');a.load();resolve(d);};a.onerror=()=>reject(Error(hero+'/'+event));});
    if(Math.abs(seconds*1000-durations[hero+'/'+event])>90)throw Error('Duration mismatch '+hero+'/'+event);clips++;
   }return {heroes:heroes.length,clips};
  });assert.equal(metadata.heroes,26);assert.equal(metadata.clips,104);
  await page.evaluate(()=>window.audioService.setSfxVolume(0));await page.evaluate(()=>window.audioService.setVoiceVolume(.35));await load('rollingstone',3);await mutate(s=>{s.turn=0;s.trick=[];});
  await page.waitForFunction(()=>[...window.audioService.activeHtmlSfx.entries()].some(([name,audios])=>name.startsWith('card-club-voice-')&&[...audios].some(a=>!a.paused)));
  assert(await page.evaluate(()=>[...window.audioService.activeHtmlSfx.values()].flatMap(a=>[...a]).every(a=>Math.abs(a.volume-.35)<.01)),'Voices use the independent voice volume even with SE muted');
  const count=await page.evaluate(()=>window.voiceEvents.length);await page.evaluate(()=>window.__club.room().session.publish());await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));assert.equal(await page.evaluate(()=>window.voiceEvents.length),count);
  await page.clock.install({time:new Date()});
  await page.clock.fastForward(15000);
  await page.evaluate(()=>window.audioService.stopCardClubVoices());
  for(let t=0;t<4;t++){
   await mutate(s=>{s.turn=1;s.revision++;});await mutate(s=>{s.turn=0;s.revision++;});
  }
  assert(!await page.evaluate(()=>window.voiceEvents.some(v=>v.event==='turn')));
  await mutate(s=>{s.turn=1;s.revision++;});await mutate(s=>{s.turn=0;s.revision++;});
  await page.waitForFunction(()=>window.voiceEvents.some(v=>v.event==='turn'));
  assert.equal(await page.evaluate(()=>window.voiceEvents.filter(v=>v.event==='turn').length),1);
  assert(!await page.evaluate(()=>window.voiceEvents.some(v=>v.event==='play')));
  await mutate(s=>{s.phase='result';s.resultReason='score';s.winners=[0];s.revision++;});await page.waitForFunction(()=>window.voiceEvents.some(v=>v.event==='win'));
  await mutate(s=>{s.phase='play';s.revision++;});await mutate(s=>{s.phase='result';s.resultReason='score';s.winners=[1];s.revision++;});await page.waitForFunction(()=>window.voiceEvents.some(v=>v.event==='lose'));
  await page.evaluate(()=>window.audioService.setVoiceVolume(0));assert.equal(await page.evaluate(()=>[...window.audioService.activeHtmlSfx.keys()].filter(n=>n.startsWith('card-club-voice-')).length),0);assert.equal(await page.evaluate(()=>window.audioService.playCardClubVoice('magic-akari','start')),false);
  await page.evaluate(()=>window.audioService.setVoiceVolume(.8));await page.evaluate(()=>{void window.audioService.playCardClubVoice('magic-akari','start');});await page.waitForFunction(()=>[...window.audioService.activeHtmlSfx.keys()].some(n=>n.startsWith('card-club-voice-')));await page.evaluate(()=>window.audioService.toggleMute());assert.equal(await page.evaluate(()=>[...window.audioService.activeHtmlSfx.keys()].filter(n=>n.startsWith('card-club-voice-')).length),0);await page.evaluate(()=>window.audioService.toggleMute());
  await page.getByRole('button',{name:'クラブに戻る',exact:true}).click();assert.equal(await page.evaluate(()=>[...window.audioService.activeHtmlSfx.keys()].filter(n=>n.startsWith('card-club-voice-')).length),0);
  for(const [hero,voicePart] of [['high-school-warrior','/high-school-voices/WARRIOR/finish-'],['magic-akari','/magic-voices/AKARI/attack-']]){
   await load('royalcassino',2);
   await mutate((s,arg)=>{s.turn=0;s.players[0].hero=arg;s.players[0].hand=[6,14];s.table=[19];s.players[0].score=0;s.revision++;},hero);
   await page.locator('.cc-hand [data-card="6"]').click();
   await page.locator('.cc-table-cards [data-card="19"]').click();
   await page.getByRole('button',{name:'選んだ場札を獲得',exact:true}).click();
   await page.waitForFunction(path=>[...window.audioService.activeHtmlSfx.entries()].some(([name,audios])=>name.includes('-score-')&&[...audios].some(audio=>audio.src.includes(path)&&!audio.paused)),voicePart);
   assert.match(await page.locator('[data-score-reward]').first().innerText(),/スイープ.*1/);
  }

  assert.deepEqual(errors,[]);console.log(JSON.stringify({voices:true,...metadata,start:true,occasionalTurn:true,win:true,lose:true,independentVoiceVolume:true,mute:true,zeroVoiceVolume:true,leaveStops:true,deduplicated:true,browserErrors:errors.length}));
 }else if(process.argv.includes('--effects')){
  await page.evaluate(()=>{
   const audio=window.audioService;audio.init();window.cardCues=[];window.audioStarts=[];
   const play=audio.playCardClubSound.bind(audio);audio.playCardClubSound=kind=>{window.cardCues.push(kind);play(kind);};
   const ctx=audio.ctx,create=ctx.createBufferSource.bind(ctx);ctx.createBufferSource=()=>{const source=create(),start=source.start.bind(source);source.start=(...args)=>{window.audioStarts.push(args[0]);start(...args);};return source;};
  });
  await page.setViewportSize({width:390,height:844});await load('memory');await mutate(s=>{s.turn=0;});
  const memory=page.locator('.cc-memory-board .cc-card');assert.equal(await memory.first().getAttribute('data-card'),'-1');
  await memory.first().click();await page.waitForFunction(()=>Number(document.querySelector('.cc-memory-board .cc-card').dataset.card)>=0);
  assert.equal(await memory.first().locator('.cc-card-body').evaluate(e=>getComputedStyle(e).transitionDuration),'0.28s');
  assert((await page.evaluate(()=>window.cardCues)).includes('flip'));await page.screenshot({path:`${dir}/effects-flip-portrait.png`});
  const other=await page.evaluate(()=>{const s=window.__club.room().session.state;return s.extra.board.findIndex((c,i)=>i>0&&c%13!==s.extra.board[0]%13);});await memory.nth(other).click();await page.getByRole('button',{name:'確認したので裏返して次の人へ',exact:true}).click();assert.equal(await memory.first().getAttribute('data-card'),'-1');
  await load('war',2);await mutate(s=>{s.turn=0;});await page.getByRole('button',{name:'カードをめくる',exact:true}).click();assert(await page.locator('[data-club-play-seat="0"] .cc-card-body').evaluate(e=>e.getAnimations().length>0),'A newly mounted blind reveal flips');
  // Actual legal play stays immediate while a pointer-transparent card flies to the table.
  await load('rollingstone',3);await mutate(s=>{s.turn=0;s.trick=[];});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const lastCard=page.locator('.cc-hand .cc-card').last();await lastCard.scrollIntoViewIfNeeded();await lastCard.click();
  await page.evaluate(()=>{window.playRevision=window.__club.room().session.state.revision;document.querySelector('.cc-actions>button').click();});
  await page.waitForFunction(()=>window.__club.room().session.state.revision>window.playRevision);
  assert(await page.locator('.cc-flight-layer').count());assert.equal(await page.locator('.cc-flight-layer').last().evaluate(e=>getComputedStyle(e).pointerEvents),'none');
  await page.screenshot({path:`${dir}/effects-play-portrait.png`});
  await page.waitForFunction(()=>document.querySelectorAll('.cc-flight-layer').length===0);
  const cues=await page.evaluate(()=>window.cardCues.length);await page.evaluate(()=>window.__club.room().session.publish());await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));assert.equal(await page.evaluate(()=>window.cardCues.length),cues,'Identical publication does not replay cues');
  await page.setViewportSize({width:844,height:390});await load('sergent');await page.screenshot({path:`${dir}/effects-hand-landscape.png`});
  assert(await page.locator('.cc-player-ring .table-hand-count').count());assert(await page.locator('.cc-stock-stack').count());
  await load('doubt',4);await mutate(s=>{s.turn=0;});await page.evaluate(()=>{const session=window.__club.room().session,s=session.state;session.command(s.players[0].id,{type:'play',cards:[s.players[0].hand[0]]},s.revision);});
  await page.waitForFunction(()=>!!document.querySelector('.cc-flight-layer .cc-flying-back'));assert(await page.locator('.cc-table-cards .cc-card').evaluateAll(es=>es.every(e=>e.dataset.card==='-1'&&!e.querySelector('.cc-card-front').textContent)),'Bluff plays stay face down');
  await page.waitForFunction(()=>document.querySelectorAll('.cc-flight-layer').length===0);
  // Reduced motion removes flights and flip transitions without changing legal input.
  await page.emulateMedia({reducedMotion:'reduce'});await load('golf');await mutate(s=>{s.turn=0;});await page.locator('.cc-golf-grid').first().getByRole('button').first().click();
  assert.equal(await page.locator('.cc-flight-layer').count(),0);assert.equal(await page.locator('.cc-card-body').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  await page.emulateMedia({reducedMotion:'no-preference'});
  const sound=await page.evaluate(async()=>{
   const audio=window.audioService;audio.setSfxVolume(.6);const kinds=['shuffle','deal','play','flip','draw','collect','select'];
   const start=window.audioStarts.length;for(const kind of kinds)audio.playCardClubSound(kind);const generated=window.audioStarts.length-start;
   const volume=audio.getSfxVolume();audio.setSfxVolume(0);const silent=window.audioStarts.length;audio.playCardClubSound('shuffle');if(window.audioStarts.length!==silent)throw Error('Zero volume generated paper sound');audio.setSfxVolume(volume);
   audio.toggleMute();audio.playCardClubSound('play');if(window.audioStarts.length!==silent)throw Error('Mute generated paper sound');audio.toggleMute();
   const dest=audio.ctx.createMediaStreamDestination();audio.sfxGain.connect(dest);const recorder=new MediaRecorder(dest.stream),chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);const done=new Promise(resolve=>recorder.onstop=resolve);recorder.start();
   for(const kind of kinds){audio.playCardClubSound(kind);await new Promise(r=>setTimeout(r,460));}
   recorder.stop();await done;audio.sfxGain.disconnect(dest);dest.stream.getTracks().forEach(track=>track.stop());
   const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());return {kinds,generated,mute:true,zeroVolume:true,recording: btoa(Array.from(bytes,c=>String.fromCharCode(c)).join(''))};
  });
  assert(sound.generated>=17);await fs.writeFile(`${dir}/paper-sounds.webm`,Buffer.from(sound.recording,'base64'));
  assert.deepEqual(errors,[]);console.log(JSON.stringify({effects:true,flip:true,blindQueueFlip:true,faceDownAgain:true,playFlight:true,blindPlay:true,immediateAction:true,deduplicated:true,reducedMotion:true,soundKinds:sound.kinds,sources:sound.generated,mute:sound.mute,zeroVolume:sound.zeroVolume,browserErrors:errors.length}));
 }else if(process.env.CLUB_LANDSCAPE==='1'||process.argv.includes('--landscape')||process.argv.includes('--responsive')){
  let cases=0;const snapshots=['memory','fantan','ginrummy','golf','pokerbull','trumpcrew','sergent','chinesewhist','shithead2','sedmice','truc','petrangola','speculation'];
  const sizes=[{width:568,height:320},{width:667,height:375},{width:844,height:390},...process.argv.includes('--responsive')?[{width:320,height:568},{width:360,height:640},{width:390,height:844}]:[]];
  for(const size of sizes){
   await page.setViewportSize(size);
   for(const game of await page.evaluate(()=>window.games))for(const count of [...new Set([game.players[0],game.players.at(-1)])]){
    await load(game.id,count);await page.evaluate(()=>{const session=window.__club.room().session,s=session.state;for(let i=0;i<80&&s.turn!==0&&!['round','result'].includes(s.phase);i++){const a=window.engine.cpuAction(window.engine.viewFor(s,s.turn));if(!a||!window.engine.applyAction(s,s.turn,a))break;}session.publish();});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const bounds=await page.evaluate(()=>{const root=document.querySelector('.card-club'),board=document.querySelector('.cc-playfield'),hand=document.querySelector('.cc-hand-area'),actions=document.querySelector('.cc-actions');const inside=e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;};return {root:root.scrollWidth<=root.clientWidth+1&&root.scrollHeight<=root.clientHeight+1,board:inside(board),hand:!hand||inside(hand),actions:!actions?.childElementCount||inside(actions)&&actions.clientHeight>=44};});assert(Object.values(bounds).every(Boolean),`${game.id}/${count} ${size.width}x${size.height}: ${JSON.stringify(bounds)}`);cases++;
    const counts=await page.evaluate(()=>{
     const expected=window.__club.room().last.view.players.map(player=>player.handCount);
     const shown=[...document.querySelectorAll('.cc-player-ring .table-hand-count')].map(badge=>{
      const box=badge.getBoundingClientRect();
      const seat=badge.closest('article').getBoundingClientRect();
      const visible=box.width>0&&box.height>0&&box.left>=seat.left-1&&box.right<=seat.right+1&&
       box.top>=seat.top-1&&box.bottom<=seat.bottom+1&&box.right<=innerWidth+1&&box.bottom<=innerHeight+1;
      return visible?parseInt(badge.textContent,10):null;
     });
     return {shown,expected};
    });
    assert.deepEqual(counts.shown,counts.expected,`${game.id}/${count} ${size.width}×${size.height}: visible hand counts`);
    const memoryBoard=page.locator('.cc-memory-board');
    if(game.id==='memory'&&await memoryBoard.count()){
     assert(await memoryBoard.evaluate(board=>{
      const pane=board.closest('.cc-board-content').getBoundingClientRect();
      return [...board.children].every(slot=>{
       const r=slot.getBoundingClientRect();
       return r.width>0&&r.height>0&&r.left>=pane.left-1&&r.right<=pane.right+1&&r.bottom<=pane.bottom+1;
      });
     }),`All memory slots are visible at ${size.width}×${size.height}`);
    }
    if(count===game.players.at(-1)&&snapshots.includes(game.id))await snapshot(`${dir}/fit-${game.id}-${size.width}.png`);
   }
   await load('whist');await mutate(s=>{s.phase='round';s.turn=0;});const next=page.getByRole('button',{name:'次の配札へ',exact:true});assert(await next.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'Deal progression stays inside screen');await next.click();await page.waitForFunction(()=>window.__club.room().session.state.phase==='play');
   await page.getByRole('button',{name:'遊び方',exact:true}).click();assert(await page.locator('.cc-modal .cc-panel').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));await page.getByRole('button',{name:/閉じる/}).click();
   await load('rantergo',8);await page.evaluate(()=>window.__club.room().finish());await page.locator('.cc-result-actions').waitFor();assert(await page.locator('.cc-result-actions').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'Final result actions stay inside screen');await snapshot(`${dir}/fit-results-${size.width}.png`);
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({responsiveCases:cases,games:await page.evaluate(()=>window.games.length),sizes:sizes.length,viewportFit:true,resultControls:true,ruleModal:true,browserErrors:errors.length}));
 }else{
 // Previously added popular games and the new world games open a real playable state with a specialized controller.
 for(const game of await page.evaluate(()=>window.popular)){await load(game);assert(await page.locator('.cc-classic').count());assert(await page.locator('.cc-compact-title h1').innerText());}
 await load('golf',2);await mutate(s=>{s.turn=0;});const initial=await page.evaluate(()=>window.__club.room().session.state.revision);await page.locator('.cc-golf-grid').first().getByRole('button').nth(0).click();await page.waitForFunction(r=>window.__club.room().session.state.revision>r,initial);assert.equal(await page.locator('.cc-golf-grid').first().getByRole('button').nth(0).getAttribute('disabled'),'');
 await load('cribbage');await mutate(s=>{s.turn=0;});const hand=page.locator('.cc-hand .cc-card');await hand.nth(0).click();await hand.nth(1).click();assert.equal(await page.locator('.cc-hand .cc-selected').count(),2);assert.equal(await page.locator('.cc-actions button').count(),1);await page.locator('.cc-actions button').click();await page.waitForFunction(()=>window.__club.room().session.state.extra.classic.crib.length===2);assert.equal(await page.locator('.cc-classic .cc-public-hand .cc-back').count(),2);
 await load('cassino');await mutate(s=>{s.turn=0;s.players[0].hand=[4,6,19];s.table=[1,2,17];s.extra.classic.rows=[];});await page.locator('.cc-hand .cc-card').nth(0).click();for(let i=0;i<3;i++)await page.locator('.cc-table-cards .cc-card').nth(i).click();await page.getByRole('button',{name:'選んだ場札を獲得',exact:true}).click();await page.waitForFunction(()=>window.__club.room().session.state.players[0].taken.length===4);
 await load('cassino');await mutate(s=>{s.turn=0;s.players[0].hand=[3,6,19];s.table=[2];s.extra.classic.rows=[];});await page.locator('.cc-hand .cc-card').nth(0).click();await page.locator('.cc-table-cards .cc-card').click();await page.getByRole('button',{name:'選択札でビルド → 7',exact:true}).click();await page.waitForFunction(()=>window.__club.room().session.state.extra.classic.rows.length===1);assert.equal(await page.locator('.cc-builds article').count(),1);
 // Exercise new controls through the actual DOM, not only engine calls.
 await load('66');await mutate(s=>{s.turn=0;s.trump=0;s.players[0].hand=[11,12,9,8,10,0];s.extra.points=[0,0];});await page.getByRole('button',{name:'マリッジを宣言してリード: ♣Q',exact:true}).click();await page.waitForFunction(()=>window.__club.room().session.state.extra.classic.pendingMarriage[0]===40);assert.equal(await page.locator('.cc-declarations .cc-card').count(),2);
 await load('blacklady');await mutate(s=>{s.turn=0;});await page.locator('.cc-hand .cc-card').nth(0).click();await page.locator('.cc-hand .cc-card').nth(1).click();assert.equal(await page.locator('.cc-hand .cc-selected').count(),2);assert.equal(await page.locator('.cc-actions>button').count(),1);await page.locator('.cc-actions>button').click();await page.waitForFunction(()=>window.__club.room().session.state.extra.selections[0].length===2);
 await load('sergent');await mutate(s=>{s.turn=0;s.extra.step='sergentDiscard';s.trump=0;});for(let i=0;i<4;i++)await page.locator('.cc-hand .cc-card').nth(i).click({position:{x:12,y:18}});assert.equal(await page.locator('.cc-actions>button').count(),1);await page.locator('.cc-actions>button').click();await page.waitForFunction(()=>window.__club.room().session.state.extra.step==='play');
 await load('shithead2',2);await mutate(s=>{s.turn=0;});const oldExposed=await page.evaluate(()=>window.__club.room().session.state.extra.classic.rows[0][0]);await page.locator('.cc-hand .cc-card').nth(0).click();await page.locator('.cc-palace-layouts article').first().locator('.cc-public-hand').first().getByRole('button').first().click();assert(await page.evaluate(card=>window.__club.room().session.state.players[0].hand.includes(card),oldExposed));await page.getByRole('button',{name:'準備完了',exact:true}).click();
 await mutate(s=>{s.turn=0;s.extra.step='play';s.stock=[];s.players[0].hand=[];s.extra.classic.rows[0]=[];s.extra.classic.hidden[0]=[2];s.table=[0];});await page.locator('.cc-palace-layouts article').first().locator('.cc-back:enabled').click();await page.waitForFunction(()=>window.__club.room().session.state.players[0].hand.length===2);assert.equal(await page.locator('.cc-hand .cc-card').count(),2);
 await load('ecarte');await mutate(s=>{s.turn=0;s.dealer=1;});await page.getByRole('button',{name:'交換を提案',exact:true}).click();assert(await page.evaluate(()=>window.__club.room().session.state.extra.step==='ecarteReply'));
 await load('allfour');await mutate(s=>{s.dealer=1;s.turn=0;});await page.getByRole('button',{name:'ベッグして親へ',exact:true}).click();await page.waitForFunction(()=>window.__club.room().session.state.extra.step==='allFourReply');
 await load('sedmice',2);await mutate(s=>{s.turn=0;s.players[0].hand=[8,21,6];s.players[1].hand=[34,7,9];});await page.locator('.cc-actions').getByRole('button',{name:'♣9',exact:true}).click();await mutate(s=>{window.engine.applyAction(s,1,{type:'play',cards:[34]});});await page.getByRole('button',{name:'追撃せず場を渡す',exact:true}).waitFor();await page.locator('.cc-actions').getByRole('button',{name:'♣7',exact:true}).click();await page.waitForFunction(()=>window.__club.room().session.state.trick[0]?.card===6);
 await load('truc');await mutate(s=>{s.dealer=1;s.turn=0;});await page.getByRole('button',{name:'この手札で開始',exact:true}).click();await page.getByRole('button',{name:'点数引上げ → 2',exact:true}).click();await page.waitForFunction(()=>window.__club.room().session.state.extra.classic.bids[0]===2);
 await load('guessit');await mutate(s=>{s.turn=0;});await page.getByRole('button',{name:'相手に質問: A',exact:true}).click();await page.waitForFunction(()=>window.__club.room().session.state.extra.classic.notes.length===1);assert.equal(await page.locator('.cc-answers p').count(),1);
 await load('petrangola');assert.equal(await page.locator('.cc-hand .cc-card').count(),0);await page.getByRole('button',{name:'元の手札を保持',exact:true}).click();await page.waitForFunction(()=>window.__club.room().session.state.extra.step==='petrTurn');assert.equal(await page.locator('.cc-hand .cc-card').count(),3);
 await load('speculation');await page.getByRole('button',{name:'公開札の最低価格: 1',exact:true}).click();await page.waitForFunction(()=>window.__club.room().session.state.extra.step==='specAuction');assert.equal(await page.locator('.cc-hand .cc-card').count(),0);
 await load('suitmatch');await mutate(s=>{s.turn=0;s.extra.classic.first=0;s.extra.classic.last=1;});await page.locator('.cc-actions>button').first().click();await page.waitForFunction(()=>window.__club.room().session.state.extra.step==='suitReply');
 await load('reddog');await mutate(s=>{s.turn=0;});await page.getByRole('button',{name:'宣言して公開: 1',exact:true}).click();await page.waitForFunction(()=>window.__club.room().session.state.extra.classic.reveals.length>=1);
 for(const size of [{width:390,height:844},{width:844,height:390},{width:1280,height:900}]){
  await page.setViewportSize(size);
  for(const game of ['golf','chinesewhist','durak2','cribbage','cassino','pontoon','66','sergent','blacklady','shithead2','pitch','sedmice','truc','guessit','speculation','suitmatch','petrangola','reddog']){
   await load(game);assert.equal(await page.locator('.card-club').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true,`${game} overflow ${size.width}`);
   await snapshot(`${dir}/${game}-${size.width}.png`);
  }
 }
 await page.evaluate(()=>localStorage.setItem('card-club-name','QA Player'));await page.goto('http://127.0.0.1:5243/__club?lang=ENGLISH');await page.waitForFunction(()=>!!window.__club);await load('66');assert.equal(await page.locator('.cc-classic').evaluate(e=>/[一-龯ぁ-んァ-ヶ]/.test(e.textContent)),false);await page.screenshot({path:`${dir}/cribbage-english.png`});for(const id of ['guessit','speculation','suitmatch','petrangola','reddog']){await load(id);assert.equal(await page.locator('.cc-classic').evaluate(e=>/[一-龯ぁ-んァ-ヶ]/.test(e.textContent)),false,id+' English board');}
 await page.goto('http://127.0.0.1:5243/__club?lang=HIRAGANA');await page.waitForFunction(()=>!!window.__club);await load('shithead2');const hira=await page.locator('.cc-classic').innerText();assert.equal(/[一-龯]/.test(hira),false,'Hiragana board has no kanji');await fs.writeFile(`${dir}/hiragana-visible.txt`,hira);await page.screenshot({path:`${dir}/golf-hiragana.png`});for(const id of ['guessit','speculation','suitmatch','petrangola','reddog']){await load(id);assert.equal(await page.locator('.cc-classic').evaluate(e=>/[一-龯]/.test(e.textContent)),false,id+' hiragana board');}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({games:await page.evaluate(()=>window.popular.length),viewports:3,screenshots:56,availableOnly:true,diversityControls:true,raises:true,sevenRetry:true,marriage:true,secretPass:true,kittyExchange:true,palace:true,cribDiscard:true,capture:true,build:true,golfReveal:true,english:true,browserErrors:errors.length,hiraganaRemainingKanji:/[一-龯]/.test(hira)}));
 }
 }
}finally{await browser?.close();await server?.close();signaling?.kill();turn?.stop();await fs.rm(file,{force:true});}
