import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer as createNetServer } from 'node:net';
import { existsSync, readdirSync } from 'node:fs';

if (process.env.VERCEL === '1' || process.env.VERCEL === 'true') {
  console.warn('English runtime audit skipped on Vercel because the build image does not provide a Playwright browser.');
  process.exit(0);
}

const getAvailablePort = () => new Promise((resolve, reject) => {
  const probe = createNetServer();
  probe.unref();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const address = probe.address();
    const port = typeof address === 'object' && address ? address.port : null;
    probe.close((error) => error ? reject(error) : resolve(port));
  });
});

const PORT = await getAvailablePort();
if (!PORT) throw new Error('Could not allocate a port for the English runtime audit.');
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async () => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await delay(200);
  }
  throw new Error('English runtime audit server did not start within 30 seconds.');
};

const server = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(PORT)], {
  stdio: 'ignore',
});

const stopServer = async () => {
  if (!server.pid || server.exitCode !== null) return;
  server.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => server.once('close', resolve)),
    delay(2_000),
  ]);
  if (server.exitCode === null) {
    server.kill('SIGKILL');
  }
};

let browser;
let auditError = null;
try {
  await waitForServer();
  const launchOptions = { headless: true };
  if (existsSync(CHROME_PATH)) {
    launchOptions.executablePath = CHROME_PATH;
  }
  browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('pixel_spire_language_mode_v1', 'ENGLISH');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.getByRole('heading', { name: 'Learning Rogue' }).waitFor({ state: 'visible' });
  await page.waitForTimeout(300);

  const state = await page.evaluate(() => ({
    screen: document.documentElement.dataset.translationAuditScreen || 'UNKNOWN',
    entries: JSON.parse(document.documentElement.dataset.translationAuditEntries || '[]'),
  }));

  if (state.entries.length > 0) {
    console.error(JSON.stringify(state.entries, null, 2));
    throw new Error(`English runtime audit found ${state.entries.length} issue(s) on ${state.screen}.`);
  }
  console.log('English runtime audit sentinel passed on the normal English title screen.');

  const normalizeAssetName = (value) => value.normalize('NFC');
  const dedicatedCardArtNames = readdirSync('public/card-illustrations', { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.webp'))
    .map((entry) => normalizeAssetName(entry.name.slice(0, -'.webp'.length)));
  const cardArtAudit = await page.evaluate(async (assetNames) => {
    const [{ CARDS_LIBRARY }, { getAge9CardArtAlias, getCardIllustrationPaths }, { buildEnglishCardName }] = await Promise.all([
      import('/src/constants.ts'),
      import('/src/utils/cardIllustration.ts'),
      import('/src/utils/textUtils.ts'),
    ]);
    const normalizeAssetName = (value) => value.normalize('NFC');
    const available = new Set(assetNames.map(normalizeAssetName));
    const failures = [];
    let auditedCount = 0;
    for (const [id, template] of Object.entries(CARDS_LIBRARY)) {
      if (!available.has(normalizeAssetName(template.name))) continue;
      auditedCount += 1;
      const card = { ...template, id };
      const translatedName = buildEnglishCardName(card);
      const paths = getCardIllustrationPaths(id, translatedName, [template.name, ...(template.originalNames || [])]);
      const firstFile = normalizeAssetName(
        decodeURIComponent(new URL(paths[0], location.href).pathname.split('/').pop() || '').replace(/\.webp$/, '')
      );
      const expectedFile = normalizeAssetName(
        getAge9CardArtAlias([template.name, ...(template.originalNames || [])]) || template.name
      );
      if (firstFile !== expectedFile) {
        failures.push({ id, name: template.name, translatedName, expectedFile, firstFile });
      }
    }
    return { auditedCount, failures };
  }, dedicatedCardArtNames);

  if (cardArtAudit.failures.length > 0) {
    console.error(JSON.stringify(cardArtAudit.failures, null, 2));
    throw new Error(`English card-art audit found ${cardArtAudit.failures.length} unstable illustration reference(s).`);
  }
  console.log(`English card-art audit passed for ${cardArtAudit.auditedCount} cards with dedicated illustration assets.`);
} catch (error) {
  auditError = error;
} finally {
  await stopServer();
  if (browser) {
    await Promise.race([
      browser.close().catch(() => undefined),
      delay(3_000),
    ]);
  }
}

if (auditError) {
  console.error(auditError);
  process.exit(1);
}

// Playwright can retain a Chrome transport handle on macOS even after
// browser.close() resolves or times out. The audit result is final at this
// point, so terminate explicitly to keep parent build chains deterministic.
process.exit(0);
