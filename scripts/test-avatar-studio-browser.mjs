import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const dir='tmp/avatar-studio-qa';await fs.mkdir(dir,{recursive:true});
await fs.writeFile(`${dir}/index.html`,'<body style="margin:0"><script type="module" src="./fixture.ts"></script>');
await fs.writeFile(`${dir}/fixture.ts`, `
import * as T from 'three';
import {createVrCharacter} from '/src/mini-games/gakurogear/character';
import {createGolferAssets} from '/src/mini-games/gakuro-golf/golferModels';
import {createAvatarParts} from '/src/mini-games/gakuro-kart/avatarModels';
import {defaultAvatar,AVATAR_COLORS,BODY_COLORS,HAIR_COLORS,EYE_COLORS} from '/src/mini-games/gakuro-kart/avatar';
const dispose=root=>{const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.isMesh){gs.add(o.geometry);ms.add(o.material);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());};
const cold=createVrCharacter({...defaultAvatar(),hairStyle:8,accessory:7});
const early=createVrCharacter(defaultAvatar());dispose(early);
const parts=createAvatarParts(),golf=createGolferAssets();
const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(1400,900);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#e4edf3');scene.add(new T.HemisphereLight('#fff3dd','#7385a5',2));
for(const [pos,color,intensity] of [[[3,7,6],'#fff3df',2.3],[[-5,3,2],'#c2e7ff',1.2],[[1,5,-4],'#ffffff',2]]){const l=new T.DirectionalLight(color,intensity);l.position.fromArray(pos);scene.add(l);}
const camera=new T.PerspectiveCamera(32,1400/900,.1,100);const display=new T.Group();scene.add(display);
const palette={body:BODY_COLORS,outfit:AVATAR_COLORS,hair:HAIR_COLORS,eyeColor:EYE_COLORS};
window.ready=()=>parts.filter(p=>p.geometry.name.startsWith('Blender')).length>40&&[...cold.children[0].children].some(m=>m.geometry.userData.storybookCharacter==='hairdo_8');
window.verify=()=>{let missing=[];for(const p of parts){if(p.geometry.userData.storybookCharacter){const pos=p.geometry.getAttribute('position');for(let i=0;i<pos.count;i++)if(!Number.isFinite(pos.getX(i)+pos.getY(i)+pos.getZ(i)))missing.push('invalid');}}
 const names=new Set(parts.map(p=>p.geometry.userData.storybookCharacter));for(let i=0;i<11;i++)if(!names.has('hairdo_'+i))missing.push('hair '+i);
 let earlyLoaded=false;early.traverse(o=>{if(o.geometry?.userData.storybookCharacter)earlyLoaded=true;});
 const hot=createVrCharacter({...defaultAvatar(),hairStyle:10,accessory:12});window.hot=hot;
 return {missing,earlyLoaded,coldNames:cold.children[0].children.map(m=>m.geometry.userData.storybookCharacter).filter(Boolean)};};
window.hotReady=()=>hot.children[0].children.some(m=>m.geometry.userData.storybookCharacter==='hairdo_10');
const owned=[];
function clear(){display.clear();for(const r of owned.splice(0))r.dispose();}
function put(avatar,x,y,rotation=0){const rig=golf.create(avatar);rig.root.scale.setScalar(1);rig.root.position.set(x,y,0);rig.root.rotation.y=rotation;rig.club.visible=false;display.add(rig.root);owned.push(rig);}
window.gallery=kind=>{clear();for(let i=0;i<(kind==='hair'?12:14);i++)put({...defaultAvatar(),hairStyle:kind==='hair'?i:0,accessory:kind==='hair'?0:i,hair:i%6,outfit:i%8,eyeColor:i%6},(i%7-3)*1.65,Math.floor(i/7)*-3.2);camera.position.set(0,1,22);camera.lookAt(0,.1,0);renderer.render(scene,camera);return renderer.info.render;};
window.hero=(angle,eyeStyle=0,expression=0)=>{clear();put({...defaultAvatar(),hairStyle:8,accessory:9,hair:1,outfit:1,eyeStyle,expression},0,0,angle);camera.position.set(0,1.65,5.8);camera.lookAt(0,1.35,0);renderer.render(scene,camera);};
window.beadEyes=()=>{const counts=[];for(let expression=0;expression<8;expression++){
 const a={...defaultAvatar(),eyeStyle:6,expression};counts.push(parts.filter(p=>p.geometry.name==='AvatarBeadEye'&&p.visible(a)).length);}
 return counts;};
window.cleanup=()=>{clear();dispose(cold);dispose(hot);golf.dispose();for(const g of new Set(parts.map(p=>p.geometry)))g.dispose();for(const m of new Set(parts.map(p=>p.material)))m.dispose();renderer.dispose();};
`);
let server,browser;
try{
 server=await createServer({configFile:false,cacheDir:'node_modules/.vite-avatar-studio',optimizeDeps:{noDiscovery:true,include:['three']},logLevel:'error',server:{host:'127.0.0.1',port:5253,strictPort:true,hmr:false}});await server.listen();
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await browser.newPage({viewport:{width:1400,height:900}}),errors=[];p.setDefaultTimeout(90000);p.on('pageerror',e=>errors.push(e.message));
 // Hold the first request: verify that VR characters created before loading upgrade too.
 await p.route('**/characters-v3.glb',async route=>{await new Promise(r=>setTimeout(r,350));await route.continue();});
 await p.goto(`http://127.0.0.1:5253/${dir}/index.html`);await p.waitForFunction(()=>window.ready?.());
 const result=await p.evaluate(()=>verify());assert.deepEqual(result.missing,[]);assert.equal(result.earlyLoaded,false);
 for(const name of ['humanhead','hairdo_8','acc_7_pink','trouser','shoe'])assert(result.coldNames.includes(name),name+' must upgrade in cold VR character');
 await p.waitForFunction(()=>hotReady());
 for(const kind of ['hair','accessories']){const stats=await p.evaluate(k=>gallery(k),kind);await p.screenshot({path:`${dir}/${kind}.png`});console.log(kind,stats);}
 for(const [name,angle] of [['front',0],['angle',.65],['side',Math.PI/2],['back',Math.PI]]){await p.evaluate(a=>hero(a),angle);await p.screenshot({path:`${dir}/${name}.png`});}
 assert.deepEqual(await p.evaluate(()=>beadEyes()),[2,2,0,2,2,2,1,2]);
 for(const expression of [0,2,6]){await p.evaluate(e=>hero(.15,6,e),expression);await p.screenshot({path:`${dir}/cute-eyes-${expression}.png`});}
 assert.deepEqual(errors,[]);await p.evaluate(()=>cleanup());console.log('Avatar studio: finite meshes, all hair, cold/hot VR GLB upgrades, early disposal and four-view render passed.');
}finally{await browser?.close();await server?.close();}
