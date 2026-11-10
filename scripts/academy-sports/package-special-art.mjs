import fs from'node:fs/promises';import path from'node:path';import crypto from'node:crypto';import sharp from'sharp';
const input=process.argv[2];if(!input)throw Error('Pass the ImageGen results JSON path.');
const plan=JSON.parse(await fs.readFile(input,'utf8')),files=[];
const save=async(image,target,extra)=>{await fs.mkdir(path.dirname(target),{recursive:true});await image.webp({quality:90,alphaQuality:100}).toFile(target);const bytes=await fs.readFile(target),meta=await sharp(bytes).metadata();files.push({path:target,width:meta.width,height:meta.height,alpha:meta.hasAlpha,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),...extra});};
for(const item of plan.items){const rows=item.group===8?3:4;await save(sharp(item.path),`public/sprites/academy-sports/cutins/cast-${item.group}-v1.webp`,{kind:'cutin',sheet:item.group,columns:3,rows,source:item.path});}
for(const item of plan.effects){const meta=await sharp(item.path).metadata(),w=Math.floor(meta.width/2),h=Math.floor(meta.height/2),composite=[];for(let i=0;i<4;i++){
 const source=await sharp(item.path).extract({left:(i%2)*w,top:Math.floor(i/2)*h,width:w,height:h}).ensureAlpha().raw().toBuffer();let x0=w,y0=h,x1=0,y1=0;
 for(let y=Math.floor(h*.25);y<h*.75;y++)for(let x=Math.floor(w*.25);x<w*.75;x++){const at=(y*w+x)*4,r=source[at],g=source[at+1],b=source[at+2],a=source[at+3];const ball=a>120&&(item.sport==='baseball'?r>g*1.25&&r>b*1.15:item.sport==='soccer'?r<95&&g<95&&b<95:r>160&&g>130&&b<130);if(ball){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
 const cx=x1>x0?(x0+x1)/2:w/2,cy=y1>y0?(y0+y1)/2:h/2,scale=384/Math.max(w,h),rw=Math.round(w*scale),rh=Math.round(h*scale),left=Math.round(256-cx*scale),top=Math.round(256-cy*scale);
 const resized=await sharp(source,{raw:{width:w,height:h,channels:4}}).resize(rw,rh).png().toBuffer();if(left<0||top<0||left+rw>512||top+rh>512)throw Error('Invalid frame anchor');composite.push({input:resized,left:i*512+left,top});
 }
 await save(sharp({create:{width:2048,height:512,channels:4,background:'#00000000'}}).composite(composite),`public/sprites/academy-sports/effects/${item.sport}-signature-v1.webp`,{kind:'effect',columns:4,rows:1,frames:4,anchor:'ball center; uniform scale; transparent 512px cells',source:item.path});}
await fs.mkdir('assets/academy-sports',{recursive:true});await fs.writeFile('assets/academy-sports/special-art.json',JSON.stringify({generator:'ImageGen',characters:35,cutins:105,effectFrames:12,files},null,2)+'\n');console.log(files.map(f=>[f.path,f.width,f.height,f.bytes]));
