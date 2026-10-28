import fs from 'node:fs/promises';import sharp from 'sharp';import{createServer}from'vite';
function soleMetrics(buffer,w,h){
 const labels=new Int32Array(w*h),queue=new Int32Array(w*h);let label=0,best={count:0,label:0,minX:w,minY:h,maxX:0,maxY:0};
 for(let start=0;start<w*h;start++){if(labels[start]||buffer[start*4+3]<=80)continue;label++;let head=0,tail=1;queue[0]=start;labels[start]=label;const item={count:0,label,minX:w,minY:h,maxX:0,maxY:0};
 while(head<tail){const at=queue[head++],x=at%w,y=Math.floor(at/w);item.count++;item.minX=Math.min(item.minX,x);item.minY=Math.min(item.minY,y);item.maxX=Math.max(item.maxX,x);item.maxY=Math.max(item.maxY,y);
 for(const n of [x>0?at-1:-1,x<w-1?at+1:-1,y>0?at-w:-1,y<h-1?at+w:-1])if(n>=0&&!labels[n]&&buffer[n*4+3]>80){labels[n]=label;queue[tail++]=n;}}
 if(item.count>best.count)best=item;}
 const counts=new Int32Array(w),band=Math.max(5,Math.round((best.maxY-best.minY)*.055));for(let y=Math.max(best.minY,best.maxY-band);y<=best.maxY;y++)for(let x=best.minX;x<=best.maxX;x++)if(labels[y*w+x]===best.label)counts[x]++;
 const runs=[];let begin=-1;for(let x=best.minX;x<=best.maxX+1;x++){if(counts[x]>=2){if(begin<0)begin=x;}else if(begin>=0){const width=x-begin;if(width>=Math.max(3,(best.maxX-best.minX)*.018))runs.push({x:begin+width/2,y:best.maxY+1,width});begin=-1;}}
 const contacts=runs.sort((a,b)=>b.width-a.width).slice(0,2),footX=contacts.length?contacts.reduce((n,c)=>n+c.x*c.width,0)/contacts.reduce((n,c)=>n+c.width,0):(best.minX+best.maxX)/2;
 return {footX,footY:best.maxY+1,contacts,bodyBounds:{x:best.minX,y:best.minY,w:best.maxX-best.minX+1,h:best.maxY-best.minY+1}};
}
const frameCache=new Map();
const server=await createServer({configFile:false,logLevel:'error',optimizeDeps:{noDiscovery:true},server:{middlewareMode:true}}),metrics={};
try{const {HEROES}=await server.ssrLoadModule('/src/mini-games/lantern-war/roster.ts'),{battleSource,BATTLE_ACTIONS}=await server.ssrLoadModule('/src/mini-games/lantern-war/battleSources.ts');const ids=[...HEROES.map(h=>h.id),...Array.from({length:6},(_,i)=>'enemy-'+i)];
await fs.mkdir('tmp/lantern-war/catalog',{recursive:true});
for(const id of ids){metrics[id]={};for(const action of BATTLE_ACTIONS){metrics[id][action]=[];
 for(let frame=0;frame<4;frame++){const spec=battleSource(id,action,frame),file='public/'+spec.path,m=await sharp(file).metadata(),w=Math.floor(m.width/spec.cols),h=Math.floor(m.height/spec.rows),left=spec.index%spec.cols*w,top=Math.floor(spec.index/spec.cols)*h;
 const buffer=await sharp(file).extract({left,top,width:w,height:h}).ensureAlpha().raw().toBuffer();
 let minX=w,minY=h,maxX=0,maxY=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(buffer[(y*w+x)*4+3]>40){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
 const key=spec.path+':'+spec.index;let feet=frameCache.get(key);if(!feet){feet=soleMetrics(buffer,w,h);frameCache.set(key,feet);}
 metrics[id][action].push({x:left,y:top,w,h,bounds:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1},...feet});
 if(frame===0&&['ready','attack'].includes(action)){const crop=await sharp(file).extract({left,top,width:w,height:h}).png().toBuffer();await sharp(crop).trim({threshold:10}).resize(190,210,{fit:'contain',background:'#00000000'}).png().toFile('tmp/lantern-war/catalog/'+id+'-'+action+'.png');}
 }}
}
await fs.writeFile('src/mini-games/lantern-war/battleMetrics.json',JSON.stringify(metrics)+'\n');
for(const action of ['ready','attack'])for(let page=0;page<2;page++){
 const subset=ids.slice(page*24,page*24+24),overlays=[];for(let i=0;i<subset.length;i++){const id=subset[i],x=i%4*250,y=Math.floor(i/4)*250;const label='<svg width="250" height="40"><text x="125" y="25" text-anchor="middle" font-family="Arial" fill="#f4dfae" font-size="13">'+id+'</text></svg>';overlays.push({input:await sharp('tmp/lantern-war/catalog/'+id+'-'+action+'.png').png().toBuffer(),left:x+30,top:y+35},{input:Buffer.from(label),left:x,top:y});}
 await sharp({create:{width:1000,height:1500,channels:4,background:'#142c35'}}).composite(overlays).png().toFile('tmp/lantern-war/catalog-'+action+'-'+page+'.png');
}
console.log('Inspected source metrics for '+ids.length+' characters and '+ids.length*24+' action frames.');
}finally{await server.close();}
