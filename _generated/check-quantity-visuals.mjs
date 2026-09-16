import { chromium } from 'playwright';

const defaultTargets = [
  'ten_frame',
  'place_value_blocks',
  'bar_model',
  'array_model',
  'groups_model',
  'number_line',
  'double_number_line',
];
const kinds = process.env.VISUAL_TEST_TARGETS
  ? process.env.VISUAL_TEST_TARGETS.split(',').map((value) => value.trim()).filter(Boolean)
  : defaultTargets;

const viewport = {
  width: Number(process.env.VIEWPORT_WIDTH || 1400),
  height: Number(process.env.VIEWPORT_HEIGHT || 900),
};
const shotSuffix = process.env.SHOT_SUFFIX || '';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport });
const pageErrors = [];
const consoleErrors = [];
const failedRequests = [];

page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('requestfailed', (request) => failedRequests.push({
  url: request.url(),
  error: request.failure()?.errorText ?? 'unknown',
}));

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);

const adultButton = page.getByRole('button', { name: '大人', exact: true });
if (await adultButton.count()) await adultButton.click();
await page.waitForTimeout(350);

const laterButton = page.getByText('あとで決める', { exact: true });
if (await laterButton.count()) await laterButton.last().click();
await page.waitForTimeout(300);

const versionButton = page.locator('button.start-menu-version');
if (await versionButton.count()) {
  await versionButton.click();
} else {
  await page.locator('button').filter({ hasText: /v\d/ }).first().click();
}
await page.waitForTimeout(200);

const releaseNotesButton = page.getByRole('button', { name: /System Release Notes/ });
for (let index = 0; index < 10; index += 1) {
  await releaseNotesButton.click();
  await page.waitForTimeout(25);
}
await page.waitForTimeout(500);

const illustratedTab = page.getByRole('button', { name: 'イラスト問題', exact: true }).first();
const illustratedClassBefore = await illustratedTab.getAttribute('class');
await illustratedTab.click({ force: true });
await page.waitForTimeout(400);
if (!(await page.getByText('イラストつき問題テスト', { exact: true }).count())) {
  await illustratedTab.evaluate((element) => element.click());
  await page.waitForTimeout(300);
}
console.log('TAB_DIAGNOSTIC', JSON.stringify({
  before: illustratedClassBefore,
  after: await illustratedTab.getAttribute('class'),
  hasIllustratedHeader: await page.getByText('イラストつき問題テスト', { exact: true }).count(),
  pageErrors,
  consoleErrors,
}));

const findVisualSearchInput = async () => {
  const inputs = page.locator('input');
  for (let index = 0; index < await inputs.count(); index += 1) {
    const placeholder = await inputs.nth(index).getAttribute('placeholder');
    if (placeholder?.includes('visual種別')) return inputs.nth(index);
  }
  return null;
};

const results = [];

for (const kind of kinds) {
  let searchInput = await findVisualSearchInput();
  if (!searchInput) {
    await illustratedTab.click({ force: true });
    await page.waitForTimeout(250);
    searchInput = await findVisualSearchInput();
  }
  if (!searchInput) {
    await page.screenshot({ path: '_generated/quantity-visual-navigation-failure.png', fullPage: true });
    console.log('NAVIGATION_BODY', (await page.locator('body').innerText()).slice(0, 4000));
    throw new Error('visual検索欄が見つかりません');
  }

  await searchInput.fill(kind);
  await page.waitForTimeout(250);

  const tryButtons = page.getByRole('button', { name: 'この問題を試す', exact: true });
  const matches = await tryButtons.count();
  if (!matches) {
    results.push({ kind, matches: 0, error: 'no matches' });
    continue;
  }

  const card = tryButtons.first().locator('xpath=ancestor::article');
  const cardText = (await card.innerText()).replace(/\s+/g, ' ').trim();
  await tryButtons.first().click();
  await page.waitForTimeout(700);

  const canvas = page.locator('.dynamic-visual-canvas').first();
  const canvasCount = await canvas.count();
  let canvasInfo = null;
  if (canvasCount) {
    canvasInfo = await canvas.evaluate((element) => {
      const context = element.getContext('2d');
      const data = context.getImageData(0, 0, element.width, element.height).data;
      let opaque = 0;
      let bright = 0;
      for (let offset = 0; offset < data.length; offset += 4) {
        if (data[offset + 3] > 0) opaque += 1;
        if (data[offset] + data[offset + 1] + data[offset + 2] > 500) bright += 1;
      }
      return {
        width: element.width,
        height: element.height,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        opaque,
        bright,
      };
    });
    const safeKind = kind.replace(/[^A-Za-z0-9_-]/g, '_');
    await canvas.screenshot({ path: `_generated/quantity-visual-${safeKind}${shotSuffix}.png` });
  }

  let backButton = page.locator('button').filter({ hasText: '(Esc)' });
  if (!(await backButton.count())) {
    const toolbarButton = page.locator('button').filter({ hasText: /\d+×\d+/ }).first();
    if (await toolbarButton.count()) {
      await toolbarButton.click();
      await page.waitForTimeout(120);
      backButton = page.locator('button').filter({ hasText: '(Esc)' });
    }
  }
  const hasBack = (await backButton.count()) > 0;
  results.push({
    kind,
    matches,
    cardText: cardText.slice(0, 220),
    canvasCount,
    canvasInfo,
    hasBack,
  });

  if (!hasBack) break;
  await backButton.first().click();
  await page.waitForTimeout(450);
}

console.log(JSON.stringify({ results, pageErrors, consoleErrors, failedRequests }, null, 2));
await browser.close();
