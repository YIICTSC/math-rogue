import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const port=Number(process.env.RPG_QA_SERVER_PORT || 10135);
const origin=`http://127.0.0.1:${port}`;
const fixture=`.rpg-shared-fixture-${process.pid}.tsx`;
const processServer=spawn(process.execPath,['server/dist/index.mjs'],{
  env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe'],
});
processServer.stderr.on('data',data=>console.error(String(data)));
const errors=[];
let browser,vite,host,guest;
try {
  let listening=false;
  for(let attempt=0;attempt<80&&!listening;attempt++) {
    listening=await fetch(`${origin}/health`).then(response=>response.ok,()=>false);
    if(!listening) await pause(100);
  }
  assert(listening,'Build the dedicated server before running this browser test.');
  process.env.VITE_ONLINE_SERVER_URL=origin;
  await fs.writeFile(fixture,`
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import './src/styles.css';
    import RpgOnline from './src/rpg/RpgOnline';
    import {WIDTH} from './src/rpg/engine';
    import {blockAt,playerHeight,protectedVoxel} from './src/rpg/voxel';
    const joining=new URLSearchParams(location.search).has('rpgRoom');
    const player={id:'WARRIOR',currentHp:72,maxHp:72,gold:100,deck:[],relics:[],imageData:''};
    localStorage.setItem('rpg-preferences-v1',JSON.stringify({mapView:'2D',mapQuality:'low'}));
    window.findBuildCell=()=>{
      const {world:w,selfId}=window.snapshot,p=w.players[selfId];
      const y=Math.floor(playerHeight(w,p));
      for(const [dx,dz]of [[0,-1],[1,0],[0,1],[-1,0],[1,-1],[-1,-1],[1,1],[-1,1],[0,-2],[2,0],[0,2],[-2,0]]){
        const x=p.x+dx,z=p.y+dz;
        if(w.tiles[z*WIDTH+x]==='road'&&!protectedVoxel(w,x,z)&&!blockAt(w,x,y,z)&&blockAt(w,x,y-1,z)&&
          !Object.values(w.players).some(other=>other.x===x&&other.y===z))return {x,y,z,dx,dz};
      }
    };
    createRoot(document.getElementById('root')).render(<RpgOnline initialIntent={joining?'join':'online'}
      autoJoinInvite={joining} active player={player} languageMode="JAPANESE" onRoom={room=>window.room=room}
      onSnapshot={snapshot=>window.snapshot=snapshot} onSetup={()=>{}} onClose={()=>{}} />);
  `);
  vite=await createServer({cacheDir:'node_modules/.vite-rpg-machinery-test',
    optimizeDeps:{noDiscovery:true,entries:[],include:['react','react-dom','react-dom/client','react/jsx-runtime','peerjs','three']},
    server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error',plugins:[{
      name:'rpg-shared-browser-test',configureServer(s){
        s.middlewares.use('/__shared',async(req,res)=>{
          res.setHeader('Content-Type','text/html');
          res.end(await s.transformIndexHtml(req.originalUrl||req.url,
            '<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root"></div><script type="module" src="/'+fixture+'"></script></body></html>'));
        });
      },
    }],
  });
  await vite.listen();
  const url=`http://127.0.0.1:${vite.httpServer.address().port}/__shared`;
  browser=await chromium.launch({headless:true,executablePath:process.env.RPG_QA_BROWSER,
    args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});
  host=await browser.newPage({viewport:{width:1024,height:640}});
  guest=await browser.newPage({viewport:{width:1024,height:640}});
  for(const page of [host,guest]) {
    page.setDefaultTimeout(45_000);
    page.on('pageerror',error=>errors.push(error.message));
    page.on('websocket',ws=>ws.on('socketerror',error=>errors.push(error)));
  }
  await host.goto(url,{waitUntil:'domcontentloaded'});
  await host.getByLabel('冒険者の名前').fill('工房の冒険者');
  await host.getByRole('button',{name:'サーバー通信 · beta',exact:true}).click();
  await host.getByRole('button',{name:'オンラインの部屋を作る',exact:true}).click();
  const code=(await host.locator('.rpg-waiting-invite .rpg-room-code').textContent()).trim();
  assert(code);
  await guest.goto(`${url}?rpgRoom=${encodeURIComponent(code)}`,{waitUntil:'domcontentloaded'});
  await guest.getByLabel('参加名').fill('鉄道員');
  await guest.getByRole('button',{name:'参加する',exact:true}).click();
  await host.locator('.rpg-waiting-roster').getByText('鉄道員',{exact:true}).waitFor();
  await host.getByRole('button',{name:'ゲーム開始',exact:true}).click();
  await guest.locator('.rpg-canvas').waitFor();
  await guest.getByRole('button',{name:'2D / 3D'}).click();
  await guest.getByTestId('rpg-world-3d').waitFor();

  const cell=await host.evaluate(()=>window.findBuildCell());
  assert(cell,'An unoccupied road tile can be built on from the starting square.');
  const key=`${cell.x},${cell.y},${cell.z}`;
  for(const [recipe,item,count] of [['plank','plank',4],['stick','stick',4],['crystal_lever','crystal_lever',1]]) {
    await host.evaluate(recipe=>window.room.send({type:'voxel-craft',recipe,amount:1}),recipe);
    await host.waitForFunction(({item,count})=>window.snapshot.world.players[window.snapshot.selfId].life.bag[item]>=count,{item,count});
    await host.waitForFunction(()=>Date.now()-window.snapshot.world.players[window.snapshot.selfId].life.workshopAt>240);
  }
  await host.getByRole('button',{name:'高さ断面'}).click();
  const canvas=host.locator('.rpg-canvas');
  for(let i=0;i<Math.abs(cell.dx);i++) await canvas.press(cell.dx>0?'ArrowRight':'ArrowLeft');
  for(let i=0;i<Math.abs(cell.dz);i++) await canvas.press(cell.dz>0?'ArrowDown':'ArrowUp');
  await host.getByRole('button',{name:'建築工房',exact:true}).click();
  await host.locator('[data-material="crystal_lever"]').getByRole('button',{name:'レバー',exact:true}).click();
  await host.locator('.rpg-selection-detail').getByRole('button',{name:'登録'}).click();
  await host.getByRole('button',{name:'置く'}).click();
  await guest.waitForFunction(key=>window.snapshot?.world.voxels?.edits[key]==='crystal_lever',key);
  await guest.getByRole('button',{name:'カメラ切替',exact:true}).click();
  await guest.getByRole('button',{name:'マウス視点',exact:true}).click();
  await guest.waitForFunction(()=>document.pointerLockElement?.dataset.eyeHeight);
  await guest.evaluate(cell=>{
    const camera=document.pointerLockElement;
    const {world,selfId}=window.snapshot;
    const p=world.players[selfId],feet=p.position3D?.y??0;
    const dx=cell.x+.5-(p.position3D?.x??p.x+.5),dz=cell.z+.5-(p.position3D?.z??p.y+.5);
    const facing=Number(camera.dataset.facing),pitch=Number(camera.dataset.pitch),eye=Number(camera.dataset.eyeHeight);
    const yaw=Math.atan2(dx,-dz)*2/Math.PI;
    const yawDelta=((yaw-facing+6)%4)-2;
    const pitchGoal=Math.atan2(cell.y+.32-feet-eye,Math.hypot(dx,dz));
    document.dispatchEvent(new MouseEvent('mousemove',{movementX:-yawDelta/.004,movementY:-(pitchGoal-pitch)/.006}));
  },cell);
  await guest.waitForFunction(()=>document.querySelector('.rpg-voxel-target')?.textContent?.includes('レバー'));
  await guest.keyboard.press('Escape');
  await guest.waitForFunction(()=>!document.pointerLockElement);
  await guest.locator('.rpg-voxel-dock').getByRole('button',{name:/調べる/}).click();
  await guest.locator('.rpg-3d-device-panel').getByRole('button',{name:'起動',exact:true}).click();
  await host.waitForFunction(key=>window.snapshot.world.voxels.machinery.devices[key].signal===15,key);
  await host.getByRole('button',{name:'調べる',exact:true}).click();
  assert.equal(await host.locator('.rpg-device-inspector [data-signal]').getAttribute('data-signal'),'15');
  assert.deepEqual(errors,[]);
  console.log('PASS invitation in a real browser, a 2D placement relayed by the server, and 3D operation reflected in the 2D HUD.');
} catch(error) {
  console.error('Browser errors:',errors);
  for(const page of [host,guest]) console.error((await page?.locator('body').innerText({timeout:2500}).catch(()=>''))?.slice(0,1100));
  throw error;
} finally {
  await browser?.close();
  await vite?.close();
  await fs.rm(fixture,{force:true});
  processServer.kill('SIGTERM');
}
