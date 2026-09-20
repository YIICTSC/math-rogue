import React, { useEffect, useState } from 'react';
import PixelSprite from './PixelSprite';
import { getEnemyIllustrationPaths } from '../utils/enemyIllustration';
import { isLegacySpriteModeEnabled } from '../utils/legacySpriteMode';
import { getThemedHumanoidEnemySpritePath, getThemedMonsterEnemySpritePath, type HighSchoolEnemyAction, type VisualThemeId } from '../data/visualThemes';
import type { CharacterAppearanceMode } from '../types';
import { assetUrl } from '../utils/assetPaths';
import { ENDLESS_BOSSES, getEndlessBossById, getEndlessBossSpritePath } from '../data/endlessMode';

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
  endlessBossId?: string;
  appearanceMode?: CharacterAppearanceMode;
}

const EnemyIllustration: React.FC<EnemyIllustrationProps> = ({ name, seed, aliases = [], className = '', size = 16, visualTheme = 'elementary', enemyType = 'GENERIC', phase, action = 'idle', altText = name, endlessBossId, appearanceMode = 'STANDARD' }) => {
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
  const endlessBoss = enemyType === 'ENDLESS_BOSS'
    ? getEndlessBossById(endlessBossId) || ENDLESS_BOSSES.find((boss) => boss.name === name)
    : undefined;
  const endlessSpritePath = endlessBoss && endlessBoss.floor <= 50 ? getEndlessBossSpritePath(endlessBoss, action, appearanceMode) : null;
  const standardEndlessSpritePath = endlessBoss && endlessBoss.floor <= 50 && appearanceMode === 'VACATION'
    ? getEndlessBossSpritePath(endlessBoss, action, 'STANDARD')
    : null;
  const standardEndlessIdlePath = endlessBoss && endlessBoss.floor <= 50 && appearanceMode === 'VACATION'
    ? getEndlessBossSpritePath(endlessBoss, 'idle', 'STANDARD')
    : null;
  const azukiSpritePath = visualTheme === 'high-school' && enemyType === 'AZUKI'
    ? assetUrl(appearanceMode === 'VACATION'
      ? `sprites/high-school/vacation-bosses/azuki-${action === 'attack' ? 'pounce' : action === 'skill' ? 'howl' : 'idle'}.webp`
      : `sprites/high-school/azuki/${action === 'attack' ? 'pounce' : action === 'skill' ? 'howl' : 'idle'}.webp`)
    : null;
  const crowdfundingBossPath = visualTheme === 'high-school' && enemyType === 'DODOMEDESU'
    ? assetUrl(appearanceMode === 'VACATION' ? 'sprites/high-school/vacation-bosses/dodomedesu.webp' : 'enemy-illustrations/ドドメデス.webp')
    : visualTheme === 'high-school' && enemyType === 'GENZO'
      ? assetUrl(appearanceMode === 'VACATION' ? 'sprites/high-school/vacation-bosses/genzo.webp' : 'enemy-illustrations/ゲンゾー.webp')
      : null;
  const humanoidPath = getThemedHumanoidEnemySpritePath(enemyRef, visualTheme, action, appearanceMode);
  const standardHumanoidPath = appearanceMode === 'VACATION'
    ? getThemedHumanoidEnemySpritePath(enemyRef, visualTheme, action, 'STANDARD')
    : null;
  const humanoidIdlePath = action !== 'idle'
    ? getThemedHumanoidEnemySpritePath(enemyRef, visualTheme, 'idle', appearanceMode)
    : null;
  const standardHumanoidIdlePath = appearanceMode === 'VACATION' && action !== 'idle'
    ? getThemedHumanoidEnemySpritePath(enemyRef, visualTheme, 'idle', 'STANDARD')
    : null;
  const monsterPath = getThemedMonsterEnemySpritePath(enemyRef, visualTheme, appearanceMode);
  const standardMonsterPath = appearanceMode === 'VACATION'
    ? getThemedMonsterEnemySpritePath(enemyRef, visualTheme, 'STANDARD')
    : null;
  const standardSpecialPath = visualTheme === 'high-school' && enemyType === 'AZUKI'
    ? assetUrl(`sprites/high-school/azuki/${action === 'attack' ? 'pounce' : action === 'skill' ? 'howl' : 'idle'}.webp`)
    : visualTheme === 'high-school' && enemyType === 'DODOMEDESU'
      ? assetUrl('enemy-illustrations/ドドメデス.webp')
      : visualTheme === 'high-school' && enemyType === 'GENZO'
        ? assetUrl('enemy-illustrations/ゲンゾー.webp')
        : null;
  const vacationMajorBossPath = appearanceMode === 'VACATION' && enemyType === 'THE_HEART'
    ? visualTheme === 'magic'
      ? assetUrl(phase === 2 ? 'sprites/magic/vacation-bosses/star-calamity.webp' : 'sprites/magic/vacation-bosses/grand-witch.webp')
      : assetUrl(phase === 2 || name.includes('真・校長') ? 'sprites/high-school/vacation-bosses/true-kocho.webp' : 'sprites/high-school/vacation-bosses/kocho.webp')
    : null;
  const standardMajorBossPath = enemyType === 'THE_HEART'
    ? getThemedHumanoidEnemySpritePath(enemyRef, visualTheme, action, 'STANDARD')
    : null;
  const imagePaths = endlessSpritePath
    ? Array.from(new Set([endlessSpritePath, getEndlessBossSpritePath(endlessBoss!, 'idle', appearanceMode), standardEndlessSpritePath, standardEndlessIdlePath].filter(Boolean) as string[]))
    : vacationMajorBossPath
    ? Array.from(new Set([vacationMajorBossPath, standardMajorBossPath].filter(Boolean) as string[]))
    : crowdfundingBossPath
    ? Array.from(new Set([crowdfundingBossPath, standardSpecialPath].filter(Boolean) as string[]))
    : azukiSpritePath
    ? Array.from(new Set([azukiSpritePath, standardSpecialPath].filter(Boolean) as string[]))
    : humanoidPath
    ? Array.from(new Set([humanoidPath, humanoidIdlePath, standardHumanoidPath, standardHumanoidIdlePath].filter(Boolean) as string[]))
    : monsterPath
    ? Array.from(new Set([monsterPath, standardMonsterPath].filter(Boolean) as string[]))
    : getEnemyIllustrationPaths(name, aliases);
  const [pathIndex, setPathIndex] = useState(0);
  const [imageStatus, setImageStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    setPathIndex(0);
    setImageStatus('loading');
  }, [name, aliases.join('|'), visualTheme, appearanceMode, enemyType, phase, action]);

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
