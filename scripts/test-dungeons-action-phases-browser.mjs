import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const entry=`.action-phases-${process.pid}.ts`;let server,browser;
try{
 await fs.writeFile(entry,`import * as d1 from './src/components/school-dungeon/dungeons1/heroActions';import * as d2 from './src/components/school-dungeon/dungeons2/heroActions';import * as sprites from './src/components/school-dungeon/student/sprites';import {loadD1HeroArt} from './src/components/school-dungeon/dungeons1/drawHero';import {studentPoseAtlas} from './src/components/school-dungeon/dungeons1/poseAtlas';import * as geometry from './src/components/school-dungeon/student/actionGeometry';Object.assign(window,{d1,d2,sprites,loadD1HeroArt,studentPoseAtlas,geometry});`);
 server=await createServer({server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error',plugins:[{name:'phases',configureServer(s){s.middlewares.use('/__phases',async(req,res)=>res.end(await s.transformIndexHtml('/__phases',`<body style="background:#263645"><script type="module" src="/${entry}"></script>`)));}}]});await server.listen();browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:800,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__phases`);await page.waitForFunction(()=>window.geometry);
 const assets=[];for(const series of [1])for(const a of JSON.parse(await fs.readFile(`assets/dungeons${series}/hero-actions-build.json`,'utf8')).assets)assets.push({...a,series});
 const result=await page.evaluate(async assets=>{
 const {d1,d2,sprites,loadD1HeroArt,studentPoseAtlas,geometry}=window;const actions=['walk','attack','throw','swing','read','use','shoot'];let time=1000,draws=0,distinct=0;const originalNow=performance.now;performance.now=()=>time;
 const checksum=bytes=>{let h=2166136261;for(const v of bytes)h=Math.imul(h^v,16777619);return h>>>0;};
 try{for(const a of assets){
 const source=sprites.loadStudentSprite(a.heroId,a.transformed);await source.decode();await (a.series===1?loadD1HeroArt(a.heroId,a.transformed):d2.loadD2HeroActions(a.heroId,a.transformed)).decode();
 const atlas=studentPoseAtlas(a.heroId,source,a.transformed),ac=atlas.getContext('2d');
 const reference=document.createElement('canvas');reference.width=reference.height=64;const rc=reference.getContext('2d');rc.imageSmoothingEnabled=false;
 for(let dir=0;dir<8;dir++){
 rc.clearRect(0,0,64,64);rc.drawImage(source,dir%4*source.naturalWidth/4,Math.floor(dir/4)*source.naturalHeight/2,source.naturalWidth/4,source.naturalHeight/2,0,0,64,64);const pixels=rc.getImageData(0,0,64,64).data;let top=64,bottom=0;for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(pixels[(y*64+x)*4+3]>80){top=Math.min(top,y);bottom=Math.max(bottom,y);}const headEnd=Math.floor(top+(bottom-top+1)*.3);
 for(let row=0;row<24;row++){const bob=row<6?(row%3===1?-1:0):(row-6)%3===1?-1:0;const pose=ac.getImageData(dir*96,row*96,96,96).data;for(let y=top;y<headEnd;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,j=((y+16+bob)*96+x+16)*4;if(pixels[i+3]===255&&[0,1,2].some(c=>Math.abs(pixels[i+c]-pose[j+c])>3))throw Error('Face changed '+a.key+'/'+dir+'/'+row);}}
 }

 const canvas=document.createElement('canvas');canvas.id='form-'+a.series+'-'+a.key;canvas.width=512;canvas.height=1568;document.body.append(canvas);const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.font='14px sans-serif';ctx.fillText(a.key+' / S N E W SE SW NE NW',4,20);let row=0;
 for(const action of actions){const count=action==='walk'?6:3;for(let frame=0;frame<count;frame++,row++){
 time+=2000;const motion=a.series===1?d1:d2;const cue=a.series===1?d1.cueStudentAction:d2.cueD2HeroAction;cue(a.heroId,action);const start=time,snapshot=a.series===1?d1.studentActionSnapshot(a.heroId):d2.d2HeroActionSnapshot(a.heroId);time=start+snapshot.duration*(frame+.15)/count;
 for(let dir=0;dir<8;dir++){
 const g=geometry.actionGeometry(dir,Math.min(frame,2),action),v=geometry.ACTION_DIRECTIONS[dir];if(Math.cos(g.angle)*v.x+Math.sin(g.angle)*v.y<=0)throw Error('Backwards weapon '+dir+'/'+frame);if(g.behind!==(v.y<0))throw Error('Wrong occlusion');
 if(!sprites.drawStudentSprite(ctx,a.heroId,v,dir*64+8,row*64+40,48,a.transformed))throw Error('Missing phase '+a.key+'/'+action+'/'+frame+'/'+dir);draws++;
 }
 }
 if(geometry.directedAction(action))for(let dir=0;dir<8;dir++){
 const first={attack:6,throw:9,swing:12,shoot:21}[action];const hashes=[0,1,2].map(f=>checksum(ac.getImageData(dir*96,(first+f)*96,96,96).data));if(new Set(hashes).size!==3)throw Error('Repeated offensive phase '+a.key+'/'+action+'/'+dir);distinct++;
 }
 }
 // Consecutive corrected steps alternate legs at the same elapsed time.
 if(a.series===2){time+=2000;d2.cueD2HeroAction(a.heroId,'walk');const one=d2.d2HeroActionSnapshot(a.heroId);time+=80;const f1=geometry.actionPoseFrame('walk',.25,one.step);time+=2000;d2.cueD2HeroAction(a.heroId,'walk');const two=d2.d2HeroActionSnapshot(a.heroId),f2=geometry.actionPoseFrame('walk',.25,two.step);if(f1===f2)throw Error('Same leading foot');for(let dir=0;dir<8;dir++)if(checksum(ac.getImageData(dir*96,f1*96,96,96).data)===checksum(ac.getImageData(dir*96,f2*96,96,96).data))throw Error('No alternating feet '+a.key+'/'+dir);}
 time+=2000;if(d1.studentActionSnapshot(a.heroId)||d2.d2HeroActionSnapshot(a.heroId))throw Error('Did not restore idle');
 }return {draws,distinct};}finally{performance.now=originalNow;}
 },assets);
 assert.equal(result.draws,9984);assert.equal(result.distinct,1664);assert.deepEqual(errors,[]);await fs.mkdir('tmp/action-phases',{recursive:true});for(const a of assets)await page.locator(`[id="form-${a.series}-${a.key}"]`).screenshot({path:`tmp/action-phases/${a.series}-${a.key}.png`});
 await fs.writeFile('tmp/action-phases/index.html',`<!doctype html><meta charset="utf-8"><title>Dungeon action frame review</title><style>body{background:#263645;color:white;font:16px sans-serif;margin:24px}canvas{image-rendering:pixelated;max-width:100%;background:#263645}select,button{font:inherit;margin:8px;padding:6px}</style><h1>ダンジョンズ1 全52形態・8方向のアクション確認</h1><label>キャラクター <select id="hero">${assets.map(a=>`<option value="${a.series}-${a.key}.png">${a.series}: ${a.key}</option>`).join('')}</select></label><label>動作 <select id="action"><option>walk</option><option>attack</option><option>throw</option><option>swing</option><option>read</option><option>use</option><option>shoot</option></select></label><button id="pause">停止 / 再生</button><p>南・北・東・西・南東・南西・北東・北西。下段に全フレームを表示。</p><canvas id="preview" width="768" height="128"></canvas><p><img id="sheet" style="image-rendering:pixelated;max-width:100%"></p><script>const img=new Image(),canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),hero=document.querySelector('#hero'),action=document.querySelector('#action');let paused=false,step=0,last=0;function load(){img.src=hero.value;document.querySelector('#sheet').src=hero.value;}hero.onchange=load;document.querySelector('#pause').onclick=()=>paused=!paused;load();function tick(t){if(t-last>140&&!paused){step++;last=t;}if(img.complete&&img.naturalWidth){const i=action.selectedIndex,start=i===0?0:6+(i-1)*3,count=i===0?6:3;ctx.clearRect(0,0,768,128);ctx.imageSmoothingEnabled=false;for(let d=0;d<8;d++)ctx.drawImage(img,d*64,32+(start+step%count)*64,64,64,d*96,16,96,96);}requestAnimationFrame(tick);}requestAnimationFrame(tick);</script>`);
 console.log('PASS: all 52 D1 forms, 9984 phase/direction draws, 1664 three-phase offensive sequences, depth order, idle restoration, zero browser errors.');
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
