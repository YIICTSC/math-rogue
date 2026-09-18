import { SHOGI_ADVANCE_CATALOG_051_275 } from './shogiAdvanceCatalog051_275';
import { SHOGI_ADVANCE_CATALOG_276_500 } from './shogiAdvanceCatalog276_500';
import type { ShogiAdvanceCatalogEntry } from './shogiAdvanceCatalogTypes';

export const SHOGI_ADVANCE_CATALOG: ShogiAdvanceCatalogEntry[] = [
  ...SHOGI_ADVANCE_CATALOG_051_275,
  ...SHOGI_ADVANCE_CATALOG_276_500,
];

export const SHOGI_ADVANCE_CATALOG_MAP = new Map(
  SHOGI_ADVANCE_CATALOG.map(entry => [entry.kind, entry] as const),
);
