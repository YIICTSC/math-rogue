import React from 'react';
import { assetUrl } from '../utils/assetPaths';

interface ItemIconProps {
  id: string;
  className?: string;
  alt?: string;
}

const iconClass = (className = '', pixelated = true) =>
  `block h-full w-full object-contain ${pixelated ? '[image-rendering:pixelated]' : ''} ${className}`;

export const RelicIcon: React.FC<ItemIconProps> = ({ id, className, alt = '' }) => (
  <img
    src={assetUrl(id.startsWith('MAGIC_RELIC_')
      ? `sprites/magic/relics/${id.replace('MAGIC_RELIC_', '')}.webp`
      : `sprites/relic-icons/${id}.webp`)}
    alt={alt}
    className={iconClass(className, !id.startsWith('MAGIC_RELIC_'))}
    draggable={false}
  />
);

export const PotionIcon: React.FC<ItemIconProps> = ({ id, className, alt = '' }) => (
  <img
    src={assetUrl(`sprites/potion-icons/${id}.webp`)}
    alt={alt}
    className={iconClass(className)}
    draggable={false}
  />
);
