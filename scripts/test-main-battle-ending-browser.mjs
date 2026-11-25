import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const stateAnchor = '    useEffect(() => { stateRef.current = gameState; }, [gameState]);';
const seedBattle = `
    useEffect(() => {
        Object.assign(window, { __mainBattleEndingQA: {
            seed: ({ kind, theme }) => {
                const legacyName = '何度も合成したカード'.repeat(90);
                const longCard = synthesizeCards(
                    { ...CARDS_LIBRARY[kind === 'execute' ? 'EXPULSION' : 'TWIN_STRIKE'], id: 'qa-source-a' },
                    { ...CARDS_LIBRARY[kind === 'execute' ? 'DEFEND' : 'STRIKE'], id: 'qa-source-b' },
                );
                const fusedCard = { ...longCard, id: 'qa-fused', name: legacyName };
                if (kind === 'many-hits') Object.assign(fusedCard, { damage: 1, block: 2, heal: 1, playCopies: 59 });
                const finisher = { ...CARDS_LIBRARY.STRIKE, id: 'qa-finisher', name: legacyName, damage: 400, originalNames: ['えんぴつ攻撃', '往復ビンタ'], illustrationRefs: ['card:えんぴつ攻撃', 'card:往復ビンタ'] };
                setGameState(prev => ({
                    ...prev,
                    screen: GameScreen.BATTLE, visualTheme: theme, act: 4, floor: 17, turn: 2, isEndless: false,
                    player: { ...createInitialPlayer(), currentEnergy: 3, currentHp: 40,
                        deck: [fusedCard, finisher, ...Array.from({ length: 24 }, (_, index) => ({
                            ...CARDS_LIBRARY.DEFEND, id: 'qa-deck-' + index,
                        }))],
                        hand: [fusedCard, finisher], drawPile: [], discardPile: [],
                    },
                    enemies: [{ id: 'qa-principal', enemyType: 'THE_HEART', name: getTrueBossByTheme(theme).name,
                        phase: kind === 'many-hits' ? 2 : kind === 'execute' ? undefined : 1,
                        currentHp: kind === 'many-hits' ? 300 : 1, maxHp: kind === 'many-hits' ? 300 : 42,
                        block: 0, strength: 0, nextIntent: { type: EnemyIntentType.BUFF, value: 0 },
                        weak: 0, vulnerable: 0, poison: kind === 'poison' ? 3 : 0, artifact: 0, corpseExplosion: false, floatingText: null,
                    }],
                    selectedEnemyId: 'qa-principal', activeEffects: [], combatLog: [],
                }));
            },
            read: () => {
                const { screen, turn, enemies, activeEffects, player, combatLog } = stateRef.current;
                return { screen, turn, enemies, effectCount: activeEffects.length, block: player.block,
                    hp: player.currentHp, maxHp: player.maxHp,
                    hand: player.hand.map(card => card.id), combatLog,
                    storedCardName: player.deck.find(card => card.id === 'qa-fused')?.name };
            },
        } });
    }, []);`;

