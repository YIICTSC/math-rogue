import React from 'react';

interface ItemIconProps {
  id: string;
  className?: string;
  alt?: string;
}

const iconClass = (className = '') =>
  `block h-full w-full object-contain [image-rendering:pixelated] ${className}`;

export const RelicIcon: React.FC<ItemIconProps> = ({ id, className, alt = '' }) => (
  <img
    src={`/sprites/relic-icons/${id}.webp`}
    alt={alt}
    className={iconClass(className)}
    draggable={false}
  />
);

export const PotionIcon: React.FC<ItemIconProps> = ({ id, className, alt = '' }) => (
  <img
    src={`/sprites/potion-icons/${id}.webp`}
    alt={alt}
    className={iconClass(className)}
    draggable={false}
  />
);
