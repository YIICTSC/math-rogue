export const sourceAssetDirectories = [
  'sprites/high-school/sheets',
  'sprites/magic/generated-sources',
  'sprites/magic/sheets',
  'sprites/magic/cards/male-sheets',
  'sprites/magic/cards/sheets',
  'sprites/magic/events/character-sheets',
  'sprites/magic/events/friendship-male-sheets',
  'sprites/magic/events/romance-sheets',
  'sprites/magic/events/romance/generated-sheets',
  'sprites/magic/events/romance-review',
  'sprites/magic/events/double-romance/review',
  'sprites/magic/events/sheets',
  'sprites/magic/references',
];

export const sourceAssetFiles = [
  'sprites/furai-sfc-v2-armor1-source.webp',
  'sprites/furai-sfc-v2-armor2-source.webp',
  'sprites/furai-sfc-v2-effects-source.webp',
  'sprites/furai-sfc-v2-enemy-source.webp',
  'sprites/furai-sfc-v2-hero-source.webp',
  'sprites/furai-sfc-v2-items1-source.webp',
  'sprites/furai-sfc-v2-items2-source.webp',
  'sprites/furai-sfc-v2-weapons1-source.webp',
  'sprites/furai-sfc-v2-weapons2-source.webp',
  'sprites/learning-rogue-logo-emblem-source.webp',
  'sprites/magic/magic-heroines-cutout-preview.webp',
  'sprites/magic/magic-humanoids-preview.webp',
  'sprites/magic/magic-monsters-preview.webp',
  'sprites/magic/title-background-preview.webp',
  'sprites/magic/effects/transformation-sheet-source.webp',
];

export const isSourceAsset = (relativePath) =>
  sourceAssetFiles.includes(relativePath)
  || sourceAssetDirectories.some(directory => relativePath === directory || relativePath.startsWith(`${directory}/`));
