import fs from 'node:fs/promises';import sharp from 'sharp';import {createServer} from 'vite';
const output=process.env.LANTERN_ENEMY_ARTIFACT_DIR||'.codex-artifacts/lantern-enemies';
const server=await createServer({configFile:false,logLevel:'error',optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,watch:null,hmr:false}});
try{
const {ENDLESS_ENEMIES}=await server.ssrLoadModule('/src/mini-games/lantern-war/enemyRoster.ts');
const metrics={},facing={};await fs.mkdir(output,{recursive:true});
// Measure existing transparent source art; no repainting or asset replacement.
for(const path of new Set(ENDLESS_ENEMIES.flatMap(e=>Object.values(e.art)))){
 const {data,info}=await sharp('public/'+path).ensureAlpha().raw().toBuffer({resolveWithObject:true});const {width:w,height:h}=info;let x=w,y=h,right=-1,bottom=-1;
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(data[(yy*w+xx)*4+3]>80){x=Math.min(x,xx);y=Math.min(y,yy);right=Math.max(right,xx);bottom=Math.max(bottom,yy);}
 if(right<0)throw Error('Empty enemy art '+path);
 // The lower silhouette band gives a stable ground anchor, also for quadrupeds.
 let sum=0,count=0;for(let yy=Math.max(y,bottom-Math.max(3,Math.round((bottom-y)*.04)));yy<=bottom;yy++)for(let xx=x;xx<=right;xx++)if(data[(yy*w+xx)*4+3]>80){sum+=xx;count++;}
 metrics[path]={x:0,y:0,w,h,bounds:{x,y,w:right-x+1,h:bottom-y+1},bodyBounds:{x,y,w:right-x+1,h:bottom-y+1},footX:count?sum/count:(x+right)/2,footY:bottom+1};facing[path]='l';
}
let reviewed={};try{reviewed=JSON.parse(await fs.readFile('src/mini-games/lantern-war/enemyArtFacing.json','utf8'));}catch{}
await fs.writeFile('src/mini-games/lantern-war/enemyArtMetrics.json',JSON.stringify(metrics)+'\n');await fs.writeFile('src/mini-games/lantern-war/enemyArtFacing.json',JSON.stringify({...facing,...reviewed},null,2)+'\n');
for(let start=0;start<ENDLESS_ENEMIES.length;start+=24){const cells=[];for(const [i,e]of ENDLESS_ENEMIES.slice(start,start+24).entries()){
 const x=i%4*300,y=Math.floor(i/4)*164;cells.push({input:Buffer.from(`<svg width="300" height="24"><text x="3" y="16" fill="white" font-size="11">${e.id}</text></svg>`),left:x,top:y});
 for(const [j,action]of ['idle','attack','skill'].entries())cells.push({input:await sharp('public/'+e.art[action]).resize(100,140,{fit:'contain'}).png().toBuffer(),left:x+j*100,top:y+24});}
 await sharp({create:{width:1200,height:984,channels:4,background:'#34424a'}}).composite(cells).png().toFile(output+'/page-'+Math.floor(start/24)+'.png');}
await fs.writeFile(output+'/catalog.json',JSON.stringify(ENDLESS_ENEMIES,null,2));console.log(`${ENDLESS_ENEMIES.length} appearances, ${Object.keys(metrics).length} source images measured; contact sheets in ${output}`);
}finally{await server.close();}