const artifacts = await mkdtemp(join(tmpdir(), 'main-battle-ending-'));
const vite = await createServer({
    cacheDir: 'node_modules/.vite-main-battle-ending', logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
    plugins: [{
        name: 'seed-main-battle-ending-test', enforce: 'pre',
        transform(code, id) {
            if (!id.replaceAll('\\', '/').endsWith('/src/App.tsx')) return;
            assert(code.includes(stateAnchor), 'Main battle fixture anchor changed');
            return code.replace(stateAnchor, stateAnchor + seedBattle);
        },
    }],
});
let browser;
try {
    await vite.listen();
    const executablePath = process.env.CHROMIUM_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
    browser = await chromium.launch({ executablePath,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const cases = [
        { kind: 'direct', theme: 'high-school', width: 844, height: 390, phaseHp: 31 },
        { kind: 'execute', theme: 'elementary', width: 390, height: 844, phaseHp: 42 },
        { kind: 'many-hits', theme: 'magic', width: 568, height: 320, phaseHp: 240 },
        { kind: 'poison', theme: 'elementary', width: 390, height: 844, phaseHp: 42 },
    ].filter(options => !process.argv[2] || options.kind === process.argv[2]);
    assert(cases.length, 'Unknown battle test case');
    for (const options of cases) {
        const { kind, theme, width, height, phaseHp } = options;
        const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true,
            serviceWorkers: 'block', deviceScaleFactor: 1,
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
        if (kind === 'execute') await context.route('**/sprites/endings/**', route => route.abort());
        await page.addInitScript((theme) => {
            localStorage.setItem('learning-rogue-visual-theme', theme);
            localStorage.setItem('pixel_spire_language_mode_v1', 'JAPANESE');
            localStorage.setItem('learning_rogue_online_ranking_initial_prompt_declined_v1', '1');
            localStorage.setItem('pixel_spire_student_profile_v1', JSON.stringify({ grade: '小学5年生', name: '動作確認', schoolYear: 2026 }));
            for (const key of ['battle_tutorial', 'parry_tutorial', 'retain_card_hint', 'exhaust_card_hint', 'magic_transformation_tutorial', 'friendship_combo_tutorial']) {
                localStorage.setItem('pixel_spire_seen_' + key + '_v1', 'true');
            }
        }, theme);
        try {
            await page.goto('http://127.0.0.1:' + vite.httpServer.address().port + '/', { waitUntil: 'domcontentloaded', timeout: 120000 });
            await page.waitForFunction(() => window.__mainBattleEndingQA, null, { timeout: 120000 });
            await page.evaluate(options => window.__mainBattleEndingQA.seed(options), options);
            const play = id => page.locator('[data-gamepad-zone="battle-cards"][data-card-id="' + id + '"]').tap({ timeout: 12000 });
            if (kind === 'poison') {
                await page.getByRole('button', { name: 'ターン終了', exact: true }).tap({ timeout: 12000 });
                await page.waitForFunction(() => window.__mainBattleEndingQA.read().turn === 3, null, { timeout: 12000 });
            } else {
                await play('qa-fused');
                await page.waitForFunction(() => !window.__mainBattleEndingQA.read().hand.includes('qa-fused'), null, { timeout: 12000 });
            }
            const result = await page.evaluate(() => window.__mainBattleEndingQA.read());
            assert.equal(result.enemies[0]?.phase, 2, kind + ' must leave the second form active: ' + JSON.stringify(result.combatLog).slice(-600));
            assert.equal(result.enemies[0].currentHp, phaseHp, kind + ' preserves applied damage');
            if (kind === 'many-hits') {
                assert.equal(result.block, 120, 'All hits still apply Block');
                assert.equal(result.hp, Math.min(result.maxHp, 100), 'All hits still apply healing');
                assert.ok(result.effectCount <= 36, 'Multi-hit presentation must be bounded, saw ' + result.effectCount);
            }
            assert.equal(result.storedCardName, '何度も合成したカード'.repeat(90), 'The original fused card name stays intact');
            await page.screenshot({ path: join(artifacts, kind + '-phase2.png') });
            await play('qa-finisher');
            await page.locator('[data-battle-finisher]').waitFor({ timeout: 6000 });
            await page.waitForFunction(() => window.__mainBattleEndingQA.read().screen === 'ENDING', null, { timeout: 12000 });
            assert.equal(await page.locator('[data-battle-finisher]').count(), 0, 'The cut-in must be gone before the ending');
            assert.equal(await page.evaluate(() => window.__mainBattleEndingQA.read().effectCount), 0, 'Battle effects must be cleared at the ending');
            const story = page.locator('.themed-ending-sequence');
            for (let index = 0; index < 6 && await story.count(); index++) {
                const button = story.locator('button[data-gamepad-initial-choice]');
                const box = await button.boundingBox();
                assert(box && box.y >= 0 && box.y + box.height <= height + 1, 'Ending story action outside viewport: ' + JSON.stringify(box));
                await button.tap({ timeout: 4000 });
            }
            const ending = page.locator('.ending-screen');
            await ending.waitFor({ timeout: 12000 });
            assert.equal(await page.getByText('素材をバックグラウンド読み込み中', { exact: true }).count(), 0);
            await page.screenshot({ path: join(artifacts, kind + '-results.png') });
            const titleButton = ending.getByRole('button', { name: /タイトルへ戻る/ });
            const resultButton = await titleButton.boundingBox();
            assert(resultButton && resultButton.y >= 0 && resultButton.y + resultButton.height <= height + 1, 'Title button outside the viewport: ' + JSON.stringify(resultButton));
            const victories = await page.evaluate(() => JSON.parse(localStorage.getItem('pixel_spire_ranking_v1') || '[]').filter(entry => entry.victory).length);
            assert.equal(victories, 1, 'A single battle must record one victory');
            if (kind === 'direct') {
                await ending.locator('.ending-legacy [data-card-id="qa-fused"]').tap({ timeout: 6000 });
                const carry = await page.evaluate(() => JSON.parse(localStorage.getItem('pixel_spire_legacy_card_v1') || 'null'));
                assert.equal(carry?.name, result.storedCardName, 'An inherited card retains its full synthesized name');
                assert.equal(carry?.damage, 11);
            }
            const openEndless = kind === 'many-hits';
            await (openEndless ? ending.getByRole('button', { name: /エンドレスモードへ/ }) : titleButton).tap({ timeout: 6000 });
            await page.waitForFunction(screen => window.__mainBattleEndingQA.read().screen === screen,
                openEndless ? 'ENDLESS_OPENING' : 'START_MENU', { timeout: 6000 });
            assert.deepEqual(errors, []);
            console.log('PASS', kind, 'principal battle and ending at', width + 'x' + height);
        } catch (error) {
            console.error('BATTLE QA', kind, errors, artifacts);
            await page.screenshot({ path: join(artifacts, kind + '-failure.png'), timeout: 3000 }).catch(() => {});
            throw error;
        } finally { await context.close(); }
    }
    console.log('QA screenshots', artifacts);
} finally {
    await browser?.close();
    await vite.close();
}
