import { readFile } from 'node:fs/promises';

const runtimeSource = await readFile('src/config/runtime.ts', 'utf8');
const appSource = await readFile('src/App.tsx', 'utf8');
const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

if (!runtimeSource.includes(
  "export const DEBUG_FEATURES_ENABLED = import.meta.env.VITE_ENABLE_DEBUG_FEATURES === 'true';",
)) {
  throw new Error('Debug features are not controlled by the explicit development-only environment flag.');
}

for (const scriptName of ['build', 'build:ios', 'build:android', 'build:steam', 'dist:steam:win']) {
  const command = String(packageJson.scripts?.[scriptName] || '');
  if (!command) throw new Error(`Missing production build script: ${scriptName}`);
  if (command.includes('VITE_ENABLE_DEBUG_FEATURES=true')) {
    throw new Error(`Production build script enables debug features: ${scriptName}`);
  }
}

const requiredGuards = [
  'if (!DEBUG_FEATURES_ENABLED || gamepadTestScreenOpenedRef.current',
  'onClick={DEBUG_FEATURES_ENABLED ? handleTitleClick : undefined}',
  '{DEBUG_FEATURES_ENABLED && gameState.screen === GameScreen.DEBUG_MENU',
  '{DEBUG_FEATURES_ENABLED && gameState.screen === GameScreen.MAGIC_EVENT_SIMULATION',
];
for (const guard of requiredGuards) {
  if (!appSource.includes(guard)) {
    throw new Error(`Production debug guard is missing: ${guard}`);
  }
}

process.stdout.write('Production debug-route lock verification passed.\n');
