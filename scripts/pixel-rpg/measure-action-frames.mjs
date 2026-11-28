import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

export async function writeActionExtents(atlasPath, {frameWidth,frameHeight,columns,actors}, output) {
  const entries=await Promise.all(Object.values(actors).map(async ({file,costumes})=>{
    const {data,info}=await sharp(join(atlasPath,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const frames=[];
    for(const index of Object.values(costumes).flatMap(Object.values)){
      const left=index%columns*frameWidth, top=Math.floor(index/columns)*frameHeight;
      let start=frameHeight,end=0;
      for(let y=0;y<frameHeight;y++){
        const alpha=((top+y)*info.width+left)*info.channels+3;
        for(let x=0;x<frameWidth;x++)if(data[alpha+x*info.channels]>=128){
          start=Math.min(start,y);end=y+1;break;
        }
      }
      if(end<=start)throw Error(`${file} has an empty frame at ${index}`);
      frames[index]=[start,end];
    }
    return `  ${JSON.stringify(file)}: ${JSON.stringify(frames)}`;
  }));
  await writeFile(output,'{\n'+entries.join(',\n')+'\n}\n');
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const folder='src/mini-games/pixel-rpg';
  const registry=JSON.parse(await readFile(join(folder,'generatedBattleArt.json'),'utf8'));
  await writeActionExtents('public/sprites/pixel-rpg/actions',registry,join(folder,'generatedActionExtents.json'));
}
