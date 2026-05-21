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
  const baseUrl = (import.meta as any).env.BASE_URL || '/';
  const allNames = [name, ...aliases].filter(Boolean).map((v) => v.trim());
  const candidates = Array.from(new Set(
    allNames.flatMap((base) => {
      const noBossPrefix = base.replace(BOSS_PREFIX, '');
      return [base, noBossPrefix]
        .flatMap(getNameVariants)
        .map((variant) => sanitizeEnemyIllustrationName(variant));
    })
  ));
  const extensions = ['svg', 'jpg', 'jpeg', 'png', 'webp'];
  return candidates.flatMap((fileName) =>
    extensions.map((ext) => `${baseUrl}enemy-illustrations/${encodeURIComponent(`${fileName}.${ext}`)}`)
  );
};
