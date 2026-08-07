import { BATTLE_BACKGROUND_SCENES } from '../data/battleBackgrounds';
import { MAGIC_ASSET_PATHS } from '../data/magicAssetManifest';
import type { VisualThemeId } from '../data/visualThemes';
import { assetUrl } from '../utils/assetPaths';
import { WEB_PERFORMANCE_MODE } from '../config/runtime';

const ATTACK_EFFECT_KEYS = [
    'slash',
    'impact',
    'projectile',
    'fire',
    'lightning',
    'poison',
    'shockwave',
    'multihit',
    'drain',
    'finisher',
    'laser',
    'soundwave',
    'wind',
    'plant',
    'graduation',
    'explosion',
    'critical',
    'flash',
] as const;

const STATUS_EFFECT_KEYS = [
    'block',
    'buff',
    'debuff',
    'heal',
    'poison',
    'strength',
    'vulnerable',
    'weak',
] as const;

const SCREEN_BACKGROUND_PATHS = [
    'sprites/backgrounds/learning-rogue/map-campus.webp',
    'sprites/backgrounds/learning-rogue/map-indoor.webp',
    'sprites/backgrounds/learning-rogue/map-festival.webp',
    'sprites/backgrounds/learning-rogue/selection-entrance.webp',
    'sprites/backgrounds/learning-rogue/event-hallway.webp',
    'sprites/backgrounds/learning-rogue/rest-infirmary.webp',
    'sprites/backgrounds/learning-rogue/reward-rooftop.webp',
    'sprites/backgrounds/learning-rogue/shop-store.webp',
    'sprites/backgrounds/learning-rogue/treasure-storage.webp',
    'sprites/backgrounds/learning-rogue/compendium-library.webp',
];

const HIGH_SCHOOL_BACKGROUND_PATHS = [
    'sprites/high-school/title-background.webp',
    'sprites/backgrounds/learning-rogue/high-school-map.webp',
    'sprites/backgrounds/learning-rogue/high-school-map-act1.webp',
    'sprites/backgrounds/learning-rogue/high-school-map-act2.webp',
    'sprites/backgrounds/learning-rogue/high-school-map-act3.webp',
    'sprites/backgrounds/learning-rogue/high-school-map-act4.webp',
];

const range = (count: number) => Array.from({ length: count }, (_, index) => index);

const isResolvedAssetUrl = (path: string): boolean =>
    /^(data:|blob:|https?:|\/)/.test(path);

const normalizeAssetPath = (path: string): string =>
    isResolvedAssetUrl(path) ? path : assetUrl(path);

const buildCriticalAssetPaths = (visualTheme: VisualThemeId): string[] => {
    const paths = WEB_PERFORMANCE_MODE
        ? []
        : [
            ...BATTLE_BACKGROUND_SCENES.map(scene => scene.image),
            ...SCREEN_BACKGROUND_PATHS,
            ...ATTACK_EFFECT_KEYS.map(key => `sprites/attack-vfx-${key}.webp`),
            ...STATUS_EFFECT_KEYS.map(key => `sprites/status-vfx-${key}.webp`),
        ];

    if (WEB_PERFORMANCE_MODE) {
        if (visualTheme === 'high-school') {
            paths.push(
                'sprites/high-school/title-background.webp',
                'sprites/backgrounds/learning-rogue/high-school-map.webp',
            );
        }

        if (visualTheme === 'magic') {
            paths.push(
                'sprites/magic/title-background.webp',
                'sprites/backgrounds/learning-rogue/magic-map-act1.webp',
                'sprites/backgrounds/learning-rogue/magic-selection-entrance.webp',
                'sprites/backgrounds/learning-rogue/magic-battle-classroom.webp',
                'sprites/backgrounds/learning-rogue/magic-battle-hallway.webp',
                'sprites/backgrounds/learning-rogue/magic-battle-gym.webp',
            );
        }

        return paths;
    }

    if (visualTheme === 'high-school') {
        paths.push(
            ...HIGH_SCHOOL_BACKGROUND_PATHS,
            ...range(9).map(index => `sprites/high-school/characters/${index}.webp`),
            ...range(12).map(index => `sprites/high-school/enemies/${index}.webp`),
            ...range(12).map(index => `sprites/high-school/humanoid-enemies/${index}.webp`),
        );
    }

    if (visualTheme === 'magic') {
        paths.push(
            'sprites/magic/title-background.webp',
            ...range(4).map(index => `sprites/backgrounds/learning-rogue/magic-map-act${index + 1}.webp`),
            'sprites/backgrounds/learning-rogue/magic-selection-entrance.webp',
            'sprites/backgrounds/learning-rogue/magic-event-hallway.webp',
            'sprites/backgrounds/learning-rogue/magic-reward-sanctuary.webp',
            'sprites/backgrounds/learning-rogue/magic-rest-infirmary.webp',
            'sprites/backgrounds/learning-rogue/magic-shop-store.webp',
            'sprites/backgrounds/learning-rogue/magic-treasure-vault.webp',
            'sprites/backgrounds/learning-rogue/magic-compendium-library.webp',
            ...range(9).map(index => `sprites/magic/characters/heroine-${String(index + 1).padStart(2, '0')}-before.webp`),
            ...range(8).map(index => `sprites/magic/male-characters/${['ren', 'soma', 'minato', 'riku', 'yamato', 'leon', 'elliot', 'sakuya'][index]}-before.webp`),
            ...range(12).map(index => `sprites/magic/enemies/${index}.webp`),
            ...range(10).map(index => `sprites/magic/humanoid-enemies/${index}.webp`),
        );
    }

    return paths;
};

