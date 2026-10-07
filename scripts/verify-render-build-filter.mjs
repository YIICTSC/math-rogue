import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
export async function verifyRenderBuildFilter(metafile){
const yaml=await readFile('render.yaml','utf8');
const block=yaml.match(/    buildFilter:\n      paths:\n((?:        - .+\n)+)/)?.[1];
assert(block,'Render must define included build paths');
const paths=block.trim().split('\n').map(line=>line.trim().slice(2));
const matches=file=>paths.some(glob=>glob.endsWith('/**')?file.startsWith(glob.slice(0,-2)):file===glob);
for(const output of Object.values(metafile.outputs))for(const [file,input] of Object.entries(output.inputs)){
 if(input.bytesInOutput>0&&!file.startsWith('<'))assert(matches(file),'Server dependency missing from Render build filter: '+file);
}
for(const file of ['server/build.mjs','src/rpg/engine.ts','src/mini-games/gakuro-kart/engine.ts','src/mini-games/gakuro-golf/engine.ts','src/data/subjects/math_g1.ts','src/utils/assignmentRangeFilters.ts','package.json','pnpm-lock.yaml','render.yaml'])assert(matches(file),file);
for(const file of ['src/App.tsx','src/components/TitleScreen.tsx','src/data/debugUiExact.ts','public/sprites/example.webp','public/audio/music.mp3','docs/online-transport.md','scripts/test-online-question-variety.mjs','.github/workflows/deploy-pages.yml'])assert(!matches(file),'Unrelated change triggers Render: '+file);
assert(yaml.includes('autoDeployTrigger: checksPass'),'Preserve deploy-after-checks behavior');
console.log('PASS: all compiled server dependencies covered; unrelated UI, media, docs and CI changes excluded.');

}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const bundle=await build({entryPoints:['server/index.ts'],bundle:true,platform:'node',format:'esm',target:'node22',packages:'external',define:{'import.meta.env':'{}'},write:false,metafile:true});
 await verifyRenderBuildFilter(bundle.metafile);
}
