import React, { useEffect, useState } from 'react';
import PixelSprite from './PixelSprite';
import { getEnemyIllustrationPaths } from '../utils/enemyIllustration';
import { getThemedHumanoidEnemySpritePath, getThemedMonsterEnemySpritePath, type HighSchoolEnemyAction, type VisualThemeId } from '../data/visualThemes';

interface EnemyIllustrationProps {
  name: string;
  seed: string;
  aliases?: string[];
  className?: string;
  size?: number;
  visualTheme?: VisualThemeId;
  enemyType?: string;
  phase?: number;
  action?: HighSchoolEnemyAction;
}

const EnemyIllustration: React.FC<EnemyIllustrationProps> = ({ name, seed, aliases = [], className = '', size = 16, visualTheme = 'elementary', enemyType = 'GENERIC', phase, action = 'idle' }) => {
  const enemyRef = { name, enemyType, phase };
  const humanoidPath = getThemedHumanoidEnemySpritePath(enemyRef, visualTheme, action);
  const humanoidIdlePath = action !== 'idle'
    ? getThemedHumanoidEnemySpritePath(enemyRef, visualTheme, 'idle')
    : null;
  const monsterPath = getThemedMonsterEnemySpritePath(enemyRef, visualTheme);
  const imagePaths = humanoidPath
    ? Array.from(new Set([humanoidPath, humanoidIdlePath].filter(Boolean) as string[]))
    : monsterPath
    ? [monsterPath]
    : getEnemyIllustrationPaths(name, aliases);
  const [pathIndex, setPathIndex] = useState(0);
  const [imageStatus, setImageStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    setPathIndex(0);
    setImageStatus('loading');
  }, [name, aliases.join('|'), visualTheme, enemyType, phase, action]);

  return (
    <div className={`relative ${className}`}>
      {imageStatus === 'error' && (
        <PixelSprite seed={seed} name={name} className="w-full h-full" size={size} />
      )}
      <img
        src={imagePaths[pathIndex]}
        alt={name}
        className={`absolute inset-0 w-full h-full object-contain ${imageStatus === 'error' ? 'opacity-0 pointer-events-none' : ''}`}
        onLoad={() => setImageStatus('loading')}
        onError={() => {
          if (pathIndex + 1 < imagePaths.length) {
            setPathIndex(pathIndex + 1);
            setImageStatus('loading');
            return;
          }
          setImageStatus('error');
        }}
        draggable={false}
      />
    </div>
  );
};

export default EnemyIllustration;
