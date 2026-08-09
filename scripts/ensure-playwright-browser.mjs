import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

// verify-english-runtime-audit.mjs only uses the system Chrome path on macOS.
// Linux and Windows must have a Playwright-managed browser installed.
const macSystemChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const playwrightBrowserPath = chromium.executablePath();
if ((process.platform === 'darwin' && existsSync(macSystemChromePath)) || existsSync(playwrightBrowserPath)) {
  console.log('Playwright browser is already available for the build-time English runtime audit.');
  process.exit(0);
}

console.log('Playwright browser is not available. Installing Chromium for the build-time English runtime audit...');
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const installResult = spawnSync(pnpmCommand, ['exec', 'playwright', 'install', 'chromium'], {
  stdio: 'inherit',
  env: process.env,
});

if (installResult.error) {
  console.error(installResult.error);
  process.exit(1);
}
if (installResult.status !== 0) {
  process.exit(installResult.status ?? 1);
}
if (!existsSync(chromium.executablePath())) {
  console.error(`Playwright Chromium was not installed at ${playwrightBrowserPath}.`);
  process.exit(1);
}

console.log('Playwright Chromium is ready for the build-time English runtime audit.');
