import React from 'react';
import { assetUrl } from '../../utils/assetPaths';
import { dominoFaces } from './domino';
import { GOITA_NAMES, GOITA_VALUES, goitaKind } from './goita';
import { peeperRank } from './peeper';
import type { TableFamily } from './catalog';

export const tableArt = (name: string) => assetUrl(`sprites/traditional-games/${name}.webp`);
const dotLayouts: number[][] = [
  [],
  [4],
  [0, 8],
  [0, 4, 8],
  [0, 2, 6, 8],
  [0, 2, 4, 6, 8],
  [0, 2, 3, 5, 6, 8],
  [0, 2, 3, 4, 5, 6, 8],
  [0, 1, 2, 3, 5, 6, 7, 8],
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
];
const pips = (value: number) =>
  value <= 12 ? (
    <span className={value > 9 ? 'tt-pips tt-pips-wide' : 'tt-pips'} aria-hidden="true">
      {Array.from({ length: value > 9 ? 12 : 9 }, (_, i) => (
        <i
          key={i}
          className={
            (
              value > 9
                ? value === 12 || (i !== 5 && (value === 11 || i !== 6))
                : dotLayouts[value].includes(i)
            )
              ? 'tt-dot'
              : undefined
          }
        />
      ))}
    </span>
  ) : (
    <span className="tt-pip-number" aria-hidden="true">
      {value}
    </span>
  );

export const GOITA_EN = ['Pawn', 'Lance', 'Knight', 'Silver', 'Gold', 'Bishop', 'Rook', 'King'];
export const GOITA_KANA = ['し', 'きょう', 'うま', 'ぎん', 'きん', 'かく', 'ひ', 'おう'];
export function pieceLabel(
  tile: number,
  family: Exclude<TableFamily, 'crokinole'>,
  language: string,
) {
  if (family === 'domino') return dominoFaces(tile).join('–');
  if (family === 'peeper') return peeperRank(tile) === 16 ? 'X' : String(peeperRank(tile));
  const kind = goitaKind(tile);
  return (
    (language === 'ENGLISH'
      ? GOITA_EN[kind]
      : language === 'HIRAGANA'
        ? GOITA_KANA[kind]
        : GOITA_NAMES[kind]) +
    ' · ' +
    GOITA_VALUES[kind]
  );
}

export function Piece({
  tile,
  family,
}: {
  tile: number | null;
  family: Exclude<TableFamily, 'crokinole'>;
}) {
  if (tile === null) return <span className="tt-piece tt-goita tt-back" aria-hidden="true" />;
  if (family === 'domino') {
    const [left, right] = dominoFaces(tile);
    return (
      <span className="tt-piece tt-domino" aria-hidden="true">
        {pips(left)}
        {pips(right)}
      </span>
    );
  }
  if (family === 'goita')
    return (
      <span className="tt-piece tt-goita" aria-hidden="true">
        {GOITA_NAMES[goitaKind(tile)]}
      </span>
    );
  const value = peeperRank(tile);
  return (
    <span
      className={`tt-piece tt-peeper ${tile === 0 || value === 16 ? 'tt-red' : ''}`}
      aria-hidden="true"
    >
      {value === 16 ? 'X' : value}
    </span>
  );
}
