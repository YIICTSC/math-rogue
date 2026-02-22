const INVALID_FILE_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

export const sanitizeCardIllustrationName = (name: string): string => {
  const cleaned = (name || '').trim().replace(INVALID_FILE_CHARS, '');
  return cleaned.length > 0 ? cleaned : 'unknown-card';
};

export const getCardIllustrationPaths = (id: string, name: string, aliases: string[] = []): string[] => {
  const rawCandidates = [id, name, ...aliases].filter(Boolean).map((value) => value.trim());
  const candidates = Array.from(
    new Set(
      rawCandidates.flatMap((value) => [
        sanitizeCardIllustrationName(value),
        sanitizeCardIllustrationName(value.normalize('NFKC')),
      ])
    )
  );
  const extensions = ['png', 'webp', 'jpg', 'jpeg', 'svg'];
  return candidates.flatMap((fileName) =>
    extensions.map((ext) => `/card-illustrations/${encodeURIComponent(`${fileName}.${ext}`)}`)
  );
};
