import React from 'react';
import { RELIC_LIBRARY } from '../constants';
import { assetUrl } from '../utils/assetPaths';

interface ItemIconProps {
  id: string;
  className?: string;
  alt?: string;
}

const iconClass = (className = '', pixelated = true) =>
  `block h-full w-full object-contain ${pixelated ? '[image-rendering:pixelated]' : ''} ${className}`;

const RELIC_ICON_COUNT = 66;
const RELIC_SPRITE_COLUMNS = 5;
const RELIC_SPRITE_ROWS = 5;
const RELIC_IDS = Object.keys(RELIC_LIBRARY);

const getRelicSpritePosition = (id: string) => {
  const relicIndex = RELIC_IDS.indexOf(id);
  if (relicIndex < RELIC_ICON_COUNT) return null;

  const sheetIndex = Math.floor(relicIndex / 25);
  const sheetStart = sheetIndex * 25 + 1;
  const sheetEnd = Math.min(sheetStart + 24, RELIC_IDS.length);
  const sheetSlot = relicIndex % 25;
  const column = sheetSlot % RELIC_SPRITE_COLUMNS;
  const row = Math.floor(sheetSlot / RELIC_SPRITE_COLUMNS);

  return {
    path: `sprites/relics-200/relics-${String(sheetStart).padStart(3, '0')}-${String(sheetEnd).padStart(3, '0')}.png`,
    position: `${column * (100 / (RELIC_SPRITE_COLUMNS - 1))}% ${row * (100 / (RELIC_SPRITE_ROWS - 1))}%`,
  };
};

export const RelicIcon: React.FC<ItemIconProps> = ({ id, className, alt = '' }) => {
  const craftIndex:Record<string,number>={sword:2,frostbow:3,charm:4,crystal:5};
  if(id.startsWith('RPG_CRAFT:')&&craftIndex[id.slice(10)]!==undefined)return <span role="img" aria-label={alt||undefined} className={`${iconClass(className,false)} bg-no-repeat`} style={{backgroundImage:`url(${assetUrl('sprites/rpg/craft-items.webp')})`,backgroundSize:'400% 300%',backgroundPosition:`${craftIndex[id.slice(10)]%4*100/3}% ${Math.floor(craftIndex[id.slice(10)]/4)*50}%`}}/>;
  const sprite = id.startsWith('MAGIC_RELIC_') ? null : getRelicSpritePosition(id);

  if (!sprite) {
    return (
      <img
        src={assetUrl(id.startsWith('MAGIC_RELIC_')
          ? `sprites/magic/relics/${id.replace('MAGIC_RELIC_', '')}.webp`
          : `sprites/relic-icons/${id}.webp`)}
        alt={alt}
        className={iconClass(className, !id.startsWith('MAGIC_RELIC_'))}
        draggable={false}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={alt || undefined}
      className={`${iconClass(className)} bg-no-repeat`}
      style={{
        backgroundImage: `url(${assetUrl(sprite.path)})`,
        backgroundPosition: sprite.position,
        backgroundSize: '500% 500%',
      }}
    />
  );
};

export const PotionIcon: React.FC<ItemIconProps> = ({ id, className, alt = '' }) => (
  <img
    src={assetUrl(`sprites/potion-icons/${id}.webp`)}
    alt={alt}
    className={iconClass(className)}
    draggable={false}
  />
);
