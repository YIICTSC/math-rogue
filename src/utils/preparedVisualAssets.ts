type PreparedVisual = { version: string; url: string };
const prepared = new Map<string, PreparedVisual>();

/** Raw, self-contained visual files retained for the current page. No GPU resources. */
export const preparedVisualUrl = (path: string) => prepared.get(path)?.url;
export const isVisualPrepared = (path: string, version: string) => prepared.get(path)?.version === version;

export function registerPreparedVisual(path: string, version: string, data: Blob) {
  const previous = prepared.get(path);
  if (previous?.version === version) return;
  const url = URL.createObjectURL(data);
  prepared.set(path, { version, url });
  if (previous) URL.revokeObjectURL(previous.url);
}
