import { build } from 'esbuild';
import { verifyRenderBuildFilter } from '../scripts/verify-render-build-filter.mjs';
const bundle = await build({entryPoints:['server/index.ts'],outfile:'server/dist/index.mjs',bundle:true,platform:'node',format:'esm',target:'node22',packages:'external',metafile:true,define:{'import.meta.env':'{}'}});

await verifyRenderBuildFilter(bundle.metafile);
