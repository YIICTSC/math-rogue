import { chromium } from 'playwright';
import fs from 'node:fs';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
const visuals = [
  ['plant_anatomy', { kind: 'plant_anatomy', mode: 'transport', title: '植物の 水と養分の通り道' }],
  ['body_system', { kind: 'body_system', mode: 'integrated', title: '呼吸・消化・循環のつながり' }],
  ['cell_diagram', { kind: 'cell_diagram', mode: 'plant_animal', title: '植物細胞と 動物細胞' }],
  ['punnett_square', { kind: 'punnett_square', parentA: 'Aa', parentB: 'Aa', title: '遺伝子の 組み合わせ', dominantLabel: 'AA : Aa : aa = 1 : 2 : 1' }],
  ['food_web', { kind: 'food_web', mode: 'web', title: '食物網' }],
];
fs.mkdirSync('_generated', { recursive: true });
for (const [name, visual] of visuals) {
  await page.evaluate(async ({ name, visual }) => {
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.background = '#020617';
    document.body.style.display = 'flex';
    document.body.style.alignItems = 'center';
    document.body.style.justifyContent = 'center';
    document.body.style.width = '900px';
    document.body.style.height = '700px';
    const canvas = document.createElement('canvas');
    canvas.id = `preview-${name}`;
    canvas.width = 780;
    canvas.height = 540;
    canvas.style.width = '780px';
    canvas.style.height = '540px';
    canvas.style.border = '1px solid rgba(148,163,184,.45)';
    canvas.style.borderRadius = '14px';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    ctx.scale(3, 3);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 260, 180);
    ctx.strokeStyle = 'rgba(51,65,85,.42)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= 260; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,180); ctx.stroke(); }
    for (let y = 0; y <= 180; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(260,y); ctx.stroke(); }
    const mod = await import('/src/utils/scienceBiologyVisualRenderer.ts');
    const ok = mod.drawScienceBiologyProblemVisual(ctx, visual, 260, 180);
    if (!ok) throw new Error(`renderer returned false for ${name}`);
  }, { name, visual });
  await page.locator(`#preview-${name}`).screenshot({ path: `_generated/biology-visual-${name}.png` });
}
await browser.close();
console.log('BIOLOGY_VISUAL_SCREENSHOTS_OK', visuals.length);
