import { ENEMY_ILLUSTRATION_MANIFEST } from '../data/enemyIllustrationManifest';
import { assetUrl } from './assetPaths';

const INVALID_FILE_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
const BOSS_PREFIX = /^\s*ボス\s*[：:]\s*/;

export const sanitizeEnemyIllustrationName = (name: string): string => {
  const cleaned = (name || '').trim().replace(INVALID_FILE_CHARS, '');
  return cleaned.length > 0 ? cleaned : 'unknown-enemy';
};

const getNameVariants = (value: string): string[] => [
  value,
  value.normalize('NFC'),
  value.normalize('NFD'),
  value.normalize('NFKC'),
  value.normalize('NFKD'),
];

export const getEnemyIllustrationPaths = (name: string, aliases: string[] = []): string[] => {
  const allNames = [name, ...aliases].filter(Boolean).map((v) => v.trim());
  const candidates = Array.from(new Set(
    allNames.flatMap((base) => {
      const noBossPrefix = base.replace(BOSS_PREFIX, '');
      return [base, noBossPrefix]
        .flatMap(getNameVariants)
        .map((variant) => sanitizeEnemyIllustrationName(variant));
    })
  ));
  const resolvedPaths = candidates
    .map((fileName) => ENEMY_ILLUSTRATION_MANIFEST[fileName])
    .filter((fileName): fileName is string => Boolean(fileName))
    .map((fileName) => assetUrl(`enemy-illustrations/${encodeURIComponent(fileName)}`));
  if (resolvedPaths.length > 0) return Array.from(new Set(resolvedPaths));

  // Keep one deterministic fallback for generated or user-provided enemy names.
  const fallbackName = sanitizeEnemyIllustrationName(allNames[0] || name);
  return [assetUrl(`enemy-illustrations/${encodeURIComponent(`${fallbackName}.svg`)}`)];
};
