import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js','build'], {
 stdio:'inherit',
 env:{...process.env,VITE_APP_PLATFORM:'android',VITE_PAID_EDITION:'true',VITE_ANDROID_BUNDLED_ASSETS:'true',VITE_LARGE_ASSET_BASE_URL:''},
});
process.exit(result.status ?? 1);
