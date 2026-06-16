import { MAGIC_BATTLE_BACKGROUND_SCENES } from './battleBackgrounds';
import { MAGIC_HEROES, MAGIC_MALE_PROTAGONISTS } from './magicHeroes';
import { MAGIC_FRIENDSHIP_ROUTES } from './magicFriendshipRoutes';
import { MAGIC_EVENT_IMAGE_MANIFEST } from './romanceEvents';
import { ROMANCE_TARGETS } from './romanceTargets';

const range = (count: number) => Array.from({ length: count }, (_, index) => index);

const magicHeroIds = [...MAGIC_HEROES.map(hero => hero.id), ...MAGIC_MALE_PROTAGONISTS.map(hero => hero.id)];
const friendshipEventPaths = MAGIC_FRIENDSHIP_ROUTES.flatMap(route => {
  const match = route.imageKey.match(/^magic-friendship:([^:]+):([^:]+)$/);
  return match ? [`sprites/magic/events/friendship/${match[1]}/${match[2]}/event.webp`] : [];
});
const pairPaths = (folder: 'female' | 'male', ids: string[]) =>
  ids.flatMap((firstId, firstIndex) =>
    ids.slice(firstIndex + 1).map(secondId => `sprites/magic/events/double-romance/${folder}/${firstId}-${secondId}.webp`)
  );
const doubleRomanceEventPaths = [
  ...pairPaths('female', MAGIC_HEROES.map(hero => hero.id)),
  ...pairPaths('male', ROMANCE_TARGETS.map(target => target.id)),
];

export const MAGIC_ASSET_PATHS = Array.from(new Set([
  'sprites/magic/title-background.webp',
  ...range(4).map(index => `sprites/backgrounds/learning-rogue/magic-map-act${index + 1}.webp`),
  'sprites/backgrounds/learning-rogue/magic-selection-entrance.webp',
  'sprites/backgrounds/learning-rogue/magic-event-hallway.webp',
  'sprites/backgrounds/learning-rogue/magic-reward-sanctuary.webp',
  'sprites/backgrounds/learning-rogue/magic-rest-infirmary.webp',
  'sprites/backgrounds/learning-rogue/magic-shop-store.webp',
  'sprites/backgrounds/learning-rogue/magic-treasure-vault.webp',
  'sprites/backgrounds/learning-rogue/magic-compendium-library.webp',
  'sprites/backgrounds/learning-rogue/magic-final-bridge.webp',
  'sprites/backgrounds/learning-rogue/magic-act-clear.webp',
  ...MAGIC_BATTLE_BACKGROUND_SCENES.map(scene => scene.image),
  'sprites/magic/magic-heroines-cutout-preview.png',
  'sprites/magic/effects/transformation-sheet.webp',
  'event-illustrations/magic-romance-select.webp',
  ...MAGIC_HEROES.flatMap(hero => {
    const id = String(hero.index).padStart(2, '0');
    return [
      `sprites/magic/characters/heroine-${id}-before.png`,
      `sprites/magic/characters-attack/heroine-${id}-before.png`,
      `sprites/magic/characters-skill/heroine-${id}-before.png`,
      `sprites/magic/characters/heroine-${id}-after.png`,
      `sprites/magic/characters-attack/heroine-${id}-after.png`,
      `sprites/magic/characters-skill/heroine-${id}-after.png`,
    ];
  }),
  ...MAGIC_MALE_PROTAGONISTS.flatMap(hero => [
    `sprites/magic/male-characters/${hero.assetId}-before.png`,
    `sprites/magic/male-characters-attack/${hero.assetId}-before.png`,
    `sprites/magic/male-characters-skill/${hero.assetId}-before.png`,
    `sprites/magic/male-characters/${hero.assetId}-after.png`,
    `sprites/magic/male-characters-attack/${hero.assetId}-after.png`,
    `sprites/magic/male-characters-skill/${hero.assetId}-after.png`,
  ]),
  ...range(45).map(index => `sprites/magic/enemies/${index}.png`),
  ...range(22).flatMap(index => [
    `sprites/magic/humanoid-enemies/${index}.png`,
    `sprites/magic/humanoid-enemies-attack/${index}.png`,
    `sprites/magic/humanoid-enemies-skill/${index}.png`,
  ]),
  ...range(51).map(index => `sprites/magic/cards/${index}.webp`),
  ...range(20).map(index => `sprites/magic/events/${index}.webp`),
  ...magicHeroIds.flatMap(heroId => [
    `sprites/magic/basic-cards/${heroId}/strike.webp`,
    `sprites/magic/basic-cards/${heroId}/guard.webp`,
    `sprites/magic/basic-cards/${heroId}/focus.webp`,
    `sprites/magic/rule-cards/${heroId}/0.webp`,
    `sprites/magic/rule-cards/${heroId}/1.webp`,
    `sprites/magic/rule-cards/${heroId}/2.webp`,
    `sprites/magic/relics/${heroId}.webp`,
    `sprites/magic/rules/${heroId}/ui.webp`,
    `sprites/magic/rules/${heroId}/crest.webp`,
  ]),
  ...MAGIC_EVENT_IMAGE_MANIFEST
    .filter(item => item.assetStatus === 'ready')
    .map(item => item.imagePath),
  ...friendshipEventPaths,
  ...doubleRomanceEventPaths,
]));
