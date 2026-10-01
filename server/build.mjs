import { build } from 'esbuild';
await build({entryPoints:['server/index.ts'],outfile:'server/dist/index.mjs',bundle:true,platform:'node',format:'esm',target:'node22',packages:'external',define:{'import.meta.env':'{}'}});
