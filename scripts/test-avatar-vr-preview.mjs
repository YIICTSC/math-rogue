import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const dir='tmp/avatar-vr-preview';await fs.mkdir(dir,{recursive:true});
await fs.writeFile(`${dir}/index.html`,'<body style="margin:0"><div id="preview" style="width:800px;height:600px"></div><script type="module" src="./fixture.ts"></script>');
await fs.writeFile(`${dir}/fixture.ts`, `
import {createScene} from '/src/mini-games/gakurogear/scene';
import * as T from 'three';
import {characterGeometry} from '/src/three/storybookCharacters';
const probe=characterGeometry('shoe',new T.BoxGeometry(1,1,1));
import {MISSIONS,createRun} from '/src/mini-games/gakurogear/engine';
import {defaultAvatar} from '/src/mini-games/gakuro-kart/avatar';
import {loadVrAvatar,saveVrAvatar} from '/src/mini-games/gakurogear/character';
const avatar={...defaultAvatar(),hairStyle:8,accessory:9,hair:2,outfit:1};
saveVrAvatar(avatar);window.saved=loadVrAvatar();
const mission={...MISSIONS[0],routes:[],cameras:[],targets:[],obstacles:[]};
const view=createScene(document.getElementById('preview'),mission,avatar);
window.change=()=>view.setAvatar({...avatar,hairStyle:4,accessory:7,hair:5});
window.draw=()=>view.portrait();window.dispose=()=>{view.dispose();probe.dispose();};
window.training=()=>view.draw(createRun(mission),{mode:'third',yaw:0});
window.ready=()=>probe.userData.storybookCharacter==='shoe';`);
let server,browser;
try{
 server=await createServer({configFile:false,cacheDir:'node_modules/.vite-avatar-vr',optimizeDeps:{entries:[`${dir}/index.html`]},logLevel:'error',server:{host:'127.0.0.1',port:5254,strictPort:true,hmr:false}});await server.listen();
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await browser.newPage({viewport:{width:800,height:600}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));const loaded=p.waitForResponse(r=>r.url().includes('characters-v3.glb')&&r.status()===200);
 await p.goto(`http://127.0.0.1:5254/${dir}/index.html`);await loaded;await p.waitForFunction(()=>window.ready?.());
 assert.equal(await p.evaluate(()=>saved.hairStyle),8);await p.waitForTimeout(350);await p.evaluate(()=>draw());await p.screenshot({path:`${dir}/portrait.png`});
 await p.evaluate(()=>change());await p.waitForTimeout(100);await p.evaluate(()=>draw());await p.screenshot({path:`${dir}/changed.png`});
 await p.evaluate(()=>training());await p.screenshot({path:`${dir}/training.png`});await p.evaluate(()=>dispose());assert.equal(await p.locator('canvas').count(),0);assert.deepEqual(errors,[]);
 console.log('Actual VR portrait, saved appearance, live hairstyle/accessory replacement, training scene and renderer cleanup passed.');
}finally{await browser?.close();await server?.close();}
