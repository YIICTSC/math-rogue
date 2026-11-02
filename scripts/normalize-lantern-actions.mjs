import sharp from 'sharp';
import fs from 'node:fs/promises';
const [id,input]=process.argv.slice(2);
if(!['end-vesper','end-sable','end-hikari','end-ren'].includes(id)||!input)throw Error('Usage: node scripts/normalize-lantern-actions.mjs <end-id> <raw-sheet>');
const actions=['ready','windup','attack','guard','hurt','ultimate'];
const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const sw=Math.floor(info.width/3),sh=Math.floor(info.height/2),regions=[];
for(let frame=0;frame<6;frame++){
 let left=sw,top=sh,right=-1,bottom=-1;
 for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(data[((Math.floor(frame/3)*sh+y)*info.width+(frame%3)*sw+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<left)throw Error('Empty action cell '+actions[frame]);
 regions.push({left,top,width:right-left+1,height:bottom-top+1});
}
const cw=768,ch=896,baseline=760;
const scale=Math.min(cw*.65/Math.max(...regions.map(r=>r.width)),ch*.65/Math.max(...regions.map(r=>r.height)));
const parts=[],metrics={};
for(let i=0;i<6;i++){
 const r=regions[i],w=Math.round(r.width*scale),h=Math.round(r.height*scale),x=Math.round((cw-w)/2),y=baseline-h;
 const buffer=await sharp(input).extract({left:(i%3)*sw+r.left,top:Math.floor(i/3)*sh+r.top,width:r.width,height:r.height}).resize(w,h).png().toBuffer();
 parts.push({input:buffer,left:(i%3)*cw+x,top:Math.floor(i/3)*ch+y});
 const m={x:(i%3)*cw,y:Math.floor(i/3)*ch,w:cw,h:ch,bounds:{x,y,w,h},bodyBounds:{x,y,w,h},footX:cw/2,footY:baseline};
 metrics[actions[i]]=Array.from({length:4},()=>m);
}
await sharp({create:{width:cw*3,height:ch*2,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts).webp({quality:92}).toFile(`public/sprites/lantern-war/endless/actions-${id}.webp`);
const path='src/mini-games/lantern-war/endlessBattleMetrics.json';let all={};try{all=JSON.parse(await fs.readFile(path,'utf8'));}catch{}
all[id]=metrics;await fs.writeFile(path,JSON.stringify(all,null,2)+'\n');
console.log(id+': six actions, shared scale '+scale.toFixed(3)+', bottom-centre anchor, at least 35% empty horizontal/vertical slot space.');
