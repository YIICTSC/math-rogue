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

export const getCardIllustrationPaths = (id: string, name: string, aliases: string[] = []): string[] => {
  const baseUrl = (import.meta as any).env.BASE_URL || '/';
  const rawCandidates = [name, ...deriveNameAliases(name), ...aliases, id, 'SEED_SHARED', 'unknown-card']
    .filter(Boolean)
    .map((value) => value.trim());
  const candidates = Array.from(
    new Set(
      rawCandidates.flatMap((value) => [
        sanitizeCardIllustrationName(value),
        sanitizeCardIllustrationName(value.normalize('NFKC')),
      ])
    )
  );
  const extensions = ['webp', 'png', 'jpg', 'jpeg', 'svg'];
  return candidates.flatMap((fileName) =>
    extensions.map((ext) => `${baseUrl}card-illustrations/${encodeURIComponent(`${fileName}.${ext}`)}`)
  );
};
