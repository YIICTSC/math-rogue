import sharp from 'sharp';import fs from'node:fs/promises';import{createHash}from'node:crypto';
const source='assets/star-tide/relief-imagegen-source.png',input=await fs.readFile(source),m=await sharp(input).metadata(),cells=[];
for(let row=0;row<6;row++)for(let col=0;col<4;col++){
 const cw=m.width/4,ch=m.height/6;const left=Math.round(col*cw)+(col===0?Math.round(cw*(row===0?.57:.2)):2),top=Math.round(row*ch)+(col===0?Math.round(ch*.18):2),right=Math.round((col+1)*cw)-(col===0?Math.round(cw*.07):2),bottom=Math.round((row+1)*ch)-(col===0?Math.round(ch*.1):2);
 cells.push({input:await sharp(input).extract({left,top,width:right-left,height:bottom-top}).resize(128,128).png().toBuffer(),left:col*128,top:row*128});
}
await sharp({create:{width:512,height:768,channels:3,background:'#526b64'}}).composite(cells).webp({quality:91}).toFile('public/sprites/star-tide/relief.webp');
await fs.writeFile('assets/star-tide/relief-art.json',JSON.stringify({generator:'ImageGen',source,sha256:createHash('sha256').update(input).digest('hex'),grid:[4,6],cell:128,columns:['terrace surface','cliff face','south staircase','waterfall'],rows:['limestone coast','moss forest','crystal marsh','ochre canyon','alpine snow','volcanic basalt'],runtime:'sprites/star-tide/relief.webp',geometry:'Shared rounded paths, continuous single material patches, aligned stair cutouts; no independent corner sprites.'},null,2)+'\n');
