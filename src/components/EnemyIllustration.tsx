import React, { useEffect, useState } from 'react';
import PixelSprite from './PixelSprite';
import { getEnemyIllustrationPaths } from '../utils/enemyIllustration';
import { isLegacySpriteModeEnabled } from '../utils/legacySpriteMode';
import { getThemedHumanoidEnemySpritePath, getThemedMonsterEnemySpritePath, type HighSchoolEnemyAction, type VisualThemeId } from '../data/visualThemes';
import { assetUrl } from '../utils/assetPaths';

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
  altText?: string;
}

const EnemyIllustration: React.FC<EnemyIllustrationProps> = ({ name, seed, aliases = [], className = '', size = 16, visualTheme = 'elementary', enemyType = 'GENERIC', phase, action = 'idle', altText = name }) => {
  const isElementaryTruePrincipal = visualTheme === 'elementary'
    && (name.includes('真・校長') || aliases.some(alias => alias.includes('真・校長')));
  if (isElementaryTruePrincipal) {
    return (
      <div className={`relative ${className}`} role="img" aria-label={altText}>
        <PixelSprite seed={seed} name="真・校長先生" className="w-full h-full" size={size} />
      </div>
    );
  }

  if (visualTheme === 'elementary' && isLegacySpriteModeEnabled()) {
    return (
      <div className={`relative ${className}`}>
        <PixelSprite seed={seed} name={name} className="w-full h-full" size={size} />
      </div>
    );
  }

  const enemyRef = { name, enemyType, phase };
  const azukiSpritePath = visualTheme === 'high-school' && enemyType === 'AZUKI'
    ? assetUrl(`sprites/high-school/azuki/${action === 'attack' ? 'pounce' : action === 'skill' ? 'howl' : 'idle'}.webp`)
    : null;
  const crowdfundingBossPath = visualTheme === 'high-school' && enemyType === 'DODOMEDESU'
    ? assetUrl('enemy-illustrations/ドドメデス.webp')
    : visualTheme === 'high-school' && enemyType === 'GENZO'
      ? assetUrl('enemy-illustrations/ゲンゾー.webp')
      : null;
  const humanoidPath = getThemedHumanoidEnemySpritePath(enemyRef, visualTheme, action);
  const humanoidIdlePath = action !== 'idle'
    ? getThemedHumanoidEnemySpritePath(enemyRef, visualTheme, 'idle')
    : null;
  const monsterPath = getThemedMonsterEnemySpritePath(enemyRef, visualTheme);
  const imagePaths = crowdfundingBossPath
    ? [crowdfundingBossPath]
    : azukiSpritePath
    ? [azukiSpritePath]
    : humanoidPath
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
        alt={altText}
        className={`absolute inset-0 w-full h-full object-contain ${imageStatus === 'error' ? 'opacity-0 pointer-events-none' : ''}`}
        loading="eager"
        fetchPriority="high"
        decoding="async"
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
