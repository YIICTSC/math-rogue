export const MATERIALS = ['wood', 'stone', 'seed', 'crop', 'fish', 'plank', 'brick', 'flower', 'lamp', 'bench', 'roof', 'fence', 'window', 'campfire', 'fruit', 'meal'] as const;
export type Material = typeof MATERIALS[number];
export const BUILDINGS = ['plank', 'brick', 'flower', 'lamp', 'bench', 'roof', 'fence', 'window', 'campfire'] as const;
export type Building = typeof BUILDINGS[number];
export const CRAFTABLES = [...BUILDINGS, 'meal'] as const;
export type Craftable = typeof CRAFTABLES[number];
export const RECIPES: Record<Craftable, Partial<Record<Material, number>>> = { plank: { wood: 2 }, brick: { stone: 2 }, flower: { crop: 1 }, lamp: { wood: 2, stone: 1 }, bench: { plank: 2 }, roof: { plank: 2, stone: 1 }, fence: { wood: 2 }, window: { stone: 3 }, campfire: { wood: 3, stone: 2 }, meal: { crop: 2, fish: 1, fruit: 1 } };
export type Inventory = Record<Material, number>;
