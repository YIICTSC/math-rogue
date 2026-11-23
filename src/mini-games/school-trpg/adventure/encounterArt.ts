import type { Biome, Text } from './content';
import type { Feature } from './world';

export const ILLUSTRATED_ENCOUNTERS = ['cache', 'vein', 'runes', 'trap', 'sanctum'] as const;
type IllustratedEncounter = (typeof ILLUSTRATED_ENCOUNTERS)[number];

export function encounterImage(feature: Feature | undefined, biome: Biome) {
  if (feature === 'stairs') return stairsImage(biome, 'down');
  return feature && ILLUSTRATED_ENCOUNTERS.includes(feature as IllustratedEncounter)
    ? 'encounters/' + feature + '-' + biome
    : null;
}

const LADDER_BIOMES: readonly Biome[] = ['grove', 'coast', 'sky'];
export const stairsImage = (biome: Biome, direction: 'up' | 'down') =>
  'encounters/stairs-' + direction + '-' + biome;

export function stairsName(biome: Biome, direction: 'up' | 'down'): Text {
  if (LADDER_BIOMES.includes(biome))
    return direction === 'up'
      ? ['上りはしご', 'Ladder up', 'のぼり はしご']
      : ['下りはしご', 'Ladder down', 'くだり はしご'];
  return direction === 'up'
    ? ['上り階段', 'Stairs up', 'のぼり かいだん']
    : ['下り階段', 'Stairs down', 'くだり かいだん'];
}
