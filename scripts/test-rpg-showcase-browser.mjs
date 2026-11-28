import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rmdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const temporary=await mkdtemp(join(tmpdir(),'rpg-showcase-'));
const file=`.rpg-showcase-${process.pid}.tsx`;
const data=join(temporary,'samples.json');
const out=process.env.RPG_MACHINERY_QA||'tmp/rpg-showcase-qa';
let server,browser,page;
const errors=[];
try{
  await mkdir(out,{recursive:true});
  execFileSync(process.execPath,['scripts/test-rpg-technology-plans.mjs'],{
    env:{...process.env,RPG_SHOWCASE_DATA:data},stdio:'inherit',
  });
  const samples=await readFile(data,'utf8');
  const sampleIds=JSON.parse(samples).map(sample=>sample.id);
  assert.equal(sampleIds.length,22);
  await writeFile(file,`
    import React,{useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import './src/styles.css';
    import './src/rpg/rpg.css';
    import WorldView from './src/rpg/WorldView';
    import {updateRpgPreferences} from './src/rpg/preferences';
    localStorage.setItem('rpg-preferences-v1',JSON.stringify({mapView:'2D',mapQuality:'low'}));
    const samples=await fetch('/__showcase-data').then(response=>response.json());
    function Test(){
      const [{index,mode},setSample]=useState({index:0,mode:'2D'});
      window.showSample=(index,mode)=>{
        setSample({index,mode});
        updateRpgPreferences({mapView:mode});
      };
      const {id,world}=samples[index];
      world.voxels.revision=1000+index;
      const p=world.players.a;
      Object.assign(p,{x:35,y:47,position3D:{x:35.5,y:id==='metro'?-3:id==='viaduct'?2:id==='castle-gate'?1:0,z:47.5,surface2D:true}});
      return <main className="rpg-root"><div className="rpg-map-container" data-sample={id} data-view={mode} style={{width:'100vw',height:'100vh',maxHeight:'none'}}>
        <WorldView world={world} selfId="a" overview={false} facing={0} onFacing={()=>{}} onTile={()=>{}} onVoxelAction={()=>{}} languageMode="ENGLISH"/>
      </div></main>;
    }
    createRoot(document.getElementById('root')).render(<Test/>);
  `);
  server=await createServer({
    cacheDir:'node_modules/.vite-rpg-machinery-test',
    optimizeDeps:{noDiscovery:true,entries:[],include:['react','react-dom','react-dom/client','react/jsx-runtime','peerjs','three']},
    server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error',
    plugins:[{name:'showcase',configureServer(s){
      s.middlewares.use('/__showcase-data',(_req,res)=>{res.setHeader('Content-Type','application/json');res.end(samples);});
      s.middlewares.use('/__showcase',async(req,res)=>{
        res.setHeader('Content-Type','text/html');
        res.end(await s.transformIndexHtml(req.originalUrl||req.url,`<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root"></div><script type="module" src="/${file}"></script></body></html>`));
      });
    }}],
  });
  await server.listen();
  browser=await chromium.launch({headless:true,executablePath:process.env.RPG_QA_BROWSER,
    args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:900,height:550}});
  page.setDefaultTimeout(30000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__showcase`);
  await page.waitForFunction(()=>window.showSample);
  const captures=new Set(['pressure-door','metro','beacon','rail-attraction']);
  for(const mode of ['2D','3D']){
    for(const [index,id] of sampleIds.entries()){
      await page.evaluate(({index,mode})=>window.showSample(index,mode),{index,mode});
      const area=page.locator(`[data-sample="${id}"][data-view="${mode}"]`);
      const canvas=area.locator(mode==='2D'?'canvas.rpg-canvas':'canvas[data-testid="rpg-world-3d"]');
      await canvas.waitFor();
      if(mode==='3D')await page.waitForFunction(()=>Number(document.querySelector('canvas[data-testid="rpg-world-3d"]')?.dataset.voxelBlocks)>0);
      if(captures.has(id)){
        if(mode==='2D'){
          await area.getByRole('button',{name:'Layers',exact:true}).click();
          await canvas.screenshot({path:join(out,`showcase-${id}-${mode}.png`)});
          await area.getByRole('button',{name:'Surface view',exact:true}).click();
        }else await canvas.screenshot({path:join(out,`showcase-${id}-${mode}.png`)});
      }
      console.log(`PASS ${mode} ${id}`);
    }
  }
  assert.deepEqual(errors,[]);
}finally{
  await browser?.close();
  await server?.close();
  await Promise.all([unlink(file).catch(()=>{}),unlink(data).catch(()=>{})]);
  await rmdir(temporary);
}