const buildDeferredAssetPaths = (visualTheme: VisualThemeId): string[] => {
    if (WEB_PERFORMANCE_MODE) return [];

    if (visualTheme === 'high-school') {
        return [
            ...range(9).flatMap(index => [
                `sprites/high-school/characters-attack/${index}.webp`,
                `sprites/high-school/characters-skill/${index}.webp`,
            ]),
            ...range(50).map(index => `sprites/high-school/enemies/${index}.webp`),
            ...range(53).flatMap(index => [
                `sprites/high-school/humanoid-enemies/${index}.webp`,
                `sprites/high-school/humanoid-enemies-attack/${index}.webp`,
                `sprites/high-school/humanoid-enemies-skill/${index}.webp`,
            ]),
            ...range(25).map(index => `sprites/high-school/cards/${index}.webp`),
        ];
    }

    if (visualTheme === 'magic') {
        return MAGIC_ASSET_PATHS;
    }

    return [];
};

class AssetPreloadService {
    private imagePromises = new Map<string, Promise<void>>();
    private essentialPromises = new Map<VisualThemeId, Promise<void>>();
    private deferredPromises = new Map<VisualThemeId, Promise<void>>();
    private readonly criticalPreloadConcurrency = 3;
    private readonly deferredPreloadConcurrency = 2;

    preloadEssentialGameAssets(visualTheme: VisualThemeId): Promise<void> {
        const cached = this.essentialPromises.get(visualTheme);
        if (cached) return cached;

        const promise = this.preloadImages(buildCriticalAssetPaths(visualTheme), this.criticalPreloadConcurrency);
        this.essentialPromises.set(visualTheme, promise);
        return promise;
    }

    preloadDeferredGameAssets(visualTheme: VisualThemeId): Promise<void> {
        const cached = this.deferredPromises.get(visualTheme);
        if (cached) return cached;

        if (WEB_PERFORMANCE_MODE) {
            const promise = Promise.resolve();
            this.deferredPromises.set(visualTheme, promise);
            return promise;
        }

        const promise = this.waitForIdle(1200)
            .then(() => this.preloadImages(buildDeferredAssetPaths(visualTheme), this.deferredPreloadConcurrency));
        this.deferredPromises.set(visualTheme, promise);
        return promise;
    }

    private preloadImages(paths: string[], concurrency: number): Promise<void> {
        const sources = Array.from(new Set(paths.map(normalizeAssetPath)));
        return this.preloadImagesInBackgroundBatches(sources, concurrency);
    }

    private async preloadImagesInBackgroundBatches(sources: string[], concurrency: number): Promise<void> {
        for (let index = 0; index < sources.length; index += concurrency) {
            const batch = sources.slice(index, index + concurrency);
            await Promise.all(batch.map(src => this.preloadImage(src)));
            await this.yieldToMainThread();
        }
    }

    private yieldToMainThread(): Promise<void> {
        return new Promise(resolve => {
            const requestIdle = (window as any).requestIdleCallback as ((callback: () => void, options?: { timeout: number }) => number) | undefined;
            if (requestIdle) {
                requestIdle(() => resolve(), { timeout: 250 });
                return;
            }
            window.setTimeout(resolve, 0);
        });
    }

    private waitForIdle(timeout: number): Promise<void> {
        return new Promise(resolve => {
            window.setTimeout(() => {
                const requestIdle = (window as any).requestIdleCallback as ((callback: () => void, options?: { timeout: number }) => number) | undefined;
                if (requestIdle) {
                    requestIdle(() => resolve(), { timeout });
                    return;
                }
                resolve();
            }, timeout);
        });
    }

    private preloadImage(src: string): Promise<void> {
        const cached = this.imagePromises.get(src);
        if (cached) return cached;

        if (typeof Image === 'undefined') {
            return Promise.resolve();
        }

        const promise = new Promise<void>(resolve => {
            const image = new Image();
            const timeoutId = window.setTimeout(() => {
                image.onload = null;
                image.onerror = null;
                resolve();
            }, 15000);
            const finish = () => {
                window.clearTimeout(timeoutId);
                resolve();
            };
            image.decoding = 'async';
            image.loading = 'eager';
            (image as HTMLImageElement & { fetchPriority?: 'high' | 'low' | 'auto' }).fetchPriority = 'low';
            image.onload = finish;
            image.onerror = finish;
            image.src = src;
        });

        this.imagePromises.set(src, promise);
        return promise;
    }
}

export const assetPreloadService = new AssetPreloadService();
