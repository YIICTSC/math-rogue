const INVALID_FILE_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

export const sanitizeCardIllustrationName = (name: string): string => {
  const cleaned = (name || '').trim().replace(INVALID_FILE_CHARS, '');
  return cleaned.length > 0 ? cleaned : 'unknown-card';
};

const deriveNameAliases = (name: string): string[] => {
  const trimmed = (name || '').trim();
  if (!trimmed) return [];

  const aliases = new Set<string>();
  const suffixes = ['の種', 'の胞子', 'の豆'];
  suffixes.forEach((suffix) => {
    if (trimmed.endsWith(suffix)) {
      aliases.add(trimmed.slice(0, -suffix.length));
    }
  });
  return Array.from(aliases);
};

const getNameVariants = (value: string): string[] => [
  value,
  value.normalize('NFC'),
  value.normalize('NFD'),
  value.normalize('NFKC'),
  value.normalize('NFKD'),
];

const CARD_ILLUSTRATION_ASSET_VERSION = '20260521-card-art';

export const getCardIllustrationPaths = (id: string, name: string, aliases: string[] = []): string[] => {
  const baseUrl = (import.meta as any).env.BASE_URL || '/';
  const derivedAliases = deriveNameAliases(name);
  const shouldUseSharedSeedArt = derivedAliases.length > 0 || aliases.some((alias) => deriveNameAliases(alias).length > 0);
  const rawCandidates = [name, ...derivedAliases, ...aliases, id, ...(shouldUseSharedSeedArt ? ['SEED_SHARED'] : []), 'unknown-card']
    .filter(Boolean)
    .map((value) => value.trim());
  const candidates = Array.from(
    new Set(
      rawCandidates.flatMap((value) =>
        getNameVariants(value).map((variant) => sanitizeCardIllustrationName(variant))
      )
    )
  );
  const extensions = ['webp', 'png', 'jpg', 'jpeg', 'svg'];
  return candidates.flatMap((fileName) =>
    extensions.map((ext) => `${baseUrl}card-illustrations/${encodeURIComponent(`${fileName}.${ext}`)}?v=${CARD_ILLUSTRATION_ASSET_VERSION}`)
  );
};
