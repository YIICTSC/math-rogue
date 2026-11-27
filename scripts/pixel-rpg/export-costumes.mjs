import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const output = process.argv[2] ?? '/tmp/pixel-rpg-costumes';
const { outputFiles } = await build({
  stdin:{ resolveDir:process.cwd(), contents:`
    import { proceduralIllustration as illustration } from './src/mini-games/pixel-rpg/art';
    import { HERO_LIST, JOB_LIST } from './src/mini-games/pixel-rpg/catalog';
    window.pixelCostumes = { illustration, heroes:HERO_LIST, jobs:JOB_LIST };
  ` },
  bundle:true, write:false, platform:'browser', define:{'import.meta.env':'{}'},
});
const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.addScriptTag({ content:outputFiles[0].text });
  const catalog = await page.evaluate(() => {
    const {heroes,jobs}=window.pixelCostumes;
    return {
      cell:{width:38,height:48},columns:8,
      heroes:heroes.map(({id,name,job})=>({id,name,job})),
      jobs:jobs.map(({id,name})=>({id,name})),
    };
  });
  await mkdir(output,{recursive:true});
  for(const job of [null,...catalog.jobs.map(job=>job.id)]){
    const sheet=await page.evaluate(async ({job,columns})=>{
      const {heroes,illustration}=window.pixelCostumes;
      const sheet=document.createElement('canvas');
      sheet.width=columns*38;
      sheet.height=Math.ceil(heroes.length/columns)*48;
      const ctx=sheet.getContext('2d');
      const images=heroes.map(hero=>illustration(hero.id,job??hero.job));
      for(const [index,image] of images.entries()){
        const sprite=new Image();
        sprite.src=image;
        await sprite.decode();
        ctx.drawImage(sprite,(index%columns)*38,Math.floor(index/columns)*48);
      }
      return {png:sheet.toDataURL().split(',')[1],distinct:new Set(images).size};
    },{job,columns:catalog.columns});
    assert.equal(sheet.distinct,catalog.heroes.length,job??'default');
    await writeFile(`${output}/${job??'default'}.png`,Buffer.from(sheet.png,'base64'));
  }
  await writeFile(`${output}/catalog.json`,JSON.stringify(catalog,null,2)+'\n');
  console.log(`${catalog.heroes.length} default sprites and ${catalog.heroes.length*catalog.jobs.length} job sprites exported to ${output}`);
} finally { await browser.close(); }
