import { BATTLE_BACKGROUND_SCENES } from '../data/battleBackgrounds';
import { MAGIC_ASSET_PATHS } from '../data/magicAssetManifest';
import type { VisualThemeId } from '../data/visualThemes';
import { assetUrl } from '../utils/assetPaths';

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

const buildEssentialAssetPaths = (visualTheme: VisualThemeId): string[] => {
    const paths = [
        ...BATTLE_BACKGROUND_SCENES.map(scene => scene.image),
        ...SCREEN_BACKGROUND_PATHS,
        ...ATTACK_EFFECT_KEYS.map(key => `sprites/attack-vfx-${key}.webp`),
        ...STATUS_EFFECT_KEYS.map(key => `sprites/status-vfx-${key}.webp`),
    ];

    if (visualTheme === 'high-school') {
        paths.push(
            ...HIGH_SCHOOL_BACKGROUND_PATHS,
            ...range(9).flatMap(index => [
                `sprites/high-school/characters/${index}.png`,
                `sprites/high-school/characters-attack/${index}.png`,
                `sprites/high-school/characters-skill/${index}.png`,
            ]),
            ...range(50).map(index => `sprites/high-school/enemies/${index}.png`),
            ...range(53).flatMap(index => [
                `sprites/high-school/humanoid-enemies/${index}.png`,
                `sprites/high-school/humanoid-enemies-attack/${index}.png`,
                `sprites/high-school/humanoid-enemies-skill/${index}.png`,
            ]),
            ...range(25).map(index => `sprites/high-school/cards/${index}.webp`),
        );
    }

    if (visualTheme === 'magic') {
        paths.push(
            ...MAGIC_ASSET_PATHS,
        );
    }

    return paths;
};

class AssetPreloadService {
    private imagePromises = new Map<string, Promise<void>>();
    private essentialPromises = new Map<VisualThemeId, Promise<void>>();
    private readonly preloadConcurrency = 4;

    preloadEssentialGameAssets(visualTheme: VisualThemeId): Promise<void> {
        const cached = this.essentialPromises.get(visualTheme);
        if (cached) return cached;

        const promise = this.preloadImages(buildEssentialAssetPaths(visualTheme));
        this.essentialPromises.set(visualTheme, promise);
        return promise;
    }

    private preloadImages(paths: string[]): Promise<void> {
        const sources = Array.from(new Set(paths.map(path => assetUrl(path))));
        return this.preloadImagesInBackgroundBatches(sources);
    }

    private async preloadImagesInBackgroundBatches(sources: string[]): Promise<void> {
        for (let index = 0; index < sources.length; index += this.preloadConcurrency) {
            const batch = sources.slice(index, index + this.preloadConcurrency);
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
            image.onload = finish;
            image.onerror = finish;
            image.src = src;
        });

        this.imagePromises.set(src, promise);
        return promise;
    }
}

export const assetPreloadService = new AssetPreloadService();
